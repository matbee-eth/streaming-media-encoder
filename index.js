var express = require('express');
var app = express();
var encoder = require('./Encoder');
var file = "Last.Knights.2015.1080p.BluRay.x264.YIFY.mp4"
var fs = require('fs');
var stats = fs.statSync(file);

var express = require('express');
var net = require('net');
var app = express();
var portrange = 3000
var expressServer;

function getPort (cb) {
  var port = portrange
  portrange += 1

  var server = net.createServer()
  server.listen(port, function (err) {
    server.once('close', function () {
      cb(port)
    })
    server.close();
  })
  server.on('error', function (err) {
    getPort(cb)
  })
};
getPort(function (port) {
    expressServer = app.listen(port, function () {
      var host = expressServer.address().address;
      var port = expressServer.address().port;

      console.log('FFmpeg Webserver listening at http://%s:%s', host, port);
      ready();
    });
})

var ready = function () {
  app.get("/request-from-chromecast", function (req, res) {
      var engine = encoder.profile(encoder.profiles.CHROMECAST, stats.size);
      console.log("Engine::", engine);
      // Sometimes FFmpeg may need to seek throughout a file to encode the video, or probe.
      engine.on("streamNeeded", function (startByte, endByte, cb) {
          // <Error?> Stream.
          console.info("streamNeeded", startByte, endByte);
          cb(fs.createReadStream(file, {start: startByte, end: endByte}));
      });

      // Certain devices need specific HTTP Headers in order to decode the video. Use these headers.
      engine.once("httpHeaders", function (headerInfo) {
          res.writeHeader(headerInfo);
      });

      // Video encoding finished, it's time to end.
      engine.once("end", function () {
          res.end();
      });

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
}