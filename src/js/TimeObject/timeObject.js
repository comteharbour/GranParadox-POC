import * as THREE from 'three'
import TimeSprite from "./timeSprite"

export default class TimeObject extends TimeSprite {

    #hitBox2D
    #orientedHitBoxes = []

    /**
     * 
     * @param {Scene} scene 
     * @param {TextureLoader} textureLoader 
     * @param {{colorMap: image, alphaMap: image, pastColorMap: image, pastAlphaMap: image}} maps
     * @param {{zPerTick}} globalRules
     * @param {number} width positive integer
     * @param {number} height positive integer
     * @param {{mainTimeLineEpoch: number, position2D: Vector2, speed2D: Vector2, rotation: number, rotationSpeed: number, justTeleported: boolean}} tickData
     */
    constructor (scene, textureLoader, globalRules, width, height, maps, tickData, hitBox2D) {
        super(scene, textureLoader, globalRules, width, height, maps, tickData)
        this.#hitBox2D = hitBox2D.map(vertex => vertex.clone())
        this.#createHitBoxAt(0)
    }

    #createHitBoxAt(epoch) {
        const data = super.selfTimeLineData[epoch]
        this.#orientedHitBoxes[epoch] = this.#hitBox2D.map(vertex => {
            const rotatedVertex = vertex.clone().rotateAround(new THREE.Vector2(), data.rotation)
            const translatedRotatedVertex = rotatedVertex.add(data.position2D)
            return translatedRotatedVertex
        })
    }

    tick() {
        // handle teleportation sprites and active sprite first
    }
}