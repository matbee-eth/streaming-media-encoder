var Engine = require('./Engine'),
	express = require('express'),
	ip = require('my-local-ip'),
	findOpenPort = require('./find-open-port'),
	expressServer = null,
	app = express();

/**
 * This example starts an express server and serves one url: "/request-from-chromecast"
 * Pass this url to your chromecast to load on the endpoint provided at startup
 * to have the video automagically transcoded through FFMPEG
 */

findOpenPort(3000).then(function(port) {
	expressServer = app.listen(port, function() {
	    var port = expressServer.address().port;

	    console.log('streaming-media-encoder Webserver listening at http://%s:%s', ip(), port);
	});
});

app.get('/debug', function(req,res) {
	res.header('Content-Type: text/html');
	res.send(fs.readFileSync(_dirname + '/debug.html'));
});

app.get('/debug-info', function(req,res) {
	res.json(Engine);
});

app.get('/discover', function(req, res) {
	console.log("starting discovery");
	Engine.discover().then(function(devices) {
		console.log('500ms discovery done', devices);
		res.json(devices);
	}).catch(function(E) {
		throw E;
	});
});

app.get('/devicelist', function(req, res) {
	res.json(Engine.getDeviceList());
});

app.get('/control/:deviceGUID', function(req,res) {
	var device = Engine.getDeviceByGUID(req.params.deviceGUID);
	device.control(req.query.action, req.query).then(res.json);
});

app.get('/cast/:deviceGUID', function(req, res) {

	var device = Engine.getDeviceByGUID(req.params.deviceGUID);
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
	var options = {
		title: '#ripmatbee',
		subtitles: './../matbee.srt'
	};
	Engine.cast(device, media, options).then(res.json);
});


app.get('/stream/:streamId', function(req,res) {
	var streamer = Engine.getStreamer(streamId, app) ;
	streamer.handle(req,res);
});

module.exports = app;