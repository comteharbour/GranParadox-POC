import { Vector2 } from "three"

export default class TimeSpriteTickData {
    #mainTimeLineEpoch
    #position2D
    #speed2D
    #rotation
    #rotationSpeed
    #HP
    #justTeleported

    /**
     * 
     * @param {{mainTimeLineEpoch: number, position2D: Vector2, speed2D: Vector2, rotation: number, rotationSpeed: number, HP: number, justTeleported: boolean}} data - All the supported data in TimeSpriteTickData
     */
    constructor (data) {
        // set default values
        const mainTimeLineEpoch = data.mainTimeLineEpoch ? data.mainTimeLineEpoch : 0
        const position2D = data.position2D ? data.position2D : new Vector2()
        const speed2D = data.speed2D ? data.speed2D : new Vector2()
        const rotation = data.rotation ? data.rotation : 0
        const rotationSpeed = data.rotationSpeed ? data.rotationSpeed : 0
        const HP = data.HP ? data.HP : 1

        // check validity
        this.#errorMainTimeLineEpoch(mainTimeLineEpoch)
        this.#errorPosition2D(position2D)
        this.#errorSpeed2D(speed2D)
        this.#errorRotation(rotation)
        this.#errorRotationSpeed(rotationSpeed)
        this.#errorHP(HP)

        // initialize values
        this.#mainTimeLineEpoch = mainTimeLineEpoch
        this.#position2D = position2D
        this.#speed2D = speed2D
        this.#rotation = rotation
        this.#rotationSpeed = rotationSpeed
        this.#HP = HP
        this.#justTeleported = false
    }

    get mainTimeLineEpoch() {
        return this.#mainTimeLineEpoch
    }

    #errorMainTimeLineEpoch(integer) {
        if (typeof integer == Number && integer.isInteger() && integer >= 0) throw new Error('mainTimeLineEpoch must be a positive integer')
    }

    set mainTimeLineEpoch(integer) {
        this.#errorMainTimeLineEpoch(integer)
        this.#mainTimeLineEpoch = integer
    }

    get position2D() {
        return this.#position2D
    }

    #errorPosition2D(vector2) {
        if (typeof vector2 != Vector2) throw new Error('position2D must be of type three.Vector2')
    }

    set position2D(vector2) {
        this.#errorPosition2D(vector2)
        this.#position2D = vector2
    }

    get speed2D() {
        return this.#speed2D
    }

    #errorSpeed2D(vector2) {
        if (typeof vector2 != Vector2) throw new Error('speed2D must be of type three.Vector2')
    }

    set speed2D(vector2) {
        this.#errorSpeed2D(vector2)
        this.#speed2D = vector2
    }

    get rotation() {
        return this.#rotation
    }

    #errorRotation(number) {
        if (typeof number == Number) throw new Error('rotation must be a number')
    }
    set rotation(number) {
        this.#errorRotation(number)
        this.#rotation = number
    }

    get rotationSpeed() {
        return this.#rotationSpeed
    }

    #errorRotationSpeed(number) {
        if (typeof number == Number) throw new Error('rotationSpeed must be a number')
    }
    set rotationSpeed(number) {
        this.#errorRotationSpeed(number)
        this.#rotationSpeed = number
    }

    get justTeleported() {
        return !!this.#justTeleported
    }

    #errorJustTeleported(boolean) {
        if (typeof boolean == Boolean) throw new Error('justTeleported must be a boolean')
    }

    set justTeleported(boolean) {
        this.#errorJustTeleported(boolean)
        this.#justTeleported = boolean
    }

    get HP() {
        return this.#HP
    }

    #errorHP(number) {
        if (typeof number == Number) throw new Error('HP must be a number')
    }
    set HP(number) {
        this.#errorHP(number)
        this.#HP = number
    }
}