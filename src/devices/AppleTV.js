var util = require('util'),
    Promise = require('bluebird');
    BaseDeviceProfile = require('./BaseDevice');



function AppleTV() {



}



util.inherts(AppleTV, BaseDevice);

module.exports = AppleTV;