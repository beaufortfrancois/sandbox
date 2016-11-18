/* Eddystone-URL Configuration */

const EDDYSTONE_URL_CONFIG_SERVICE_UUID                      = 'ee0c2080-8786-40ba-ab96-99b91ac981d8';
const LOCK_STATE_CHARACTERISTIC_UUID                         = 'ee0c2081-8786-40ba-ab96-99b91ac981d8';
const LOCK_CHARACTERISTIC_UUID                               = 'ee0c2082-8786-40ba-ab96-99b91ac981d8';
const UNLOCK_CHARACTERISTIC_UUID                             = 'ee0c2083-8786-40ba-ab96-99b91ac981d8';
const URI_DATA_CHARACTERISTIC_UUID                           = 'ee0c2084-8786-40ba-ab96-99b91ac981d8';
const FLAGS_CHARACTERISTIC_UUID                              = 'ee0c2085-8786-40ba-ab96-99b91ac981d8';
const ADVERTISED_TX_POWER_LEVELS_CHARACTERISTIC_UUID         = 'ee0c2086-8786-40ba-ab96-99b91ac981d8';
const TX_POWER_MODE_CHARACTERISTIC_UUID                      = 'ee0c2087-8786-40ba-ab96-99b91ac981d8';
const BEACON_PERIOD_CHARACTERISTIC_UUID                      = 'ee0c2088-8786-40ba-ab96-99b91ac981d8';
const RESET_CHARACTERISTIC_UUID                              = 'ee0c2089-8786-40ba-ab96-99b91ac981d8';

const TX_POWER_MODES = ['Lowest', 'Low', 'Medium', 'High'];

var lockStateCharacteristic,
    lockCharacteristic,
    unlockCharacteristic,
    uriDataCharacteristic,
    flagsCharacteristic,
    advertisedTxPowerLevelsCharacteristic,
    txPowerModeCharacteristic,
    beaconPeriodCharacteristic,
    resetCharacteristic;

/* Eddystone Configuration */

const EDDYSTONE_CONFIG_SERVICE_UUID                          = 'a3c87500-8ed3-4bdf-8a39-a01bebede295';
const CAPABILITIES_CHARACTERISTIC_UUID                       = 'a3c87501-8ed3-4bdf-8a39-a01bebede295';
const ACTIVE_SLOT_CHARACTERISTIC_UUID                        = 'a3c87502-8ed3-4bdf-8a39-a01bebede295';
const ADVERTISING_INTERVAL_CHARACTERISTIC_UUID               = 'a3c87503-8ed3-4bdf-8a39-a01bebede295';
const RADIO_TX_POWER_CHARACTERISTIC_UUID                     = 'a3c87504-8ed3-4bdf-8a39-a01bebede295';
const ADVANCED_ADVERTISED_TX_POWER_CHARACTERISTIC_UUID       = 'a3c87505-8ed3-4bdf-8a39-a01bebede295';
const EDDYSTONE_LOCK_STATE_CHARACTERISTIC_UUID               = 'a3c87506-8ed3-4bdf-8a39-a01bebede295';
const EDDYSTONE_UNLOCK_CHARACTERISTIC_UUID                   = 'a3c87507-8ed3-4bdf-8a39-a01bebede295';
const PUBLIC_ECDH_KEY_CHARACTERISTIC_UUID                    = 'a3c87508-8ed3-4bdf-8a39-a01bebede295';
const EID_IDENTITY_KEY_CHARACTERISTIC_UUID                   = 'a3c87509-8ed3-4bdf-8a39-a01bebede295';
const ADV_SLOT_DATA_CHARACTERISTIC_UUID                      = 'a3c8750a-8ed3-4bdf-8a39-a01bebede295';
const ADVANCED_FACTORY_RESET_CHARACTERISTIC_UUID             = 'a3c8750b-8ed3-4bdf-8a39-a01bebede295';
const ADVANCED_REMAIN_CONNECTABLE_CHARACTERISTIC_UUID        = 'a3c8750c-8ed3-4bdf-8a39-a01bebede295';

var capabilitiesCharacteristic,
    activeSlotCharacteristic,
    advertisingIntervalCharacteristic,
    radioTxPowerCharacteristic,
    advancedAdvertisedTxPowerCharacteristic,
    eddystoneLockStateCharacteristic,
    eddystoneUnlockCharacteristic,
    publicEdchKeyCharacteristic,
    eidIdentityKeyCharacteristic,
    advSlotDataCharacteristic,
    advancedFactoryResetCharacteristic,
    advancedRemainConnectableCharacteristic;

const DEFAULT_PASSWORD = '0x00112233445566778899aabbccddeeff';

/* Common */

var beacon;

var isEddystoneUrlBeacon;

var isBeaconLocked;

var $ = document.querySelector.bind(document);

if (navigator.bluetooth) {
  $('#note').textContent = 'Put your beacon into configuration mode and search.';
  $('#scanButton').addEventListener('click', onScanButtonClick);
} else if (navigator.userAgent.includes('Chrome/')) {
  $('#note').innerHTML = 'This experiment requires <a href="https://github.com/WebBluetoothCG/web-bluetooth/blob/gh-pages/implementation-status.md#chrome">Web Bluetooth</a>.<br/>' +
                         'Copy and paste this into the URL bar and enable<br/>' +
                         '<pre id="flag">chrome://flags/#enable-web-bluetooth</pre>'
  $('#scanButton').disabled = true;
} else  {
  $('#note').innerHTML = 'Your browser doesn\'t support <a href="https://webbluetoothcg.github.io/web-bluetooth/">Web Bluetooth</a> ;(';
  if (!navigator.userAgent.includes('Android')) {
    $('#note').innerHTML += '<br/>Check out <a href="market://details?id=no.nordicsemi.android.nrfbeacon.nearby">nRF Beacon for Eddystone</a>.';
  }
  $('#scanButton').disabled = true;
}

