import * as THREE from 'three'
import TimeSprite from "./timeSprite"

export default class TimeObject extends TimeSprite {

    #spaceSpeeds = []
    #hitBox2D
    #orientedHitBoxes = []
    #temporarySpaceTimeMovement
    #translationThrust = new THREE.Vector2()
    #rotationThrust = 0

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
        this.#setTemporarySpaceTimePositionAndPropagation()
        this.#createHitBox()
    }

    tick() {
        this.#setTemporarySpaceTimePositionAndPropagation()

        // this.accelerate( new THREE.Vector2(0.01, 0.01), Math.PI / 1000 )
        this.#changeSpeed()
        this.#changePosition()

        this.#createHitBox()

        this.#handleBorder()

        this.#setNewMovementValues()

    }

    #setTemporarySpaceTimePositionAndPropagation () {
        const lastPropagationSelfTimeLineEpoch = super.propagationSelfTimeLineEpoch
        const lastSpaceTimePosition = super.selfTimeLineSpaceTimePosition[lastPropagationSelfTimeLineEpoch]
        const spaceSpeed = this.#spaceSpeeds[lastPropagationSelfTimeLineEpoch]
        const propagationSelfTimeLineEpoch = lastPropagationSelfTimeLineEpoch + 1
        this.#temporarySpaceTimeMovement = {
            spaceTimePosition: {
                ...lastSpaceTimePosition,
                position2D: lastSpaceTimePosition.position2D.clone(),
            },
            spaceSpeed: {
                ...spaceSpeed,
                speed2D: spaceSpeed.speed2D.clone()
            },
            propagationSelfTimeLineEpoch
        }
    }

    /**
     * 
     * @param {THREE.Vector2} translationTrust 
     * @param {number} rotationThrust 
     */
    accelerate(translationThrust, rotationThrust) {
        this.#translationThrust = translationThrust
        this.#rotationThrust = rotationThrust
    }

    #changeSpeed () {
        this.#temporarySpaceTimeMovement.spaceSpeed.speed2D.add(this.#translationThrust)
        this.#temporarySpaceTimeMovement.spaceSpeed.rotationSpeed += this.#rotationThrust
    }

    #changePosition () {
        this.#temporarySpaceTimeMovement.spaceTimePosition.position2D.add(this.#temporarySpaceTimeMovement.spaceSpeed.speed2D)
        this.#temporarySpaceTimeMovement.spaceTimePosition.rotation += this.#temporarySpaceTimeMovement.spaceSpeed.rotationSpeed
    }

    #handleBorder () {
        const isOut = this.#isOutOfBounds()
        if (isOut.x || isOut.y) {
            this.#bounce(isOut)
        }
    }

    #isOutOfBounds () {
        const spaceTimePosition = this.#temporarySpaceTimeMovement.spaceTimePosition
        const xPosition = spaceTimePosition.position2D.x
        const xBoundary = super.globalRules.fieldWidth / 2
        const yPosition = spaceTimePosition.position2D.y
        const yBoundary = super.globalRules.fieldHeight / 2
        const x = xPosition <= -xBoundary || xPosition >= xBoundary
        const y = yPosition <= -yBoundary || yPosition >= yBoundary
        return { x, y }
    }

    #bounce (isOut) {
        let xSpeed = this.#temporarySpaceTimeMovement.spaceSpeed.speed2D.x
        let ySpeed = this.#temporarySpaceTimeMovement.spaceSpeed.speed2D.y
        let xPosition = this.#temporarySpaceTimeMovement.spaceTimePosition.position2D.x
        let yPosition = this.#temporarySpaceTimeMovement.spaceTimePosition.position2D.y

        if ( isOut.x ) {
            xSpeed = -xSpeed
            xPosition += xSpeed
            this.#temporarySpaceTimeMovement.spaceSpeed.speed2D.setX(xSpeed)
            this.#temporarySpaceTimeMovement.spaceTimePosition.position2D.setX(xPosition)
        }

        if ( isOut.y ) {
            ySpeed = -ySpeed
            yPosition += ySpeed
            this.#temporarySpaceTimeMovement.spaceSpeed.speed2D.setY(ySpeed)
            this.#temporarySpaceTimeMovement.spaceTimePosition.position2D.setY(yPosition)
        }
    }

    #createHitBox() {
        const spaceTimePosition = this.#temporarySpaceTimeMovement.spaceTimePosition
        const propagationSelfTimeLineEpoch = this.#temporarySpaceTimeMovement.propagationSelfTimeLineEpoch
        this.#orientedHitBoxes[propagationSelfTimeLineEpoch] = this.#hitBox2D.map(vertex => {
            const rotatedVertex = vertex.clone().rotateAround(new THREE.Vector2(), spaceTimePosition.rotation)
            const translatedRotatedVertex = rotatedVertex.add(spaceTimePosition.position2D)
            return translatedRotatedVertex
        })
    }

    #setNewMovementValues () {
        const propagationSelfTimeLineEpoch = this.#temporarySpaceTimeMovement.propagationSelfTimeLineEpoch
        this.#spaceSpeeds[propagationSelfTimeLineEpoch] = this.#temporarySpaceTimeMovement.spaceSpeed
        super.newSpaceTimePosition(this.#temporarySpaceTimeMovement.spaceTimePosition, propagationSelfTimeLineEpoch)
        super.propagationSelfTimeLineEpoch = propagationSelfTimeLineEpoch
    }

    #eraseTemporarySpaceTimeMovement () {}
}