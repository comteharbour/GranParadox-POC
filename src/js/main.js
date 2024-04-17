import * as THREE from 'three'
import OldTimeSprite from './timeSprite_old.js'
import { ViewManager } from './viewManager.js'
import { ControlsManager } from './controlsManager.js'
import TimeObject from './TimeObject/timeObject.js'
import PhysicalTimeObject from './TimeObject/physicalTimeObject.js'
import Boundary from './boundary.js'
import sprites from './assetsManager/sprites.js'

const scene = new THREE.Scene()
const loadingManager = new THREE.LoadingManager()
const textureLoader = new THREE.TextureLoader(loadingManager)

const globalRules = {
    getZAtEpoch: (epoch) => epoch * 1,
    totalTicks: 3000,
    fieldWidth: 1500,
    fieldHeight: 1000,
}

const cameraFOV = 20,
cameraMargin = 10

const viewManager = new ViewManager(globalRules, scene, cameraFOV, cameraMargin)

const controlsManager = new ControlsManager()


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
    const angularSpeed = Math.PI / 300
    return {
        position2D: new THREE.Vector2(radius * Math.cos(angularSpeed * tick), radius * Math.sin(angularSpeed * tick)),
        rotation: angularSpeed * tick + Math.PI / 2,
        mainTimeLineEpoch: tick
    }
}

const boundary = new Boundary(globalRules, scene, textureLoader, sprites.boundary)
const timeObject = new TimeObject(scene, textureLoader, globalRules, 40, 50, sprites.ship1)

/**
 * Animate
 */
// const clock = new THREE.Clock()

// const tick = () =>
// {
//     const controls = controlsManager.getInputs()
//     if (controls.toggleFullScreen) viewManager.toggleFullScreen()

//     controlsManager.tick()

//     // TODO: rework render call
//     viewManager.render(scene)

//     // Call tick again on the next frame
//     window.requestAnimationFrame(tick)
// }

// tick()

let elapsedTicks = 0
const runTick = () => {
    timeObject.newData(data(elapsedTicks), elapsedTicks)
    boundary.setEpoch(elapsedTicks)

    const controls = controlsManager.getInputs()
    if (controls.toggleFullScreen) viewManager.toggleFullScreen()

    controlsManager.tick()

    // TODO: rework render call
    viewManager.setEpoch(elapsedTicks)
    viewManager.render(scene)
    elapsedTicks++
}
setInterval(runTick, 10)

const hitBox2D = [new THREE.Vector2(0, 0), new THREE.Vector2(0, 1), new THREE.Vector2(1, 1)]
new PhysicalTimeObject(scene, textureLoader, globalRules, 40, 50, sprites.ship1, {}, hitBox2D, 1)
