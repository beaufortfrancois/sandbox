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
  var user = users[currentClientAddress];
  var toto = function(index) {
    setTimeout(function() {
      
      ledbar.setLed(index, user.r, user.g, user.b, 0.05);
      if (index + 1 < numLeds) {
        ledbar.setLed(index + 1, 0, 0, 0, 0.05);
      }
      if (index >= numMessages) {
        toto(--index);
      } else {
        updateLeds();
      }
    }, 50);
  };
  toto(numLeds-1);
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

function UserInfoCharacteristic() {
  var self = this;

  self.init = function() {
    UserInfoCharacteristic.super_.call(self, {
      uuid: 'ec01',
      properties: ['read', 'write']
    });
  };

  self.onReadRequest = function(offset, callback) {
     var user = users[currentClientAddress];
     var data = new Buffer([user.r, user.g, user.b]);
     callback(self.RESULT_SUCCESS, data);
  };

  self.onWriteRequest = function(data, offset, withoutResponse, callback) {
    if (data.length == 3) {
      users[currentClientAddress].r = data.readUInt8(0);
      users[currentClientAddress].g = data.readUInt8(1);
      users[currentClientAddress].b = data.readUInt8(2);
      updateLeds();
      callback(this.RESULT_SUCCESS);
    } else {
      callback(this.RESULT_ERROR);
    }
    console.log(users[currentClientAddress]);
  };
 
  self.init();
}

util.inherits(UserInfoCharacteristic, bleno.Characteristic);

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
      updateLeds();
      callback(self.RESULT_SUCCESS, new Buffer(text));
    } else {
      console.log('error');
      callback(self.RESULT_SUCCESS, new Buffer(''));
    }
  };

  self.onWriteRequest = function(data, offset, withoutResponse, callback) {
    var message = {};
    message[currentClientAddress] = data.toString();
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
           new UserInfoCharacteristic(),
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

bleno.on('advertisingStop', function(err) {
  console.log('advertisingStop');
});

var currentClientAddress = null;
var users = {};
var messages = [];

bleno.on('accept', function(clientAddress) {
  console.log('connected - ' + clientAddress);
  currentClientAddress = clientAddress;
  if (!users[currentClientAddress]) {
    var id = Object.keys(users).length;
    users[currentClientAddress] = {
      'id': id, 
      'r': 255,
      'g': 255,
      'b': 255,
    };
    console.log(users);
  }
});

bleno.on('disconnect', function(clientAddress) {
  console.log('disconnected - ' + clientAddress);
  currentClientAddress = null;
});
