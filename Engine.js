const util = require('util');
const EventEmitter = require('events');
var pump = require('pump');
var rangeParser = require('range-parser');
var ffmpeg = require('fluent-ffmpeg');

var Engine = function (profile, fileSize, id, url) {
    EventEmitter.call(this);
    console.log("Engine", profile, id);
    this._profile = profile;
    this._fileSize = fileSize;
    this.id = id;
    this.url = url;
    this.hasProbed = false;
}
util.inherits(Engine, EventEmitter);

Engine.prototype.onHeadRequest = function (req, res) {
    console.log("onHeadRequest", req, res);
    res.end();
}
Engine.prototype.onRequest = function(req, res) {
    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('Content-Type', "video/matroska")
    res.statusCode = 200;
    if (req.headers.range) {
        var range = rangeParser(this._fileSize, req.headers.range)[0];
        res.setHeader(
          'Content-Range',
          'bytes ' + range.start + '-' + range.end + '/' + this._fileSize
        )
        res.setHeader('Content-Length', range.end - range.start + 1)
    } else {
        res.setHeader('Content-Length', this._fileSize);
    }
    this.emit("streamNeeded", range.start, range.end, function (stream) {
        stream.pipe(res);
        stream.on('end', function () {
            res.end();
        });
    });
};

Engine.prototype.getFFmpegOutputOptions = function(host, cb) {
    if (!this.hasProbed) {
        console.error("NO PROBE HAS BEEN DONE NOOB");
        return;
    }
    console.log("Engine.getFFmpegOutputOptions");
    this._profile.getFFmpegFlags(this._probeData, function (err, outputOptions) {
        console.log("getFFmpegFlags", outputOptions);
        cb(err, outputOptions);
    });
};

Engine.prototype.setProbeData = function(metadata) {
    this.hasProbed = true;
    this._probeData = metadata;
};

Engine.prototype.canPlay = function(cb) {
    if (!this.hasProbed) {
        this.probe(function (err, metadata) {
            this.canPlay(cb);
        }.bind(this))
    } else {
        this._profile.canPlay(this._probeData, cb);
    }
};

Engine.prototype.probe = function(cb) {
    if (this.hasProbed) {
        cb && cb(null, this._probeData);
    } else {
        ffmpeg.ffprobe(this.url, function(err, metadata) {
          this.setProbeData(metadata);
          cb && cb(err, metadata);
        }.bind(this));
    }
};

module.exports = Engine;