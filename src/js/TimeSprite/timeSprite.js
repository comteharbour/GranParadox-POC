import TimeSpriteTickData from './timeSpriteTickData'

export class TimeSprite {
    #selfTimeLineData = []

    constructor (
        mainTimeLineEpoch = 0,
        position2D = new Vector2(),
        speed2D = new Vector2(),
        rotation = 0,
        rotationSpeed = 0,
        HP = 1
    ) {
        this.newData(0, mainTimeLineEpoch, position2D, speed2D, rotation, rotationSpeed, HP)
    }

    newData (
        selfTimelineEpoch = undefined,
        mainTimeLineEpoch = undefined,
        position2D = undefined,
        speed2D = undefined,
        rotation = undefined,
        rotationSpeed = undefined,
        HP = undefined,
        justTeleported = false
    ) {
        if (this.#selfTimeLineData.length == 0) {
            this.#selfTimeLineData[0] = new TimeSpriteTickData(mainTimeLineEpoch, position2D, speed2D, rotation, rotationSpeed, HP, justTeleported)
            return
        }

        const latestSelfEpoch = this.#selfTimeLineData.length
        if (!selfTimelineEpoch || selfTimelineEpoch == latestSelfEpoch) {
            this.#extrapolateLastTickData(selfTimelineEpoch, mainTimeLineEpoch, position2D, speed2D, rotation, rotationSpeed, HP, justTeleported)
            return
        }

        if (selfTimelineEpoch < latestSelfEpoch && selfTimelineEpoch >= 0) {
            this.#updateTickData(selfTimelineEpoch, mainTimeLineEpoch, position2D, speed2D, rotation, rotationSpeed, HP, justTeleported)
            return
        }
    }

    #updateTickData (
        selfTimelineEpoch,
        mainTimeLineEpoch = undefined,
        position2D = undefined,
        speed2D = undefined,
        rotation = undefined,
        HP = undefined,
        justTeleported = false
    ) {
        const data = this.#selfTimeLineData[selfTimelineEpoch]
        if (!!mainTimeLineEpoch) data.mainTimeLineEpoch = mainTimeLineEpoch
        if (!!position2D) data.position2D = position2D
        if (!!speed2D) data.speed2D = speed2D
        if (!!rotation) data.rotation = rotation
        if (!!HP) data.HP = HP
        if (justTeleported) data.justTeleported = true
    }

    #extrapolateLastTickData (selfTimelineEpoch,
        mainTimeLineEpoch = undefined,
        position2D = undefined,
        speed2D = undefined,
        rotation = undefined,
        rotationSpeed = undefined,
        HP = undefined,
        justTeleported = false
    ) {
        const lastData = this.#selfTimeLineData[selfTimelineEpoch - 1]
        const newMainTimeLineEpoch = !!mainTimeLineEpoch ? mainTimeLineEpoch : lastData.mainTimeLineEpoch + 1
        const newPosition2D = !!position2D ? position2D : lastData.position2D + lastData.speed2D
        const newSpeed2D = !!speed2D ? speed2D : lastData.speed2D
        const newRotation = !!rotation ? rotation : lastData.rotation + lastData.rotationSpeed
        const newRotationSpeed = !!rotationSpeed ? rotationSpeed : lastData.rotationSpeed
        const newHP = !!HP ? HP : lastData.HP

        const newData = new TimeSpriteTickData(newMainTimeLineEpoch, newPosition2D, newSpeed2D, newRotation, newRotationSpeed, newHP, justTeleported)
        this.#selfTimeLineData[selfTimelineEpoch] = newData
    }
}