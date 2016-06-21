(function() {
  'use strict';

/* Custom Bluetooth Service UUIDs */

const JUGGGLOW_SERVICE_UUID = '624e957f-cb42-4cd6-bacc-84aeb898f69b';

/* Custom Bluetooth Characteristic UUIDs */

const BALL_CONTROL_UUID = 'c75076c0-abbf-11e4-8053-0002a5d5c51b';
const BALL_CONTROL_NOTIFICATION_UUID = 'f9136034-3b36-4286-8340-570ecd514d35';
const BALL_EVENT_NOTIFICATION_UUID = 'd6d4ef6d-1cef-4aa2-9657-e373d6f697fb';

const FLASH_CONTROL_UUID = '51892c94-c9c7-4b64-9701-d32055c990cd';
const FLASH_DATA_UUID = '9caf4e31-b2dc-4eb5-a8a0-47daac3e0faa';

class Juggglow {

  constructor() {
    this.device = null;
  }

  request() {
    let options = {
      "filters": [{
        "services": [JUGGGLOW_SERVICE_UUID]
      }],
      "optionalServices": ['battery_service', 'health_thermometer']
    };
    return navigator.bluetooth.requestDevice(options)
    .then(device => {
      this.device = device;
      return device;
    });
  }

  connect() {
    return this.device.gatt.connect();
  }

  disconnect() {
    return this.device.gatt.disconnect();
  }
  
  /* Battery Service */

  readBatteryLevel() {
    return this.device.gatt.getPrimaryService('battery_service')
    .then(service => service.getCharacteristic('battery_level'))
    .then(characteristic => characteristic.readValue())
  }

  startBatteryLevelNotifications(listener) {
    return this.device.gatt.getPrimaryService('battery_service')
    .then(service => service.getCharacteristic('battery_level'))
    .then(characteristic => {
      return characteristic.startNotifications()
      .then(_ => {
        characteristic.addEventListener('characteristicvaluechanged', listener);
      });
    });
  }

  stopBatteryLevelNotifications(listener) {
    return this.device.gatt.getPrimaryService('battery_service')
    .then(service => service.getCharacteristic('battery_level'))
    .then(characteristic => {
      return characteristic.stopNotifications()
      .then(_ => {
        characteristic.removeEventListener('characteristicvaluechanged', listener);
      });
    });
  }

  /* Temperature Measurement Service */

  readCelsiusTemperature() {
    return this.device.gatt.getPrimaryService('health_thermometer')
    .then(service => service.getCharacteristic('temperature_measurement'))
    .then(characteristic => characteristic.readValue())
  }

  startCelsiusTemperatureNotifications(listener) {
    return this.device.gatt.getPrimaryService('health_thermometer')
    .then(service => service.getCharacteristic('temperature_measurement'))
    .then(characteristic => {
      return characteristic.startNotifications()
      .then(_ => {
        characteristic.addEventListener('characteristicvaluechanged', listener);
      });
    });
  }

  stopCelsiusTemperatureNotifications(listener) {
    return this.device.gatt.getPrimaryService('health_thermometer')
    .then(service => service.getCharacteristic('temperature_measurement'))
    .then(characteristic => {
      return characteristic.stopNotifications()
      .then(_ => {
        characteristic.removeEventListener('characteristicvaluechanged', listener);
      });
    });
  }

  /* Ball Event */

  startBallEventNotifications(listener) {
    return this.device.gatt.getPrimaryService(JUGGGLOW_SERVICE_UUID)
    .then(service => service.getCharacteristic(BALL_EVENT_NOTIFICATION_UUID))
    .then(characteristic => {
      return characteristic.startNotifications()
      .then(_ => {
        characteristic.addEventListener('characteristicvaluechanged', listener);
      });
    });
  }

  stopBallEventNotifications(listener) {
    return this.device.gatt.getPrimaryService(JUGGGLOW_SERVICE_UUID)
    .then(service => service.getCharacteristic(BALL_EVENT_NOTIFICATION_UUID))
    .then(characteristic => {
      return characteristic.stopNotifications()
      .then(_ => {
        characteristic.removeEventListener('characteristicvaluechanged', listener);
      });
    });
  }

  /* Light Effect Commands */

  setLightEffectOff() {
    return this.device.gatt.getPrimaryService(JUGGGLOW_SERVICE_UUID)
    .then(service => service.getCharacteristic(BALL_CONTROL_UUID))
    .then(characteristic => characteristic.writeValue(new Uint8Array([0x30])));
  }

  setLightEffectStop() {
    return this.device.gatt.getPrimaryService(JUGGGLOW_SERVICE_UUID)
    .then(service => service.getCharacteristic(BALL_CONTROL_UUID))
    .then(characteristic => characteristic.writeValue(new Uint8Array([0x31])));
  }

  setLightEffectBrightness(brightnessPercent) {
    let data = [0x32, Math.round(brightnessPercent, 2.55)];
    return this.device.gatt.getPrimaryService(JUGGGLOW_SERVICE_UUID)
    .then(service => service.getCharacteristic(BALL_CONTROL_UUID))
    .then(characteristic => characteristic.writeValue(new Uint8Array(data)));
  }

  setLightEffectColor(r, g, b) {
    let data = [0x34, r, g, b, r, g, b];
    return this.device.gatt.getPrimaryService(JUGGGLOW_SERVICE_UUID)
    .then(service => service.getCharacteristic(BALL_CONTROL_UUID))
    .then(characteristic => characteristic.writeValue(new Uint8Array(data)));
  }

  setLightEffectTwoColors(r1, g1, b1, r2, g2, b2) {
    let data = [0x34, r1, g1, b1, r2, g2, b2];
    return this.device.gatt.getPrimaryService(JUGGGLOW_SERVICE_UUID)
    .then(service => service.getCharacteristic(BALL_CONTROL_UUID))
    .then(characteristic => characteristic.writeValue(new Uint8Array(data)));
  }

  setLightEffectRainbow(timeInterval) {
    let data = [0x35, 0x03, timeInterval, 0x01];
    return this.device.gatt.getPrimaryService(JUGGGLOW_SERVICE_UUID)
    .then(service => service.getCharacteristic(BALL_CONTROL_UUID))
    .then(characteristic => characteristic.writeValue(new Uint8Array(data)));
  }

  setLightEffectMagicHands(rCatch, gCatch, bCatch, rFlight, gFlight, bFlight) {
    let data = [0x39, rCatch, gCatch, bCatch, rFlight, gFlight, bFlight];
    return this.device.gatt.getPrimaryService(JUGGGLOW_SERVICE_UUID)
    .then(service => service.getCharacteristic(BALL_CONTROL_UUID))
    .then(characteristic => characteristic.writeValue(new Uint8Array(data)));
  }

  setLightEffectMagicHandsRandomColor() {
    return this.device.gatt.getPrimaryService(JUGGGLOW_SERVICE_UUID)
    .then(service => service.getCharacteristic(BALL_CONTROL_UUID))
    .then(characteristic => characteristic.writeValue(new Uint8Array([0x3A])));
  }

  setLightEffectColorChangeOnCatch(r1, g1, b1, r2, g2, b2) {
    let data = [0x3B, r1, g1, b1, r2, g2, b2];
    return this.device.gatt.getPrimaryService(JUGGGLOW_SERVICE_UUID)
    .then(service => service.getCharacteristic(BALL_CONTROL_UUID))
    .then(characteristic => characteristic.writeValue(new Uint8Array(data)));
  }

  setLightEffectColorChangeOnCatchRandom() {
    return this.device.gatt.getPrimaryService(JUGGGLOW_SERVICE_UUID)
    .then(service => service.getCharacteristic(BALL_CONTROL_UUID))
    .then(characteristic => characteristic.writeValue(new Uint8Array([0x3C])));
  }

  /* Accelerometer Control Commands */

  startRecordingAccelerometer() {
    return this.device.gatt.getPrimaryService(JUGGGLOW_SERVICE_UUID)
    .then(service => service.getCharacteristic(BALL_CONTROL_UUID))
    .then(characteristic => characteristic.writeValue(new Uint8Array([0x20])));
  }

  stopRecordingAccelerometer() {
    return this.device.gatt.getPrimaryService(JUGGGLOW_SERVICE_UUID)
    .then(service => service.getCharacteristic(BALL_CONTROL_UUID))
    .then(characteristic => characteristic.writeValue(new Uint8Array([0x21])));
  }

  readAccelerationValues() {
    return this.device.gatt.getPrimaryService(JUGGGLOW_SERVICE_UUID)
    .then(service => service.getCharacteristic(FLASH_DATA_UUID))
    .then(characteristic => characteristic.readValue())
    .then(data => {
      let a = [];
      for (let i = 0; i < data.byteLength; i++) {
        a.push('0x' + ('00' + data.getUint8(i).toString(16)).slice(-2));
      }
      console.log('> ' + a.join(' '));
    });
  }

}

window.juggglow = new Juggglow();

})();
