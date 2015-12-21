var findOpenPort = require('./find-open-port'),
    ffmpeg = require('fluent-ffmpeg'),
    app = require('./StreamingMediaServer'),
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