(function() {
  'use strict';

  let encoder = new TextEncoder('utf-8');
  let decoder = new TextDecoder('utf-8');

  /* Custom Bluetooth Service UUIDs */

  const CANDLE_SERVICE_UUID = 0xFF02;

  /* Custom Bluetooth Characteristic UUIDs */

  const CANDLE_DEVICE_NAME_UUID = 0xFFFF;
  const CANDLE_COLOR_UUID = 0xFFFC;
  const CANDLE_EFFECT_UUID = 0xFFFB;

  class PlaybulbCandle {
    constructor() {
      this.device = null;
      this.gattServer = null;
    }
    connect() {
      return navigator.bluetooth.requestDevice({filters:[{services:[ CANDLE_SERVICE_UUID ]}]})
      .then(device => {
        this.device = device;
        return device.gatt.connect();
      })
      .then(gattServer => {
        //TODO: Remove when gattServer is added to device.
        this.gattServer = gattServer;
      })
    }

    /* Candle Service */

    getDeviceName() {
      return this.gattServer.getPrimaryService(CANDLE_SERVICE_UUID)
      .then(service => service.getCharacteristic(CANDLE_DEVICE_NAME_UUID))
      .then(characteristic => characteristic.readValue())
      .then(this._decodeString)
    }
    setDeviceName(name) {
      let data = this._encodeString(name);
      return this.gattServer.getPrimaryService(CANDLE_SERVICE_UUID)
      .then(service => service.getCharacteristic(CANDLE_DEVICE_NAME_UUID))
      .then(characteristic => characteristic.writeValue(data))
    }
    setColor(r, g, b) {
      let data = new Uint8Array([0x00, r, g, b]);
      return this.gattServer.getPrimaryService(CANDLE_SERVICE_UUID)
      .then(service => service.getCharacteristic(CANDLE_COLOR_UUID))
      .then(characteristic => characteristic.writeValue(data))
      .then(() => [r,g,b]); // Returns color when fulfilled.
    }
    setCandleEffectColor(r, g, b) {
      let data = new Uint8Array([0x00, r, g, b, 0x04, 0x00, 0x01, 0x00]);
      return this.gattServer.getPrimaryService(CANDLE_SERVICE_UUID)
      .then(service => service.getCharacteristic(CANDLE_EFFECT_UUID))
      .then(characteristic => characteristic.writeValue(data))
      .then(() => [r,g,b]); // Returns color when fulfilled.
    }
    setFlashingColor(r, g, b) {
      let data = new Uint8Array([0x00, r, g, b, 0x00, 0x00, 0x1F, 0x00]);
      return this.gattServer.getPrimaryService(CANDLE_SERVICE_UUID)
      .then(service => service.getCharacteristic(CANDLE_EFFECT_UUID))
      .then(characteristic => characteristic.writeValue(data))
      .then(() => [r,g,b]); // Returns color when fulfilled.
    }
    setPulseColor(r, g, b) {
      // We have to correct user color to make it look nice for real...
      let newRed = Math.min(Math.round(r / 64) * 64, 255);
      let newGreen = Math.min(Math.round(g / 64) * 64, 255);
      let newBlue = Math.min(Math.round(b / 64) * 64, 255);
      let data = new Uint8Array([0x00, newRed, newGreen, newBlue, 0x01, 0x00, 0x09, 0x00]);
      return this.gattServer.getPrimaryService(CANDLE_SERVICE_UUID)
      .then(service => service.getCharacteristic(CANDLE_EFFECT_UUID))
      .then(characteristic => characteristic.writeValue(data))
      .then(() => [r,g,b]); // Returns color when fulfilled.
    }
    setRainbow() {
      let data = new Uint8Array([0x01, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0x00]);
      return this.gattServer.getPrimaryService(CANDLE_SERVICE_UUID)
      .then(service => service.getCharacteristic(CANDLE_EFFECT_UUID))
      .then(characteristic => characteristic.writeValue(data))
      .then(() => [r,g,b]); // Returns color when fulfilled.
    }
    setRainbowFade() {
      let data = new Uint8Array([0x01, 0x00, 0x00, 0x00, 0x03, 0x00, 0x26, 0x00]);
      return this.gattServer.getPrimaryService(CANDLE_SERVICE_UUID)
      .then(service => service.getCharacteristic(CANDLE_EFFECT_UUID))
      .then(characteristic => characteristic.writeValue(data))
      .then(() => [r,g,b]); // Returns color when fulfilled.
    }

    /* Battery Service */

    getBatteryLevel() {
      return this.gattServer.getPrimaryService('battery_service')
      .then(service => service.getCharacteristic('battery_level'))
      .then(characteristic => characteristic.readValue())
      .then(buffer => buffer.getUint8(0));
    }

    /* Device Info Service */

    getSerialNumber() {
      return this.gattServer.getPrimaryService('device_information')
      .then(service => service.getCharacteristic('serial_number_string'))
      .then(characteristic => characteristic.readValue())
      .then(this._decodeString);
    }
    getHardwareRevision() {
      return this.gattServer.getPrimaryService('device_information')
      .then(service => service.getCharacteristic('hardware_revision_string'))
      .then(characteristic => characteristic.readValue())
      .then(this._decodeString);
    }
    getFirmwareRevision() {
      return this.gattServer.getPrimaryService('device_information')
      .then(service => service.getCharacteristic('firmware_revision_string'))
      .then(characteristic => characteristic.readValue())
      .then(this._decodeString);
    }
    getSoftwareRevision() {
      return this.gattServer.getPrimaryService('device_information')
      .then(service => service.getCharacteristic('software_revision_string'))
      .then(characteristic => characteristic.readValue())
      .then(this._decodeString);
    }
    getManufacturerName() {
      return this.gattServer.getPrimaryService('device_information')
      .then(service => service.getCharacteristic('manufacturer_name_string'))
      .then(characteristic => characteristic.readValue())
      .then(this._decodeString);
    }
    getPnpID() {
      return this.gattServer.getPrimaryService('device_information')
      .then(service => service.getCharacteristic('pnp_id'))
      .then(characteristic => characteristic.readValue())
      .then(this._decodeString);
    }

    /* Utils */

    _decodeString(data) {
      return decoder.decode(data);
    }
    _encodeString(data) {
      return encoder.encode(data);
    }
  }

  window.playbulbCandle = new PlaybulbCandle();

})();
