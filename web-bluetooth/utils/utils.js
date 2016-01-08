BluetoothGATTCharacteristic.prototype.readFloat32Value = function(byteOffset, littleEndian = true) {
  return this.readValue()
  .then(buffer => {
    var data = new DataView(buffer);
    return data.getFloat32(byteOffset, littleEndian);
  });
};

BluetoothGATTCharacteristic.prototype.readFloat64Value = function(byteOffset, littleEndian = true) {
  return this.readValue()
  .then(buffer => {
    var data = new DataView(buffer);
    return data.getFloat64(byteOffset, littleEndian);
  });
};

BluetoothGATTCharacteristic.prototype.readInt16Value = function(byteOffset, littleEndian = true) {
  return this.readValue()
  .then(buffer => {
    var data = new DataView(buffer);
    return data.getInt16(byteOffset, littleEndian);
  });
};

BluetoothGATTCharacteristic.prototype.readInt32Value = function(byteOffset, littleEndian = true) {
  return this.readValue()
  .then(buffer => {
    var data = new DataView(buffer);
    return data.getInt32(byteOffset, littleEndian);
  });
};

BluetoothGATTCharacteristic.prototype.readInt8Value = function(byteOffset) {
  return this.readValue()
  .then(buffer => {
    var data = new DataView(buffer);
    return data.getInt8(byteOffset);
  });
};

BluetoothGATTCharacteristic.prototype.readStringValue = function(utfLabel = 'utf8') {
  return this.readValue()
  .then(buffer => {
    var data = new DataView(buffer);
    var decoder = new TextDecoder(utfLabel);
    return decoder.decode(data);
  });
};

BluetoothGATTCharacteristic.prototype.readUint16Value = function(byteOffset, littleEndian = true) {
  return this.readValue()
  .then(buffer => {
    var data = new DataView(buffer);
    return data.getUint16(byteOffset, littleEndian);
  });
};

BluetoothGATTCharacteristic.prototype.readUint32Value = function(byteOffset, littleEndian = true) {
  return this.readValue()
  .then(buffer => {
    var data = new DataView(buffer);
    return data.getUint32(byteOffset, littleEndian);
  });
};

BluetoothGATTCharacteristic.prototype.readUint8Value = function(byteOffset) {
  return this.readValue()
  .then(buffer => {
    var data = new DataView(buffer);
    return data.getUint8(byteOffset);
  });
};
