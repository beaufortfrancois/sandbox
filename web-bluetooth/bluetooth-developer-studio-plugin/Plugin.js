function GetInfo(infoObject) {
  infoObject.Name = "Web Bluetooth";
  infoObject.Description = "Generates JavaScript code for Web Bluetooth";
  infoObject.Author = "Francois Beaufort";
  infoObject.Version = "1.0.0";
  infoObject.IsClient = true;
  infoObject.IncludeDefaultServices = false;
  return infoObject;
}

function RunPlugin(profiledata) {

  log("Plugin -- Begin");

  var fileName = profiledata.GAPProperties.DeviceName.replace(/[^a-zA-Z]/g, '');
  log("Output file name is " +fileName + ".js");

  var classDeviceName = fileName.charAt(0).toUpperCase() + fileName.slice(1);
  var instanceDeviceName = 'my' + classDeviceName;

  var filterOptions = '"filters": [{\r\n';
  if (profiledata.GAPProperties.DeviceNameAdvertise || profiledata.GAPProperties.DeviceNameResponse) {
    filterOptions += '        "name": "' + profiledata.GAPProperties.DeviceName + '"';
  }

  if (profiledata.GAPProperties.ServicesAdvertise && profiledata.GAPProperties.ServicesAdvertisement.length) {
    if (filterOptions.length == 0) {
      filterOptions = '"filters": [{\r\n';
    }
    if (profiledata.GAPProperties.DeviceNameAdvertise || profiledata.GAPProperties.DeviceNameResponse) {
      filterOptions += ',\r\n';
    }

    filterOptions += '        "services": [';
    for (var i = 0, services = []; i < profiledata.GAPProperties.ServicesAdvertisement.length; i++) {
      var serviceAdvertisement = profiledata.GAPProperties.ServicesAdvertisement[i];
      if (serviceAdvertisement.Selected) {
        services.push(formatUUID(serviceAdvertisement.UUID));
      }
    }
    filterOptions += services.join(', ') + ']';
  }
  filterOptions += '\r\n      }]';

  var optionalServicesOptions = '';
  if (profiledata.Services.length) {
    optionalServicesOptions = ',\r\n      "optionalServices": [';
  }
  for (var i = 0, services = []; i < profiledata.Services.length; i++) {
    services.push(formatUUID(profiledata.Services[i].UUID));
  }
  optionalServicesOptions += services.join(', ') + ']';

  var characteristicMethods = '';
  for (var i = 0; i < profiledata.Services.length; i++) {
    for (var j = 0; j < profiledata.Services[i].Characteristics.length; j++) {
      var characteristic = profiledata.Services[i].Characteristics[j];
      var characteristicName = characteristic.Name.replace(/[^a-zA-Z]/g, '');
      characteristicName = characteristicName.charAt(0).toUpperCase() + characteristicName.slice(1);
      var serviceUuid = formatUUID(profiledata.Services[i].UUID);
      var characteristicUuid = formatUUID(characteristic.UUID);

      if (characteristic.Properties.length && characteristic.Properties[0].Read) {
        characteristicMethods +=  '\r\n\
  read' + characteristicName + '() {\r\n\
    return this.device.gatt.getPrimaryService(' + serviceUuid + ')\r\n\
    .then(service => service.getCharacteristic(' + characteristicUuid + '))\r\n\
    .then(characteristic => characteristic.readValue());\r\n\
  }\r\n';
      }
      // TODO: Figure out if Reliable Write and Signed Write are needed there...
      if (characteristic.Properties.length &&
          (isPropertyEnabled(characteristic.Properties[0].Write) || isPropertyEnabled(characteristic.Properties[0].WriteWithoutResponse))) {
        characteristicMethods +=  '\r\n\
  write' + characteristicName + '(data) {\r\n\
    return this.device.gatt.getPrimaryService(' + serviceUuid + ')\r\n\
    .then(service => service.getCharacteristic(' + characteristicUuid + '))\r\n\
    .then(characteristic => characteristic.writeValue(data));\r\n\
  }\r\n';
      }

      if (characteristic.Properties.length &&
          (isPropertyEnabled(characteristic.Properties[0].Notify) || isPropertyEnabled(characteristic.Properties[0].Indicate))) {
        characteristicMethods +=  '\r\n\
  start' + characteristicName + 'Notifications(listener) {\r\n\
    return this.device.gatt.getPrimaryService(' + serviceUuid + ')\r\n\
    .then(service => service.getCharacteristic(' + characteristicUuid + '))\r\n\
    .then(characteristic => {\r\n\
      return characteristic.startNotifications()\r\n\
      .then(_ => {\r\n\
        characteristic.addEventListener(\'characteristicvaluechanged\', listener);\r\n\
      });\r\n\
    });\r\n\
  }\r\n\
\r\n\
  stop' + characteristicName + 'Notifications(listener) {\r\n\
    return this.device.gatt.getPrimaryService(' + serviceUuid + ')\r\n\
    .then(service => service.getCharacteristic(' + characteristicUuid + '))\r\n\
    .then(characteristic => {\r\n\
      return characteristic.stopNotifications()\r\n\
      .then(_ => {\r\n\
        characteristic.removeEventListener(\'characteristicvaluechanged\', listener);\r\n\
      });\r\n\
    });\r\n\
  }\r\n';
      }


    }
  }

  var data = {
    instanceDeviceName: instanceDeviceName,
    classDeviceName: classDeviceName,
    filterOptions: filterOptions,
    optionalServicesOptions: optionalServicesOptions,
    characteristicMethods: characteristicMethods
  };

  var template = FileManager.ReadFile("template.js");
  var output = ProcessTemplate(template, data);

  FileManager.CreateFile(fileName + ".js",  output);

  log("Plugin -- End");

}

function formatUUID(uuid) {
  if (uuid.length == 4) {
    return('0x' + uuid);
  } else {
    return uuid
  }
}

function isPropertyEnabled(property) {
  return (property == 'Mandatory' || property == 'Optional')
}
