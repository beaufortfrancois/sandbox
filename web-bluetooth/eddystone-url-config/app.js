const EDDYSTONE_URL_CONFIG_SERVICE_UUID                      = 'ee0c2080-8786-40ba-ab96-99b91ac981d8';
const LOCK_STATE_CHARACTERISTIC_UUID                         = 'ee0c2081-8786-40ba-ab96-99b91ac981d8';
const LOCK_CHARACTERISTIC_UUID                               = 'ee0c2082-8786-40ba-ab96-99b91ac981d8';
const UNLOCK_CHARACTERISTIC_UUID                             = 'ee0c2083-8786-40ba-ab96-99b91ac981d8';
const URI_DATA_CHARACTERISTIC_UUID                           = 'ee0c2084-8786-40ba-ab96-99b91ac981d8';
const FLAGS_CHARACTERISTIC_UUID                              = 'ee0c2085-8786-40ba-ab96-99b91ac981d8';
const ADVERTISED_TX_POWER_LEVELS_CHARACTERISTIC_UUID         = 'ee0c2086-8786-40ba-ab96-99b91ac981d8';
const TX_POWER_MODE_CHARACTERISTIC_UUID                      = 'ee0c2087-8786-40ba-ab96-99b91ac981d8';
const BEACON_PERIOD_CHARACTERISTIC_UUID                      = 'ee0c2088-8786-40ba-ab96-99b91ac981d8';
const RESET_CHARACTERISTIC_UUID                              = 'ee0c2089-8786-40ba-ab96-99b91ac981d8';

const TX_POWER_MODES = ['Lowest', 'Low', 'Medium', 'High'];

var beaconDevice,
    gattServer,
    lockStateCharacteristic,
    lockCharacteristic,
    unlockCharacteristic,
    uriDataCharacteristic,
    flagsCharacteristic,
    advertisedTxPowerLevelsCharacteristic,
    txPowerModeCharacteristic,
    beaconPeriodCharacteristic,
    resetCharacteristic;

var $ = document.querySelector.bind(document);

$('#scanButton').addEventListener('click', function() {
  $('#progressBar').hidden = true;
  var options = {filters:[{services:[ EDDYSTONE_URL_CONFIG_SERVICE_UUID ]}]};
  navigator.bluetooth.requestDevice(options)
  .then(device => {
    $('#progressBar').hidden = false;
    beaconDevice = device;
    return connectBeacon();
  })
  .then(readBeaconConfig)
  .then(() => {
    $('#progressBar').hidden = true;
    $('#scanButton').hidden = true;
    $('#updateButton').disabled = !$('#container').checkValidity();
    $('#container').animate([
        {opacity: 0, transform: 'translateY(24px)'},
        {opacity: 1, transform: 'translateY(0)'}],
        {duration: 400, easing: 'ease-out'});
    $('#closeButton').animate([{opacity: 0}, {opacity: 1}], 1024);
    $('#container').hidden = false;
    $('#closeButton').hidden = false;
  });
});

$('#container').addEventListener('input', function(event) {
  $('#updateButton').disabled = !event.target.checkValidity();
});

$('#updateButton').addEventListener('click', function() {
  $('#resetButton').disabled = true;
  $('#updateButton').disabled = true;
  $('#progressBar').hidden = false;
  connectBeacon()
  .then(() => getEncodedUrl($('#uri').value))
  .then(encodedUrl => uriDataCharacteristic.writeValue(new Uint8Array(encodedUrl)))
  .then(() => {
    var data = new Uint16Array([$('#period').value]);
    return beaconPeriodCharacteristic.writeValue(data);
  })
  .then(() => {
    var data = new Int8Array([
        $('#lowest').value,
        $('#low').value,
        $('#medium').value,
        $('#high').value
      ]);
    return advertisedTxPowerLevelsCharacteristic.writeValue(data);
  })
  .then(() => {
    var data = new Uint8Array([TX_POWER_MODES.indexOf($('#txPowerMode').value)]);
    return txPowerModeCharacteristic.writeValue(data);
  })
  .then(() => {
    var data = {message: 'Beacon has been updated.'};
    $('#snackbar').MaterialSnackbar.showSnackbar(data);
  })
  .then(readBeaconConfig)
  .then(() => {
    $('#resetButton').disabled = false;
    $('#updateButton').disabled = false;
    $('#progressBar').hidden = true;
  });
});

