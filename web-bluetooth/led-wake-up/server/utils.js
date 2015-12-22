var exports = exports || {};

exports.DEVICE_NAME = 'Wake Up';

exports.COLORS = ['#F44336', '#9C27B0', '#3F51B5', '#009688', '#FFEB3B', '#9E9E9E'];

exports.getTimeDiff = function(date1, date2) {
  if (date1 > date2) {
    date2.setHours(date2.getHours() + 24);
  }
  var diff = date2.getTime() - date1.getTime();
  var delay = {};
 
  delay.days = Math.floor(diff/1000/60/60/24);
  diff -= delay.days*1000*60*60*24;
 
  delay.hours = Math.floor(diff/1000/60/60);
  diff -= delay.hours*1000*60*60;
 
  delay.minutes = Math.floor(diff/1000/60);
  diff -= delay.minutes*1000*60;
 
  delay.seconds = Math.floor(diff/1000);
  return delay;
}

exports.strColorToHex = function(str) {
  var r = parseInt(str.slice(1, 3), 16);
  var g = parseInt(str.slice(3, 5), 16);
  var b = parseInt(str.slice(5, 7), 16);
  return [r, g, b];
}

exports.getDefaultColor = function() {
  return exports.strColorToHex(exports.COLORS[0]);
}
