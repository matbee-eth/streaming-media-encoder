import express from 'express'
import ffmpeg from 'fluent-ffmpeg'
import findOpenPort from './find-open-port'
import Engine from './Engine'


class FFMpegServer {
    constructor() {
        this.app = express()
        this.server = null
        this.port = 3001


        findOpenPort(3001).then(port => {
            this.port = port
            this.server = this.app.listen(port, () => console.log('FFmpeg Webserver listening at %s', this.getUrl()))
        })


        /**
         * ffmpeg passthrough for GET requests to fetch a file
         * @param  {Request} req httprequest
         * @param  {Response} res http response
         */
        this.app.get('/:fileId', (req, res) => {
            console.log('ENGINE!', Engine)
            const streamer = Engine.getStreamer(req.params.fileId)
            if (streamer)
                streamer.handle('GET', req, res)
            else
                res.end()
        })


        /**
         * ffmpeg passthrough for HEAD requests to fetch a file
         * @param  {Request} req httprequest
         * @param  {Response} res http response
         */
        this.app.head('/:fileId', (req, res) => {
            const streamer = Engine.getStreamer(req.params.fileId)
            if (streamer)
                streamer.handle('HEAD', req, res)
            else
                res.end()
        })
    }

    /**
     * Fetch loopback url for file or return base url
     * @param  {string} fileId Optional fileId to append
     * @return {string} url
     */
    getUrl = Media => `http://127.0.0.1:${this.port}/${(Media ? Media.id : '')}`
}

export default new FFMpegServer()