$('#lock').addEventListener('change', function(event) {
  setLock(event.target.checked);
});

$('#resetButton').addEventListener('click', function() {
  $('#resetButton').disabled = true;
  $('#updateButton').disabled = true;
  $('#progressBar').hidden = false;
  connectBeacon()
  .then(() => resetCharacteristic.writeValue(new Uint8Array([1])))
  .then(() => {
    var data = {message: 'Beacon has been reset.'};
    $('#snackbar').MaterialSnackbar.showSnackbar(data);
  })
  .then(readBeaconConfig)
  .then(() => {
    $('#resetButton').disabled = false;
    $('#updateButton').disabled = false;
    $('#progressBar').hidden = true;
  });
});

$('#closeButton').addEventListener('click', function() {
  if (gattServer && gattServer.connected) {
    gattServer.disconnect();
  }
  $('#container').hidden = true;
  $('#closeButton').hidden = true;
  $('#scanButton').hidden = false;
});

function connectBeacon() {
  if (gattServer && gattServer.connected) {
    return Promise.resolve();
  }
  // TODO: Switch to beaconDevice.gatt.connect()
  return beaconDevice.connectGATT()
  .then(server => {
    gattServer = server;
    return server.getPrimaryService(EDDYSTONE_URL_CONFIG_SERVICE_UUID);
  })
  .then(service => {
    return Promise.all([
      service.getCharacteristic(LOCK_STATE_CHARACTERISTIC_UUID),
      service.getCharacteristic(LOCK_CHARACTERISTIC_UUID),
      service.getCharacteristic(UNLOCK_CHARACTERISTIC_UUID),
      service.getCharacteristic(URI_DATA_CHARACTERISTIC_UUID),
      service.getCharacteristic(FLAGS_CHARACTERISTIC_UUID),
      service.getCharacteristic(ADVERTISED_TX_POWER_LEVELS_CHARACTERISTIC_UUID),
      service.getCharacteristic(TX_POWER_MODE_CHARACTERISTIC_UUID),
      service.getCharacteristic(BEACON_PERIOD_CHARACTERISTIC_UUID),
      service.getCharacteristic(RESET_CHARACTERISTIC_UUID),
    ]);
  })
  .then(characteristics => {
    [
      lockStateCharacteristic,
      lockCharacteristic,
      unlockCharacteristic,
      uriDataCharacteristic,
      flagsCharacteristic,
      advertisedTxPowerLevelsCharacteristic,
      txPowerModeCharacteristic,
      beaconPeriodCharacteristic,
      resetCharacteristic
    ] = characteristics;
  })
  .catch(e => { 
    var data = {message: 'Error: ' + e, timeout: 5e3 };
    $('#snackbar').MaterialSnackbar.showSnackbar(data);
  });
}

function readBeaconConfig() {
  return lockStateCharacteristic.readValue().then(value => {
    value = value.buffer ? value : new DataView(value);
    setLock((value.getUint8(0) == 1));
  })
  .then(() => {
    return uriDataCharacteristic.readValue().then(value => {
      value = value.buffer ? value : new DataView(value);
      setValue('uri', decodeURL(value));
    })
  })
  .then(() => {
    return flagsCharacteristic.readValue().then(value => {
      value = value.buffer ? value : new DataView(value);
      setValue('flags', value.getUint8(0).toString(16));
    })
  })
  .then(() => {
    return beaconPeriodCharacteristic.readValue().then(value => {
      value = value.buffer ? value : new DataView(value);
      setValue('period', value.getUint16(0, true /* littleEndian */));
    })
  })
  .then(() => {
    return txPowerModeCharacteristic.readValue().then(value => {
      value = value.buffer ? value : new DataView(value);
      setValue('txPowerMode', TX_POWER_MODES[value.getUint8(0)]);
    })
  })
  .then(() => {
    return advertisedTxPowerLevelsCharacteristic.readValue().then(value => {
      value = value.buffer ? value : new DataView(value);
      setValue('lowest', value.getInt8(0));
      setValue('low', value.getInt8(1));
      setValue('medium', value.getInt8(2));
      setValue('high', value.getInt8(3));
    })
  })
  .catch(e => { 
    var data = {message: 'Error: ' + e, timeout: 5e3 };
    $('#snackbar').MaterialSnackbar.showSnackbar(data);
  });
}

