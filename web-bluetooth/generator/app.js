'use strict';

var $ = document.querySelector.bind(document);

function generateCode(options) {
  var classDeviceName = options.classDeviceName;
  var instanceDeviceName = options.instanceDeviceName;
  var advertisedServices = options.advertisedServices;
  var advertisedDeviceName = options.advertisedDeviceName;
  var advertisedDeviceNamePrefix = options.advertisedDeviceNamePrefix;

  function formatUUID(string) {
    if (string.startsWith('0x')) {
      return string;
    } else {
      return '"' + string + '"';
    }
  }

  var filterOptions = '"filters": [{\n';
  if (advertisedDeviceName) {
    filterOptions += '        "name": "' + advertisedDeviceName + '"';
  }
  if (advertisedDeviceNamePrefix) {
    if (filterOptions.length == 0) {
      filterOptions = '"filters": [{\n';
    }
    if (advertisedDeviceName) {
      filterOptions += ',\n';
    }
    filterOptions += '        "namePrefix": "' + advertisedDeviceNamePrefix + '"';
  }
  if (advertisedServices.length) {
    if (filterOptions.length == 0) {
      filterOptions = '"filters": [{\n';
    }
    if (advertisedDeviceName || advertisedDeviceNamePrefix) {
      filterOptions += ',\n';
    }
    filterOptions += '        "services": [';
    Array.from(advertisedServices).forEach((service, index) => {
      if (index >0) {
        filterOptions += ', ';
      }
      filterOptions += formatUUID(service);
    });
    filterOptions += ']';
  }
  filterOptions += '\n      }]';

  var characteristicMethods = '';
  var optionalServicesOptions = '';
  if (options.characteristicUuid && options.characteristicName && options.characteristicServiceUuid &&
       (options.characteristicRead || options.characteristicWrite || options.characteristicNotify)) {

    if (!Array.from(advertisedServices).includes(options.characteristicServiceUuid)) {
      optionalServicesOptions = ',\n      "optionalServices": [';
      optionalServicesOptions += formatUUID(options.characteristicServiceUuid);
      optionalServicesOptions += ']';
    }

    let characteristicName = options.characteristicName.charAt(0).toUpperCase() + options.characteristicName.slice(1);
    if (options.characteristicRead) {
      if (options.asyncAwait) {
        characteristicMethods += `
  async read${characteristicName}() {
    const service = await this.device.gatt.getPrimaryService(${formatUUID(options.characteristicServiceUuid)});
    const characteristic = await service.getCharacteristic(${formatUUID(options.characteristicUuid)});
    await characteristic.readValue();
  }
`;
      } else {
        characteristicMethods += `
  read${characteristicName}() {
    return this.device.gatt.getPrimaryService(${formatUUID(options.characteristicServiceUuid)})
    .then(service => service.getCharacteristic(${formatUUID(options.characteristicUuid)}))
    .then(characteristic => characteristic.readValue());
  }
`;
      }
    }
    if (options.characteristicWrite) {
      if (options.asyncAwait) {
        characteristicMethods += `
  async write${characteristicName}(data) {
    const service = await this.device.gatt.getPrimaryService(${formatUUID(options.characteristicServiceUuid)});
    const characteristic = await service.getCharacteristic(${formatUUID(options.characteristicUuid)});
    await characteristic.writeValue(data);
  }
`;
      } else {
        characteristicMethods += `
  write${characteristicName}(data) {
    return this.device.gatt.getPrimaryService(${formatUUID(options.characteristicServiceUuid)})
    .then(service => service.getCharacteristic(${formatUUID(options.characteristicUuid)}))
    .then(characteristic => characteristic.writeValue(data));
  }
`;
      }
    }
    if (options.characteristicNotify) {
      if (options.asyncAwait) {
        characteristicMethods += `
  async start${characteristicName}Notifications(listener) {
    const service = await this.device.gatt.getPrimaryService(${formatUUID(options.characteristicServiceUuid)});
    const characteristic = await service.getCharacteristic(${formatUUID(options.characteristicUuid)}));
    await characteristic.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged', listener);
  }

  async stop${characteristicName}Notifications(listener) {
    const service = await this.device.gatt.getPrimaryService(${formatUUID(options.characteristicServiceUuid)});
    const characteristic = await service.getCharacteristic(${formatUUID(options.characteristicUuid)}));
    await characteristic.stopNotifications();
    characteristic.removeEventListener('characteristicvaluechanged', listener);
  }
`;
      } else {
      characteristicMethods += `
  start${characteristicName}Notifications(listener) {
    return this.device.gatt.getPrimaryService(${formatUUID(options.characteristicServiceUuid)})
    .then(service => service.getCharacteristic(${formatUUID(options.characteristicUuid)}))
    .then(characteristic => characteristic.startNotifications())
    .then(characteristic => characteristic.addEventListener('characteristicvaluechanged', listener));
  }

  stop${characteristicName}Notifications(listener) {
    return this.device.gatt.getPrimaryService(${formatUUID(options.characteristicServiceUuid)})
    .then(service => service.getCharacteristic(${formatUUID(options.characteristicUuid)}))
    .then(characteristic => characteristic.stopNotifications())
    .then(characteristic => characteristic.removeEventListener('characteristicvaluechanged', listener));
  }
`;
      }
    }
  }

  if (options.asyncAwait) {
    var requestMethod = `
  async request() {
    let options = {
      ${filterOptions}${optionalServicesOptions}
    };
    this.device = await navigator.bluetooth.requestDevice(options);
    if (!this.device) {
      throw "No device selected";
    }
    this.device.addEventListener('gattserverdisconnected', this.onDisconnected);
  }`;
  } else {
    var requestMethod = `
  request() {
    let options = {
      ${filterOptions}${optionalServicesOptions}
    };
    return navigator.bluetooth.requestDevice(options)
    .then(device => {
      this.device = device;
      this.device.addEventListener('gattserverdisconnected', this.onDisconnected);
    });
  }`;
  }

  if (options.asyncAwait) {
    var connectMethod = `
  async connect() {
    if (!this.device) {
      return Promise.reject('Device is not connected.');
    }
    await this.device.gatt.connect();
  }`;
  } else {
    var connectMethod = `
  connect() {
    if (!this.device) {
      return Promise.reject('Device is not connected.');
    }
    return this.device.gatt.connect();
  }`;
  }

  if (options.asyncAwait) {
    var onClick = `
document.querySelector('button').addEventListener('click', async event => {
  try {
    await ${instanceDeviceName}.request();
    await ${instanceDeviceName}.connect();
    /* Do something with ${instanceDeviceName}... */
  } catch(error) {
    console.log(error);
  }
});
`;
  } else {
    var onClick = `
document.querySelector('button').addEventListener('click', event => {
  ${instanceDeviceName}.request()
  .then(_ => ${instanceDeviceName}.connect())
  .then(_ => { /* Do something with ${instanceDeviceName}... */})
  .catch(error => { console.log(error) });
});
`;
  }

  var mainTemplate = `

class ${classDeviceName} {

  constructor() {
    this.device = null;
    this.onDisconnected = this.onDisconnected.bind(this);
  }
  ${requestMethod}
  ${connectMethod}
  ${characteristicMethods}
  disconnect() {
    if (!this.device) {
      return Promise.reject('Device is not connected.');
    }
    return this.device.gatt.disconnect();
  }

  onDisconnected() {
    console.log('Device is disconnected.');
  }
}

var ${instanceDeviceName} = new ${classDeviceName}();
${onClick}
`;

  return mainTemplate.trim();
}

