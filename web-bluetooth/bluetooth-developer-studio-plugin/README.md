## Web Bluetooth Developer Studio Plugin

WIP

### Installation

Copy/paste `sandbox/web-bluetooth/bluetooth-developer-studio-plugin/` folder content to a new `Web Bluetooth` plugin folder at `C:\Program Files (x86)\Bluetooth SIG\Bluetooth Developer Studio\Plugins\Web Bluetooth`.

### Run

1. Open Bluetooth Developer Studio
2. Press <kbd>Ctrl</kbd>+<kbd>G</kbd> to Generate Code
3. Pick `Client` and select `Web Bluetooth`
4. Click `Generate` button
5. Check out the new generated HTML and JS files in the Bluetooth Developer Studio Plugin Output folder.
 
<img src="https://raw.githubusercontent.com/beaufortfrancois/sandbox/gh-pages/web-bluetooth/bluetooth-developer-studio-plugin/screenshot.png">

### Notes

- Make sure `template.html` and `template.js` lines end with `CR` then `LF`:

```bash
:update
:e ++ff=dos
:wq
```
