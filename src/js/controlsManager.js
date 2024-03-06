class ControlsManager {

    #toggleFullScreen

    constructor () {
        this.#watchDoubleClick()
    }

    #watchDoubleClick () {
        window.addEventListener('dblclick', () => {
            this.#toggleFullScreen = true
        })
    }

    tick () {
        this.#toggleFullScreen = false
    }

}
