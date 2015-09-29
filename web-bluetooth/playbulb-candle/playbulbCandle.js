'use strict'

class PlaybulbCandle {
  constructor() {
    this.device = null;
    this.server = null;
    this._services = new Map();
    this._characteristics = new Map();
    this._debug = false;
  }
  requestDevice() {
    return navigator.bluetooth.requestDevice({filters:[{services:[ 0xFF02 ]}]})
    .then(device => {
      this.device = device;
      return device.connectGATT();
    })
    .then(server => {
      this.server = server;
      return Promise.all([
        server.getPrimaryService(0xFF02).then(service => { this._services.set('candle',service); }),
        server.getPrimaryService(0x180F).then(service => { this._services.set('battery', service); }),
        server.getPrimaryService(0x180A).then(service => { this._services.set('deviceInfo', service); }),
      ]);
    })
    .then(() => this.device); // Returns device when fulfilled.
  }

  /* Candle Service */

  getDeviceName() {
    return this._readCharacteristicValue('candle', 0xFFFF)
    .then(this._decodeString)
  }
  setDeviceName(name) {
    let deviceName = this._encodeString(name);
    return this._writeCharacteristicValue('candle', 0xFFFF, deviceName);
  }
  setColor(r, g, b) {
    let data = [0x00, r, g, b];
    return this._writeCharacteristicValue('candle', 0xFFFC, new Uint8Array(data))
    .then(() => [r,g,b]); // Returns color when fulfilled.
  }
  setCandleEffectColor(r, g, b) {
    let data = [0x00, r, g, b, 0x04, 0x00, 0x01, 0x00];
    return this._writeCharacteristicValue('candle', 0xFFFB, new Uint8Array(data))
    .then(() => [r,g,b]); // Returns color when fulfilled.
  }
  setFlashingColor(r, g, b) {
    let data = [0x00, r, g, b, 0x00, 0x00, 0x1F, 0x00];
    return this._writeCharacteristicValue('candle', 0xFFFB, new Uint8Array(data))
    .then(() => [r,g,b]); // Returns color when fulfilled.
  }
  setPulseColor(r, g, b) {
    // We have to correct user color to make it look nice for real...
    let newRed = Math.min(Math.round(r / 64) * 64, 255);
    let newGreen = Math.min(Math.round(g / 64) * 64, 255);
    let newBlue = Math.min(Math.round(b / 64) * 64, 255);
    let data = [0x00, newRed, newGreen, newBlue, 0x01, 0x00, 0x09, 0x00];
    return this._writeCharacteristicValue('candle', 0xFFFB, new Uint8Array(data))
    .then(() => [r,g,b]); // Returns color when fulfilled.
  }
  setRainbow() {
    let data = [0x01, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0x00];
    return this._writeCharacteristicValue('candle', 0xFFFB, new Uint8Array(data));
  }
  setRainbowFade() {
    let data = [0x01, 0x00, 0x00, 0x00, 0x03, 0x00, 0x26, 0x00];
    return this._writeCharacteristicValue('candle', 0xFFFB, new Uint8Array(data));
  }

  /* Battery Service */

  getBatteryLevel() {
    return this._readCharacteristicValue('battery', 'battery_level')
    .then(data => data.getUint8(0));
  }

  /* Device Info Service */

  getManufacturerName() {
    return this._readCharacteristicValue('deviceInfo', 0x2A25)
    .then(this._decodeString);
  }
  getModelNumber() {
    return this._readCharacteristicValue('deviceInfo', 0x2A27)
    .then(this._decodeString);
  }
  getSerialNumber() {
    return this._readCharacteristicValue('deviceInfo', 0x2A26)
    .then(this._decodeString);
  }
  getHardwareRevision() {
    return this._readCharacteristicValue('deviceInfo', 0x2A29)
    .then(this._decodeString);
  }
  getFirmwareRevision() {
    return this._readCharacteristicValue('deviceInfo', 0x2A50)
    .then(this._decodeString);
  }

  /* Utils */

  _readCharacteristicValue(serviceKey, characteristicUuid) {
    let characteristicKey = this._getCharacteristicKey(serviceKey, characteristicUuid);
    let cachedCharacteristic = this._characteristics.get(characteristicKey);

    if (cachedCharacteristic) {
      return cachedCharacteristic.readValue()
      .then(buffer => this._onReadCharacteristic(buffer));
    } else {
      return this._services.get(serviceKey).getCharacteristic(characteristicUuid)
      .then(characteristic => {
        this._characteristics.set(characteristicKey, characteristic);
        return characteristic.readValue()
        .then(buffer => this._onReadCharacteristic(buffer));
      });
    }
  }
  _onReadCharacteristic(buffer) {
    let data = new DataView(buffer);
    if (this._debug) {
      for (var i = 0, a = []; i < data.byteLength; i++) { a.push(data.getUint8(i)); }
      console.debug(a);
    }
    return data;
  }
  _writeCharacteristicValue(serviceKey, characteristicUuid, value) {
    if (this._debug) {
      console.debug(serviceKey, characteristicUuid, value);
    }
    let characteristicKey = this._getCharacteristicKey(serviceKey, characteristicUuid);
    let cachedCharacteristic = this._characteristics.get(characteristicKey);
    if (cachedCharacteristic) {
      return cachedCharacteristic.writeValue(value);
    } else {
      return this._services.get(serviceKey).getCharacteristic(characteristicUuid)
      .then(characteristic => {
        this._characteristics.set(characteristicKey, characteristic);
        return characteristic.writeValue(value);
      });
    }
  }
  _getCharacteristicKey(serviceKey, characteristicUuid) {
    return this._services.get(serviceKey).uuid + '/' +
        BluetoothUUID.getCharacteristic(characteristicUuid);
  }
  _encodeString(data) {
    let encoder = new TextEncoder('utf-8');
    return encoder.encode(data);
  }
  _decodeString(data) {
    let decoder = new TextDecoder('utf-8');
    return decoder.decode(data);
  }
}

window.playbulbCandle = new PlaybulbCandle();
