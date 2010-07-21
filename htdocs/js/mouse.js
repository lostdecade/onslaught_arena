(function define_horde_Mouse () {

horde.Mouse = function () {
	this.buttonStates = {};
	this.mouseX = 0;
	this.mouseY = 0;
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
	this.mouseX = e.clientX;
	this.mouseY = e.clientY;
};

proto.handleMouseDown = function (e) {
	this.buttonStates[e.button] = true;
};

proto.handleMouseUp = function (e) {
	this.buttonStates[e.button] = false;
};

proto.isButtonDown = function (button) {
	return this.buttonStates[button];
};

}());
