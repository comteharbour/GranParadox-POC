import * as THREE from 'three'
import { TimeSprite } from './timeSprite.js'
import { ViewManager } from './viewManager.js'
import { ControlsManager } from './controlsManager.js'

const scene = new THREE.Scene()

const sizes = {
    fieldWidth: 1500,
    fieldHeight: 1000,
    fieldTimeHeight: 5000,
    fieldMargin: 10,
    cameraFOV: 20,
}

const viewManager = new ViewManager(sizes.fieldWidth, sizes.fieldHeight, sizes.fieldTimeHeight, sizes.cameraFOV, sizes.fieldMargin)
scene.add(viewManager.getCamera())

const controlsManager = new ControlsManager()

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
    const controls = controlsManager.getInputs()
    if (controls.toggleFullScreen) viewManager.toggleFullScreen()

    controlsManager.tick()

    // TODO: rework render call
    viewManager.render(scene)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
