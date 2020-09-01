[![npm version](https://badge.fury.io/js/homebridge-smartmi-heater.svg)](https://badge.fury.io/js/homebridge-smartmi-heater)

# homebridge-smartmi-heater

![smartmi-heater](https://i2.wp.com/www.deecomtech.com/wp-content/uploads/2019/12/9486-hqiusp.jpg)

### Features

* Switch on / off.

* Switch child lock on / off.

* Switch LED light on / off.

* Switch buzzer sound on / off.

* Display temperature.

* Display humidity.


### Installation

1. Install required packages.

``` 
	npm install -g homebridge-smartmi-heater
	```

2. Make sure your Homebridge server is same network with your device, then run following command to discover the token.

``` 
	miio discover --sync
	```

3. You may need to wait few minutes until you get the response similar to below:

``` 
	Device ID: 49466088
	Model info: Unknown
	Address: 192.168.1.8
	Token: 6f7a65786550386c700a6b526666744d via auto-token
	Support: Unknown
	```

4. Record down the `Address` and `Token` values as we need it in our configuration file later.

5. If you are getting `??????????????` for your token value, please reset your device and connect your Homebridge server directly to the access point advertised by the device.

6. Then run the command again.

``` 
	miio discover --sync
	```

7. Add following accessory to the `config.json` .

``` 
		"accessories": [
			{
				"accessory": "SmartmiHeater",
				"name": "Smartmi Heater",
				"ip": "192.168.1.x",
				"did": "xxxxxxxxx",
				"token": "xxxxxxxxxxxxxxxxxxx",		
				"minTemp" : minimum temp heater allows,
				"maxTemp" : maximum temp heater allows,
			    "enableLED": true (optional),
				"enableLEDName": "Some custom LED name" (optional),
				"enableBuzzer": true (optional),
				"enableBuzzerName": "Some custom buzzer name" (optional),								
				"polling_interval": 60000 (optional)
			}
		]
	```

	**Notes:** Set value for `enableLED` , `enableBuzzer` to **true** or **false** to show or hide these sensors in Home app.

8. Restart Homebridge, and your device will be added to Home app.

# License

MIT License
