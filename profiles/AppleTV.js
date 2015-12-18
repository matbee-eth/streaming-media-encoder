var DLNAProfile = require('/DLNA'),
	util = require('util');

/**
 * AppleTVProfile: 1:1 DLNA proxy for now.
 */
function AppleTVProfile() {
    DLNAProfile.call(this);
}

util.inhertis(AppleTVProfile, BaseDeviceProfile);



module.exports = new AppleTVProfile();