import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export class ViewManager {
    #globalRules
    #epoch = 0
    #canvas
    #cameraFOV
    #cameraDistanceToField
    #cameraFarEnd
    #cameraNearEnd
    #windowWidth
    #windowHeight
    #aspect
    #fullFieldHeight
    #cameraMargin
    #camera
    #controls
    #renderer

    /**
     * 
     * @param {{zPerTick: number}} globalRules
     * @param {number} cameraFOV 
     * @param {number} cameraMargin 
     */
    constructor (globalRules, scene, cameraFOV = 30, cameraMargin = 0) {
        this.#globalRules = globalRules
        this.#canvas = document.querySelector('#game')
        this.#cameraFOV = cameraFOV
        this.#cameraMargin = cameraMargin
        this.#updateSizes()
        this.#initializeCamera(scene)
        this.#initializeRenderer()
        this.#initializeControls()
        this.#initializeResizer()
    }

    /**
     * 
     * @param {number} epoch 
     */
    setEpoch (epoch) {
        this.#epoch = epoch
        this.#camera.position.z = this.#cameraDistanceToField + this.#getZeroZ()
        this.#camera.lookAt(new THREE.Vector3(0, 0, this.#getZeroZ()))
    }

    #getZeroZ () {
        return this.#epoch * this.#globalRules.zPerTick
    }

    #initializeCamera (scene) {
        this.#camera = new THREE.PerspectiveCamera(this.#cameraFOV, this.#aspect, this.#cameraNearEnd, this.#cameraFarEnd)
        this.#updateCamera()
        scene.add(this.#camera)
    }

    #initializeRenderer () {
        this.#renderer = new THREE.WebGLRenderer({ canvas: this.#canvas })
        this.#updateRenderer()
    }

    #initializeControls () {
        this.#controls = new OrbitControls(this.#camera, this.#canvas)
        this.#controls.enableDamping = true
    }

    #initializeResizer () {
        window.addEventListener('resize', () => {
            this.#update()
        })
    }


    #updateSizes () {
        this.#windowWidth = window.innerWidth
        this.#windowHeight = window.innerHeight
        this.#aspect = this.#windowWidth / this.#windowHeight
        const width = this.#globalRules.fieldWidth + 2 * this.#cameraMargin
        const height = this.#globalRules.fieldHeight + 2 * this.#cameraMargin
        const fieldAspect = width / height
        this.#fullFieldHeight = fieldAspect < this.#aspect ? height : width / this.#aspect
        this.#cameraDistanceToField = this.#fullFieldHeight / (2 * Math.tan(this.#cameraFOV * Math.PI / 360))
        this.#cameraFarEnd = this.#globalRules.totalTicks + this.#cameraDistanceToField
        this.#cameraNearEnd = Math.max(0.1, this.#cameraDistanceToField - this.#globalRules.totalTicks)
    }

    #updateCamera () {
        this.#camera.aspect = this.#aspect
        this.#camera.position.x = 0
        this.#camera.position.y = 0
        this.#camera.lookAt(new THREE.Vector3(0, 0, this.#getZeroZ()))
        this.#camera.updateProjectionMatrix()
    }

    #updateRenderer () {
        this.#renderer.setSize(this.#windowWidth, this.#windowHeight)
        this.#renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }

    #update () {
        this.#updateSizes()
        this.#updateCamera()
        this.#updateRenderer()
    }

    getCamera () {
        return this.#camera
    }

    toggleFullScreen () {
        const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement
        
            if(!fullscreenElement) {
                if (this.#canvas.requestFullscreen) {
                    this.#canvas.requestFullscreen()
                } else if (this.#canvas.webkitRequestFullscreen) {
                    this.#canvas.webkitRequestFullscreen()
                }
            } else {
                if (document.exitFullscreen){
                    document.exitFullscreen()
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen()
                }
            }
    }

    render (scene) {
        this.#renderer.render(scene, this.#camera)
    }
}
