import * as THREE from 'three'
import sprites from '../../assetsManager/sprites'

export default class TimeTube {

    #timeTube
    #timeCurve
    #scene
    #textureLoader

    constructor (scene, textureLoader) {
        this.#scene = scene
        this.#textureLoader = textureLoader
        this.#timeCurve = new TimeCurve()

        const texture = this.#textureLoader.load(sprites.ship1.colorMap)
        texture.colorSpace = THREE.SRGBColorSpace
        texture.map = texture

        const geometry = new THREE.TubeGeometry(this.#timeCurve, 20, 10, 8, false)
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff, map: texture })
        this.#timeTube = new THREE.Mesh(geometry, material)
        this.#scene.add(this.#timeTube)
    }

    /**
     * 
     * @param {THREE.Vector3} point 
     */
    setPoint (point, selfTimeLineEpoch) {
        this.#timeCurve.setPoint(point, selfTimeLineEpoch)
    }
}

class TimeCurve extends THREE.Curve {

    #points = []

    constructor (points = [new THREE.Vector3()]) {
        super()
        // this.#points = points.map(point => point.clone())
        for (let i = 0; i <1000; i++) {
            this.#points.push(new THREE.Vector3(i, i, 0))
        }
    }

    getPoint (t, optionalTarget = new THREE.Vector3()) {
        const nbPoints = this.#points.length
        const closestIndex = Math.round(t * (nbPoints - 1))
        const point = this.#points[closestIndex]
        optionalTarget.copy(point)
        return optionalTarget
    }

    /**
     * 
     * @param {THREE.Vector3} point 
     * @param {number} timeCurveEpoch 
     */
    setPoint (point, timeCurveEpoch) {
        if (timeCurveEpoch == this.#points.length) {
            this.#points.push(point.clone())
            return
        }
        if (timeCurveEpoch >= 0 && timeCurveEpoch < this.#points.length) {
            this.#points[timeCurveEpoch].copy(point)
        }
    }
}