var express = require('express');
var app = express();
var encoder = require('./Encoder');
var fs = require('fs');
var net = require('net');
var rangeParser = require('range-parser');
var pump = require('pump');
var mime = require('mime');
var port = 9090;
var expressServer;
var ip = require('my-local-ip');

encoder.debug = true;

expressServer = app.listen(port, function() {
    var host = expressServer.address().address;
    var port = expressServer.address().port;

    console.log('FFmpeg Webserver listening at http://%s:%s', host, port);
});

var activeFile;
function mediaSelected(filePath) {
    activeFile = filePath;
}

var chromecasts = require('chromecasts')();

chromecasts.on('update', function (player) {
  player.play('http://'+ip()+':9090/stream-with-transcode', {title: '#ripmatbee', type: 'video/mp4'});
});


app.get("/stream-with-transcode", function(req, res) {
    var stats = fs.statSync(activeFile);
    encoder.profiles.CHROMECAST.debug = true;
    var engine = encoder.profile(encoder.profiles.CHROMECAST, stats.size);
    engine.rescale(720);
    res.setHeader('Content-Type', "video/mp4");
    // Sometimes FFmpeg may need to seek throughout a file to encode the video, or probe.
    function streamNeeded (startByte, endByte, cb) {
        console.info("streamNeeded", startByte, endByte);
        cb(fs.createReadStream(activeFile, {
            start: startByte,
            end: endByte
        }));
    }
    engine.on("streamNeeded", streamNeeded);

    // Certain devices need specific HTTP Headers in order to decode the video. Use these headers. (DLNA ETC...)
    engine.once("httpHeaders", function(headerInfo) {
        res.writeHeader(headerInfo);
    });
    encoder.encode(engine, {
        force: true
    }, function(stream) {
        stream.pipe(res, {
            end: true
        });
        function endStream () {
            console.log("stream ended, nothing more to do.");
            engine.removeAllListeners();
            res.end();
        }
        stream.on("end", endStream);
    });
});


mediaSelected(fs.existsSync("../demo.mp4") ? '../demo.mp4' : '../demo.mkv');