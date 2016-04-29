var minutesStep = 15;

Array.from(document.querySelectorAll(".color")).forEach(function(c, i) {
  c.style.color = exports.COLORS[i];
  c.dataset.color = exports.COLORS[i];
  c.dataset.index = i;
});

document.getElementById('connect').addEventListener('click', function() {
  navigator.bluetooth.requestDevice({ filters: [{ name: exports.DEVICE_NAME }]})
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
    // FIXME: Use Promise.all when Android handles it properly.
    return service.getCharacteristic(0xEC01).then(handleColorCharacteristic)
    .then(() => service.getCharacteristic(0xEC02).then(handleWakeUpTimeCharacteristic));
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
    // Set user color.
    var r = ('00' + data.getUint8(0).toString(16)).slice(-2).toUpperCase();
    var g = ('00' + data.getUint8(1).toString(16)).slice(-2).toUpperCase();
    var b = ('00' + data.getUint8(2).toString(16)).slice(-2).toUpperCase();
    var swipe = new Swipe(document.getElementById('swipe'),
        { start: document.querySelector('[data-color="#' + r + g + b + '"]').dataset.index });
    swipe.config.onchange = function(index) {
      var color = document.getElementsByClassName('color')[parseInt(index)].dataset.color;
      if (color) {
        characteristic.writeValue(new Uint8Array(exports.strColorToHex(color)))
        .then(() => {
          setButtonsColor(color);
        });
      }
    }
    setButtonsColor('#' + r + g + b);
  });
}

function setButtonsColor(color) {
  document.getElementById('forward').style.backgroundColor = color;
  document.getElementById('backward').style.backgroundColor = color;
}

function displayWakeUpTime(time) {
  Array.from(document.querySelectorAll('.time')).forEach(function(e) {
    var hours = time.getHours();
    var minutes = time.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    e.textContent =  hours + ':' + minutes + ' ' + ampm;
  });
}

function handleWakeUpTimeCharacteristic(characteristic) {
  return characteristic.readValue()
  .then(data => {
    // Set alarm time.
    var encoder = new TextEncoder('utf-8');
    var wakeUpTime = new Date();
    if (data.byteLength) {
      var decoder = new TextDecoder('utf-8');
      wakeUpTime = new Date(decoder.decode(data) * 1000);
    } else {
      wakeUpTime.setHours(7)
      wakeUpTime.setMinutes(0);
      wakeUpTime.setSeconds(0);
      console.log(wakeUpTime);
      characteristic.writeValue(encoder.encode(wakeUpTime.getTime() / 1000));
    }
    displayWakeUpTime(wakeUpTime);

    document.getElementById('forward').addEventListener('click', function() {
      wakeUpTime.setMinutes(wakeUpTime.getMinutes() + minutesStep);
      characteristic.writeValue(encoder.encode(wakeUpTime.getTime() / 1000))
      .then(() => {
        displayWakeUpTime(wakeUpTime);
      })
      .catch(err => {
        showError(err);
      });
    });
    document.getElementById('backward').addEventListener('click', function() {
      wakeUpTime.setMinutes(wakeUpTime.getMinutes() - minutesStep);
      characteristic.writeValue(encoder.encode(wakeUpTime.getTime() / 1000))
      .then(() => {
        displayWakeUpTime(wakeUpTime);
      })
      .catch(err => {
        showError(err);
      });
    });
  });
}

function showError(err) {
  var error = document.getElementById('error');
  error.innerText = err.toString();
  error.hidden = false;
  setTimeout(function() { error.hidden = true; }, 5e3);
}
