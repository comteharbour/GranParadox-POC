export default class GlobalRules {

    #totalTicks
    #zPerTick
    #fieldWidth
    #fieldHeight
    #pastSpriteStart
    #pastSpriteDelay
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
    constructor (totalTicks, fieldWidth, fieldHeight, pastSpriteStart, pastSpriteDelay, zPerTick) {
        this.#totalTicks = totalTicks
        this.#zPerTick = zPerTick
        this.#fieldWidth = fieldWidth
        this.#fieldHeight = fieldHeight
        this.#pastSpriteStart = pastSpriteStart
        this.#pastSpriteDelay = pastSpriteDelay
    }

    get totalTicks () { return this.#totalTicks }
    get fieldWidth () { return this.#fieldWidth }
    get fieldHeight () { return this.#fieldHeight }
    get pastSpriteStart () { return this.#pastSpriteStart }
    get pastSpriteDelay () { return this.#pastSpriteDelay }
    get playerMainTimeLineEpoch () { return this.#playerMainTimeLineEpoch }
    set playerMainTimeLineEpoch (epoch) { this.#playerMainTimeLineEpoch = epoch }

    getZAtEpoch (epoch) {
        return epoch * this.#zPerTick
    }
}