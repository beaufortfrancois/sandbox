(function() {
  'use strict';

  let encoder = new TextEncoder('utf-8');
  let decoder = new TextDecoder('utf-8');

  const SUITES = new Map([
    ["1", "C"],
    ["2", "H"],
    ["3", "S"],
    ["4", "D"],
  ]);

  const VALUES = new Map([
    ["1", "A"],
    ["2", "2"],
    ["3", "3"],
    ["4", "4"],
    ["5", "5"],
    ["6", "6"],
    ["7", "7"],
    ["8", "8"],
    ["9", "9"],
    ["a", "0"],
    ["b", "J"],
    ["c", "Q"],
    ["d", "K"],
  ]);

  /* Custom Bluetooth Service UUIDs */

  const INSIGHT_SERVICE_UUID = '13630000-aeb9-10cf-ef69-81e145a91113';

  /* Custom Bluetooth Characteristic UUIDs */

  const DECK_CARD_UUID = '13630001-aeb9-10cf-ef69-81e145a91113';
  const MUTE_VIBRATION_UUID = '13630005-aeb9-10cf-ef69-81e145a91113';


  class Insight {
    constructor() {
      this.device = null;
      this.server = null;
      this._characteristics = new Map();
      this._debug = false;
    }
    connect() {
      return navigator.bluetooth.requestDevice({filters:[{services:[ INSIGHT_SERVICE_UUID ]}]})
      .then(device => {
        this.device = device;
        return device.gatt.connect();
      })
      .then(server => {
        this.server = server;
        return Promise.all([
          server.getPrimaryService(INSIGHT_SERVICE_UUID).then(service => {
            return Promise.all([
              this._cacheCharacteristic(service, DECK_CARD_UUID),
              this._cacheCharacteristic(service, MUTE_VIBRATION_UUID),
            ])
          }),
          server.getPrimaryService('battery_service').then(service => {
            return this._cacheCharacteristic(service, 'battery_level');
          }),
          // TODO: Uncomment when device_information service is actually
          // available in Chrome OS. http://crbug.com/532930
          /*
          server.getPrimaryService('device_information').then(service => {
            return Promise.all([
              this._cacheCharacteristic(service, 'serial_number_string'),
              this._cacheCharacteristic(service, 'hardware_revision_string'),
              this._cacheCharacteristic(service, 'firmware_revision_string'),
              this._cacheCharacteristic(service, 'software_revision_string'),
              this._cacheCharacteristic(service, 'manufacturer_name_string'),
              this._cacheCharacteristic(service, 'pnp_id'),
            ])
          }),
          */
        ]);
      })
    }

    /* Insight Service */

    startNotificationsDeckCard() {
      return this._startNotifications(DECK_CARD_UUID);
    }
    stopNotificationsDeckCard() {
      return this._stopNotifications(DECK_CARD_UUID);
    }
    parseDeckCard(data) {
      let code = data.getUint8(0).toString(16);
      return VALUES.get(code.slice(1, 2)) + SUITES.get(code.slice(0,1));
    }
    setVibration(isEnabled) {
      let data = isEnabled ? [0x00] : [0x01];
      return this._writeCharacteristicValue(MUTE_VIBRATION_UUID, new Uint8Array(data));
    }

    /* Battery Service */

    getBatteryLevel() {
      return this._readCharacteristicValue('battery_level')
      .then(data => data.getUint8(0));
    }

    /* Device Info Service */

    getSerialNumber() {
      return this._readCharacteristicValue('serial_number_string')
      .then(this._decodeString);
    }
    getHardwareRevision() {
      return this._readCharacteristicValue('hardware_revision_string')
      .then(this._decodeString);
    }
    getFirmwareRevision() {
      return this._readCharacteristicValue('firmware_revision_string')
      .then(this._decodeString);
    }
    getSoftwareRevision() {
      return this._readCharacteristicValue('software_revision_string')
      .then(this._decodeString);
    }
    getManufacturerName() {
      return this._readCharacteristicValue('manufacturer_name_string')
      .then(this._decodeString);
    }
    getPnpID() {
      return this._readCharacteristicValue('pnp_id')
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
    _decodeString(data) {
      return decoder.decode(data);
    }
    _encodeString(data) {
      return encoder.encode(data);
    }
  }

  window.insight = new Insight();

})();
