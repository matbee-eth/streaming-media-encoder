var util = require('util');

/**
 * The streamer handles the HTTP communication part for streaming
 * - Fetches info about the desired stream id from the engine 
 * - hooks up events that kicks off the encoder when needed
 * - commands the device profile to send the correct response headers for the Media
 */
function Streamer(streamId, Encoder) {
	this.streamId = streamId;
	this.encoder = Encoder;
}

Streamer.prototype.handle = function(request, response) {
	// handle request headers
	// attach streamneeded stuff
	// pipe stuff from onRequest below 
};


Streamer.prototype.onHeadRequest = function (req, res) {
    this._log("onHeadRequest", req, res);
    res.end();
};

Streamer.prototype.onRequest = function(req, res) {
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
    this.emit("streamNeeded", range.start, range.end, function (stream) {
        stream.pipe(res);
        stream.on('end', function () {
            res.end();
        });
    });
};


/**
 * Start a new transcoding process (any leftovers will automatically die off)
 * @param  {timestamp} time starttime to play at hh:mm:ss
 * @return void
 */
Streamer.prototype.startEncoder = function(time) {
    this.encoder.encode(engine, {
        force: true,
        startTime: time || "00:00:00",
    }, function(stream) {
        stream.pipe(res, {
            end: true
        });
        stream.on("end", function() {
            console.log("stream ended, nothing more to do.");
            res.end();
        });
    });
};




module.exports = Streamer;