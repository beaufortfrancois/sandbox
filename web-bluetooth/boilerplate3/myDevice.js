'use strict';

class BluetoothDevice {
  constructor() {
    this.device = null;
    this._gattServer = null;
    this.deviceInformationService = null;
    this.heartRateService = null;
  }
  discover() {
    let options = {filters:[{services:[ 0xFF02 ]}]};
    return navigator.bluetooth.requestDevice(options)
    .then(device => {
      this.device = device;
      return this.device;
    });
  }
  connect() {
    return this.device.gatt.connect()
    .then(gattServer => {
      //TODO: Remove when gattServer is added to device:wq
      this._gattServer = gattServer;
      this.deviceInformationService = new DeviceInformationService(this._gattServer);
      this.heartRateService = new HeartRateService(this._gattServer);
    });
  }
}

class BluetoothService {
  constructor(gattServer) {
    this._gattServer = gattServer;
  }
  _readCharacteristicValue(characteristicUuid) {
    return this._gattServer.getPrimaryService(this._serviceUuid)
    .then(service => service.getCharacteristic(characteristicUuid))
    .then(characteristic => characteristic.readValue())
  }
  _writeCharacteristicValue(characteristicUuid, value) {
    return this._gattServer.getPrimaryService(this._serviceUuid)
    .then(service => service.getCharacteristic(characteristicUuid))
    .then(characteristic => characteristic.writeValue(value))
  }
}

class DeviceInformationService extends BluetoothService {
  constructor(gattServer) {
    super(gattServer);
    this._serviceUuid = 'device_information';
  }
  getSerialNumber() {
    return this._readCharacteristicValue('manufacturer_name_string')
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

  _decodeString(data) {
    let decoder = new TextDecoder('utf-8');
    return decoder.decode(data);
  }
}

class HeartRateService extends BluetoothService {
  constructor() {
    super();
    this._serviceUuid = 'heart_rate';
  }
  getBodySensorLocation() {
    return this._readCharacteristicValue('body_sensor_location')
    .then(data => {
      let bodySensorLocation = data.getUint8(0);
      switch (bodySensorLocation) {
        case 0: return 'Other';
        case 1: return 'Chest';
        case 2: return 'Wrist';
        case 3: return 'Finger';
        case 4: return 'Hand';
        case 5: return 'Ear Lobe';
        case 6: return 'Foot';
        default: return 'Unknown';
      }
    });
  }
  resetEnergyExpended() {
    let data = new Uint8Array([1]);
    return this._writeCharacteristicValue('heart_rate_control_point', data);
  }
}

var myDevice = new BluetoothDevice();
