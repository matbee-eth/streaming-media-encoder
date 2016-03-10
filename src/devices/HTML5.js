import BaseDeviceProfile from './BaseDevice'


export default class HTML5 extends BaseDeviceProfile {

    static id = 'HTML5';
    static name = 'HTML5 Stream';

    cast(url, options) {
        console.log("load url on HTML5: ", url, options)
        return {
            url,
            options
        }
    }
}
