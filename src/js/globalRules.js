import * as THREE from 'three'

export default class GlobalRules {

    #totalTicks
    #zPerTick
    #fieldWidth
    #fieldHeight
    #pastSpriteStart
    #pastSpriteDelay
    #pastSpriteFactor
    #playerMainTimeLineEpoch

    /**
     * 
     * @param {number} totalTicks 
     * @param {number} fieldWidth 
     * @param {number} fieldHeight 
     * @param {number} pastSpriteStart 
     * @param {number} pastSpriteDelay 
     * @param {number} zPerTick 
     */
    constructor ({ totalTicks, fieldWidth, fieldHeight, pastSpriteStart, pastSpriteDelay, pastSpriteFactor, zPerTick }) {
        this.#totalTicks = totalTicks
        this.#zPerTick = zPerTick
        this.#fieldWidth = fieldWidth
        this.#fieldHeight = fieldHeight
        this.#pastSpriteStart = pastSpriteStart
        this.#pastSpriteDelay = pastSpriteDelay
        this.#pastSpriteFactor = pastSpriteFactor
    }

    get totalTicks () { return this.#totalTicks }
    get fieldWidth () { return this.#fieldWidth }
    get fieldHeight () { return this.#fieldHeight }
    get pastSpriteStart () { return this.#pastSpriteStart }
    get pastSpriteDelay () { return this.#pastSpriteDelay }
    get pastSpriteFactor () { return this.#pastSpriteFactor }
    get playerMainTimeLineEpoch () { return this.#playerMainTimeLineEpoch }
    set playerMainTimeLineEpoch (epoch) { this.#playerMainTimeLineEpoch = epoch }

    getZAtEpoch (epoch) {
        return epoch * this.#zPerTick
    }

    vector3From(vector2, epoch) {
        return new THREE.Vector3(
            vector2.x,
            vector2.y,
            this.getZAtEpoch(epoch)
        )
    }
}