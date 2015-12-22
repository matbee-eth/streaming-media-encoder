var Engine = require('./Engine'),
	express = require('express');

var app = express();

/**
 * This example starts an express server and serves one url: "/request-from-chromecast"
 * Pass this url to your chromecast to load on the endpoint provided at startup
 * to have the video automagically transcoded through FFMPEG
 */

expressServer = app.listen(port, function() {
    var host = expressServer.address().address;
    var port = expressServer.address().port;

    console.log('streaming-media-encoder Webserver listening at http://%s:%s', host, port);
});



app.get('/debug', function(req,res) {
	res.header('Content-Type: text/html');
	res.send(fs.readFileSync(_dirname + '/debug.html'));
});

app.get('/debug-info', function(req,res) {
	res.json(Engine);
});


app.get('/discover', function(req, res) {
	Engine.discover().then(res.json);
});

app.get('/control/:deviceClass/:deviceName', function(req,res) {
	var device = Engine.getDevice(req.params.deviceClass, req.params.deviceName);
	device.control(req.query.action, req.query).then(res.json);
});

app.get('/cast/:deviceClass/:deviceName', function(req, res) {

	var device = Engine.getDevice(req.params.deviceClass, req.params.deviceName);
	var media;

	if(req.query.url) {
		media = new HTTPMedia(req.query.path);
	}

	if(req.query.path) {
		media = new LocalFileMedia(req.query.path);
	}

	if(req.query.magnet) {
		media = new TorrentMedia(req.query.magnet);
	}
	// cast performs the media analyze
	// and creating the new streamer for this media on devicename
	Engine.cast(device, media).then(res.json);
});


app.get('/stream/:streamId', function(req,res) {
	var streamer = Engine.getStreamer(streamId, app);
	streamer.handle(req,res);
});

module.exports = app;