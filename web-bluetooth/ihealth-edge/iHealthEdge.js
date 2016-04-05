'use strict';

const IHEALTH_EDGE_SERVICE_UUID = '636f6d2e-6a69-7561-6e2e-414d56313100';
const FOO_CHARACTERISTIC_UUID = '7365642e-6a69-7561-6e2e-414d56313100';
const BAR_CHARACTERISTIC_UUID = '7265632e-6a69-7561-6e2e-414d56313100';

const STEPS_SERVICE_UUID = 0xfee7;
const CONTROL_CHARACTERISTIC_UUID = 0xfec7;
const ACTIVITY_CHARACTERISTIC_UUID = 0xfec8;

class BluetoothDevice {

  constructor() {
    this.device = null;
    this._textDecoder = new TextDecoder();
  }

  discover() {
    let options = {filters: [{services: [ IHEALTH_EDGE_SERVICE_UUID ]}],
                   optionalServices: ['device_information', STEPS_SERVICE_UUID]};
    return navigator.bluetooth.requestDevice(options)
    .then(device => {
      this.device = device;
      return device;
    });
  }

  connect() {
    return this.device.gatt.connect();
  }

  /* Steps Service */

  setControl(value) {
    return this.device.gatt.getPrimaryService(STEPS_SERVICE_UUID)
    .then(service => service.getCharacteristic(CONTROL_CHARACTERISTIC_UUID))
    .then(characteristic => characteristic.writeValue(value))
  }

  startActivityNotifications(eventListener) {
    return this.device.gatt.getPrimaryService(STEPS_SERVICE_UUID)
    .then(service => service.getCharacteristic(ACTIVITY_CHARACTERISTIC_UUID))
    .then(characteristic => {
      return characteristic.startNotifications()
      .then(() => {
        characteristic.addEventListener('characteristicvaluechanged',
          eventListener);
      });
    })
  }

  /* iHealth Edge Service */

  startFooNotifications(eventListener) {
    return this.device.gatt.getPrimaryService(IHEALTH_EDGE_SERVICE_UUID)
    .then(service => service.getCharacteristic(FOO_CHARACTERISTIC_UUID))
    .then(characteristic => {
      return characteristic.startNotifications()
      .then(() => {
        characteristic.addEventListener('characteristicvaluechanged',
          eventListener);
      });
    })
  }
  
  setBar(value) {
    return this.device.gatt.getPrimaryService(IHEALTH_EDGE_SERVICE_UUID)
    .then(service => service.getCharacteristic(BAR_CHARACTERISTIC_UUID))
    .then(characteristic => characteristic.writeValue(value))
  }

  /* Device Information Service */

  getManufacturerName() {
    return this.device.gatt.getPrimaryService("device_information")
    .then(service => service.getCharacteristic("manufacturer_name_string"))
    .then(characteristic => characteristic.readValue())
    .then(value => this._textDecoder.decode(value));
  }

  getModelNumber() {
    return this.device.gatt.getPrimaryService("device_information")
    .then(service => service.getCharacteristic("model_number_string"))
    .then(characteristic => characteristic.readValue())
    .then(value => this._textDecoder.decode(value));
  }

  getHardwareRevision() {
    return this.device.gatt.getPrimaryService("device_information")
    .then(service => service.getCharacteristic("hardware_revision_string"))
    .then(characteristic => characteristic.readValue())
    .then(value => this._textDecoder.decode(value));
  }

  getFirmwareRevision() {
    return this.device.gatt.getPrimaryService("device_information")
    .then(service => service.getCharacteristic("firmware_revision_string"))
    .then(characteristic => characteristic.readValue())
    .then(value => this._textDecoder.decode(value));
  }

  getSoftwareRevision() {
    return this.device.gatt.getPrimaryService("device_information")
    .then(service => service.getCharacteristic("software_revision_string"))
    .then(characteristic => characteristic.readValue())
    .then(value => this._textDecoder.decode(value));
  }

  getSystemId() {
    return this.device.gatt.getPrimaryService("device_information")
    .then(service => service.getCharacteristic("system_id"))
    .then(characteristic => characteristic.readValue())
    .then(value => this._textDecoder.decode(value));
  }

  getRegulatoryCertificationDataList() {
    return this.device.gatt.getPrimaryService("device_information")
    .then(service => service.getCharacteristic("ieee_11073-20601_regulatory_certification_data_list"))
    .then(characteristic => characteristic.readValue())
    .then(value => this._textDecoder.decode(value));
  }

  getPnpId() {
    return this.device.gatt.getPrimaryService("device_information")
    .then(service => service.getCharacteristic("pnp_id"))
    .then(characteristic => characteristic.readValue())
    .then(value => this._textDecoder.decode(value));
  }

  getAndroidPackageName() {
    return this.device.gatt.getPrimaryService("device_information")
    .then(service => service.getCharacteristic(0xff01))
    .then(characteristic => characteristic.readValue())
    .then(value => this._textDecoder.decode(value));
  }

  getDeviceName() {
    return this.device.gatt.getPrimaryService("device_information")
    .then(service => service.getCharacteristic(0xff02))
    .then(characteristic => characteristic.readValue())
    .then(value => this._textDecoder.decode(value));
  }

}

var iHealthEdge = new BluetoothDevice();
