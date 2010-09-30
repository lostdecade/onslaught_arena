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

o.h_sword = {
	name: "Sword",
	role: "projectile",
	cooldown: 300,
	speed: 250,
	hitPoints: 1,
	damage: 10,
	spriteSheet: "objects",
	spriteX: 64,
	spriteY: 0,
	spriteAlign: true,
	priority: 0,
	bounce: false
};

o.h_knife = {
	name: "Knife",
	role: "projectile",
	size: new horde.Size(32, 30),
	cooldown: 200,
	speed: 350,
	hitPoints: 1,
	damage: 5,
	spriteSheet: "objects",
	spriteX: 32,
	spriteY: 0,
	spriteAlign: true,
	priority: 1,
	bounce: false
};

o.h_spear = {
	name: "Spear",
	role: "projectile",
	cooldown: 350,
	speed: 500,
	hitPoints: 1,
	damage: 15,
	spriteSheet: "objects",
	spriteX: 96,
	spriteY: 0,
	spriteAlign: true,
	priority: 2,
	bounce: false
};

o.h_fireball = {
	name: "Fireball",
	role: "projectile",
	cooldown: 75,
	speed: 400,
	hitPoints: 1,
	damage: 2,
	spriteSheet: "objects",
	spriteX: 192,
	spriteY: 0,
	rotate: true,
	soundAttacks: "fire_attack",
	ttl: 350,
	priority: 3,
	bounce: false,
	damageType: "magic"
};

o.h_bomb = {
	name: "Bomb",
	role: "projectile",
	cooldown: 750,
	speed: 200,
	hitPoints: 1,
	damage: 0,
	spriteSheet: "objects",
	spriteX: 128,
	spriteY: 0,
	rotate: true,
	rotateSpeed: 150,
	priority: 4,
	bounce: true,
	
	onDelete: function (engine) {
		engine.spawnObject(this, "bomb_smoke");
	}
	
};

o.bomb_smoke = {
	role: "trap",
	size: new horde.Size(64, 64),
	cooldown: 0,
	speed: 0,
	hitPoints: 9999,
	damage: 0,
	spriteSheet: "objects",
	spriteX: 0,
	spriteY: 544,
	bounce: false,
	ttl: 3000,
	
	onDamage: function (defender, engine) {
		if (defender.team !== this.team && defender.role === "monster") {
			defender.addState(horde.Object.states.STUNNED, 5000);
		}
	}
	
};

o.h_axe = {
	name: "Battle Axe",
	role: "projectile",
	cooldown: 450,
	speed: 350,
	hitPoints: 1,
	damage: 30,
	spriteSheet: "objects",
	spriteX: 192,
	spriteY: 32,
	rotate: true,
	priority: 5,
	ttl: 10000
};

o.h_fire_sword = {
	name: "Flame Sword",
	role: "projectile",
	cooldown: 450,
	speed: 350,
	hitPoints: 1,
	damage: 40,
	spriteSheet: "objects",
	spriteX: 384,
	spriteY: 0,
	priority: 6,
	bounce: false,
	spriteAlign: true,
	
	onInit: function () {
		this.spawnTimer = new horde.Timer();
		this.spawnTimer.start(50);
	},
	
	onUpdate: function (elapsed, engine) {
		this.spawnTimer.update(elapsed);
		if (this.spawnTimer.expired()) {
			engine.spawnObject(this, "fire_sword_trail");
			this.spawnTimer.reset();
		}
	}
	
};

o.fire_sword_trail = {
	role: "projectile",
	speed: 0,
	hitPoints: 1,
	damage: 10,
	spriteSheet: "objects",
	spriteX: 192,
	spriteY: 0,
	rotate: true,
	soundAttacks: "fire_attack",
	ttl: 500,
	bounce: false,
	drawIndex: 0,
	damageType: "magic"
};

// ENEMIES

