var express = require('express'),
    app = express(),
    encoder = require('./Encoder'),
    fs = require('fs'),
    net = require('net'),
    port = 8989,
    expressServer;

/**
 * This example starts an express server and serves one url: "/request-from-chromecast"
 * Pass this url to your chromecast to load on the endpoint provided at startup
 * to have the video automagically transcoded through FFMPEG
 */

expressServer = app.listen(port, function() {
    var host = expressServer.address().address;
    var port = expressServer.address().port;

    console.log('streaming-media-encoder Webserver listening at http://%s:%s', host, port);
});

/**
 * Define a request to serve a video file (do this your own way ofcourse)
 * If you implement seeking using a scrubber bar, just re-call this url with a timestamp
 * like /request-from-chromecast?start=00:14:43
 */
app.get("/request-from-chromecast", function(req, res) {
    var file = "Zero.Tolerance.2015.HDRip.XviD.AC3-EVO.avi";
    var stats = fs.statSync(file);
    var engine = encoder.profile(encoder.profiles.CHROMECAST, stats.size);
    console.log("Engine::", engine);

    /**
     * feed ffmpeg new data when it requires it.
     * this is where the vide or audio file is actually read.
     */
    engine.on("streamNeeded", function(startByte, endByte, cb) {
        cb(fs.createReadStream(file, {
            start: startByte,
            end: endByte
        }));
    });

    /**
     * Certain devices need specific HTTP Headers in order to decode the video.
     * Use these headers. (DLNA ETC...)
     * Hooking up this event makes sure they're passed to the client.
     */
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
        /**
         * for this simple example, we always pipe content through the encoder
         * even if the audioNeedsTranscoding or videoNeedsTranscoding are both false
         */
        if (mediaInfo.isAudioMedia || mediaInfo.isVideoMedia) {
            startEncoder(res.query.startTime);
        }
    });

    /**
     * Start a new transcoding process (any leftovers will automatically die off)
     * @param  {timestamp} time starttime to play at hh:mm:ss
     * @return void
     */
    function startEncoder(time) {
        encoder.encode(engine, {
            force: true,
            startTime: time || "00:00:00",
        }, function(stream) {
            stream.pipe(res, {
                end: true
            });
            stream.on("end", function() {
                console.log("stream ended, nothing more to do.");
                res.end();
            });
        });
    }

});