function onScanButtonClick() {
  // Hack to allow audio to play afterwards
  if (!$('audio').played.length) {
    $('audio').play(); $('audio').pause();
  }
  ga('send', 'event', 'ScanButton', 'click');
  $('#progressBar').hidden = true;
  var options = {filters:[{services:[ EDDYSTONE_URL_CONFIG_SERVICE_UUID ]},
                          {services:[ EDDYSTONE_CONFIG_SERVICE_UUID ]}]};
  navigator.bluetooth.requestDevice(options)
  .then(device => {
    ga('send', 'event', 'ScanButtonOutcome', 'success');
    beacon = device;
    beacon.addEventListener('gattserverdisconnected', onBeaconDisconnected);
    return connectBeacon();
  })
  .then(readBeaconConfig)
  .then(showForm)
  .catch(error => {
    ga('send', 'event', 'ScanButtonOutcome', 'fail', error.message || error);
    $('#progressBar').hidden = true;
    $('#snackbar').MaterialSnackbar.showSnackbar({message: error.message || error});
  });
}

function onBeaconDisconnected() {
  $('audio').play();

  let actionHandler = function(event) {
    $('#snackbar').MaterialSnackbar.cleanup_();
    $('#snackbar').MaterialSnackbar.showSnackbar({message: 'Have you tried turning it off and on again?'});
  };
  let data = {
    message: 'Beacon not advertising?',
    actionHandler: actionHandler,
    actionText: 'Help',
    timeout: 8e3
  };
  $('#snackbar').MaterialSnackbar.showSnackbar(data);
}

function showForm() {
  if ($('#unlockDialog').open) {
    return;
  }
  $('#flags').parentElement.hidden = !isEddystoneUrlBeacon;
  $('#period').parentElement.hidden = !isEddystoneUrlBeacon;
  $('#txPowerMode').parentElement.hidden = !isEddystoneUrlBeacon;
  $('#txPowerMode').parentElement.classList.toggle('firstRow', true);
  $('#txPowerMode').parentElement.classList.toggle('secondRow', false);
  $('#lowest').parentElement.hidden = !isEddystoneUrlBeacon;
  $('#low').parentElement.hidden = !isEddystoneUrlBeacon;
  $('#medium').parentElement.hidden = !isEddystoneUrlBeacon;
  $('#high').parentElement.hidden = !isEddystoneUrlBeacon;
  $('#advancedAdvertisedTxPower').parentElement.hidden = isEddystoneUrlBeacon;
  $('#advertisingInterval').parentElement.hidden = isEddystoneUrlBeacon;
  $('#radioTxPower').parentElement.hidden = isEddystoneUrlBeacon;
  $('#toggleAdvancedSettings').hidden = false;
  $('#container').classList.remove('more');
  $('#beaconService').innerHTML = isEddystoneUrlBeacon ? 'Eddystone-URL Configuration' : 'Eddystone Configuration';
  $('#beaconService').animate([
      {opacity: 0, transform: 'translateY(-28px)'},
      {opacity: 1, transform: 'translateY(0)'}],
      {duration: 400, easing: 'ease-out'});
  $('#beaconService').hidden = false;
  $('#progressBar').classList.toggle('top', false);
  $('#progressBar').hidden = true;
  $('#scanButton').hidden = true;
  $('body').classList.toggle('config', true);
  $('#instructions').hidden = true;
  $('#updateButton').disabled = !isFormValid();
  $('#container').animate([
      {opacity: 0, transform: 'translateY(24px)'},
      {opacity: 1, transform: 'translateY(0)'}],
      {duration: 400, easing: 'ease-out'});
  $('#closeButton').animate([{opacity: 0}, {opacity: 1}], 1024);
  $('#container').hidden = false;
  $('#closeButton').hidden = false;
}

$('#container').addEventListener('input', function(event) {
  $('#updateButton').disabled = !isFormValid();
});

function isFormValid() {
  if (isEddystoneUrlBeacon) {
    return $('#uri').checkValidity() &&
           $('#flags').checkValidity() && $('#period').checkValidity() && $('#txPowerMode').checkValidity() &&
           $('#lowest').checkValidity() && $('#low').checkValidity() && $('#medium').checkValidity() && $('#high').checkValidity();
  } else {
    return $('#uri').checkValidity() &&
           $('#radioTxPower').checkValidity() &&
           $('#advertisingInterval').checkValidity() && $('#advancedAdvertisedTxPower').checkValidity();
  }
}

$('#updateButton').addEventListener('click', function() {
  $('#resetButton').disabled = true;
  $('#updateButton').disabled = true;
  isPhysicalWebUrlValid($('#uri').value)
  .then(_ => { onUpdateButtonClick(); })
  .catch(error => {
    $('#errorMessageWarningDialog').textContent = error;
    $('#warningDialog').showModal();
  });
});

$('#continueWarningDialogButton').addEventListener('click', function() {
  onUpdateButtonClick();
  $('#warningDialog').close();
});

