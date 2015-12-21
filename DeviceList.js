var util = require('util'),
	// dlna
 	RendererFinder = require('renderer-finder');
	MediaRendererClient = require('upnp-mediarenderer-client');
	// chromecast
	chromecasts = require('chromecasts')();
	// appletv

function DeviceList() {

	var self = this;

	this.devices = {
		ChromeCast : [],
		DLNA : [],
		AppleTV: []
	};

	this.chromecastSearching = false;
	this.dlnaSearching = false;
	this.appleTVSearching = false;


	this.discover = function() {
		this.findChromeCasts();
		this.findDMRs();
	};

	this.findChromeCasts = function() {
		if(!this.chromecastSearching) {
			this.chromecastSearching = true;
			chromecasts.on('update', function (player) {
				player = new ChromeCastDevice(player);
		    	if(self.devices.ChromeCast.indexOf(player) == -1) {
		    		self.devices.ChromeCast.push(player);
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
					player = new DMRDevice(client, info, msg, desc);
			    	if (self.devices.DLNA.indexOf(player) == -1) {
			    		self.devices.DLNA.push(player);
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


}


module.exports = new DeviceList();