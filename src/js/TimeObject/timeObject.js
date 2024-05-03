import * as THREE from 'three'
import TimeSprite from "./timeSprite"

export default class TimeObject extends TimeSprite {

    #spaceSpeeds = []
    get spaceSpeed () {
        return this.#spaceSpeeds[this.propagationSelfTimeLineEpoch]
    }
    #hitBox2D
    #orientedHitBoxes = []
    #temporarySpaceTimeMovement
    #temporaryTranslationThrust = new THREE.Vector2()
    #temporaryRotationThrust = 0
    #children = []

    /**
     * 
     * @param {Scene} scene 
     * @param {TextureLoader} textureLoader 
     * @param {{colorMap: image, alphaMap: image}} maps
     * @param {{pastSpriteDelay: number, pastSpriteStart: number, getZAtEpoch: function}} globalRules
     * @param {number} width positive integer
     * @param {number} height positive integer
     * @param {{mainTimeLineEpoch: number, position2D: Vector2, rotation: number}} initialSpaceTimePosition
     * @param {{speed2D: THREE.Vector2, rotationSpeed: THREE.Vector2}} initialSpaceSpeed
     * @param {[THREE.Vector2]} hitBox2D 
     */
    constructor (scene, textureLoader, globalRules, width, height, maps, initialSpaceTimePosition, initialSpaceSpeed, hitBox2D) {
        super(scene, textureLoader, globalRules, width, height, maps, initialSpaceTimePosition)
        this.#spaceSpeeds[0] = {speed2D: new THREE.Vector2(), rotationSpeed: 0, ...initialSpaceSpeed}
        this.#hitBox2D = hitBox2D.map(vertex => vertex.clone())
        this.#setTemporarySpaceTimePositionAndPropagation()
        this.#createHitBox()
    }

    /**
     * 
     * @param {THREE.Vector2} acceleration 
     */
    accelerateTranslation(acceleration) {
        this.#temporaryTranslationThrust.add(acceleration)
    }

    /**
     * 
     * @param {number} acceleration 
     */
    accelerateRotation(acceleration) {
        this.#temporaryRotationThrust += acceleration
    }

    /**
     * 
     * @param {TimeObject} child 
     * @param {number} selfTimelineEpoch 
     */
    _create (timeObject, selfTimelineEpoch) {
        this.#children.push({ timeObject, selfTimelineEpoch })
    }

