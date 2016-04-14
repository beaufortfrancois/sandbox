class {{classDeviceName}} {

  constructor() {
    this.device = null;
    this.onDisconnected = this.onDisconnected.bind(this);
  }

  request() {
    let options = {
      {{filterOptions}}{{optionalServicesOptions}}
    };
    return navigator.bluetooth.requestDevice(options)
    .then(device => {
      this.device = device;
      this.device.addEventListener('gattserverdisconnected', this.onDisconnected);
      return device;
    });
  }

  connect() {
    if (!this.device) {
      return Promise.reject('Device is not connected.');
    } else {
      return this.device.gatt.connect();
    }
  }
  {{characteristicMethods}}
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

var {{instanceDeviceName}} = new {{classDeviceName}}();
document.querySelector('button').addEventListener('click', function() {
  {{instanceDeviceName}}.request()
  .then(_ => {{instanceDeviceName}}.connect())
  .then(_ => { /* Do something with {{instanceDeviceName}} */})
  .catch(error => { console.log(error) });
}
