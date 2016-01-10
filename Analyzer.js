// analyzer gets passed a file and knows how to reach the ffmpeg server
// performs ffmpeg probe on it
// extracts audio and video streams

var ffmpegServer = require('./FFmpegServer'),
    ffmpeg = require('fluent-ffmpeg'),
    Promise = require('bluebird');


function Analyzer(Media) {
    var self = this;

    this.media = Media;

    /**
     * ffprobe gathers information from multimedia streams and prints it in human- and machine-readable fashion.
     * this is needed by the engine to determine format info.
     */
    this.analyze = function() {
        console.log("Performing FFMPEG probe");
        return new Promise(function(resolve, reject) {
            console.log("Get URL for media: ", self.media, ffmpegServer.getUrl(self.media));
            ffmpeg.ffprobe(ffmpegServer.getUrl(self.media), function(err, metadata) {
                console.log("FFProbe returned metadata: ", metadata, err);
                self.media.setMediaProfile(metadata);
                resolve(metadata);
            });
        });
    };


    this.canPlay = function() {
        if (!this.hasProbed) {
            return this.probe().then(function(metadata) {
                return this.canPlay(metadata);
            }, function(err) {
                throw new Error("Error during probe on profile!", err);
            });
        } else {
            return this._profile.canPlay(this._probeData);
        }
    };

}


module.exports = Analyzer;