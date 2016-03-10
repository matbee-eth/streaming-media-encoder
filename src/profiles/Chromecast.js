import BaseDeviceProfile from './BaseDeviceProfile'


export default class ChromeCastProfile extends BaseDeviceProfile {
    static audioNeedsTranscodingCodecs = [
        "aac",
        "mp3",
        "vorbis",
    ];

    static videoNeedsTranscodingCodecs = [
        "h264",
        "x264",
        "vp8"
    ];

    static validFormats = [
        "matroska,webm",
        "mov,mp4,m4a,3gp,3g2,mj2",
        "mp3",
        "ogg"
    ];

    getFFmpegFlags(probeData, forceTranscode) {
        const analysis = this.transcodeNeeded(probeData)
        const { canPlay, formatNeedsTranscoding, audioNeedsTranscoding, videoNeedsTranscoding, isAudioMedia, isVideoMedia } = analysis

        let outputOptions = []
        let inputOptions = []

        if (isVideoMedia) {
            if (audioNeedsTranscoding || audioShiftCorrect) {
                if (audioShiftCorrect) {
                    inputOptions.push(audioShiftCorrect)
                }
                outputOptions.push("-acodec aac") // "-acodec libfdk_aac" -> requires custom ffmpeg build from src!
            } else {
                outputOptions.push("-acodec copy")
            }

            if (videoNeedsTranscoding || rescaleVideo || subtitle) {
                if (subtitle) {
                    outputOptions.push(subtitle)
                }
                if (rescaleVideo) {
                    outputOptions.push(rescaleVideo)
                }
                outputOptions.push("-vcodec libx264")
            } else {
                outputOptions.push("-vcodec copy")
            }
            outputOptions.push("-copyts")
            outputOptions.push("-preset ultrafast")
            outputOptions.push("-tune zerolatency")
            outputOptions.push("-f matroska")

        } else if (isAudioMedia) {
            console.log("VALID AUDIO?", audioNeedsTranscoding)
            if (audioNeedsTranscoding) {
                outputOptions.push("-acodec libvorbis")
                outputOptions.push("-f ogg")
            } else {
                outputOptions.push("-f " + probeData.format.format_name)
            }
        }

        return new Promise(resolve => resolve(inputOptions, outputOptions))
    }
}
