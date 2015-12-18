var util = require('util'),
    Promise = require('bluebird');
    BaseDeviceProfile = require('./BaseDeviceProfile');

function DLNAProfile() {
    BaseDeviceProfile.call(this);

    this.audioNeedsTranscodingCodecs = [
        "aac",
    ];

    this.videoNeedsTranscodingCodecs = [
        "h264"
    ];

    this.validFormats = [
        "mp4,m4a",
        "mp3"
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
                outputOptions.push("-acodec aac");
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
            outputOptions.push("-crf 28");
            outputOptions.push("-bsf:v h264_mp4toannexb");
            outputOptions.push("-f mp4");
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

util.inherits(DLNAProfile, BaseDeviceProfile);

module.exports = new DLNAProfile();