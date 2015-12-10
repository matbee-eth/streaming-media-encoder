const util = require('util');
const EventEmitter = require('events');
var pump = require('pump');
var rangeParser = require('range-parser');

var Engine = function (profile, fileSize) {
    EventEmitter.call(this);
    this._profile = profile;
    this._fileSize = fileSize;
}
util.inherits(Engine, EventEmitter);

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
Engine.prototype.onHeadRequest = function (req, res) {
    console.log("onHeadRequest", req, res);
    res.end();
}
Engine.prototype.onRequest = function(req, res) {
    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('Content-Type', "video/matroska")
    res.statusCode = 200;
    if (req.headers.range) {
        console.log("onRequest", this._fileSize, req.headers.range);
        var range = rangeParser(this._fileSize, req.headers.range)[0];
        console.info('range %s', req.headers.range, JSON.stringify(range));
        res.setHeader(
          'Content-Range',
          'bytes ' + range.start + '-' + range.end + '/' + this._fileSize
        )
        res.setHeader('Content-Length', range.end - range.start + 1)
    } else {
        res.setHeader('Content-Length', this._fileSize);
    }
    console.log(res);
    this.emit("streamNeeded", range.start, range.end, function (stream) {
        stream.pipe(res);
        stream.on('end', function () {
            res.end();
        });
    });
};

Engine.prototype.encode = function(obj) {
    console.info("TODO:: Engine.encode");
};

module.exports = Engine;