'use strict'

class MiBand {
  constructor() {
    this.device = null;
    this.server = null;
    this.service = null;
    this._debug = true;
  }
  _readCharacteristicValue(uuid) {
    return this.service.getCharacteristic(uuid).then(c => c.readValue())
    .then(buffer => {
      let data = new DataView(buffer);
      if (this._debug) {
        for (var i = 0, a = []; i < data.byteLength; i++) { a.push(data.getUint8(i)); }
        console.debug(a);
      }
      return data;
    });
  }
  _writeCharacteristicValue(uuid, value) {
    if (this._debug) {
      console.debug(value);
    }
    return this.service.getCharacteristic(uuid).then(c => c.writeValue(value))
  }
  _computeCRC(data) {
    let crc = 0;
    for (var i = 0; i < data.length; ++i) {
      crc ^= data[i];
      for (var j = 0; j < 8; ++j) {
        let odd = crc & 1;
        crc = crc >> 1;
        if (odd) crc ^= 140;
      }
    }
    return crc;
  }
  requestDevice() {
    return navigator.bluetooth.requestDevice({filters:[{services:[ 0xFEE0 ]}]})
    .then(device => {  this.device = device;   return device.connectGATT() })
    .then(server => {  this.server = server;   return server.getPrimaryService(0xFEE0) })
    .then(service => { this.service = service; return this.device });
  }
  pair() {
    return this._writeCharacteristicValue(0xFF0F, new Uint8Array([2]));
  }
  locate() {
    return this._writeCharacteristicValue(0xFF05, new Uint8Array([8, 0]));
  }
  factoryReset() {
    return this._writeCharacteristicValue(0xFF05, new Uint8Array([9]));
  }
  test() {
  }
  getDeviceInfo() {
    return this._readCharacteristicValue(0xFF01)
    .then(data => {
      let deviceInfo = new Map();
      deviceInfo.set('firmwareVersion', data.getUint8(15) + '.' + data.getUint8(14) + '.' + data.getUint8(13) + '.' + data.getUint8(12));
      deviceInfo.set('profileVersion', data.getUint8(11) + '.' + data.getUint8(10) + '.' + data.getUint8(9) + '.' + data.getUint8(8));
      // TODO: Get feature, appearance, hardwareVersion.
      return deviceInfo;
    });
  }
  getDeviceName() {
    return this._readCharacteristicValue(0xFF02)
    .then(data => {
      let decoder = new TextDecoder('utf-8');
      let deviceName = decoder.decode(data);
      return deviceName;
    });
  }
  getBatteryInfo() {
    return this._readCharacteristicValue(0xFF0C)
    .then(data => {
      let statusCodes = new Map([[0, "Unknown"],
                                 [1, "Battery Low"],
                                 [2, "Battery charging"],
                                 [3, "Battery full (charging)"],
                                 [4, "Not charging"]]);
      let lastChargeDate = new Date(2000 + data.getUint8(1),
                                    data.getUint8(2),
                                    data.getUint8(3),
                                    data.getUint8(4),
                                    data.getUint8(5),
                                    data.getUint8(6));

      let batteryInfo = new Map();
      batteryInfo.set('batteryLevel', data.getUint8(0));
      batteryInfo.set('batteryStatusCode', data.getUint8(9));
      batteryInfo.set('batteryStatusText', statusCodes.get(data.getUint8(9)));
      batteryInfo.set('batteryCharges', 0xffff & (0xff & data.getUint8(7) | (0xff & data.getUint8(8) << 8)));
      batteryInfo.set('batteryLastCharge', lastChargeDate);

      return batteryInfo;
    });
  }
  getSteps() {
    return this._readCharacteristicValue(0xFF06)
    .then(data => {
      return data.getUint8(0) + (data.getUint8(1) << 8)
    });
  }
  getBluetoothConnectionParameters() {
    return this._readCharacteristicValue(0xFF09)
    .then(data => {
      let connIntMin = 0xffff & (0xff & data.getUint8(0) | (0xff & data.getUint8(1)) << 8)
      let connIntMax = 0xffff & (0xff & data.getUint8(2) | (0xff & data.getUint8(3)) << 8)
      let latency = 0xffff & (0xff & data.getUint8(4) | (0xff & data.getUint8(5)) << 8)
      let timeout = 0xffff & (0xff & data.getUint8(6) | (0xff & data.getUint8(7)) << 8)
      let connInt = 0xffff & (0xff & data.getUint8(8) | (0xff & data.getUint8(9)) << 8)
      let advInt = 0xffff & (0xff & data.getUint8(10) | (0xff & data.getUint8(11)) << 8)

      let connectionParams = new Map();
      connectionParams.set('minConnectionInterval', connIntMin * 1.25);
      connectionParams.set('maxConnectionInterval', connIntMax * 1.25);
      connectionParams.set('latency', latency);
      connectionParams.set('supervisionTimeout', timeout * 10);
      connectionParams.set('connectionInterval', connInt * 1.25);
      connectionParams.set('advertisingInterval', advInt * 0.625);

      return connectionParams;
    });
  }
  getDateTime() {
    return this._readCharacteristicValue(0xFF0A)
    .then(data => {
      let date = new Date(data.getUint8(0) + 2000,
                          data.getUint8(1),
                          data.getUint8(2),
                          data.getUint8(3),
                          data.getUint8(4),
                          data.getUint8(5));
      return date;
    });
  }
  setUserInfo() {
    let uuid = 1586927552; // UUID must have 10 digits.
    let gender = 1; // Gender (Female 0, Male 1)
    let age = 32; // Age in years.
    let height = 170; // Height in cm.
    let weight = 70; // Weight in kg.
    let type = 1; // If 1, all saved data will be lost.

    let userInfo = [];
    for (var i = 0; i < 4; i++) { userInfo.push(uuid & 0xff); uuid >>= 8; }
    userInfo.push(gender);
    userInfo.push(age);
    userInfo.push(height);
    userInfo.push(weight);
    userInfo.push(type);
    for (var i = 0; i < 10; i++) { /* Alias */ userInfo.push(0); }
    //userInfo.push(0, 0, 70, 114, 97, 110, 195, 167, 111, 105); // Alias
    let crc = (this._computeCRC(userInfo) ^ parseInt(this.device.instanceID.slice(-2), 16));
    userInfo.push(crc);

    return this._writeCharacteristicValue(0xFF04, new Uint8Array(userInfo));
  }
  setProgressLightColor(red, green, blue) {
    // Ranges go from 0 (LED off) to 6 (max bright).
    let color = [0x0e, red, green, blue, 0x01];
    return this._writeCharacteristicValue(0xFF05, new Uint8Array(color));
  }
  setBandLocation(loc) {
    // Left hand (0), right hand (1), neck (2).
    return this._writeCharacteristicValue(0xFF05, new Uint8Array([0x0f, loc]));
  }
  locate() {
    return this._writeCharacteristicValue(0xFF05, new Uint8Array([8, 0]));
  }
  factoryReset() {
    return this._writeCharacteristicValue(0xFF05, new Uint8Array([9]));
  }
  test() {
    return this._writeCharacteristicValue(0xFF0D, new Uint8Array([1]));
  }
  vibrate() {
    // Start vibrating.
    return this._writeCharacteristicValue(0xFF0D, new Uint8Array([8, 0]))
    .then(() => {
      return new Promise(function(resolve, reject) {
        let stopVibration = new Uint8Array([19]);
        setTimeout(() => {
          resolve(() => {
            // Stop vibrating.
            return this._writeCharacteristicValue(0xFF0D, new Uint8Array([19]))
          });
        }, 1000);
      });
    });
  }
  setDateTime() {
    let today = new Date();
    let date = [(today.getFullYear() - 2000) & 0xff,
                today.getMonth(),
                today.getDate(),
                today.getHours(),
                today.getMinutes(),
                today.getSeconds()];
    return this._writeCharacteristicValue(0xFF0A, new Uint8Array(date));
  }
}

window.miBand = new MiBand();
