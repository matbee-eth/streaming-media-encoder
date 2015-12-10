var validAudioCodecs = [
    "aac",
    "mp3",
    "vorbis",
]

var validVideoCodecs = [
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
    return validAudioCodecs.indexOf(audioTracks[0].codec_name) > -1;
};
var canPlayVideo = function (videoTracks) {
    if (validVideoCodecs.indexOf(videoTracks[0].codec_name) > -1) {
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
            return true;
        }
    } else {
        return false;
    }
};

var transcodeNeeded = function(probeData, cb) {
    var isAudioMedia = isAudio(probeData);
    var isVideoMedia = isVideo(probeData);
    var validAudio = false;
    var validVideo = false;
    var needsTranscode = true;
    var validFormat = validFormats.indexOf(probeData.format.format_name) > -1;
    if (isAudioMedia) {
        // Audio-only.
        validAudio = canPlayAudio(getAudioTracks(probeData));
    } else if (isVideoMedia) {
        // Video file.
        validAudio = canPlayAudio(getAudioTracks(probeData));
        validVideo = canPlayVideo(getVideoTracks(probeData));
    } else {
        return cb && cb("invalid");
    }
    if (isAudioMedia) {
        if (!validAudio || !validFormat) {
            needsTranscode = true;
        } else {
            needsTranscode = false;
        }
    } else if (isVideoMedia) {
        if (!validFormat || !validAudio || !validVideo) {
            needsTranscode = true;
        } else {
            needsTranscode = false;
        }
    }
    
    
    cb && cb(null,
        {   
            isAudioMedia: isAudioMedia,
            isVideoMedia: isVideoMedia,
            needsTranscode: needsTranscode,
            validFormat: validFormat,
            validAudio: validAudio,
            validVideo: validVideo
        }
    );
};

var canPlayContainer = function (probeData, cb) {

};

var getFFmpegFlags = function (probeData, cb) {
    transcodeNeeded(probeData, function (err, obj) {
        var canPlay = obj.needsTranscode;
        var validFormat = obj.validFormat;
        var validAudio = obj.validAudio;
        var validVideo = obj.validVideo;

        var outputOptions = [];

        if (obj.isVideo) {
            if (!validAudio) {
                outputOptions.push("-acodec libfdk_aac");
            } else {
                outputOptions.push("-acodec copy");
            }
            if (!validVideo) {
                outputOptions.push("-vcodec libx264");
            } else {
                outputOptions.push("-vcodec copy");
            }
            outputOptions.push("-copyts");
            outputOptions.push("-preset ultrafast");
            outputOptions.push("-tune zerolatency");
            outputOptions.push("-f matroska");
        } else if (obj.isAudio) {
            console.log("VALID AUDIO?", validAudio);
            if (!validAudio) {
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
        cb && cb(!obj.needsTranscode);
    });
}

module.exports = {
    canPlay: canPlay,
    canPlayAudio: canPlayAudio,
    canPlayVideo: canPlayVideo,
    canPlayContainer: canPlayContainer,
    getFFmpegFlags: getFFmpegFlags
}