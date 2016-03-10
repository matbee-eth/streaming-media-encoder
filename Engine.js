import util from 'util'
import EventEmitter from 'events'
import { v4 as uuid } from 'node-uuid'
import pump from 'pump'
import rangeParser from 'range-parser'

import DeviceList from './DeviceList'
import Streamer from './Streamer'
import Analyzer from './Analyzer'


/**
 * Converter engine that  knows how to decode video for device profile
 * @param  {Profile} profile  one of encoder.profiles
 * @param {integer} fileSize file size of media at url
 * @param {uuid} id UUID for this engine instance
 * @param {string} url url where media can be found on the ffmpeg server
 */
class Engine extends EventEmitter {
    streamers = {};

    discover = () => DeviceList.discover().then(devices => {
        const d = {}
        try {
            Object.keys(devices).map(type => {
                console.log(type)
                d[type] = {}
                Object.keys(devices[type]).map((guid) => {
                    var dev = devices[type][guid]
                    d[type][guid] = dev.toJSON()
                })
            })
        } catch (E) {
            throw E
        }
        return d
    });

    getDeviceList = () => DeviceList;

    getDevice = DeviceGUID => DeviceList.getDeviceByGUID(DeviceGUID);

    createStreamer(Media, Device) {
        const id = uuid();
        this.streamers[id] = new Streamer(id, Media, Device)
        return this.streamers[id]
    }

    getStreamer = StreamGUID => this.streamers[StreamGUID];

    registerStreamer = Stream => this.streamers[Stream.guid] = Stream;

    cast(Device, Media, options) {
        const analyzer = new Analyzer(Media)
        return analyzer.analyze().then((Profile) => {
            Media.setMediaProfile(Profile);
            const streamer = this.createStreamer(Media, Device)
            return Device.cast(streamer.getUrl(), options)
        })
    }

    _log() {
        if (!this.debug) return

        console.log("ENGINE: ")
        console.log.apply(this, arguments)
    }
}


export default new Engine()
