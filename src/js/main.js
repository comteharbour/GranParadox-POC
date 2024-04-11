import * as THREE from 'three'
import OldTimeSprite from './timeSprite_old.js'
import { ViewManager } from './viewManager.js'
import { ControlsManager } from './controlsManager.js'
import TimeObject from './TimeObject/timeObject.js'
import sprites from './assetsManager/sprites.js'

const scene = new THREE.Scene()
const loadingManager = new THREE.LoadingManager()
const textureLoader = new THREE.TextureLoader(loadingManager)

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


// const steps = 1000
// const spriteBounds = [new THREE.Vector2(-5, -5), new THREE.Vector2(-5, 5), new THREE.Vector2(5, 5), new THREE.Vector2(5, -5)]
// const oldTimeSprite = new OldTimeSprite('test', spriteBounds, steps, 1)
// for (let i = 0; i < steps; i++) {
//     const position = new THREE.Vector2(0, 0)
//     const rotation = Math.PI * i / steps
//     oldTimeSprite.setStep(i, position, rotation)
// }

// oldTimeSprite.createMesh()
// oldTimeSprite.add(scene)

function data (tick) {
    const radius = 200
    const angularSpeed = Math.PI / 200
    return {
        position2D: new THREE.Vector2(radius * Math.cos(angularSpeed * tick), radius * Math.sin(angularSpeed * tick)),
        rotation: angularSpeed * tick + Math.PI / 2,
        mainTimeLineEpoch: tick
    }
}

const timeObject = new TimeObject(scene, textureLoader, 40, 50, sprites.ship1)

let elapsedTicks = 0
const runTick = () => {
    timeObject.newData(data(elapsedTicks), elapsedTicks)
    elapsedTicks++
}
setInterval(runTick, 10)

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
