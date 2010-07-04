(function defne_horde_objectTypes () {

horde.objectTypes = {};

var o = horde.objectTypes;

o.hero = {
	role: "hero",
	team: 0,
	speed: 150,
	hitPoints: 25,
	damage: 1,
	spriteSheet: "characters",
	spriteY: 0,
	animated: true,
	weapons: [
		{type: "h_rock", count: null}
	]
};

// HERO WEAPONS

o.h_rock = {
	role: "projectile",
	cooldown: 350,
	speed: 250,
	hitPoints: 1,
	damage: 1,
	spriteSheet: "objects",
	spriteX: 0,
	spriteY: 0,
	rotate: true
};

o.h_knife = {
	role: "projectile",
	cooldown: 200,
	speed: 350,
	hitPoints: 1,
	damage: 1,
	spriteSheet: "objects",
	spriteX: 32,
	spriteY: 0,
	spriteAlign: true
};

o.h_sword = {
	role: "projectile",
	cooldown: 300,
	speed: 250,
	hitPoints: 1,
	damage: 2,
	spriteSheet: "objects",
	spriteX: 64,
	spriteY: 0,
	spriteAlign: true
};

o.h_spear = {
	role: "projectile",
	cooldown: 500,
	speed: 300,
	hitPoints: 5,
	damage: 5,
	spriteSheet: "objects",
	spriteX: 96,
	spriteY: 0,
	spriteAlign: true
};

o.h_fireball = {
	role: "projectile",
	cooldown: 750,
	speed: 400,
	hitPoints: 1,
	damage: 1,
	spriteSheet: "objects",
	spriteX: 192,
	spriteY: 0,
	rotate: true
};

o.h_trident = {
	role: "projectile",
	cooldown: 1000,
	speed: 500,
	hitPoints: 100,
	damage: 50,
	spriteSheet: "objects",
	spriteX: 160,
	spriteY: 0,
	spriteAlign: true
};

// ENEMIES

o.bat = {
	role: "monster",
	team: 1,
	speed: 100,
	hitPoints: 1,
	damage: 1,
	worth: 10,
	spriteSheet: "characters",
	spriteY: 128,
	animated: true,
	animDelay: 150,
	moveChangeElapsed: 0,
	moveChangeDelay: 500,
	onInit: function () {
		this.moveChangeDelay = horde.randomRange(500, 1000);
		if (horde.randomRange(0, 1) === 1) {
			this.spriteY = 160;
		}
	},
	onUpdate: function (elapsed) {
		this.moveChangeElapsed += elapsed;
		if (this.moveChangeElapsed >= this.moveChangeDelay) {
			this.moveChangeElapsed = 0;
			var d = horde.randomDirection();
			if (d.x === 0 && d.y === 0) { return; }
			this.setDirection(d);
		}
	}
};

o.goblin = {
	role: "monster",
	team: 1,
	speed: 75,
	hitPoints: 3,
	damage: 1,
	worth: 20,
	spriteSheet: "characters",
	spriteY: 160,
	animated: true,
	gibletSize: "medium",
	moveChangeElapsed: 0,
	moveChangeDelay: 500,
	onInit: function () {
		this.moveChangeDelay = horde.randomRange(500, 1000);
	},
	onUpdate: function (elapsed) {
		this.moveChangeElapsed += elapsed;
		if (this.moveChangeElapsed >= this.moveChangeDelay) {
			this.moveChangeElapsed = 0;
			var d = horde.randomDirection();
			if (d.x === 0 && d.y === 0) { return; }
			this.setDirection(d);
		}
	}
};

o.cyclops = {
	role: "monster",
	team: 1,

	animated: true,
	gibletSize: "large",
	size: new horde.Size(64, 64),
	spriteSheet: "characters",
	spriteY: 224,

	// This might be a dumb hack ...
	pastGate: false,

	damage: 5,
	hitPoints: 10,
	speed: 25,
	worth: 50,

	onInit: function () {
		this.moveChangeDelay = horde.randomRange(500, 1000);
		this.setDirection(horde.directions.toVector(horde.directions.DOWN));
	},
	onUpdate: function (elapsed, engine) {

		if (this.pastGate) {
			// Uh, move towards the hero here, haha. have fun geoff!
			this.setDirection(horde.directions.toVector(horde.directions.DOWN_LEFT));
		} else {
			if (this.position.y >= 50) this.pastGate = true;
		}

	}

};

// ENEMY WEAPONS

o.e_rock = {
	
};

o.e_arrow = {
	
};
	
// OTHER SHIT

o.chest = {
	role: "chest",
	team: 1,
	speed: 0,
	spriteSheet: "characters",
	spriteX: 0,
	spriteY: 32,
	damage: 0,
	hitPoints: 25
};

o.gold_chest = {
	
};

// GIBLETS

o.small_skull = {
	role: "fluff",
	speed: 25,
	ttl: 1000,
	spriteSheet: "objects",
	spriteX: 64,
	spriteY: 64,
	rotate: true,
	rotateSpeed: 50,
};

o.small_giblet = {
	role: "fluff",
	speed: 25,
	ttl: 1000,
	spriteSheet: "objects",
	spriteX: 0,
	spriteY: 160,
	rotate: true,
	rotateSpeed: 50,
	onInit: function () {
		var offset = horde.randomRange(0, 6);
		this.spriteX += (offset * this.size.width);
	}
};

o.medium_skull = {
	role: "fluff",
	speed: 25,
	ttl: 1000,
	spriteSheet: "objects",
	spriteX: 32,
	spriteY: 64,
	rotate: true,
	rotateSpeed: 50,
};

o.medium_giblet = {
	role: "fluff",
	speed: 25,
	ttl: 1000,
	spriteSheet: "objects",
	spriteX: 0,
	spriteY: 128,
	rotate: true,
	rotateSpeed: 50,
	onInit: function () {
		var offset = horde.randomRange(0, 6);
		this.spriteX += (offset * this.size.width);
	}
};

o.large_skull = {
	role: "fluff",
	speed: 25,
	ttl: 1000,
	spriteSheet: "objects",
	spriteX: 0,
	spriteY: 64,
	rotate: true,
	rotateSpeed: 50,
};

o.large_giblet = {
	role: "fluff",
	speed: 25,
	ttl: 1000,
	spriteSheet: "objects",
	spriteX: 0,
	spriteY: 96,
	rotate: true,
	rotateSpeed: 50,
	onInit: function () {
		var offset = horde.randomRange(0, 6);
		this.spriteX += (offset * this.size.width);
	}
};

}());
