var util = require('util'),
    BaseMedia = require('./BaseMedia');

function HTTPMedia(url) {
    BaseMedia.call(this);
    this.filename = url;
    this.filesize = 0;
}
util.inherits(HTTPMedia, BaseMedia);

module.exports = HTTPMedia;