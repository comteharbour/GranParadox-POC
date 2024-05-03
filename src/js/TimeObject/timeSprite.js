import * as THREE from 'three'
import GlobalRules from '../globalRules'

export default class TimeSprite {
    #scene
    #textureLoader
    #globalRules
    get globalRules () { return this.#globalRules }
    
    #maps
    #rectangle
    #pastRectangle

    #selfTimeLineSpaceTimePosition = []
    get selfTimeLineSpaceTimePosition () { return this.#selfTimeLineSpaceTimePosition }

    #mainTimeLineMapping = []
    #propagationSprite

    #propagationSelfTimeLineEpoch = 0
    get propagationSelfTimeLineEpoch () { return this.#propagationSelfTimeLineEpoch }
    set propagationSelfTimeLineEpoch (selfTimelineEpoch) {
        if (selfTimelineEpoch == null && this.#propagationSelfTimeLineEpoch != null) {
            this.#propagationSprite.visible = false
            return
        }

        if (selfTimelineEpoch != null && this.#propagationSelfTimeLineEpoch == null) {
            this.#propagationSprite.visible = true
        }

        this.#setSpriteToSelfTimeLineEpoch(this.#propagationSprite, selfTimelineEpoch)
        this.#propagationSelfTimeLineEpoch = selfTimelineEpoch
    }

    get propagationSpaceTimePosition () {
        return this.#selfTimeLineSpaceTimePosition[this.#propagationSelfTimeLineEpoch]
    }

    #continuums = []
    #pastSprites = []
    #segments = []

    static #propagationSpriteColor = 0xffffff
    static #propagationSpriteOpacity = 1
    static #pastSpriteColor = 0x00ffff
    static #pastSpriteOpacity = 0.1
    static #pastSpriteFactor = 0.6
    static #firstContinuumSpriteColor = 0x00ffff
    static #firstContinuumSpriteOpacity = 0.4
    static #lastContinuumSpriteColor = 0x00ffff
    static #lastContinuumSpriteOpacity = 0.4
    static #playerEpochContinuumSpriteColor = 0xA09090
    static #playerEpochContinuumSpriteOpacity = 1
    static #lineColor = 0x00ffff
    static #lineOpacity = 0.2

    /**
     * 
     * @param {Scene} scene 
     * @param {TextureLoader} textureLoader 
     * @param {{colorMap: image, alphaMap: image}} maps
     * @param {GlobalRules} globalRules
     * @param {number} width positive integer
     * @param {number} height positive integer
     * @param {{mainTimeLineEpoch: number, position2D: Vector2, rotation: number}} initialSpaceTimePosition
     */
    constructor (scene, textureLoader, globalRules, width, height, maps, initialSpaceTimePosition) {
        this.#scene = scene
        this.#textureLoader = textureLoader
        this.#globalRules = globalRules
        this.#maps = maps
        this.#rectangle = new THREE.PlaneGeometry(height, width)
        const scale = TimeSprite.#pastSpriteFactor
        this.#pastRectangle = new THREE.PlaneGeometry(height * scale, width * scale)
        this.#propagationSprite = this.#createSprite(TimeSprite.#propagationSpriteColor, TimeSprite.#propagationSpriteOpacity)
        const usedTickData = {
            mainTimeLineEpoch: 0,
            position2D: new THREE.Vector2(),
            rotation: 0,
            ...initialSpaceTimePosition
        }
        this.newSpaceTimePosition(usedTickData, 0)
    }

    _destroyAt (selfTimelineEpoch) {
        // TODO: voir comment supprimer proprement des éléments dans THREE.js

        // si avant la création, simplement tout supprimer
        // supprimer les éléments suivant cette époque
        // supprimer le sprite final du dernier continuum
        // créer un sprite de destruction pour le dernier continuum
    }

    /**
     * 
     * @param {{mainTimeLineEpoch: number, position2D: Vector2, rotation: number}} spaceTimePosition
     * @param {number} selfTimelineEpoch - measured in ticks
     */
    newSpaceTimePosition (spaceTimePosition, selfTimelineEpoch) {
        this.#handleNewData(spaceTimePosition, selfTimelineEpoch)
        this.#handleContinuums(spaceTimePosition, selfTimelineEpoch)
        this.#handlePastSprite(selfTimelineEpoch)
        this.#handleLine(selfTimelineEpoch)
    }

    /**
     * 
     * @param {{mainTimeLineEpoch: number, position2D: Vector2, rotation: number}} data
     * @param {number} selfTimelineEpoch - measured in ticks
     */
    #handleNewData (spaceTimePosition, selfTimelineEpoch) {
        const latestSelfTimeLineEpoch = this.#selfTimeLineSpaceTimePosition.length
        if (selfTimelineEpoch == latestSelfTimeLineEpoch) {
            this.#selfTimeLineSpaceTimePosition.push(spaceTimePosition)
        }

        if (selfTimelineEpoch < latestSelfTimeLineEpoch) {
            this.#unmapToMainTimeLine(selfTimelineEpoch)
            const oldTickData = this.#selfTimeLineSpaceTimePosition[selfTimelineEpoch]
            this.#selfTimeLineSpaceTimePosition[selfTimelineEpoch] = { ...oldTickData, ...spaceTimePosition }
        }

        this.#mapToMainTimeLine(spaceTimePosition, selfTimelineEpoch)
    }

    #unmapToMainTimeLine (selfTimelineEpoch) {
        const mainTimeLineEpoch = this.#selfTimeLineSpaceTimePosition[selfTimelineEpoch].mainTimeLineEpoch
        const newMapping = this.#mainTimeLineMapping[mainTimeLineEpoch].filter(selfEpoch => selfEpoch != selfTimelineEpoch)
        this.#mainTimeLineMapping = newMapping
    }

    #mapToMainTimeLine (spaceTimePosition, selfTimelineEpoch) {
        const mainTimeLineEpoch = spaceTimePosition.mainTimeLineEpoch
        if (this.#mainTimeLineMapping[mainTimeLineEpoch] == undefined) {
            this.#mainTimeLineMapping[mainTimeLineEpoch] = []
        }
        this.#mainTimeLineMapping[mainTimeLineEpoch].push(selfTimelineEpoch)
    }

