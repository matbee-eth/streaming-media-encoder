var findOpenPort = require('./find-open-port'),
    ffmpeg = require('fluent-ffmpeg'),
    express = require('express'),
    Engine = require('./Engine');


FFMpegServer = function(Engine) {

    var self = this;
    this.engine = Engine;
    this.port = 3001;
    this.server = null;
    this.app = express();

    findOpenPort(3001).then(function(port) {
        self.port = port;
        self.server = self.app.listen(port, function() {
            console.log('FFmpeg Webserver listening at %s', self.getUrl());
        });
    });

    /**
     * ffmpeg passthrough for GET requests to fetch a file
     * @param  {Request} req httprequest
     * @param  {Response} res http response
     */
    this.app.get('/:fileId', function(req, res) {
        console.log('ENGINE!', this.engine);
        var streamer = require('./Engine').getStreamer(req.params.fileId);
        if (streamer) {
            streamer.handle('GET', req, res);
        } else {
            res.end();
        }
    });

    /**
     * ffmpeg passthrough for HEAD requests to fetch a file
     * @param  {Request} req httprequest
     * @param  {Response} res http response
     */
    this.app.head('/:fileId', function(req, res) {
        var streamer = Engine.getStreamer(req.params.fileId);
        if (streamer) {
            streamer.handle('HEAD', req, res);
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
        return "http://127.0.0.1:" + this.port + "/" + (Media ? Media.id : '');
    };


};


module.exports = new FFMpegServer(Engine);