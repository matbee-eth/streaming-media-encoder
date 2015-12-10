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
// encoder.probe(file, function (err, probeData) {
//     encoder.profiles.CHROMECAST.canPlay(probeData, function (canPlay) {
//         if (canPlay) {
//             // send video data, no need to encode.
//         } else {
//             // encode video data, put through engine.
//         }
//     });
// });
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

      // Video data. Just write it.
      engine.on("data", function (data) {
          res.send(data);
      });

      // Video encoding finished, it's time to end.
      engine.once("end", function () {
          res.end();
      });

      encoder.probe(engine, {
          startTime: "00:00"
      }, function (err, data) {
        console.log(err, data);
        res.send(data);
        res.end();
      });
  }); 
}