function updateCodePreview() {

  var instanceDeviceName = $('#deviceName').value.replace(/[^a-zA-Z]/g, '');
  instanceDeviceName = instanceDeviceName.charAt(0).toLowerCase() + instanceDeviceName.slice(1);
  var classDeviceName = instanceDeviceName.charAt(0).toUpperCase() + instanceDeviceName.slice(1);
  var advertisedServices = $('#advertisedServices').value.split(',').map(e => e.trim()).filter(e => e.length);
  var advertisedDeviceName = $('#advertisedDeviceName').value;
  var advertisedDeviceNamePrefix = $('#advertisedDeviceNamePrefix').value;
  var characteristicName = $('#characteristicName').value.replace(/[^a-zA-Z]/g, '');

  try {
    advertisedServices.map(str => {
      if (str.startsWith('0x') && str.length == 6) {
        BluetoothUUID.getService(parseInt(str.slice(2), 16));
      } else if (str) {
        BluetoothUUID.getService(str);
      }
    });
    $('#advertisedServices').setCustomValidity('');
  } catch(e) {
    $('#advertisedServices').setCustomValidity(e);
    advertisedServices = [];
    return;
  }

  $('code').innerText = generateCode({
     asyncAwait: $('#asyncAwait').checked,
     classDeviceName: classDeviceName,
     instanceDeviceName: instanceDeviceName,
     advertisedServices: advertisedServices,
     advertisedDeviceName: advertisedDeviceName,
     advertisedDeviceNamePrefix: advertisedDeviceNamePrefix,
     characteristicName: characteristicName,
     characteristicUuid: $('#characteristic').value,
     characteristicServiceUuid: $('#characteristicService').value,
     characteristicRead: $('#characteristicRead').checked,
     characteristicWrite: $('#characteristicWrite').checked,
     characteristicNotify: $('#characteristicNotify').checked,
  });
  hljs.highlightBlock($('code'));
}

