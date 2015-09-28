'use strict'

class PlaybulbCandle {
  constructor() {
    this.device = null;
    this.server = null;
    this.candleService = null;
    this.batteryService = null;
    this.deviceInfoService = null;
    this._debug = false;
  }
  requestDevice() {
    return navigator.bluetooth.requestDevice({filters:[{services:[ 0xFF02 ]}]})
    .then(device => {  this.device = device;   return device.connectGATT() })
    .then(server => { this.server = server; return this.server.getPrimaryService(0xFF02) })
    .then(candleService => { this.candleService = candleService; return this.server.getPrimaryService(0x180F) })
    .then(batteryService => { this.batteryService = batteryService; return this.server.getPrimaryService(0x180A) })
    .then(deviceInfoService => { this.deviceInfoService = deviceInfoService; return this.device });
  }

  /* Utils */

  _readCharacteristicValue(service, uuid) {
    return service.getCharacteristic(uuid).then(c => { return c.readValue()})
    .then(buffer => {
      let data = new DataView(buffer);
      if (this._debug) {
        for (var i = 0, a = []; i < data.byteLength; i++) { a.push(data.getUint8(i)); }
        console.debug(a);
      }
      return data;
    });
  }
  _writeCharacteristicValue(service, uuid, value) {
    if (this._debug) {
      console.debug(uuid, value);
    }
    return service.getCharacteristic(uuid).then(c => c.writeValue(value))
  }
  _decodeString(data) {
    let decoder = new TextDecoder('utf-8');
    return decoder.decode(data);
  }

  /* Candle Service */

  getDeviceName() {
    return this._readCharacteristicValue(this.candleService, 0xFFFF)
    .then(this._decodeString)
  }
  setDeviceName(name) {
    let encoder = new TextEncoder('utf-8');
    let deviceName = encoder.encode(name);
    return this._writeCharacteristicValue(this.candleService, 0xFFFF, deviceName);
  }
  setColor(rgb) {
    // rgb format is 00FF00.
    let red = parseInt(rgb.substr(0, 2), 16);
    let green = parseInt(rgb.substr(2, 2), 16);
    let blue = parseInt(rgb.substr(4, 2), 16);
    let color = [0x00, red, green, blue];
    return this._writeCharacteristicValue(this.candleService, 0xFFFC, new Uint8Array(color));
  }
  setColorWithEffect(rgb) {
    // rgb format is 00FF00.
    let red = parseInt(rgb.substr(0, 2), 16);
    let green = parseInt(rgb.substr(2, 2), 16);
    let blue = parseInt(rgb.substr(4, 2), 16);
    let color = [0x00, red, green, blue, 0x04, 0x00, 0x01, 0x00];
    return this._writeCharacteristicValue(this.candleService, 0xFFFB, new Uint8Array(color));
  }
  turnOff() {
    return this.setColor('000000');
  }

  /* Battery Service */

  getBatteryLevel() {
    return this._readCharacteristicValue(this.batteryService, 'battery_level')
    .then(data => data.getUint8(0));
  }

  /* Device Info Service */

  getManufacturerName() {
    return this._readCharacteristicValue(this.deviceInfoService, 0x2A25)
    .then(this._decodeString);
  }
  getModelNumber() {
    return this._readCharacteristicValue(this.deviceInfoService, 0x2A27)
    .then(this._decodeString);
  }
  getSerialNumber() {
    return this._readCharacteristicValue(this.deviceInfoService, 0x2A26)
    .then(this._decodeString);
  }
  getHardwareRevision() {
    return this._readCharacteristicValue(this.deviceInfoService, 0x2A29)
    .then(this._decodeString);
  }
  getFirmwareRevision() {
    return this._readCharacteristicValue(this.deviceInfoService, 0x2A50)
    .then(this._decodeString);
  }
}

window.playbulbCandle = new PlaybulbCandle();
