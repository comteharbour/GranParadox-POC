import * as THREE from 'three'

export default class TimeSprite {
    #scene
    #textureLoader
    #globalRules
    #maps
    #rectangle
    #selfTimeLineData = []
    #mainTimeLineMapping = []
    #activeSprite
    #activeSelfTimeLineEpoch = null
    #continuums = []
    #pastSprites = []
    #segments = []

    static #activeSpriteColor = 0xffffff
    static #activeSpriteOpacity = 1
    static #pastSpriteColor = 0x00ffff
    static #pastSpriteOpacity = 0.3
    static #pastSpriteDelay = 123 // ticks
    static #firstContinuumSpriteColor = 0x00ffff
    static #firstContinuumSpriteOpacity = 0.3
    static #lastContinuumSpriteColor = 0x00ffff
    static #lastContinuumSpriteOpacity = 0.3
    static #activeContinuumSpriteColor = 0x000000
    static #activeContinuumSpriteOpacity = 1
    static #lineColor = 0x00ffff
    static #lineOpacity = 0.3

    /**
     * 
     * @param {Scene} scene 
     * @param {TextureLoader} textureLoader 
     * @param {{colorMap: image, alphaMap: image}} maps
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
        this.#activeSprite = this.#createSprite(TimeSprite.#activeSpriteColor, TimeSprite.#activeSpriteOpacity)
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
     * @param {{mainTimeLineEpoch: number, position2D: Vector2, rotation: number}} data
     * @param {number} selfTimelineEpoch - measured in ticks
     */
    newData (tickData, selfTimelineEpoch) {
        this.#handleNewData(tickData, selfTimelineEpoch)
        this.#handleContinuums(tickData, selfTimelineEpoch)
        this.#handlePastSprite(selfTimelineEpoch)
        this.#handleLine(selfTimelineEpoch)

    }

    setActiveEpoch (selfTimelineEpoch) {
        if (selfTimelineEpoch == null && this.#activeSelfTimeLineEpoch != null) {
            this.#scene.remove(this.#activeSprite)
            return
        }

        if (selfTimelineEpoch != null && this.#activeSelfTimeLineEpoch == null) {
            this.#scene.add(this.#activeSprite)
        }

        this.#setSpriteToSelfEpoch(this.#activeSprite, selfTimelineEpoch)
        this.#activeSelfTimeLineEpoch = selfTimelineEpoch
    }

    /**
     * 
     * @param {{mainTimeLineEpoch: number, position2D: Vector2, rotation: number}} data
     * @param {number} selfTimelineEpoch - measured in ticks
     */
    #handleNewData (tickData, selfTimelineEpoch) {
        const latestSelfEpoch = this.#selfTimeLineData.length
        if (selfTimelineEpoch == latestSelfEpoch) {
            this.#selfTimeLineData.push(tickData)
        }

        if (selfTimelineEpoch < latestSelfEpoch) {
            this.#unmapToMainTimeLine(selfTimelineEpoch)
            const oldTickData = this.#selfTimeLineData[selfTimelineEpoch]
            this.#selfTimeLineData[selfTimelineEpoch] = { ...oldTickData, ...tickData }
        }