    // Next version: mapping selfTimeLine intervals > continuums
    #handleContinuums (spaceTimePosition, selfTimelineEpoch) {
        this.#handleContinuumPropagation(spaceTimePosition, selfTimelineEpoch)
        this.#handleActiveContinuumSprites(selfTimelineEpoch)
    }

    #handleContinuumPropagation (spaceTimePosition, selfTimelineEpoch) {
        /**
         * In this version: always create new continuum.
         * In next version: continuums may merge under some condition (position, rotation, speed and rotationSpeed close to next position, rotation, speed and rotationSpeed)
         */
        if (this.#lineStarts (selfTimelineEpoch) && !this.#continuumExists(selfTimelineEpoch)) {
            this.#closeLastContinuum (selfTimelineEpoch)
            const continuumIndex = this.#openContinuum(spaceTimePosition, selfTimelineEpoch)
            this.#createContinuumSprites (continuumIndex, selfTimelineEpoch)
            return
        }
        if (this.#lineStarts (selfTimelineEpoch) && this.#continuumExists(selfTimelineEpoch)) {
            const continuum = this.#continuums[this.#selfTimeLineSpaceTimePosition[selfTimelineEpoch].continuumIndex]
            this.#setSpriteToSelfTimeLineEpoch(continuum.sprites.first, selfTimelineEpoch)
        }
        if (!this.#continuumExists(selfTimelineEpoch)) {
            this.#selfTimeLineSpaceTimePosition[selfTimelineEpoch].continuumIndex = this.#selfTimeLineSpaceTimePosition[selfTimelineEpoch - 1].continuumIndex
            return
        }
    }

    #closeLastContinuum (selfTimelineEpoch) {
        if (selfTimelineEpoch > 0) {
            const last = this.#selfTimeLineSpaceTimePosition[selfTimelineEpoch - 1]
            const continuum = this.#continuums[last.continuumIndex]
            continuum.lastMainTimeLineEpoch = last.mainTimeLineEpoch
            this.#setSpriteToSelfTimeLineEpoch(continuum.sprites.last, continuum.getSelfTimeLineEpoch(last.mainTimeLineEpoch))
            continuum.sprites.last.visible = true
        }
    }

    #openContinuum (spaceTimePosition, selfTimelineEpoch) {
        const continuumIndex = this.#continuums.length
        this.#selfTimeLineSpaceTimePosition[selfTimelineEpoch].continuumIndex = continuumIndex
        this.#continuums[continuumIndex] = {}
        this.#continuums[continuumIndex].firstMainTimeLineEpoch = spaceTimePosition.mainTimeLineEpoch
        this.#continuums[continuumIndex].getSelfTimeLineEpoch = mainTimeLineEpoch => selfTimelineEpoch + mainTimeLineEpoch - spaceTimePosition.mainTimeLineEpoch // firstSelfTimelineEpoch + (mainTimeLineEpoch - firstMainTimeLineEpoch)
        return continuumIndex
    }

    #createContinuumSprites (continuumIndex, selfTimelineEpoch) {
        const first = this.#createSprite(TimeSprite.#firstContinuumSpriteColor, TimeSprite.#firstContinuumSpriteOpacity)
        this.#setSpriteToSelfTimeLineEpoch(first, selfTimelineEpoch)
        const last = this.#createSprite(TimeSprite.#lastContinuumSpriteColor, TimeSprite.#lastContinuumSpriteOpacity)
        last.visible = false
        const playerEpoch = this.#createSprite(TimeSprite.#playerEpochContinuumSpriteColor, TimeSprite.#playerEpochContinuumSpriteOpacity)
        this.#continuums[continuumIndex].sprites = { first, last, playerEpoch }
    }

    #handleActiveContinuumSprites (selfTimelineEpoch) {
        const mainTimeLineEpoch = this.#selfTimeLineSpaceTimePosition[selfTimelineEpoch].mainTimeLineEpoch
        this.#continuums.forEach(continuum => {
            const propagationSprite = continuum.sprites.playerEpoch
            if (mainTimeLineEpoch >= continuum.firstMainTimeLineEpoch && (continuum.lastMainTimeLineEpoch != undefined || mainTimeLineEpoch <= continuum.lastMainTimeLineEpoch) ) {
                const continuumSelfTimeLineEpoch = continuum.getSelfTimeLineEpoch(mainTimeLineEpoch)
                this.#setSpriteToSelfTimeLineEpoch(propagationSprite, continuumSelfTimeLineEpoch)
                propagationSprite.visible = true
            } else {
                propagationSprite.visible = false
            }
        })
    }

    // #extrapolateLastTickData (data, selfTimelineEpoch) {
    //     const lastData = this.#selfTimeLineSpaceTimePosition[selfTimelineEpoch - 1]
    //     const mainTimeLineEpoch = !!data.mainTimeLineEpoch ? data.mainTimeLineEpoch : lastData.mainTimeLineEpoch + 1
    //     const position2D = !!data.position2D ? data.position2D : lastData.position2D + lastData.speed2D
    //     const speed2D = !!data.speed2D ? data.speed2D : lastData.speed2D
    //     const rotation = !!data.rotation ? data.rotation : lastData.rotation + lastData.rotationSpeed
    //     const rotationSpeed = !!data.rotationSpeed ? data.rotationSpeed : lastData.rotationSpeed
    //     const HP = !!data.HP ? data.HP : lastData.HP
    //     const justTeleported = !!data.justTeleported

    //     const newSpaceTimePosition = { mainTimeLineEpoch, position2D, speed2D, rotation, rotationSpeed, HP, justTeleported}
    //     this.#selfTimeLineSpaceTimePosition[selfTimelineEpoch] = new TimeSpriteTickData(newMainTimeLineEpoch, newSpaceTimePosition)
    // }

    #handlePastSprite(selfTimelineEpoch) {
        const pastSpriteStart = this.#globalRules.pastSpriteStart
        const pastSpriteDelay = this.#globalRules.pastSpriteDelay
        if (selfTimelineEpoch % pastSpriteDelay != pastSpriteStart) return
        if (this.#lineStarts(selfTimelineEpoch)) return
        const index = selfTimelineEpoch / pastSpriteDelay
        let sprite = this.#pastSprites[index]
        if (!sprite) {
            sprite = this.#createSprite(TimeSprite.#pastSpriteColor, TimeSprite.#pastSpriteOpacity, false, true)
            this.#pastSprites[index] = sprite
        }
        this.#setSpriteToSelfTimeLineEpoch(sprite, selfTimelineEpoch)
    }

    /**
     * 
     * @param {image} colorMap
     * @param {image} alphaMap
     * @param {boolean} addToScene default true
     * @param {boolean} isPastSprite default false
     * @returns {THREE.Mesh} created sprite
     */
    #createSprite (color, opacity, applyMap = true, isPastSprite = false) {
        const texture = new THREE.MeshBasicMaterial({ color, opacity, transparent: true })
        texture.side = THREE.DoubleSide

        if (applyMap) {
            const colorTexture = this.#textureLoader.load(this.#maps.colorMap)
            colorTexture.colorSpace = THREE.SRGBColorSpace
            texture.map = colorTexture
        }

        const alphaTexture = this.#textureLoader.load(this.#maps.alphaMap)
        alphaTexture.colorSpace = THREE.SRGBColorSpace
        texture.alphaMap = alphaTexture

        const rectangle = isPastSprite ? this.#pastRectangle : this.#rectangle
        const sprite = new THREE.Mesh(rectangle, texture)
        this.#scene.add(sprite)
        
        return sprite
    }

    #setSpriteToSelfTimeLineEpoch (sprite, selfTimelineEpoch) {
        const spaceTimePosition = this.#selfTimeLineSpaceTimePosition[selfTimelineEpoch]
        sprite.position.copy(this.#getPointInSpace(spaceTimePosition))
        sprite.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 1), spaceTimePosition.rotation)
    }

    #handleLine (selfTimelineEpoch) {
        if (!this.#lineStarts(selfTimelineEpoch)) {
            const lastData = this.#selfTimeLineSpaceTimePosition[selfTimelineEpoch - 1]
            const lastPoint = this.#getPointInSpace(lastData)
            const data = this.#selfTimeLineSpaceTimePosition[selfTimelineEpoch]
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
        const continuumIndex = this.#selfTimeLineSpaceTimePosition[selfTimelineEpoch].continuumIndex
        if(continuumIndex == undefined) return false
        const continuum = this.#continuums[continuumIndex]
        if(continuum == undefined) return false
        return true
    }

    #lineStarts (selfTimelineEpoch) {
        if (selfTimelineEpoch == 0) {
            return true
        }
        const mainTimeLineEpoch = this.#selfTimeLineSpaceTimePosition[selfTimelineEpoch].mainTimeLineEpoch
        const lastMainTimeLineEpoch = this.#selfTimeLineSpaceTimePosition[selfTimelineEpoch - 1].mainTimeLineEpoch
        const lineStarts = mainTimeLineEpoch != lastMainTimeLineEpoch + 1
        return lineStarts
    }
    
    #getPointInSpace(spaceTimePosition) {
        return this.#globalRules.vector3From(spaceTimePosition.position2D, spaceTimePosition.mainTimeLineEpoch)
    }
}