var express = require('express');
const util = require('util');
const EventEmitter = require('events');
var Engine = require('./Engine');
var uuid = require('node-uuid');
var net = require('net');
var app = express();
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
Encoder.prototype.profile = function (profile, fileSize) {
  // generate ID
  var engine = new Engine(profile, app, fileSize);
  return engine;
}

/*
* location: URL (this webserver) or file path.
*/
Encoder.prototype.probe = function (engine, cb) {
  var uuid = uuid.v4();
  uuidRequest[uuid] = engine.onRequest.bind(engine);

  ffmpeg.ffprobe(this.getUrl(uuid), function(err, metadata) {
      console.dir(metadata);
      cb && cb(err, metadata);
  });
}

Encoder.prototype.encode = function(options, cb) {
  var uuid = uuid.v4();
  uuidRequest[uuid] = engine.onRequest.bind(engine);
};

Encoder.prototype.getUrl = function(fileId) {
  return "http://localhost"+server.address().port+"/"+fileId;
};

var uuidRequest = {};
app.get('/:fileId', function (req, res) {
  if (uuidRequest[req.params.fileId]) {
    uuidRequest[req.params.fileId](req, res);
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

getPort(function (port) {
  var server = app.listen(port, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('FFmpeg Webserver listening at http://%s:%s', host, port);
  });
});