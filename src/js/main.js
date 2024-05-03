import * as THREE from 'three'
import OldTimeSprite from './timeSprite_old.js'
import { ViewManager } from './viewManager.js'
import { ControlsManager } from './controlsManager.js'
import GlobalRules from './globalRules.js'
import TimeSprite from './TimeObject/timeSprite.js'
import TimeObject from './TimeObject/timeObject.js'
import TimePlayer from './TimeObject/timePlayer.js'
import Boundary from './boundary.js'
import sprites from './assetsManager/sprites.js'

const scene = new THREE.Scene()
const loadingManager = new THREE.LoadingManager()
const textureLoader = new THREE.TextureLoader(loadingManager)

const renderSpeed = 1
const nbContinuums = 6

const totalTicks = 2000 / renderSpeed
const fieldWidth = 1500
const fieldHeight = 1000
const pastSpriteStart = Math.floor(0 / renderSpeed)
const pastSpriteDelay = Math.floor(3 / renderSpeed)
const pastSpriteFactor = 0.5
const zPerTick = 1 * renderSpeed
const globalRules = new GlobalRules ({
    totalTicks,
    fieldWidth,
    fieldHeight,
    pastSpriteStart,
    pastSpriteDelay,
    pastSpriteFactor,
    zPerTick
})

const cameraFOV = 50,
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
    const initialProportion = 0.8
    const initialPosition = new THREE.Vector2(globalRules.fieldWidth, globalRules.fieldHeight).multiplyScalar(-0.5 * initialProportion)
    const velocity = 0.3 * renderSpeed
    const speed = new THREE.Vector2(1, globalRules.fieldHeight / globalRules.fieldWidth).multiplyScalar(velocity)
    const translation2D = speed.clone().multiplyScalar(tick)
    const radius = 100
    const angularSpeed = Math.PI / 100 * renderSpeed
    const rotationPosition = new THREE.Vector2(radius * Math.cos(angularSpeed * tick), radius * Math.sin(angularSpeed * tick))
    const position2D = initialPosition.clone().add(translation2D).add(rotationPosition)
    const rotation = angularSpeed * tick + Math.PI / 2
    const mainTimeLineEpoch = tick % globalRules.totalTicks
    return {
        position2D,
        rotation,
        mainTimeLineEpoch
    }
}



const boundary = new Boundary(globalRules, scene, textureLoader, sprites.boundary)

// const start = Date.now()
// while (Date.now() < start + 1000) { console.log('waiting') }

// const timeSprite = new TimeSprite(scene, textureLoader, globalRules, 40, 50, sprites.ship1)

const hitBox2D = [new THREE.Vector2(0, 0), new THREE.Vector2(0, 1), new THREE.Vector2(1, 1)]
const timePlayer = new TimePlayer(scene, textureLoader, globalRules, 40, 50, sprites.ship1, {position2D: new THREE.Vector2(0,0)}, {speed2D: new THREE.Vector2(1, 1).multiplyScalar(renderSpeed), rotationSpeed: Math.PI / 100 * renderSpeed}, hitBox2D, 1)

let elapsedTicks = 0
const runTick = () => {
    if (elapsedTicks < globalRules.totalTicks * nbContinuums) {
        // timeSprite.newSpaceTimePosition(data(elapsedTicks), elapsedTicks)
        // timeSprite.propagationSelfTimeLineEpoch = Math.floor(elapsedTicks)
        timePlayer.tick()
        boundary.setEpoch(elapsedTicks % globalRules.totalTicks)
    
        elapsedTicks++
    }
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
    viewManager.setEpoch(elapsedTicks % globalRules.totalTicks)
    viewManager.render(scene)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