$('#cancelWarningDialogButton').addEventListener('click', function() {
  $('#resetButton').disabled = false;
  $('#updateButton').disabled = false;
  $('#warningDialog').close();
});

function isPhysicalWebUrlValid(url) {
  let pwsUrl = 'https://physicalweb.googleapis.com/v1alpha1/urls:resolve?key=AIzaSyCF2edaCQxYmDY7piMQFzQJhmZXppjo4uQ';
  let body = JSON.stringify({ urls: [{ url: url.trim() }] });
  return fetch(pwsUrl, { mode: 'cors', method: 'POST', body: body })
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      return Promise.reject(data.error.message);
    }
    if (data.unresolvedResults) {
      return Promise.reject(data.unresolvedResults[0].rejectionReason.description);
    }
  });
}

function onUpdateButtonClick() {
  if (isBeaconLocked) {
    /* Beacon is locked */
    $('#unlockPassword').parentElement.MaterialTextfield.change('');
    $('#unlockDialog').classList.toggle('reset', false);
    $('#unlockDialog').classList.toggle('read', false);
    $('#unlockDialog').showModal();
  } else {
    /* Beacon is unlocked */
    if ($('#lock').checked) {
      /* User wants to lock it */
      if (isEddystoneUrlBeacon) {
        $('#lockPassword').parentElement.MaterialTextfield.change('');
        $('#lockPasswordConfirmation').parentElement.MaterialTextfield.change('');
        checkLockPassword();
        $('#lockDialog').showModal();
      } else {
        /* User wants to change password */
        if ($('#changePassword').checked) {
          $('#eddystoneLockStateOldPassword').parentElement.MaterialTextfield.change('');
          $('#eddystoneLockStateNewPassword').parentElement.MaterialTextfield.change('');
          $('#eddystoneLockStatePasswordConfirmation').parentElement.MaterialTextfield.change('');
          $('#confirmEddystoneLockStateButton').disabled = false;
          checkEddystoneLockStatePasswords();
          $('#eddystoneLockStateDialog').showModal();
        } else {
          /* User wants to lock it with default password */
          connectBeacon()
          .then(updateBeacon(DEFAULT_PASSWORD));
        }
      }
    } else {
      connectBeacon()
      .then(updateBeacon);
    }
  }
}

$('#resetButton').addEventListener('click', function() {
  $('#resetButton').disabled = true;
  $('#updateButton').disabled = true;
  if (isBeaconLocked) {
    $('#unlockPassword').parentElement.MaterialTextfield.change('');
    $('#unlockDialog').classList.toggle('reset', true);
    $('#unlockDialog').classList.toggle('read', false);
    $('#unlockDialog').showModal();
  } else {
    connectBeacon()
    .then(resetBeacon);
  }
});

$('#closeButton').addEventListener('click', disconnectBeacon);

function disconnectBeacon() {
  if (beacon && beacon.gatt.connected) {
    beacon.gatt.disconnect();
  }
  $('#beaconService').textContent = '';
  $('#progressBar').classList.toggle('top', true);
  $('#container').hidden = true;
  $('#beaconService').hidden = true;
  $('#closeButton').hidden = true;
  $('#scanButton').hidden = false;
  $('#instructions').hidden = false;
  $('body').classList.toggle('config', false);
}

$('#cancelLockButton').addEventListener('click', onCancelLockDialog);
$('#lockDialog').addEventListener('cancel', onCancelLockDialog);

$('#cancelEddystoneLockStateButton').addEventListener('click', onCancelLockDialog);
$('#eddystoneLockStateDialog').addEventListener('cancel', onCancelLockDialog);

function onCancelLockDialog(event) {
  if ($('#lockDialog').open) {
    $('#lockDialog').close();
  }
  if ($('#eddystoneLockStateDialog').open) {
    $('#eddystoneLockStateDialog').close();
  }
  $('#resetButton').disabled = false;
  $('#updateButton').disabled = false;
  $('#progressBar').hidden = true;
};

$('#confirmLockButton').addEventListener('click', function() {
  $('#lockDialog').close();
  connectBeacon()
  .then(() => { return updateBeacon($('#lockPassword').value) })
});

$('#lock').addEventListener('change', function(event) {
  setLock(event.target.checked);
});

$('#changePassword').addEventListener('change', function(event) {
  setLock(event.target.checked);
  event.target.parentElement.classList.toggle('edited', event.target.checked);
});

$('#lockPassword').addEventListener('input', checkLockPassword);
$('#lockPasswordConfirmation').addEventListener('input', checkLockPassword);

function checkLockPassword() {
  if ($('#lockPassword').value === $('#lockPasswordConfirmation').value) {
    $('#lockPasswordConfirmation').setCustomValidity('');
  } else {
    $('#lockPasswordConfirmation').setCustomValidity('Wrong');
  }
  $('#lockPasswordConfirmation').parentElement.MaterialTextfield.checkValidity();
  $('#confirmLockButton').disabled = !$('#lockPasswordConfirmation').validity.valid;
}

$('#confirmEddystoneLockStateButton').addEventListener('click', function() {
  $('#eddystoneLockStateDialog').close();
  connectBeacon()
  .then(() => { return updateBeacon($('#eddystoneLockStateNewPassword').value, $('#eddystoneLockStateOldPassword').value) })
});

