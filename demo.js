var Promise = require('bluebird');

Promise.onPossiblyUnhandledRejection(function(error) {
    throw error;
});

Promise.config({
    // Enable warnings.
    warnings: true,
    // Enable long stack traces.
    longStackTraces: true,
    // Enable cancellation.
    cancellation: true
});

var server = require('./StreamingMediaServer');
require('./Engine').discover();