'use strict';

class BluetoothDevice {
  constructor() {
    this.deviceInformationService = new DeviceInformationService();
    this.heartRateService = new HeartRateService();
  }
  connect() {
    let options = {filters:[{services:[ this.heartRateService._serviceUuid ]}]};
    return navigator.bluetooth.requestDevice(options)
    .then(device => device.gatt.connect())
    .then(gattServer => {
      return Promise.all([
        this.deviceInformationService._cacheCharacteristics(gattServer),
        this.heartRateService._cacheCharacteristics(gattServer),
      ]);
    });
  }
}

class BluetoothService {
  constructor() {
    this._serviceUuid = null;
    this._service = null;
    this._characteristicUuids = new Map();
    this._characteristics = new Map();
  }
  _cacheCharacteristics(gattServer) {
    return gattServer.getPrimaryService(this._serviceUuid)
    .then(service => {
      this._service = service;
      return Promise.all(
        Array.from(this._characteristicUuids.values()).map(this._cacheCharacteristic.bind(this))
      );
    });
  }
  _cacheCharacteristic(characteristicUuid) {
    return this._service.getCharacteristic(characteristicUuid)
    .then(characteristic => {
      this._characteristics.set(characteristicUuid, characteristic);
    });
  }
  _readCharacteristicValue(characteristicName) {
    let characteristicUuid = this._characteristicUuids.get(characteristicName);
    return this._characteristics.get(characteristicUuid).readValue();
  }
  _writeCharacteristicValue(characteristicName, value) {
    let characteristicUuid = this._characteristicUuids.get(characteristicName);
    return this._characteristics.get(characteristicUuid).writeValue(value);
  }
}

class DeviceInformationService extends BluetoothService {
  constructor() {
    super();
    this._serviceUuid = 0x180A;
    this._characteristicUuids.set('manufacturerName', 0x2A29);
    this._characteristicUuids.set('modelNumber', 0x2A24);
  }
  getManufacturerName() {
    return this._readCharacteristicValue('manufacturerName');
  }
  getModelNumber() {
    return this._readCharacteristicValue('modelNumber');
  }
}

class HeartRateService extends BluetoothService {
  constructor() {
    super();
    this._serviceUuid = 0x180D;
    this._characteristicUuids.set('bodySensorLocation', 0x2A38);
    this._characteristicUuids.set('heartRateControlPoint', 0x2A39);
  }
  getBodySensorLocation() {
    return this._readCharacteristicValue('bodySensorLocation')
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
    return this._writeCharacteristicValue('heartRateControlPoint');
  }
}

var myDevice = new BluetoothDevice();