$('#unlockPassword').addEventListener('input', checkBytesInput);
$('#eddystoneLockStateOldPassword').addEventListener('input', checkBytesInput);
$('#eddystoneLockStateNewPassword').addEventListener('input', checkBytesInput);
$('#eddystoneLockStatePasswordConfirmation').addEventListener('input', checkBytesInput);

function checkBytesInput(event) {
  var value = event.target.value;
  if (value.toLowerCase().startsWith('0x') && value.slice(2).match(/(..)/g)) {
    var password = value.slice(2).match(/(..)/g).slice(0, 16).map(i => parseInt(i, 16));
    if (value.length % 2 !== 0 || !/^[0-9A-F]*$/i.test(value.slice(2))) {
      event.target.setCustomValidity('Not valid.');
    } else if (password.length > 16) {
      event.target.setCustomValidity('Too long.');
    } else {
      event.target.setCustomValidity('');
    }
  } else if (value.length > 16) {
      event.target.setCustomValidity('Too long.');
  } else if (value.length === 0) {
    event.target.setCustomValidity('Empty.');
  } else {
    event.target.setCustomValidity('');
  }
  if (event.target.id === 'eddystoneLockStatePasswordConfirmation' ||
      event.target.id === 'eddystoneLockStateNewPassword') {
    checkEddystoneLockStatePasswords();
    if (!$('#eddystoneLockStatePasswordConfirmation').validity.valid) {
      $('#confirmEddystoneLockStateButton').disabled = true;
      return;
    }
  }
  $('#confirmEddystoneLockStateButton').disabled = !event.target.validity.valid;
  $('#confirmUnlockButton').disabled = !event.target.validity.valid;
}

function checkEddystoneLockStatePasswords() {
  if ($('#eddystoneLockStateNewPassword').value === $('#eddystoneLockStatePasswordConfirmation').value) {
    $('#eddystoneLockStatePasswordConfirmation').setCustomValidity('');
  } else {
    $('#eddystoneLockStatePasswordConfirmation').setCustomValidity('Wrong');
  }
  $('#eddystoneLockStatePasswordConfirmation').parentElement.MaterialTextfield.checkValidity();
}

$('#cancelUnlockButton').addEventListener('click', onCancelUnlockDialog);
$('#unlockDialog').addEventListener('cancel', onCancelUnlockDialog);

function onCancelUnlockDialog() {
  $('#unlockDialog').close();
  $('#confirmUnlockButton').disabled = true;
  $('#resetButton').disabled = false;
  $('#updateButton').disabled = false;
  $('#progressBar').hidden = true;
};

$('#confirmUnlockButton').addEventListener('click', function() {
  var password = $('#unlockPassword').value;
  $('#unlockDialog').close();
  $('#confirmUnlockButton').disabled = true;
  connectBeacon()
  .then(() => {
    if (isEddystoneUrlBeacon) {
      return generateLock(password)
      .then(key => {
        return unlockCharacteristic.writeValue(key);
      })
    } else {
      let reverse = (dataview) => {
        let array = toUint8Array(new Uint8Array(dataview.buffer));
        return new Uint8Array(array.reverse());
      };
      let key = encodePassword(password);
      return eddystoneUnlockCharacteristic.readValue()
      .then(challengeData => encrypt(key, challengeData))
      .then(reverse)
      .then(unlockToken => eddystoneUnlockCharacteristic.writeValue(unlockToken))
      .catch(e => {
        return Promise.reject('Wrong password. Please try again.');
      })
      .then(() => eddystoneLockStateCharacteristic.readValue())
      .then(value => {
        if (value.getUint8(0) == 0) {
          // Reject if beacon is still locked after unlock attempt
          return Promise.reject('Wrong password. Please try again.');
        } else {
          return Promise.resolve();
        }
      })
    }
  })
  .then(() => {
    if ($('#unlockDialog').classList.contains('read')) {
      return readBeaconConfig()
      .then(showForm);
    } else if ($('#unlockDialog').classList.contains('reset')) {
      return resetBeacon();
    } else {
      if (!$('#lock').checked) {
        return updateBeacon();
      } else {
        return updateBeacon(password);
      }
    }
  })
  .catch(e => {
    var data = {message: 'Error: ' + e, timeout: 5e3 };
    $('#snackbar').MaterialSnackbar.showSnackbar(data);
    $('#resetButton').disabled = false;
    $('#updateButton').disabled = false;
    $('#progressBar').hidden = true;
    if ($('#unlockDialog').classList.contains('read')) {
      disconnectBeacon();
    }
  });
});

function generateLock(password) {
  var keyData = new TextEncoder().encode(password);
  return crypto.subtle.importKey('raw', keyData, 'PBKDF2', false, ['deriveKey'])
  .then(key => {
    return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new Uint8Array(1),
      iterations: 1000,
      hash: 'SHA-1'
    },
    key,
    {
      name: 'AES-CTR',
      length: 128
    },
    true, /* extractable */
    ['encrypt', 'decrypt']
    )
  })
  .then(webKey => crypto.subtle.exportKey('raw', webKey))
}

function encrypt(key, data) {
  return crypto.subtle.importKey('raw', key, {name: 'aes-cbc'}, true, ['encrypt'])
  .then(k => crypto.subtle.encrypt({name: 'aes-cbc', iv: new Uint8Array(16)}, k, data))
  .then(encrypted => {
    let array = toUint8Array(new Uint8Array(encrypted));
    var half_length = Math.ceil(array.length / 2);
    return new Uint8Array(array.slice(0, half_length).reverse());
  });
}

