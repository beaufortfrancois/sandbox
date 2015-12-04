document.getElementById('connect').addEventListener('click', function() {
  console.log('Requesting Device');
  navigator.bluetooth.requestDevice({ filters: [{ name: 'LED Stack' }]})
  .then(function(device) {
    console.log(device);
    console.log('Getting GATT');
    return device.connectGATT();
  })
  .then(function(server) {
    console.log(server);
    console.log('Getting Primary Service');
    // FIXME: Remove this timeout when GattServices property works as intended.
    // crbug.com/560277
    return new Promise(function(resolve) {
      setTimeout(function() {
        resolve(server.getPrimaryService(0xEC00));
      }, 2e3);
    })
  })
  .then(function(service) {
    console.log('Getting Characteristics');
    return Promise.all([
      service.getCharacteristic(0xEC01).then(handleColorCharacteristic),
      service.getCharacteristic(0xEC02).then(handleMessageCharacteristic),
    ]);
  })
  .then(function() {
    document.getElementById('step1').hidden = true;
    document.getElementById('step2').hidden = false;
  })
  .catch(function(err) {
    console.log('ERROR:', err);	
  });
});

function handleColorCharacteristic(characteristic) {
  return characteristic.readValue()
  .then(buffer => {
    var data = new DataView(buffer);
    var r = ('00' + data.getUint8(0).toString(16)).slice(-2).toUpperCase();
    var g = ('00' + data.getUint8(1).toString(16)).slice(-2).toUpperCase();
    var b = ('00' + data.getUint8(2).toString(16)).slice(-2).toUpperCase();
    document.querySelector('.gem[data-color="#' + r + g + b + '"]').classList.add('selected');
    document.querySelector('#gems').addEventListener('click', function(event) {
      var color = event.target.dataset.color;
      if (!color) {
        return;
      }
      var r = parseInt(color.substr(1, 2), 16);
      var g = parseInt(color.substr(3, 2), 16);
      var b = parseInt(color.substr(5, 2), 16);

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
  document.getElementById('open').disabled = false;
  document.getElementById('open').addEventListener('click', function() {
    characteristic.readValue()
    .then(buffer => {
      var decoder = new TextDecoder();
      var message = decoder.decode(buffer);
      console.log(message);
      //document.getElementById('lastMessage').value = message;
    })
    .catch(err => {
      //document.getElementById('errorText').innerHTML = '' + err;
      console.log('ERROR:', err);	
    });
  });
  return Promise.resolve();
}

const colors = ['#f44336', '#9C27B0', '#3F51B5', '#009688', '#FFEB3B', '#9E9E9E'];
var gems = document.querySelectorAll("#gems .gem");
Array.from(gems).forEach(function(gem, i) {
  gem.style.color = colors[i];
  gem.dataset.color = colors[i];
});
