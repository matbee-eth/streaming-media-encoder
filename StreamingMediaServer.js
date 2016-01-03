var Engine = require('./Engine'),
    fs = require('fs'),
    express = require('express'),
    ip = require('my-local-ip'),
    findOpenPort = require('./find-open-port'),
    expressServer = null,
    app = express();

/**
 * This example starts an express server and serves one url: "/request-from-chromecast"
 * Pass this url to your chromecast to load on the endpoint provided at startup
 * to have the video automagically transcoded through FFMPEG
 */

findOpenPort(3000).then(function(port) {
    expressServer = app.listen(port, function() {
        var port = expressServer.address().port;

        console.log('streaming-media-encoder Webserver listening at http://%s:%s', ip(), port);
    });
});

app.use('/static', express.static(__dirname + '/static'));

app.get('/debug', function(req, res) {
    res.header('Content-Type: text/html');
    res.sendFile(__dirname + '/debug.html');
});

app.get('/debug-info', function(req, res) {
    res.json(Engine);
});

app.get('/discover', function(req, res) {
    console.log("starting discovery");
    Engine.discover().then(function(devices) {
        console.log('1000ms discovery done', devices);
        res.json(devices);
    }).catch(function(E) {
        throw E;
    });
});

app.get('/devicelist', function(req, res) {
    res.json(Engine.getDeviceList());
});

app.get('/control/:deviceGUID', function(req, res) {
    var device = Engine.getDevice(req.params.deviceGUID);
    device.control(req.query.action, req.query).then(res.json);
});

app.get('/cast/:deviceGUID', function(req, res) {

    var device = Engine.getDevice(req.params.deviceGUID);
    var media;

    if (req.query.url) {
        var HTTPMedia = require('./media/HTTPMedia');
        media = new HTTPMedia(req.query.path);
    }

    if (req.query.path) {
        var FileMedia = require('./media/FileMedia');
        media = new FileMedia(req.query.path);
    }

    if (req.query.magnet) {
        var TorrentMedia = require('./media/TorrentMedia');
        media = new TorrentMedia(req.query.magnet);
    }
    // cast performs the media analyze
    // and creating the new streamer for this media on devicename
    var options = {
        title: '#ripmatbee',
        subtitles: './../matbee.srt'
    };
    Engine.cast(device, media, options).then(function(result) {
        res.json(result);
    });
});


app.get('/stream/:streamId', function(req, res) {
    var streamer = Engine.getStreamer(streamId);
    streamer.handle(req, res);
});

module.exports = app;