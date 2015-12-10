var express = require('express');
var app = express();
var encoder = require('./Encoder');
var fs = require('fs');
var net = require('net');
var port = 8989
var expressServer;

/**
 * This example starts an express server and serves one url: "/request-from-chromecast"
 * Pass this url to your chromecast to load on the endpoint provided at startup
 * to have the video automagically transcoded through FFMPEG
 */

expressServer = app.listen(port, function() {
    var host = expressServer.address().address;
    var port = expressServer.address().port;

    console.log('FFmpeg Webserver listening at http://%s:%s', host, port);
});

app.get("/request-from-chromecast", function(req, res) {
    var file = "Zero.Tolerance.2015.HDRip.XviD.AC3-EVO.avi"
    var stats = fs.statSync(file);
    var engine = encoder.profile(encoder.profiles.CHROMECAST, stats.size);
    console.log("Engine::", engine);
    // Sometimes FFmpeg may need to seek throughout a file to encode the video, or probe.
    engine.on("streamNeeded", function(startByte, endByte, cb) {
        // <Error?> Stream.
        console.info("streamNeeded", startByte, endByte);
        cb(fs.createReadStream(file, {
            start: startByte,
            end: endByte
        }));
    });

    // Certain devices need specific HTTP Headers in order to decode the video. Use these headers. (DLNA ETC...)
    engine.once("httpHeaders", function(headerInfo) {
        res.writeHeader(headerInfo);
    });

    /**
     * analyze the file stream to see what type of media we're dealing with and if it's playable
     *
     * the mediaInfo object tells you all you need: {
     *      isAudioMedia: boolean,
     *      isVideoMedia: boolean,
     *      audioNeedsTranscoding: boolean
     *      videoNeedsTranscoding: boolean
     *      formatNeedsTranscoding: boolean,
     * }
     */
    engine.analyze(function(mediaInfo) {

        console.log("mediaInfo", mediaInfo);
        // you can skip the unneeded transcode if you care about performance or
        // flexibility. 
        if (mediaInfo.formatNeedsTranscoding) {
            encoder.encode(engine, {
                startTime: "00:00"
            }, function(stream) {
                stream.pipe(res, {
                    end: true
                });
                stream.on("end", function() {
                    console.log("stream ended");
                    res.end();
                });
            });
        } else {
            // would this do? it wouldnt right? range request n shit?
            stream.pipe(res, {
                end: true
            });
            stream.on("end", function() {
                console.log("stream ended");
                res.end();
            });
        }
    });

});