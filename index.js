'use strict';
// http://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:heater:0000A01A:zhimi-za2:1

var Service, Characteristic;
var MIoTDevice = require('./MIoTHeater');

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory("homebridge-smartmi-heater", "SmartmiHeater", Heater);
}

function Heater(log, config) {
    var that = this;
    this.log = log;
    this.services = [];
    this.did = config['did'];

    this.enableLED = config['enableLED'] || false;
    this.enableLEDName = config["enableLEDName"] || "LED";
    this.enableBuzzer = config['enableBuzzer'] || false;
    this.enableBuzzerName = config["enableBuzzerName"] || "Buzzer";

    this.minTemp = config["minTemp"] || 16;
    this.maxTemp = config["maxTemp"] || 28;

    this.polling_interval = config['polling_interval'] || 60000;


    this.device = new MIoTDevice(config['did'], config['token'], config['ip']);

    this.device.onChange('power', value => {
        that.updateActive();
        that.updateStatusActive();
    });

    this.device.onChange('child_lock', value => {
        that.updateLockPhysicalControls();
    });

    this.device.onChange('temp', value => {
        that.updateTemperature();
    });

    this.device.onChange('target_temp', value => {
        that.updateHeatingThresholdTemperature();
    });

    this.device.onChange('humidity', value => {
        that.updateHumidity();
    });

    if (this.enableLED) {
        this.device.onChange('led_brightness', value => {
            that.updateLED();
        });
    }

    if (this.enableBuzzer) {
        this.device.onChange('buzzer', value => {
            that.updateBuzzer();
        });
    }

    setInterval(function () {
        try {
            that.log('Polling properties every ' + that.polling_interval + ' milliseconds');
            that.device.pollProperties();
        } catch (e) {
            that.log(e);
        }
    }, that.polling_interval);
}

Heater.prototype.getServices = function () {
    // Accessory Information Service
    this.informationService = new Service.AccessoryInformation();

    this.informationService
        .setCharacteristic(Characteristic.Name, this.name)
        .setCharacteristic(Characteristic.Manufacturer, 'Smartmi')
        .setCharacteristic(Characteristic.Model, 'zhimi.heater.za2')
        .setCharacteristic(Characteristic.SerialNumber, this.did)
        .setCharacteristic(Characteristic.FirmwareRevision, '1.0.0')

    // Service
    this.service = new Service.HeaterCooler(this.name);

    this.service
        .getCharacteristic(Characteristic.Active)
        .on('get', this.getActive.bind(this))
        .on('set', this.setActive.bind(this));

    this.service.getCharacteristic(Characteristic.CurrentTemperature)
        .on('get', this.getTemperature.bind(this));

    this.service.addCharacteristic(Characteristic.TemperatureDisplayUnits)
        .setValue(Characteristic.TemperatureDisplayUnits.CELSIUS)
        .setProps({
            validValues: [0]
        });

    this.service.addCharacteristic(Characteristic.CurrentRelativeHumidity)
        .on('get', this.getHumidity.bind(this));


    this.service.getCharacteristic(Characteristic.CurrentHeaterCoolerState)
        .setProps({
            validValues: [0, 2]
        });

    this.service.getCharacteristic(Characteristic.TargetHeaterCoolerState)
        .setProps({
            validValues: [1]
        })
        .setValue(Characteristic.TargetHeaterCoolerState.HEAT);

    this.service.getCharacteristic(Characteristic.HeatingThresholdTemperature)
        .setProps({
            minValue: this.minTemp,
            maxValue: this.maxTemp,
            minStep: 1,
        })
        .on('get', this.getHeatingThresholdTemperature.bind(this))
        .on('set', this.setHeatingThresholdTemperature.bind(this));

    this.service
        .getCharacteristic(Characteristic.LockPhysicalControls)
        .on('get', this.getLockPhysicalControls.bind(this))
        .on('set', this.setLockPhysicalControls.bind(this));

    // Buzzer
    if (this.enableBuzzer) {
        this.buzzerService = new Service.Switch(this.enableBuzzerName);
        this.buzzerService
            .getCharacteristic(Characteristic.On)
            .on('get', this.getBuzzer.bind(this))
            .on('set', this.setBuzzer.bind(this));
        this.services.push(this.buzzerService);
    }
    // LED
    if (this.enableLED) {
        this.lightService = new Service.Lightbulb(this.enableLEDName);
        this.lightService
            .getCharacteristic(Characteristic.On)
            .on('get', this.getLED.bind(this))
            .on('set', this.setLED.bind(this));
        this.services.push(this.lightService);
    }

    // Publish Services
    this.services.push(this.informationService);
    this.services.push(this.service);


    return this.services;
}



