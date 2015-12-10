var util = require('util'),
    express = require('express'),
    EventEmitter = require('events'),
    Engine = require('./Engine'),
    ffmpeg = require('fluent-ffmpeg'),
    net = require('net'),
    uuid = require('node-uuid'),
    app = express(),
    ffmpegServer;

/**
 * The encoder is where the magic happens.
 * This class starts an HTTP server that communicates with ffmpeg.
 *
 * @param {[type]} options [description]
 */
var Encoder = {

    profiles: {
        "CHROMECAST": require('./profiles/Chromecast.js'),
        // "DLNA": require('./profiles/DLNA.js'),
        // "APPLETV": require('./profiles/AppleTV.js')
    },
    /*
     * Valid Options
     * ...
     * options also supplied to Profile constructor.
     */
    profile: function(profile, fileSize) {
        // generate ID
        var id = uuid.v4();
        var engine = new Engine(profile, fileSize, id, this.getUrl(id));
        uuidRequest[id] = engine;
        return engine;
    },

    /*
     * location: URL (this webserver) or file path.
     */
    probe: function(engine, options, cb) {
        ffmpeg.ffprobe(Encoder.getUrl(engine.id), function(err, metadata) {
            engine.setProbeData(metadata);
            if (cb) {
                cb(err, metadata);
            }
        });
    },

    encode: function(engine, options, cb) {
        if (!engine.hasProbed) {
            Encoder.probe(engine, {}, function(err, metadata) {
                Encoder.encode(engine, options, cb);
            });
        } else {
            engine.getFFmpegOutputOptions(Encoder.getUrl(engine.id), function(err, outputOptions) {
                console.log(err, outputOptions);
                var command = ffmpeg(Encoder.getUrl(engine.id));
                if (options.startTime) {
                    command.seekInput(options.startTime);
                }

                command.on('start', function(commandLine) {
                    console.log('Spawned Ffmpeg with command: ' + commandLine);
                })

                .on('error', function() {
                    console.error(arguments);
                });

                command.outputOptions(outputOptions);
                cb(command);
            });
        }
    },

    getUrl: function(fileId) {
        return "http://localhost:" + ffmpegServer.address().port + "/" + fileId;
    }

};

var uuidRequest = {};
app.get('/:fileId', function(req, res) {
    if (uuidRequest[req.params.fileId]) {
        uuidRequest[req.params.fileId].onRequest(req, res);
    } else {
        res.end();
    }
});

app.head('/:fileId', function(req, res) {
    if (uuidRequest[req.params.fileId]) {
        uuidRequest[req.params.fileId].onHeadRequest(req, res);
    } else {
        res.end();
    }
});


var portrange = 3000;

function getPort(cb) {
    var port = portrange;
    portrange += 1;

    var server = net.createServer();
    server.listen(port, function(err) {
        server.once('close', function() {
            cb(port);
        });
        server.close();
    });
    server.on('error', function(err) {
        getPort(cb);
    });
}

getPort(function(port) {
    ffmpegServer = app.listen(port, function() {
        var host = ffmpegServer.address().address;
        var port = ffmpegServer.address().port;
        console.log('FFmpeg Webserver listening at http://%s:%s', host, port);
    });
});

module.exports = Encoder;