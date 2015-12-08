const DEVICE_NAME = 'LED Stack';
process.env['BLENO_DEVICE_NAME'] = DEVICE_NAME

var Nascent = require('nascent');
var ledbar = Nascent.getModule('LED Bar');

var util = require('util');
var eddystone = require('eddystone-beacon');
var bleno = require('eddystone-beacon/node_modules/bleno');

function dropLed() {
  var numLeds = ledbar.getNumLeds();
  var numMessages = messages.length;
  if (numMessages == numLeds) {
    return;
  }
  var user = users[clientAddress];
  var updateLed = function(index) {
    setTimeout(function() {
      ledbar.setLed(index, user.r, user.g, user.b, 0);
      if (index + 1 < numLeds) {
        ledbar.setLed(index + 1, 0, 0, 0, .05);
      }
      if (index >= numMessages) {
        updateLed(--index);
      } else {
        updateLeds();
      }
    }, 16);
  };
  updateLed(numLeds-1);
}

function readLed() {
  var numLeds = ledbar.getNumLeds();
  var numMessages = messages.length;
  if (numMessages < numLeds) {
    ledbar.setLed(numMessages, 0, 0, 0, 0.2);
  }
}

function updateLeds() {
  var index = 0;
  for (var i = 0; i < ledbar.getNumLeds(); i++) {
    if (index >= messages.length) {
      ledbar.setLed(i, 0, 0, 0, 0);
    }
    else {
      var user = users[Object.keys(messages[index])];
      ledbar.setLed(i, user.r, user.g, user.b, 0.1);
    }
    index++;
  }
}

function ColorCharacteristic() {
  var self = this;

  self.init = function() {
    ColorCharacteristic.super_.call(self, {
      uuid: 'ec01',
      properties: ['read', 'write']
    });
  };

  self.onReadRequest = function(offset, callback) {
     var user = users[clientAddress];
     var data = new Buffer([user.r, user.g, user.b]);
     callback(self.RESULT_SUCCESS, data);
  };

  self.onWriteRequest = function(data, offset, withoutResponse, callback) {
    if (data.length == 3) {
      users[clientAddress].r = data.readUInt8(0);
      users[clientAddress].g = data.readUInt8(1);
      users[clientAddress].b = data.readUInt8(2);
      updateLeds();
      callback(this.RESULT_SUCCESS);
    } else {
      callback(this.RESULT_ERROR);
    }
  };
 
  self.init();
}

util.inherits(ColorCharacteristic, bleno.Characteristic);

function MessagesCharacteristic() {
  var self = this;

  self.init = function() {
     MessagesCharacteristic.super_.call(self, {
       uuid: 'ec02',
       properties: ['read', 'write']
     });
  };

  self.onReadRequest = function(offset, callback) {
    console.log('MessagesCharacteristic.onReadRequest');
    var message = messages.pop();
    console.log(message);
    if (message) {
      var text = message[Object.keys(message)];
      console.log(text);
      readLed();
      callback(self.RESULT_SUCCESS, new Buffer(text));
    } else {
      console.log('error');
      callback(self.RESULT_SUCCESS, new Buffer(''));
    }
  };

  self.onWriteRequest = function(data, offset, withoutResponse, callback) {
    var message = {};
    message[clientAddress] = data.toString();
    messages.push(message);
    dropLed();
    callback(self.RESULT_SUCCESS);
    console.log(messages);
  };
 
  self.init();
}

util.inherits(MessagesCharacteristic, bleno.Characteristic);

var clientAddress = null;
var users = {};
var messages = [];

const colors = ['#f44336', '#9C27B0', '#3F51B5', '#009688', '#FFEB3B', '#9E9E9E'];

bleno.on('stateChange', function(state) {
  console.log('stateChange: ' + state);

  if (state === 'poweredOn') {
    bleno.startAdvertising(DEVICE_NAME, ['ec00']);
    startBeacon();
  } else {
    bleno.stopAdvertising();
  }
});

bleno.on('advertisingStart', function(error) {
  console.log('advertisingStart: ' + (error ? 'error ' + error : 'success'));
  updateLeds();

  if (!error) {
    bleno.setServices([
      new bleno.PrimaryService({
        uuid: 'ec00',
        characteristics: [
          new ColorCharacteristic(),
          new MessagesCharacteristic()
        ]
      })
    ]);
  }
});

function startBeacon() {
  console.log("Starting beacon.");
  eddystone.advertiseUrl('https://goo.gl/fkD0WM', {name: DEVICE_NAME});
}

bleno.on('accept', function(address) {
  console.log("Accepting connection. Stopping beacon.");
  eddystone.stop();

  clientAddress = address;
  if (!users[clientAddress]) {
    var color = colors[Math.round(Math.random(colors.length) * colors.length)];
    var r = parseInt(color.substr(1, 2), 16);
    var g = parseInt(color.substr(3, 2), 16);
    var b = parseInt(color.substr(5, 2), 16);
    users[clientAddress] = {'r': r, 'g': g, 'b': b};
  }
});

bleno.on('disconnect', function(address) {
  clientAddress = null;
  console.log("Client disconnected ...");
  startBeacon();
})
