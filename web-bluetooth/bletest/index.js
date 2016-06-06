var s;

function log(text) {
  document.querySelector('pre').innerHTML += text + '<br/>';
  document.body.scrollTop = document.body.scrollHeight;
}

function go() {
  let serviceUuid = document.querySelector('#service-uuid').value;
  if (serviceUuid.startsWith('0x')) {
    serviceUuid = parseInt(serviceUuid);
  }

  navigator.bluetooth.requestDevice({filters: [{services: [serviceUuid] }]})
  .then(function(device) { return device.gatt.connect()})
  .then(function(server) { return server.getPrimaryService(serviceUuid)})
  .then(function(service) { s = service; return service.getCharacteristics()})
  .then(characteristics => {
    characteristics.forEach(characteristic => {
      log('> Characteristic UUID:  ' + characteristic.uuid);
      if (characteristic.properties.broadcast) {
      log('> Broadcast:            ' + characteristic.properties.broadcast);
      }
      if (characteristic.properties.read) {
      log('> Read:                 ' + characteristic.properties.read);
      }
      if (characteristic.properties.writeWithoutResponse) {
      log('> Write w/o response:   ' +
        characteristic.properties.writeWithoutResponse);
      }
      if (characteristic.properties.write) {
      log('> Write:                ' + characteristic.properties.write);
      }
      if (characteristic.properties.notify) {
      log('> Notify:               ' + characteristic.properties.notify);
      }
      if (characteristic.properties.indicate) {
      log('> Indicate:             ' + characteristic.properties.indicate);
      }
      if (characteristic.properties.authenticatedSignedWrites) {
      log('> Signed Write:         ' +
        characteristic.properties.authenticatedSignedWrites);
      }
      if (characteristic.properties.reliableWrite) {
      log('> Queued Write:         ' + characteristic.properties.reliableWrite);
      }
      if (characteristic.properties.writableAuxiliaries) {
      log('> Writable Auxiliaries: ' +
        characteristic.properties.writableAuxiliaries);
      }
      log('');
    })
  })
  .catch(e => {
    log(e);
  });
}

function getCharacteristic() {
  let uuid = document.querySelector('#characteristic-uuid').value;
  if (uuid.startsWith('0x')) {
    uuid = parseInt(uuid);
  }
  return s.getCharacteristic(uuid);
}

function read() {
  getCharacteristic()
  .then(c => c.readValue())
  .then(value => {
    let a = [];
    for (let i = 0; i < value.byteLength; i++) {
      a.push('0x' + ('00' + value.getUint8(i).toString(16)).slice(-2));
    }
    log('> Read: ' + a.join(' '));
  })
  .catch(e => {
    log(e);
  });
}

function write() {
  getCharacteristic()
  .then(c => c.writeValue(new Uint8Array([0])))
  .then(_ => {
    log('> Written!');
  })
  .catch(e => {
    log(e);
  });
}

window.addEventListener('load', function () {
  document.querySelector("#go").addEventListener('click', go);
  document.querySelector("#read").addEventListener('click', read);
  document.querySelector("#write").addEventListener('click', write);
});
