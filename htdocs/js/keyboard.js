(function () {

horde.Keyboard = function () {
	this.history = [];
	this.keyStates = {};
	this.lastKeyStates = {};
	horde.on("keydown", this.handleKeyDown, window, this);
	horde.on("keyup", this.handleKeyUp, window, this);
};

var Keyboard = horde.Keyboard;
var proto = Keyboard.prototype;

var Keys = {
	ESCAPE: 27,
	ENTER: 13,
	SPACE: 32,
	LEFT: 37,
	UP: 38,
	RIGHT: 39,
	DOWN: 40,
	A: 65,
	B: 66,
	D: 68,
	M: 77,
	P: 80,
	S: 83,
	W: 87,
	X: 88,
	Z: 90
};
Keyboard.Keys = Keys;

Keyboard.konamiCode = [
	Keys.UP,
	Keys.UP,
	Keys.DOWN,
	Keys.DOWN,
	Keys.LEFT,
	Keys.RIGHT,
	Keys.LEFT,
	Keys.RIGHT,
	Keys.B,
	Keys.A
];

Keyboard.debugCode = [
	76, // L
	68, // D
	68, // D
	69, // E
	66, // B
	85, // U
	71 // G
];

Keyboard.resetCode = [
	76, // L
	68, // D
	82, // R
	69, // E
	83, // S
	69, // E
	84 // T
];

proto.supressKeys = function (e) {
	switch (e.keyCode) {
		// Note: intentional fallthroughs.
		case Keys.ENTER:
		case Keys.LEFT:
		case Keys.UP:
		case Keys.RIGHT:
		case Keys.DOWN:
		case Keys.B:
		case Keys.A:
		case Keys.M:
		case Keys.Z:
		case Keys.X:
		case Keys.P:
		case Keys.SPACE:
		case Keys.W:
		case Keys.S:
		case Keys.D:
			horde.stopEvent(e);
			break;
	}
};

proto.handleKeyDown = function (e) {
	this.history.push(e.keyCode);
	this.keyStates[e.keyCode] = true;
	this.supressKeys(e);
};

proto.handleKeyUp = function (e) {
	this.keyStates[e.keyCode] = false;
	this.supressKeys(e);
};

proto.isKeyDown = function (keyCode) {
	return (this.keyStates[keyCode] === true);
};

proto.isKeyPressed = function (keyCode) {
	return (this.isKeyDown(keyCode) && this.lastKeyStates[keyCode] !== true);
};

proto.isAnyKeyPressed = function (keyCode) {
	for (var keyCode in this.keyStates) {
		if (this.isKeyDown(keyCode) && this.lastKeyStates[keyCode] !== true) {
			return true;
		}
	}
	return false;
};

proto.clearKey = function (keyCode) {
	this.keyStates[keyCode] = false;
};

proto.clearKeys = function (keyCode) {
	this.keyStates = {};
};

proto.clearHistory = function () {
	this.history = [];
};

proto.historyMatch = function (keys) {
	var len = keys.length;
	var toCheck = this.history.slice(-len);
	if (toCheck.length !== len) {
		return false;
	}
	for (var x = 0; x < len; x++) {
		if (keys[x] !== toCheck[x]) {
			return false;	
		}
	}
	return true;
};

proto.storeKeyStates = function () {
	for (var keyCode in this.keyStates) {
		this.lastKeyStates[keyCode] = this.keyStates[keyCode];
	}
};
	
}());
