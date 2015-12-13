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

app.get("/stream", function (req, res) {
    res.send('<html><body><video controls autoplay><source src="http://127.0.0.1:9090/stream-with-transcode" type="video/mp4"></source></video></body></html>');
});

app.get("/stream-with-transcode", function(req, res) {
    var stats = fs.statSync(activeFile);
    encoder.profiles.CHROMECAST.debug = true;
    var engine = encoder.profile(encoder.profiles.CHROMECAST, stats.size);
   // engine.rescale(180);
    engine.hardCodeSubtitle('../demo.srt');
    //engine.correctAudioOffset(30.5);
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