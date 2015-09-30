(() => {
  'use strict';

  let encoder = new TextEncoder('utf-8');
  let decoder = new TextDecoder('utf-8');

  /* Bluetooth Service UUIDs */

  const CANDLE_SERVICE_UUID = 0xFF02;
  const BATTERY_SERVICE_UUID = 'battery_service';
  const DEVICEINFO_SERVICE_UUID = 'device_information';

  /* Bluetooth Characteristic UUIDs */

  const CANDLE_DEVICE_NAME_UUID = 0xFFFF;
  const CANDLE_COLOR_UUID = 0xFFFC;
  const CANDLE_EFFECT_UUID = 0xFFFB;

  const BATTERY_LEVEL_UUID = 0x2A19;

  const SERIAL_NUMBER_UUID = 0x2A25;
  const HARDWARE_REVISION_UUID = 0x2A27;
  const FIRMWARE_REVISION_UUID = 0x2A26;
  const SOFTWARE_REVISION_UUID = 0x2A28;
  const MANUFACTURER_NAME_UUID = 0x2A29;
  const PNP_ID_UUID = 0x2A50;

  class PlaybulbCandle {
    constructor() {
      this.device = null;
      this.server = null;
      this._characteristics = new Map();
      this._debug = false;
    }
    requestDevice() {
      return navigator.bluetooth.requestDevice({filters:[{services:[ CANDLE_SERVICE_UUID ]}]})
      .then(device => {
        this.device = device;
        return device.connectGATT();
      })
      .then(server => {
        this.server = server;
        return Promise.all([
          server.getPrimaryService(CANDLE_SERVICE_UUID).then(service => {
            return Promise.all([
              this._cacheCharacteristic(service, CANDLE_DEVICE_NAME_UUID),
              this._cacheCharacteristic(service, CANDLE_COLOR_UUID),
              this._cacheCharacteristic(service, CANDLE_EFFECT_UUID),
            ])
          }),
          server.getPrimaryService(BATTERY_SERVICE_UUID).then(service => {
            return this._cacheCharacteristic(service, BATTERY_LEVEL_UUID)
          }),
          server.getPrimaryService(DEVICEINFO_SERVICE_UUID).then(service => {
            // TODO: Remove resolve when device_information service is actually
            // available in Chrome OS. http://crbug.com/532930
            return Promise.resolve();
            return Promise.all([
              this._cacheCharacteristic(service, SERIAL_NUMBER_UUID),
              this._cacheCharacteristic(service, HARDWARE_REVISION_UUID),
              this._cacheCharacteristic(service, FIRMWARE_REVISION_UUID),
              this._cacheCharacteristic(service, SOFTWARE_REVISION_UUID),
              this._cacheCharacteristic(service, MANUFACTURER_NAME_UUID),
              this._cacheCharacteristic(service, PNP_ID_UUID),
            ])
          }),
        ]);
      })
      .then(() => this.device); // Returns device when fulfilled.
    }

    /* Candle Service */

    getDeviceName() {
      return this._readCharacteristicValue(CANDLE_DEVICE_NAME_UUID)
      .then(this._decodeString);
    }
    setDeviceName(name) {
      let data = this._encodeString(name);
      return this._writeCharacteristicValue(CANDLE_DEVICE_NAME_UUID, data)
    }
    setColor(r, g, b) {
      let data = [0x00, r, g, b];
      return this._writeCharacteristicValue(CANDLE_COLOR_UUID, new Uint8Array(data))
      .then(() => [r,g,b]); // Returns color when fulfilled.
    }
    setCandleEffectColor(r, g, b) {
      let data = [0x00, r, g, b, 0x04, 0x00, 0x01, 0x00];
      return this._writeCharacteristicValue(CANDLE_EFFECT_UUID, new Uint8Array(data))
      .then(() => [r,g,b]); // Returns color when fulfilled.
    }
    setFlashingColor(r, g, b) {
      let data = [0x00, r, g, b, 0x00, 0x00, 0x1F, 0x00];
      return this._writeCharacteristicValue(CANDLE_EFFECT_UUID, new Uint8Array(data))
      .then(() => [r,g,b]); // Returns color when fulfilled.
    }
    setPulseColor(r, g, b) {
      // We have to correct user color to make it look nice for real...
      let newRed = Math.min(Math.round(r / 64) * 64, 255);
      let newGreen = Math.min(Math.round(g / 64) * 64, 255);
      let newBlue = Math.min(Math.round(b / 64) * 64, 255);
      let data = [0x00, newRed, newGreen, newBlue, 0x01, 0x00, 0x09, 0x00];
      return this._writeCharacteristicValue(CANDLE_EFFECT_UUID, new Uint8Array(data))
      .then(() => [r,g,b]); // Returns color when fulfilled.
    }
    setRainbow() {
      let data = [0x01, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0x00];
      return this._writeCharacteristicValue(CANDLE_EFFECT_UUID, new Uint8Array(data));
    }
    setRainbowFade() {
      let data = [0x01, 0x00, 0x00, 0x00, 0x03, 0x00, 0x26, 0x00];
      return this._writeCharacteristicValue(CANDLE_EFFECT_UUID, new Uint8Array(data));
    }

    /* Battery Service */

    getBatteryLevel() {
      return this._readCharacteristicValue(BATTERY_LEVEL_UUID)
      .then(data => data.getUint8(0));
    }

    /* Device Info Service */

    getSerialNumber() {
      return this._readCharacteristicValue(SERIAL_NUMBER_UUID)
      .then(this._decodeString);
    }
    getHardwareRevision() {
      return this._readCharacteristicValue(HARDWARE_REVISION_UUID)
      .then(this._decodeString);
    }
    getFirmwareRevision() {
      return this._readCharacteristicValue(FIRMWARE_REVISION_UUID)
      .then(this._decodeString);
    }
    getSoftwareRevision() {
      return this._readCharacteristicValue(SOFWARE_REVISION_UUID)
      .then(this._decodeString);
    }
    getManufacturerName() {
      return this._readCharacteristicValue(MANUFACTURER_NAME_UUID)
      .then(this._decodeString);
    }
    getPnpID() {
      return this._readCharacteristicValue(PNP_ID_UUID)
      .then(this._decodeString);
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
      .then(buffer => {
        let data = new DataView(buffer);
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
    _decodeString(data) {
      return decoder.decode(data);
    }
    _encodeString(data) {
      return encoder.encode(data);
    }
  }

  window.playbulbCandle = new PlaybulbCandle();

})();
