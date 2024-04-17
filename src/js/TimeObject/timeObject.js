import * as THREE from 'three'
import TimeObjectTickData from './timeObjectTickData.js'

export default class TimeObject {
    #scene
    #textureLoader
    #globalRules
    #maps
    #rectangle
    #selfTimeLineData = []
    #activeSprite
    #pastSprites = []
    #pastSpriteDelay = 100 // ticks
    #line


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
    constructor (scene, textureLoader, globalRules, width, height, maps, tickData) {
        this.#scene = scene
        this.#textureLoader = textureLoader
        this.#globalRules = globalRules
        this.#maps = maps
        this.#rectangle = new THREE.PlaneGeometry(height, width)
        this.#activeSprite = this.#createSprite(maps.colorMap, maps.alphaMap)
        this.#activeSprite.renderOrder = 1000
        this.#createLine()
        this.newData(tickData)
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
     * @param {{mainTimeLineEpoch: number, position2D: Vector2, speed2D: Vector2, rotation: number, rotationSpeed: number, HP: number, justTeleported: boolean}} data
     * @param {number} selfTimelineEpoch - measured in ticks
     * @returns 
     */
    newData (data, selfTimelineEpoch) {
        const usedSelfEpoch = selfTimelineEpoch === undefined ? this.#selfTimeLineData.length : selfTimelineEpoch
        this.#handleNewData(data, usedSelfEpoch)
        this.#handlePastSprite(usedSelfEpoch)
        this.#handleLine()
    }

    #handleNewData (data, selfTimelineEpoch) {
        if (this.#selfTimeLineData.length == 0) {
            this.#selfTimeLineData[0] = new TimeObjectTickData(data)
            this.#setSpriteToSelfEpoch(this.#activeSprite, 0)
            return
        }

        const latestSelfEpoch = this.#selfTimeLineData.length
        if (selfTimelineEpoch == latestSelfEpoch) {
            this.#appendNewTickData(data, selfTimelineEpoch)
            this.#setSpriteToSelfEpoch(this.#activeSprite, latestSelfEpoch)
            return
        }

        if (selfTimelineEpoch < latestSelfEpoch) {
            this.#updateTickData(data, selfTimelineEpoch)
            return
        }
    }

    #appendNewTickData (data) {
        const latestSelfEpoch = this.#selfTimeLineData.length
        this.#selfTimeLineData[latestSelfEpoch] = new TimeObjectTickData(data, latestSelfEpoch)
    }

    #updateTickData (data, selfTimelineEpoch) {
        const oldData = this.#selfTimeLineData[selfTimelineEpoch]
        if (!!data.mainTimeLineEpoch) oldData.mainTimeLineEpoch = data.mainTimeLineEpoch
        if (!!data.position2D) oldData.position2D = data.position2D
        if (!!data.speed2D) oldData.speed2D = data.speed2D
        if (!!data.rotation) oldData.rotation = data.rotation
        if (!!data.HP) oldData.HP = data.HP
        if (data.justTeleported) oldData.justTeleported = true
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
    //     this.#selfTimeLineData[selfTimelineEpoch] = new TimeObjectTickData(newMainTimeLineEpoch, newData)
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
        const data = this.#selfTimeLineData[selfTimelineEpoch]
        sprite.position.copy(this.#getPointInSpace(data))
        sprite.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 1), data.rotation)
    }

    #createLine () {
        const material = new THREE.LineBasicMaterial({ color: 0x0000ff })
        const geometry = new THREE.BufferGeometry()
        this.#line = new THREE.Line( geometry, material )
        this.#scene.add(this.#line)
    }

    #handleLine () {
        // TODO: optimize
        const points = this.#selfTimeLineData.map(data => this.#getPointInSpace(data))
        this.#line.geometry.setFromPoints( points )
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