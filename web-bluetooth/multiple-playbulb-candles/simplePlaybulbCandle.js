class SimplePlaybulbCandle {

  constructor() {
    this.device = null;
    this.color = null;
  }

  _requestDevice() {
    let result = Promise.resolve();
    if (!this.device) {
      result = navigator.bluetooth.requestDevice({filters:[{services:[ 0xFF02 ]}]})
      .then(device => {
        this.device = device;
      });
    }
    return result;
  }

  _connectDeviceAndCacheCharacteristic() {
    if (this.device.gatt.connected && this.color) {
      return Promise.resolve();
    }

    return this.device.gatt.connect()
    .then(server => server.getPrimaryService(0xFF02))
    .then(service => service.getCharacteristic(0xFFFC))
    .then(characteristic => {
      this.color = characteristic;
    });
  }

  blink(red, green, blue, ms) {
    return this._requestDevice()
    .then(_ => this._connectDeviceAndCacheCharacteristic())
    .then(_ => {
      let data = new Uint8Array([0x00, red, green, blue]);
      return this.color.writeValue(data)
    })
    .then(_ => {
      return new Promise((resolve, reject) => {
        setTimeout(_ => { resolve(); }, ms);
      });
    })
    .then(_ => {
      let data = new Uint8Array(4);
      return this.color.writeValue(data);
    });
  }
}
