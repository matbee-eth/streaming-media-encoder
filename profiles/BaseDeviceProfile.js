var Promise = require('bluebird');

/**
 * Base device profile to be extended with device specific implementations.
 */
function BaseDeviceProfile() {
     
    this.audioNeedsTranscodingCodecs = []; // fill these with audio codecs that the implemented device can handle natively
	this.videoNeedsTranscodingCodecs = []; // fill these with video codecs that the implemented device can handle natively
	this.validFormats = []; // fill these with video formats that the implemented device can handle natively

	this.transcodeOptions = {
		rescaleVideo : false, // BaseDeviceProfile.prototype.rescale
    	subtitle : false, // BaseDeviceProfile.prototype.hardCodeSubtitle
    	audioShiftCorrect : false // BaseDeviceProfile.prototype.correctAudioOffset
    };

    /**
     * @todo: whutz this?
     * @param  {[type]} probeData [description]
     * @return {[type]}           [description]
     */
	this.canPlayContainer = function (probeData) {
		throw new Error("canPlayContainer : Not Implemented");
	};

	/**
	 * Implement this method to return device specific ffmpeg flags for a probed media
	 * @param  {object} probeData  ffmpeg probe data
	 * @param  {[type]} forceTranscode force transcode even if native format?
	 * @return {Promise}                [description]
	 */
	this.getFFmpegFlags = function (probeData, forceTranscode) {
		throw new Error("getFFmpegFlags : Not Implemented!");
	};

}

/**
 * Downscale video while keeping aspect ratio to a max width
 * @param  {int} max width (720, 360, etc)
 * @return {DeviceProfile} returns `this` for fluent interfacing
 */
BaseDeviceProfile.prototype.rescale = function(size) {
   this.transcodeOptions.rescaleVideo = '-vf scale=trunc(oh*a/2)*2:'+size;
   return this;
};

/**
 * Hardcode a .srt by passing correction parameters to ffmpeg
 * @param  {string} full path to .srt file
 * @return {DeviceProfile} returns `this` for fluent interfacing
 */
BaseDeviceProfile.prototype.hardCodeSubtitle = function(path) {
    this.transcodeOptions.subtitle = '-vf subtitles='+path;
    return this;
};

/**
 * Fixes incorect audio offsets in video by passing correction parameters to ffmpeg
 * @param  {float} time time in seconds
 * @return {DeviceProfile} returns `this` for fluent interfacing
 */
BaseDeviceProfile.prototype.correctAudioOffset = function(time) {
	this.transcodeOptions.audioShiftCorrect = '-itsoffset '+time;
	return this;
};

/**
 * Check if the current device profile can natively play the audio tracks in the passed media 
 * @param  {probeData audioTracks} audioTracks array of audio tracks in the media
 * @return {boolean} can audio be played natively
 */
BaseDeviceProfile.prototype.canPlayAudio = function (audioTracks) {
    if (audioTracks.length === 0) {
        return true;
    }
    return this.audioNeedsTranscodingCodecs.indexOf(audioTracks[0].codec_name) > -1;
};

/**
 * Check if the current device profile can natively play the video tracks in the passed media 
 * @param  {probeData videoTracks} videoTracks array of video tracks in the media
 * @return {boolean} can video be played natively
 */
BaseDeviceProfile.prototype.canPlayVideo = function (videoTracks) {
    if (videoTracks.length === 0) {
        return true;
    }
    var track = videoTracks[0];
    if (this.videoNeedsTranscodingCodecs.indexOf(track.codec_name) > -1 && ["h264", "x264"].indexOf(track.codec_name) > -1) {
        if (track.profile && track.profile.toLowerCase() == "high") {
            return (track.level >= 30 && (track.level == 50 || track.level <= 42));
        } 
    } 
    return false;
};

/**
 * Figure out if a video profile needs transcoding for this device profile
 * @throws Error if media probeData was invalid media 
 * @param  {object} probeData ProbeData input frome Engine.probe
 * @return {object} object with boolean values and keys: isAudioMedia, isVideoMedia, needsTranscoding, videoNeedsTranscoding, audioNeedsTranscoding
 */
BaseDeviceProfile.prototype.transcodeNeeded = function(probeData) {
    var isAudioMedia = isAudio(probeData);
    var isVideoMedia = isVideo(probeData);
    var audioNeedsTranscoding = false;
    var videoNeedsTranscoding = false;
    var needsTranscoding = true;
    var formatNeedsTranscoding = this.validFormats.indexOf(probeData.format.format_name) === -1;
    if (!isAudioMedia && !isVideoMedia) {
        throw new Error("Invalid media. Not video or audio.");
    }
    if (isAudioMedia) {
        audioNeedsTranscoding = !this.canPlayAudio(getAudioTracks(probeData));
        needsTranscoding = audioNeedsTranscoding || videoNeedsTranscoding;
    } else if (isVideoMedia) {
        audioNeedsTranscoding = !this.canPlayAudio(getAudioTracks(probeData));
        videoNeedsTranscoding = !this.canPlayVideo(getVideoTracks(probeData));
        needsTranscoding = formatNeedsTranscoding || audioNeedsTranscoding || videoNeedsTranscoding;
    }
    
    return {   
        isAudioMedia: isAudioMedia,
        isVideoMedia: isVideoMedia,
        needsTranscoding: needsTranscoding,
        videoNeedsTranscoding: videoNeedsTranscoding,
        audioNeedsTranscoding: audioNeedsTranscoding,
    };
};

/**
 * Check if the current device profile can play a specific video without transcoding 
 * @param  {object} probeData ffmpeg probe data
 * @return {Promise} Promise that resolves with boolean
 */
BaseDeviceProfile.prototype.canPlay = function (probeData) {
    return this.transcodeNeeded(probeData).then(function(analyzed) {
    	return !analyzed.needsTranscoding;
    });
};


/**
 * Helper function to fetch video steam info from ffmpeg probe data
 * @param  {object} probeData ffmpeg probe data
 * @return {array} array of ffmpeg video streams
 */
var getVideoTracks = function(probeData) {
    return (probeData.streams || []).filter(function(stream) {
        return stream.codec_type == "video" && stream.disposition.attached_pic === 0;
    });
};

/**
 * Helper function to fetch audio steam info from ffmpeg probe data
 * @param  {object} probeData ffmpeg probe data
 * @return {array} array of ffmpeg audio streams
 */
var getAudioTracks = function(probeData) {
    return (probeData.streams || []).filter(function(stream) {
        return stream.codec_type == "audio";
    });
};

/**
 * Helper function to check if probed media is an audio file 
 * @param  {object} probeData ffmpeg probe data
 * @return {boolean} isAudio
 */
var isAudio = function(probeData) {
    return getAudioTracks(probeData).length > 0 && getVideoTracks(probeData).length === 0;
};

/**
 * Helper function to check if probed media is a video file 
 * @param  {object} probeData ffmpeg probe data
 * @return {boolean} isVideo
 */
var isVideo = function(probeData) {
    return getVideoTracks(probeData).length > 0;
};


module.exports = BaseDeviceRemote;