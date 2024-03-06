export class ControlsManager {

    #toggleFullScreen

    constructor () {
        this.#watchDoubleClick()
    }

    #watchDoubleClick () {
        window.addEventListener('dblclick', () => {
            this.#toggleFullScreen = true
        })
    }

    getInputs () {
        return {
            toggleFullScreen: this.#toggleFullScreen
        }
    }

    tick () {
        this.#toggleFullScreen = false
    }

}
