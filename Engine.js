var util = require('util'),
     EventEmitter = require('events'),
     pump = require('pump'),
     rangeParser = require('range-parser'),
     ffmpeg = require('fluent-ffmpeg'),
     Promise = require('bluebird'),
     DeviceList = require('./DeviceList'),
     Streamer = require('./Streamer');

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
    this.streamers = {};
}

Engine.prototype.getDeviceList = function() {
    return DeviceList;
};

Engine.prototype.getDevice = function(DeviceGUID) {
    return DeviceList.getDeviceByGUID(DeviceGUID);
};

Engine.prototype.createStreamer = function(Media, Device) {
    var id = uuid.v4();
    this.streamers[id]  = new Streamer(id, Media, Device);
    return this.streamers[id];
};

Engine.prototype.getStreamer = function(StreamGUID, app) {
    return this.streamers[StreamGUID];
};

Engine.prototype.registerStreamer = function(Stream, app) {
    this.streamers[Stream.guid] = Stream;
};

util.inherits(Engine, EventEmitter);

Engine.prototype._log = function() {
  if(this.debug) {
    console.log("ENGINE: ");
    console.log.apply(this, arguments);
  }
};





module.exports = Engine;