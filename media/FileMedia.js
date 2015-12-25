var util = require('util'),
    fs = require('fs'),
    BaseMedia = require('./BaseMedia');

function FileMedia(filename) {
    BaseMedia.call(this);
    this.filename = filename;
    this.filesize = fs.statSync(filename);

    this.streamNeeded = function(startByte, endByte, cb) {
        console.info("streamNeeded", startByte, endByte);
        cb(fs.createReadStream(this.filename, {
            start: startByte,
            end: endByte
        }));
    };

}


util.inherits(FileMedia, BaseMedia);

module.exports = FileMedia;