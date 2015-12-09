var encoder = require('./Encoder');
var file = "/home/matbee/luigi-is-pretty.mkv"
var express = require('express');
var app = express();

var portrange = 3000

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
    var server = app.listen(port, function () {
      var host = server.address().address;
      var port = server.address().port;

      console.log('FFmpeg Webserver listening at http://%s:%s', host, port);
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

expressServer.GET("/request-from-chromecast", function (req, res) {
    var engine = encoder.profile(encoder.Profiles.CHROMECAST, file.length);

    // Sometimes FFmpeg may need to seek throughout a file to encode the video, or probe.
    engine.on("streamNeeded", function (startByte, endByte, cb) {
        // <Error?> Stream.
        cb(null, fs.createReadStream(file, {start: startByte, end: endByte}));
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

    engine.encode({
        startTime: "00:00"
    });
});