import { Vector2 } from 'three'
import TimeSpriteTickData from './timeSpriteTickData.js'

export default class TimeSprite {
    #selfTimeLineData = []
    get selfTimeLineData () {
        return this.#selfTimeLineData
    }

    /**
     * 
     * @param {{mainTimeLineEpoch: number, position2D: Vector2, speed2D: Vector2, rotation: number, rotationSpeed: number, HP: number, justTeleported: boolean}} tickData
     */
    constructor (tickData) {
        this.newData(0, tickData)
    }

    /**
     * 
     * @param {number} selfTimelineEpoch - measured in ticks
     * @param {{mainTimeLineEpoch: number, position2D: Vector2, speed2D: Vector2, rotation: number, rotationSpeed: number, HP: number, justTeleported: boolean}} data
     * @returns 
     */
    newData (selfTimelineEpoch, data) {
        if (this.#selfTimeLineData.length == 0) {
            this.#selfTimeLineData[0] = new TimeSpriteTickData(data)
            return
        }

        const latestSelfEpoch = this.#selfTimeLineData.length
        if (!selfTimelineEpoch || selfTimelineEpoch == latestSelfEpoch) {
            this.#extrapolateLastTickData(selfTimelineEpoch, data)
            return
        }

        if (selfTimelineEpoch < latestSelfEpoch && selfTimelineEpoch >= 0) {
            this.#updateTickData(selfTimelineEpoch, data)
            return
        }
    }

    #updateTickData (selfTimelineEpoch, data) {
        const oldData = this.#selfTimeLineData[selfTimelineEpoch]
        if (!!data.mainTimeLineEpoch) oldData.mainTimeLineEpoch = mainTimeLineEpoch
        if (!!data.position2D) oldData.position2D = position2D
        if (!!data.speed2D) oldData.speed2D = speed2D
        if (!!data.rotation) oldData.rotation = rotation
        if (!!data.HP) oldData.HP = HP
        if (data.justTeleported) oldData.justTeleported = true
    }

    #extrapolateLastTickData (selfTimelineEpoch, data) {
        const lastData = this.#selfTimeLineData[selfTimelineEpoch - 1]
        const mainTimeLineEpoch = !!data.mainTimeLineEpoch ? data.mainTimeLineEpoch : lastData.mainTimeLineEpoch + 1
        const position2D = !!data.position2D ? data.position2D : lastData.position2D + lastData.speed2D
        const speed2D = !!data.speed2D ? data.speed2D : lastData.speed2D
        const rotation = !!data.rotation ? data.rotation : lastData.rotation + lastData.rotationSpeed
        const rotationSpeed = !!data.rotationSpeed ? data.rotationSpeed : lastData.rotationSpeed
        const HP = !!data.HP ? data.HP : lastData.HP
        const justTeleported = !!data.justTeleported

        const newData = { mainTimeLineEpoch, position2D, speed2D, rotation, rotationSpeed, HP, justTeleported}
        this.#selfTimeLineData[selfTimelineEpoch] = new TimeSpriteTickData(newMainTimeLineEpoch, newData)
    }
}