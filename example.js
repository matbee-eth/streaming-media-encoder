var express = require('express');
var app = express();
var encoder = require('./Encoder');
var fs = require('fs');
var net = require('net');
var port = 8989
var expressServer;

expressServer = app.listen(port, function () {
  var host = expressServer.address().address;
  var port = expressServer.address().port;

  console.log('FFmpeg Webserver listening at http://%s:%s', host, port);
});

app.get("/request-from-chromecast", function (req, res) {
    var file = "Zero.Tolerance.2015.HDRip.XviD.AC3-EVO.avi"
    var stats = fs.statSync(file);
    var engine = encoder.profile(encoder.profiles.CHROMECAST, stats.size);
    console.log("Engine::", engine);
    // Sometimes FFmpeg may need to seek throughout a file to encode the video, or probe.
    engine.on("streamNeeded", function (startByte, endByte, cb) {
        // <Error?> Stream.
        console.info("streamNeeded", startByte, endByte);
        cb(fs.createReadStream(file, {start: startByte, end: endByte}));
    });

    // Certain devices need specific HTTP Headers in order to decode the video. Use these headers. (DLNA ETC...)
    engine.once("httpHeaders", function (headerInfo) {
        res.writeHeader(headerInfo);
    });

    // encoder.probe is currently needed before canPlay, will figure it out.
    encoder.probe(engine, {}, function (err, metadata) {
      console.log("Probe", err, metadata);
      engine.canPlay(function (canPlay) {
        console.log("engine.canPlay", canPlay);
        if (canPlay) {
          // just send file. DO IT YOUR OWN WAY BITCH
        }
        else {
          encoder.encode(engine, {
            startTime: "00:00"
          }, function (stream) {
            stream.pipe(res, {end: true});
            stream.on("end", function () {
              console.log("stream ended");
              res.end();
            });
          });
        }
      });
    });

}); 
