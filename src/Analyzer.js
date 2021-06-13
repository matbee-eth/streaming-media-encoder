import ffmpeg from 'fluent-ffmpeg'
import ffmpegServer from './FFmpegServer'

// analyzer gets passed a file and knows how to reach the ffmpeg server
// performs ffmpeg probe on it
// extracts audio and video streams
export default class Analyzer {
    constructor = Media => this.media = Media;

    /**
     * ffprobe gathers information from multimedia streams and prints it in human- and machine-readable fashion.
     * this is needed by the engine to determine format info.
     */
    analyze() {
        console.log("Performing FFMPEG probe")
        return new Promise((resolve, reject) => {
            console.log("Get URL for media: ", this.media, ffmpegServer.getUrl(this.media));
            ffmpeg.ffprobe(ffmpegServer.getUrl(this.media), (err, metadata) => {
                console.log("FFProbe returned metadata: ", metadata, err)
                this.media.setMediaProfile(metadata)
                resolve(metadata)
            })
        })
    }

    canPlay() {
        if (!this.hasProbed) {
            return this.probe().then((metadata) => {
                return this.canPlay(metadata)
            }, (err) => {
                throw new Error("Error during probe on profile!", err);
            })
        } else {
            return this._profile.canPlay(this._probeData)
        }
    }
}
