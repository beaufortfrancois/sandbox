HTMLElement.prototype.requestFullscreen = HTMLElement.prototype.requestFullscreen || HTMLElement.prototype.webkitRequestFullscreen;
HTMLDocument.prototype.exitFullscreen = HTMLDocument.prototype.exitFullscreen || HTMLDocument.prototype.webkitExitFullscreen;

if (!('fullscreenElement' in document)) {
  Object.defineProperty(document, 'fullscreenElement', {
    get: function() {
      return document.mozFullScreenElement || document.msFullscreenElement || document.webkitFullscreenElement;
    }
  });
}
