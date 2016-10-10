/*
gattInterface.js

Manages the web bluetooth interface with the vending machine
*/


function GattInterface(brain) {

	var self = this;
	var modalIsCanceled = false;
	var vendingMachine = document.querySelector('platinum-bluetooth-device');
	var dispenseItem = document.querySelector('platinum-bluetooth-characteristic');

	self.init = function() {
		// Make sure web bluetooth is available
		if (self.checkIfWebBluetoothIsEnabled() == true) {
			// Show the modal that asks users to connect to the vending machine
			self.initConnectModal();
		} else {
			// Otherwise tell them that web bluetooth isn't available
			brain.getVendingManager().showToast('Web Bluetooth is not enabled');
		}
	};

	// Check to see whether we can use web bluetooth
	self.checkIfWebBluetoothIsEnabled = function() {
		return vendingMachine.supported;
	}

	// Setup the modal that will ask the user if they want to connect to
	// the vending machine
	self.initConnectModal = function() {
		// Reference the modal button
		var connectModal = document.querySelector('#connectModal');
		connectModal.addEventListener('opened-changed', function(event) {
			// If it is closed and user hit dialog-confirm element
			if(!connectModal.opened && connectModal.closingReason.confirmed) {
				// Look for the vending machine advertisement broadcast
				self.findVendingMachine();
			}
		});

		// Show the modal to the user
		connectModal.open();
	};

	// Ask web bluetooth to find the vending machine
	self.findVendingMachine = function() {
		console.log('findVendingMachine')

		// Look for the vending machine
		vendingMachine.request()
		  .then(function(device) {
		  	console.log('found device:', device);
		  	// Tell the vending machine manager about it
		  	brain.getVendingManager().onVendingMachineFound();
		  });
	};

	// Determine if the vending machine has yet been found
	self.checkIfHaveFoundVendingMachine = function() {
		if (vendingMachine.device != null) {
			return true;
		}
		return false;
	}

	// Dispense candy from the vending machine
	// We connect, get the gatt characteristic for dispensing candy
	// then disconnect, so that other clients can connect when we are done
	// so that we don't perist the connection and denial of service other users
	self.dispenseItem = function() {
		console.log('dispenseItem');

		// If we haven't found the vending machine
		if (self.checkIfHaveFoundVendingMachine() === false) {
			// Try to find it again and exit here
			self.findVendingMachine();
			return;
		}

		// Write the dispense candy value to the characteristic
		var newValue = 1;
		dispenseItem.write(new Uint8Array([newValue]))
		.then(function() {
			console.log('dispense item charateristic write:', newValue, 'success!');
		})
		.catch(function(error) {
			console.log(error);
		})
		.then(function() {
			// Disconnect since we are done
			// This allows other client to connect to the gatt server
			//vendingMachine.disconnect();
		});
	};


	self.init();
}


