(function define_horde_Object () {

/**
 * Horde Game Object
 * @constructor
 */
horde.Object = function () {
	this.id = "";
	this.position = new horde.Vector2();
	this.size = new horde.Size(32, 32);
	this.direction = new horde.Vector2();
	this.facing = new horde.Vector2(0, 1);
	this.speed = 100;
	this.color = "rgb(50, 50, 50)";
	this.ownerId = "";
	this.team = null;
	this.hitPoints = 1;
	this.wounds = 0;
	this.damage = 1;
	this.spriteSheet = "";
	this.spriteX = 0;
	this.spriteY = 0;
	this.animated = false;
	this.animFrameIndex = 0;
	this.animDelay = 200;
	this.animElapsed = 0;
	this.state = "alive";
	this.angle = 0;
	this.rotateSpeed = 400;
	this.rotate = false; // initially rotate the sprite based on direction/facing
	this.spin = false; // continually rotate the sprite (rocks/axes)
};

var proto = horde.Object.prototype;

/**
 * Runs any initialization
 * @return {void}
 */
proto.init = function horde_Object_proto_init () {
	if (this.rotate) {
		this.angle = (horde.directions.fromVector(this.facing) * 45);
	}
	if (this.spin) {
		this.angle = horde.randomRange(0, 359);
	}
	this.execute("onInit");
};

/**
 * Update this object
 * @param {number} elapsed Elapsed time in milliseconds since last update
 * @return {void}
 */
proto.update = function horde_Object_proto_update (elapsed) {
	if (this.animated) {
		this.animElapsed += elapsed;
		if (this.animElapsed >= this.animDelay) {
			this.animElapsed = 0;
			this.animFrameIndex++;
			if (this.animFrameIndex > 1) {
				this.animFrameIndex = 0;
			}
		}
	}
	if (this.spin) {
		this.angle += ((this.rotateSpeed / 1000) * elapsed);
	}
	this.execute("onUpdate", [elapsed]);
};

/**
 * Returns the XY coordinates of this objects sprite
 * @return {horde.Vector2} XY coordinates of sprite to draw
 */
proto.getSpriteXY = function horde_Object_proto_getSpriteXY () {
	if (this.animated) {
		var offset = horde.directions.fromVector(this.facing.clone());
		return new horde.Vector2(
			((offset * 2) + this.animFrameIndex) * this.size.width,
			this.spriteY
		);
	} else {
		return new horde.Vector2(this.spriteX, this.spriteY);
	}
};

/**
 * Returns the bounding box for this object
 * @return {horde.Rect} Rectangle representing the bounding box
 */
proto.boundingBox = function horde_Object_proto_boundingBox () {
	return new horde.Rect(
			this.position.x, this.position.y,
			this.size.width - 1, this.size.height - 1);
};

/**
 * Centers this object on a point
 * @param {horde.Vector2} v Vector to center on
 * @return {void}
 */
proto.centerOn = function horde_Object_proto_centerOn (v) {
	this.position = v.subtract(horde.Vector2.fromSize(this.size).scale(0.5));
};

/**
 * Deal some damage (or wound) this object
 * @param {number} damage The amount of damage to deal
 * @return {void}
 */
proto.wound = function horde_Object_proto_wound (damage) {
	this.wounds += damage;
	if (this.wounds >= this.hitPoints) {
		this.die();
	}
};

/**
 * Causes this object to die. Do not pass go, do not collect $200.
 * @return {void}
 */
proto.die = function horde_Object_proto_die () {
	this.state = "dead";
};

/**
 * Handles when this object collides with a wall
 * @param {array} axis Array of axes where collision occurred (x, y)
 * @return {void}
 */
proto.wallCollide = function horde_Object_proto_wallCollide (axis) {
	switch (this.role) {
		case "projectile":
			// Projectiles "die" when they hit walls
			this.die();
			break;
		case "monster":
			// reverse direction(s)
			var d = this.direction.clone();
			for (var i in axis) {
				d[axis[i]] *= -1;
			}
			this.setDirection(d);
			break;
	}
	this.execute("onWallCollide");
};

/**
 * Sets the direction (and facing) for this object
 * @param {horde.Vector2} v Vector representing the direction
 * @return {void}
 */
proto.setDirection = function horde_Object_proto_setDirection (v) { 
	if (v.x === 0 && v.y === 0) {
		this.stopMoving();
	} else {
		this.direction = v;
		this.facing = this.direction.clone();
	}
};

/**
 * Stops this object from moving (resets direction vector to zero)
 * @return {void}
 */
proto.stopMoving = function horde_Object_proto_stopMoving () {
	this.direction.zero();
};

/**
 * Executes a method that may or may not exist
 * @param {string} method Method to call
 * @param {array} args Array of arguments
 * @return {void}
 */ 
proto.execute = function horde_Object_proto_execute (method, args) {
	if (this[method]) {
		this[method].apply(this, args);
	}
};

}());
