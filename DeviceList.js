var util = require('util'),
    EventEmitter = require('events'),
    // dlna
    RendererFinder = require('renderer-finder'),
    MediaRendererClient = require('upnp-mediarenderer-client'),
    DMRDevice = require('./devices/DigitalMediaRenderer'),
    // chromecast
    chromecasts = require('chromecasts'),
    ChromeCastDevice = require('./devices/ChromeCast'),

    HTML5Device = require('./devices/HTML5');
// appletv

function DeviceList() {
    EventEmitter.call(this);
    var self = this;

    this.devices = {
        HTML5: {},
        CHROMECAST: {},
        DLNA: {},
        APPLETV: {}
    };

    this.chromecastSearching = false;
    this.dlnaSearching = false;
    this.appleTVSearching = false;
    this.HTML5Searching = false;

    this.discover = function() {
        console.log("Starting discovery");
        this.createHTML5Device();
        this.findChromeCasts();
        this.findDMRs();
        this.emit("devicelist:discovering", this);
        return new Promise(function(resolve) {
            setTimeout(function() {
                resolve(self.devices);
            }, 1000);
        });
    };

    this.createHTML5Device = function() {
        if (!this.HTML5Searching) {
            this.HTML5Searching = true;
            var player = new HTML5Device();
            if (!(player.id in self.devices.HTML5)) {
                self.devices.HTML5[player.id] = player;
                self.emit("devicelist:newdevice", {
                    type: "HTML5",
                    device: player
                });
            }
        }
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
            Object.keys(self.devices[deviceclass]).map(function(id) {
                if (id == guid) {
                    found = self.devices[deviceclass][guid];
                }
            });
        });
        return found;
    };


}
util.inherits(DeviceList, EventEmitter);

module.exports = new DeviceList();