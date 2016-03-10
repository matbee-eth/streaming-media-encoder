import net from 'net'
import { v4 as uuid } from 'node-uuid'
import ffmpeg from 'fluent-ffmpeg'
import util from 'util'
import express from 'express'

import Engine from './Engine'
import FFMpegServer from './FFmpegServer'


/**
 * The encoder is where the magic happens.
 * Communicates with a device specific profile via an express server with ffmpeg
 * provides streamable output that can be piped directly into (for instance) Express
 */
export default class Encoder {
    constructor(Media, Device) {
        this.media = Media;
        this.device = Device;
    }

    static getContentType = () => 'video/mp4';


    /**
     * Proxy forwarder for profile getFFmpegFlags
     * @see BaseDeviceProfile.prototype.getFFmpegFlags
     * @return {Promise} promise that resolves with inputOptions and outputOptions
     */
    getFFmpegOptions() {
        if (!this.media.getMediaProfile()) {
            throw new Error("NO PROBE HAS BEEN DONE NOOB!");
        }
        console.log("Engine.getFFmpegOptions");
        return this.media.getMediaProfile().getFFmpegFlags();
    }


    /**
     * [streamRange description]
     * @param  {[type]} start start byte
     * @param  {[type]} end   end byte
     * @return {ffmpeg}       fluent-ffmpeg instance
     */
    streamRange(start, end) {
        return this.media.getFFmpegOptions(Encoder.getUrl(engine.id)).then((inputOptions, outputOptions) => {
            console.log('Got FFmpeg options :', inputOptions, outputOptions)

            var command = ffmpeg(Encoder.getUrl(engine.id))
            if (options.startTime)
                command.seekInput(options.startTime)

            command
                .on('start', commandLine => console.log('Spawned Ffmpeg with command: ', commandLine))
                .on('error', () => console.error(arguments))

            command.inputOptions(inputOptions)
            command.outputOptions(outputOptions)

            return command
        }, err => {
            throw new Error('Encoder: Error on getting FFmpegOptions: ', err)
        })
    }


    /**
     * Fetch loopback url for file or return base url
     * @param  {string} fileId Optional fileId to append
     * @return {string} url
     */
    getUrl = fileId => FFMpegServer.getUrl(this.media);


    /**
     * Proxy forwarder for BaseDeviceProfile.prototype.rescale
     * @see BaseDeviceProfile.prototype.rescale
     * @param  {int} size max video width
     * @return {Engine} returns `this` for fluent interfacing
     */
    rescale(size) {
        this._profile.rescale(size)
        return this
    }


    /**
     * Proxy forwarder for BaseDeviceProfile.prototype.hardCodeSubtitle
     * @see BaseDeviceProfile.prototype.hardCodeSubtitle
     * @param  {string } full path to .srt file
     * @return {Engine} returns `this` for fluent interfacing
     */
    hardCodeSubtitle(subPath) {
        this._profile.hardCodeSubtitle(subPath)
        return this
    }


    /**
     * Proxy forwarder for BaseDeviceProfile.prototype.correctAudioOffset
     * @see BaseDeviceProfile.prototype.correctAudioOffset
     * @param  {float} offset in seconds
     * @return {Engine} returns `this` for fluent interfacing
     */
    correctAudioOffset(seconds) {
        this._profile.correctAudioOffset(seconds)
        return this
    }
}
