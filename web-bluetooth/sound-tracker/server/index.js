var Nascent = require('nascent');
var mic = Nascent.getModule('Microphone');

var util = require('util');
var eddystone = require('eddystone-beacon');
var bleno = require('eddystone-beacon/node_modules/bleno');

DEVICE_NAME = 'Sound Tracker';

process.env['BLENO_DEVICE_NAME'] = DEVICE_NAME;

var recording;
var threshold = 100000;
var minTimeGap = 600; // 600ms
var lastSound;

function SoundCharacteristic() {
  var self = this;

  self.init = function() {
    SoundCharacteristic.super_.call(self, {
      uuid: 'ec01',
      properties: ['notify']
    });
  };

  self.onSubscribe = function(maxSize, updateValueCallback) {
    recording = mic.startRecording();
    recording.on('data', function(data) {
      var now = Date.now();
      var sum = 0;
      for (var a=0; a<data.length; a+=2) {
        sum += Math.abs(data.readInt16LE(a));
      }
      if (sum < threshold) {
        return;
      }
      if (!lastSound || now - lastSound > minTimeGap) {
        var data = new Buffer(4);
        data.writeUInt32LE(sum, 0);
        updateValueCallback(data);
        lastSound = now;
      }
    });
  };

  self.onUnsubscribe = function() {
    recording.end();
    recording = null;
  };

  self.init();
}

util.inherits(SoundCharacteristic, bleno.Characteristic);

function ThresholdCharacteristic() {
  var self = this;

  self.init = function() {
    ThresholdCharacteristic.super_.call(self, {
      uuid: 'ec02',
      properties: ['read', 'write']
    });
  };

  self.onReadRequest = function(offset, callback) {
    var data = new Buffer(4);
    data.writeUInt32LE(threshold, 0);
    callback(self.RESULT_SUCCESS, data);
  };

  self.onWriteRequest = function(data, offset, withoutResponse, callback) {
    threshold = data.readUInt32LE(0);
    console.log(threshold);
    callback(self.RESULT_SUCCESS);
  };

  self.init();
}

util.inherits(ThresholdCharacteristic, bleno.Characteristic);

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
          new SoundCharacteristic(),
          new ThresholdCharacteristic()
        ]
      })
    ]);
  }
});

function startBeacon() {
  console.log("Starting beacon.");
  eddystone.advertiseUrl('https://goo.gl/1Byspv', {name: DEVICE_NAME});
}

bleno.on('accept', function(address) {
  console.log("Accepting connection. Stopping beacon.");
  eddystone.stop();
});

bleno.on('disconnect', function(address) {
  console.log("Client disconnected ...");
  recording.end();
  recording = null;
  startBeacon();
})

process.on('SIGINT', function() {
  if (recording) {
    console.log('recording.end()');
    recording.end();
    setTimeout(function() {
      process.exit(0);
    }, 1000);
   }
});
