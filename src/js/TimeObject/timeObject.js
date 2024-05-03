import * as THREE from 'three'
import TimeSprite from "./timeSprite"

export default class TimeObject extends TimeSprite {

    #spaceSpeeds = []
    #hitBox2D
    #orientedHitBoxes = []

    /**
     * 
     * @param {Scene} scene 
     * @param {TextureLoader} textureLoader 
     * @param {{colorMap: image, alphaMap: image}} maps
     * @param {{pastSpriteDelay: number, pastSpriteStart: number, getZAtEpoch: function}} globalRules
     * @param {number} width positive integer
     * @param {number} height positive integer
     * @param {{mainTimeLineEpoch: number, position2D: Vector2, rotation: number}} initialSpaceTimePosition
     * @param {{speed2D: THREE.Vector2, rotationSpeed: THREE.Vector2}} initialSpaceSpeed
     * @param {[THREE.Vector2]} hitBox2D 
     */
    constructor (scene, textureLoader, globalRules, width, height, maps, initialSpaceTimePosition, initialSpaceSpeed, hitBox2D) {
        super(scene, textureLoader, globalRules, width, height, maps, initialSpaceTimePosition)
        this.#spaceSpeeds[0] = {speed2D: new THREE.Vector2(), rotationSpeed: 0, ...initialSpaceSpeed}
        this.#hitBox2D = hitBox2D.map(vertex => vertex.clone())
        this.#createHitBoxAt(0)
    }

    #createHitBoxAt(epoch) {
        const data = super.selfTimeLineSpaceTimePosition[epoch]
        this.#orientedHitBoxes[epoch] = this.#hitBox2D.map(vertex => {
            const rotatedVertex = vertex.clone().rotateAround(new THREE.Vector2(), data.rotation)
            const translatedRotatedVertex = rotatedVertex.add(data.position2D)
            return translatedRotatedVertex
        })
    }

    tick() {
        this.#accelerate( new THREE.Vector2(0.01, 0.01), Math.PI / 1000 )
        this.#propagate()
    }

    /**
     * 
     * @param {THREE.Vector2} translationTrust 
     * @param {number} rotationThrust 
     */
    #accelerate (translationThrust, rotationThrust) {
        const lastPropagationSelfTimeLineEpoch = super.propagationSelfTimeLineEpoch
        const newPropagationSelfTimeLineEpoch = lastPropagationSelfTimeLineEpoch + 1
        const lastSpaceSpeed = this.#spaceSpeeds[lastPropagationSelfTimeLineEpoch]
        const newSpaceSpeed = {
            speed2D: lastSpaceSpeed.speed2D.clone().add(translationThrust),
            rotationSpeed: lastSpaceSpeed.rotationSpeed + rotationThrust
        }
        this.#spaceSpeeds[newPropagationSelfTimeLineEpoch] = newSpaceSpeed
    }

    #propagate () {
        const lastPropagationSelfTimeLineEpoch = super.propagationSelfTimeLineEpoch
        const lastSpaceTimePosition = super.selfTimeLineSpaceTimePosition[lastPropagationSelfTimeLineEpoch]
        const newPropagationSelfTimeLineEpoch = lastPropagationSelfTimeLineEpoch + 1
        const newSpaceTimePosition = {
            mainTimeLineEpoch : lastSpaceTimePosition.mainTimeLineEpoch + 1,
            position2D : lastSpaceTimePosition.position2D.clone().add(this.#spaceSpeeds[newPropagationSelfTimeLineEpoch].speed2D),
            rotation : lastSpaceTimePosition.rotation + this.#spaceSpeeds[newPropagationSelfTimeLineEpoch].rotationSpeed
        }
        super.newSpaceTimePosition(newSpaceTimePosition, newPropagationSelfTimeLineEpoch)
        super.propagationSelfTimeLineEpoch = newPropagationSelfTimeLineEpoch
    }
}