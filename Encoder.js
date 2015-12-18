var util = require('util'),
    Promise = require('bluebird'),
    express = require('express'),
    EventEmitter = require('events'),
    Engine = require('./Engine'),
    findOpenPort = require('./find-open-port'),
    ffmpeg = require('fluent-ffmpeg'),
    net = require('net'),
    uuid = require('node-uuid'),
    app = express(),
    ffmpegServer,
    ffmpegPort = 3001,
    uuidRequest = {};


findOpenPort(3001).then(function(port) {
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
function Encoder() {
    this.debug = false;

    this.profiles = {
        "CHROMECAST": require('./profiles/Chromecast.js'),
        "DLNA": require('./profiles/DLNA.js'),
        // "APPLETV": require('./profiles/AppleTV.js')
    };

    /**
     * build a decoding engine for a device profile
     * @param  {Profile} profile  one of encoder.profiles
     * @param  {int} fileSize size of the file to process
     * @return {Engine} engine that knows how to decode video for device profile
     */
    this.profile = function(profile, fileSize) {
        // generate ID
        var id = uuid.v4();
        var engine = new Engine(profile, fileSize, id, this.getUrl(id));
        uuidRequest[id] = engine;
        return engine;
    };

    /**
     * ffprobe gathers information from multimedia streams and prints it in human- and machine-readable fashion.
     * this is needed by the engine to determine format info.
     * @param  {Engine}   engine  encoding engine to pass data to
     * @param  {object}   options ffprobe options, currently unused
     * @param  {Function} cb callback when probe is ready
     */
    this.probe = function(engine, options, cb) {
        _log("probing engine for data", engine, options);
        return new Promise(function(resolve, reject) {
          if(engine.hasProbed) {
            resolve(engine.probeData);
          } else {
            ffmpeg.ffprobe(Encoder.getUrl(engine.id), function(err, metadata) {
                engine.setProbeData(metadata);
                resolve(metadata);
            });
          }
        });
    };

    /**
     * Fetch probe media for info and start transcoding via ffmpeg
     * @param  {Engine}   engine  device specific engine to use
     * @param  {object}   options Options: (currently only startTime and force )
     * @param  {Function} cb      callback to execute on encoding progress
     */
    this.encode = function(engine, options) {
        engine.forceTranscode = options.force;
        if (!engine.hasProbed) {
            return Encoder.probe(engine, {}).then(function(metadata) {
              return Encoder.encode(engine, options);
            });
        } else {
            return engine.getFFmpegOptions(Encoder.getUrl(engine.id)).then(function(inputOptions, outputOptions) {
                _log('Got FFmpeg options :', inputOptions, outputOptions);
                
                var command = ffmpeg(Encoder.getUrl(engine.id));
                if (options.startTime) {
                    command.seekInput(options.startTime);
                }

                command.on('start', function(commandLine) {
                   _log('Spawned Ffmpeg with command: ', commandLine);
                }).on('error', function() {
                    console.error(arguments);
                });

                command.inputOptions(inputOptions);
                command.outputOptions(outputOptions);

                return command;
            }, function(err) {
              throw new Error('Encoder: Error on getting FFmpegOptions: ', err);
            });
        }
    },

    /**
     * Fetch loopback url for file or return base url
     * @param  {string} fileId Optional fileId to append
     * @return {string} url
     */
    this.getUrl = function(fileId) {
        return "http://127.0.0.1:" + ffmpegPort + "/" + (fileId || '');
    }

};

/**
 * ffmpeg passthrough for GET requests to fetch a file
 * @param  {Request} req httprequest
 * @param  {Response} res http response
 */
app.get('/:fileId', function(req, res) {
    if (uuidRequest[req.params.fileId]) {
        uuidRequest[req.params.fileId].onRequest(req, res);
    } else {
        res.end();
    }
});

/**
 * ffmpeg passthrough for HEAD requests to fetch a file
 * @param  {Request} req httprequest
 * @param  {Response} res http response
 */
app.head('/:fileId', function(req, res) {
    if (uuidRequest[req.params.fileId]) {
        uuidRequest[req.params.fileId].onHeadRequest(req, res);
    } else {
        res.end();
    }
}); 

_log = function() {
  if(encoder.debug) {
    console.log("ENCODER: ");
    console.log.apply(this, arguments);
  }
};

var encoder = new Encoder();
module.exports = encoder;