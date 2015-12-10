# streaming-media-encoder

A dead simple way to deliver media correctly formatted to streaming devices. Supports any media that supports ReadStreams.

`npm install streaming-media-encoder`

```
var encoder = require('streaming-media-encoder');
var engine = encoder.profile(encoder.profiles.CHROMECAST, file.size);
```

## This system relies heavily on you providing Streams on demand.
This can be a local file, or any byte range supported ReadStream.

```
engine.on("streamNeeded", function (startByte, endByte, cb) {
    cb(fs.createReadStream(file, {start: startByte, end: endByte}));
});
```

## Detecting if Transcoding is even necessary
```
/**
 * analyze the file stream to see what type of media we're dealing with and if it's playable
 *
 * the mediaInfo object tells you all you need: {
 *      isAudioMedia: boolean,
 *      isVideoMedia: boolean,
 *      audioNeedsTranscoding: boolean
 *      videoNeedsTranscoding: boolean
 *      formatNeedsTranscoding: boolean,
 * }
 */
engine.analyze(function(mediaInfo) {
	if(mediaInfo.formatNeedsTranscoding) {
		// start engine encoding
    } else { 
    	// pass through the regular 'express' way 
    }
});
```

## Optionally you can supply startTime to the encode function, to seek.
In this example `res` is an Express response object.
```
encoder.encode(engine, {
        startTime: "00:00"
    }, function (stream) {
      stream.pipe(res, {end: true});
     }
);
```