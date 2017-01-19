class MicroBotPush {

  constructor() {
    this.device = null;
    this.onDisconnected = this.onDisconnected.bind(this);
  }
  
  request() {
    let options = {
      "filters": [{ namePrefix: 'mib'}],
      "optionalServices": [0x1821]
    };
    return navigator.bluetooth.requestDevice(options)
    .then(device => {
      this.device = device;
      this.device.addEventListener('gattserverdisconnected', this.onDisconnected);
    });
  }
  
  connect() {
    if (!this.device) {
      return Promise.reject('Device is not connected.');
    }
    return this.device.gatt.connect();
  }
  
  press() {
    return this.device.gatt.getPrimaryService(0x1821)
    .then(service => service.getCharacteristic(0x2A11))
    .then(characteristic => characteristic.writeValue(new Uint8Array([1])));
  }

  retract() {
    return this.device.gatt.getPrimaryService(0x1821)
    .then(service => service.getCharacteristic(0x2A12))
    .then(characteristic => characteristic.writeValue(new Uint8Array([1])));
  }

  disconnect() {
    if (!this.device) {
      return Promise.reject('Device is not connected.');
    }
    return this.device.gatt.disconnect();
  }

  onDisconnected() {
    console.log('Device is disconnected.');
  }
}

var microBotPush = new MicroBotPush();