$('#toggleAdvancedSettings').addEventListener('click', function(event) {
  event.target.hidden = true;
  $('#changePassword').parentElement.hidden = isEddystoneUrlBeacon;
  if (isEddystoneUrlBeacon) {
    $('#txPowerMode').parentElement.classList.remove('firstRow');
    $('#txPowerMode').parentElement.classList.add('secondRow');
  } else {
    $('#changePassword').parentElement.MaterialCheckbox.uncheck();
  }
  $('#container').classList.toggle('more', true);
});

function updateBeacon(password, oldPassword) {
  ga('send', 'event', 'UpdateButton', 'click', password ? 'lock' : '');
  var isShortened;
  return getEncodedUrl($('#uri').value)
  .then(args => {
    [encodedUrl, isShortened] = args;
    if (isEddystoneUrlBeacon) {
      return uriDataCharacteristic.writeValue(new Uint8Array(encodedUrl));
    } else {
      // TODO: Document this clearly...
      encodedUrl.splice(0, 0, 0x10);
      return advSlotDataCharacteristic.writeValue(new Uint8Array(encodedUrl));
    }
  })
  .then(() => {
    if (isEddystoneUrlBeacon) {
      var data = new Uint16Array([$('#period').value]);
      return beaconPeriodCharacteristic.writeValue(data);
    } else {
      var data = new DataView(new ArrayBuffer(2));
      data.setUint16(0, $('#advertisingInterval').value, false /* bigEndian */);
      return advertisingIntervalCharacteristic.writeValue(data);
    }
  })
  .then(() => {
    if (!isEddystoneUrlBeacon) {
      return Promise.resolve();
    } else {
      var data = new Int8Array([
          $('#lowest').value,
          $('#low').value,
          $('#medium').value,
          $('#high').value
        ]);
      return advertisedTxPowerLevelsCharacteristic.writeValue(data);
    }
  })
  .then(() => {
    if (isEddystoneUrlBeacon) {
      var data = new Uint8Array([TX_POWER_MODES.indexOf($('#txPowerMode').value)]);
      return txPowerModeCharacteristic.writeValue(data);
    } else {
      var data = new Int8Array([$('#radioTxPower').value]);
      return radioTxPowerCharacteristic.writeValue(data);
    }
  })
  .then(() => {
    if (isEddystoneUrlBeacon) {
      return Promise.resolve();
    } else {
      var data = new Int8Array([$('#advancedAdvertisedTxPower').value]);
      return advancedAdvertisedTxPowerCharacteristic.writeValue(data);
    }
  })
  .then(() => {
    if (password) {
      if (isEddystoneUrlBeacon) {
        return generateLock(password)
        .then(key => lockCharacteristic.writeValue(key))
      } else {
        if (!oldPassword) {
          // Lock beacon without changing the current security key value.
          return eddystoneLockStateCharacteristic.writeValue(new Uint8Array([0]))
          .then(() => { isBeaconLocked = true; });
        }
        let oldKey = encodePassword(oldPassword);
        let reverse = (dataview) => {
          let array = toUint8Array(new Uint8Array(dataview.buffer));
          return new Uint8Array(array.reverse());
        };
        // Lock beacon without changing the current security key value.
        return eddystoneLockStateCharacteristic.writeValue(new Uint8Array([0]))
        .then(() => { isBeaconLocked = true; })
        // Unlock beacon with the old security key.
        .then(() => eddystoneUnlockCharacteristic.readValue())
        .then(challengeData => encrypt(oldKey, challengeData))
        .then(reverse)
        .then(unlockToken => eddystoneUnlockCharacteristic.writeValue(unlockToken))
        .catch(e => {
          return Promise.reject('Wrong old password. Please try again.');
        })
        .then(() => eddystoneLockStateCharacteristic.readValue())
        .then(value => {
          isBeaconLocked = (value.getUint8(0) == 1);
          if (!isBeaconLocked) {
            // Reject if beacon is still locked after unlock attempt
            return Promise.reject('Wrong old password. Please try again.');
          } else {
            return Promise.resolve();
          }
        })
        .then(() => {
          let newKey = encodePassword(password);
          return encrypt(oldKey, newKey)
          .then(reverse)
          .then(toUint8Array)
          .then(e => {
            let val = [0, ...e];
            return new Uint8Array(val);
          })
          .then(data => {
            return eddystoneLockStateCharacteristic.writeValue(data)
          })
        })
      }
    } else {
      return Promise.resolve();
    }
  })
  .then(() => {
    $('#progressBar').hidden = true;
  })
  .then(() => {
    ga('send', 'event', 'UpdateButtonOutcome', 'success');
    // Show success message, wait, and disconnect.
    var data = {message: 'Beacon has been updated.', timeout: 2e3};
    $('#snackbar').MaterialSnackbar.showSnackbar(data);
    updateUriLabel(isShortened);
    setTimeout(function() {
      $('#resetButton').disabled = false;
      $('#updateButton').disabled = false;
      disconnectBeacon();
    }, 2e3);
  })
  .catch(e => {
    $('#progressBar').hidden = true;
    ga('send', 'event', 'UpdateButtonOutcome', 'fail', e);
    var data = {message: 'Error: ' + e, timeout: 5e3 };
    $('#snackbar').MaterialSnackbar.showSnackbar(data);
    $('#resetButton').disabled = false;
    $('#updateButton').disabled = false;
    if (!isEddystoneUrlBeacon && password) {
      disconnectBeacon();
    }
  });
};

