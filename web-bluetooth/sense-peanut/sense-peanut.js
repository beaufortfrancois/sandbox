class Peanut {

  constructor() {
    this.device = null;
    this.onDisconnected = this.onDisconnected.bind(this);
  }

  request() {
    let options = {
      'filters': [{ 'name': 'SensePeanut' }],
      'optionalServices': ['93cd3ce1-58d0-4757-8767-3a9e03511f43']
    };
    return navigator.bluetooth.requestDevice(options)
    .then(device => {
      this.device = device;
      this.device.addEventListener('gattserverdisconnected', this.onDisconnected);
      return device;
    });
  }

  connect() {
    let requestDevice = Promise.resolve();
    if (!this.device) {
      requestDevice = this.request();
    }

    return requestDevice.then(_ => {

      if (this.device.gatt.connected &&
          this._commandCharacteristic &&
          this._ackCharacteristic) {
        return Promise.resolve();
      }

      return this.device.gatt.connect()
      .then(server => server.getPrimaryService('93cd3ce1-58d0-4757-8767-3a9e03511f43'))
      .then(service => Promise.all([
        service.getCharacteristic('780a1f13-6153-487a-8be7-38c9058fc322'),
        service.getCharacteristic('a2cb1256-6ba8-48de-98b6-d5989f26a203')
      ]))
      .then(characteristics => {
        [this._commandCharacteristic, this._ackCharacteristic] = characteristics;
      });
    });
  }

  getInitData() {
    return this._commandCharacteristic.writeValue(new Uint8Array([10]))
    .then(_ => this._commandCharacteristic.readValue())
    .then(value => {
      if (value.getUint8(0) !== 10) {
        return Promise.reject('Unexpected ID when reading command characteristic');
      }
      let initData = {
        bootloaderId: value.getUint8(6),
        usageId: value.getUint8(7),
        firmwareId: value.getUint8(8),
        bufferSize: (value.getUint8(15) | value.getUint8(16) << 8)
      }
      return initData;
    });
  }

  getMacAddress() {
    return this._commandCharacteristic.writeValue(new Uint8Array([100]))
    .then(_ => this._commandCharacteristic.readValue())
    .then(value => {
      if (value.getUint8(0) !== 100) {
        return Promise.reject('Unexpected ID when reading command characteristic');
      }
      let bytes = [];
      for (let i = 6; i < 12; i++) {
        bytes.push(('00' + value.getUint8(i).toString(16).toUpperCase()).slice(-2));
      }
      let macAddress = bytes.join(':');
      return macAddress;
    });
  }

  getPlainText() {
    return this._commandCharacteristic.writeValue(new Uint8Array([50]))
    .then(_ => this._commandCharacteristic.readValue())
    .then(value => {
      if (value.getUint8(0) !== 50) {
        return Promise.reject('Unexpected ID when reading command characteristic');
      }
      let data = new Uint8Array(value.buffer, 6, 16);
      return data;
    });
  }

  setFactoryCipher(key, clearText) {
    // AES-EBD is same as AES_CDB when IV is null and clearText is 16 bytes.
    return crypto.subtle.importKey('raw', key, {name: 'AES-CBC'}, true, ['encrypt'])
    .then(k => crypto.subtle.encrypt({ name: 'AES-CBC', iv: new ArrayBuffer(16) }, k, clearText.reverse()))
    .then(encrypted => {
      let reversedEncrypted = new Uint8Array(encrypted, 0, 16).reverse();
      let data = new Uint8Array(17);
      data.set(new Uint8Array([51]), 0);
      data.set(reversedEncrypted, 1);
      return this._commandCharacteristic.writeValue(data);
    })
    .then(_ => this._commandCharacteristic.readValue())
    .then(value => {
      if (value.getUint8(0) !== 52) {
        return Promise.reject('Unexpected ID when reading command characteristic');
      }
      if (value.getUint8(6) !== 0) {
        return Promise.reject('Incorrect ciphertext');
      }
      return value;
    })
  }

  setTime() {
    let seconds = Math.floor( Date.now() / 1000 );
    let data = new Uint8Array([1, seconds, seconds >> 8, seconds >> 16, seconds >> 24, 0]);
    return this._commandCharacteristic.writeValue(data);
  }

  getBattery() {
    return this._commandCharacteristic.writeValue(new Uint8Array([3]))
    .then(_ => this._commandCharacteristic.readValue())
    .then(value => {
      if (value.getUint8(0) !== 1) {
        return Promise.reject('Unexpected ID when reading command characteristic');
      }
      return this._parseNotifications(value);
    });
  }

  getTemperature() {
    return this._commandCharacteristic.writeValue(new Uint8Array([4]))
    .then(_ => this._commandCharacteristic.readValue())
    .then(value => {
      if (value.getUint8(0) !== 4) {
        return Promise.reject('Unexpected ID when reading command characteristic');
      }
      return this._parseNotifications(value);
    });
  }

  buzz() {
    return this._commandCharacteristic.writeValue(new Uint8Array([5]))
  }

  startNotifications(listener) {
    return this._ackCharacteristic.startNotifications()
    .then(_ => {
      this._ackCharacteristic.oncharacteristicvaluechanged = event => {
        this._ackAndParseNotifications(event.target.value)
        .then(data => listener(data));
      };
    });
  }

  stopNotifications() {
    return this._ackCharacteristic.stopNotifications()
    .then(_ => {
      this._ackCharacteristic.oncharacteristicvaluechanged = null;
    });
  }

  _ackAndParseNotifications(value) {
    let counterId = value.getUint8(1);
    return this._ackCharacteristic.writeValue((new Uint8Array([254, counterId])))
    .then(_ => this._parseNotifications(value));
  }

  _parseNotifications(value) {
    let data = {
      timeStamp: this._parseTimestamp(value)
    };
    switch (value.getUint8(0)) {
      case 1:
        data.batteryLevel = this._parseBatteryData(value);
        break;
      case 4:
        data.temperatureCelsius = this._parseTemperatureData(value);
        break;
      case 5:
        data.touch = this._parseTouchData(value);
        break;
      default:
        let bytes = [];
        for (let i = 0; i < value.byteLength; i++) {
          bytes.push(value.getUint8(i));
        }
        data.unknown = bytes.join(' ');
    }
    return data;
  }

  _parseTimestamp(value) {
    let timeStampSeconds = value.getUint8(2) | value.getUint8(3) << 8 | value.getUint8(4) << 16 | value.getUint8(5) << 24;
    let counterId = value.getUint8(1);
    return new Date(timeStampSeconds * 1000 + counterId);
  }

  _parseBatteryData(value) {
    let batteryData = value.getUint8(6) | value.getUint8(7) << 8;
    if (batteryData >= 2900) {
      return batteryData + 'mV (100%)';
    } else if (batteryData >= 2850) {
      return batteryData + 'mV (50%)';
    } else if (batteryData >= 2600) {
      return batteryData + 'mV (25%)';
    }
    return batteryData + 'mV (0%)';
  }

  _parseTemperatureData(value) {
    return (((value.getUint8(6) | (value.getUint8(7) << 8)) / 100) - 273.15).toFixed(2) + 'C';
  }

  _parseTouchData(value) {
    let touchData = value.getUint8(6);
    return (touchData === 0xfe) ? 'Long press' : touchData;
  }

  disconnect() {
    if (!this.device) {
      return Promise.reject('Device is not connected.');
    } else {
      return this.device.gatt.disconnect();
    }
  }

  onDisconnected() {
    console.log('Device is disconnected.');
  }
}

var peanut = new Peanut();