var movementTypes = {
	chase: function (elapsed, engine) {

		if (this.moveChangeDelay > 0) {
			this.moveChangeElapsed += elapsed;
			if (this.moveChangeElapsed < this.moveChangeDelay) {
				return;
			}
			this.moveChangeElapsed = 0;
		}

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
	wanderShoot: function (elapsed, engine) {
		
		var p = engine.getPlayerObject();
		
		var diff = p.position.clone().subtract(this.position).abs();
		
		if (!this.cooldown && (diff.x < (p.size.width / 2) || diff.y < (p.size.height / 2))) {
			this.chase(p);
			return "shoot";
		} else {
			movementTypes.wander.apply(this, arguments);
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
	worth: 0,
	spriteSheet: "characters",
	spriteY: 96,
	animated: true,
	animDelay: 150,
	moveChangeElapsed: 0,
	moveChangeDelay: 500,
	soundDamage: "bat_damage",
	soundDies: "bat_dies",
	
	lootTable: [
		{type: null, weight: 9},
		{type: "item_coin", weight: 1}
	],
	
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
	worth: 0,
	spriteSheet: "characters",
	spriteY: 128,
	animated: true,
	animDelay: 150,
	moveChangeElapsed: 0,
	moveChangeDelay: 500,
	soundDamage: "bat_damage",
	soundDies: "bat_dies",
	
	lootTable: [
		{type: null, weight: 7},
		{type: "item_coin", weight: 3}
	],
	
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
	worth: 0,
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
	
	lootTable: [
		{type: null, weight: 5},
		{type: "item_coin", weight: 2},
		{type: "item_weapon_knife", weight: 2},
		{type: "item_food", weight: 1}
	],
	
	onInit: function () {
		this.moveChangeDelay = horde.randomRange(500, 1000);
	},
	onUpdate: function () {
		if (this.position.y >= 50) this.onUpdate = movementTypes.wanderShoot;
	}
};

o.hunter_goblin = {
	role: "monster",
	team: 1,
	speed: 75,
	hitPoints: 10,
	damage: 10,
	worth: 0,
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
	
	lootTable: [
		{type: null, weight: 2},
		{type: "item_coin", weight: 4},
		{type: "item_weapon_knife", weight: 2},
		{type: "item_food", weight: 2}
	],
	
	onInit: function () {
		this.moveChangeDelay = horde.randomRange(500, 1000);
	},
	onUpdate: function (elapsed, engine) {
		if (this.position.y >= 50) {
			if (!this.cooldown) {
				this.chase(engine.getPlayerObject());
				return "shoot";
			}
			movementTypes.wander.apply(this, arguments);
		}
	}
};

o.demoblin = {
	role: "monster",
	team: 1,
	speed: 100,
	defaultSpeed: 100,
	hitPoints: 30,
	damage: 15,
	worth: 0,
	spriteSheet: "characters",
	spriteY: 192,
	animated: true,
	gibletSize: "medium",
	moveChangeElapsed: 0,
	moveChangeDelay: 3000,
	weapons: [
		{type: "e_trident", count: null}
	],
	
	lootTable: [
		{type: null, weight: 6},
		{type: "item_weapon_spear", weight: 2},
		{type: "item_chest", weight: 1},
		{type: "item_food", weight: 1}
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

o.flaming_skull = {
	
	role: "monster",
	team: 1,
	
	speed: 200,
	hitPoints: 50,
	damage: 15,
	worth: 0,
	
	spriteSheet: "characters",
	spriteY: 32,
	animated: true,
	
	setDir: false,
	
	weapons: [
		{type: "e_static_blue_fire", count: null}
	],
	
	lootTable: [
		{type: null, weight: 6},
		{type: "item_weapon_fireball", weight: 2},
		{type: "item_chest", weight: 2}
	],
	
	onInit: function () {
		switch (horde.randomRange(1, 3)) {
			case 1:
				this.speed *= 0.5;
				this.animDelay *= 0.5;
				break;
			case 2:
				this.speed *= 0.75;
				this.animDelay *= 0.75;
				break;
			case 3:
				// Nothing
				break;
		}
	},
	
	onUpdate: function (elapsed, engine) {
		if (!this.setDir && this.position.y >= 50) {
			var d = this.direction.clone();
			d.x = Math.random();
			if (Math.random() >= 0.5) {
				d.x *= -1;
			}
			this.setDirection(d);
			this.setDir = true;
		}
		return "shoot";
	}
	
};

o.spike_sentry = {
	
	role: "trap",
	team: 1,
	
	speed: 100,
	hitPoints: 9999,
	damage: 25,
	worth: 0,
	
	spriteSheet: "objects",
	spriteX: 64,
	spriteY: 256,
	
	rotate: true,
	rotateSpeed: 100,

	phase: 0,
	phaseInit: false,
	
	onDamage: function (defender, engine) {

		if (defender.role === "hero") {
			this.spriteX = 160;
		}
		
	},
	
	onUpdate: function (elapsed, engine) {
		
		switch (this.phase) {
			
			// Wait for player to get near X or Y axis
			case 0:
				if (!this.phaseInit) {
					this.stopMoving();
					this.phaseInit = true;
				}
				var p = engine.getPlayerObject();
				var diff = p.position.clone().subtract(this.position);
				if (Math.abs(diff.y) < 32) {
					// charge the player along the left/right axis
					this.originalPos = this.position.clone();
					var d = new horde.Vector2();
					d.x = (diff.x < 0) ? -1: 1;
					this.setDirection(d);
					this.phase++;
					this.phaseInit = false;
					horde.sound.play("spike_attack");
				} else if (Math.abs(diff.x) < 32) {
					this.originalPos = this.position.clone();
					var d = new horde.Vector2();
					d.y = (diff.y < 0) ? -1: 1;
					this.setDirection(d);
					this.phase++;
					this.phaseInit = false;
					horde.sound.play("spike_attack");
				}
				break;
				
			// Charging the player
			case 1:
				if (!this.phaseInit) {
					this.speed = 300;
					this.rotateSpeed = 300;
					this.phaseInit = true;
				}
				var diff = this.position.clone().subtract(this.originalPos).abs();
				if (diff.x > 320 - 64) {
					var d = this.direction.clone();
					d.x *= -1;
					this.setDirection(d);
					this.phase++;
					this.phaseInit = false;
				} else if (diff.y > 240 - (4 *32) + 16) {
					var d = this.direction.clone();
					d.y *= -1;
					this.setDirection(d);
					this.phase++;
					this.phaseInit = false;
				}
				break;
			
			// Reseting
			case 2:
			 	if (!this.phaseInit) {
					this.speed = 100;
					this.rotateSpeed = 100;
					this.phaseInit = true;
				}
				var diff = this.position.clone().subtract(this.originalPos).abs();
				if (diff.x < 5 && diff.y < 5) {
					this.stopMoving();
					this.position = this.originalPos.clone();
					this.phase = 0;
					this.phaseInit = false;
				}
				break;

		}

	}

};

o.spikes = {

	role: "trap",
	team: 1,
	
	speed: 0,
	hitPoints: 9999,
	damage: 15,
	worth: 0,

	spriteSheet: "objects",
	spriteX: 0,
	spriteY: 256,

	gibletSize: "medium",

	onInit: function () {

	}
};

o.cyclops = {
	role: "monster",
	team: 1,
	badass: true,

	animated: true,
	gibletSize: "large",
	size: new horde.Size(64, 64),
	spriteSheet: "characters",
	spriteY: 224,

	moveChangeElapsed: 0,
	moveChangeDelay: 1000,

	damage: 20,
	hitPoints: 200,
	speed: 100,
	animDelay: 100,
	worth: 0,

	soundAttacks: "cyclops_attacks",
	soundDamage: "cyclops_damage",
	soundDies: "cyclops_dies",

	weapons: [{type: "e_boulder", count: null}],

	lootTable: [
		{type: "item_food", weight: 1}
	],

	onInit: function () {
		this.moveChangeDelay = horde.randomRange(500, 1000);
		this.setDirection(horde.directions.toVector(horde.directions.DOWN));
	},
	onUpdate: function (elapsed, engine) {
		if (this.position.y >= 50) {
			this.speed = 25;
			this.animDelay = 200;
			this.onUpdate = movementTypes.chase;
		}
	}
};

// Beholder eyelets
o.eyelet = {
	role: "monster",
	team: 1,
	
	animated: true,
	spriteSheet: "characters",
	spriteY: 512,
	
	damage: 10,
	hitPoints: 100,
	speed: 100,
	worth: 0,
	
	onInit: function () {
		if (horde.randomRange(1, 10) > 5) {
			this.spriteY += 32;
		}
	},
	
	onUpdate: function (elapsed, engine) {
		// TODO: better behavior
		if (this.position.y >= 50) {
			this.onUpdate = movementTypes.wander;
		}
	}
	
};

o.cube = {
	role: "monster",
	team: 1,
	badass: true,

	animated: true,
	animDelay: 400,
	gibletSize: "large",
	size: new horde.Size(64, 64),
	spriteSheet: "characters",
	spriteY: 576,

	moveChangeElapsed: 0,
	moveChangeDelay: 1000,

	damage: 35,
	hitPoints: 500,
	speed: 15,
	worth: 0,
	
	soundAttacks: "cube_attacks",
	soundDamage: "cube_damage",
	soundDies: "cube_dies",

	lootTable: [
		{type: "item_chest", weight: 1},
		{type: "item_weapon_knife", weight: 3},
		{type: "item_weapon_spear", weight: 3},
		{type: "item_food", weight: 3}
	],

	onInit: function () {
		this.moveChangeDelay = horde.randomRange(500, 1000);
		this.setDirection(horde.directions.toVector(horde.directions.DOWN));
		this.phaseTimer = new horde.Timer();
		this.gelTimer = new horde.Timer();
	},
	
	onThreat: function (attacker, engine) {
		if (attacker.type !== "h_fireball") {
			return true;
		}
	},
	
	onUpdate: function (elapsed, engine) {
		
		this.gelTimer.update(elapsed);
		
		switch (this.phase) {
			
			// "Charge" out of gate
			case 0:
				if (!this.phaseInit) {
					this.speed = 100;
					this.animDelay = 200;
					this.phaseInit = true;
				}
				if (this.position.y >= 150) {
					this.nextPhase();
				}
				break;
			
			// Spawn a bunch of gels!
			case 1:
				if (!this.phaseInit) {
					this.stopMoving();
					this.speed = 15;
					this.animDelay = 400;
					this.phaseTimer.start(4000);
					this.gelTimer.start(200);
					this.phaseInit = true;
				}
				if (this.phaseTimer.expired()) {
					this.nextPhase();
					break;
				}
				this.position.x += horde.randomRange(-1, 1);
				if (this.gelTimer.expired()) {
					engine.spawnObject(this, "gel");
					horde.sound.play(this.soundAttacks);
					this.gelTimer.reset();
				}
				break;
			
			case 2:
				if (!this.phaseInit) {
					this.phaseTimer.start(5000);
					this.phaseInit = true;
				}
				if (this.phaseTimer.expired()) {
					this.setPhase(1);
					break;
				}
				movementTypes.chase.apply(this, arguments);
				break;
			
		}
		
	}
};

o.gel = {
	role: "monster",
	team: 1,

	animated: true,
	animDelay: 400,
	
	spriteSheet: "characters",
	spriteY: 640,

	moveChangeElapsed: 0,
	moveChangeDelay: 1000,

	damage: 5,
	hitPoints: 10,
	speed: 200,
	worth: 0,

	// TODO: gel sounds
	soundAttacks: "cube_attacks",
	soundDamage: "cube_damage",
	soundDies: "cube_dies",

	onInit: function () {
		this.setDirection(horde.randomDirection());
		this.moveChangeDelay = horde.randomRange(500, 1000);
		// Randomize sprite
		switch (horde.randomRange(1, 4)) {
			case 1: this.spriteY = 640; break;
			case 2: this.spriteY = 672; break;
			case 3: this.spriteY = 704; break;
			case 4: this.spriteY = 736; break;
		}
	},
	
	onUpdate: function (elapsed, engine) {
		movementTypes.wander.apply(this, arguments);
	},
	
	onKilled: function (attacker, engine) {
		var player = engine.getPlayerObject();
		// Spawn a fireball scroll if the player is out
		// AND there aren't any on the screen
		if (
			!player.hasWeapon("h_fireball") 
			&& engine.getObjectCountByType("item_weapon_fireball") === 0
		) {
			engine.dropObject(this, "item_weapon_fireball");
		}
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
	hitPoints: 600,
	speed: 25,
	worth: 0,

	soundAttacks: "cyclops_attacks",
	soundDamage: "cyclops_damage",
	soundDies: "cyclops_dies",

	weapons: [{type: "e_energy_ball", count: null}],

	lootTable: [
		{type: "item_gold_chest", weight: 1}
	],

	onInit: function () {
		this.phaseTimer = new horde.Timer();
		this.moveChangeDelay = horde.randomRange(500, 1000);
		this.setDirection(horde.directions.toVector(horde.directions.DOWN));
	},
	onUpdate: function (elapsed, engine) {
		
		switch (this.phase) {
			
			// Charge out of the gates
			case 0:
				if (!this.phaseInit) {
					this.speed = 200;
					this.animDelay = 100;
					this.phaseInit = true;
				}
				if (this.position.y >= 160) {
					this.nextPhase();
				}
				break;
			
			// Wiggle!
			case 1:
				if (!this.phaseInit) {
					this.stopMoving();
					this.animDelay = 300;
					this.phaseTimer.start(1500);
					this.phaseInit = true;
				}
				if (this.phaseTimer.expired()) {
					this.nextPhase();
					break;
				}
				this.position.x += horde.randomRange(-1, 1);
				break;
			
			// Shoot bouncing boulders
			case 2:
				if (!this.phaseInit) {
					this.cooldown = false;
					this.weapons = [{type: "e_bouncing_boulder", count: null}];
					this.phaseInit = true;
				}
				engine.objectAttack(this);
				this.position.x += horde.randomRange(-1, 1);
				this.nextPhase();
				break;
			
			// Chase and shoot energy balls
			case 3:
				if (!this.phaseInit) {
					this.speed = 50;
					this.weapons = [{type: "e_energy_ball", count: null}];
					this.cooldown = true;
					this.phaseTimer.start(6000)
					this.phaseInit = true;
				}
				if (this.phaseTimer.expired()) {
					this.setPhase(1);
				}
				engine.objectAttack(this);
				movementTypes.chase.apply(this, arguments);
				break;

		}
		
	}

};

o.imp = {

	role: "monster",
	team: 1,

	speed: 100,

	hitPoints: 20,
	damage: 15,

	worth: 0,

	spriteSheet: "characters",
	spriteY: 64,
	animated: true,

	gibletSize: "medium",

	moveChangeElapsed: 0,
	moveChangeDelay: 3000,
	
	soundAttacks: "imp_attacks",
	soundDamage: "imp_damage",
	soundDies: "imp_death",
	
	phase: 0,
	phaseInit: false,
	
	onInit: function () {
		this.phaseTimer = new horde.Timer();
		this.moveChangeDelay = horde.randomRange(500, 1000);
	},
	
	onKilled: function (attacker, engine) {
		if (attacker.role === "projectile") {
			attacker.die();
		}
		for (var x = 0; x < 2; x++) {
			engine.spawnObject(this, "dire_bat", horde.randomDirection());
		}
	},
	
	onUpdate: function (elapsed, engine) {
		
		switch (this.phase) {
			
			// Move past the gates
			case 0:
				if (!this.phaseInit) {
					this.phaseInit = true;
				}
				if (this.position.y >= 50) {
					this.phase++;
					this.phaseInit = false;
				}
				break;
			
			// Wander slowly
			case 1:
				if (!this.phaseInit) {
					this.speed = 50;
					this.animDelay = 400;
					this.phaseTimer.start(2500, 7500);
					this.phaseInit = true;
				}
				movementTypes.wander.apply(this, arguments);
				if (this.phaseTimer.expired()) {
					this.phase++;
					this.phaseInit = false;
				}
				break;
			
			// Wander fast!
			case 2:
				if (!this.phaseInit) {
					this.speed = 150;
					this.animDelay = 150;
					this.phaseTimer.start(2500, 7500);
					this.phaseInit = true;
				}
				movementTypes.wander.apply(this. arguments);
				if (this.phaseTimer.expired()) {
					this.phase = 1;
					this.phaseInit = false;
				}
				break;
			
		}
		
	}
};

o.wizard = {
	role: "monster",
	team: 1,
	speed: 100,
	hitPoints: 20,
	damage: 10,
	worth: 0,
	spriteSheet: "characters",
	spriteY: 416,
	animated: true,
	gibletSize: "medium",
	moveChangeElapsed: 0,
	moveChangeDelay: 3000,
	
	weapons: [
		{type: "e_shock_wave", count: null}
	],

	// TODO: Wizard sounds?
	soundAttacks: "goblin_attacks",
	soundDamage: "goblin_damage",
	soundDies: "goblin_dies",
	
	lootTable: [
		{type: null, weight: 6},
		{type: "item_chest", weight: 2},
		{type: "item_gold_chest", weight: 1},
		{type: "item_weapon_fireball", weight: 1}
	],
	
	phase: 0,
	phaseInit: false,
	
	onInit: function () {
		this.phaseTimer = new horde.Timer();
		this.moveChangeDelay = horde.randomRange(500, 1000);
		this.moveToY = horde.randomRange(50, 75);
	},
	onUpdate: function (elapsed, engine) {
		
		switch (this.phase) {
			
			// Move out of the gates
			case 0:
				if (!this.phaseInit) {
					this.phaseInit = true;
				}
				if (this.position.y >= this.moveToY) {
					this.phase++;
					this.phaseInit = false;
				}
				break;
				
			// Phase out
			case 1:
				if (!this.phaseInit) {
					this.animated = false;
					this.stopMoving();
					this.addState(horde.Object.states.INVINCIBLE);
					this.phaseTimer.start(1000);
					this.phaseInit = true;
				}
				if (this.phaseTimer.expired()) {
					this.phase++;
					this.phaseInit = false;
				}
				break;
				
			// Turn invisible and move around!
			case 2:
				if (!this.phaseInit) {
					this.speed = 500;
					this.addState(horde.Object.states.INVISIBLE);
					this.phaseTimer.start(horde.randomRange(1000, 2000));
					this.phaseInit = true;
				}
				movementTypes.wander.apply(this, arguments);
				if (this.phaseTimer.expired()) {
					this.phase++;
					this.phaseInit = false;
				}
				break;
				
			// Phase in
			case 3:
				if (!this.phaseInit) {
					this.stopMoving();
					this.removeState(horde.Object.states.INVISIBLE);
					this.phaseTimer.start(1000);
					this.phaseInit = true;
				}
				if (this.phaseTimer.expired()) {
					this.phase++;
					this.phaseInit = false;
				}
				break;
				
			// Shoot the player!
			case 4:
				if (!this.phaseInit) {
					this.speed = 0;
					this.animated = true;
					this.removeState(horde.Object.states.INVINCIBLE);
					this.phaseTimer.start(horde.randomRange(2000, 3000));
					this.phaseInit = true;
					this.shotOnce = false;
				}
				var p = engine.getPlayerObject();
				this.chase(p);
				if (this.phaseTimer.expired()) {
					this.phase = 1;
					this.phaseInit = false;
				}
				if (!this.shotOnce) {
					this.shotOnce = true;
					return "shoot";
				}
				break;

		}

	}
};

o.sandworm = {
	
	role: "monster",
	team: 1,
	
	animated: true,
	animDelay: 200,
	spriteSheet: "characters",
	spriteY: 480,
	
	damage: 25,
	hitPoints: 50,
	speed: 50,
	worth: 0,
	
	phase: 0,
	phaseInit: false,
	
	moveChangeElapsed: 0,
	moveChangeDelay: 2000,

	lootTable: [
		{type: null, weight: 4},
		{type: "item_chest", weight: 2},
		{type: "item_food", weight: 4}
	],
	
	onInit: function () {
		this.phaseTimer = new horde.Timer();
		this.dirtTimer = new horde.Timer();
		this.attackTimer = new horde.Timer();
	},
	
	onUpdate: function (elapsed, engine) {
		switch (this.phase) {
							
			case 0:
				if (!this.phaseInit) {
					this.speed = 50;
					this.addState(horde.Object.states.INVISIBLE);
					this.phaseTimer.start(horde.randomRange(5000, 10000));
					this.dirtTimer.start(150);
					this.phaseInit = true;
				}
				this.dirtTimer.update(elapsed);
				if (this.position.y <= 50) {
					this.setDirection(horde.directions.toVector(horde.directions.DOWN));
				} else {
					movementTypes.wander.apply(this, arguments);
				}
				if (this.phaseTimer.expired()) {
					this.phase++;
					this.phaseInit = false;
				}
				if (this.dirtTimer.expired()) {
					engine.spawnObject(this, "e_dirt_pile");
					this.dirtTimer.reset();
				}
				break;
				
			case 1:
				// spawn!
				if (!this.phaseInit) {
					this.stopMoving();
					this.speed = 0;
					this.removeState(horde.Object.states.INVISIBLE);
					this.addState(horde.Object.states.SPAWNING);
					this.spawnFrameIndex = 0;
					this.phaseInit = true;
				}
				if (!this.hasState(horde.Object.states.SPAWNING)) {
					this.phase++;
					this.phaseInit = false;
				}
				break;
				
			case 2:
				// fire globs of shit
				if (!this.phaseInit) {
					this.phaseAttacks = 0;
					this.phaseInit = true;
					this.attackTimer.start(200);
				}
				this.attackTimer.update(elapsed);
				if (this.phaseAttacks < 1 && this.attackTimer.expired()) {
					this.phaseAttacks++;
					this.chase(engine.getPlayerObject());
					//this.setDirection(horde.randomDirection());
					engine.spawnObject(this, "e_worm_spit");
					this.attackTimer.reset();
					if (this.phaseAttacks === 1) {
						this.phaseTimer.start(2000);
					}
				}
				if (this.phaseAttacks >= 1 && this.phaseTimer.expired()) {
					this.phase++;
					this.phaseInit = false;
				}
				break;
				
			case 3:
				// burrow!
				if (!this.phaseInit) {
					this.addState(horde.Object.states.DESPAWNING);
					this.spawnFrameIndex = 2;
					this.phaseInit = true;
				}
				if (!this.hasState(horde.Object.states.DESPAWNING)) {
					this.addState(horde.Object.states.INVISIBLE);
					this.phase = 0;
					this.phaseInit = false;
				}
				break;

		}
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
	moveChangeDelay: 0,

	damage: 35,
	hitPoints: 1000,
	speed: 20,
	worth: 0,

	soundAttacks: "dragon_attacks",
	soundDamage: "dragon_damage",
	soundDies: "dragon_dies",

	weapons: [{type: "e_fireball", count: null}],

	lootTable: [
		{type: "item_gold_chest", weight: 1}
	],

	phase: 0,
	phaseInit: false,

	onInit: function () {
		this.phaseTimer = new horde.Timer();
		this.moveChangeDelay = horde.randomRange(500, 1000);
		this.setDirection(horde.directions.toVector(horde.directions.DOWN));
		this.altTimer = new horde.Timer();
	},
	onUpdate: function (elapsed, engine) {
		
		this.altTimer.update(elapsed);

		switch (this.phase) {
			
			// Charge out of the gates
			case 0:
				if (!this.phaseInit) {
					this.speed = 200;
					this.animDelay = 50;
					this.phaseInit = true;
				}
				if (this.position.y >= 200) {
					this.phase++;
					this.phaseInit = false;
				}
				break;
			
			// Chase player and shoot fireballs
			case 1:
				if (!this.phaseInit) {
					this.cooldown = false;
					this.stopMoving();
					this.weapons = [{type: "e_ring_fire", count: null}];
					this.phaseInit = false;
				}
				engine.objectAttack(this);
				this.nextPhase();
				break;
			
			// Wiggle it!
			case 2:
				if (!this.phaseInit) {
					this.speed = 0;
					this.animDelay = 100;
					this.phaseTimer.start(2000);
					this.phaseInit = true;
					this.altTimer.start(350);
					this.followUpShot = false;
				}
				if (!this.followUpShot && this.altTimer.expired()) {
					if (this.wounds > (this.hitPoints / 2)) {
						this.cooldown = false;
						this.weapons = [{type: "e_ring_fire_blue", count: null}];
						engine.objectAttack(this);
						this.followUpShot = true;
					}
				}
 				if (this.phaseTimer.expired()) {
					this.phase++;
					this.phaseInit = false;
				}
				this.position.x += horde.randomRange(-1, 1);
				break;

			// Charge player
			case 3:
				if (!this.phaseInit) {
					this.speed = 350;
					this.animDelay = 100;
					this.phaseTimer.start(500);
					this.phaseInit = true;
					var p = engine.getPlayerObject();
					this.chase(p);
				}
				if (this.phaseTimer.expired()) {
					this.phase++;
					this.phaseInit = false;
				}
				break;
			
			// Stand still and spew flames!
			case 4:
				if (!this.phaseInit) {
					this.speed = 0;
					this.animDelay = 400;
					this.weapons = [{type: "e_fireball_2", count: null}];
					this.cooldown = false;
					this.cooldownElapsed = 0;
					this.phaseTimer.start(2500);
					this.phaseInit = true;
					this.altTimer.start(750);
				}
				if (this.phaseTimer.expired()) {
					this.phase = 1;
					this.phaseInit = false;
				}
				var p = engine.getPlayerObject();
				this.chase(p);
				if (this.altTimer.expired() && this.wounds > (this.hitPoints / 2)) {
					engine.spawnObject(this, "e_fireball");
					this.altTimer.reset();
				}
				return "shoot";
				break;
			
			/*
			// Kinda stunned, allow player to get some shots in
			case 6:
				if (!this.phaseInit) {
					this.speed = 10;
					this.animDelay = 400;
					this.phaseTimer.start(3000);
					this.phaseInit = true;
				}
				if (this.phaseTimer.expired()) {
					this.phase = 1;
					this.phaseInit = false;
				}
				movementTypes.wander.apply(this, arguments);
				break;
			*/
			
		}

	}

};

// ENEMY WEAPONS

o.e_arrow = {
	role: "projectile",
	cooldown: 3000,
	speed: 200,
	hitPoints: 1,
	damage: 5,
	spriteSheet: "objects",
	spriteX: 256,
	spriteY: 0,
	spriteAlign: true,
	bounce: false
};

o.e_trident = {
	role: "projectile",
	cooldown: 5000,
	speed: 200,
	hitPoints: 1,
	damage: 10,
	spriteSheet: "objects",
	spriteX: 160,
	spriteY: 0,
	spriteAlign: true,
	bounce: false
};

o.e_boulder = {
	role: "projectile",
	cooldown: 1500,
	speed: 150,
	hitPoints: Infinity,
	damage: 15,
	spriteSheet: "objects",
	spriteX: 224,
	spriteY: 0,
	rotate: true,
	bounce: false
};

o.e_bouncing_boulder = {
	role: "projectile",
	cooldown: 1500,
	speed: 150,
	hitPoints: Infinity,
	damage: 15,
	spriteSheet: "objects",
	spriteX: 224,
	spriteY: 0,
	rotate: true,
	bounce: true,
	ttl: 5000
};

o.e_energy_ball = {
	role: "projectile",
	cooldown: 2000,
	speed: 200,
	hitPoints: Infinity,
	damage: 20,
	spriteSheet: "objects",
	spriteX: 320,
	spriteY: 0,
	rotate: true,
	bounce: false,
	damageType: "magic"
};

o.e_ring_fire = {
	role: "projectile",
	cooldown: 2000,
	speed: 200,
	hitPoints: Infinity,
	damage: 20,
	spriteSheet: "objects",
	spriteX: 352,
	spriteY: 0,
	rotate: true,
	bounce: false,
	damageType: "magic"
};

o.e_ring_fire_blue = {
	role: "projectile",
	cooldown: 2000,
	speed: 150,
	hitPoints: Infinity,
	damage: 25,
	spriteSheet: "objects",
	spriteX: 288,
	spriteY: 32,
	rotate: true,
	bounce: false,
	damageType: "magic"
};

o.e_fireball = {
	role: "projectile",
	cooldown: 2000,
	speed: 350,
	hitPoints: Infinity,
	damage: 20,
	spriteSheet: "objects",
	spriteX: 288,
	spriteY: 32,
	rotate: true,
	bounce: false,
	damageType: "magic"
};

o.e_fireball_2 = {
	role: "projectile",
	cooldown: 75,
	speed: 350,
	hitPoints: Infinity,
	damage: 10,
	spriteSheet: "objects",
	spriteX: 352,
	spriteY: 0,
	rotate: true,
	ttl: 400,
	bounce: false,
	damageType: "magic"
};

o.e_static_blue_fire = {
	role: "projectile",
	cooldown: 100,
	speed: 0,
	hitPoints: Infinity,
	damage: 5,
	spriteSheet: "objects",
	spriteX: 288,
	spriteY: 32,
	rotate: true,
	rotateSpeed: 100,
	ttl: 1000,
	bounce: false,
	drawIndex: 0,
	damageType: "magic"
};

o.e_dirt_pile = {
	role: "trap",
	cooldown: 100,
	speed: 0,
	hitPoints: Infinity,
	damage: 0,
	spriteSheet: "characters",
	spriteX: 0,
	spriteY: 448,
	//animated: true,
	ttl: 3000,
	bounce: false,
	drawIndex: -2,
	
	onInit: function () {
		if (horde.randomRange(1, 10) > 5) {
			this.spriteX += 32;
		}
	},
	
	onDamage: function (defender) {
		if (defender.team !== this.team) {
			defender.addState(horde.Object.states.SLOWED, 750);
		}
	}
	
};

o.e_spit_pool = {
	role: "trap",
	cooldown: 100,
	speed: 0,
	hitPoints: 9999,
	damage: 5,
	size: new horde.Size(64, 64),
	spriteSheet: "characters",
	spriteX: 896,
	spriteY: 416,
	animated: true,
	ttl: 7500,
	bounce: false,
	drawIndex: -1,
	
	onDamage: function (defender) {
		if (defender.team !== this.team) {
			defender.addState(horde.Object.states.SLOWED, 750);
		}
	}
	
};

o.e_shock_wave = {
	role: "projectile",
	cooldown: 1000,
	speed: 200,
	hitPoints: Infinity,
	damage: 15,
	spriteSheet: "objects",
	spriteX: 224,
	spriteY: 32,
	spriteAlign: true,
	bounce: false,
	animated: true,
	damageType: "magic"
};

o.e_worm_spit = {
	role: "projectile",
	cooldown: 1000,
	speed: 200,
	hitPoints: 1,
	damage: 10,
	spriteSheet: "objects",
	spriteX: 128,
	spriteY: 64,
	spriteAlign: true,
	bounce: false,
	animated: true,
	ttl: 1200,
	damageType: "magic",
	onDelete: function (engine) {
		engine.spawnObject(this, "e_spit_pool");
	}
	
};

// OTHER SHIT

o.mini_heart = {
	role: "fluff",
	spriteSheet: "objects",
	spriteX: 288,
	spriteY: 128,
	size: new horde.Size(10, 10),
	ttl: 600,
	speed: 75,
	collidable: false,
	drawIndex: 5,
	onInit: function () {
		this.setDirection(new horde.Vector2(0, -1));
		this.speed = horde.randomRange(55, 85);
	}
	
};

o.mini_sparkle = {
	role: "fluff",
	spriteSheet: "objects",
	spriteX: 224,
	spriteY: 128,
	size: new horde.Size(14, 18),
	ttl: 600,
	speed: 75,
	collidable: false,
	drawIndex: 5,
	onInit: function () {
		this.setDirection(new horde.Vector2(0, -1));
		this.speed = horde.randomRange(55, 85);
	}
	
};

o.mini_sword = {
	role: "fluff",
	spriteSheet: "objects",
	spriteX: 256,
	spriteY: 128,
	size: new horde.Size(10, 16),
	ttl: 600,
	speed: 75,
	collidable: false,
	drawIndex: 5,
	onInit: function () {
		this.setDirection(new horde.Vector2(0, -1));
		this.speed = horde.randomRange(55, 85);
	}
	
};



o.cloud = {
	
	role: "fluff",
	spriteSheet: "objects",
	collidable: false,
	
	drawIndex: 10,
	
	onInit: function () {
		
		this.alpha = 0.25;
		this.speed = horde.randomRange(5, 25);
		this.size = new horde.Size(192, 128);
		
		switch (horde.randomRange(1, 4)) {
			
			case 1:
				this.spriteX = 0;
				this.spriteY = 288;
				break;

			case 2:
				this.spriteX = 192;
				this.spriteY = 288;
				break;

			case 3:
				this.spriteX = 0;
				this.spriteY = 416;
				break;
				
			case 4:
				this.spriteX = 192;
				this.spriteY = 416;
				break;
		}
		
	}
	
};

// GATE

o.gate = {
	role: "fluff",
	speed: 25,
	spriteSheet: "objects",
	spriteX: 0,
	spriteY: 192,
	size: new horde.Size(64, 64)
};

// FOOD (Eat Meat!)

o.item_food = {
	role: "powerup_food",
	healAmount: 10,
	speed: 0,
	spriteSheet: "objects",
	spriteX: 96,
	spriteY: 32,
	ttl: 8000
};

// GOLD (Collect Gold!)

o.item_coin = {
	role: "powerup_coin",
	coinAmount: 10,
	speed: 0,
	spriteSheet: "objects",
	spriteX: 64,
	spriteY: 32,
	ttl: 5000
};

o.item_chest = {
	role: "powerup_coin",
	coinAmount: 100,
	speed: 0,
	spriteSheet: "objects",
	spriteX: 32,
	spriteY: 32,
	ttl: 5000
};

o.item_gold_chest = {
	role: "powerup_coin",
	coinAmount: 500,
	speed: 0,
	spriteSheet: "objects",
	spriteX: 0,
	spriteY: 32,
	ttl: 5000
};

// WEAPON POWERUPS

o.item_weapon_knife = {
	role: "powerup_weapon",
	speed: 0,
	spriteSheet: "objects",
	spriteX: 32,
	spriteY: 0,
	ttl: 5000,
	wepType: "h_knife",
	wepCount: 150
};

o.item_weapon_spear = {
	role: "powerup_weapon",
	speed: 0,
	spriteSheet: "objects",
	spriteX: 96,
	spriteY: 0,
	ttl: 5000,
	wepType: "h_spear",
	wepCount: 75
};

o.item_weapon_fireball = {
	role: "powerup_weapon",
	speed: 0,
	spriteSheet: "objects",
	spriteX: 192,
	spriteY: 0,
	ttl: 5000,
	wepType: "h_fireball",
	wepCount: 100
};

o.item_weapon_bomb = {
	role: "powerup_weapon",
	speed: 0,
	spriteSheet: "objects",
	spriteX: 128,
	spriteY: 0,
	ttl: 5000,
	wepType: "h_bomb",
	wepCount: 10
};

o.item_weapon_axe = {
	role: "powerup_weapon",
	speed: 0,
	spriteSheet: "objects",
	spriteX: 192,
	spriteY: 32,
	ttl: 5000,
	wepType: "h_axe",
	wepCount: 150
};

o.item_weapon_fire_sword = {
	role: "powerup_weapon",
	speed: 0,
	spriteSheet: "objects",
	spriteX: 384,
	spriteY: 0,
	ttl: 5000,
	wepType: "h_fire_sword",
	wepCount: 25
};

}());
