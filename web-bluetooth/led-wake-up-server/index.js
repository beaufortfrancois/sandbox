const DEVICE_NAME = 'Wake Up';
process.env['BLENO_DEVICE_NAME'] = DEVICE_NAME

var Nascent = require('nascent');
var ledbar = Nascent.getModule('LED Bar');

var util = require('util');
var eddystone = require('eddystone-beacon');
var bleno = require('eddystone-beacon/node_modules/bleno');

var wakeUpColor = [0, 255, 0];
var wakeUpTime = null;
var timerInterval = null;

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
      callback(this.RESULT_SUCCESS);
    } else {
      callback(this.RESULT_ERROR);
    }
  };
 
  self.init();
}

util.inherits(WakeUpColorCharacteristic, bleno.Characteristic);

function WakeUpDelayCharacteristic() {
  var self = this;

  self.init = function() {
     WakeUpDelayCharacteristic.super_.call(self, {
       uuid: 'ec02',
       properties: ['read', 'write']
     });
  };

  self.onReadRequest = function(offset, callback) {
    if (wakeUpDelay) {
      callback(self.RESULT_SUCCESS, new Buffer(wakeUpDelay));
    } else {
      callback(self.RESULT_SUCCESS, new Buffer(''));
    }
  };

  self.onWriteRequest = function(data, offset, withoutResponse, callback) {
    wakeUpTime = new Date();
    wakeUpTime.setHours(data.readUInt8(0) + wakeUpTime.getHours());
    wakeUpTime.setMinutes(data.readUInt8(1) + wakeUpTime.getMinutes());
    wakeUpTime.setSeconds(data.readUInt8(2) + wakeUpTime.getSeconds());
    callback(self.RESULT_SUCCESS);
    console.log(wakeUpTime);
    clearInterval(timerInterval);
    timerInterval = setInterval(timer, 1000);
  };
 
  self.init();
}

util.inherits(WakeUpDelayCharacteristic, bleno.Characteristic);

function timer() {
  var now = new Date();
  if (now.getHours() == wakeUpTime.getHours() && 
      now.getMinutes() === wakeUpTime.getMinutes()) {
    ledbar.setAllLeds(wakeUpColor[0], wakeUpColor[1], wakeUpColor[2]);
    clearInterval(timerInterval);
    // TODO: Shutdown after some time...
  }
}

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
  if (!error) {
    bleno.setServices([
      new bleno.PrimaryService({
        uuid: 'ec00',
        characteristics: [
          new WakeUpColorCharacteristic(),
          new WakeUpDelayCharacteristic()
        ]
      })
    ]);
  }
});

function startBeacon() {
  console.log("Starting beacon.");
  eddystone.advertiseUrl('https://goo.gl/bsGHvl', {name: DEVICE_NAME});
}

bleno.on('accept', function(address) {
  console.log("Accepting connection. Stopping beacon.");
  eddystone.stop();
});

bleno.on('disconnect', function(address) {
  console.log("Client disconnected ...");
  startBeacon();
})
