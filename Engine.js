var util = require('util'),
     EventEmitter = require('events'),
     pump = require('pump'),
     rangeParser = require('range-parser'),
     ffmpeg = require('fluent-ffmpeg'),
     Promise = require('bluebird');

/**
 * Converter engine that  knows how to decode video for device profile
 * @param  {Profile} profile  one of encoder.profiles
 * @param {integer} fileSize file size of media at url
 * @param {uuid} id UUID for this engine instance
 * @param {string} url url where media can be found on the ffmpeg server
 */
function Engine(profile, fileSize, id, url) {
    EventEmitter.call(this);
    this.debug = profile.debug || false;
    this._log("Engine", profile, id);
    this._profile = profile;
    this._fileSize = fileSize;
    this.contentType = 'video/mp4';
    this.id = id;
    this.url = url;
    this.hasProbed = false;
    this.forceTranscode = false;
}

util.inherits(Engine, EventEmitter);

Engine.prototype._log = function() {
  if(this.debug) {
    console.log("ENGINE: ");
    console.log.apply(this, arguments);
  }
};

Engine.prototype.onHeadRequest = function (req, res) {
    this._log("onHeadRequest", req, res);
    res.end();
};

Engine.prototype.onRequest = function(req, res) {
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', this.contentType);
    res.statusCode = 200;
    var range;
    if (req.headers.range) {
        range = rangeParser(this._fileSize, req.headers.range)[0];
        res.setHeader(
          'Content-Range',
          'bytes ' + range.start + '-' + range.end + '/' + this._fileSize
        );
        res.setHeader('Content-Length', range.end - range.start + 1);
    } else {
        res.setHeader('Content-Length', this._fileSize);
    }
    this.emit("streamNeeded", range.start, range.end, function (stream) {
        stream.pipe(res);
        stream.on('end', function () {
            res.end();
        });
    });
};

/**
 * Proxy forwarder for profile getFFmpegFlags
 * @see BaseDeviceProfile.prototype.getFFmpegFlags
 * @return {Promise} promise that resolves with inputOptions and outputOptions
 */
Engine.prototype.getFFmpegOptions = function() {
    var logger = this._log;
    if (!this.hasProbed) {
        throw new Error("NO PROBE HAS BEEN DONE NOOB!");
    }
    logger("Engine.getFFmpegOptions");
    return this._profile.getFFmpegFlags(this._probeData, this.forceTranscode);
};

/**
 * Probe media for metadtata and determine if the current profile can natively play it
 * @return {Promise} Promise that resolves with isNativeFormat boolean
 */
Engine.prototype.canPlay = function() {
    if (!this.hasProbed) {
        return this.probe().then(function(metadata) {
            return this.canPlay(metadata);
        }, function(err) {
            throw new Error("Error during probe on profile!", err);
        });
    } else {
        return this._profile.canPlay(this._probeData);
    }
};

/**
 * Analyze video media with ffMpeg probe and determine if media needs transcoding
 * @see BaseProfile.prototype.transcodeNeeded
 * @return {object} BaseProfile.prototype.transcodeNeeded result
 */
Engine.prototype.analyze = function() {
    if (!this.hasProbed) {
        return this.probe().then(this.analyze.bind(this));
    } else {
        return this._profile.transcodeNeeded(this._probeData);
    }
};

/**
 * Probe the media's metadata via ffmpeg or return cached copy
 * @return {Promise} promise that resolves with ffmpeg probe data
 */
Engine.prototype.probe = function() {
    if (this.hasProbed) {
       return new Promise(function(resolve) {
            resolve(this._probeData);
        }.bind(this));
    } else {
        return new Promise(function(resolve, reject) {
            ffmpeg.ffprobe(this.url, function(err, metadata) {
                this.hasProbed = true;
                this._probeData = metadata;
                resolve(metadata);
            }.bind(this));
        });
    }
};

/**
 * Proxy forwarder for BaseDeviceProfile.prototype.rescale
 * @see BaseDeviceProfile.prototype.rescale
 * @param  {int} size max video width
 * @return {Engine} returns `this` for fluent interfacing
 */
Engine.prototype.rescale = function(size) {
    this._profile.rescale(size);
    return this;
};

/**
 * Proxy forwarder for BaseDeviceProfile.prototype.hardCodeSubtitle
 * @see BaseDeviceProfile.prototype.hardCodeSubtitle
 * @param  {string } full path to .srt file
 * @return {Engine} returns `this` for fluent interfacing
 */
Engine.prototype.hardCodeSubtitle = function(path) {
    this._profile.hardCodeSubtitle(path);
    return this;
};

/**
 * Proxy forwarder for BaseDeviceProfile.prototype.correctAudioOffset
 * @see BaseDeviceProfile.prototype.correctAudioOffset
 * @param  {float} offset in seconds
 * @return {Engine} returns `this` for fluent interfacing
 */
Engine.prototype.correctAudioOffset = function(seconds) {
    this._profile.correctAudioOffset(seconds);
    return this;
};

module.exports = Engine;