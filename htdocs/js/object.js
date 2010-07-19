(function define_horde_Object () {

/**
 * Horde Game Object
 * @constructor
 */
horde.Object = function () {
	this.id = ""; // Object ID
	this.ownerId = null; // Owner object ID
	this.position = new horde.Vector2(); // Object's position on the map
	this.size = new horde.Size(32, 32); // Size of the object
	this.direction = new horde.Vector2(); // Direction the object is moving
	this.facing = new horde.Vector2(0, 1); // Direction the object is facing
	this.speed = 100; // The speed at which the object moves
	this.team = null; // Which "team" the object is on (null = neutral)
	this.hitPoints = 1; // Hit points
	this.wounds = 0; // Amount of damage object has sustained
	this.damage = 1; // Amount of damage object deals when colliding with enemies
	this.spriteSheet = ""; // Sprite sheet where this object's graphics are found
	this.spriteX = 0; // X location of spirte
	this.spriteY = 0; // Y location of sprite
	this.spriteAlign = false; // Align sprite with facing
	this.animated = false; // Animated or not
	this.animFrameIndex = 0; // Current animation frame to display
	this.animDelay = 200; // Delay (in milliseconds) between animation frames
	this.animElapsed = 0; // Elapsed time (in milliseconds) since last animation frame increment
	this.angle = 0; // Angle to draw this object
	this.rotateSpeed = 400; // Speed at which to rotate the object
	this.rotate = false; // Enable/disable rotation of object
	this.worth = 0; // Amount of gold this object is worth when killed
	this.gold = 0; // Amount of gold this object has earned
	this.ttl = 0; // How long (in milliseconds) this object *should* exist (0 = no TTL)
	this.ttlElapsed = 0; // How long (in milliseconds) this object *has* existed
	this.alpha = 1; // Alpha value for drawing this object
	this.alphaMod = 1; // Alpha modifier (fadin [1] vs fadeout [-1])
	this.gibletSize = "small"; // Size of giblets to spawn when this objects "dies"
	this.cooldown = false; // Whether or not the object's attack is on cooldown
	this.cooldownElapsed = 0; // How long the object's attack has been on cooldown
	this.autoFire = false; // Enable/disable auto fire
	this.soundAttacks = null; // Sound to play when object attacks
	this.soundDamage = null; // Sound to play when object takes damage
	this.soundDies = null; // Sound to play when object dies
	this.alive = true;
	this.states = [];
	this.addState(horde.Object.states.IDLE);
	this.currentWeaponIndex = 0;
};

horde.Object.states = {
	IDLE: 0,
	MOVING: 1,
	ATTACKING: 2,
	HURTING: 3,
	DYING: 4,
	INVINCIBLE: 5
};

var proto = horde.Object.prototype;

proto.updateStates = function () {
	for (var x in this.states) {
		var s = this.states[x];
		if (s.timer.expired()) {
			if (s.type === horde.Object.states.INVINCIBLE) {
				this.alpha = 1;
				this.alphaMod = -1;
			}
			delete(this.states[x]);
			continue;
		}
	}
};

proto.hasState = function (state) {
	for (var x in this.states) {
		if (this.states[x].type === state) {
			return true;
		}
	}
	return false;
};

proto.addState = function (state, ttl) {
	if (this.hasState(state)) {
		return false;
	}
	var t = new horde.Timer();
	t.start(ttl);
	this.states.push({
		type: state,
		timer: t
	});
};

/**
 * Runs any initialization
 * @return {void}
 */
proto.init = function horde_Object_proto_init () {
	this.execute("onInit");
	if (this.spriteAlign) {
		this.angle = (horde.directions.fromVector(this.facing) * 45);
	}
	if (this.rotate) {
		this.angle = horde.randomRange(0, 359);
	}
	if (this.animated) {
		this.animElapsed = horde.randomRange(0, this.animDelay);
	}
};

/**
 * Causes this object to die. Do not pass go, do not collect $200.
 * @return {void}
 */
proto.die = function horde_Object_proto_die () {
	this.alive = false;
};

/**
 * Returns whether or not this object is "dead" (this.alive === false)
 * @return {boolean} True if the object is dead; otherwise false
 */
proto.isDead = function horde_Object_proto_isDead () {
	return !this.alive;
}

/**
 * Update this object
 * @param {number} elapsed Elapsed time in milliseconds since last update
 * @return {void}
 */
proto.update = function horde_Object_proto_update (elapsed) {
	
	this.updateStates();
	
	if (this.hasState(horde.Object.states.DYING)) {
		if (this.deathTimer.expired()) {
			this.deathFrameIndex++;
			this.deathTimer.reset();
			if (this.deathFrameIndex > 2) {
				this.deathFrameIndex = 2;
				this.ttl = 1500;
			}
		}
	}
	
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
	
	if (this.hasState(horde.Object.states.INVINCIBLE)) {
		this.alpha += ((10  / 1000) * elapsed) * this.alphaMod;
		if (this.alpha >= 1) {
			this.alpha = 1;
			this.alphaMod = -1;
		}
		if (this.alpha <= 0) {
			this.alpha = 0;
			this.alphaMod = 1;
		}
	}
	
	if (this.rotate) {
		this.angle += ((this.rotateSpeed / 1000) * elapsed);
	}
	if (this.ttl > 0) {
		this.ttlElapsed += elapsed;
		if (this.ttl - this.ttlElapsed <= 1000) {
			this.alpha -= ((1 / 1000) * elapsed);
		}
		if (this.ttlElapsed >= this.ttl) {
			this.die();
		}
	}
	if (this.cooldown === true) {
		this.cooldownElapsed += elapsed;
		var wepInfo = this.getWeaponInfo();
		var wep = horde.objectTypes[wepInfo.type];
		if (this.cooldownElapsed >= wep.cooldown) {
			this.cooldown = false;
			this.cooldownElapsed = 0;
		}
	}
	
	if (this.hasState(horde.Object.states.DYING)) {
		// Don't proceed with calling any AI behavior if this thing is dying...
		return;
	}
	
	return this.execute("onUpdate", arguments);
};

/**
 * Returns the XY coordinates of this objects sprite
 * @return {horde.Vector2} XY coordinates of sprite to draw
 */
proto.getSpriteXY = function horde_Object_proto_getSpriteXY () {
	if (this.animated) {
		if (this.hasState(horde.Object.states.DYING)) {
			return new horde.Vector2(
				(17 + this.deathFrameIndex) * this.size.width, this.spriteY
			);
		}
		if (this.hasState(horde.Object.states.HURTING) && this.size.width <= 32) {
			return new horde.Vector2(
				16 * this.size.width, this.spriteY
			);
		}
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
 * @return {boolean} True if the object has died; otherwise false
 */
proto.wound = function horde_Object_proto_wound (damage) {
	this.wounds += damage;
	if (this.role === "monster" || this.role === "hero") {
		this.addState(horde.Object.states.HURTING, 300);
	}
	if (this.wounds >= this.hitPoints) {
		this.wounds = this.hitPoints;
		if (this.role === "monster" || this.role === "hero") {
			this.addState(horde.Object.states.DYING);
			this.deathFrameIndex = 0;
			this.deathTimer = new horde.Timer();
			this.deathTimer.start(200);
		} else {
			this.die();
		}
		if (this.role === "hero") {
			horde.sound.stopAll();
		}
		if (this.soundDies) {
			horde.sound.play(this.soundDies);
		}
		return true;
	}
	if (this.soundDamage) {
		horde.sound.play(this.soundDamage);
	}
	return false;
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
 * "Chases" another object by setting this objects direction toward another
 * @return {void}
 */
proto.chase = function horde_Object_proto_chase (object) {
	var direction = object.position.clone().subtract(this.position).normalize();
	this.setDirection(direction);
};

/**
 * Returns if this object is moving or not
 * @return {boolean} True if the object is moving, otherwise false
 */
proto.isMoving = function horde_Object_proto_isMoving () {
	if (this.hasState(horde.Object.states.DYING)) {
		return false;
	}
	return (this.direction.x !== 0 || this.direction.y !== 0);
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
		return this[method].apply(this, args);
	}
};

/**
 * Returns the weapon info for this object's current weapon
 * @return {object} Weapon info (type & count)
 */
proto.getWeaponInfo = function horde_Object_proto_getWeaponInfo () {
	var len = this.weapons.length;
	if (len >= 1) {
		// Object has at least one weapon
		if (this.currentWeaponIndex < 0) {
			this.currentWeaponIndex = 0;
		}
		if (this.currentWeaponIndex > len - 1) {
			this.currentWeaponIndex = len - 1;
		}
		return this.weapons[this.currentWeaponIndex];
	}
	return false;
};

proto.addWeapon = function horde_Object_proto_addWeapon (type, count) {
	for (var x in this.weapons) {
		var w = this.weapons[x]; // Haha, Weapon X
		if (typeof(w) !== "undefined" && w.type === type) {
			if (w.count !== null) {
				w.count += count;
			}
			return true;
		}
	}
	var len = this.weapons.push({
		type: type,
		count: count
	});
	this.currentWeaponIndex = (len - 1);
};

proto.cycleWeapon = function horde_Object_proto_cycleWeapon (reverse) {
	var len = this.weapons.length;
	if (reverse === true) {
		this.currentWeaponIndex--;
		if (this.currentWeaponIndex < 0) {
			this.currentWeaponIndex = len - 1;
		}
	} else {
		this.currentWeaponIndex++;
		if (this.currentWeaponIndex > len - 1) {
			this.currentWeaponIndex = 0;
		}
	}
};

/**
 * "Fires" the current weapon by reducing the weapon count and returning the type
 * @return {string} Weapon type to spawn
 */
proto.fireWeapon = function horde_Object_proto_fireWeapon () {
	var len = this.weapons.length;
	if (this.cooldown === true || len < 1) {
		return false;
	}
	var currentWeapon = this.getWeaponInfo();
	if (currentWeapon.count !== null) {
		currentWeapon.count -= 1;
		if (currentWeapon.count < 1) {
			this.weapons.splice(this.currentWeaponIndex, 1);
		}
	}
	this.cooldown = true;
	return currentWeapon.type;
};

}());
