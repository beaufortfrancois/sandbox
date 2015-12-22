var Nascent = require('nascent');
var ledbar = Nascent.getModule('LED Bar');

var util = require('util');
var eddystone = require('eddystone-beacon');
var bleno = require('eddystone-beacon/node_modules/bleno');
var StringDecoder = require('string_decoder').StringDecoder;

var utils = require('./utils.js');

var wakeUpColor = utils.getDefaultColor();
var wakeUpTime = null;
var timerInterval = null;
var shutdownTimeout = null;

process.env['BLENO_DEVICE_NAME'] = utils.DEVICE_NAME;

function WakeUpColorCharacteristic() {
  var self = this;

  self.init = function() {
    WakeUpColorCharacteristic.super_.call(self, {
      uuid: 'ec01',
      properties: ['read', 'write']
    });
  };

  self.onReadRequest = function(offset, callback) {
    var data = new Buffer(wakeUpColor);
    callback(self.RESULT_SUCCESS, data);
  };

  self.onWriteRequest = function(data, offset, withoutResponse, callback) {
    if (data.length == 3) {
      wakeUpColor[0] = data.readUInt8(0);
      wakeUpColor[1] = data.readUInt8(1);
      wakeUpColor[2] = data.readUInt8(2);
      confirmActionToUser();
      callback(self.RESULT_SUCCESS);
    } else {
      callback(self.RESULT_ERROR);
    }
  };
 
  self.init();
}

util.inherits(WakeUpColorCharacteristic, bleno.Characteristic);

function WakeUpTimeCharacteristic() {
  var self = this;

  self.init = function() {
    WakeUpTimeCharacteristic.super_.call(self, {
      uuid: 'ec02',
      properties: ['read', 'write']
    });
  };

  self.onReadRequest = function(offset, callback) {
    if (wakeUpTime) {
      callback(self.RESULT_SUCCESS, new Buffer('' + wakeUpTime.getTime() / 1000));
    } else {
      callback(self.RESULT_SUCCESS, new Buffer(''));
    }
  };

  self.onWriteRequest = function(data, offset, withoutResponse, callback) {
    var decoder = new StringDecoder('utf-8');
    wakeUpTime = new Date(parseInt(decoder.write(data)) * 1000);
    callback(self.RESULT_SUCCESS);
    confirmActionToUser();
    clearInterval(timerInterval);
    clearTimeout(shutdownTimeout);
    timerInterval = setInterval(timer, 1000);
  };
 
  self.init();
}

util.inherits(WakeUpTimeCharacteristic, bleno.Characteristic);

function confirmActionToUser() {
  // Show user-defined color for 500ms.
  ledbar.setAllLeds(wakeUpColor[0], wakeUpColor[1], wakeUpColor[2]);
  setTimeout(function() {
    ledbar.turnOffLeds();
  }, 500);
}

function shutdown() {
  ledbar.turnOffLeds();
  clearTimeout(shutdownTimeout);
}

function timer() {
  var now = new Date();
  if (now.getHours() == wakeUpTime.getHours() && 
      now.getMinutes() === wakeUpTime.getMinutes()) {
    ledbar.setAllLeds(wakeUpColor[0], wakeUpColor[1], wakeUpColor[2]);
    shutdownTimeout = setTimeout(shutdown, 1e3 * 60 * 5); // 5min
  }
}

bleno.on('stateChange', function(state) {
  console.log('stateChange: ' + state);

  if (state === 'poweredOn') {
    bleno.startAdvertising(utils.DEVICE_NAME, ['ec00']);
    startBeacon();
  } else {
    bleno.stopAdvertising();
  }
});

bleno.on('advertisingStart', function(error) {
  console.log('advertisingStart: ' + (error ? 'error ' + error : 'success'));
  if (!error) {
    bleno.setServices([
      new bleno.PrimaryService({
        uuid: 'ec00',
        characteristics: [
          new WakeUpColorCharacteristic(),
          new WakeUpTimeCharacteristic()
        ]
      })
    ]);
  }
});

function startBeacon() {
  console.log("Starting beacon.");
  eddystone.advertiseUrl('https://goo.gl/BnZY2y', {name: utils.DEVICE_NAME});
}

bleno.on('accept', function(address) {
  console.log("Accepting connection. Stopping beacon.");
  eddystone.stop();
});

bleno.on('disconnect', function(address) {
  console.log("Client disconnected ...");
  startBeacon();
})
