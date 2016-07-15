document.getElementById('connect').addEventListener('click', function() {
  navigator.bluetooth.requestDevice({ filters: [{ name: 'LED Stack' }]})
  .then(function(device) {
    document.querySelector('#status').textContent = 'connecting...';
    return device.gatt.connect();
  })
  .then(function(server) {
    // FIXME: Remove this timeout when GattServices property works as intended.
    // crbug.com/560277
    return new Promise(function(resolve) {
      setTimeout(function() {
        resolve(server.getPrimaryService(0xEC00));
      }, 2e3);
    })
  })
  .then(function(service) {
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
    showError(err);
  });
});

function handleColorCharacteristic(characteristic) {
  return characteristic.readValue()
  .then(data => {
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
      .then(() => {
        document.querySelector('.selected').classList.remove('selected');
        event.target.classList.add('selected');
      })
      .catch(err => {
        showError(err);
      });
    });
  });
}

function handleMessageCharacteristic(characteristic) {
  var openedMessage = document.getElementById('openedMessage');
  document.getElementById('messageForm').addEventListener('submit', function(event) {
    event.preventDefault();
    event.stopPropagation();
    var encoder = new TextEncoder();
    var message = document.getElementById('message');
    if (!message.value) {
      showError('Message must not be empty.');
      return;
    }
    characteristic.writeValue(encoder.encode(message.value))
    .then(() => {
      message.value = '';
    })
    .catch(err => {
      showError(err);
    });
  });
  document.getElementById('open').disabled = false;
  document.getElementById('open').addEventListener('click', function() {
    openedMessage.hidden = true;
    openedMessage.innerText = '';
    characteristic.readValue()
    .then(buffer => {
      var decoder = new TextDecoder();
      var message = decoder.decode(buffer);
      if (message) {
        openedMessage.innerText = message;
        openedMessage.hidden = false;
        openedMessage.classList.toggle('right');
      } else {
        showError('No more messages...');
      }
    })
    .catch(err => {
      showError(err);
    });
  });
  openedMessage.addEventListener('click', function() {
    openedMessage.hidden = true;
    openedMessage.innerText = '';
  });
  return Promise.resolve();
}

function showError(err) {
  var error = document.getElementById('error');
  error.innerText = err.toString();
  error.hidden = false;
  setTimeout(function() { error.hidden = true; }, 5e3);
}

const colors = ['#f44336', '#9C27B0', '#3F51B5', '#009688', '#FFEB3B', '#9E9E9E'];
var gems = document.querySelectorAll("#gems .gem");
Array.from(gems).forEach(function(gem, i) {
  gem.style.backgroundColor = colors[i];
  gem.dataset.color = colors[i];
});
