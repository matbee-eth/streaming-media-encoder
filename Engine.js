const util = require('util');
const EventEmitter = require('events');
var rangeParser = require('range-parser');

var Engine = function (profile, server, fileSize) {
    EventEmitter.call(this);
    this._profile = profile;
    this._server = server;
    this._fileSize = fileSize;
}

Engine.prototype.getVideoTracks = function(probeData) {
    var out = [];
    for (var i = 0; i < probeData.streams.length; i++) {
        var stream = probeData.streams[i];
        if (stream.codec_type == "video" && stream.disposition.attached_pic == 0 /* not a gif. */) {
            out.push(stream);
        }
    }
    return out;
};

Engine.prototype.getAudioTracks = function(probeData) {
    var out = [];
    for (var i = 0; i < probeData.streams.length; i++) {
        var stream = probeData.streams[i];
        if (stream.codec_type == "audio") {
            out.push(stream);
        }
    }
    return out;
};
Engine.prototype.onRequest = function(req, res) {
    var range = rangeParser(this._fileSize, req.headers.range)[0];
    console.debug('range %s', JSON.stringify(range));
    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('Content-Type', "video/mp4")
    res.statusCode = 200;
    if (req.headers.range) {
        res.statusCode = 206
        // no support for multi-range reqs
        range = rangeParser(this._fileSize, req.headers.range)[0]
        res.setHeader(
          'Content-Range',
          'bytes ' + range.start + '-' + range.end + '/' + this._fileSize
        )
        res.setHeader('Content-Length', range.end - range.start + 1)
    } else {
        res.setHeader('Content-Length', this._fileSize);
    }
    this.emit("streamNeeded", range.start, range.end, function (stream) {
        res.write(stream);
    });
};
util.inherits(Engine, EventEmitter);