Heater.prototype.getActive = function (callback) {
    this.log('getActive');

    try {
        var value = this.device.get('power');

        if (value == true) {
            return callback(null, Characteristic.Active.ACTIVE);
        } else {
            return callback(null, Characteristic.Active.INACTIVE);
        }
    } catch (e) {
        this.log('getActive Failed: ' + e);
        callback(e);
    }
}

Heater.prototype.setActive = function (targetState, callback, context) {
    this.log('setActive ' + targetState + ' ' + context);

    if (context === 'fromOutsideHomekit') { return callback(); }

    try {
        if (targetState == Characteristic.Active.ACTIVE) {
            this.device.set('power', true);
        } else {
            this.device.set('power', false);
        }

        callback();
    } catch (e) {
        this.log('setActive Failed: ' + e);
        callback(e);
    }
}

Heater.prototype.updateActive = function () {

    try {
        var value = this.device.get('power');
        var targetValue = value ? Characteristic.Active.ACTIVE : Characteristic.Active.INACTIVE;

        this.service
            .getCharacteristic(Characteristic.Active)
            .setValue(targetValue, undefined, 'fromOutsideHomekit');


        this.log('updateActive to ' + value);
    } catch (e) {
        this.log('updateActive Failed: ' + e);
    }
}

Heater.prototype.getHeatingThresholdTemperature = function (callback) {
    this.log('getHeatingThresholdTemperature');

    try {
        var value = this.device.get('target_temp');

        return callback(null, value);

    } catch (e) {
        this.log('getHeatingThresholdTemperature Failed: ' + e);
        callback(e);
    }
}

Heater.prototype.setHeatingThresholdTemperature = function (targetState, callback, context) {
    this.log('setHeatingThresholdTemperature ' + targetState + ' ' + context);

    if (context === 'fromOutsideHomekit') { return callback(); }

    try {
        this.device.set('target_temp', targetState);

        callback();
    } catch (e) {
        this.log('setHeatingThresholdTemperature Failed: ' + e);
        callback(e);
    }
}

Heater.prototype.updateHeatingThresholdTemperature = function () {

    try {
        var value = this.device.get('target_temp');

        this.service
            .getCharacteristic(Characteristic.HeatingThresholdTemperature)
            .setValue(value, undefined, 'fromOutsideHomekit');

        this.log('updateHeatingThresholdTemperature to ' + value);

    } catch (e) {
        this.log('updateHeatingThresholdTemperature Failed: ' + e);
    }
}


Heater.prototype.getLockPhysicalControls = function (callback) {
    this.log('getLockPhysicalControls');

    try {
        var value = this.device.get('child_lock');

        if (value == true) {
            return callback(null, Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED);
        } else {
            return callback(null, Characteristic.LockPhysicalControls.CONTROL_LOCK_DISABLED);
        }
    } catch (e) {
        this.log('getLockPhysicalControls Failed: ' + e);
        callback(e);
    }
}

Heater.prototype.setLockPhysicalControls = function (targetState, callback, context) {
    this.log('setLockPhysicalControls ' + targetState + ' ' + context);

    if (context === 'fromOutsideHomekit') { return callback(); }

    try {
        if (targetState == Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED) {
            this.device.set('child_lock', true);
        } else {
            this.device.set('child_lock', false);
        }

        callback();
    } catch (e) {
        this.log('setLockPhysicalControls Failed: ' + e);
        callback(e);
    }
}

Heater.prototype.updateLockPhysicalControls = function () {

    try {

        var value = this.device.get('child_lock');

        var targetValue = value ? Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED : Characteristic.LockPhysicalControls.CONTROL_LOCK_DISABLED;

        this.service
            .getCharacteristic(Characteristic.LockPhysicalControls)
            .setValue(targetValue, undefined, 'fromOutsideHomekit');

        this.log('updateLockPhysicalControls to ' + value);
    } catch (e) {
        this.log('updateLockPhysicalControls Failed: ' + e);
    }
}

