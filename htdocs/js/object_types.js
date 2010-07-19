(function defne_horde_objectTypes () {

horde.objectTypes = {};

var o = horde.objectTypes;

o.hero = {
	role: "hero",
	team: 0,
	speed: 150,
	hitPoints: 100,
	damage: 0,
	spriteSheet: "characters",
	spriteY: 0,
	animated: true,
	soundAttacks: "hero_attacks",
	soundDamage: "hero_damage",
	soundDies: "hero_dies",
	weapons: [
		{type: "h_sword", count: null}
	]
};

// HERO WEAPONS

o.h_knife = {
	role: "projectile",
	cooldown: 200,
	speed: 350,
	hitPoints: 1,
	damage: 5,
	spriteSheet: "objects",
	spriteX: 32,
	spriteY: 0,
	spriteAlign: true
};

o.h_sword = {
	role: "projectile",
	cooldown: 500,
	speed: 250,
	hitPoints: 1,
	damage: 15,
	spriteSheet: "objects",
	spriteX: 64,
	spriteY: 0,
	spriteAlign: true
};

o.h_spear = {
	role: "projectile",
	cooldown: 350,
	speed: 500,
	hitPoints: 100,
	damage: 5,
	spriteSheet: "objects",
	spriteX: 96,
	spriteY: 0,
	spriteAlign: true
};

o.h_fireball = {
	role: "projectile",
	cooldown: 750,
	speed: 100,
	hitPoints: 25,
	damage: 25,
	spriteSheet: "objects",
	spriteX: 192,
	spriteY: 0,
	rotate: true,
	soundAttacks: "fire_attack",
	ttl: 2000
};

o.h_trident = {
	role: "projectile",
	cooldown: 800,
	speed: 600,
	hitPoints: 25,
	damage: 50,
	spriteSheet: "objects",
	spriteX: 160,
	spriteY: 0,
	spriteAlign: true
};

// ENEMIES

var movementTypes = {
	chase: function (elapsed, engine) {

		this.moveChangeElapsed += elapsed;

		if (this.moveChangeElapsed < this.moveChangeDelay) return;

		this.moveChangeElapsed = 0;
		
		var p = engine.getPlayerObject();
		this.chase(p);
		
		return "shoot";

	},
	getNear: function (elapsed, engine) {

		this.speed = this.defaultSpeed;

		var p = engine.getPlayerObject();

		// Get the distance from the player
		var distance = p.position.clone().subtract(this.position).magnitude();
		
		if (distance < 100) {
			// too close! run away
			this.chase(p);
			this.setDirection(this.direction.invert());
		} else if (distance > 150) {
			// too far, chase him down!
			this.chase(p);
		} else if (!this.cooldown) {
			// shoot the fucker in the FACE
			this.chase(p);
			this.speed = 0;
			return "shoot";
		} else {
			movementTypes.wander.apply(this, arguments);
		}

	},
	wander: function (elapsed, engine) {
		this.moveChangeElapsed += elapsed;
		if (this.moveChangeElapsed >= this.moveChangeDelay) {
			this.moveChangeElapsed = 0;
			var d = horde.randomDirection();
			if (d.x === 0 && d.y === 0) { return; }
			this.setDirection(d);
		}
	},
	wanderThenChase: function (elapsed, engine) {

		var p = engine.getPlayerObject();
		var hero = {
			x : p.position.x,
			y : p.position.y
		};
		var x = this.position.x;
		var y = this.position.y;

		if (this.seenHero) {
			movementTypes.chase.apply(this, arguments);
		} else {

			movementTypes.wander.apply(this, arguments);

			var nearX = Math.abs(x - hero.x);
			var nearY = Math.abs(y - hero.y);

			if ((nearX < 64) && (nearY < 64)) {
				horde.sound.play(this.soundAttacks);
				this.seenHero = true;
				return "shoot";
			}

		}

	}
};

o.bat = {
	role: "monster",
	team: 1,
	speed: 100,
	hitPoints: 5,
	damage: 2,
	worth: 10,
	spriteSheet: "characters",
	spriteY: 96,
	animated: true,
	animDelay: 150,
	moveChangeElapsed: 0,
	moveChangeDelay: 500,
	soundDamage: "bat_damage",
	soundDies: "bat_dies",
	onInit: function () {
		this.moveChangeDelay = horde.randomRange(500, 1000);
	},
	onUpdate: function () {
		if (this.position.y >= 50) this.onUpdate = movementTypes.wander;
	}
};

o.dire_bat = {
	role: "monster",
	team: 1,
	speed: 150,
	hitPoints: 10,
	damage: 5,
	worth: 10,
	spriteSheet: "characters",
	spriteY: 128,
	animated: true,
	animDelay: 150,
	moveChangeElapsed: 0,
	moveChangeDelay: 500,
	soundDamage: "bat_damage",
	soundDies: "bat_dies",
	onInit: function () {
		this.moveChangeDelay = horde.randomRange(500, 1000);
	},
	onUpdate: function () {
		if (this.position.y >= 50) this.onUpdate = movementTypes.wander;
	}
};

o.goblin = {
	role: "monster",
	team: 1,
	speed: 75,
	hitPoints: 10,
	damage: 10,
	worth: 20,
	spriteSheet: "characters",
	spriteY: 160,
	animated: true,
	gibletSize: "medium",
	moveChangeElapsed: 0,
	moveChangeDelay: 3000,
	weapons: [
		{type: "e_arrow", count: null}
	],
	soundAttacks: "goblin_attacks",
	soundDamage: "goblin_damage",
	soundDies: "goblin_dies",
	onInit: function () {
		this.moveChangeDelay = horde.randomRange(500, 1000);
	},
	onUpdate: function () {
		if (this.position.y >= 50) this.onUpdate = movementTypes.wanderThenChase;
	}
};

o.demoblin = {
	role: "monster",
	team: 1,
	speed: 100,
	defaultSpeed: 100,
	hitPoints: 20,
	damage: 15,
	worth: 20,
	spriteSheet: "characters",
	spriteY: 192,
	animated: true,
	gibletSize: "medium",
	moveChangeElapsed: 0,
	moveChangeDelay: 3000,
	weapons: [
		{type: "e_trident", count: null}
	],
	soundAttacks: "goblin_attacks",
	soundDamage: "goblin_damage",
	soundDies: "goblin_dies",
	onInit: function () {
		this.moveChangeDelay = horde.randomRange(500, 1000);
		this.cooldown = true;
		this.cooldownElapsed = horde.randomRange(0, 5000);
	},
	onUpdate: function () {
		if (this.position.y >= 50) this.onUpdate = movementTypes.getNear;
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

	moveChangeElapsed: 0,
	moveChangeDelay: 1000,

	damage: 25,
	hitPoints: 75,
	speed: 25,
	worth: 100,

	soundAttacks: "cyclops_attacks",
	soundDamage: "cyclops_damage",
	soundDies: "cyclops_dies",

	weapons: [{type: "e_boulder", count: null}],

	onInit: function () {
		this.moveChangeDelay = horde.randomRange(500, 1000);
		this.setDirection(horde.directions.toVector(horde.directions.DOWN));
	},
	onUpdate: function (elapsed, engine) {
		if (this.position.y >= 50) this.onUpdate = movementTypes.chase;
	}
};

o.superclops = {
	role: "monster",
	team: 1,
	badass: true,

	animated: true,
	gibletSize: "large",
	size: new horde.Size(64, 64),
	spriteSheet: "characters",
	spriteY: 288,

	moveChangeElapsed: 0,
	moveChangeDelay: 1000,

	damage: 35,
	hitPoints: 200,
	speed: 25,
	worth: 1000,

	soundAttacks: "cyclops_attacks",
	soundDamage: "cyclops_damage",
	soundDies: "cyclops_dies",

	weapons: [{type: "e_energy_ball", count: null}],

	onInit: function () {
		this.moveChangeDelay = horde.randomRange(500, 1000);
		this.setDirection(horde.directions.toVector(horde.directions.DOWN));
	},
	onUpdate: function (elapsed, engine) {
		if (this.position.y >= 50) this.onUpdate = movementTypes.chase;
	}

};

o.dragon = {
	role: "monster",
	team: 1,
	badass: true,

	animated: true,
	gibletSize: "large",
	size: new horde.Size(64, 64),
	spriteSheet: "characters",
	spriteY: 352,

	moveChangeElapsed: 0,
	moveChangeDelay: 1000,

	damage: 50,
	hitPoints: 500,
	speed: 20,
	worth: 9000,

	soundAttacks: "dragon_attacks",
	soundDamage: "dragon_damage",
	soundDies: "dragon_dies",

	weapons: [{type: "e_fireball", count: null}],

	onInit: function () {
		this.moveChangeDelay = horde.randomRange(500, 1000);
		this.setDirection(horde.directions.toVector(horde.directions.DOWN));
	},
	onUpdate: function (elapsed, engine) {
		if (this.position.y >= 50) this.onUpdate = movementTypes.chase;
	}

};

// ENEMY WEAPONS

o.e_arrow = {
	role: "projectile",
	cooldown: 300,
	speed: 200,
	hitPoints: 1,
	damage: 5,
	spriteSheet: "objects",
	spriteX: 256,
	spriteY: 0,
	spriteAlign: true
};

o.e_trident = {
	role: "projectile",
	cooldown: 5000,
	speed: 200,
	hitPoints: 1,
	damage: 10,
	spriteSheet: "objects",
	spriteX: 288,
	spriteY: 0,
	spriteAlign: true
};

o.e_boulder = {
	role: "projectile",
	cooldown: 1500 ,
	speed: 150,
	hitPoints: 25,
	damage: 20,
	spriteSheet: "objects",
	spriteX: 224,
	spriteY: 0,
	rotate: true
};

o.e_energy_ball = {
	role: "projectile",
	cooldown: 2000,
	speed: 200,
	hitPoints: 9999,
	damage: 20,
	spriteSheet: "objects",
	spriteX: 320,
	spriteY: 0,
	rotate: true
};

o.e_fireball = {
	role: "projectile",
	cooldown: 2000,
	speed: 200,
	hitPoints: 9999,
	damage: 20,
	spriteSheet: "objects",
	spriteX: 352,
	spriteY: 0,
	rotate: true
};

// OTHER SHIT

/*

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

*/

// GIBLETS

o.gate = {
	role: "fluff",
	speed: 25,
	spriteSheet: "objects",
	spriteX: 0,
	spriteY: 192,
	size: new horde.Size(64, 64)
};

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
	speed: 50,
	ttl: 1500,
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
	speed: 50,
	ttl: 1500,
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
	speed: 50,
	ttl: 1500,
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

o.item_food = {
	role: "powerup_food",
	healAmount: 5,
	speed: 0,
	spriteSheet: "objects",
	spriteX: 96,
	spriteY: 32,
	ttl: 8000
};

o.item_coin = {
	role: "powerup_coin",
	coinAmount: 10,
	speed: 0,
	spriteSheet: "objects",
	spriteX: 64,
	spriteY: 32,
	ttl: 5000,
	onInit: function () {
		var rnd = horde.randomRange(1, 10);
		if (rnd <= 5) {
			this.coinAmount = 10;
			this.spriteX = 64;
			return;
		}
		if (rnd > 5 && rnd <= 9) {
			this.coinAmount = 100;
			this.spriteX = 32;			
			return;
		}
		if (rnd === 10) {
			this.coinAmount = 1000;
			this.spriteX = 0;			
			return;
		}
	}
};

o.item_weapon = {
	role: "powerup_weapon",
	speed: 0,
	spriteSheet: "objects",
	spriteX: 0,
	spriteY: 0,
	ttl: 5000,
	onInit: function () {
		// Note: all these fallthroughs are intentional.
		switch (horde.randomRange(1, 10)) {

			case 1:
			case 2:
			case 3:
				this.wepType = "h_knife";
				this.spriteX = 32;
				this.wepCount = 150;
				break;
			
			case 4:
			case 5:
			case 6:
				this.wepType = "h_spear";
				this.wepCount = 30;
				this.spriteX = 96;
				break;
				
			case 7:
			case 8:
				this.wepType = "h_fireball";
				this.wepCount = 25;
				this.spriteX = 192;
				break;
				
			case 9:
			case 10:
				this.wepType = "h_trident";
				this.wepCount = 10;
				this.spriteX = 160;
				break;
			
		}
	}
};

}());
