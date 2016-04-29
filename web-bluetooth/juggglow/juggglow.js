(function() {
  'use strict';

  /* Custom Bluetooth Service UUIDs */

  const JUGGGLOW_SERVICE_UUID = '624e957f-cb42-4cd6-bacc-84aeb898f69b';

  /* Custom Bluetooth Characteristic UUIDs */

  const BALL_CONTROL_UUID = 'c75076c0-abbf-11e4-8053-0002a5d5c51b';
  const BALL_CONTROL_NOTIFICATION_UUID = 'f9136034-3b36-4286-8340-570ecd514d35';
  const BALL_EVENT_NOTIFICATION_UUID = 'd6d4ef6d-1cef-4aa2-9657-e373d6f697fb';

  class Juggglow {
    constructor() {
      this.device = null;
      this.server = null;
      this._characteristics = new Map();
      this._debug = false;
    }
    connect() {
      return navigator.bluetooth.requestDevice({filters:[{services:[ JUGGGLOW_SERVICE_UUID ]}]})
      .then(device => {
        this.device = device;
        return device.gatt.connect();
      })
      .then(server => {
        this.server = server;
        return Promise.all([
          server.getPrimaryService(JUGGGLOW_SERVICE_UUID).then(service => {
            return Promise.all([
              this._cacheCharacteristic(service, BALL_CONTROL_UUID),
              this._cacheCharacteristic(service, BALL_CONTROL_NOTIFICATION_UUID),
              this._cacheCharacteristic(service, BALL_EVENT_NOTIFICATION_UUID),
            ])
          }),
          server.getPrimaryService('battery_service').then(service => {
            return this._cacheCharacteristic(service, 'battery_level');
          }),
          server.getPrimaryService('health_thermometer').then(service => {
            return this._cacheCharacteristic(service, 'temperature_measurement');
          }),
        ]);
      })
    }

    /* Juggglow Service */

    setLightEffectOff() {
      return this._writeCharacteristicValue(BALL_CONTROL_UUID, new Uint8Array([0x30]));
    }
    setLightEffectStop() {
      return this._writeCharacteristicValue(BALL_CONTROL_UUID, new Uint8Array([0x31]));
    }
    setLightEffectBrightness(brightnessPercent) {
      let data = [0x32, Math.round(brightnessPercent, 2.55)];
      return this._writeCharacteristicValue(BALL_CONTROL_UUID, new Uint8Array(data));
    }
    setLightEffectColor(r, g, b) {
      let data = [0x34, r, g, b, r, g, b];
      return this._writeCharacteristicValue(BALL_CONTROL_UUID, new Uint8Array(data));
    }
    setLightEffectTwoColors(r1, g1, b1, r2, g2, b2) {
      let data = [0x34, r1, g1, b1, r2, g2, b2];
      return this._writeCharacteristicValue(BALL_CONTROL_UUID, new Uint8Array(data));
    }
    setLightEffectRainbow(timeInterval) {
      let data = [0x35, 0x03, timeInterval, 0x01];
      return this._writeCharacteristicValue(BALL_CONTROL_UUID, new Uint8Array(data));
    }
    setLightEffectMagicHands(rCatch, gCatch, bCatch, rFlight, gFlight, bFlight) {
      let data = [0x39, rCatch, gCatch, bCatch, rFlight, gFlight, bFlight];
      return this._writeCharacteristicValue(BALL_CONTROL_UUID, new Uint8Array(data));
    }
    setLightEffectMagicHandsRandomColor() {
      return this._writeCharacteristicValue(BALL_CONTROL_UUID, new Uint8Array([0x3A]));
    }
    setLightEffectColorChangeOnCatch(r1, g1, b1, r2, g2, b2) {
      let data = [0x3B, r1, g1, b1, r2, g2, b2];
      return this._writeCharacteristicValue(BALL_CONTROL_UUID, new Uint8Array(data));
    }
    setLightEffectColorChangeOnCatchRandom() {
      return this._writeCharacteristicValue(BALL_CONTROL_UUID, new Uint8Array([0x3C]));
    }

    /* Battery Service */

    getBatteryLevel() {
      return this._readCharacteristicValue('battery_level')
      .then(data => data.getUint8(0));
    }

    /* Health Thermometer Service */

    getTemperature() {
      return this._readCharacteristicValue('temperature_measurement')
      .then(data => data.getInt8(0));
    }

    /* Utils */

    _cacheCharacteristic(service, characteristicUuid) {
      return service.getCharacteristic(characteristicUuid)
      .then(characteristic => {
        this._characteristics.set(characteristicUuid, characteristic);
      });
    }
    _readCharacteristicValue(characteristicUuid) {
      let characteristic = this._characteristics.get(characteristicUuid);
      return characteristic.readValue()
      .then(data => {
        if (this._debug) {
          for (var i = 0, a = []; i < data.byteLength; i++) { a.push(data.getUint8(i)); }
          console.debug('READ', characteristic.uuid, a);
        }
        return data;
      });
    }
    _writeCharacteristicValue(characteristicUuid, value) {
      let characteristic = this._characteristics.get(characteristicUuid);
      if (this._debug) {
        console.debug('WRITE', characteristic.uuid, value);
      }
      return characteristic.writeValue(value);
    }
  }

  window.juggglow = new Juggglow();

})();
