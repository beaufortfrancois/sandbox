var currentColor = [255, 255, 255]; // White by default.

var noEffectSwitch = document.querySelector('#noEffect');
var candleEffectSwitch = document.querySelector('#candleEffect');
var flashingSwitch = document.querySelector('#flashing');
var pulseSwitch = document.querySelector('#pulse');
var rainbowSwitch = document.querySelector('#rainbow');
var rainbowFadeSwitch = document.querySelector('#rainbowFade');

function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}
var img = new Image();
if (window.location.hash.substr(1) === 'cds') {
  img.src = 'chrome-logo.png'
} else {
  img.src = 'color-wheel.png'
}
img.onload = function() {
  var img = this;
  var canvas = document.getElementById('colorPicker');
  var context = canvas.getContext('2d');

  canvas.width = 300 * devicePixelRatio;
  canvas.height = 300 * devicePixelRatio;
  canvas.style.width = "300px";
  canvas.style.height = "300px";

  canvas.addEventListener('click', pickColor);

  function pickColor(evt) {
    var mousePos = getMousePos(canvas, evt);
    var color = 'FFFFFF';

    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    var x = mousePos.x * devicePixelRatio;
    var y = mousePos.y * devicePixelRatio;
    var r = data[((canvas.width * y) + x) * 4];
    var g = data[((canvas.width * y) + x) * 4 + 1];
    var b = data[((canvas.width * y) + x) * 4 + 2];

    currentColor = [r,g,b];
    changeColor();
  };

  context.drawImage(img, 0, 0, canvas.width, canvas.height);
}

function onColorChanged(rgb) {
  if (rgb) {
    console.log('Color changed to ' + rgb);
    currentColor = rgb;
  } else {
    console.log('Color changed');
  }
}

document.querySelector('#requestDevice').addEventListener('click', function() {
  playbulbCandle.requestDevice()
  .then(device => {
    console.log(device);
    document.querySelector('#requestDevice').classList.add('off');
    document.querySelector('canvas').classList.remove('off');
    document.querySelector('#buttons').classList.remove('off');
    document.querySelector('#batteryLevel').classList.remove('off');
    return Promise.all([
      playbulbCandle.getDeviceName().then(handleDeviceName),
      playbulbCandle.getBatteryLevel().then(handleBatteryLevel),
    ]);
  })
  .catch(error => {
    // TODO: Replace with toast when snackbar lands.
    console.error('Argh!', error);
  });
});

function handleDeviceName(deviceName) {
  document.querySelector('#deviceName').disabled = false;
  document.querySelector('#deviceName').value = deviceName;
}

function handleBatteryLevel(batteryLevel) {
  document.querySelector('#batteryLevel').textContent = 'Battery: ' + batteryLevel + '%';
}

document.querySelector('#deviceName').addEventListener('input', function() {
  var deviceName = this.value;
  playbulbCandle.setDeviceName(deviceName)
  .then(() => {
    console.log('Name changed to ' + deviceName);
  });
});

noEffectSwitch.addEventListener('click', changeColor);
candleEffectSwitch.addEventListener('click', changeColor);
flashingSwitch.addEventListener('click', changeColor);
pulseSwitch.addEventListener('click', changeColor);
rainbowSwitch.addEventListener('click', changeColor);
rainbowFadeSwitch.addEventListener('click', changeColor);

function changeColor() {
  var effect = document.querySelector('[name="effectSwitch"]:checked').id;
  if (!effect.startsWith('rainbow')) {
    var r = currentColor[0];
    var g = currentColor[1];
    var b = currentColor[2];
  }
  switch(effect) {
    case 'noEffect':
      playbulbCandle.setColor(r, g, b).then(onColorChanged);
      break;
    case 'candleEffect':
      playbulbCandle.setCandleEffectColor(r, g, b).then(onColorChanged);
      break;
    case 'flashing':
      playbulbCandle.setFlashingColor(r, g, b).then(onColorChanged);
      break;
    case 'pulse':
      playbulbCandle.setPulseColor(r, g, b).then(onColorChanged);
      break;
    case 'rainbow':
      playbulbCandle.setRainbow().then(onColorChanged);
      break;
    case 'rainbowFade':
      playbulbCandle.setRainbowFade().then(onColorChanged);
      break;
  }
}
