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
		{type: "h_rock", count: -1}
	]
};

// HERO WEAPONS

o.h_rock = {
	role: "projectile",
	speed: 250,
	hitPoints: 1,
	damage: 1,
	spriteSheet: "objects",
	spriteX: 0,
	spriteY: 0,
	rotate: true
};

o.h_sword = {
	role: "projectile",
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
	speed: 400,
	hitPoints: 1,
	damage: 1,
	spriteSheet: "objects",
	spriteX: 192,
	spriteY: 0,
	rotate: true
};

// ENEMIES

o.bat = {
	role: "monster",
	team: 1,
	speed: 100,
	hitPoints: 1,
	damage: 1,
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
	},
	onWallCollide: function () {
		//this.moveChangeElapsed = 0;
	}
};

o.goblin = {
	role: "monster",
	team: 1,
	speed: 75,
	hitPoints: 3,
	damage: 1
};

o.ogre = {
	role: "monster",
	size: new horde.Size(64, 64),
	team: 1,
	speed: 50,
	hitPoints: 10,
	damage: 5
};

// ENEMY WEAPONS

o.e_rock = {
	
};

o.e_arrow = {
	
};
	
// OTHER SHIT

o.chest = {
	
};

o.gold_chest = {
	
};
	
}());
