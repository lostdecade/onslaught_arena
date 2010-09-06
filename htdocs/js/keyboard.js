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
		case Keyboard.Keys.ENTER:
		case Keyboard.Keys.LEFT:
		case Keyboard.Keys.UP:
		case Keyboard.Keys.RIGHT:
		case Keyboard.Keys.DOWN:
		case Keyboard.Keys.B:
		case Keyboard.Keys.A:
		case Keyboard.Keys.M:
		case Keyboard.Keys.Z:
		case Keyboard.Keys.X:
		case Keyboard.Keys.P:
		case Keyboard.Keys.SPACE:
		case Keyboard.Keys.W:
		case Keyboard.Keys.S:
		case Keyboard.Keys.D:
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
