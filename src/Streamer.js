import util from 'util'
import path from 'path'
import fs from 'fs'
import pump from 'pump'

import Engine from './Engine'
import Encoder from './Encoder'
import FFmpegServer from './FFmpegServer'

const METHOD_GET = 'GET'
const METHOD_HEAD = 'HEAD'



/**
 * The streamer handles the HTTP communication part for streaming
 * - Fetches info about the desired stream id from the engine
 * - hooks up events that kicks off the encoder when needed
 * - commands the device profile to send the correct response headers for the Media
 */
export default class Streamer {
    constructor(StreamId, Media, Device) {
        this.id = StreamId
        this.encoder = new Encoder(Media, Device)
        this.contentType = this.encoder.getContentType()
    }

    getUrl = () => `${FFmpegServer.getUrl()}/${this.id}`;


    /**
     * Handle streaming request for a media id
     * @param  {string} type     Request type (GET / HEAD)
     * @param  {[type]} req  [description]
     * @param  {[type]} res [description]
     * @return {Object} range with start and end
     */
    handle(type, req, res) {
        console.log("STREAMER   Handle: ", type)
        res.setHeader('Content-Type', this.encoder.getContentType())
        req.connection.setTimeout(Number.MAX_SAFE_INTEGER)

        switch (type) {
            case METHOD_GET:
                console.log('Processing GET method!', req)
                var range = this.handleRangeHeaders(req, res)
                var seekTime = this.handleSeek(req, res)
                var playbackSpeed = this.handlePlaybackSpeed(req, res)
                this.encoder.streamRange(range.start, range.end, seekTime, playbackSpeed).then((stream) => stream.pipe(res, {
                    end: true
                }))
                break
            case METHOD_HEAD:
                // the encoder knows how the media and the device are connected and can send optional headers.
                // for instance: DLNA can send a HEAD request with getContentFeatures.DLNA.ORG, to which must be
                // responsed with contentfeatures.DLNA.ORG for the features of the subsequent GET requests. 
                this.encoder.handleHEADRequest(req, res)
                res.end()
                console.log("HEAD Request", req, res)
                break
        }
    }


    /**
     * Auto-seek to 00:00:00 or have the device profile encoded to handle seeking on the stream
     * @param  {[type]} req [description]
     * @param  {[type]} res [description]
     * @return {[type]}     [description]
     */
    handleSeek(req, res) {
        if (req.query.startTime)
            return req.query.startTime
        else
            return this.encoder.getDevice().handleSeek(req, res)
    }


    /**
     * change playback speed based on device headers or GET parameters.
     * @param  {[type]} req [description]
     * @param  {[type]} res [description]
     * @return {[type]}     [description]
     */
    handlePlaybackSpeed(req, res) {
        if (req.query.playbackSpeed)
            return req.query.playbackSpeed
        else
            return this.encoder.getDevice().handlePlaybackSpeed(req, res)
    }


    handleRangeHeaders(req, res) {
        let range = {
            start: 0,
            end: this.encoder.media.filesize - 1
        }

        res.setHeader('Accept-Ranges', 'bytes')
        if (req.headers.range) {
            res.statusCode = 206
            range = rangeParser(this.encoder.media.filesize, req.headers.range)[0]
            res.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${this.encoder.media.filesize}`)
            res.setHeader('Content-Length', range.end - range.start + 1)
        } else {
            res.setHeader('Content-Length', this.encoder.media.filesize)
        }
        return range
    }


    noTranscoding = (req, res) => fs.stat(activeFile, (err, { size }) => this.sendFile(req, res, activeFile, size));


    sendFile(req, res, filePath, filesize) {
        let range
        const filename = path.basename(filePath)

        //res.setHeader('Accept-Ranges', 'bytes');

        if (req.headers.range) {
            range = rangeParser(filesize, req.headers.range)[0];
            res.statusCode = 206;
            // no support for multi-range reqs
            range = rangeParser(filesize, req.headers.range)[0];
            console.log('range %s', JSON.stringify(range));

            res.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${filesize}`)
            res.setHeader('Content-Length', range.end - range.start + 1)
        } else {
            res.setHeader('Content-Length', filesize)
        }

        console.log("Streaming Video Data", res)
            // Stream the video into the video tag
        return pump(fs.createReadStream(filePath, range), res)
    }
}
