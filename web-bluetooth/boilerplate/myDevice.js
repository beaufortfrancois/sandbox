(function() {
  'use strict';

  /* Custom Bluetooth Service UUIDs */

  const DEVICE_SERVICE_A_UUID = '00000000-0000-0000-0000-000000000000';

  /* Custom Bluetooth Characteristic UUIDs */

  const DEVICE_CHARACTERISTIC_A_UUID = '00000000-0000-0000-0000-000000000000';
  const DEVICE_CHARACTERISTIC_B_UUID = '00000000-0000-0000-0000-000000000000';


  class MyDevice {
    constructor() {
      this.device = null;
      this.server = null;
      this._characteristics = new Map();
      this._debug = false;
    }
    connect() {
      return navigator.bluetooth.requestDevice({filters:[{services:[ DEVICE_SERVICE_A_UUID ]}]})
      .then(device => {
        this.device = device;
        return device.gatt.connect();
      })
      .then(server => {
        this.server = server;
        return Promise.all([
          server.getPrimaryService(DEVICE_SERVICE_A_UUID).then(service => {
            return Promise.all([
              this._cacheCharacteristic(service, DEVICE_CHARACTERISTIC_A_UUID),
              this._cacheCharacteristic(service, DEVICE_CHARACTERISTIC_B_UUID),
            ])
          }),
          server.getPrimaryService('battery_service').then(service => {
            return this._cacheCharacteristic(service, 'battery_level');
          }),
        ]);
      })
    }

    /* Custom Service A */

    readCharacteristicA() {
      return this._readCharacteristicValue(DEVICE_CHARACTERISTIC_A_UUID)
    }

    writeCharacteristicB(data) {
      return this._writeCharacteristicValue(DEVICE_CHARACTERISTIC_B_UUID, new Uint8Array(data));
    }

    startNotificationsCharacteristicA() {
      return this._startNotifications(DEVICE_CHARACTERISTIC_A_UUID);
    }

    stopNotificationsCharacteristicA() {
      return this._stopNotifications(DEVICE_CHARACTERISTIC_A_UUID);
    }

    /* Battery Service */

    getBatteryLevel() {
      return this._readCharacteristicValue('battery_level')
      .then(data => data.getUint8(0));
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
    _startNotifications(characteristicUuid) {
      let characteristic = this._characteristics.get(characteristicUuid);
      // Returns characteristic to set up characteristicvaluechanged event
      // handlers in the resolved promise.
      return characteristic.startNotifications()
      .then(() => characteristic);
    }
    _stopNotifications(characteristicUuid) {
      let characteristic = this._characteristics.get(characteristicUuid);
      // Returns characteristic to remove characteristicvaluechanged event
      // handlers in the resolved promise.
      return characteristic.stopNotifications()
      .then(() => characteristic);
    }
  }

  window.myDevice = new MyDevice();

})();