function setValue(inputId, value) {
  var element = $('#' + inputId);
  element.oninput = function(event) {
    event.target.classList.toggle('edited', (event.target.defaultValue !== event.target.value));
  }
  element.defaultValue = value;
  element.classList.remove('edited');
  element.parentElement.MaterialTextfield.change(value);
  element.parentElement.animate([{color: 'initial'}, {color: '#448AFF'}, {color: 'initial'}], 360);
}

function setLock(locked) {
  if (locked) {
    $('#lock').parentElement.MaterialCheckbox.check();
    $('#lock').parentElement.querySelector('.mdl-checkbox__label').textContent = 'Locked';
  } else {
    $('#lock').parentElement.MaterialCheckbox.uncheck();
    $('#lock').parentElement.querySelector('.mdl-checkbox__label').textContent = 'Unlocked';
  }
}

const URL_SCHEMES = [
  'http://www.',
  'https://www.',
  'http://',
  'https://'
];

const URL_CODES = [
  '.com/',
  '.org/',
  '.edu/',
  '.net/',
  '.info/',
  '.biz/',
  '.gov/',
  '.com',
  '.org',
  '.edu',
  '.net',
  '.info',
  '.biz',
  '.gov'
];

function decodeURL(value) {
  var url = URL_SCHEMES[value.getUint8(0)];
  for (var i = 1; i < value.byteLength; i++) {
    var s = String.fromCharCode(value.getUint8(i));
    url +=
      (value.getUint8(i) < URL_CODES.length)
        ? URL_CODES[value.getUint8(i)]
        : s;
  }
  return(url);
}

function encodeURL(url) {
  let encodedUrl = [];
  let position = 0;
  let encoder = new TextEncoder('utf-8');
  
  for (let i = 0 ; i < URL_SCHEMES.length; i++) {
    if (url.startsWith(URL_SCHEMES[i])) {
      encodedUrl.push(i);      
      position = URL_SCHEMES[i].length;
      break;
    }
  }
  
  while (position < url.length) {
    let initialPosition = position;
    for (let i = 0; i < URL_CODES.length; i++) {
      if (url.startsWith(URL_CODES[i], position)) {
        encodedUrl.push(i);
        position += URL_CODES[i].length;
        break;
      }
    }
    if (initialPosition === position) {
      encodedUrl.push(encoder.encode(url[position])[0]);
      position++;
    }
  }
  return encodedUrl;
}

function getEncodedUrl(string) {
  return new Promise(function(resolve, reject) {
    try {
      var url = new URL(string);
    } catch(e) {
      reject(e);
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      reject('Only http and https URLs can be encoded.');
    }

    var encoded = encodeURL(string);
    if (encoded.length > 18) {
      return getShortUrl(string)
      .then(newString => {
        resolve(encodeURL(newString));
      })
      .catch(e => {
        reject(e);
      })
    } else {
      resolve(encoded);
    }
  });
};

function getShortUrl(url) {
  const apiUrl = 'https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyCswhXTLkWtSysl0ntTIlqsiLVdvfvEc8k';
  var options = {  
    method: 'post',  
    headers: { "Content-type": "application/json" },  
    body: JSON.stringify({longUrl: url})
  };
  
  return fetch(apiUrl, options)
  .then(function(response) {
    if (response.status === 200) {
      return response.json();
    } else {
      return Promise.reject(new Error(response.statusText));
    }
  })  
  .then(data => data.id)
}

function getLongUrl(url) {
  var apiUrl = 'https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyCswhXTLkWtSysl0ntTIlqsiLVdvfvEc8k&shortUrl=' + url;

  return fetch(apiUrl)
  .then(function(response) {
    if (response.status === 200) {
      return response.json();
    } else {
      return Promise.reject(new Error(response.statusText));
    }
  })
  .then(data => {
    if (data.status === 'OK') {
      return data.longUrl;
    } else {
      return Promise.reject(new Error(data.status));
    }
  });
}
