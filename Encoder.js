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
};
/*
* Valid Options
* ...
* options also supplied to Profile constructor.
*/
Encoder.profile = function (profile, fileSize) {
  // generate ID
  var id = uuid.v4();
  var engine = new Engine(profile, fileSize, id);
  uuidRequest[id] = engine;
  return engine;
}

/*
* location: URL (this webserver) or file path.
*/
Encoder.probe = function (engine, options, cb) {
  ffmpeg.ffprobe(Encoder.getUrl(engine.id), function(err, metadata) {
      engine.setProbeData(metadata);
      cb && cb(err, metadata);
  });
}

Encoder.encode = function(engine, options, cb) {
  if (!engine.hasProbed) {
    Encoder.probe(engine, {}, function (err, metadata) {
      Encoder.encode(engine, options, cb);
    });
  } else {
    engine.getFFmpegOutputOptions(Encoder.getUrl(engine.id), function (err, outputOptions) {
      console.log(err, outputOptions);
      var command = ffmpeg(Encoder.getUrl(engine.id))
      command.outputOptions(outputOptions)
      cb(command);
    });
  }
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