var util = require('util'),
    Promise = require('bluebird');
    BaseDevice = require('./BaseDevice');


function ChromeCast(client) {
	BaseDevice.call(this);
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

util.inherits(ChromeCast, BaseDevice);

module.exports = ChromeCast;