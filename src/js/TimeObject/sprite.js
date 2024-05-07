import * as THREE from 'three'

export default class Sprite {
    #scene
    #object
    get object () { return this.#object }

    get visible () { return this.#object.visible }
    set visible (isVisible) { this.#object.visible = isVisible }
    
    get position () { return this.#object.position }
    set position (position) { this.#object.position.copy(position) }

    get rotation () { return this.#object.rotation._z }
    set rotation (angle) { this.#object.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 1), angle)}
    
    #color
    #opacity
    // possible de mettre des setters améliorés au cas où

     /**
     * 
     * @param {Scene} scene 
     * @param {TextureLoader} textureLoader 
     * @param {number} width positive integer
     * @param {number} height positive integer
     * @param {{colorMap: image, alphaMap: image}} maps
     * @param {color} [color=0xFFFFFF] 
     * @param {number} [opacity=1] 
     */
     constructor (scene, textureLoader, width, height, maps, color = 0xFFFFFF, opacity = 1) {
        this.#scene = scene
        this.#color = color
        this.#opacity = opacity

        const rectangle = new THREE.PlaneGeometry(height, width)

        const texture = new THREE.MeshBasicMaterial({ color, opacity, transparent: true })
        texture.side = THREE.DoubleSide

        if (maps.colorMap) {
            const colorTexture = textureLoader.load(maps.colorMap)
            colorTexture.colorSpace = THREE.SRGBColorSpace
            texture.map = colorTexture
        }

        const alphaTexture = textureLoader.load(maps.alphaMap)
        alphaTexture.colorSpace = THREE.SRGBColorSpace
        texture.alphaMap = alphaTexture

        this.#object = new THREE.Mesh(rectangle, texture)
        scene.add(this.#object)
    }
    
    remove () {
        this.#object.geometry.dispose()
        this.#object.material.dispose()
        this.#scene.remove(this.#object)
    }
}