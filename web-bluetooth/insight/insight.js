(() => {
  'use strict';

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


  class Insight {
    constructor() {
      this.device = null;
      this.server = null;
      this._characteristics = new Map();
      this._debug = false;
    }
    requestDevice() {
      return navigator.bluetooth.requestDevice({filters:[{services:[ INSIGHT_SERVICE_UUID ]}]})
      .then(device => {
        this.device = device;
        return device.connectGATT();
      })
      .then(server => {
        this.server = server;
        return Promise.all([
          server.getPrimaryService(INSIGHT_SERVICE_UUID).then(service => {
            return Promise.all([
              this._cacheCharacteristic(service, DECK_CARD_UUID),
            ])
          }),
          server.getPrimaryService('battery_service').then(service => {
            return this._cacheCharacteristic(service, 'battery_level');
          }),
        ]);
      })
      .then(() => this.device); // Returns device when fulfilled.
    }

    /* Insight Service */

    getDeckCard() {
      return this._readCharacteristicValue(DECK_CARD_UUID)
      .then(data => {
        const code = data.getUint8(0).toString(16);
        return VALUES.get(code.slice(1, 2)) + SUITES.get(code.slice(0,1));
      });
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
  }

  window.insight = new Insight();

})();