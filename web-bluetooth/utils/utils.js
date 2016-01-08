BluetoothGATTCharacteristic.prototype.getFloat32Value = function(byteOffset, littleEndian = true) {
  var data = new DataView(this.value);
  return data.getFloat32(byteOffset, littleEndian);
};

BluetoothGATTCharacteristic.prototype.getFloat64Value = function(byteOffset, littleEndian = true) {
  var data = new DataView(this.value);
  return data.getFloat64(byteOffset, littleEndian);
};

BluetoothGATTCharacteristic.prototype.getInt16Value = function(byteOffset, littleEndian = true) {
  var data = new DataView(this.value);
  return data.getInt16(byteOffset, littleEndian);
};

BluetoothGATTCharacteristic.prototype.getInt32Value = function(byteOffset, littleEndian = true) {
  var data = new DataView(this.value);
  return data.getInt32(byteOffset, littleEndian);
};

BluetoothGATTCharacteristic.prototype.getInt8Value = function(byteOffset) {
  var data = new DataView(this.value);
  return data.getInt8(byteOffset);
};

BluetoothGATTCharacteristic.prototype.getStringValue = function(utfLabel = 'utf8') {
  var data = new DataView(this.value);
  var decoder = new TextDecoder(utfLabel);
  return decoder.decode(data);
};

BluetoothGATTCharacteristic.prototype.getUint16Value = function(byteOffset, littleEndian = true) {
  var data = new DataView(this.value);
  return data.getUint16(byteOffset, littleEndian);
};

BluetoothGATTCharacteristic.prototype.getUint32Value = function(byteOffset, littleEndian = true) {
  var data = new DataView(this.value);
  return data.getUint32(byteOffset, littleEndian);
};

BluetoothGATTCharacteristic.prototype.getUint8Value = function(byteOffset) {
  var data = new DataView(this.value);
  return data.getUint8(byteOffset);
};
