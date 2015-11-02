var maxHeartRate = null;
var minHeartRate = null;

document.querySelector('#connect').addEventListener('click', function() {
  document.querySelector('#device').textContent = '';
  document.querySelector('#heartRate').textContent = '';
  document.querySelector('#bodySensorLocation').textContent = '';
  heartRateSensor.connect()
  .then(() => {
    console.log(heartRateSensor.device);
    document.querySelector('#device').textContent = heartRateSensor.device.instanceID;
    return Promise.all([
      heartRateSensor.getBodySensorLocation().then(handleBodySensorLocation),
      heartRateSensor.startNotificationsHeartRateMeasurement().then(handleNotificationsHeartRateMeasurement),
    ]);
  })
  .catch(error => {
    console.error('Argh!', error);
  });
});

function handleNotificationsHeartRateMeasurement(heartRateMeasurement) {
  heartRateMeasurement.addEventListener('characteristicvaluechanged', function(heartRate) {
    var heartRate = heartRateSensor.parseHeartRate(event.target.value);
    document.querySelector('#heartRate').textContent = JSON.stringify(heartRate, null, 2);
    if (maxHeartRate === null) {
      maxHeartRate = heartRate.heartRate;
    } else {
      maxHeartRate = Math.max(maxHeartRate, heartRate.heartRate);
    }
    document.querySelector('#maxHeartRate').textContent = 'Max ' + maxHeartRate + ' BPM';
    if (minHeartRate === null) {
      minHeartRate = heartRate.heartRate;
    } else {
      minHeartRate = Math.min(minHeartRate, heartRate.heartRate);
    }
    document.querySelector('#minHeartRate').textContent = 'Min ' + minHeartRate + ' BPM';
  });
}

function handleBodySensorLocation(bodySensorLocation) {
  document.querySelector('#bodySensorLocation').textContent = 'Body sensor is placed on the ' + bodySensorLocation + '.';
}
