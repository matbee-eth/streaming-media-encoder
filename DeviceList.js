var util = require('util'),
	EventEmitter = require('events'),
	// dlna
 	RendererFinder = require('renderer-finder'),
	MediaRendererClient = require('upnp-mediarenderer-client'),
	DMRDevice = require('./devices/DigitalMediaRenderer'),
	// chromecast
	chromecasts = require('chromecasts')(),
	ChromeCastDevice = require('./devices/ChromeCast');
	// appletv

function DeviceList() {
	EventEmitter.call(this);
	var self = this;

	this.devices = {
		CHROMECAST : [],
		DLNA : [],
		APPLETV: []
	};

	this.chromecastSearching = false;
	this.dlnaSearching = false;
	this.appleTVSearching = false;


	this.discover = function() {
		this.findChromeCasts();
		this.findDMRs();
		this.emit("devicelist:discovering", this);
	};

	this.findChromeCasts = function() {
		if(!this.chromecastSearching) {
			this.chromecastSearching = true;
			chromecasts.on('update', function (player) {
				player = new ChromeCastDevice(player);
		    	if(self.devices.ChromeCast.indexOf(player) == -1) {
		    		self.devices.ChromeCast.push(player);
					self.emit("devicelist:newdevice", {type: "ChromeCast", device: player});
		    	}
			});
		}
	};

	this.findDMRs = function() {
		if(!this.dlnaSearching) {
			this.dlnaSearching = true;

			finder = new RendererFinder();

			finder.on('found', function(info, msg, desc){	
				var client = new MediaRendererClient(msg.location);
				client.getSupportedProtocols(function(err, protocols) {
					player = new DMRDevice(client, info, msg, desc, protocols);
			    	if (self.devices.DLNA.indexOf(player) == -1) {
			    		self.devices.DLNA.push(player);
				    	self.emit("devicelist:newdevice", {type: "DigitalMediaRenderer", device: player});
			    	}
			    });
			});
			finder.start(true);
		}
	};

	this.findAppleTVs = function() {
		if(!this.appleTVSearching) {
			this.appleTVSearching = true;

			// todo
		}

	};

	this.getDeviceByGUID = function(guid) {
		var found = null;
		Object.keys(this.devices).map(function(deviceclass) {
			this.devices[deviceclass].map(function(device) {
				if(device.guid == guid) {
					found = device;
				}
			});
		});
		return found;
	};


}
util.inherits(DeviceList, EventEmitter);

module.exports = new DeviceList();