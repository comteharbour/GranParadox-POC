import * as THREE from 'three'

export class TimeSprite {

    #steps // positive integer
    #stepHeight // float
    #sprite // référence vers une image (à clarifier)
    #spriteBounds // [vector2]
    #timeSpriteVertices
    #timeSpriteVerticesIndices
    #position // [vector2]
    #rotation // [float]
    #mesh

    constructor (sprite, spriteBounds, steps, stepHeight = 1) {
        this.#steps = steps
        this.#stepHeight = stepHeight
        this.#sprite = sprite
        this.#spriteBounds = spriteBounds
        this.#timeSpriteVertices = new Float32Array(steps * this.#spriteBounds.length * 3)
        this.#initializeTimeSpriteVerticesIndices()
        this.#position = []
        this.#rotation = []
    }

    #initializeTimeSpriteVerticesIndices () {
        this.#timeSpriteVerticesIndices = new Array(this.#steps * this.#spriteBounds.length * 6)
        for (let stepIndex = 0; stepIndex < this.#steps - 1; stepIndex++) {
            for (let boundIndex = 0; boundIndex < this.#spriteBounds.length; boundIndex++) {
                for (let triangleIndex = 0; triangleIndex < 2; triangleIndex++) {
                    for (let pointIndex = 0; pointIndex < 3; pointIndex++) {
                        this.#timeSpriteVerticesIndices[this.#getIndicesIndex(stepIndex,boundIndex,triangleIndex,pointIndex)] =
                            this.#getVerticesIndex(stepIndex, boundIndex, triangleIndex, pointIndex)
                    }
                }
            }
        }
    }

    #getIndicesIndex(stepIndex, boundIndex, triangleIndex, pointIndex) {
        const indicesBaseIndex = stepIndex * this.#spriteBounds.length * 6 // 2 triangles = 6 points par point du spriteBound
        const indicesBasePointIndex = indicesBaseIndex + boundIndex * 6
        const indicesBaseTriangleIndex = indicesBasePointIndex + triangleIndex * 3
        const indicesPointIndex = indicesBaseTriangleIndex + pointIndex
        return indicesPointIndex
    }

    #getVerticesIndex(stepIndex, boundIndex, triangleIndex, pointIndex) {
        const verticesBaseIndex = stepIndex * this.#spriteBounds.length 
        const verticesBasePointIndex = verticesBaseIndex + boundIndex
        const delta = this.#getVerticesIndexDelta(boundIndex, triangleIndex, pointIndex)
        const verticesIndex = verticesBasePointIndex + delta
        return verticesIndex
    }

    #getVerticesIndexDelta(bondIndex, triangleIndex, pointIndex) {
        const next = bondIndex == this.#spriteBounds.length - 1 ? 1 - this.#spriteBounds.length : 1
        const up = this.#spriteBounds.length
        if (triangleIndex == 0) {
            switch (pointIndex) {
                case 0: return 0
                case 1: return next
                case 2: return up + next
            }
        }
        if (triangleIndex == 1) {
            switch (pointIndex) {
                case 0: return 0
                case 1: return up + next
                case 2: return up
            }
        }
    }

    setStep (step, position, rotation) {
        this.#position[step] = position.clone()
        this.#rotation[step] = rotation

        const z = step * this.#stepHeight
        const previousIndices = step * this.#spriteBounds.length * 3

        for (let i = 0; i < this.#spriteBounds.length; i++) {
            const point = this.#spriteBounds[i].clone().add(position).rotateAround(position, rotation)
            const xIndex = previousIndices + 3 * i
            this.#timeSpriteVertices[xIndex] = point.x
            this.#timeSpriteVertices[xIndex + 1] = point.y
            this.#timeSpriteVertices[xIndex + 2] = z
        }
    }

    createMesh () {
        const positionsAttribute = new THREE.BufferAttribute(this.#timeSpriteVertices, 3)

        const geometry = new THREE.BufferGeometry()
        geometry.setIndex(this.#timeSpriteVerticesIndices)
        geometry.setAttribute('position', positionsAttribute)

        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            wireframe: true
        })
        this.#mesh = new THREE.Mesh(geometry, material)
    }

    add (scene) {
        scene.add(this.#mesh)
    }
}