Heater.prototype.getLED = function (callback) {
    this.log('getLED');

    try {
        var value = this.device.get('led_brightness');

        switch (value) {
            case 0:
            case 1:
                return callback(null, true);
                break;
            case 2:
                return callback(null, false);
                break;
        }

    } catch (e) {
        this.log('getLED Failed: ' + e);
        callback(e);
    }
}

Heater.prototype.setLED = function (targetState, callback, context) {
    this.log('setLED ' + targetState + ' ' + context);

    if (context === 'fromOutsideHomekit') { return callback(); }

    try {
        // 0 (bright), 1 (dim), 2 (off)
        if (targetState == true) {
            this.device.set('led_brightness', 1);
        } else {
            this.device.set('led_brightness', 2);
        }

        callback();
    } catch (e) {
        this.log('setLED Failed: ' + e);
        callback(e);
    }
}

Heater.prototype.updateLED = function () {

    try {
        // 0 (bright), 1 (dim), 2 (off)
        var value = this.device.get('led_brightness');

        var targetValue;
        switch (value) {
            case 0:
            case 1:
                targetValue = true;
                break;
            case 2:
                targetValue = false;
                break;
        }

        this.lightService
            .getCharacteristic(Characteristic.On)
            .setValue(targetValue, undefined, 'fromOutsideHomekit');

        this.log('updateLED to ' + value);
    } catch (e) {
        this.log('updateLED Failed: ' + e);
    }
}

Heater.prototype.getBuzzer = function (callback) {
    this.log('getBuzzer');

    try {
        var value = this.device.get('buzzer');

        return callback(null, value);

    } catch (e) {
        this.log('getBuzzer Failed: ' + e);
        callback(e);
    }
}

Heater.prototype.setBuzzer = function (targetState, callback, context) {
    this.log('setBuzzer ' + targetState + ' ' + context);

    if (context === 'fromOutsideHomekit') { return callback(); }

    try {
        if (targetState == true) {
            this.device.set('buzzer', true);
        }
        else {
            this.device.set('buzzer', false);
        }

        callback();
    } catch (e) {
        this.log('setBuzzer Failed: ' + e);
        callback(e);
    }
}

Heater.prototype.updateBuzzer = function () {

    try {
        var value = this.device.get('buzzer');

        this.buzzerService
            .getCharacteristic(Characteristic.On)
            .setValue(value, undefined, 'fromOutsideHomekit');

        this.log('updateBuzzer to ' + value);
    } catch (e) {
        this.log('updateBuzzer Failed: ' + e);
    }
}

 

Heater.prototype.updateStatusActive = function () {

    try {
        var value = this.device.get('power');

        if (value == true) {
            this.service.setCharacteristic(Characteristic.CurrentHeaterCoolerState, Characteristic.CurrentHeaterCoolerState.HEATING);
        } else {
            this.service.setCharacteristic(Characteristic.CurrentHeaterCoolerState, Characteristic.CurrentHeaterCoolerState.INACTIVE);
        }

        this.log('updateStatusActive to ' + value);

    } catch (e) {
        this.log('updateStatusActive Failed: ' + e);
    }
}


Heater.prototype.getTemperature = function (callback) {
    this.log("getTemperature");

    try {
        var value = this.device.get('temp');

        return callback(null, value);
    } catch (e) {
        this.log('getTemperature Failed: ' + e);
        callback(e);
    }
}

Heater.prototype.updateTemperature = function () {

    try {
        var value = this.device.get('temp');
        this.service.setCharacteristic(Characteristic.CurrentTemperature, value);

        this.log('updateTemperature to ' + value);

    } catch (e) {
        this.log('updateTemperature Failed: ' + e);
    }
}

Heater.prototype.getHumidity = function (callback) {
    this.log("getHumidity");

    try {
        var value = this.device.get('humidity');

        return callback(null, value);
    } catch (e) {
        this.log('getHumidity Failed: ' + e);
        callback(e);
    }
}

Heater.prototype.updateHumidity = function () {

    try {
        var value = this.device.get('humidity');
        this.service.setCharacteristic(Characteristic.CurrentRelativeHumidity, value);

        this.log('updateHumidity to ' + value);

    } catch (e) {
        this.log('updateHumidity Failed: ' + e);
    }
}
