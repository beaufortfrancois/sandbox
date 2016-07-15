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
  log("Check out " + fileName + ".html and " + fileName + ".js");

  var classDeviceName = fileName.charAt(0).toUpperCase() + fileName.slice(1);
  var instanceDeviceName = 'my' + classDeviceName;

  var filterOptions = '"filters": [{\r\n';
  if (profiledata.GAPProperties.ServicesAdvertise && profiledata.GAPProperties.ServicesAdvertisement.length) {
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
    fileName: fileName,
    instanceDeviceName: instanceDeviceName,
    classDeviceName: classDeviceName,
    filterOptions: filterOptions,
    optionalServicesOptions: optionalServicesOptions,
    characteristicMethods: characteristicMethods
  };

  var jsOutput = ProcessTemplate(FileManager.ReadFile("template.js"), data);
  FileManager.CreateFile(fileName + ".js", jsOutput);

  var htmlOutput = ProcessTemplate(FileManager.ReadFile("template.html"), data);
  FileManager.CreateFile(fileName + ".html", htmlOutput);

  log("Plugin -- End");
}

function formatUUID(uuid) {
  uuid = uuid.toLowerCase();
  if (uuid.length == 4) {
    return('0x' + uuid);
  } else if (uuid.length == 32) {
    let uuid_components = uuid.match(/(........)(....)(....)(....)(............)/);
    return '"' + uuid_components.slice(1,6).join("-") + '"';
  } else {
    return uuid
  }
}

function isPropertyEnabled(property) {
  return (property == 'Mandatory' || property == 'Optional')
}
