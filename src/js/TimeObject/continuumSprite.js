import Sprite from './sprite'

export default class ContinuumSprite {

    /**
     * Doit connaître:
     * - son identifiant
     * - son époque de départ
     * - son époque de fin (si existante)
     * - les époques de destruction
     * 
     * Doit pouvoir :
     * - accéder à l'époque de propagation du joueur
     * - accéder aux positions spatio-temporelles le concernant
     * - positionner un sprite au bon espace-temps
     * - créer un sprite
     * 
     * Doit faire:
     * - continuer de se propager
     * - arrêter de se propager
     * - afficher son etat selon l'epoque de propagation du joueur
     * - recevoir des informations de destruction ponctuelles (rendre des sprites invisibles)
     */


    #createSprite
    #setSpriteToSelfTimeLineEpoch

    #sprites = {
        first: undefined,
        last: undefined,
        playerEpoch: undefined,
        destructionEpochs: []
    }

    #firstMainTimeLineEpoch
    #firstSelfTimeLineEpoch
    #lastMainTimeLineEpoch
    #destructionMainTimeLineEpochs = []

    static #firstContinuumSpriteColor = 0x00ffff
    static #firstContinuumSpriteOpacity = 1
    static #lastContinuumSpriteColor = 0x00ffff
    static #lastContinuumSpriteOpacity = 1
    static #playerEpochContinuumSpriteColor = 0xA09090
    static #playerEpochContinuumSpriteOpacity = 1

    /**
     * 
     * @param {number} firstSelfTimeLineEpoch 
     * @param {number} firstMainTimeLineEpoch 
     * @param {function: (color, opacity, scale, applyColorMap) => Sprite} createSprite 
     * @param {function: (Sprite, mainTimeLineEpoch) => {}} setSpriteToSelfTimeLineEpoch 
     */
    constructor (firstSelfTimeLineEpoch, firstMainTimeLineEpoch, createSprite, setSpriteToSelfTimeLineEpoch) {
        this.#firstSelfTimeLineEpoch = firstSelfTimeLineEpoch
        this.#firstMainTimeLineEpoch = firstMainTimeLineEpoch
        this.#createSprite = createSprite
        this.#setSpriteToSelfTimeLineEpoch = setSpriteToSelfTimeLineEpoch
        this.#intitializeSprites()
    }

    #intitializeSprites () {
        const first = this.#createSprite(ContinuumSprite.#firstContinuumSpriteColor, ContinuumSprite.#firstContinuumSpriteOpacity)
        this.#setSpriteToSelfTimeLineEpoch(first, this.#firstSelfTimeLineEpoch)
        const last = this.#createSprite(ContinuumSprite.#lastContinuumSpriteColor, ContinuumSprite.#lastContinuumSpriteOpacity)
        last.visible = false
        const playerEpoch = this.#createSprite(ContinuumSprite.#playerEpochContinuumSpriteColor, ContinuumSprite.#playerEpochContinuumSpriteOpacity)
        playerEpoch.visible = false
        this.#sprites = { first, last, playerEpoch }
    }

    close (lastSelfTimeLineEpoch) {
        this.#lastMainTimeLineEpoch = this.#getMainEpoch(lastSelfTimeLineEpoch)
        this.#setSpriteToSelfTimeLineEpoch(this.#sprites.last, lastSelfTimeLineEpoch)
        this.#sprites.last.visible = true
    }

    showEpoch (playerMainTimeLineEpoch) {
        const isNotTooSoon = playerMainTimeLineEpoch >= this.#firstMainTimeLineEpoch
        const isNotTooLate = playerMainTimeLineEpoch <= this.#lastMainTimeLineEpoch
        if (isNotTooSoon && isNotTooLate) {
            const playerSelfTimeLineEpoch = this.#getSelfEpoch(playerMainTimeLineEpoch)
            this.#setSpriteToSelfTimeLineEpoch(this.#sprites.playerEpoch, playerSelfTimeLineEpoch)
            this.#sprites.playerEpoch.visible = true
        } else {
            this.#sprites.playerEpoch.visible = false
        }
    }

    #getMainEpoch (selfEpoch) {
        return selfEpoch - this.#firstSelfTimeLineEpoch + this.#firstMainTimeLineEpoch
    }

    #getSelfEpoch (mainEpoch) {
        return mainEpoch - this.#firstMainTimeLineEpoch + this.#firstSelfTimeLineEpoch
    }
}