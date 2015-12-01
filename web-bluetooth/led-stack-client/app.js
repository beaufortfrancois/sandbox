var serviceUUID = 0xEC00;
var colorUUID = 0xEC01;
var messageUUID = 0xEC02;

document.getElementById('scan').addEventListener('click', function() {
  console.log('Requesting Device');
  navigator.bluetooth.requestDevice({ filters: [{ services: [serviceUUID] }]
  }).then(function(device) {
    console.log('Getting GATT');
    return device.connectGATT();
  }).then(function(server) {
    console.log('Getting Primary Service');
    return server.getPrimaryService(serviceUUID);
  }).then(function(service) {
    console.log('Getting Characteristics');
    return Promise.all([
      service.getCharacteristic(colorUUID).then(handleColorCharacteristic),
      service.getCharacteristic(messageUUID).then(handleMessageCharacteristic),
    ]);
  }).catch(function(err) {
    document.getElementById('errorText').innerHTML = '' + err;
    console.log('ERROR:', err);	
  });
});

function handleColorCharacteristic(characteristic) {
  return characteristic.readValue()
  .then(buffer => {
    var data = new DataView(buffer);
    var r = ('00' + data.getUint8(0).toString(16)).slice(-2);
    var g = ('00' + data.getUint8(1).toString(16)).slice(-2);
    var b = ('00' + data.getUint8(2).toString(16)).slice(-2);
    document.getElementById('color').value = '#' + r + g + b;
    document.getElementById('color').disabled = false;
    document.getElementById('color').addEventListener('change', function() {
      var r = parseInt(this.value.substr(1, 2), 16);
      var g = parseInt(this.value.substr(3, 2), 16);
      var b = parseInt(this.value.substr(5, 2), 16);

      characteristic.writeValue(new Uint8Array([r, g, b]))
      .catch(err => {
        document.getElementById('errorText').innerHTML = '' + err;
        console.log('ERROR:', err);	
      });
    });
  });
}

function handleMessageCharacteristic(characteristic) {
  document.getElementById('addMessage').disabled = false;
  document.getElementById('addMessage').addEventListener('click', function() {
    var encoder = new TextEncoder();
    var message = document.getElementById('message').value;
    characteristic.writeValue(encoder.encode(message))
    .catch(err => {
      document.getElementById('errorText').innerHTML = '' + err;
      console.log('ERROR:', err);	
    });
  });
  document.getElementById('readMessage').disabled = false;
  document.getElementById('readMessage').addEventListener('click', function() {
    characteristic.readValue()
    .then(buffer => {
      var decoder = new TextDecoder();
      var message = decoder.decode(buffer);
      document.getElementById('lastMessage').value = message;
    })
    .catch(err => {
      document.getElementById('errorText').innerHTML = '' + err;
      console.log('ERROR:', err);	
    });
  });
  return Promise.resolve();
}
