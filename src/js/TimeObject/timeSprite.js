import * as THREE from 'three'

export default class TimeSprite {
    #scene
    #textureLoader
    #globalRules
    #maps
    #rectangle
    #selfTimeLineData = []
    #activeSprite
    #pastSprites = []
    #pastSpriteDelay = 100 // ticks
    #segments = []


    /**
     * 
     * @param {Scene} scene 
     * @param {TextureLoader} textureLoader 
     * @param {{colorMap: image, alphaMap: image, pastColorMap: image, pastAlphaMap: image}} maps
     * @param {{zPerTick}} globalRules
     * @param {number} width positive integer
     * @param {number} height positive integer
     * @param {{mainTimeLineEpoch: number, position2D: Vector2, rotation: number}} tickData
     */
    constructor (scene, textureLoader, globalRules, width, height, maps, tickData) {
        this.#scene = scene
        this.#textureLoader = textureLoader
        this.#globalRules = globalRules
        this.#maps = maps
        this.#rectangle = new THREE.PlaneGeometry(height, width)
        this.#activeSprite = this.#createSprite(maps.colorMap, maps.alphaMap)
        this.#activeSprite.renderOrder = 1000
        const usedTickData = {
            mainTimeLineEpoch: 0,
            position2D: new THREE.Vector2(),
            rotation: 0,
            ...tickData
        }
        this.newData(usedTickData, 0)
    }

    /**
     * 
     * @param {number} selfTimelineEpoch integer >= 0 or -1 for latest epoch
     */
    // setActiveAt (selfTimelineEpoch) {
    //     if (selfTimelineEpoch == -1) this.#setSpriteToSelfEpoch(this.#activeSprite, sel)
    // }

    /**
     * 
     * @param {{mainTimeLineEpoch: number, position2D: Vector2, speed2D: Vector2, rotation: number, rotationSpeed: number, HP: number, continuumIndex: number}} data
     * @param {number} selfTimelineEpoch - measured in ticks
     * @returns 
     */
    newData (tickData, selfTimelineEpoch) {
        this.#handleNewData(tickData, selfTimelineEpoch)
        this.#handlePastSprite(selfTimelineEpoch)
        this.#handleLine(selfTimelineEpoch)
    }

    #handleNewData (tickData, selfTimelineEpoch) {
        const latestSelfEpoch = this.#selfTimeLineData.length
        if (selfTimelineEpoch == latestSelfEpoch) {
            this.#selfTimeLineData.push(tickData)
            this.#setSpriteToSelfEpoch(this.#activeSprite, latestSelfEpoch)
            return
        }

        if (selfTimelineEpoch < latestSelfEpoch) {
            const oldTickData = this.#selfTimeLineData[selfTimelineEpoch]
            this.#selfTimeLineData[selfTimelineEpoch] = { ...oldTickData, ...tickData }
            return
        }
    }

    // #extrapolateLastTickData (data, selfTimelineEpoch) {
    //     const lastData = this.#selfTimeLineData[selfTimelineEpoch - 1]
    //     const mainTimeLineEpoch = !!data.mainTimeLineEpoch ? data.mainTimeLineEpoch : lastData.mainTimeLineEpoch + 1
    //     const position2D = !!data.position2D ? data.position2D : lastData.position2D + lastData.speed2D
    //     const speed2D = !!data.speed2D ? data.speed2D : lastData.speed2D
    //     const rotation = !!data.rotation ? data.rotation : lastData.rotation + lastData.rotationSpeed
    //     const rotationSpeed = !!data.rotationSpeed ? data.rotationSpeed : lastData.rotationSpeed
    //     const HP = !!data.HP ? data.HP : lastData.HP
    //     const justTeleported = !!data.justTeleported

    //     const newData = { mainTimeLineEpoch, position2D, speed2D, rotation, rotationSpeed, HP, justTeleported}
    //     this.#selfTimeLineData[selfTimelineEpoch] = new TimeSpriteTickData(newMainTimeLineEpoch, newData)
    // }

    #handlePastSprite(selfTimelineEpoch) {
        if (selfTimelineEpoch % this.#pastSpriteDelay != 0) return
        const index = selfTimelineEpoch / this.#pastSpriteDelay
        let sprite = this.#pastSprites[index]
        if (!sprite) {
            sprite = this.#createSprite(this.#maps.pastColorMap, this.#maps.pastAlphaMap)
            sprite.renderOrder = 0
            this.#pastSprites[index] = sprite
        }
        this.#setSpriteToSelfEpoch(sprite, selfTimelineEpoch)
    }

    /**
     * 
     * @param {image} colorMap
     * @param {image} alphaMap 
     * @returns {THREE.Mesh} sprite
     */
    #createSprite (colorMap, alphaMap) {
        const texture = new THREE.MeshBasicMaterial()
        texture.transparent = true
        texture.side = THREE.DoubleSide

        const colorTexture = this.#textureLoader.load(colorMap)
        colorTexture.colorSpace = THREE.SRGBColorSpace
        texture.map = colorTexture

        const alphaTexture = this.#textureLoader.load(alphaMap)
        alphaTexture.colorSpace = THREE.SRGBColorSpace
        texture.alphaMap = alphaTexture

        const sprite = new THREE.Mesh(this.#rectangle, texture)
        this.#scene.add(sprite)
        
        return sprite
    }

    #setSpriteToSelfEpoch (sprite, selfTimelineEpoch) {
        const tickData = this.#selfTimeLineData[selfTimelineEpoch]
        sprite.position.copy(this.#getPointInSpace(tickData))
        sprite.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 1), tickData.rotation)
    }

    #handleLine (selfTimelineEpoch) {
        if (!this.#hasJustTeleported(selfTimelineEpoch)) {
            const lastData = this.#selfTimeLineData[selfTimelineEpoch - 1]
            const lastPoint = this.#getPointInSpace(lastData)
            const data = this.#selfTimeLineData[selfTimelineEpoch]
            const point = this.#getPointInSpace(data)
            this.#createSegment(lastPoint, point, selfTimelineEpoch)
        }
    }

    #createSegment (lastPoint, point, selfTimelineEpoch) {
        const material = new THREE.LineBasicMaterial({ color: 0x0000ff })
        const geometry = new THREE.BufferGeometry().setFromPoints([lastPoint, point])
        this.#segments[selfTimelineEpoch] = new THREE.Line( geometry, material )
        this.#scene.add(this.#segments[selfTimelineEpoch])
    }

    #hasJustTeleported (selfTimelineEpoch) {
        if (selfTimelineEpoch == 0) return true
        const mainTimeLineEpoch = this.#selfTimeLineData[selfTimelineEpoch].mainTimeLineEpoch
        const lastMainTimeLineEpoch = this.#selfTimeLineData[selfTimelineEpoch - 1].mainTimeLineEpoch
        const hasJustTeleported = mainTimeLineEpoch != lastMainTimeLineEpoch + 1
        return hasJustTeleported
    }

    _vector3From(vector2, epoch) {
        return new THREE.Vector3(
            vector2.x,
            vector2.y,
            this.#globalRules.getZAtEpoch(epoch)
        )
    }
    
    #getPointInSpace(tickData) {
        return this._vector3From (tickData.position2D, tickData.mainTimeLineEpoch)
    }

    get selfTimeLineData() {
        return this.#selfTimeLineData
    }
}