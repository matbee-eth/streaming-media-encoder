var RendererFinder = require('renderer-finder');
var MediaRendererClient = require('upnp-mediarenderer-client');
var finder = new RendererFinder();

finder.on('found', function(info, msg, desc){

	 console.log("rendering to ", desc.device.friendlyName, 'loc: '+msg.location, info, msg, desc);  
	// Instanciate a client with a device description URL (discovered by SSDP)
	var client = new MediaRendererClient(msg.location);
	client.getSupportedProtocols(function(err, result) {
	console.log('capabilities: ', result);
	 process.exit();
	});

	// Load a stream with subtitles and play it immediately
	var options = { 
	  autoplay: true,
	  contentType: 'video/mp4',
	  metadata: {
	    title: 'Yo mama',
	    creator: 'SchizoDuckie',
	    type: 'video', // can be 'video', 'audio' or 'image'
	  }
	};

	client.load('http://192.168.0.196:9090/stream-with-transcode', options, function(err, result) {
	  if(err) throw err;
	  console.log('NOW playing ...', err, result, client);
	});


	// Unpause
	
	setTimeout(function() {
		console.log("play!");
		client.play();
	}, 1000);
	
	setTimeout(function() {
		client.play();
		console.log("play!", client);
	}, 4000);
	
	// Seek to 10 minutes
	//client.seek(10 * 60);

	client.on('status', function(status) {
	  // Reports the full state of the AVTransport service the first time it fires,
	  // then reports diffs. Can be used to maintain a reliable copy of the
	  // service internal state.
	  console.log(status);
	});

	client.on('loading', function() {
	  console.log('------> loading', arguments);
	});

	client.on('playing', function() {
	  console.log('playing');

	  client.getPosition(function(err, position) {
	    console.log(position); // Current position in seconds
	  });

	  client.getDuration(function(err, duration) {
	    console.log(duration); // Media duration in seconds
	  });
	});

	client.on('paused', function() {
	  console.log('paused');
	});

	client.on('stopped', function(args) {
	  console.log('stopped', arguments);
	});

 });

finder.start(true);
