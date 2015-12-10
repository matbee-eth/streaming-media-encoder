var express = require('express');
var app = express();
var encoder = require('./Encoder');
var fs = require('fs');
var net = require('net');
var rangeParser = require('range-parser');
var pump = require('pump');
var mime = require('mime');
var port = 9090
var expressServer;

expressServer = app.listen(port, function() {
    var host = expressServer.address().address;
    var port = expressServer.address().port;

    console.log('FFmpeg Webserver listening at http://%s:%s', host, port);
});

var activeFile;
var engine;
function mediaSelected(filePath) {
    activeFile = filePath;
    var stats = fs.statSync(filePath);
    engine = encoder.profile(encoder.profiles.CHROMECAST, stats.size);
}

// mediaSelected("file.mp4");

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

        res.setHeader('Accept-Ranges', 'bytes')
        res.setHeader('Content-Type', mime.lookup(filename))
        res.statusCode = 200;

        if (req.headers.range) {
            range = rangeParser(filesize, req.headers.range)[0];
            res.statusCode = 206
            // no support for multi-range reqs
            range = rangeParser(filesize, req.headers.range)[0]
            console.debug('range %s', JSON.stringify(range))
            res.setHeader(
              'Content-Range',
              'bytes ' + range.start + '-' + range.end + '/' + filesize
            )
            res.setHeader('Content-Length', range.end - range.start + 1)
        } else {
            res.setHeader('Content-Length', filesize);
        }

        console.debug("Streaming Video Data", res.headers);
        // Stream the video into the video tag
        pump(fs.createReadStream(filePath, range), res)
    }
});

app.get("/stream-with-transcode", function(req, res) {
    // Sometimes FFmpeg may need to seek throughout a file to encode the video, or probe.
    engine.on("streamNeeded", function(startByte, endByte, cb) {
        cb(fs.createReadStream(activeFile, {
            start: startByte,
            end: endByte
        }));
    });

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
    });
});