// MediaProfile is the output from Analyzer
// hold a link to Media and vice versa
// contains info on media's video/audio streams and types



export default class MediaProfile {
    constructor(Media, Profile) {
        this.media = Media
        this.profile = Profile
    }
}
