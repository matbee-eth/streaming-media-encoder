var express = require('express');
const util = require('util');
const EventEmitter = require('events');
var Engine = require('./Engine');
var uuid = require('node-uuid');
var net = require('net');
var app = express();
var ffmpeg = require('fluent-ffmpeg');
function Encoder(options) {
    EventEmitter.call(this);
}
util.inherits(Encoder, EventEmitter);

Encoder.profiles = {
    "CHROMECAST": require('./profiles/Chromecast.js'),
    // "DLNA": require('./profiles/DLNA.js'),
    // "APPLETV": require('./profiles/AppleTV.js')
}

/*
* Valid Options
* ...
* options also supplied to Profile constructor.
*/
Encoder.profile = function (profile, fileSize) {
  // generate ID
  var engine = new Engine(profile, fileSize);
  return engine;
}

/*
* location: URL (this webserver) or file path.
*/
Encoder.probe = function (engine, options, cb) {
  var id = uuid.v4();
  uuidRequest[id] = engine;
  console.log(this.getUrl(id));
  ffmpeg.ffprobe(this.getUrl(id), function(err, metadata) {
      console.info(err, metadata);
      cb && cb(err, metadata);
  });
}

Encoder.encode = function(engine, options, cb) {
  var id = uuid.v4();
  console.log("Encoder.encode", engine);
  uuidRequest[id] = engine.onRequest.bind(engine);
  ffmpeg.encode(this.getUrl(id), function (err) {

  });
};

Encoder.getUrl = function(fileId) {
  return "http://localhost:"+ffmpegServer.address().port+"/"+fileId;
};

var uuidRequest = {};
app.get('/:fileId', function (req, res) {
  if (uuidRequest[req.params.fileId]) {
    uuidRequest[req.params.fileId].onRequest(req, res);
  } else {
    res.end();
  }
});

app.head('/:fileId', function (req, res) {
  if (uuidRequest[req.params.fileId]) {
    uuidRequest[req.params.fileId].onHeadRequest(req, res);
  } else {
    res.end();
  }
});


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
var ffmpegServer;
getPort(function (port) {
  ffmpegServer = app.listen(port, function () {
    var host = ffmpegServer.address().address;
    var port = ffmpegServer.address().port;

    console.log('FFmpeg Webserver listening at http://%s:%s', host, port);
  });
});

module.exports = Encoder;