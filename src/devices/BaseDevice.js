import { v4 as uuid } from 'node-uuid'

/**
 * BaseDevice that defines shared functionality
 */

export default class BaseDevice {
    constructor(client) {
        this.client = client
    }

    static id = uuid();

    name = 'Unknown';
    ip = null;
    contentType = null;

    setContentType = type => this.contentType = type;

    handleSeek(req, res) {
        throw new Error("HANDLESEEK Not Implemented!")
    }

    /**
     * cast media to a device
     * @param  {string} url     url to transcoder to use
     * @param  {object} options options like media mime type, title, etc.
     * @return {Promise}         Promise that resolves with result
     */
    cast(url, options) {
        throw new Error("CAST Not implemented!")
    }

    play() {
        throw new Error("PLAY Not implemented!")
    }

    pause() {
        throw new Error("PAUSE Not implemented!");
    }

    stop() {
        throw new Error("STOP Not implemented!");
    }

    toJSON() {
        let out = {}
        try {
            Object.keys(this).map((key) => {
                if (key == 'client') return
                else out[key] = this[key]
            })
        } catch (E) {
            console.error(E);
            throw E
        }
        return out
    }
}