function encodePassword(password) {
  let key = new Uint8Array(16);
  if (password.toLowerCase().startsWith('0x')) {
    let encodedBytes = new Uint8Array(password.slice(2).match(/(..)/g).slice(0, 16).map(i => parseInt(i, 16)));
    for (var i = 0; i < 16; i++) {
      key[i] = encodedBytes[i];
    }
  } else {
    let encodedPassword = new TextEncoder().encode(password);
    for (var i = 0; i < 16; i++) {
      key[i] = encodedPassword[i];
    }
  }
  return key;
}

function updateUriLabel(isShortened) {
  $('#uriLabel').classList.toggle('shortened', isShortened);
  $('#uriLabel').textContent = isShortened ? 'URL Shortened' : 'URL';
}

function resetBeacon() {
  ga('send', 'event', 'ResetButton', 'click');
  return Promise.resolve()
  .then(() => {
    if (isEddystoneUrlBeacon) {
      return resetCharacteristic.writeValue(new Uint8Array([1]));
    } else {
      return advancedFactoryResetCharacteristic.writeValue(new Uint8Array([0x0b]));
    }
  })
  .then(() => {
    $('#progressBar').hidden = true;
  })
  .then(() => {
    ga('send', 'event', 'ResetButtonOutcome', 'success');
    updateUriLabel(false /* not shortened */);
    // Show success message, wait, and disconnect.
    var data = {message: 'Beacon has been reset.', timeout: 2e3};
    $('#snackbar').MaterialSnackbar.showSnackbar(data);
    setTimeout(function() {
      $('#resetButton').disabled = false;
      $('#updateButton').disabled = false;
      disconnectBeacon();
    }, 2e3);
  })
  .catch(e => {
    ga('send', 'event', 'ResetButtonOutcome', 'fail', e);
    var data = {message: 'Error: ' + e, timeout: 5e3 };
    $('#snackbar').MaterialSnackbar.showSnackbar(data);
    $('#resetButton').disabled = false;
    $('#updateButton').disabled = false;
  });

};

function connectBeacon() {
  $('#progressBar').hidden = false;
  if (beacon && beacon.gatt.connected) {
    return Promise.resolve();
  }
  ga('send', 'event', 'ConnectBeacon', 'background');
  return beacon.gatt.connect()
  .then(_ => beacon.gatt.getPrimaryServices())
  .then(services => {
    let serviceUuids = services.map(service => service.uuid);
    if (serviceUuids.includes(EDDYSTONE_URL_CONFIG_SERVICE_UUID)) {
      isEddystoneUrlBeacon = true;
      ga('send', 'event', 'ConnectBeaconOutcome', 'background', 'Eddystone-URL beacon');
    } else if (serviceUuids.includes(EDDYSTONE_CONFIG_SERVICE_UUID)) {
      isEddystoneUrlBeacon = false;
      ga('send', 'event', 'ConnectBeaconOutcome', 'background', 'Eddystone GATT beacon');
    } else {
      ga('send', 'event', 'ConnectBeaconOutcome', 'background', 'Non Eddystone Beacon');
      return Promise.reject('Beacon is not valid');
    }
    return getCharacteristics();
  })
}

function getCharacteristics() {
  if (isEddystoneUrlBeacon) {
    return beacon.gatt.getPrimaryService(EDDYSTONE_URL_CONFIG_SERVICE_UUID)
    .then(service => {
      return Promise.all([
        service.getCharacteristic(LOCK_STATE_CHARACTERISTIC_UUID),
        service.getCharacteristic(LOCK_CHARACTERISTIC_UUID),
        service.getCharacteristic(UNLOCK_CHARACTERISTIC_UUID),
        service.getCharacteristic(URI_DATA_CHARACTERISTIC_UUID),
        service.getCharacteristic(FLAGS_CHARACTERISTIC_UUID),
        service.getCharacteristic(ADVERTISED_TX_POWER_LEVELS_CHARACTERISTIC_UUID),
        service.getCharacteristic(TX_POWER_MODE_CHARACTERISTIC_UUID),
        service.getCharacteristic(BEACON_PERIOD_CHARACTERISTIC_UUID),
        service.getCharacteristic(RESET_CHARACTERISTIC_UUID)
      ]);
    })
    .then(characteristics => {
      [
        lockStateCharacteristic,
        lockCharacteristic,
        unlockCharacteristic,
        uriDataCharacteristic,
        flagsCharacteristic,
        advertisedTxPowerLevelsCharacteristic,
        txPowerModeCharacteristic,
        beaconPeriodCharacteristic,
        resetCharacteristic
      ] = characteristics;
    })
    .catch(e => {
      var data = {message: 'Error: ' + e, timeout: 5e3 };
      $('#snackbar').MaterialSnackbar.showSnackbar(data);
    });
  } else {
    return beacon.gatt.getPrimaryService(EDDYSTONE_CONFIG_SERVICE_UUID)
    .then(service => {
      return Promise.all([
        service.getCharacteristic(CAPABILITIES_CHARACTERISTIC_UUID),
        service.getCharacteristic(ACTIVE_SLOT_CHARACTERISTIC_UUID),
        service.getCharacteristic(ADVERTISING_INTERVAL_CHARACTERISTIC_UUID),
        service.getCharacteristic(RADIO_TX_POWER_CHARACTERISTIC_UUID),
        service.getCharacteristic(ADVANCED_ADVERTISED_TX_POWER_CHARACTERISTIC_UUID),
        service.getCharacteristic(EDDYSTONE_LOCK_STATE_CHARACTERISTIC_UUID),
        service.getCharacteristic(EDDYSTONE_UNLOCK_CHARACTERISTIC_UUID),
        service.getCharacteristic(PUBLIC_ECDH_KEY_CHARACTERISTIC_UUID),
        service.getCharacteristic(EID_IDENTITY_KEY_CHARACTERISTIC_UUID),
        service.getCharacteristic(ADV_SLOT_DATA_CHARACTERISTIC_UUID),
        service.getCharacteristic(ADVANCED_FACTORY_RESET_CHARACTERISTIC_UUID),
        service.getCharacteristic(ADVANCED_REMAIN_CONNECTABLE_CHARACTERISTIC_UUID)
      ]);
    })
    .then(characteristics => {
      [
        capabilitiesCharacteristic,
        activeSlotCharacteristic,
        advertisingIntervalCharacteristic,
        radioTxPowerCharacteristic,
        advancedAdvertisedTxPowerCharacteristic,
        eddystoneLockStateCharacteristic,
        eddystoneUnlockCharacteristic,
        publicEdchKeyCharacteristic,
        eidIdentityKeyCharacteristic,
        advSlotDataCharacteristic,
        advancedFactoryResetCharacteristic,
        advancedRemainConnectableCharacteristic
      ] = characteristics;
    })
    .catch(e => {
      var data = {message: 'Error: ' + e, timeout: 5e3 };
      $('#snackbar').MaterialSnackbar.showSnackbar(data);
    });
  }
}

