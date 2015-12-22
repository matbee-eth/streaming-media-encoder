var util = require('util'),
	BaseMedia = require('./BaseMedia');

function FileMedia(filename) {
	BaseMedia.call(this);
	this.filename = filename;
	this.filesize = fs.statSync(filename);
}
util.inherits(FileMedia, BaseMedia);

module.exports = FileMedia;