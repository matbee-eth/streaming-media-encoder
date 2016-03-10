import Engine from './Engine'
import fs from 'fs'
import express from 'express'
import ip from 'my-local-ip'
import findOpenPort from './find-open-port'

import HTTPMedia from './media/HTTPMedia'
import FileMedia from './media/FileMedia'
import TorrentMedia from './media/TorrentMedia'


const app = express()
let expressServer = null


/**
 * This example starts an express server and serves one url: "/request-from-chromecast"
 * Pass this url to your chromecast to load on the endpoint provided at startup
 * to have the video automagically transcoded through FFMPEG
 */

findOpenPort(3000).then((port) => expressServer = app.listen(port, () => console.log('streaming-media-encoder Webserver listening at http://%s:%s', ip(), expressServer.address().port)))

app.use('/static', express.static(__dirname + '/static'))

app.get('/debug', (req, res) => {
    res.header('Content-Type: text/html')
    res.sendFile(__dirname + '/debug.html')
})

app.get('/debug-info', (req, res) => res.json(Engine));

app.get('/discover', (req, res) => {
    console.log("starting discovery")
    Engine.discover()
        .then((devices) => {
            console.log('1000ms discovery done', devices)
            res.json(devices)
        })
        .catch(E => {
            throw E
        })
})

app.get('/devicelist', (req, res) => res.json(Engine.getDeviceList()))

app.get('/control/:deviceGUID', (req, res) => Engine.getDevice(req.params.deviceGUID).control(req.query.action, req.query).then(res.json))

app.get('/cast/:deviceGUID', (req, res) => {

    const device = Engine.getDevice(req.params.deviceGUID)
    let media

    if (req.query.url)
        media = new HTTPMedia(req.query.path)

    if (req.query.path)
        media = new FileMedia(req.query.path)

    if (req.query.magnet)
        media = new TorrentMedia(req.query.magnet)

    // cast performs the media analyze
    // and creating the new streamer for this media on devicename
    const options = {
        title: '#ripmatbee',
        subtitles: './../matbee.srt'
    };
    Engine.cast(device, media, options)
        .then(result => res.json(result))
})


app.get('/stream/:streamId', (req, res) => Engine.getStreamer(req.params.streamId).handle(req.method, req, res));


export default app