function readBeaconConfig() {
  if (isEddystoneUrlBeacon) {
    return lockStateCharacteristic.readValue().then(value => {
      isBeaconLocked = (value.getUint8(0) == 1);
      setLock(isBeaconLocked);
      $('#lock').parentElement.classList.toggle('edited', false);
      $('#lock').defaultChecked = isBeaconLocked;
    })
    .then(() => {
      return uriDataCharacteristic.readValue().then(value => {
        setValue('uri', decodeURL(value));
      })
    })
    .then(() => {
      return flagsCharacteristic.readValue().then(value => {
        setValue('flags', value.getUint8(0).toString(16));
      })
    })
    .then(() => {
      return beaconPeriodCharacteristic.readValue().then(value => {
        setValue('period', value.getUint16(0, true /* littleEndian */));
      })
    })
    .then(() => {
      return txPowerModeCharacteristic.readValue().then(value => {
        setValue('txPowerMode', TX_POWER_MODES[value.getUint8(0)]);
      })
    })
    .then(() => {
      return advertisedTxPowerLevelsCharacteristic.readValue().then(value => {
        setValue('lowest', value.getInt8(0));
        setValue('low', value.getInt8(1));
        setValue('medium', value.getInt8(2));
        setValue('high', value.getInt8(3));
      })
    })
    .catch(e => {
      var data = {message: 'Error: ' + e, timeout: 5e3 };
      $('#snackbar').MaterialSnackbar.showSnackbar(data);
    });
  } else {
    return eddystoneLockStateCharacteristic.readValue().then(value => {
      isBeaconLocked = (value.getUint8(0) == 0);
      if (!isBeaconLocked) {
        return readEddystoneBeaconConfig();
      }
      /* Beacon is locked */
      $('#unlockPassword').parentElement.MaterialTextfield.change('');
      $('#unlockDialog').classList.toggle('read', true);
      $('#unlockDialog').showModal();
    })
  }
}

function readEddystoneBeaconConfig() {
  setLock(isBeaconLocked);
  $('#changePassword').parentElement.classList.toggle('edited', false);
  $('#lock').parentElement.classList.toggle('edited', false);
  $('#lock').defaultChecked = isBeaconLocked;
  return advSlotDataCharacteristic.readValue().then(value => {
    const eddystoneFrameTypesMap = {
      0x00: 'UID',
      0x10: 'URL',
      0x20: 'TLM',
      0x30: 'EID',
      0x40: 'Reserved'
    }
    const eddystoneFrameType = eddystoneFrameTypesMap[value.getUint8(0)];
    if (eddystoneFrameType === 'URL') {
        // Remove frame type byte and advertised TX power at 0m.
        var data = new DataView(value.buffer, 2);
        setValue('uri', decodeURL(data));
    } else {
      // Instead of rejecting there, we let user override slot with a URL.
      setValue('uri', 'https://...');
      var data = {message: eddystoneFrameType + ' frame is not supported yet.', timeout: 5e3 };
      $('#snackbar').MaterialSnackbar.showSnackbar(data);
    }
  })
  .then(() => {
    $('ul[for=radioTxPower]').innerHTML = '';
    return capabilitiesCharacteristic.readValue().then(value => {
      for (var i = 6; i < value.buffer.byteLength; i++) {
        var li = document.createElement('li');
        li.classList.add('mdl-menu__item');
        li.textContent = value.getInt8(i);
        componentHandler.upgradeElement(li);
        $('ul[for=radioTxPower]').appendChild(li);
      }
      getmdlSelect.init('.getmdl-select');
    })
  })
  .then(() => {
    return radioTxPowerCharacteristic.readValue().then(value => {
      setValue('radioTxPower', value.getInt8(0));
    })
  })
  .then(() => {
    return advertisingIntervalCharacteristic.readValue().then(value => {
      setValue('advertisingInterval', value.getUint16(0, false /* bigEndian */));
    })
  })
  .then(() => {
    return advancedAdvertisedTxPowerCharacteristic.readValue().then(value => {
      setValue('advancedAdvertisedTxPower', value.getInt8(0));
    })
  });
}

