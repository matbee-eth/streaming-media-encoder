import Promise from 'bluebird'
import BaseDeviceProfile from './BaseDevice'

export default class DigitalMediaRenderer extends BaseDeviceProfile {
    constructor(client, info, msg, desc, supportedProtocols) {
        super()

        this.client = Promise.promisifyAll(client)
        this.ip = info.address
        this.id = desc.device.UDN.replace('uuid:', '')
        this.name = desc.device.friendlyName
        this.info = info
        this.msg = msg
        this.desc = desc
        this.supportedProtocols = supportedProtocols

        this._initClientListeners(client)
    }

    _initClientListeners(client) {
        client.on('status', (status) => {
            // Reports the full state of the AVTransport service the first time it fires,
            // then reports diffs. Can be used to maintain a reliable copy of the
            // service internal state.
            console.log(status);
        })

        client.on('loading', () => {
            console.log('------> loading', arguments);
        })

        client.on('playing', () => {
            console.log('playing')

            client.getPosition((err, position) => {
                console.log(position) // Current position in seconds
            })

            client.getDuration((err, duration) => {
                console.log(duration) // Media duration in seconds
            })
        });

        client.on('paused', () => {
            console.log('paused')
        })

        client.on('stopped', (args) => {
            console.log('stopped', args)
        })
    }

    cast(url, options) {
        const opts = {
            autoplay: true,
            contentType: 'video/mp4',
            metadata: {
                title: '#ripmatbee',
                creator: 'SchizoDuckie',
                type: 'video', // can be 'video', 'audio' or 'image'
            }
        };
        this.client.loadAsync(url, options)
    }


    handleSeek(req, res) {
        let ret = '00:00:00'

        ['TimeSeekRange.dlna.org', 'X-Seek-Range'].map(header => {
            const val = req.header(header)
            if (val) ret = val
        })
        return ret
    }


    play = this.client.playAsync();

    pause = this.client.pauseAsync();

    stop = this.client.stopAsync();
}