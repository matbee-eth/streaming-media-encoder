// analyzer gets passed a file and knows how to reach the ffmpeg server
// performs ffmpeg probe on it
// extracts audio and video streams

var ffmpegServer = require('./FFmpegServer'),
    ffmpeg = require('fluent-ffmpeg'),
    Promise = require('bluebird');


function Analyzer() {

    "http://127.0.0.1:" + ffmpegPort + "/"


    /**
     * ffprobe gathers information from multimedia streams and prints it in human- and machine-readable fashion.
     * this is needed by the engine to determine format info.
     * @param  {Engine}   engine  encoding engine to pass data to
     * @param  {object}   options ffprobe options, currently unused
     * @param  {Function} cb callback when probe is ready
     */
    this.analyze = function(engine, options, cb) {
        _log("probing engine for data", engine, options);
        return new Promise(function(resolve, reject) {
            if (engine.hasProbed) {
                resolve(engine.probeData);
            } else {
                ffmpeg.ffprobe(Encoder.getUrl(engine.id), function(err, metadata) {
                    engine.setProbeData(metadata);
                    resolve(metadata);
                });
            }
        });
    };


    this.canPlay = function() {
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
    this.analyze = function() {
        if (!this.hasProbed) {
            return this.probe().then(this.analyze.bind(this));
        } else {
            return this._profile.transcodeNeeded(this._probeData);
        }
    };

}


module.exports = Analyzer;