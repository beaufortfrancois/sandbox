/*
brain.js

Top level manager who creates the singletons
that manage all core logic in the app
*/

function Brain() {
	
	var self = this;
	var gattInterface;
	var vendingManager;
	
	self.init = function() {
		vendingManager = new VendingManager(self);
		gattInterface = new GattInterface(self);
	};


	///////////////////////////
 	// accessors
 	///////////////////////////

 	self.getVendingManager = function() { return vendingManager; };
	self.getGattInterface = function() { return gattInterface; };


	self.init();
}



















