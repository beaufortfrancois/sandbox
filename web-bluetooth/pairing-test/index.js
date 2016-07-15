var s;

function log(text) {
  document.querySelector('pre').innerHTML += text + '<br/>';
  document.body.scrollTop = document.body.scrollHeight;
}

function go() {
  document.querySelector('pre').textContent = '';

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
      let properties = [];
      if (characteristic.properties.broadcast) properties.push('Broadcast');
      if (characteristic.properties.read) properties.push('Read');
      if (characteristic.properties.writeWithoutResponse) properties.push('Write w/o response');
      if (characteristic.properties.write) properties.push('Write');
      if (characteristic.properties.notify) properties.push('Notify');
      if (characteristic.properties.indicate) properties.push('Indicate');
      if (characteristic.properties.authenticatedSignedWrites) properties.push('Signed Write');
      if (characteristic.properties.reliableWrite) properties.push('Queued Write');
      if (characteristic.properties.writableAuxiliaries) properties.push('Writable Auxiliaries');
      log(characteristic.uuid + ': ' + properties.join(', '));
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
