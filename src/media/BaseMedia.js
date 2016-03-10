import { v4 as uuid } from 'node-uuid'


// BaseMedia is a generic wrapper for file, url, magnet, torrent, stream
export default class BaseMedia {
    static id = uuid();
    isAnalyzed = false;
    profile = null;
    filesize = null;
    filename = null;

    setSize = size => this.filesize = size;
    setFileName = size => this.filesize = size;

    setMediaProfile(profile) {
        console.log("Base Media Profile set for ", this.filename, profile)
        this.profile = profile
        this.isAnalyzed = true
    }

    streamNeeded(startByte, endByte, cb) {
        throw new Error("StreamNeeded: Not implemented!", this)
    }
}