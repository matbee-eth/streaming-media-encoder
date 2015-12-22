var uuid = require('node-uuid');

/**
 * BaseDevice that defines shared functionality
 */
function BaseDevice(client) {
	this.client = client;
	this.id = uuid.v4();
       
}

/**
 * cast media to a device
 * @param  {string} url     url to transcoder to use
 * @param  {object} options options like media mime type, title, etc.
 * @return {Promise}         Promise that resolves with result
 */
BaseDevice.prototype.cast = function(url, options) {
	throw new Error("CAST Not implemented!");
};

BaseDevice.prototype.play = function(url, options) {
	throw new Error("PLAY Not implemented!");
};

BaseDevice.prototype.pause = function(url, options) {
	throw new Error("PAUSE Not implemented!");
};

BaseDevice.prototype.stop = function(url, options) {
	throw new Error("STOP Not implemented!");
};


module.exports = BaseDevice;