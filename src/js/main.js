import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TimeSprite } from './timeSprite.js'

const scene = new THREE.Scene()

const canvas = document.querySelector('#game')

const sizes = {
    cameraFOV: 20,
    aspect: 1.5,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    fieldWidth: 1500,
    fieldHeight: 1000,
    fullFieldHeight: 1000,
    cameraDistanceToField: 10000,
    fieldMargin: 10
}

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.windowWidth, sizes.windowHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Camera
const camera = new THREE.PerspectiveCamera(sizes.cameraFOV, sizes.windowWidth / sizes.windowHeight, 0.1, 100000)
camera.position.z = 10
scene.add(camera)
// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

// Resize
window.addEventListener('resize', () => {
    // Update sizes
    sizes.windowWidth = window.innerWidth
    sizes.windowHeight = window.innerHeight
    sizes.aspect = sizes.windowWidth / sizes.windowHeight
    const width = sizes.fieldWidth + 2 * sizes.fieldMargin
    const height = sizes.fieldHeight + 2 * sizes.fieldMargin
    const fieldAspect = width / height
    if (fieldAspect < sizes.aspect ){
        sizes.fullFieldHeight = height
    } else {
        sizes.fullFieldHeight = width / sizes.aspect
    }
    sizes.cameraDistanceToField = sizes.fullFieldHeight / (2 * Math.tan(sizes.cameraFOV * Math.PI / 360))

    console.log(sizes)
    // Update camera
    camera.aspect = sizes.aspect
    camera.position.z = sizes.cameraDistanceToField
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.windowWidth, sizes.windowHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// Fullscreen
window.addEventListener('dblclick', () => {
    
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement

    if(!fullscreenElement) {
        if (canvas.requestFullscreen) {
            canvas.requestFullscreen()
        } else if (canvas.webkitRequestFullscreen) {
            canvas.webkitRequestFullscreen()
        }
    } else {
        if (document.exitFullscreen){
            document.exitFullscreen()
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen()
        }
    }
})

/**
 * Object
 */
const geometry = new THREE.PlaneGeometry(sizes.fieldWidth, sizes.fieldHeight)
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
material.wireframe = true
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)


const steps = 1000
const spriteBounds = [new THREE.Vector2(-5, -5), new THREE.Vector2(-5, 5), new THREE.Vector2(5, 5), new THREE.Vector2(5, -5)]
const timeSprite = new TimeSprite('test', spriteBounds, steps, 1)
for (let i = 0; i < steps; i++) {
    const position = new THREE.Vector2(0, 0)
    const rotation = Math.PI * i / steps
    timeSprite.setStep(i, position, rotation)
}

timeSprite.createMesh()
timeSprite.add(scene)


/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