    destroyAt (selfTimelineEpoch) {
        /**
         * Première réflexion:
         * Si l'objet a déjà créé d'autres objets, il faut supprimer la suite de cet objet.
         * Mais s'il n'en a pas encore créé, on peut tout effacer.
         * 
         * Amélioration:
         * Si on détruit un objet après sa création, il faut supprimer le futur et conserver le passé
         * Mais si on le détruit avant ou pendant sa création, on peut tout supprimer
         * 
         * La supression en chaîne peut être plus simple à lire et à coder
         */

        this._destroyAt(selfTimelineEpoch)
        // supprimer les données suivantes
        this.#children.forEach(child => {
            const childTimeLineEpoch = selfTimelineEpoch - child.creationParentTimeLineEpoch
            if (childTimeLineEpoch <= 0) {
                child.timeObject.destroyAt(0)
            }
        })
    }

    tick() {
        this.#setTemporarySpaceTimePositionAndPropagation()

        this.#changeSpaceSpeed()
        this.#changeSpaceTimePosition()

        this.#handleBorder()

        this.#createHitBox()
        // gérer les collisions

        this.#setNewMovementValues()
        this.#eraseTemporaryData()
    }

    #setTemporarySpaceTimePositionAndPropagation () {
        const lastPropagationSelfTimeLineEpoch = this.propagationSelfTimeLineEpoch
        const lastSpaceTimePosition = this.selfTimeLineSpaceTimePosition[lastPropagationSelfTimeLineEpoch]
        const spaceSpeed = this.#spaceSpeeds[lastPropagationSelfTimeLineEpoch]
        const propagationSelfTimeLineEpoch = lastPropagationSelfTimeLineEpoch + 1
        this.#temporarySpaceTimeMovement = {
            spaceTimePosition: {
                mainTimeLineEpoch: lastSpaceTimePosition.mainTimeLineEpoch,
                position2D: lastSpaceTimePosition.position2D.clone(),
                rotation: lastSpaceTimePosition.rotation
            },
            spaceSpeed: {
                ...spaceSpeed,
                speed2D: spaceSpeed.speed2D.clone()
            },
            propagationSelfTimeLineEpoch
        }
    }

    #changeSpaceSpeed () {
        if (!!this.#temporaryTranslationThrust) {
            this.#temporarySpaceTimeMovement.spaceSpeed.speed2D.add(this.#temporaryTranslationThrust)
        }
        if (!!this.#temporaryRotationThrust) {
            this.#temporarySpaceTimeMovement.spaceSpeed.rotationSpeed += this.#temporaryRotationThrust
        }
    }

    #changeSpaceTimePosition () {
        this.#temporarySpaceTimeMovement.spaceTimePosition.position2D.add(this.#temporarySpaceTimeMovement.spaceSpeed.speed2D)
        this.#temporarySpaceTimeMovement.spaceTimePosition.rotation += this.#temporarySpaceTimeMovement.spaceSpeed.rotationSpeed

        const mainTimeLineEpoch = (this.#temporarySpaceTimeMovement.spaceTimePosition.mainTimeLineEpoch + 1) % this.globalRules.totalTicks
        this.#temporarySpaceTimeMovement.spaceTimePosition.mainTimeLineEpoch = mainTimeLineEpoch
    }

    #handleBorder () {
        const isOut = this.#isOutOfBounds()
        if (isOut.x || isOut.y) {
            this.#bounce(isOut)
        }
    }

    #isOutOfBounds () {
        const spaceTimePosition = this.#temporarySpaceTimeMovement.spaceTimePosition
        const xPosition = spaceTimePosition.position2D.x
        const xBoundary = this.globalRules.fieldWidth / 2
        const yPosition = spaceTimePosition.position2D.y
        const yBoundary = this.globalRules.fieldHeight / 2
        const x = xPosition <= -xBoundary || xPosition >= xBoundary
        const y = yPosition <= -yBoundary || yPosition >= yBoundary
        return { x, y }
    }

    #bounce (isOut) {
        let xSpeed = this.#temporarySpaceTimeMovement.spaceSpeed.speed2D.x
        let ySpeed = this.#temporarySpaceTimeMovement.spaceSpeed.speed2D.y
        let xPosition = this.#temporarySpaceTimeMovement.spaceTimePosition.position2D.x
        let yPosition = this.#temporarySpaceTimeMovement.spaceTimePosition.position2D.y

        if ( isOut.x ) {
            xSpeed = -xSpeed
            xPosition += xSpeed
            this.#temporarySpaceTimeMovement.spaceSpeed.speed2D.setX(xSpeed)
            this.#temporarySpaceTimeMovement.spaceTimePosition.position2D.setX(xPosition)
        }

        if ( isOut.y ) {
            ySpeed = -ySpeed
            yPosition += ySpeed
            this.#temporarySpaceTimeMovement.spaceSpeed.speed2D.setY(ySpeed)
            this.#temporarySpaceTimeMovement.spaceTimePosition.position2D.setY(yPosition)
        }
    }

    #createHitBox() {
        const spaceTimePosition = this.#temporarySpaceTimeMovement.spaceTimePosition
        const propagationSelfTimeLineEpoch = this.#temporarySpaceTimeMovement.propagationSelfTimeLineEpoch
        this.#orientedHitBoxes[propagationSelfTimeLineEpoch] = this.#hitBox2D.map(vertex => {
            const rotatedVertex = vertex.clone().rotateAround(new THREE.Vector2(), spaceTimePosition.rotation)
            const translatedRotatedVertex = rotatedVertex.add(spaceTimePosition.position2D)
            return translatedRotatedVertex
        })
    }

    #setNewMovementValues () {
        const propagationSelfTimeLineEpoch = this.#temporarySpaceTimeMovement.propagationSelfTimeLineEpoch
        this.#spaceSpeeds[propagationSelfTimeLineEpoch] = this.#temporarySpaceTimeMovement.spaceSpeed
        this.newSpaceTimePosition(this.#temporarySpaceTimeMovement.spaceTimePosition, propagationSelfTimeLineEpoch)
        this.propagationSelfTimeLineEpoch = propagationSelfTimeLineEpoch
    }

    #eraseTemporaryData () {
        this.#temporarySpaceTimeMovement = undefined
        this.#temporaryTranslationThrust = new THREE.Vector2()
        this.#temporaryRotationThrust = 0
    }
}