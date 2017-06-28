# Sen.se Peanut Web App

A simple web app using the Web Bluetooth API to interact with my ThermoPeanuts and GuardPeanuts.

https://beaufortfrancois.github.io/sandbox/web-bluetooth/sense-peanut/

<img src="https://raw.githubusercontent.com/beaufortfrancois/sandbox/gh-pages/web-bluetooth/sense-peanut/hero.png">

## Configuration

It works perfectly fine for me because I've pre-configured my peanuts into the
web app. Look at the `index.html` file and update the JavaScript constant
`MY_PEANUTS` to reflect your own peanuts. Here are mine:

```js
const MY_PEANUTS = {
  '00:A0:50:46:06:1A': {
    'color': 'orange',
    'label': '46:06:1A',
    'type': 'guard',
    'factoryKey': 'e4e7ba283c9e524bc559c51a27f388f0',
  },
  '00:A0:50:0C:11:08': {
    'color': 'blue',
    'label': '0C:11:08',
    'type': 'thermo',
    'factoryKey': '2cd1d05935bfb2138f346bb24b9cbc23',
  },
  '00:A0:50:06:13:18': {
    'color': 'green',
    'label': '06:13:18',
    'type': 'thermo',
    'factoryKey': 'ebaed4451f6e8bcc0f84a8c3d3574a8c',
  }
};
```

You can grab all these useful information from
https://sen.se/developers/peanutkeys/ if you already have a Sen.se Developer
Account and added your peanut into the official app.
