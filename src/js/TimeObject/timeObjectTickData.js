import { Vector2 } from "three"

export default class TimeObjectTickData {
    #mainTimeLineEpoch
    #position2D
    #speed2D
    #rotation
    #rotationSpeed
    #HP
    #justTeleported

    /**
     * 
     * @param {{mainTimeLineEpoch: number, position2D: Vector2, speed2D: Vector2, rotation: number, rotationSpeed: number, HP: number, justTeleported: boolean}} data - All the supported data in TimeObjectTickData
     */
    constructor (data) {
        // set default values
        const mainTimeLineEpoch = data.mainTimeLineEpoch ? data.mainTimeLineEpoch : 0
        const position2D = data.position2D ? data.position2D : new Vector2()
        const speed2D = data.speed2D ? data.speed2D : new Vector2()
        const rotation = data.rotation ? data.rotation : 0
        const rotationSpeed = data.rotationSpeed ? data.rotationSpeed : 0
        const HP = data.HP ? data.HP : 1

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

    set mainTimeLineEpoch(integer) {
        this.#mainTimeLineEpoch = integer
    }

    get position2D() {
        return this.#position2D
    }

    set position2D(vector2) {
        this.#position2D = vector2
    }

    get speed2D() {
        return this.#speed2D
    }

    set speed2D(vector2) {
        this.#speed2D = vector2
    }

    get rotation() {
        return this.#rotation
    }

    set rotation(number) {
        this.#rotation = number
    }

    get rotationSpeed() {
        return this.#rotationSpeed
    }
    
    set rotationSpeed(number) {
        this.#rotationSpeed = number
    }

    get justTeleported() {
        return !!this.#justTeleported
    }

    set justTeleported(boolean) {
        this.#justTeleported = boolean
    }

    get HP() {
        return this.#HP
    }

    set HP(number) {
        this.#HP = number
    }
}