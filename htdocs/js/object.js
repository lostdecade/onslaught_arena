(function define_horde_Object () {

/**
 * @constructor
 */
horde.Object = function () {
	this.id = "";
	this.position = new horde.Vector2();
	this.size = new horde.Size(32, 32);
	this.direction = new horde.Vector2();
	this.facing = new horde.Vector2(0, 1);
	this.speed = 100;
	this.color = "rgb(0, 0, 255)";
	this.ownerId = "";
	this.team = null;

	this.hitPoints = 1;
	this.wounds = 0;
	this.damage = 1;
};

horde.Object.prototype.boundingBox = function () {
	return new horde.Rect(
			this.position.x, this.position.y,
			this.size.width - 1, this.size.height - 1);
};

horde.Object.prototype.centerOn = function (v) {
	this.position = v.subtract(horde.Vector2.fromSize(this.size).scale(0.5));
};

horde.Object.prototype.setDirection = function (v) {
	this.direction = v;
	this.facing = this.direction.clone();
};

horde.Object.prototype.stop = function () {
	this.direction.zero();
};

horde.Object.prototype.think = function (objects) {

	if (this.id === "o1" || this.ownerId === "o1") {
		return;
	}

	// move towards the player
	
	// don't clump too much on other units

	// chase object "o1" (aka the hero)
	var target = objects["o1"];
	var move = target.boundingBox().center().subtract(this.position).normalize();
	this.setDirection(move);
	return;
	
	/*
	// Switch to a random direction 5% of the time
	if (horde.randomRange(1, 100) === 1) {
		var x = horde.randomRange(-1, 1);
		var y = horde.randomRange(-1, 1);
		this.setDirection(new horde.Vector2(x, y));
	}
	*/
	
};

}());
