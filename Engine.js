var util = require('util'),
    EventEmitter = require('events'),
    pump = require('pump'),
    rangeParser = require('range-parser'),
    ffmpeg = require('fluent-ffmpeg'),
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
}

Engine.prototype.discover = function() {
    return DeviceList.discover().then(function(devices) {
        console.log("Fetched device list");
        var d = {};
        try {
            Object.keys(devices).map(function(type) {
                console.log(type);
                d[type] = {};
                Object.keys(devices[type]).map(function(guid) {
                    console.log(guid);
                    var dev = devices[type][guid];
                    if (!('toJSON' in dev)) {
                        debugger;
                    }
                    console.log(devices, type, guid);
                    d[type][guid] = dev.toJSON();
                });
            });
        } catch (E) {
            throw E;
        }
        console.log("device list return: ", d);
        return d;
    });
};

Engine.prototype.getDeviceList = function() {
    return DeviceList;
};

Engine.prototype.getDevice = function(DeviceGUID) {
    return DeviceList.getDeviceByGUID(DeviceGUID);
};

Engine.prototype.createStreamer = function(Media, Profile, Device) {
    var id = uuid.v4();
    this.streamers[id] = new Streamer(id, Media, Profile, Device);
    return this.streamers[id];
};

Engine.prototype.getStreamer = function(StreamGUID, app) {
    return this.streamers[StreamGUID];
};

Engine.prototype.registerStreamer = function(Stream, app) {
    this.streamers[Stream.guid] = Stream;
};

Engine.prototype.cast = function(Device, Media, options) {
    var profile = Analyzer.analyze(Media);
    var streamer = this.createStreamer(Media, Profile, Device);
    Device.cast(streamer);
};

util.inherits(Engine, EventEmitter);

Engine.prototype._log = function() {
    if (this.debug) {
        console.log("ENGINE: ");
        console.log.apply(this, arguments);
    }
};





module.exports = new Engine();