# streaming-media-encoder

A dead simple way to deliver Chromecast formatted media to the Chromecast. Supports any media that supports ReadStreams.

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
If isSupported is true, then you can just send the file to the streaming device.
If isSupported is false, you will have to encode the media.
```
engine.canPlay(function (isSupported));
```


```
