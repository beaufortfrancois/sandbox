function go() {

  var options = {
    filters: [{
      services: ["0000180f-0000-1000-8000-00805f9b34fb"],
    }]
  };

  alert('start');
  navigator.bluetooth.requestDevice(options)
  .then(function(device) { return device.gatt.connect()})
  .then(function(server) { return server.getPrimaryService("0000180f-0000-1000-8000-00805f9b34fb")})
  .then(function(service) { return service.getCharacteristic("00002a19-0000-1000-8000-00805f9b34fb")})
  .then(function(c) { return c.readValue()})
  .then(function(value) {
    var a = new DataView(value);
    alert(a.getUint8(0));
  });
}
window.addEventListener('load', function () {
  alert('load');
  document.querySelector("#go").addEventListener('click', go)
});
