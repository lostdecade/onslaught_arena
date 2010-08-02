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

Keyboard.Keys = {
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

Keyboard.konamiCode = [
	Keyboard.Keys.UP,
	Keyboard.Keys.UP,
	Keyboard.Keys.DOWN,
	Keyboard.Keys.DOWN,
	Keyboard.Keys.LEFT,
	Keyboard.Keys.RIGHT,
	Keyboard.Keys.LEFT,
	Keyboard.Keys.RIGHT,
	Keyboard.Keys.B,
	Keyboard.Keys.A
];

proto.supressKeys = function (e) {
	switch (e.keyCode) {
		// Note: intentional fallthroughs.
		case 37: // left
		case 38: // up
		case 39: // right 
		case 40: // down 
		case 66: // B
		case 65: // A
		case 77: // M
		case 90: // Z
		case 88: // Z
		case 80: // P
		case 32: // space
		case 87: // W
		case 83: // S
		case 68: // D
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
