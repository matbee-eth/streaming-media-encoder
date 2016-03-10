import util from 'util'
import EventEmitter from 'events'

// dlna
import RendererFinder from 'renderer-finder'
import MediaRendererClient from 'upnp-mediarenderer-client'
import DMRDevice from './devices/DigitalMediaRenderer'

// chromecast
import chromecasts from 'chromecasts'
import ChromeCastDevice from './devices/ChromeCast'

import HTML5Device from './devices/HTML5'


class DeviceList extends EventEmitter {

    devices = {
        HTML5: {},
        CHROMECAST: {},
        DLNA: {},
        APPLETV: {}
    };

    chromecastSearching = false;
    dlnaSearching = false;
    appleTVSearching = false;
    HTML5Searching = false;

    discover() {
        console.log("Starting discovery")
        this.createHTML5Device()
        this.findChromeCasts()
        this.findDMRs()
        this.emit("devicelist:discovering", this)

        return new Promise(resolve => setTimeout(() => resolve(self.devices), 1000))
    }

    createHTML5Device() {
        if (this.HTML5Searching) return

        this.HTML5Searching = true
        const player = new HTML5Device()

        if (!(player.id in self.devices.HTML5)) {
            self.devices.HTML5[player.id] = player
            self.emit("devicelist:newdevice", {
                type: "HTML5",
                device: player
            })
        }
    }

    findChromeCasts() {
        if (this.chromecastSearching) return

        console.log("Searching for chromecast devices");
        this.chromecastSearching = true;

        chromecasts().on('update', player => {
            console.log("Found a chromecast", player.name)

            const newPlayer = new ChromeCastDevice(player)
            if (!(newPlayer.id in self.devices.CHROMECAST)) {
                self.devices.CHROMECAST[newPlayer.id] = newPlayer
                self.emit("devicelist:newdevice", {
                    type: "ChromeCast",
                    device: newPlayer
                })
            }
        })
    }

    findDMRs() {
        if (this.dlnaSearching) return

        this.dlnaSearching = true;
        console.log("Searching for DLNA devices");

        finder = new RendererFinder();
        finder.on('found', (info, msg, desc) => {

            console.log("Found a DLNA device: ", msg, info, desc)
            const client = new MediaRendererClient(msg.location)

            client.getSupportedProtocols((err, protocols) => {
                const player = new DMRDevice(client, info, msg, desc, protocols);
                if (!(player.id in self.devices.DLNA)) {
                    self.devices.DLNA[player.id] = player;
                    self.emit("devicelist:newdevice", {
                        type: "DigitalMediaRenderer",
                        device: player
                    })
                }
            })
        })
        finder.start(true)
    }

    findAppleTVs() {
        if (this.appleTVSearching) return

        this.appleTVSearching = true
    }

    getDeviceByGUID(guid) {
        let found = null
        Object.keys(this.devices).map(deviceclass => Object.keys(self.devices[deviceclass]).map(id => {
            if (id == guid) found = self.devices[deviceclass][guid]
        }))
        return found
    }
}

export default new DeviceList()
