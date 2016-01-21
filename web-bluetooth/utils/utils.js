BluetoothGATTCharacteristic.prototype.getFloat32Value = function(byteOffset, littleEndian = true) {
  return this.value.getFloat32(byteOffset, littleEndian);
};

BluetoothGATTCharacteristic.prototype.getFloat64Value = function(byteOffset, littleEndian = true) {
  return this.value.getFloat64(byteOffset, littleEndian);
};

BluetoothGATTCharacteristic.prototype.getInt16Value = function(byteOffset, littleEndian = true) {
  return this.value.getInt16(byteOffset, littleEndian);
};

BluetoothGATTCharacteristic.prototype.getInt32Value = function(byteOffset, littleEndian = true) {
  return this.value.getInt32(byteOffset, littleEndian);
};

BluetoothGATTCharacteristic.prototype.getInt8Value = function(byteOffset) {
  return this.value.getInt8(byteOffset);
};

BluetoothGATTCharacteristic.prototype.getStringValue = function(utfLabel = 'utf8') {
  var decoder = new TextDecoder(utfLabel);
  return decoder.decode(this.value);
};

BluetoothGATTCharacteristic.prototype.getUint16Value = function(byteOffset, littleEndian = true) {
  return this.value.getUint16(byteOffset, littleEndian);
};

BluetoothGATTCharacteristic.prototype.getUint32Value = function(byteOffset, littleEndian = true) {
  return this.value.getUint32(byteOffset, littleEndian);
};

BluetoothGATTCharacteristic.prototype.getUint8Value = function(byteOffset) {
  return this.value.getUint8(byteOffset);
};
