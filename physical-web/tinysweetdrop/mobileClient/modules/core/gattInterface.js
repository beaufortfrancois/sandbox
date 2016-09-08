/*
gattInterface.js

Manages the web bluetooth interface with the vending machine
*/


function GattInterface(brain) {

	var self = this;
	var modalIsCanceled = false;
	var VENDING_SERVICE_UUID = '0000feaa-0000-1000-8000-00805f9b34fb';
	var DISPENSE_ITEM_CHARACTERISTIC_UUID = '0000feaa-0000-2000-8000-00805f9b34fb';
	var vendingMachineBluetoothDevice = null;
	var vendingMachineGattServer = null;
	var vendingMachineDispenseItemGattCharacteristic = null;
	var VENDING_MACHINE_BLE_NAME = 'CANDY BOT 9000';

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
		// Check if it listed in the navigator object
		if (navigator.bluetooth == undefined) {
			return false;
		} 
		return true;
	}

	// Setup the modal that will ask the user if they want to connect
	// to the vending machine
	self.initConnectModal = function() {
    	var modalIsCanceled = false;
    	// Reference the modal and cancel button
		var connectModal = document.querySelector('#connectModal');
    	var connectModalCancelButton = document.querySelector('#connectModalCancelButton');
    	// Listen for a touch event on the cancel button
    	connectModalCancelButton.addEventListener('touchstart', function() {
    		// Save that the modal was canceled
    		modalIsCanceled = true;
    	})
    	// Listen for when the modal is closed
    	// which can happen if the user touches away from the modal
		connectModal.addEventListener('iron-overlay-closed', function(event) {
			// If the modal was canceled then exit
	      	if (modalIsCanceled == true) {
	        	return;
	      	}
	      	// Otherwise look for the vending machine advertisement broadcast
			self.findVendingMachine();
		});

		// Show the modal to the user
		connectModal.open();
	};

	// Ask web bluetooth to find the vending machine
	self.findVendingMachine = function() {
		console.log('findVendingMachine')

		// Look for a device with the given name and services
		navigator.bluetooth.requestDevice({
		  //filters: [{services: [VENDING_SERVICE_UUID]}]
		  filters: [{name: VENDING_MACHINE_BLE_NAME}],
		  optionalServices: [VENDING_SERVICE_UUID]
		  }).then(function(device) {
		  	// Save a reference to the device
		  	console.log('found device:', device);
		  	vendingMachineBluetoothDevice = device;
		  	// Tell the vending machine manager about it
		  	brain.getVendingManager().onVendingMachineFound();
		  });
	};

	// Determine if the vending machine has yet been found
	self.checkIfHaveFoundVendingMachine = function() {
		if (vendingMachineBluetoothDevice != null) {
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
		if (vendingMachineBluetoothDevice == null) {
			// Try to find it again and exit here
			self.findVendingMachine();
			return;
		}

		// Connect to the vending machine gatt server
		vendingMachineBluetoothDevice.connectGATT().then(function(bluetoothGattRemoteServer) {
			if (bluetoothGattRemoteServer != null) {
				console.log('found gatt server:', bluetoothGattRemoteServer);
				// Save a reference to the gatt server
				vendingMachineGattServer = bluetoothGattRemoteServer;
				return vendingMachineGattServer.getPrimaryService(VENDING_SERVICE_UUID);
			} else {
				console.log('error:  could not connect to gatt server');
			}
		}).then(function(bluetoothGattService) {
			if (bluetoothGattService != null) {
				console.log('connected to gatt service:', bluetoothGattService);
				return Promise.all([bluetoothGattService.getCharacteristic(DISPENSE_ITEM_CHARACTERISTIC_UUID)]);
			} else {
				console.log('error:  could not connect to gatt service');
			}
		}).then(function(bluetoothGattCharacteristics) {
			if (bluetoothGattCharacteristics != null) {
				if (bluetoothGattCharacteristics.length > 0) {
					// Get the dispense candy characteristic
					vendingMachineDispenseItemGattCharacteristic = bluetoothGattCharacteristics[0];
					console.log('found gatt characteristic:', vendingMachineDispenseItemGattCharacteristic);
					// Write the dispense candy value to the characteristic
					var newValue = 1;
					var valueArray = new Uint8Array(1);
					valueArray[0] = newValue;
					vendingMachineDispenseItemGattCharacteristic.writeValue(valueArray).then(function() {
						console.log('dispense item charateristic write:', newValue, 'success!');
						// Disconnect since we are done
						// This allows other client to connect to the gatt server
						vendingMachineGattServer.disconnect();
					});
				}
			} else {
				console.log('error:  could not find gatt characteristics');
			}
		});
	};


	self.init();
}


