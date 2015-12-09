var validAudioCodecs = [
    "aac",
    "mp3",
    "vorbis",
]

var validVideoCodecs = [
    "h264",
    "x264",
    "vp8"
]

var validFormats = [
    "matroska,webm",
    "mov,mp4,m4a,3gp,3g2,mj2",
    "mp3",
    "ogg"
]

function canPlay  (probeData) {

}

function canPlayAudio  (audioTrack) {

}

function canPlayVideo  (videoTrack) {
    
}

function canPlayContainer (probeData) {

}

function getFFMpegFlags (probeData) {
    
}

return {
    canPlay: canPlay,
    canPlayAudio: canPlayAudio,
    canPlayVideo: canPlayVideo,
    canPlayContainer: canPlayContainer,
    getFFMpegFlags: getFFMpegFlags
}