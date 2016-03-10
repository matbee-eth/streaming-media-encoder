var util = require('util'),
    Promise = require('bluebird');
    BaseDeviceProfile = require('./BaseDevice');


function ChromeCast(client) {
	BaseDeviceProfile.call(this);
	this.name = client.name;
	this.ip = client.host;

	this.client = Promise.promisifyAll(client);
 
	this.cast = function(url, options) {
		return this.client.loadAsync(url, options);
	};

	this.play = function() {
		return this.client.playAsync();
	};

	this.pause = function() {
		return this.client.pauseAsync();
	};

	this.stop = function() {
		return this.client.stopAsync();
	};
}

util.inherits(ChromeCast, BaseDeviceProfile);

module.exports = ChromeCast;