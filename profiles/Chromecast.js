var audioNeedsTranscodingCodecs = [
    "aac",
    "mp3",
    "vorbis",
]

var videoNeedsTranscodingCodecs = [
    "h264",
    "x264",
    "vp8"
]

var validFormats = [
    "matroska,webm",
    "mov,mp4,m4a,3gp,3g2,mj2",
    "mp3",
    "ogg"
]

var getVideoTracks = function(probeData) {
    var out = [];
    for (var i = 0; i < probeData.streams.length; i++) {
        var stream = probeData.streams[i];
        if (stream.codec_type == "video" && stream.disposition.attached_pic == 0) {
            out.push(stream);
        }
    }
    return out;
};
var getAudioTracks = function(probeData) {
    var out = [];
    for (var i = 0; i < probeData.streams.length; i++) {
        var stream = probeData.streams[i];
        if (stream.codec_type == "audio") {
            out.push(stream);
        }
    }
    return out;
};
var isAudio = function(probeData) {
    if (getAudioTracks(probeData).length > 0 && getVideoTracks(probeData).length == 0) {
        return true;
    }
    return false;
};
var isVideo = function(probeData) {
    if (getVideoTracks(probeData).length > 0) {
        return true;
    }
    return false;
};
var canPlayAudio = function (audioTracks) {
    return audioNeedsTranscodingCodecs.indexOf(audioTracks[0].codec_name) > -1;
};
var canPlayVideo = function (videoTracks) {
    if (videoNeedsTranscodingCodecs.indexOf(videoTracks[0].codec_name) > -1) {
        if (videoTracks[0].codec_name == "h264" || videoTracks[0].codec_name == "x264") {
            if (videoTracks[0].profile && videoTracks[0].profile.toLowerCase() == "high") {
                if (videoTracks[0].level >= 30 && (videoTracks[0].level == 50 || videoTracks[0].level <= 42)) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } else {
            return false;
        }
    } else {
        return false;
    }
};

var transcodeNeeded = function(probeData, cb) {
    var isAudioMedia = isAudio(probeData);
    var isVideoMedia = isVideo(probeData);
    var audioNeedsTranscoding = false;
    var videoNeedsTranscoding = false;
    var needsTranscoding = true;
    var videoNeedsTranscoding = validFormats.indexOf(probeData.format.format_name) > -1;
    if (isAudioMedia) {
        // Audio-only.
        audioNeedsTranscoding = canPlayAudio(getAudioTracks(probeData));
    } else if (isVideoMedia) {
        // Video file.
        audioNeedsTranscoding = canPlayAudio(getAudioTracks(probeData));
        videoNeedsTranscoding = canPlayVideo(getVideoTracks(probeData));
    } else {
        return cb && cb("invalid");
    }
    if (isAudioMedia) {
        if (!audioNeedsTranscoding || !videoNeedsTranscoding) {
            needsTranscoding = true;
        } else {
            needsTranscoding = false;
        }
    } else if (isVideoMedia) {
        if (!videoNeedsTranscoding || !audioNeedsTranscoding || !videoNeedsTranscoding) {
            needsTranscoding = true;
        } else {
            needsTranscoding = false;
        }
    }
    
    
    cb && cb(null,
        {   
            isAudioMedia: isAudioMedia,
            isVideoMedia: isVideoMedia,
            needsTranscoding: needsTranscoding,
            videoNeedsTranscoding: videoNeedsTranscoding,
            audioNeedsTranscoding: audioNeedsTranscoding,
            videoNeedsTranscoding: videoNeedsTranscoding
        }
    );
};

var canPlayContainer = function (probeData, cb) {

};

var getFFmpegFlags = function (probeData, cb) {
    transcodeNeeded(probeData, function (err, obj) {
        var canPlay = obj.needsTranscoding;
        var formatNeedsTranscoding = obj.formatNeedsTranscoding;
        var audioNeedsTranscoding = obj.audioNeedsTranscoding;
        var videoNeedsTranscoding = obj.videoNeedsTranscoding;

        var outputOptions = [];

        if (obj.isVideoMedia) {
            if (!audioNeedsTranscoding) {
                outputOptions.push("-acodec libfdk_aac");
            } else {
                outputOptions.push("-acodec copy");
            }
            if (!videoNeedsTranscoding) {
                outputOptions.push("-vcodec libx264");
            } else {
                outputOptions.push("-vcodec copy");
            }
            outputOptions.push("-copyts");
            outputOptions.push("-preset ultrafast");
            outputOptions.push("-tune zerolatency");
            outputOptions.push("-f matroska");
        } else if (obj.isAudioMedia) {
            console.log("VALID AUDIO?", audioNeedsTranscoding);
            if (!audioNeedsTranscoding) {
                outputOptions.push("-acodec libvorbis");
                outputOptions.push("-f ogg");
            } else {
                outputOptions.push("-f " + probeData.format.format_name);
            }
        }
        cb && cb(null, outputOptions);
        return outputOptions;
    })
};

var canPlay = function (probeData, cb) {
    transcodeNeeded(probeData, function (err, obj) {
        cb && cb(!obj.needsTranscoding);
    });
}

module.exports = {
    canPlay: canPlay,
    canPlayAudio: canPlayAudio,
    canPlayVideo: canPlayVideo,
    canPlayContainer: canPlayContainer,
    getFFmpegFlags: getFFmpegFlags,
    transcodeNeeded: transcodeNeeded
}