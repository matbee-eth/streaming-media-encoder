var util = require('util'),
    EventEmitter = require('events'),
    // dlna
    RendererFinder = require('renderer-finder'),
    MediaRendererClient = require('upnp-mediarenderer-client'),
    DMRDevice = require('./devices/DigitalMediaRenderer'),
    // chromecast
    chromecasts = require('chromecasts'),
    ChromeCastDevice = require('./devices/ChromeCast');
// appletv

function DeviceList() {
    EventEmitter.call(this);
    var self = this;

    this.devices = {
        CHROMECAST: {},
        DLNA: {},
        APPLETV: {}
    };

    this.chromecastSearching = false;
    this.dlnaSearching = false;
    this.appleTVSearching = false;

    this.discover = function() {
        console.log("Starting discovery");
        this.findChromeCasts();
        this.findDMRs();
        this.emit("devicelist:discovering", this);
        return new Promise(function(resolve) {
            setTimeout(function() {
                resolve(self.devices);
            }, 1000);
        });
    };

    this.findChromeCasts = function() {
        if (!this.chromecastSearching) {
            console.log("Searching for chromecast devices");
            this.chromecastSearching = true;
            chromecasts().on('update', function(player) {
                console.log("Found a chromecast", player.name);
                player = new ChromeCastDevice(player);
                if (!(player.id in self.devices.CHROMECAST)) {
                    self.devices.CHROMECAST[player.id] = player;
                    self.emit("devicelist:newdevice", {
                        type: "ChromeCast",
                        device: player
                    });
                }
            });
        }
    };

    this.findDMRs = function() {
        if (!this.dlnaSearching) {
            this.dlnaSearching = true;
            console.log("Searching for DLNA devices");
            finder = new RendererFinder();
            finder.on('found', function(info, msg, desc) {
                console.log("Found a DLNA device: ", msg, info, desc);
                var client = new MediaRendererClient(msg.location);
                client.getSupportedProtocols(function(err, protocols) {
                    player = new DMRDevice(client, info, msg, desc, protocols);
                    if (!(player.id in self.devices.DLNA)) {
                        self.devices.DLNA[player.id] = player;
                        self.emit("devicelist:newdevice", {
                            type: "DigitalMediaRenderer",
                            device: player
                        });
                    }
                });
            });
            finder.start(true);
        }
    };

    this.findAppleTVs = function() {
        if (!this.appleTVSearching) {
            this.appleTVSearching = true;

            // todo
        }

    };

    this.getDeviceByGUID = function(guid) {
        var found = null;
        Object.keys(this.devices).map(function(deviceclass) {
            this.devices[deviceclass].map(function(device) {
                if (device.guid == guid) {
                    found = device;
                }
            });
        });
        return found;
    };


}
util.inherits(DeviceList, EventEmitter);

module.exports = new DeviceList();