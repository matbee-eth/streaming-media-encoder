var util = require('util'),
    Promise = require('bluebird');
    BaseDeviceProfile = require('./BaseDeviceProfile');

function DLNAProfile() {
    BaseDeviceProfile.call(this);

    this.audioNeedsTranscodingCodecs = [
        "aac"
    ];

    this.videoNeedsTranscodingCodecs = [
        "h264"
    ];

    this.validFormats = [
        "mp4,m4a",
        "mp3"
    ];

    /*
    @matbee PICK ONE
    AVC_MP4_EU ->
       AVC_MP4_MP_SD_AAC_MULT5
       AVC_MP4_MP_SD_AC3
       AVC_MP4_BL_CIF15_AAC_520
       AVC_MP4_BL_CIF30_AAC_940
       AVC_MP4_BL_L31_HD_AAC
       AVC_MP4_BL_L32_HD_AAC
       AVC_MP4_BL_L3L_SD_AAC
       AVC_MP4_HP_HD_AAC
       AVC_MP4_MP_HD_1080i_AAC
       AVC_MP4_MP_HD_720p_AAC
  */
 

    /*
        DLNA.ORG_PN= media profile
        DLNA.ORG_OP=ab a : server supports TimeSeekRange [0/1], b:server supports RANGE [0/1] 
        DLNA.ORG_PS= supported play speeds [-1/3,-1/2,-15,-2,-300,-30,-5,-60,1/3,1/2,15,2,300,30,60 ]
        DLNA.ORG_CI=[0/1] media is transcoded
        DLNA.ORG_FLAGS= binary flags with device parameters
    */
    this.transcodedMediaProfile = 'AVC_MP4_HP_HD_AAC';

    this.getcontentFeaturesHeader = function() {
        var pn = 'DLNA.ORG_PN='+this.transcodedMediaProfile+';';
        var op = 'DLNA.ORG_OP=10;'; // we only support time seek ranges for now
        var cn = 'DLNA.ORG_CI=1;'; // always transcoded for now
        var ps = 'DLNA.ORG_PS=1'; // play speed normal supported for now

        // DLNA.ORG_FLAGS, padded with 24 trailing 0s

        var dlna_flags = {
          senderPaced                       : (1 << 31), // 0x80000000
          lsopTimeBasedSeekSupported        : (1 << 30), // 0x40000000
          lsopByteBasedSeekSupported        : (1 << 29), // 0x20000000
          playcontainerSupported            : (1 << 28), // 0x10000000
          s0IncreasingSupported             : (1 << 27), // 0x8000000
          sNIncreasingSupported             : (1 << 26), // 0x4000000
          rtspPauseSupported                : (1 << 25), // 0x2000000
          streamingTransferModeSupported    : (1 << 24), // 0x1000000
          interactiveTransferModeSupported  : (1 << 23), // 0x800000
          backgroundTransferModeSupported   : (1 << 22), // 0x400000
          connectionStallingSupported       : (1 << 21), // 0x200000
          dlnaVersion15Supported            : (1 << 20) // 0x100000
        };
        var supportedFlags = dlna_flags.connectionStallingSupported | dlna_flags.streamingTransferModeSupported | dlna_flags.dlnaVersion15Supported;
        var flags = 'DLNA.ORG_FLAGS='+(supportedFlags >>> 0).toString(16); 
        return ['http-get:*:',this.contentType,':',pn,op,cn,ps,flags,'000000000000000000000000'].join('');
    };

    this.contentType = 'video/mp4';

    /**
     * @type {Object}
     */
    this.httpHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'video/mp4',
        'protocolInfo': 'http-get:*:'+this.contentType+':*',
        'contentFeatures.dlna.org': this.getContentFeaturesHeader(),
        'transferMode.dlna.org': 'Streaming'
    };

    this.getHeaders= function() {
        return this.httpHeaders;
    }

    /*
        TimeSeekRange.dlna.org
        X-Seek-Range
        PlaySpeed.dlna.org
        availableSeekRange.dlna.org
        getAvailableSeekRange.dlna.org
        getcontentFeatures.dlna.org
        contentFeatures.dlna.org
        transferMode.dlna.org
        Available-Range.dlna.org
        realTimeInfo.dlna.org
        Max-Prate.dlna.org
        Event-Type.dlna.org
        Supported
        PRAGMA
        > https://github.com/cmtsij/Vizio_XWR100_GPL/blob/e0b5d08ea08fd23400b4e85d772f83dcf16d999a/GTK/user/apps/dlna-GTK-DMS/HttpFiles/DlnaHttp.h
     */
    
    this.mimeTypeRemapHack = function(dmrFriendlyName, mime) {
        var hacks = {
            'Samsung DTV DMR' : {
                'video/x-matroska' : 'video/x-mkv',
                'video/x-avi' : 'video/x-msvideo',
                'application/x-subrip': 'smi/caption'
            }
        };
        return (dmrFriendlyName in hacks && mim in hacks[dmrFriendlyName]) ? hacks[dmrFriendlyName][mime] : mime; 
    };

    this.processSupportedProtocols = function(capabilities) {
        console.log("Process capabilities!", capabilities);
    };

    this.getFFmpegFlags = function (probeData, forceTranscode) {
        var analysis = this.transcodeNeeded(probeData),
            canPlay = analysis.needsTranscoding,
            formatNeedsTranscoding = analysis.formatNeedsTranscoding,
            audioNeedsTranscoding = analysis.audioNeedsTranscoding,
            videoNeedsTranscoding = analysis.videoNeedsTranscoding,
            outputOptions = [],
            inputOptions = [];

        if (analysis.isVideoMedia) {
            if (audioNeedsTranscoding || audioShiftCorrect) {
                if(audioShiftCorrect) {
                    inputOptions.push(audioShiftCorrect);
                }
                outputOptions.push("-acodec aac");
            } else {
                outputOptions.push("-acodec copy");
            }
            
            if (videoNeedsTranscoding || rescaleVideo || subtitle) {
                if(subtitle) {
                    outputOptions.push(subtitle);
                }
                if(rescaleVideo) {
                    outputOptions.push(rescaleVideo);
                }
                outputOptions.push("-vcodec libx264");
            } else {
                outputOptions.push("-vcodec copy");
            }

            outputOptions.push("-copyts");
            outputOptions.push("-preset ultrafast");
            outputOptions.push("-tune zerolatency");
            outputOptions.push("-crf 28");
            outputOptions.push("-bsf:v h264_mp4toannexb");
            outputOptions.push("-f mp4");
        } else if (analysis.isAudioMedia) {
            console.log("VALID AUDIO?", audioNeedsTranscoding);
            if (audioNeedsTranscoding) {
                outputOptions.push("-acodec libvorbis");
                outputOptions.push("-f ogg");
            } else {
                outputOptions.push("-f " + probeData.format.format_name);
            }
        }
        return new Promise(function(resolve) {
            resolve(inputOptions, outputOptions);
        });
    };

}

util.inherits(DLNAProfile, BaseDeviceProfile);

module.exports = new DLNAProfile();