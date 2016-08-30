/* Check out https://www.npmjs.com/package/web-bluetooth-utils as well */

/* BluetoothRemoteGATTCharacteristic helpers */

BluetoothRemoteGATTCharacteristic.prototype.getFloat32Value = function(byteOffset, littleEndian = true) {
  return this.value.getFloat32(byteOffset, littleEndian);
};

BluetoothRemoteGATTCharacteristic.prototype.getFloat64Value = function(byteOffset, littleEndian = true) {
  return this.value.getFloat64(byteOffset, littleEndian);
};

BluetoothRemoteGATTCharacteristic.prototype.getInt16Value = function(byteOffset, littleEndian = true) {
  return this.value.getInt16(byteOffset, littleEndian);
};

BluetoothRemoteGATTCharacteristic.prototype.getInt32Value = function(byteOffset, littleEndian = true) {
  return this.value.getInt32(byteOffset, littleEndian);
};

BluetoothRemoteGATTCharacteristic.prototype.getInt8Value = function(byteOffset) {
  return this.value.getInt8(byteOffset);
};

BluetoothRemoteGATTCharacteristic.prototype.getStringValue = function(encoding = 'utf8') {
  var decoder = new TextDecoder(encoding);
  return decoder.decode(this.value);
};

BluetoothRemoteGATTCharacteristic.prototype.getUint16Value = function(byteOffset, littleEndian = true) {
  return this.value.getUint16(byteOffset, littleEndian);
};

BluetoothRemoteGATTCharacteristic.prototype.getUint32Value = function(byteOffset, littleEndian = true) {
  return this.value.getUint32(byteOffset, littleEndian);
};

BluetoothRemoteGATTCharacteristic.prototype.getUint8Value = function(byteOffset) {
  return this.value.getUint8(byteOffset);
};

/* BluetoothRemoteGATTService helpers */

(function() {

let nativeGetCharacteristics = BluetoothRemoteGATTService.prototype.getCharacteristics;
let getCharacteristics = function(characteristics) {
  if (characteristics instanceof Array) {
    let promises = characteristics.map(characteristic => this.getCharacteristic(characteristic));
    return Promise.all(promises);
  }
  return nativeGetCharacteristics.apply(this, [characteristics]);
}

window.BluetoothRemoteGATTService.prototype.getCharacteristics = getCharacteristics;

})();

