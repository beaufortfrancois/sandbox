document.getElementById('connect').addEventListener('click', function() {
  navigator.bluetooth.requestDevice({ filters: [{ name: 'Sound Tracker' }]})
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
    return service.getCharacteristic(0xEC01).then(handleSoundCharacteristic)
    .then(() => service.getCharacteristic(0xEC02).then(handleThresholdCharacteristic));
  })
  .then(function() {
    document.getElementById('step1').hidden = true;
    document.getElementById('step2').hidden = false;
  })
  .catch(function(err) {
    showError(err);
  });
});

function handleSoundCharacteristic(characteristic) {
  document.querySelector('#clearLogs').addEventListener('click', clearLogs);
  characteristic.addEventListener('characteristicvaluechanged', onSoundChanged);
  return characteristic.startNotifications();
}

function onSoundChanged(event) {
  var now = new Date();
  var data = event.target.value;
  var sound = data.getUint32(0, /*littleEndian=*/true);
  var line = document.createElement('pre');
  line.textContent = now.toLocaleString() + ' [' + Math.round(sound / 1000) + ']';
  document.querySelector('#log').appendChild(line);
}

function handleThresholdCharacteristic(characteristic) {
  return characteristic.readValue()
  .then(function(data) {
    var threshold = data.getUint32(0, /*littleEndian=*/true);
    document.querySelector('[type=number]').value = threshold;
    document.querySelector('#updateThreshold').addEventListener('click', function() {
      var threshold = parseInt(document.querySelector('[type=number]').value);
      var buffer = new ArrayBuffer(4);
      var data = new DataView(buffer);
      data.setUint32(0, threshold, /*littleEndian=*/true);
      characteristic.writeValue(data);
    });
  });
}

function clearLogs() {
  document.querySelector('#log').innerHTML = '';
}

function showError(err) {
  var error = document.getElementById('error');
  error.innerText = err.toString();
  error.hidden = false;
  setTimeout(function() { error.hidden = true; }, 5e3);
}