$('#asyncAwait').addEventListener('change', updateCodePreview);
$('#deviceName').addEventListener('input', updateCodePreview);
$('#advertisedDeviceName').addEventListener('input', updateCodePreview);
$('#advertisedDeviceNamePrefix').addEventListener('input', updateCodePreview);
$('#advertisedServices').addEventListener('input', updateCodePreview);
$('#characteristicName').addEventListener('input', updateCodePreview);
$('#characteristicService').addEventListener('input', updateCodePreview);
$('#characteristic').addEventListener('input', updateCodePreview);
$('#characteristicRead').addEventListener('change', updateCodePreview);
$('#characteristicWrite').addEventListener('change', updateCodePreview);
$('#characteristicNotify').addEventListener('change', updateCodePreview);


function setValue(inputId, value) {
  $('#' + inputId).value = value;
}

function setCheck(inputId, check) {
  if (check) {
    $('#' + inputId).parentElement.MaterialCheckbox.check()
  } else {
    $('#' + inputId).parentElement.MaterialCheckbox.uncheck()
  }
}

var configIndex = 0;

const PLACEHOLDERS = [{
  deviceName: 'Playbulb Candle',
  advertisedDeviceName: 'PLAYBULB Candle',
  characteristicName: 'color',
  characteristicService: '0xFF02',
  characteristic: '0xFFFC',
  characteristicRead: false,
  characteristicWrite: true,
  characteristicNotify: false,
}, {
  deviceName: 'Heart Rate Monitor',
  advertisedServices: 'heart_rate',
  characteristicName: 'heart rate measurement',
  characteristicService: 'heart_rate',
  characteristic: 'heart_rate_measurement',
  characteristicRead: false,
  characteristicWrite: false,
  characteristicNotify: true,
}, {
  deviceName: 'Generic Device',
  advertisedDeviceName: 'foo',
  characteristicName: 'manufacturer name',
  characteristicService: 'device_information',
  characteristic: 'manufacturer_name_string',
  characteristicRead: true,
  characteristicWrite: false,
  characteristicNotify: false,
}];

function setConfig(config) {
  setValue('deviceName',  config.deviceName || '');
  setValue('advertisedDeviceName', config.advertisedDeviceName || '');
  setValue('advertisedDeviceNamePrefix', config.advertisedDeviceNamePrefix || '');
  setValue('advertisedServices', config.advertisedServices || '');
  setValue('characteristicName', config.characteristicName || '');
  setValue('characteristicService', config.characteristicService || '');
  setValue('characteristic',  config.characteristic || '');
  setCheck('characteristicRead', config.characteristicRead || false);
  setCheck('characteristicWrite', config.characteristicWrite || false);
  setCheck('characteristicNotify', config.characteristicNotify || false);

  updateCodePreview();
}

document.querySelector('button').addEventListener('click', function() {
  configIndex++;
  if (configIndex == PLACEHOLDERS.length) {
    configIndex = 0;
  }
  setConfig(PLACEHOLDERS[configIndex]);
});

$('#characteristicNotify').parentElement.addEventListener('mdl-componentupgraded', function(event) {
  setConfig(PLACEHOLDERS[0]);
});
