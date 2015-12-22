var exports = exports || {};

exports.DEVICE_NAME = 'Wake Up';

exports.COLORS = ['#F44336', '#9C27B0', '#3F51B5', '#009688', '#FFEB3B', '#9E9E9E'];

exports.strColorToHex = function(str) {
  var r = parseInt(str.slice(1, 3), 16);
  var g = parseInt(str.slice(3, 5), 16);
  var b = parseInt(str.slice(5, 7), 16);
  return [r, g, b];
}

exports.getDefaultColor = function() {
  return exports.strColorToHex(exports.COLORS[0]);
}
