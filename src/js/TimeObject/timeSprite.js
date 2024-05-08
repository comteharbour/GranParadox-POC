import * as THREE from 'three'
import Sprite from './sprite'
import ContinuumSprite from './continuumSprite'
import GlobalRules from '../globalRules'

export default class TimeSprite {
    #scene
    #textureLoader
    #globalRules
    get globalRules () { return this.#globalRules }
    
    #maps
    #width
    #height

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
    static #pastSpriteScale = 0.5
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
        this.#width = width
        this.#height = height
        const scale = TimeSprite.#pastSpriteScale
        this.#propagationSprite = this.#createSprite(TimeSprite.#propagationSpriteColor, TimeSprite.#propagationSpriteOpacity)
        const usedTickData = {
            mainTimeLineEpoch: 0,
            position2D: new THREE.Vector2(),
            rotation: 0,
            ...initialSpaceTimePosition
        }
        this.newSpaceTimePosition(usedTickData, 0)
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

        // if (selfTimelineEpoch >= 500) this._destroyAt(selfTimelineEpoch - 300)
    }

    _destroyAt (selfTimelineEpoch) {
        const pastSprite = this.#pastSprites[selfTimelineEpoch]
        if (pastSprite) {
            pastSprite.visible = false
        }
        const segment = this.#segments[selfTimelineEpoch]
        if (segment) {
            segment.visible = false
        }

        // continuum
        const continuumIndex = this.#selfTimeLineSpaceTimePosition[selfTimelineEpoch].continuumIndex
        const continuum = this.#continuums[continuumIndex]

        /**
         * IMPORTANT : Si destruction en cours de continuum,
         * il faudra probalbement DUPLIQUER le continuum
         * afin de distinguer la partie conservée et la partie en cours de destruction
         * PRENDRE LE TEMPS DE REFLECHIR A CE PROBLEME !!!
         */
        if (continuum.firstMainTimeLineEpoch < selfTimelineEpoch) {
            this.#closeContinuum(selfTimelineEpoch)
        }
        if (!continuum.destructionMainTimeLineEpoch) {

        }
        const destructionMainTimeLineEpoch = this.#selfTimeLineSpaceTimePosition[selfTimelineEpoch].mainTimeLineEpoch

        // tout faire disparaître si destruction au dernier tick du continuum
        const lastSelfTimeLineEpoch = continuum.getSelfTimeLineEpoch(continuum.lastMainTimeLineEpoch)
        if (selfTimelineEpoch == lastSelfTimeLineEpoch) {
            continuum.sprites.first.remove()
            continuum.sprites.playerEpoch.remove()
            continuum.sprites.last.remove()
            this.#continuums[continuumIndex] = undefined
        } else {
            this.#setSpriteToSelfTimeLineEpoch(continuum.sprites.first, selfTimelineEpoch)
        }
        /**
         * start: placer à la prochaine position existante
         * active: faire disparaître si époque dépassée
         * tout supprimer si tout le continuum est détruit
         */

        
        // TODO: voir comment supprimer proprement des éléments dans THREE.js

        // si avant la création, simplement tout supprimer
        // supprimer les éléments suivant cette époque
        // supprimer le sprite final du dernier continuum
        // créer un sprite de destruction pour le dernier continuum
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
            this.#openContinuum(spaceTimePosition, selfTimelineEpoch)
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
            this.#closeContinuum (selfTimelineEpoch - 1)
        }
    }

    #closeContinuum (selfTimelineEpoch) {
        const spaceTimePosition = this.#selfTimeLineSpaceTimePosition[selfTimelineEpoch]
        const continuum = this.#continuums[spaceTimePosition.continuumIndex]
        continuum.close(selfTimelineEpoch)
    }

    #openContinuum (spaceTimePosition, firstSelfTimelineEpoch) {
        const continuumIndex = this.#continuums.length
        const firstMainTimeLineEpoch = spaceTimePosition.mainTimeLineEpoch
        const continuum = new ContinuumSprite(firstSelfTimelineEpoch, firstMainTimeLineEpoch, this.#createSprite.bind(this), this.#setSpriteToSelfTimeLineEpoch.bind(this))
        this.#continuums.push(continuum)
        this.#selfTimeLineSpaceTimePosition[firstSelfTimelineEpoch].continuumIndex = continuumIndex
    }

    #handleActiveContinuumSprites (selfTimelineEpoch) {
        const mainTimeLineEpoch = this.#selfTimeLineSpaceTimePosition[selfTimelineEpoch].mainTimeLineEpoch
        this.#continuums.forEach(continuum => {
            continuum.showEpoch(mainTimeLineEpoch)
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
        let sprite = this.#pastSprites[selfTimelineEpoch]
        if (!sprite) {
            sprite = this.#createSprite(TimeSprite.#pastSpriteColor, TimeSprite.#pastSpriteOpacity, TimeSprite.#pastSpriteScale, false)
            this.#pastSprites[selfTimelineEpoch] = sprite
        }
        this.#setSpriteToSelfTimeLineEpoch(sprite, selfTimelineEpoch)
    }

    /**
     * 
     * @param {color} color 
     * @param {number} opacity 
     * @param {number} [scale=1]
     * @param {boolean} [applyColorMap=true]
     * @returns {THREE.Mesh} created sprite
     */
    #createSprite (color, opacity, scale = 1, applyColorMap = true) {
        const width = this.#width * scale
        const height = this.#height * scale
        const maps = {
            ...this.#maps,
            colorMap: applyColorMap ? this.#maps.colorMap : null,
        }

        const sprite = new Sprite(this.#scene, this.#textureLoader, width, height, maps, color, opacity)
        
        return sprite
    }

    #setSpriteToSelfTimeLineEpoch (sprite, selfTimelineEpoch) {
        const spaceTimePosition = this.#selfTimeLineSpaceTimePosition[selfTimelineEpoch]
        sprite.position = this.#getPointInSpace(spaceTimePosition)
        sprite.rotation = spaceTimePosition.rotation
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