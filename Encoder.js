var util = require('util'),
    express = require('express'),
    EventEmitter = require('events'),
    Engine = require('./Engine'),
    ffmpeg = require('fluent-ffmpeg'),
    net = require('net'),
    uuid = require('node-uuid'),
    app = express(),
    ffmpegServer,
    ffmpegPort = 3001,
    uuidRequest = {};

/**
 * scan the port range from the start port until we have an open port.
 * executes callback with the port number when we found one.
 * @param  {int}   port portnumber to start at
 * @param  {Function} cb   callback to execute when port found.
 */
function findOpenPort(port, cb) {
    var server = net.createServer();
    server.listen(port, function(err) {
        server.once('close', function() {
            cb(port);
        });
        server.close();
    });
    server.on('error', function(err) {
        findOpenPort(port + 1, cb);
    });
}

_log = function() {
  if(Encoder.debug) {
    console.log("ENCODER: ");
    console.log.apply(this, arguments);
  }
};

findOpenPort(3001, function(port) {
    ffmpegPort = port;
    ffmpegServer = app.listen(port, function() {
        _log('FFmpeg Webserver listening at %s', Encoder.getUrl());
    });
});


/**
 * The encoder is where the magic happens.
 * Communicates with a device specific profile via an express server with ffmpeg
 * provides streamable output that can be piped directly into (for instance) Express
 */
var Encoder = {
    debug: false,

    

    profiles: {
        "CHROMECAST": require('./profiles/Chromecast.js'),
        // "DLNA": require('./profiles/DLNA.js'),
        // "APPLETV": require('./profiles/AppleTV.js')
    },

    /**
     * build a decoding engine for a device profile
     * @param  {Profile} profile  one of encoder.profiles
     * @param  {int} fileSize size of the file to process
     * @return {Engine} engine that knows how to decode video for device profile
     */
    profile: function(profile, fileSize) {
        // generate ID
        var id = uuid.v4();
        var engine = new Engine(profile, fileSize, id, this.getUrl(id));
        uuidRequest[id] = engine;
        return engine;
    },

    /**
     * ffprobe gathers information from multimedia streams and prints it in human- and machine-readable fashion.
     * this is needed by the engine to determine format info.
     * @param  {Engine}   engine  encoding engine to pass data to
     * @param  {object}   options ffprobe options, currently unused
     * @param  {Function} cb callback when probe is ready
     */
    probe: function(engine, options, cb) {
        _log("probing engine for data", engine, options);
        ffmpeg.ffprobe(Encoder.getUrl(engine.id), function(err, metadata) {
            engine.setProbeData(metadata);
            if (cb) {
                cb(err, metadata);
            }
        });
    },

    /**
     * Fetch probe media for info and start transcoding via ffmpeg
     * @param  {Engine}   engine  device specific engine to use
     * @param  {object}   options Options: (currently only startTime and force )
     * @param  {Function} cb      callback to execute on encoding progress
     */
    encode: function(engine, options, cb) {
        engine.forceTranscode = options.force;
        if (!engine.hasProbed) {
            Encoder.probe(engine, {}, function(err, metadata) {
                Encoder.encode(engine, options, cb);
            });
        } else {
            engine.getFFmpegOutputOptions(Encoder.getUrl(engine.id), function(err, outputOptions) {
                _log('Got FFmpeg output options :', err, outputOptions);

                var command = ffmpeg(Encoder.getUrl(engine.id));
                if (options.startTime) {
                    command.seekInput(options.startTime);
                }

                command.on('start', function(commandLine) {
                   _log('Spawned Ffmpeg with command: ', commandLine);
                })

                .on('error', function() {
                    console.error(arguments);
                });

                command.outputOptions(outputOptions);
                cb(command);
            });
        }
    },

    /**
     * Fetch loopback url for file or return base url
     * @param  {string} fileId Optional fileId to append
     * @return {string} url
     */
    getUrl: function(fileId) {
        return "http://127.0.0.1:" + ffmpegPort + "/" + (fileId || '');
    }

};

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


module.exports = Encoder;