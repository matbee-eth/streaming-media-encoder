var findOpenPort = require('./find-open-port'),
    ffmpeg = require('fluent-ffmpeg'),
    express = require('express'),
    Engine = require('./Engine');


FFMpegServer = function() {

    var self = this;

    this.port = 3001;
    this.server = null;
    this.app = express();

    findOpenPort(3001).then(function(port) {
        self.port = port;
        self.server = app.listen(port, function() {
            _log('FFmpeg Webserver listening at %s', self.getUrl());
        });
    });

    this.onHeadRequest = function(req, res) {
        this._log("onHeadRequest", req, res);
        res.end();
    };

    this.onRequest = function(req, res) {
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Type', this.contentType);
        res.statusCode = 200;
        var range;
        if (req.headers.range) {
            range = rangeParser(this._fileSize, req.headers.range)[0];
            res.setHeader(
                'Content-Range',
                'bytes ' + range.start + '-' + range.end + '/' + this._fileSize
            );
            res.setHeader('Content-Length', range.end - range.start + 1);
        } else {
            res.setHeader('Content-Length', this._fileSize);
        }
        this.emit("streamNeeded", range.start, range.end, function(stream) {
            stream.pipe(res);
            stream.on('end', function() {
                res.end();
            });
        });
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

    /**
     * Fetch loopback url for file or return base url
     * @param  {string} fileId Optional fileId to append
     * @return {string} url
     */
    this.getUrl = function(Media) {
        return "http://127.0.0.1:" + this.getUrl() + "/" + (Media ? Media.getID() : '');
    };


}


module.exports = new FFMpegServer();