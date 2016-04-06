var $ = document.querySelector.bind(document);

function generateCode(options) {
  var classDeviceName = options.classDeviceName;
  var instanceDeviceName = options.instanceDeviceName;
  var advertisedServices = options.advertisedServices;
  var advertisedDeviceName = options.advertisedDeviceName;
  var advertisedDeviceNamePrefix = options.advertisedDeviceNamePrefix;

  var filterOptions = {filters: [{}]};
  if (advertisedDeviceName) {
    filterOptions.filters[0].name = advertisedDeviceName;
  }
  if (advertisedDeviceNamePrefix) {
    filterOptions.filters[0].namePrefix = advertisedDeviceNamePrefix;
  }
  if (advertisedServices) {
    filterOptions.filters[0].services = Array.of(advertisedServices);
  }

  var characteristicMethods = '';
  if (options.services) {
    filterOptions.optionalServices = options.services.map(service => service.uuid);

    options.services.forEach(service => {
      service.characteristics.forEach(characteristic => {
        let characteristicName = characteristic.name.charAt(0).toUpperCase() + characteristic.name.slice(1);
        if (characteristic.properties.read) {
          characteristicMethods += `
  get${characteristicName}() {
    return this.device.gatt.getPrimaryService("${service.uuid}")
    .then(service => service.getCharacteristic("${characteristic.uuid}"))
    .then(characteristic => characteristic.readValue());
  }
`;
        }
        if (characteristic.properties.write) {
          characteristicMethods += `
  set${characteristicName}(data) {
    return this.device.gatt.getPrimaryService("${service.uuid}")
    .then(service => service.getCharacteristic("${characteristic.uuid}"))
    .then(characteristic => characteristic.writeValue(data));
  }
`;
        } 
      });
    });
  }
 
  var mainTemplate = `

class ${classDeviceName} {

  constructor() {
    this.device = null;
  }

  request() {
    let options = ${JSON.stringify(filterOptions)};
    return navigator.bluetooth.requestDevice(options)
    .then(device => {
      this.device = device;
      return device;
    });
  }

  connect() {
    return this.device.gatt.connect();
  }
  ${characteristicMethods}
}

var ${instanceDeviceName} = new ${classDeviceName}();

/* Here's how you can use it...

   document.querySelector('button').addEventListener('click', function() {
     ${instanceDeviceName}.request()
     .then(_ => ${instanceDeviceName}.connect())
     .then(_ => {
       ... 
     })
     .catch(error => { console.log(error) });
  });

*/
`;

  return mainTemplate.trim();
}

function updateCodePreview() {
  
  var instanceDeviceName = $('#deviceName').value;
  var classDeviceName = instanceDeviceName.charAt(0).toUpperCase() + instanceDeviceName.slice(1);
  var advertisedServices = $('#advertisedServices').value.split(',').map(e => e.trim()).filter(e => e.length);
  var advertisedDeviceName = $('#advertisedDeviceName').value;
  var advertisedDeviceNamePrefix = $('#advertisedDeviceNamePrefix').value;

  try {
    advertisedServices.map(str => { 
      if (str.startsWith('0x')) {
        BluetoothUUID.getService(parseInt(str.slice(2), 16));
      } else if (str) {
        BluetoothUUID.getService(str);
      }
    });
    $('#advertisedServices').setCustomValidity('');
  } catch(e) {
    $('#advertisedServices').setCustomValidity(e);
    $('code').innerText = '';
    return;
  }

  $('code').innerText = generateCode({
     classDeviceName: classDeviceName, 
     instanceDeviceName: instanceDeviceName,
     advertisedServices: advertisedServices,
     advertisedDeviceName: advertisedDeviceName,
     advertisedDeviceNamePrefix: advertisedDeviceNamePrefix,
     services: [
       {
         uuid: $('#characteristic1Service').value,
         characteristics: [
           {
             uuid: $('#characteristic1').value,
             name: $('#characteristic1Name').value,
             properties: {
               read: $('#characteristic1Read').checked,
               write: $('#characteristic1Write').checked, 
               notify: $('#characteristic1Notify').checked, 
             }
           }
         ]
       },
     ]
  });
  hljs.highlightBlock($('code'));
}

$('#deviceName').addEventListener('input', updateCodePreview);
$('#advertisedDeviceName').addEventListener('input', updateCodePreview);
$('#advertisedDeviceNamePrefix').addEventListener('input', updateCodePreview);
$('#advertisedServices').addEventListener('input', updateCodePreview);
$('#characteristic1Name').addEventListener('input', updateCodePreview);
$('#characteristic1Service').addEventListener('input', updateCodePreview);
$('#characteristic1').addEventListener('input', updateCodePreview);
$('#characteristic1Read').addEventListener('change', updateCodePreview);
$('#characteristic1Write').addEventListener('change', updateCodePreview);
$('#characteristic1Notify').addEventListener('change', updateCodePreview);


function setValue(inputId, value) {
  $('#' + inputId).value = value;
}

function setCheck(inputId, value) {
  $('#' + inputId).checked = value;
}

setValue('deviceName', 'myBluetoothDevice');
setValue('advertisedDeviceName', ' ');
setValue('advertisedServices', 'battery_service');
setValue('characteristic1Name', 'serialNumber');
setValue('characteristic1Service', 'device_information');
setValue('characteristic1', 'serial_number_string');
setCheck('characteristic1Read', true);
setCheck('characteristic1Write', true);
setCheck('characteristic1Notify', false);

updateCodePreview();
