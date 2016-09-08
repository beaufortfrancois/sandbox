/*
vendingManager.js

Manages the ui and logic for allowing the user
to choose candy that they want the vending machine to dispense
*/


function VendingManager(brain) {
	
	var self = this;
	var DISPENSE_ITEM_DURATION = 1000;//500;
	var AUTHORIZE_PAYMENT_DURATION = 3000;
	var DELAY_BEFORE_DISPENSING_ITEM = 5000;
	var paymentAuthorizingText;
	var toast;

	self.init = function() {
		paymentAuthorizingText = document.querySelector('#paymentAuthorizingText');
		toast = document.querySelector('#toast');
		self.initDispenseItemButton();
		self.initVendImage();
	};

	// Initialize the dispense candy button
	self.initDispenseItemButton = function() {
		// Listen for click events on the button
		document.querySelector('#dispenseItemButton').addEventListener('click', self.onDispenseItemButtonClick);
	};

	// Initialize the vending machine image
	self.initVendImage = function() {
		// Start off the image at low opacity to indicate that
		// we have not yet discovered the vending machine via web bluetooth
		// Once it is discovered, then we set the image to full opacity
		TweenLite.set('#vendImage', {opacity: .2});
	};

	
	///////////////////////////////
	// callbacks
	///////////////////////////////

	// Fires when the vending machine was found by web bluetooth
	self.onVendingMachineFound = function() {
		// Set the vending machine image to full opacity
		TweenLite.to('#vendImage', .6, {
			opacity: 1,
			ease: Quint.easeOut
		});
	};

	// Fires when the dispense item button was clicked
	self.onDispenseItemButtonClick = function(event) {
		// If the vending machine has already been found
		if (brain.getGattInterface().checkIfHaveFoundVendingMachine() == true) {
			// Tell it to dispense candy
			brain.getGattInterface().dispenseItem();
		} else {
			// Otherwise inform the user that we couldn't find the vending machine
			self.showToast('Cannot find vending machine')
			return;
		}
	}

	// Fires when the payment has been authorized
	// Note: we do not use this anymore
	self.onPaymentAuthorized = function() {
		TweenLite.to(paymentAuthorizingText, .6, {
			opacity: 0,
			ease: Quint.easeOut,
		});
		toast.open();
		setTimeout(self.dispenseItem, DELAY_BEFORE_DISPENSING_ITEM);
	};


	///////////////////////////////
	// utilities
	///////////////////////////////

	// Simulate payment authorization
	// Note: we do not use this anymore
	self.authorizePayment = function() {
		TweenLite.to(paymentAuthorizingText, .6, {
			opacity: 1,
			ease: Quint.easeOut,
		});
		setTimeout(self.onPaymentAuthorized, AUTHORIZE_PAYMENT_DURATION);
	};

	// Tell the vending machine to dispense candy
	self.dispenseItem = function() {
		brain.getGattInterface().setDispenseItemGattCharacteristicValue(1);
	};

	// Show the toast with the given toast text
	self.showToast = function(toastText) {
		toast.text = toastText;
		toast.open();
	}


	self.init();
}