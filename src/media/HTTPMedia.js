import BaseMedia from './BaseMedia'

export default class HTTPMedia extends BaseMedia {
    constructor(url) {
        super()

        this.filename = url
        this.filesize = 0
    }
}
