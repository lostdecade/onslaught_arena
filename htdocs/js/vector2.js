(function define_horde_Vector2 () {

/**
 * Object for dealing with 2D vectors
 * @param {number} x X value
 * @param {number} y Y value
 * @constructor
 */
horde.Vector2 = function horde_Vector2 (x, y) {
	this.x = Number(x) || 0;
	this.y = Number(y) || 0;
};

var Vector2 = horde.Vector2;
var proto = Vector2.prototype;

/**
 * Creates a vector from a horde.Size object
 * @param {horde.Size} size Size
 * @return {horde.Vector2} Vector representation of a size
 */
Vector2.fromSize = function horde_Vector2_fromSize (size) {
	return new horde.Vector2(size.width, size.height);
};

/**
 * Clones this vector
 * @return {horde.Vector2} A clone of this vector
 */
proto.clone = function horde_Vector2_proto_clone () {
	return new horde.Vector2(this.x, this.y);
};

/**
 * Scales this vector by a number
 * @param {number} n Number to scale this vector by
 * @return {horde.Vector2} This vector scaled by n
 */
proto.scale = function horde_Vector2_proto_scale (n) {
	this.x *= n;
	this.y *= n;
	return this;
};

proto.add = function horde_Vector2_proto_add (b) {
	this.x += b.x;
	this.y += b.y;
	return this;
};

proto.subtract = function horde_Vector2_proto_subtract (b) {
	this.x -= b.x;
	this.y -= b.y;
	return this;
};
	
proto.zero = function horde_Vector2_proto_zero () {
	this.x = 0;
	this.y = 0;
	return this;
};

proto.invert = function horde_Vector2_proto_invert () {
	this.x *= -1;
	this.y *= -1;
	return this;
};

proto.magnitude = function horde_Vector2_proto_magnitude () {
	return Math.sqrt(this.x * this.x + this.y * this.y);
};

proto.normalize = function horde_Vector2_proto_normalize () {
	return this.scale(1 / this.magnitude());
};

proto.toString = function horde_Vector2_proto_toString () {
	return this.x + ", " + this.y;
};

proto.floor = function horde_Vector2_proto_floor () {
	this.x = Math.floor(this.x);
	this.y = Math.floor(this.y);
	return this;
};
	
}());