        this.#mapToMainTimeLine(tickData, selfTimelineEpoch)
    }

    #unmapToMainTimeLine (selfTimelineEpoch) {
        const mainTimeLineEpoch = this.#selfTimeLineData[selfTimelineEpoch].mainTimeLineEpoch
        const newMapping = this.#mainTimeLineMapping[mainTimeLineEpoch].filter(selfEpoch => selfEpoch != selfTimelineEpoch)
        this.#mainTimeLineMapping = newMapping
    }

    #mapToMainTimeLine (tickData, selfTimelineEpoch) {
        const mainTimeLineEpoch = tickData.mainTimeLineEpoch
        if (this.#mainTimeLineMapping[mainTimeLineEpoch] == undefined) {
            this.#mainTimeLineMapping[mainTimeLineEpoch] = []
        }
        this.#mainTimeLineMapping[mainTimeLineEpoch].push(selfTimelineEpoch)
    }

    #handleContinuums (tickData, selfTimelineEpoch) {
        this.#handleContinuumPropagation(tickData, selfTimelineEpoch)
        this.#handleActiveContinuumSprites(selfTimelineEpoch)
    }

    #handleContinuumPropagation (tickData, selfTimelineEpoch) {
        /**
         * In this version: always create new continuum.
         * In next version: continuums may merge under some condition (position, rotation, speed and rotationSpeed close to next position, rotation, speed and rotationSpeed)
         */
        if (this.#lineStarts (selfTimelineEpoch) && !this.#continuumExists(selfTimelineEpoch)) {
            this.#closeLastContinuum (selfTimelineEpoch)
            const continuumIndex = this.#openContinuum(tickData, selfTimelineEpoch)
            this.#createContinuumSprites (continuumIndex)
            return
        }
        if (!this.#continuumExists(selfTimelineEpoch)) {
            this.#selfTimeLineData[selfTimelineEpoch].continuumIndex = this.#selfTimeLineData[selfTimelineEpoch - 1].continuumIndex
        }
    }

    #closeLastContinuum (selfTimelineEpoch) {
        if (selfTimelineEpoch > 0) {
            const last = this.#selfTimeLineData[selfTimelineEpoch - 1]
            const continuum = this.#continuums[last.continuumIndex]
            continuum.lastEpoch = last.mainTimeLineEpoch
            continuum.sprites.last.visible = true
        }
    }

    #openContinuum (tickData, selfTimelineEpoch) {
        const continuumIndex = this.#continuums.length
        this.#selfTimeLineData[selfTimelineEpoch].continuumIndex = continuumIndex
        this.#continuums[continuumIndex] = {}
        this.#continuums[continuumIndex].firstEpoch = tickData.mainTimeLineEpoch
        return continuumIndex
    }

    #createContinuumSprites (continuumIndex) {
        const first = this.#createSprite(TimeSprite.#firstContinuumSpriteColor, TimeSprite.#firstContinuumSpriteOpacity)
        const last = this.#createSprite(TimeSprite.#lastContinuumSpriteColor, TimeSprite.#lastContinuumSpriteOpacity)
        last.visible = false
        const active = this.#createSprite(TimeSprite.#activeContinuumSpriteColor, TimeSprite.#activeContinuumSpriteOpacity)
        this.#continuums[continuumIndex].sprites = { first, last, active }
    }

    #handleActiveContinuumSprites (selfTimelineEpoch) {
        const mainTimeLineEpoch = this.#selfTimeLineData[selfTimelineEpoch].mainTimeLineEpoch
        this.#continuums.forEach(continuum => {
            const activeSprite = continuum.sprites.active
            if (mainTimeLineEpoch >= continuum.firstEpoch && (continuum.lastEpoch != undefined || mainTimeLineEpoch <= continuum.lastEpoch) ) {
                this.#setSpriteToSelfEpoch(activeSprite, selfTimelineEpoch)
                activeSprite.visible = true
            } else {
                activeSprite.visible = false
            }
        })
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
        if (selfTimelineEpoch % TimeSprite.#pastSpriteDelay != 0) return
        const index = selfTimelineEpoch / TimeSprite.#pastSpriteDelay
        let sprite = this.#pastSprites[index]
        if (!sprite) {
            sprite = this.#createSprite(TimeSprite.#pastSpriteColor, TimeSprite.#pastSpriteOpacity)
            sprite.renderOrder = 0
            this.#pastSprites[index] = sprite
        }
        this.#setSpriteToSelfEpoch(sprite, selfTimelineEpoch)
    }

    /**
     * 
     * @param {image} colorMap
     * @param {image} alphaMap
     * @param {boolean} addToScene default true
     * @returns {THREE.Mesh} created sprite
     */
    #createSprite (color, opacity) {
        const texture = new THREE.MeshBasicMaterial({ color, opacity, transparent: true })
        texture.side = THREE.DoubleSide

        const colorTexture = this.#textureLoader.load(this.#maps.colorMap)
        colorTexture.colorSpace = THREE.SRGBColorSpace
        texture.map = colorTexture

        const alphaTexture = this.#textureLoader.load(this.#maps.alphaMap)
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
        if (!this.#lineStarts(selfTimelineEpoch)) {
            const lastData = this.#selfTimeLineData[selfTimelineEpoch - 1]
            const lastPoint = this.#getPointInSpace(lastData)
            const data = this.#selfTimeLineData[selfTimelineEpoch]
            const point = this.#getPointInSpace(data)
            this.#createSegment(lastPoint, point, selfTimelineEpoch)
        }
    }

    #createSegment (lastPoint, point, selfTimelineEpoch) {
        const material = new THREE.LineBasicMaterial({ color: TimeSprite.#lineColor, transparent: true, opacity: TimeSprite.#lineOpacity })
        const geometry = new THREE.BufferGeometry().setFromPoints([lastPoint, point])
        this.#segments[selfTimelineEpoch] = new THREE.Line( geometry, material )
        this.#scene.add(this.#segments[selfTimelineEpoch])
    }

    #continuumExists (selfTimelineEpoch) {
        const continuumIndex = this.#selfTimeLineData[selfTimelineEpoch].continuumIndex
        if(continuumIndex == undefined) return false
        const continuum = this.#continuums[continuumIndex]
        if(continuum == undefined) return false
        return true
    }

    #lineStarts (selfTimelineEpoch) {
        if (selfTimelineEpoch == 0) {
            return true
        }
        const mainTimeLineEpoch = this.#selfTimeLineData[selfTimelineEpoch].mainTimeLineEpoch
        const lastMainTimeLineEpoch = this.#selfTimeLineData[selfTimelineEpoch - 1].mainTimeLineEpoch
        const lineStarts = mainTimeLineEpoch != lastMainTimeLineEpoch + 1
        return lineStarts
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