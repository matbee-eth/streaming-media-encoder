var Promise = require('bluebird');
var net = require('net');

/**
 * scan the port range from the start port until we have an open port.
 * executes callback with the port number when we found one.
 * @param  {int}   port portnumber to start at
 * @return  {Promise} Promise that resolves when an open port was found.
 */
function findOpenPort(port) {

	return new Promise(function(resolve) {
	    var server = net.createServer();
	    server.listen(port, function(err) {
	        server.once('close', function() {
	            resolve(port);
	        });
	        server.close();
	    });
	    server.on('error', function(err) {
	        server.close();
	        return findOpenPort(port + 1);
	    });

	});
}

module.exports = findOpenPort; 