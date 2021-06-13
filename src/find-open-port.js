import net from 'net'

/**
 * scan the port range from the start port until we have an open port.
 * executes callback with the port number when we found one.
 * @param  {int}   port portnumber to start at
 * @return  {Promise} Promise that resolves when an open port was found.
 */
function findOpenPort(port) {
    return new Promise(resolve => {
        const server = net.createServer()
        server.listen(port, (err) => {
            server.once('close', () => resolve(port))
            server.close()
        })
        server.on('error', (err) => {
            server.close();
            return findOpenPort(port + 1)
        })
    })
}

export default findOpenPort
