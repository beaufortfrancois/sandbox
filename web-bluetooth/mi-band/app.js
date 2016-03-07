var canvas = document.querySelector('canvas');
var statusText = document.querySelector('#statusText');
var subStatusText = document.querySelector('#subStatusText');

var offset = 0;

statusText.addEventListener('click', function() {
  statusText.textContent = 'Walk...';
  miBand.connect()
  .then(() => {
    let reset = (localStorage.length === 0);
    return miBand.pair(reset);
  })
  .then(() => miBand.getSteps())
  .then(steps => {
    var today = new Date().toJSON().substr(0, 10);
    offset = steps - parseInt(localStorage.getItem(today) || 0);
    updateSteps(steps);
    return Promise.resolve();
  })
  .then(() => miBand.startNotificationsSteps().then(handleSteps))
  .catch(error => {
    statusText.textContent = error;
  });
});

function handleSteps(stepsCharacteristic) {
  stepsCharacteristic.addEventListener('characteristicvaluechanged', event => {
    var data = event.target.value;
    var steps = miBand.parseSteps(data);

    var today = new Date().toJSON().substr(0, 10);
    localStorage.setItem(today, steps - offset);

    updateSteps(steps);
    updateStats();
  });
}

function updateSteps(steps) {
  var player = statusText.animate([
    { transform: 'scale(1)', opacity: 1 },
    { transform: 'scale(.8)', opacity: .2 }
  ], { duration: 120, easing: 'ease-out'});
  player.onfinish = function(e) {
    statusText.innerHTML =  steps + ' &#x1f463';
    statusText.animate([
      { transform: 'scale(.8)', opacity: .2 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: 120, easing: 'ease-in'});
  };
}

function updateStats() {
  var stats = '';
  Object.keys(localStorage).reverse().forEach(key => {
    var day = new Date(key).toDateString().slice(0, -5);
    stats += '<div class="date">' + day + '</div>' +
        '<div class="steps">' + localStorage.getItem(key) + '</div>';
  });
  subStatusText.innerHTML = stats;
}

updateStats();
