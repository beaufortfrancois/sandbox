var $ = document.querySelector.bind(document);

function generateCode(options) {
  var classDeviceName = options.classDeviceName;
  var instanceDeviceName = options.instanceDeviceName;
  var advertisedServices = options.advertisedServices;
  var advertisedDeviceName = options.advertisedDeviceName;
  var advertisedDeviceNamePrefix = options.advertisedDeviceNamePrefix;

  var filterOptions = {};
  if (advertisedDeviceName) {
    filterOptions.name = advertisedDeviceName;
  }
  if (advertisedDeviceNamePrefix) {
    filterOptions.namePrefix = advertisedDeviceNamePrefix;
  }
  if (advertisedServices) {
    filterOptions.services = Array.of(advertisedServices);
  }

  var characteristicMethods = '';
  var optionalServices = '';
  if (options.services) {
    optionalServices = 'options.optionalServices = [' + options.services.map(service => service.uuid) + '];\n';

    options.services.forEach(service => {
      service.characteristics.forEach(characteristic => {
        let characteristicName = characteristic.name.charAt(0).toUpperCase() + characteristic.name.slice(1);
        if (characteristic.properties.read) {
          characteristicMethods += `
  get${characteristicName}() {
    return this.device.gatt.getPrimaryService(${service.uuid})
    .then(service => service.getCharacteristic(${characteristic.uuid}))
    .then(characteristic => characteristic.readValue());
  }
`;
        }
        if (characteristic.properties.write) {
          characteristicMethods += `
  set${characteristicName}(data) {
    return this.device.gatt.getPrimaryService(${service.uuid})
    .then(service => service.getCharacteristic(${characteristic.uuid}))
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
    let options = {filters: [${JSON.stringify(filterOptions)}]};
    ${optionalServices}
    return navigator.bluetooth.requestDevice(options)
    .then(device => {
      this.device = device;
      return this.device;
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
  var advertisedServices = $('#advertisedServices').value;
  var advertisedDeviceName = $('#advertisedDeviceName').value;
  var advertisedDeviceNamePrefix = $('#advertisedDeviceNamePrefix').value;
  $('code').innerText = generateCode({
     classDeviceName: classDeviceName, 
     instanceDeviceName: instanceDeviceName,
     advertisedServices: advertisedServices,
     advertisedDeviceName: advertisedDeviceName,
     advertisedDeviceNamePrefix: advertisedDeviceNamePrefix,
     services: [
       {
         uuid: '"battery_service"',
         characteristics: [
           {
             uuid: '"battery_level"',
             name: 'batteryLevel',
             properties: {
               read: true
             }
           }
         ]
       },
       {
         uuid: '"device_information"',
         characteristics: [
           {
             uuid: '"serial_number_string"',
             name: 'serialNumber',
             properties: {
               read: true,
               write: true
             }
           }
         ]
       },
     ]
  });
  hljs.highlightBlock($('code'));
}

document.querySelector('#deviceName').addEventListener('input', updateCodePreview);
document.querySelector('#advertisedDeviceName').addEventListener('input', updateCodePreview);
document.querySelector('#advertisedDeviceNamePrefix').addEventListener('input', updateCodePreview);
document.querySelector('#advertisedServices').addEventListener('input', updateCodePreview);


function setValue(inputId, value) {
  $('#' + inputId).value = value;
}

setValue('deviceName', 'bluetoothDevice');
setValue('advertisedServices', 'battery_service');
updateCodePreview();
