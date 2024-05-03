import * as THREE from 'three'
import TimeObject from "./timeObject"

export default class TimePlayer extends TimeObject {

    #xInput = 0
    #yInput = 0
    static #translationThrust = 0.1
    static #rotationThrust = 0.01
    static #translationFrictionCoefficient = 0.02
    static #rotationFrictionCoefficient = 0.1
    static #rotationMinimalSpeed = 0.003

    constructor (scene, textureLoader, globalRules, width, height, maps, initialSpaceTimePosition, initialSpaceSpeed, hitBox2D) {
        super(scene, textureLoader, globalRules, width, height, maps, initialSpaceTimePosition, initialSpaceSpeed, hitBox2D)

        // lorsqu'une touche est enfoncée, mettre la valeur d'input correspondante à 1 ou -1
        document.addEventListener("keydown", (event) => {
            switch (event.key) {
            case 'ArrowRight':
                this.#xInput = -1
                break
            case "ArrowLeft":
                this.#xInput = 1
                break
            case "ArrowDown":
                this.#yInput = 0
                break
            case "ArrowUp":
                this.#yInput = 1
                break
            }
        })

        // lorsqu'une touche est relâchée, mettre la valeur d'input correspondante à 0
        document.addEventListener("keyup", (event) => {
            if (event.key == "ArrowRight" || event.key == "ArrowLeft") {
            this.#xInput = 0
            }
            if (event.key == "ArrowUp" || event.key == "ArrowDown") {
            this.#yInput = 0
            }
        })
    }

    tick () {
        super.tick()
        this.#pilot()
        this.#friction()
    }

    #pilot() {
        this.#fireMainEngine()
        this.#fireRotationThrusters()
    }

    #fireMainEngine() {
        const rotation = this.propagationSpaceTimePosition.rotation
        const directionVector = new THREE.Vector2(1, 0).rotateAround({x: 0, y: 0}, rotation)
        const translationTrust = directionVector.multiplyScalar(TimePlayer.#translationThrust * this.#yInput)
        this.accelerateTranslation(translationTrust)
    }

    #fireRotationThrusters () {
        const rotationThrust = TimePlayer.#rotationThrust * this.#xInput
        this.accelerateRotation(rotationThrust)
    }

    #friction() {
        this.#translationFriction()
        this.#rotationFriction()
    }

    #translationFriction () {
        const translationVector = this.spaceSpeed.speed2D.clone()
        const velocity = translationVector.length()
        const frictionVector = translationVector.multiplyScalar(-TimePlayer.#translationFrictionCoefficient)
        this.accelerateTranslation(frictionVector)
    }

    #rotationFriction () {
        const rotationSpeed = this.spaceSpeed.rotationSpeed
        if (Math.abs(rotationSpeed) < TimePlayer.#rotationMinimalSpeed && this.#xInput == 0 ) {
            this.accelerateRotation(-rotationSpeed)
        } else {
            const rotationFriction = -rotationSpeed * TimePlayer.#rotationFrictionCoefficient
            this.accelerateRotation(rotationFriction)
        }
    }
}