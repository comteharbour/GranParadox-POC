import * as THREE from 'three'
import TimeObjectTickData from './timeObjectTickData.js'

export default class TimeObject {
    #scene
    #textureLoader
    #maps
    #rectangle
    #selfTimeLineData = []
    #activeSprite
    #pastSprites = []
    #pastSpriteDelay = 100 // ticks
    #zPerTick = 1


    /**
     * 
     * @param {Scene} scene 
     * @param {TextureLoader} textureLoader 
     * @param {{colorMap: image, alphaMap: image, pastColorMap: image, pastAlphaMap: image}} maps
     * @param {number} width positive integer
     * @param {number} height positive integer
     * @param {{mainTimeLineEpoch: number, position2D: Vector2, speed2D: Vector2, rotation: number, rotationSpeed: number, HP: number, justTeleported: boolean}} tickData
     */
    constructor (scene, textureLoader, width, height, maps, tickData) {
        this.#scene = scene
        this.#textureLoader = textureLoader
        this.#maps = maps
        this.#rectangle = new THREE.PlaneGeometry( width, height )
        this.newData(0, tickData)
        this.#activeSprite = this.#createSprite(maps.colorMap, maps.alphaMap)
        console.log(this.#selfTimeLineData[0])
        this.#setSpriteToEpoch(this.#activeSprite, 0)
        this.#scene.add(this.#activeSprite)
    }

    #setSpriteToEpoch (sprite, selfTimelineEpoch) {
        const data = this.#selfTimeLineData[selfTimelineEpoch]
        sprite.position.x = data.position2D.x
        sprite.position.y = data.position2D.y
        sprite.position.z = data.mainTimeLineEpoch * this.#zPerTick
        sprite.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 1), data.rotation)
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

        const sprite = new THREE.Mesh(this.#rectangle, texture )
        
        return sprite
    }

    #createPastSprite (selfTimelineEpoch) {
        if (selfTimelineEpoch % this.#pastSpriteDelay == 0) {
            const index = selfTimelineEpoch / this.#pastSpriteDelay
            const sprite = this.#createSprite(this.#maps.pastColorMap, this.#maps.pastAlphaMap)
            sprite.renderOrder = 1
            const data = this.#selfTimeLineData[selfTimelineEpoch]
            this.#setSpriteToEpoch(sprite, selfTimelineEpoch)
            this.#pastSprites[index] = sprite
        }
    }

    /**
     * 
     * @param {number} selfTimelineEpoch - measured in ticks
     * @param {{mainTimeLineEpoch: number, position2D: Vector2, speed2D: Vector2, rotation: number, rotationSpeed: number, HP: number, justTeleported: boolean}} data
     * @returns 
     */
    newData (selfTimelineEpoch, data) {
        if (this.#selfTimeLineData.length == 0) {
            this.#selfTimeLineData[0] = new TimeObjectTickData(data)
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
        this.#selfTimeLineData[selfTimelineEpoch] = new TimeObjectTickData(newMainTimeLineEpoch, newData)
    }
}