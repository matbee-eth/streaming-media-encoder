var audioNeedsTranscodingCodecs = [
    "aac",
    "mp3",
    "vorbis",
];

var videoNeedsTranscodingCodecs = [
    "h264",
    "x264",
    "vp8"
];

var validFormats = [
    "matroska,webm",
    "mov,mp4,m4a,3gp,3g2,mj2",
    "mp3",
    "ogg"
];

var rescaleVideo = false;
var subtitle = false;

var getVideoTracks = function(probeData) {
    return (probeData.streams || []).filter(function(stream) {
        return stream.codec_type == "video" && stream.disposition.attached_pic === 0;
    });
};
var getAudioTracks = function(probeData) {
    return (probeData.streams || []).filter(function(stream) {
        return stream.codec_type == "audio";
    });
};
var isAudio = function(probeData) {
    return getAudioTracks(probeData).length > 0 && getVideoTracks(probeData).length === 0;
};

var isVideo = function(probeData) {
    return getVideoTracks(probeData).length > 0;
};

var canPlayAudio = function (audioTracks) {
    if (audioTracks.length === 0) {
        return true;
    }
    return audioNeedsTranscodingCodecs.indexOf(audioTracks[0].codec_name) > -1;
};

var canPlayVideo = function (videoTracks) {
    if (videoTracks.length === 0) {
        return true;
    }
    var track = videoTracks[0];
    if (videoNeedsTranscodingCodecs.indexOf(track.codec_name) > -1 && ["h264", "x264"].indexOf(track.codec_name) > -1) {
        if (track.profile && track.profile.toLowerCase() == "high") {
            return (track.level >= 30 && (track.level == 50 || track.level <= 42));
        } 
    } 
    return false;
};

var transcodeNeeded = function(probeData, cb) {
    var isAudioMedia = isAudio(probeData);
    var isVideoMedia = isVideo(probeData);
    var audioNeedsTranscoding = false;
    var videoNeedsTranscoding = false;
    var needsTranscoding = true;
    var formatNeedsTranscoding = validFormats.indexOf(probeData.format.format_name) === -1;
    if (!isAudioMedia && !isVideoMedia) {
        throw new Error("Invalid media. Not video or audio.");
    }
    if (isAudioMedia) {
        audioNeedsTranscoding = !canPlayAudio(getAudioTracks(probeData));
        needsTranscoding = audioNeedsTranscoding || videoNeedsTranscoding;
    } else if (isVideoMedia) {
        audioNeedsTranscoding = !canPlayAudio(getAudioTracks(probeData));
        videoNeedsTranscoding = !canPlayVideo(getVideoTracks(probeData));
        needsTranscoding = formatNeedsTranscoding || audioNeedsTranscoding || videoNeedsTranscoding;
    }
    
    cb && cb(null, {   
            isAudioMedia: isAudioMedia,
            isVideoMedia: isVideoMedia,
            needsTranscoding: needsTranscoding,
            videoNeedsTranscoding: videoNeedsTranscoding,
            audioNeedsTranscoding: audioNeedsTranscoding,
        });
};

var canPlayContainer = function (probeData, cb) {

};

var getFFmpegFlags = function (probeData, forceTranscode, cb) {
    transcodeNeeded(probeData, function (err, obj) {
        var canPlay = obj.needsTranscoding;
        var formatNeedsTranscoding = obj.formatNeedsTranscoding;
        var audioNeedsTranscoding = obj.audioNeedsTranscoding;
        var videoNeedsTranscoding = obj.videoNeedsTranscoding;

        var outputOptions = [];

        if (obj.isVideoMedia) {
            if (audioNeedsTranscoding) {
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
            
        } else if (obj.isAudioMedia) {
            console.log("VALID AUDIO?", audioNeedsTranscoding);
            if (audioNeedsTranscoding) {
                outputOptions.push("-acodec libvorbis");
                outputOptions.push("-f ogg");
            } else {
                outputOptions.push("-f " + probeData.format.format_name);
            }
        }
        cb && cb(null, outputOptions);
        return outputOptions;
    });
};

var canPlay = function (probeData, cb) {
    transcodeNeeded(probeData, function (err, obj) {
        cb && cb(!obj.needsTranscoding);
    });
};

var rescale = function(size) {
   rescaleVideo = '-vf scale=trunc(oh*a/2)*2:'+size;
};

var loadSubtitle = function(path) {
    subtitle = '-vf subtitles='+path;
};

module.exports = {
    canPlay: canPlay,
    canPlayAudio: canPlayAudio,
    canPlayVideo: canPlayVideo,
    canPlayContainer: canPlayContainer,
    getFFmpegFlags: getFFmpegFlags,
    transcodeNeeded: transcodeNeeded,
    rescale: rescale,
    loadSubtitle: loadSubtitle
}