var util = require('util'),
    Promise = require('bluebird');
    BaseDeviceProfile = require('./BaseDeviceProfile');

function ChromeCastProfile() {
    BaseDeviceProfile.call(this);

    this.audioNeedsTranscodingCodecs = [
        "aac",
        "mp3",
        "vorbis",
    ];

    this.videoNeedsTranscodingCodecs = [
        "h264",
        "x264",
        "vp8"
    ];

    this.validFormats = [
        "matroska,webm",
        "mov,mp4,m4a,3gp,3g2,mj2",
        "mp3",
        "ogg"
    ];


    this.getFFmpegFlags = function (probeData, forceTranscode) {
        var analysis = this.transcodeNeeded(probeData),
            canPlay = analysis.needsTranscoding,
            formatNeedsTranscoding = analysis.formatNeedsTranscoding,
            audioNeedsTranscoding = analysis.audioNeedsTranscoding,
            videoNeedsTranscoding = analysis.videoNeedsTranscoding,
            outputOptions = [],
            inputOptions = [];

        if (analysis.isVideoMedia) {
            if (audioNeedsTranscoding || audioShiftCorrect) {
                if(audioShiftCorrect) {
                    inputOptions.push(audioShiftCorrect);
                }
                    outputOptions.push("-acodec aac"); // "-acodec libfdk_aac" -> requires custom ffmpeg build from src!
                } else {
                    outputOptions.push("-acodec copy");
                }
                
                if (videoNeedsTranscoding || rescaleVideo || subtitle) {
                    if(subtitle) {
                        outputOptions.push(subtitle);
                    }
                    if(rescaleVideo) {
                        outputOptions.push(rescaleVideo);
                    }
                    outputOptions.push("-vcodec libx264");
                } else {
                    outputOptions.push("-vcodec copy");
                }
                outputOptions.push("-copyts");
                outputOptions.push("-preset ultrafast");
                outputOptions.push("-tune zerolatency");
                outputOptions.push("-f matroska");
                
            } else if (analysis.isAudioMedia) {
            console.log("VALID AUDIO?", audioNeedsTranscoding);
            if (audioNeedsTranscoding) {
                outputOptions.push("-acodec libvorbis");
                outputOptions.push("-f ogg");
            } else {
                outputOptions.push("-f " + probeData.format.format_name);
            }
        }
        return new Promise(function(resolve) {
            resolve(inputOptions, outputOptions);
        });
    };
}
util.inhertis(ChromeCastProfile, BaseDeviceProfile);

module.exports = new ChromeCastProfile();