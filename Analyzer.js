// analyzer gets passed a file and knows how to reach the ffmpeg server
// performs ffmpeg probe on it
// extracts audio and video streams

var ffmpeg = require('./FFmpegServer'),
	Promise = require('bluebird');


function Analyzer() {

	// todo: make this independent from engine
	// 
	/**
	 * ffprobe gathers information from multimedia streams and prints it in human- and machine-readable fashion.
	 * this is needed by the engine to determine format info.
	 * @param  {Engine}   engine  encoding engine to pass data to
	 * @param  {object}   options ffprobe options, currently unused
	 * @param  {Function} cb callback when probe is ready
	 */
	this.probe = function(engine, options, cb) {
	    _log("probing engine for data", engine, options);
	    return new Promise(function(resolve, reject) {
	      if(engine.hasProbed) {
	        resolve(engine.probeData);
	      } else {
	        ffmpeg.ffprobe(Encoder.getUrl(engine.id), function(err, metadata) {
	            engine.setProbeData(metadata);
	            resolve(metadata);
	        });
	      }
	    });
	};


}


module.exports = Analyzer;