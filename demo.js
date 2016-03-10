import Promise from 'bluebird'

import StreamingMediaServer from './StreamingMediaServer'
import Engine from './Engine'


Promise.onPossiblyUnhandledRejection((error) => {
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

Engine.discover()
