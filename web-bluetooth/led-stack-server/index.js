var Nascent = require('nascent');
var ledbar = Nascent.getModule('LED Bar');

var util = require('util');
var bleno = require('bleno');

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
        ledbar.setLed(index + 1, 0, 0, 0, 0);
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
    //updateLeds();
    callback(self.RESULT_SUCCESS);
    console.log(messages);
  };
 
  self.init();
}

util.inherits(MessagesCharacteristic, bleno.Characteristic);

function MainService() {
   var self = this;
   bleno.PrimaryService.call(this, {
       uuid: 'ec00',
       characteristics: [
           new ColorCharacteristic(),
           new MessagesCharacteristic()
       ]
   });
}

util.inherits(MainService, bleno.PrimaryService);

var mainService = new MainService();

bleno.on('stateChange', function(state) {
  if (state === 'poweredOn') {
    bleno.startAdvertising('LED Stack', [mainService.uuid], function(err) {
      if (err) {
        console.log(err);
      }
    });
  }
  else {
    bleno.stopAdvertising();
  }
});

bleno.on('advertisingStart', function(err) {
  console.log('advertisingStart');
  updateLeds();
  if (!err) {
    bleno.setServices([mainService]);
  }
});

var clientAddress = null;
var users = {};
var messages = [];

const colors = [{"r":242,"g":214,"b":214},{"r":80,"g":5,"b":5},{"r":80,"g":15,"b":15},{"r":81,"g":255,"b":255},{"r":213,"g":175,"b":175},{"r":215,"g":63,"b":63},{"r":11,"g":15,"b":15},{"r":14,"g":95,"b":95},{"r":222,"g":155,"b":155},{"r":78,"g":113,"b":113},{"r":111,"g":240,"b":240},{"r":111,"g":240,"b":240},{"r":254,"g":160,"b":160},{"r":252,"g":64,"b":64},{"r":249,"g":16,"b":16},{"r":243,"g":208,"b":208}];

bleno.on('accept', function(address) {
  console.log('accept ' + address);
  clientAddress = address;
  if (!users[clientAddress]) {
    var color = colors[Math.round(Math.random(colors.length) * colors.length)];
    users[clientAddress] = {'r': color.r, 'g': color.g, 'b': color.b};
  }
  console.log(users);
});

bleno.on('disconnect', function(address) {
  clientAddress = null;
  console.log('disconnect ' + address);
});
