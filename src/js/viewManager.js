import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export class ViewManager {
    #canvas
    #cameraFOV
    #cameraDistanceToField
    #cameraFarEnd
    #cameraNearEnd
    #windowWidth
    #windowHeight
    #aspect
    #fieldWidth
    #fieldHeight
    #fieldTimeHeight
    #fullFieldHeight
    #fieldMargin
    #camera
    #controls
    #renderer

    constructor (fieldWidth, fieldHeight, fieldTimeHeight, cameraFOV = 30, fieldMargin = 0) {
        this.#canvas = document.querySelector('#game')
        this.#fieldWidth = fieldWidth
        this.#fieldHeight = fieldHeight
        this.#fieldTimeHeight = fieldTimeHeight
        this.#cameraFOV = cameraFOV
        this.#fieldMargin = fieldMargin
        this.#updateSizes()
        this.#initializeCamera()
        this.#initializeRenderer()
        this.#initializeControls()
        this.#initializeResizer()
    }

    #initializeCamera () {
        this.#camera = new THREE.PerspectiveCamera(this.#cameraFOV, this.#aspect, this.#cameraNearEnd, this.#cameraFarEnd)
        this.#updateCamera()
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
        const width = this.#fieldWidth + 2 * this.#fieldMargin
        const height = this.#fieldHeight + 2 * this.#fieldMargin
        const fieldAspect = width / height
        this.#fullFieldHeight = fieldAspect < this.#aspect ? height : width / this.#aspect
        this.#cameraDistanceToField = this.#fullFieldHeight / (2 * Math.tan(this.#cameraFOV * Math.PI / 360))
        this.#cameraFarEnd = this.#fieldTimeHeight + this.#cameraDistanceToField
        this.#cameraNearEnd = Math.max(0.1, this.#cameraDistanceToField - this.#fieldTimeHeight)
    }

    #updateCamera () {
        this.#camera.aspect = this.#aspect
        // TODO: rework update camera position and orientation
        this.#camera.position.x = 0
        this.#camera.position.y = 0
        this.#camera.position.z = this.#cameraDistanceToField
        this.#camera.lookAt(new THREE.Vector3(0, 0, 0))
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
