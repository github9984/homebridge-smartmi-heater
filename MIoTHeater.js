var MIoTDevice = require('./MIoTDevice');

class MIoTHeater extends MIoTDevice {
    constructor(did, token, ip) {
        super(did, token, ip);

        this.dictionary = {
            'power'          : [2, 2], // bool                        
            'humidity'       : [5, 7], // Relative Humidity: 0-100(Percentage)
            'temp'           : [5, 8], // Temperature: -40-125 0.1
            'target_temp'    : [2, 6], // Temperature: 16-28 celsius  
            'child_lock'     : [7, 1], // Physical Control Locked : bool
            'led_brightness' : [6, 1], // 0 (bright), 1 (dim), 2 (off)            
            'buzzer'         : [3, 1], // bool             
        }

        for (var propertyName in this.dictionary) {
            this.trackProperty(this.dictionary[propertyName][0], this.dictionary[propertyName][1]);
        };
    }

    get(propertyName) {
        if (!this.dictionary.hasOwnProperty(propertyName)) {
            throw 'MIoTDevice property \'' + propertyName + '\' is not defined';
        }

        return this.getProperty(this.dictionary[propertyName][0], this.dictionary[propertyName][1]);
    }

    set(propertyName, value) {
        if (!this.dictionary.hasOwnProperty(propertyName)) {
            throw 'MIoTDevice property \'' + propertyName + '\' is not defined';
        }

        this.setProperty(this.dictionary[propertyName][0], this.dictionary[propertyName][1], value);
    }

    onChange(propertyName, callback) {
        if (!this.dictionary.hasOwnProperty(propertyName)) {
            throw 'MIoTDevice property \'' + propertyName + '\' is not defined';
        }

        this.onChangeProperty(this.dictionary[propertyName][0], this.dictionary[propertyName][1], callback);
    }

}

module.exports = MIoTHeater
