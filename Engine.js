var util = require('util'),
    EventEmitter = require('events'),
    uuid = require('node-uuid'),
    pump = require('pump'),
    rangeParser = require('range-parser'),
    Promise = require('bluebird'),
    DeviceList = require('./DeviceList'),
    Streamer = require('./Streamer'),
    Analyzer = require('./Analyzer');

/**
 * Converter engine that  knows how to decode video for device profile
 * @param  {Profile} profile  one of encoder.profiles
 * @param {integer} fileSize file size of media at url
 * @param {uuid} id UUID for this engine instance
 * @param {string} url url where media can be found on the ffmpeg server
 */
function Engine() {
    EventEmitter.call(this);
    this.debug = true;
    this.streamers = {};

    var self = this;

    this.discover = function() {
        return DeviceList.discover().then(function(devices) {
            var d = {};
            try {
                Object.keys(devices).map(function(type) {
                    console.log(type);
                    d[type] = {};
                    Object.keys(devices[type]).map(function(guid) {
                        var dev = devices[type][guid];
                        d[type][guid] = dev.toJSON();
                    });
                });
            } catch (E) {
                throw E;
            }
            return d;
        });
    };

    this.getDeviceList = function() {
        return DeviceList;
    };

    this.getDevice = function(DeviceGUID) {
        return DeviceList.getDeviceByGUID(DeviceGUID);
    };

    this.createStreamer = function(Media, Device) {
        var id = uuid.v4();
        this.streamers[id] = new Streamer(id, Media, Device);
        return this.streamers[id];
    };

    this.getStreamer = function(StreamGUID) {
        return this.streamers[StreamGUID];
    };

    this.registerStreamer = function(Stream) {
        this.streamers[Stream.guid] = Stream;
    };

    this.cast = function(Device, Media, options) {
        var analyzer = new Analyzer(Media);
        return analyzer.analyze().then(function(Profile) {
            Media.setMediaProfile(Profile);
            var streamer = self.createStreamer(Media, Device);
            return Device.cast(streamer.getUrl(), options);
        });
    };


    this._log = function() {
        if (this.debug) {
            console.log("ENGINE: ");
            console.log.apply(this, arguments);
        }
    };
}



util.inherits(Engine, EventEmitter);


console.log("CREATING NEW ENGINE!");
module.exports = new Engine();