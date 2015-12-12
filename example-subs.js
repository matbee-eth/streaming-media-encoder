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

app.get("/stream-no-transcode", function (req, res) {
    // Send file as is.
    req.connection.setTimeout(Number.MAX_SAFE_INTEGER);

    fs.stat(activeFile, function (err, stats) {
        var filesize = stats.size;

        sendFile(activeFile, filesize);
    });
    function sendFile (filePath, filesize) {
        var range;
        var filename = require('path').basename(filePath);

        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Type', mime.lookup(filename));
        res.statusCode = 200;

        if (req.headers.range) {
            range = rangeParser(filesize, req.headers.range)[0];
            res.statusCode = 206;
            // no support for multi-range reqs
            range = rangeParser(filesize, req.headers.range)[0];
            console.log('range %s', JSON.stringify(range));
            res.setHeader(
              'Content-Range',
              'bytes ' + range.start + '-' + range.end + '/' + filesize
            );
            res.setHeader('Content-Length', range.end - range.start + 1);
        } else {
            res.setHeader('Content-Length', filesize);
        }

        console.log("Streaming Video Data", res.headers);
        // Stream the video into the video tag
        pump(fs.createReadStream(filePath, range), res);
    }
});

app.get("/stream-with-transcode", function(req, res) {
    var stats = fs.statSync(activeFile);
    encoder.profiles.CHROMECAST.debug = true;
    var engine = encoder.profile(encoder.profiles.CHROMECAST, stats.size);
   // engine.rescale(180);
    engine.loadSubtitle('../demo.srt');
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