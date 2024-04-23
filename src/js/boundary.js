import * as THREE from 'three'

export default class Boundary {
    
    #activeEpochBorder
    #globalRules

    constructor (globalRules, scene, textureLoader, sprites) {
        this.#globalRules = globalRules
        this.#createBottom(globalRules, scene, textureLoader, sprites)
        this.#createVerticalBorders(globalRules, scene, textureLoader, sprites)
        this.#createActiveEpochBorder(globalRules, scene)
    }

    setEpoch (epoch) {
        this.#activeEpochBorder.position.z = this.#globalRules.getZAtEpoch(epoch)
    }

    #createBottom (globalRules, scene, textureLoader, sprites) {
        const geometryBottom = new THREE.PlaneGeometry(globalRules.fieldWidth, globalRules.fieldHeight)
        const materialBottom = new THREE.MeshBasicMaterial({ color: 0x005000 })
        materialBottom.wireframe = true
        const bottom = new THREE.Mesh(geometryBottom, materialBottom)
        scene.add(bottom)
    }

    #createVerticalBorders (globalRules, scene, textureLoader, sprites) {
        const textureVertical = textureLoader.load(sprites.vertical)
        const materialVertical = new THREE.MeshBasicMaterial()
        materialVertical.map = textureVertical
        materialVertical.wireframe = true

        const geometryWidth = new THREE.PlaneGeometry(globalRules.getZAtEpoch(globalRules.totalTicks), globalRules.fieldWidth)

        const south = new THREE.Mesh(geometryWidth, materialVertical)
        south.rotateZ(Math.PI / 2)
        south.rotateY(Math.PI / 2)
        south.position.set(0, - globalRules.fieldHeight / 2, globalRules.getZAtEpoch(globalRules.totalTicks) / 2)
        scene.add(south)

        const north = new THREE.Mesh(geometryWidth, materialVertical)
        north.rotateZ(- Math.PI / 2)
        north.rotateY(Math.PI / 2)
        north.position.set(0, globalRules.fieldHeight / 2, globalRules.getZAtEpoch(globalRules.totalTicks) / 2)
        scene.add(north)

        const geometryHeight = new THREE.PlaneGeometry(globalRules.getZAtEpoch(globalRules.totalTicks), globalRules.fieldHeight)

        const west = new THREE.Mesh(geometryHeight, materialVertical)
        west.rotateY(Math.PI / 2)
        west.position.set(- globalRules.fieldWidth / 2, 0, globalRules.getZAtEpoch(globalRules.totalTicks) / 2)
        scene.add(west)

        const east = new THREE.Mesh(geometryHeight, materialVertical)
        east.rotateZ(Math.PI)
        east.rotateY(Math.PI / 2)
        east.position.set(globalRules.fieldWidth / 2, 0, globalRules.getZAtEpoch(globalRules.totalTicks) / 2)
        scene.add(east)
    }

    #createActiveEpochBorder (globalRules, scene) {
        const activeEpochBorderOffset = 1
        const right = globalRules.fieldWidth / 2 - activeEpochBorderOffset
        const left = - right
        const up = globalRules.fieldHeight / 2 - activeEpochBorderOffset
        const down = - up
        const points = [
            new THREE.Vector3(right, up, 0),
            new THREE.Vector3(left, up, 0),
            new THREE.Vector3(left, down, 0),
            new THREE.Vector3(right, down, 0)
        ]
        const materialLine = new THREE.LineBasicMaterial({ color: 0x0000ff })
        const geometryLine = new THREE.BufferGeometry().setFromPoints(points)
        this.#activeEpochBorder = new THREE.LineLoop( geometryLine, materialLine )
        scene.add(this.#activeEpochBorder)
    }
}