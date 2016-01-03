var util = require('util'),
    Promise = require('bluebird');
BaseDeviceProfile = require('./BaseDevice');


function HTML5() {
    BaseDeviceProfile.call(this);
    this.id = 'HTML5';
    this.name = 'HTML5 Stream';

    this.cast = function(url, options) {
        console.log("load url on HTML5: ", url, options);
        return {
            url: url,
            options: options
        };
    };

}

util.inherits(HTML5, BaseDeviceProfile);

module.exports = HTML5;