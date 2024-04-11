import * as THREE from 'three'
import { ViewManager } from './viewManager.js'
import { ControlsManager } from './controlsManager.js'

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

class TimeCurve extends THREE.Curve {

    #points = []

    constructor (points = [new THREE.Vector3()]) {
        super()
        // this.#points = points.map(point => point.clone())
        for (let i = 0; i <1000; i++) {
            const ix = i * 3 / 1000 - 1.5;
            const iy = Math.sin( 2 * Math.PI * i / 1000 );
            const iz = 0;
            this.#points.push(new THREE.Vector3(ix, iy, iz))
        }
    }

    getPoint (t, optionalTarget = new THREE.Vector3()) {
        const nbPoints = this.#points.length
        const closestIndex = Math.round(t * (nbPoints - 1))
        const pointA = this.#points[closestIndex].clone()
        pointA.multiplyScalar(100)

        const tx = t * 3 - 1.5;
		const ty = Math.sin( 2 * Math.PI * t );
		const tz = 0;
        const pointB = new THREE.Vector3(tx, ty, tz).multiplyScalar( 100 )

        console.log(pointA.x == pointB.x, pointA.y == pointB.y, pointA.z == pointB.z, pointA, pointB)

		return optionalTarget.copy(pointB);
    }
}

const path = new TimeCurve( 100 );
const geometry = new THREE.TubeGeometry( path, 20, 10, 8, false );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const mesh = new THREE.Mesh( geometry, material );
scene.add( mesh );

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
