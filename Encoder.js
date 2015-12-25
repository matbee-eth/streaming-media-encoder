var util = require('util'),
    Promise = require('bluebird'),
    express = require('express'),

    EventEmitter = require('events'),
    Engine = require('./Engine'),

    net = require('net'),
    uuid = require('node-uuid');

/**
 * The encoder is where the magic happens.
 * Communicates with a device specific profile via an express server with ffmpeg
 * provides streamable output that can be piped directly into (for instance) Express
 */
function Encoder(Media, Device) {

    this.media = Media;
    this.device = Device;

    /**
     * Proxy forwarder for profile getFFmpegFlags
     * @see BaseDeviceProfile.prototype.getFFmpegFlags
     * @return {Promise} promise that resolves with inputOptions and outputOptions
     */
    this.getFFmpegOptions = function() {
        var logger = this._log;
        if (!this.media.getMediaProfile()) {
            throw new Error("NO PROBE HAS BEEN DONE NOOB!");
        }
        logger("Engine.getFFmpegOptions");
        return this.media.getMediaProfile().getFFmpegFlags();
    };



    /**
     * Fetch probe media for info and start transcoding via ffmpeg
     * @param  {Engine}   engine  device specific engine to use
     * @param  {object}   options Options: (currently only startTime and force )
     * @param  {Function} cb      callback to execute on encoding progress
     */
    this.encode = function(engine, options) {
        engine.forceTranscode = options.force;
        if (!engine.hasProbed) {
            return Encoder.probe(engine, {}).then(function(metadata) {
                return Encoder.encode(engine, options);
            });
        } else {
            return engine.getFFmpegOptions(Encoder.getUrl(engine.id)).then(function(inputOptions, outputOptions) {
                _log('Got FFmpeg options :', inputOptions, outputOptions);

                var command = ffmpeg(Encoder.getUrl(engine.id));
                if (options.startTime) {
                    command.seekInput(options.startTime);
                }

                command.on('start', function(commandLine) {
                    _log('Spawned Ffmpeg with command: ', commandLine);
                }).on('error', function() {
                    console.error(arguments);
                });

                command.inputOptions(inputOptions);
                command.outputOptions(outputOptions);

                return command;
            }, function(err) {
                throw new Error('Encoder: Error on getting FFmpegOptions: ', err);
            });
        }
    },



    /**
     * Fetch loopback url for file or return base url
     * @param  {string} fileId Optional fileId to append
     * @return {string} url
     */
    this.getUrl = function(fileId) {
        return "http://127.0.0.1:" + ffmpegPort + "/" + (fileId || '');
    }

    /**
     * Proxy forwarder for BaseDeviceProfile.prototype.rescale
     * @see BaseDeviceProfile.prototype.rescale
     * @param  {int} size max video width
     * @return {Engine} returns `this` for fluent interfacing
     */
    this.rescale = function(size) {
        this._profile.rescale(size);
        return this;
    };

    /**
     * Proxy forwarder for BaseDeviceProfile.prototype.hardCodeSubtitle
     * @see BaseDeviceProfile.prototype.hardCodeSubtitle
     * @param  {string } full path to .srt file
     * @return {Engine} returns `this` for fluent interfacing
     */
    this.hardCodeSubtitle = function(path) {
        this._profile.hardCodeSubtitle(path);
        return this;
    };

    /**
     * Proxy forwarder for BaseDeviceProfile.prototype.correctAudioOffset
     * @see BaseDeviceProfile.prototype.correctAudioOffset
     * @param  {float} offset in seconds
     * @return {Engine} returns `this` for fluent interfacing
     */
    this.correctAudioOffset = function(seconds) {
        this._profile.correctAudioOffset(seconds);
        return this;
    };

};



_log = function() {
    if (encoder.debug) {
        console.log("ENCODER: ");
        console.log.apply(this, arguments);
    }
};

var encoder = new Encoder();
module.exports = encoder;