function setValue(inputId, value) {
  var element = $('#' + inputId);
  element.oninput = function() {
    event.target.classList.toggle('edited', (event.target.defaultValue !== event.target.value));
    if (event.target.id == 'uri') {
      if (event.target.classList.contains('edited')) {
        updateUriLabel(false /* not shortened */);
      }
    }
  };
  element.defaultValue = value;
  element.classList.toggle('edited', false);
  element.parentElement.MaterialTextfield.change(value);
  element.parentElement.animate([{color: 'initial'}, {color: '#448AFF'}, {color: 'initial'}], 360);
  var label = element.parentElement.querySelector('label');
  if (label) {
    label.animate([{color: '#9e9e9e'}, {color: '#448AFF'}, {color: '#9e9e9e'}], 480);
  }
}

function setLock(locked) {
  $('#lock').parentElement.classList.toggle('edited', ($('#lock').defaultChecked !== locked));
  if (locked) {
    $('#lock').parentElement.MaterialCheckbox.check();
  } else {
    $('#lock').parentElement.MaterialCheckbox.uncheck();
  }
}

function toUint8Array(value) {
  return Array.prototype.slice.call(new Uint8Array(value.buffer));
}

const URL_SCHEMES = [
  'http://www.',
  'https://www.',
  'http://',
  'https://'
];

const URL_CODES = [
  '.com/',
  '.org/',
  '.edu/',
  '.net/',
  '.info/',
  '.biz/',
  '.gov/',
  '.com',
  '.org',
  '.edu',
  '.net',
  '.info',
  '.biz',
  '.gov'
];

function decodeURL(value) {
  var url = URL_SCHEMES[value.getUint8(0)];
  for (var i = 1; i < value.byteLength; i++) {
    var s = String.fromCharCode(value.getUint8(i));
    url +=
      (value.getUint8(i) < URL_CODES.length)
        ? URL_CODES[value.getUint8(i)]
        : s;
  }
  return(url);
}

function encodeURL(url) {
  let encodedUrl = [];
  let position = 0;
  let encoder = new TextEncoder('utf-8');

  for (let i = 0 ; i < URL_SCHEMES.length; i++) {
    if (url.startsWith(URL_SCHEMES[i])) {
      encodedUrl.push(i);
      position = URL_SCHEMES[i].length;
      break;
    }
  }

  while (position < url.length) {
    let initialPosition = position;
    for (let i = 0; i < URL_CODES.length; i++) {
      if (url.startsWith(URL_CODES[i], position)) {
        encodedUrl.push(i);
        position += URL_CODES[i].length;
        break;
      }
    }
    if (initialPosition === position) {
      encodedUrl.push(encoder.encode(url[position])[0]);
      position++;
    }
  }
  return encodedUrl;
}

function getEncodedUrl(string) {
  return new Promise(function(resolve, reject) {
    try {
      var url = new URL(string);
    } catch(e) {
      reject(e);
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      reject('Only http and https URLs can be encoded.');
    }

    var encoded = encodeURL(string);
    if (encoded.length > 18) {
      return getShortUrl(string)
      .then(newString => {
        ga('send', 'event', 'GetShortUrlOutcome', 'success');
        resolve([encodeURL(newString), true /* shortened */]);
      })
      .catch(e => {
        ga('send', 'event', 'GetShortUrlOutcome', 'fail', e);
        reject('URL is too long. Please use a shortener.');
      })
    } else {
      resolve([encoded, false /* non shortened */]);
    }
  });
};

function getShortUrl(url) {
  ga('send', 'event', 'GetShortUrl', 'background');
  const apiUrl = 'https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyCswhXTLkWtSysl0ntTIlqsiLVdvfvEc8k';
  var options = {
    method: 'post',
    headers: { "Content-type": "application/json" },
    body: JSON.stringify({longUrl: url})
  };

  return fetch(apiUrl, options)
  .then(function(response) {
    if (response.status === 200) {
      return response.json();
    } else {
      return Promise.reject(new Error(response.statusText));
    }
  })
  .then(data => data.id)
}

function getLongUrl(url) {
  var apiUrl = 'https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyCswhXTLkWtSysl0ntTIlqsiLVdvfvEc8k&shortUrl=' + url;

  return fetch(apiUrl)
  .then(function(response) {
    if (response.status === 200) {
      return response.json();
    } else {
      return Promise.reject(new Error(response.statusText));
    }
  })
  .then(data => {
    if (data.status === 'OK') {
      return data.longUrl;
    } else {
      return Promise.reject(new Error(data.status));
    }
  });
}

$('#flag') && $('#flag').addEventListener('click', function() {
  ga('send', 'event', 'FlagLink', 'click');
  var range = document.createRange();
  range.selectNode(flag);
  window.getSelection().addRange(range);
  try {
    if (document.execCommand('copy')) {
      $('#snackbar').MaterialSnackbar.showSnackbar({message: 'Link copied.'});
    }
  } catch(err) {
    // User will have to do it manually...
  }
});

$('#physicalWebLink').addEventListener('click', function() {
  ga('send', 'event', 'PhysicalWebLink', 'click');
});
