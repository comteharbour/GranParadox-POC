import * as THREE from 'three'
import OldTimeSprite from './timeSprite_old.js'
import { ViewManager } from './viewManager.js'
import { ControlsManager } from './controlsManager.js'
import TimeObject from './TimeObject/timeObject.js'
import sprites from './assetsManager/sprites.js'

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
const oldTimeSprite = new OldTimeSprite('test', spriteBounds, steps, 1)
for (let i = 0; i < steps; i++) {
    const position = new THREE.Vector2(0, 0)
    const rotation = Math.PI * i / steps
    oldTimeSprite.setStep(i, position, rotation)
}

oldTimeSprite.createMesh()
oldTimeSprite.add(scene)

const timeObject = new TimeObject({})
console.log(timeObject.selfTimeLineData)

const loadingManager = new THREE.LoadingManager()
const textureLoader = new THREE.TextureLoader(loadingManager)

const shipRectangle = new THREE.PlaneGeometry( 40, 50 )

const shipTexture = new THREE.MeshBasicMaterial()
shipTexture.transparent = true
shipTexture.side = THREE.DoubleSide
const shipColorTexture = textureLoader.load(sprites.ship1.colors)
shipColorTexture.colorSpace = THREE.SRGBColorSpace
shipTexture.map = shipColorTexture
const shipAlphaMap = textureLoader.load(sprites.ship1.alpha)
shipAlphaMap.colorSpace = THREE.SRGBColorSpace
shipTexture.alphaMap = shipAlphaMap
const shipSprite = new THREE.Mesh( shipRectangle, shipTexture )
shipSprite.position.z = 100
scene.add( shipSprite )

const pastShipTexture = new THREE.MeshBasicMaterial()
pastShipTexture.transparent = true
pastShipTexture.side = THREE.DoubleSide
const pastShipColorTexture = textureLoader.load(sprites.ship1.pastColors)
pastShipColorTexture.colorSpace = THREE.SRGBColorSpace
pastShipTexture.map = pastShipColorTexture
const pastShipAlphaMap = textureLoader.load(sprites.ship1.pastAlpha)
pastShipAlphaMap.colorSpace = THREE.SRGBColorSpace
pastShipTexture.alphaMap = pastShipAlphaMap
const pastShipSprite = new THREE.Mesh( shipRectangle, pastShipTexture )
pastShipSprite.position.y = -50
scene.add( pastShipSprite )

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
