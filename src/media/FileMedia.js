import fs from 'fs'
import BaseMedia from './BaseMedia'


export default class FileMedia extends BaseMedia {
    constructor(filename) {
        super()

        this.filename = filename
        this.filesize = fs.statSync(filename).size
    }

    streamNeeded(start, end, cb) {
        console.info("streamNeeded", start, end)
        cb(fs.createReadStream(this.filename, { start, end }))
    }
}
