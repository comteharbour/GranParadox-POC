import { Vector2 } from "three"

export default class TimeSpriteTickData {
    #mainTimeLineEpoch
    #position2D
    #speed2D
    #rotation
    #rotationSpeed
    #HP
    #justTeleported

    constructor (mainTimeLineEpoch = 0, position2D = new Vector2(), speed2D = new Vector2(), rotation = 0, rotationSpeed = 0, HP = 1) {
        this.#errorMainTimeLineEpoch(mainTimeLineEpoch)
        this.#errorPosition2D(position2D)
        this.#errorSpeed2D(speed2D)
        this.#errorRotation(rotation)
        this.#errorRotationSpeed(rotationSpeed)
        this.#errorHP(HP)
        this.#position2D = position2D
        this.#mainTimeLineEpoch = mainTimeLineEpoch
        this.#rotation = rotation
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