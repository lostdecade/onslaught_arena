(function define_horde_Mouse () {

horde.Mouse = function (canvas) {
	this.buttonStates = {};
	this.mouseX = 0;
	this.mouseY = 0;
	this.canvas = canvas;
	this.lastButtonStates = {};
	horde.on("mousemove", this.handleMouseMove, window, this);
	horde.on("mousedown", this.handleMouseDown, window, this);
	horde.on("mouseup", this.handleMouseUp, window, this);
};

var Mouse = horde.Mouse;
var proto = Mouse.prototype;

Mouse.Buttons = {
	LEFT: 0,
	RIGHT: 2
};

proto.handleMouseMove = function (e) {
	var offset = horde.getOffset(this.canvas);
	this.mouseX = (((e.clientX - offset.x) * 640) / this.canvas.offsetWidth);
	this.mouseY = (((e.clientY - offset.y) * 480) / this.canvas.offsetHeight);
	this.hasMoved = true;
};

proto.handleMouseDown = function (e) {
	this.buttonStates[e.button] = true;
	horde.stopEvent(e);
	if (window.focus) window.focus();
};

proto.handleMouseUp = function (e) {
	this.buttonStates[e.button] = false;
};

proto.isButtonDown = function (button) {
	return this.buttonStates[button];
};

proto.isAnyButtonDown = function () {
	for (var key in this.buttonStates) {
		if (this.buttonStates[key]) {
			return true;
		}
	}

	return false;
};

proto.clearButtons = function () {
	this.buttonStates = {};
};

proto.wasButtonClicked = function (button) {
	return (this.buttonStates[button] && !this.lastButtonStates[button]);
};

proto.storeButtonStates = function () {
	for (var key in this.buttonStates) {
		this.lastButtonStates[key] = this.buttonStates[key];
	}
};

}());
