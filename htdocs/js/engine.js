(function define_horde_Engine () {

const VERSION = 0.1;
const DIFFICULTY_INCREMENT = 0.5;
const NUM_GATES = 3;

var gatesX = 0;
var gatesY = 0;

/**
 * Creates a new Engine object
 * @constructor
 */
horde.Engine = function horde_Engine () {
	this.lastUpdate = 0;
	this.canvases = {};
	this.map = null;
	this.spawnPoints = [];
	this.objects = {};
	this.objectIdSeed = 0;
	this.playerObjectId = null;
	this.keyboard = new horde.Keyboard();
	this.view = new horde.Size(640, 480);
	this.images = null;
	this.debug = false; // Debugging toggle
	this.konamiEntered = false;
	this.gatesUp = false;
};

var proto = horde.Engine.prototype;

/**
 * Runs the engine
 * @return {void}
 */
proto.run = function horde_Engine_proto_run () {
	this.init();
	this.lastUpdate = horde.now();
	this.interval = horde.setInterval(0, this.update, this);
};

/**
 * Stops the engine
 * @return {void}
 */
proto.stop = function horde_Engine_proto_stop () {
	window.clearInterval(this.interval);
};

/**
 * Adds an object to the engine's collection
 * @param {horde.Object} Object to add
 * @return {number} ID of the newly added object
 */ 
proto.addObject = function horde_Engine_proto_addObject (object) {
	this.objectIdSeed++;
	var id = "o" + this.objectIdSeed;
	object.id = id;
	this.objects[id] = object;
	return id;
};

/**
 * Spawns an object from a parent object
 * @param {horde.Object} parent Parent object
 * @param {string} type Type of object to spawn
 * @return {void}
 */
proto.spawnObject = function horde_Engine_proto_spawnObject (parent, type, facing) {
	var f = facing || parent.facing;
	var o = horde.makeObject(type, true);
	o.ownerId = parent.id;
	o.team = parent.team;
	o.centerOn(parent.boundingBox().center());
	o.setDirection(f);
	o.init();
	this.addObject(o);
};

/**
 * Returns the currently "active" object
 * In our case this is the player avatar
 * @return {horde.Object} Player object
 */
proto.getPlayerObject = function horde_Engine_proto_getPlayerObject () {
	return this.objects[this.playerObjectId];
};

proto.preloadComplete = function () {
	this.state = "intro";
	this.logoAlpha = 0;
	this.logoFade = "in";
	this.logoFadeSpeed = 0.5;
};

/**
 * Initializes the engine
 * @return {void}
 */
proto.init = function horde_Engine_proto_init () {

	this.state = "intro";

	this.canvases["display"] = horde.makeCanvas("display", this.view.width, this.view.height);

	// Load just the logo
	this.preloader = new horde.ImageLoader();
	this.preloader.load({
		"logo": "img/ldg.png"
	}, this.preloadComplete, this);
	
	// Load the rest of the image assets
	this.images = new horde.ImageLoader();
	this.images.load({
		"title": "img/title.png",
		"background": "img/arena.png",
		"shadow": "img/arena_shadow.png",
		"characters": "img/sheet_characters.png",
		"objects": "img/sheet_objects.png"
	}, this.handleImagesLoaded, this);
	
	this.initSound();
	
};

/**
 * Initializes music and sound effects
 * @return {void}
 */
proto.initSound = function horde_Engine_proto_initSound () {
	
	var sm = soundManager;
	
	// SoundManager2 config
	sm.useFastPolling = true;
	sm.useHighPerformance = true;
	sm.autoLoad = true;
	sm.multiShot = true;
	sm.volume = 100;

	sm.onload = function () {
		
		sm.createSound({
			id: "normal_battle_music", 
			url: "sound/music/normal_battle.mp3",
			volume: 20,
			loops: "infinite"
		});
		
		sm.createSound({
			id: "final_battle_music",
			url: "sound/music/final_battle.mp3",
			volume: 20,
			loops: "infinite"
		});

		sm.createSound("eat_food", "sound/effects/chest_food.mp3");
		sm.createSound("coins", "sound/effects/chest_gold.mp3");
		sm.createSound("chest_opens", "sound/effects/chest_opens.mp3");
		sm.createSound("chest_weapon", "sound/effects/chest_weapon.mp3");

		sm.createSound("gate_opens", "sound/effects/gate_opens.mp3");
		sm.createSound("gate_closes", "sound/effects/gate_closes.mp3");

		sm.createSound("hero_attacks", "sound/effects/char_attacks.mp3");
		sm.createSound("hero_damage", "sound/effects/char_damage_3.mp3");
		sm.createSound("hero_dies", "sound/effects/char_dies.mp3");
		
		sm.createSound("fire_attack", "sound/effects/char_attacks_fire.mp3");
		
		sm.createSound("bat_damage", "sound/effects/bat_damage.mp3");
		sm.createSound("bat_dies", "sound/effects/bat_dies.mp3");
		
		sm.createSound("goblin_attacks", "sound/effects/goblin_attacks.mp3");
		sm.createSound("goblin_damage", "sound/effects/goblin_damage.mp3");
		sm.createSound("goblin_dies", "sound/effects/goblin_dies.mp3");
		
		sm.createSound("cyclops_attacks", "sound/effects/cyclops_attacks.mp3");
		sm.createSound("cyclops_damage", "sound/effects/cyclops_damage.mp3");
		sm.createSound("cyclops_dies", "sound/effects/cyclops_dies.mp3");
		
	};

};

proto.initGame = function () {

	if (gatesY < 0) horde.playSound("gate_closes");
	
	this.objects = {};
	this.state = "title";
	
	this.initMap();

	this.initSpawnPoints();
	this.initWaves();
	
	this.initPlayer();

	this.gameOverBg = null;

};

/**
 * Initializes the map
 * @return {void}
 */
proto.initMap = function horde_Engine_proto_initMap () {
	this.tileSize = new horde.Size(32, 32);
	this.map = [
		[0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0],
		[0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0],
		[0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
		[0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
		[0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
		[0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
		[0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
		[0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
		[0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
		[0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
		[0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
		[0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
		[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
	];
};

/**
 * Initialize the spawn points
 * @return {void}
 */
proto.initSpawnPoints = function horde_Engine_proto_initSpawnPoints () {
	
	this.spawnPoints = [];
	
	// Left gate (index 0)
	this.spawnPoints.push(new horde.SpawnPoint(
		3 * this.tileSize.width, -2 * this.tileSize.height,
		this.tileSize.width * 2, this.tileSize.height * 2
	));
	
	// Center gate (index 1)
	this.spawnPoints.push(new horde.SpawnPoint(
		9 * this.tileSize.width, -2 * this.tileSize.height,
		this.tileSize.width * 2, this.tileSize.height * 2
	));
	
	// Right gate (index 2)
	this.spawnPoints.push(new horde.SpawnPoint(
		15 * this.tileSize.width, -2 * this.tileSize.height,
		this.tileSize.width * 2, this.tileSize.height * 2
	));
	
};

/**
 * Queues up a wave of spawns in the spawn points
 * @param {horde.SpawnWave} Wave to spawn
 * @param {void}
 */
proto.initSpawnWave = function horde_Engine_proto_initSpawnWave (wave) {
	for (var x in wave.points) {
		var p = wave.points[x];
		var sp = this.spawnPoints[p.spawnPointId];
		sp.delay = p.delay;
		sp.lastSpawnElapsed = sp.delay;
		for (var z in p.objects) {
			var o = p.objects[z];
			sp.queueSpawn(o.type, o.count * this.waveModifier);
		}
	}
};

/**
 * Initializes the waves of bad guys!
 * @return {void}
 */
proto.initWaves = function horde_Engine_proto_initWaves () {
	
	this.waves = [];
	this.waveDelay = 20000;
	this.lastWaveElapsed = this.waveDelay;
	this.currentWaveId = -1;
	this.waveModifier = 1;
	
	// Wave #1
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "goblin", 5);
	w.addObjects(0, "bat", 5);
	w.addObjects(1, "bat", 5);
	w.addObjects(2, "bat", 5);
	this.waves.push(w);
	
	// Wave #2
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 2000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "goblin", 5);
	w.addObjects(1, "goblin", 5);
	w.addObjects(2, "goblin", 5);
	this.waves.push(w);
	
	// Wave #3
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "goblin", 5);
	w.addObjects(0, "bat", 5);
	w.addObjects(1, "bat", 10);
	w.addObjects(1, "goblin", 10);
	w.addObjects(2, "goblin", 5);
	w.addObjects(2, "bat", 5);
	this.waves.push(w);
	
	// Wave #4
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 200);
	w.addSpawnPoint(1, 200);
	w.addSpawnPoint(2, 200);
	w.addObjects(0, "dire_bat", 5);
	w.addObjects(1, "demoblin", 5);
	w.addObjects(2, "dire_bat", 5);
	this.waves.push(w);

	// Wave #5
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 200);
	w.addSpawnPoint(1, 2000);
	w.addSpawnPoint(2, 200);
	w.addObjects(0, "dire_bat", 5);
	w.addObjects(1, "cyclops", 1);
	w.addObjects(2, "dire_bat", 5);
	this.waves.push(w);
	
	// Wave 6
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 2000);
	w.addSpawnPoint(1, 2000);
	w.addSpawnPoint(2, 2000);
	w.addObjects(0, "cyclops", 2);
	w.addObjects(1, "superclops", 1);
	w.addObjects(2, "cyclops", 2);
	this.waves.push(w);

};

/**
 * Initializes the player
 * @return {void}
 */
proto.initPlayer = function horde_Engine_proto_initPlayer () {
	var player = horde.makeObject("hero");
	player.centerOn(horde.Vector2.fromSize(this.view).scale(0.5));
	this.playerObjectId = this.addObject(player);
};

horde.Engine.prototype.handleImagesLoaded = function horde_Engine_proto_handleImagesLoaded () {
	this.imagesLoaded = true;
};

proto.logoFadeOut = function () {
	this.logoFade = "out";
};

proto.updateLogo = function (elapsed) {

	if (this.keyboard.keyStates[32]) {
		this.keyboard.keyStates[32] = false; // HACK: not very elegant to force the key off
		this.initGame();
	}

	if (this.logoFade === "in") {
		this.logoAlpha += ((this.logoFadeSpeed / 1000) * elapsed);
		if (this.logoAlpha >= 1) {
			this.logoAlpha = 1;
			this.logoFade = "none";
			horde.setTimeout(1000, this.logoFadeOut, this);
		}
	} else if (this.logoFade === "out") {
		this.logoAlpha -= ((this.logoFadeSpeed / 1000) * elapsed);
		if (this.logoAlpha <= 0) {
			this.logoAlpha = 0;
			this.logoFade = "none";
			this.initGame();
		}
	}
};

horde.Engine.prototype.update = function horde_Engine_proto_update () {

	var now = horde.now();
	var elapsed = (now - this.lastUpdate);
	this.lastUpdate = now;

	this.lastElapsed = elapsed;

	if (this.imagesLoaded !== true) {
		return;
	}

	switch (this.state) {

		case "loading":
			this.render();
			break;
		
		case "intro":
			this.updateLogo(elapsed);
			this.render();
			break;

		case "title":
			if (gatesY < 0) {
				gatesY += ((200 / 1000) * elapsed);
			}
			this.handleInput();
			this.render();
			break;
			
		// The game!
		case "running":
			this.handleInput();
			this.updateWaves(elapsed);
			this.updateSpawnPoints(elapsed);
			this.updateObjects(elapsed);
			this.updateFauxGates(elapsed);
			this.render();
			break;

		case "game_over":
			this.updateGameOver(elapsed);
			this.render();
			break;

	}

};

/**
 * Updates the spawn points
 * @param {number} elapsed Elapsed time in milliseconds since last update
 * @return {void}
 */
proto.updateSpawnPoints = function horde_Engine_proto_updateSpawnPoints (elapsed) {
	// Iterate over the spawn points and update them
	for (var x in this.spawnPoints) {
		// Spawn points can return an object to spawn
		var o = this.spawnPoints[x].update(elapsed);
		if (o !== false) {
			// We need to spawn an object
			this.addObject(o);
		}
	}
};

/**
 * Updates the waves
 * @param {number} elapsed Elapsed time in milliseconds since last update
 * @return {void}
 */
proto.updateWaves = function horde_Engine_proto_updateWaves (elapsed) {
	this.lastWaveElapsed += elapsed;
	if (this.lastWaveElapsed >= this.waveDelay) {
		this.lastWaveElapsed = 0;
		this.currentWaveId++;
		if (this.currentWaveId >= this.waves.length) {
			// Waves have rolled over, increase the difficulty!!
			this.currentWaveId = 0;
			soundManager.stop("normal_battle_music");
			soundManager.stop("final_battle_music");
			horde.playSound("normal_battle_music");
			this.waveModifier += DIFFICULTY_INCREMENT;
			this.waveDelay *= this.waveModifier;
		}
		if (this.currentWaveId === (this.waves.length - 1)) {
			soundManager.stop("normal_battle_music");
			soundManager.stop("final_battle_music");
			horde.playSound("final_battle_music");
		}
		this.initSpawnWave(this.waves[this.currentWaveId]);
	}
};

proto.updateGameOver = function horde_Engine_proto_updateGameOver (elapsed) {

	if (!this.gameOverAlpha) {
		this.gameOverReady = false;
		this.gameOverAlpha = 0;
	}

	var alphaChange = ((0.2 / 1000) * elapsed);
	this.gameOverAlpha += Number(alphaChange) || 0;
	if (this.gameOverAlpha >= 0.75) {
		this.gameOverReady = true;
		this.gameOverAlpha = 0.75;
	}

};

proto.updateFauxGates = function horde_Engine_proto_updateFauxGates (elapsed) {

	if (gatesY > -54) {
		gatesX = horde.randomRange(-1, 1);
		gatesY -= ((50 / 1000) * elapsed);
	}

/*
	if (!this.gameOverAlpha) {
		this.gameOverReady = false;
		this.gameOverAlpha = 0;
	}

	var alphaChange = ((0.2 / 1000) * elapsed);
	this.gameOverAlpha += Number(alphaChange) || 0;
	if (this.gameOverAlpha >= 0.75) {
		this.gameOverReady = true;
		this.gameOverAlpha = 0.75;
	}
*/

};

horde.Engine.prototype.updateObjects = function (elapsed) {
	
	for (var id in this.objects) {

		var o = this.objects[id];
		
		if (o.state === "dead") {
			delete(this.objects[o.id]);
			continue;
		}

		var action = o.update(elapsed, this);
		switch (action) {
			case "shoot":
				this.objectAttack(o);
				break;
		}

		var px = ((o.speed / 1000) * elapsed);
		
		var axis = [];
		
		if (o.direction.x !== 0) {
			// the object is moving along the "x" axis
			o.position.x += (o.direction.x * px);
			var b = o.boundingBox();
			var size = new horde.Vector2(b.width, b.height);
			var b = o.position.clone().scale(1 / this.tileSize.width).floor();
			var e = o.position.clone().add(size).scale(1 / this.tileSize.width).floor();
			check_x:
			for (var y = b.y; y <= e.y; y++) {
				for (var x = b.x; x <= e.x; x++) {
					if (this.map[y] && this.map[y][x] === 0) {
						if (o.direction.x > 0) {
							// moving right
							o.position.x = x * this.tileSize.width - o.size.width;
						} else {
							// moving left
							o.position.x = x * this.tileSize.width + this.tileSize.width;
						}
						axis.push("x");
						break check_x;
					}
				}
			}
		}
		
		if (o.direction.y !== 0) {
			// the object is moving along the "y" axis
			o.position.y += (o.direction.y * px);
			var b = o.boundingBox();
			var size = new horde.Vector2(b.width, b.height);
			var b = o.position.clone().scale(1 / this.tileSize.width).floor();
			var e = o.position.clone().add(size).scale(1 / this.tileSize.width).floor();
			check_y:
			for (var y = b.y; y <= e.y; y++) {
				for (var x = b.x; x <= e.x; x++) {
					if (this.map[y] && this.map[y][x] === 0) {
						if (o.direction.y > 0) {
							// moving down
							o.position.y = y * this.tileSize.height - o.size.height;
						} else {
							// moving up
							o.position.y = y * this.tileSize.height + this.tileSize.height;
						}
						axis.push("y");
						break check_y;
					}
				}
			}
		}
		
		if (o.direction.y < 0 && o.position.y < 0) {
			o.position.y = 0;
			axis.push("y");
		}
		
		if (axis.length > 0) {
			o.wallCollide(axis);
		}
		
		if (o.role === "fluff" || o.role === "powerup_food") {
			continue;
		}
		
		for (var x in this.objects) {
			var o2 = this.objects[x];
			if (o2.state !== "alive" || o2.team === o.team || o2.role === "fluff") {
				continue;
			}
			if (o.boundingBox().intersects(o2.boundingBox())) {
				if (o.role == "hero") {
					if (o2.role == "powerup_food") {
						o2.die();
						o.wounds -= o2.healAmount;
						if (o.wounds < 0) o.wounds = 0;
						soundManager.play("eat_food");
					} else if (o2.role == "powerup_coin") {
						o2.die();
						o.gold += o2.coinAmount;
						soundManager.play("coins");
					} else if (o2.role == "powerup_weapon") {
						o2.die();
						o.weapons.push({
							type: o2.wepType,
							count: o2.wepCount
						});
						soundManager.play("chest_weapon");
					}
				}
				if (o.team !== null && o2.team !== null && o.team !== o2.team) {
					this.dealDamage(o2, o);
					this.dealDamage(o, o2);
				}
			}
		}
		
	}
	
};

// Deals damage from object "attacker" to "defender"
horde.Engine.prototype.dealDamage = function (attacker, defender) {
	if (defender.wound(attacker.damage)) {
		// defender has died; assign gold
		if (defender.role === "hero") {

			/*
			// NOTE: TODO: I fail! can't get it to work
			// Draw the hero's death
			var ctx = this.canvases["display"].getContext("2d");
			defender.spriteX = 256;

			this.drawObjects(ctx);
			ctx.drawImage(
				this.images.getImage(defender.spriteSheet),
				s.x, s.y, defender.size.width, defender.size.height,
				-(defender.size.width / 2), -(defender.size.height / 2), defender.size.width, defender.size.height
			);
			*/

			soundManager.stopAll();
			horde.playSound("hero_dies");
			this.gameOverReady = false;
			this.gameOverAlpha = 0;
			this.updateGameOver();
			this.state = "game_over";
			return;
		}
		if (attacker.ownerId === null) {
			attacker.gold += defender.worth;
		} else {
			var owner = this.objects[attacker.ownerId];
			if (owner) {
				owner.gold += defender.worth;
			}
		}
		if (defender.role === "monster") {
			var skull = horde.makeObject(defender.gibletSize + "_skull");
			skull.position = defender.position.clone();
			skull.setDirection(horde.randomDirection());
			this.addObject(skull);
			var numGiblets = horde.randomRange(1, 2);
			for (var g = 0; g < numGiblets; g++) {
				var gib = horde.makeObject(defender.gibletSize + "_giblet");
				gib.position = defender.position.clone();
				gib.setDirection(horde.randomDirection());
				this.addObject(gib);
			}
			
			// Random chance loot!
			if (horde.randomRange(1, 10) > 6) {
				var lootType = "item_coin";
				switch (horde.randomRange(1, 4)) {
					case 3:
						var p = this.getPlayerObject();
						if (p.wounds) {
							lootType = "item_food";
						}
						break;
					case 4:
						lootType = "item_weapon";
						break;
				}				
				var drop = horde.makeObject(lootType);
				drop.position = defender.position.clone();
				this.addObject(drop);
			}

		}
	}
};

/**
 * Handles game input
 * @return {void}
 */
proto.handleInput = function horde_Engine_proto_handleInput () {

	// Toggle sound with "M" for "mute".
	if (this.keyboard.isKeyPressed(77)) {
		horde.soundEnabled = !horde.soundEnabled;
		if (horde.soundEnabled) {
			horde.playSound("normal_battle_music");
		} else {
			soundManager.stopAll();
		}
	}

	// TODO: this is broken!
	if (this.state === "title") {
		if (!this.konamiEntered && this.keyboard.historyMatch(horde.Keyboard.konamiCode)) {
			horde.playSound("chest_opens");
			this.konamiEntered = true;
		}
		if (this.keyboard.isKeyPressed(32)) {
			this.keyboard.keyStates[32] = false;
			if (this.konamiEntered) {
				var p = this.getPlayerObject();
				p.weapons.push({
					type: "h_trident",
					count: null 
				});
/*
				horde.playSound("chest_weapon");
*/
			}
			gatesY = 0;
			horde.playSound("normal_battle_music");
			horde.playSound("gate_opens");
			this.state = "running";
		}
		this.keyboard.storeKeyStates();
		return;
	}

	if (this.state === "running") {
		var player = this.getPlayerObject();

		// Determine which way we should move the player
		var move = new horde.Vector2();
		if (this.keyboard.isKeyDown(37)) {
			move.x = -1;
		}
		if (this.keyboard.isKeyDown(38)) {
			move.y = -1;
		}
		if (this.keyboard.isKeyDown(39)) {
			move.x = 1;
		}
		if (this.keyboard.isKeyDown(40)) {
			move.y = 1;
		}

		// Move the player
		player.stopMoving();
		if ((move.x !== 0) || (move.y !== 0)) {
			player.setDirection(move);
		}

		// Have the player fire
		if (this.keyboard.isKeyDown(32) || player.autoFire === true) {
			this.objectAttack(player);
		}

		this.keyboard.storeKeyStates();
	}

};

proto.objectAttack = function (object) {

	var weaponType = object.fireWeapon();
	if (weaponType === false) {
		return;
	}
	
	var weaponDef = horde.objectTypes[weaponType];

	switch (weaponType) {

		// Shoot a fireball in each of the 8 directions
		case "h_fireball":
			for (var d = 0; d < 8; d++) {
				var dir = horde.directions.toVector(d);
				this.spawnObject(object, weaponType, dir);
			}
			break;

		// Shoot 3 knives in a spread pattern
		case "h_knife":
			var f = horde.directions.fromVector(object.facing);
			for (var o = -1; o < 2; o++) {
				var dir = horde.directions.toVector(f + o);
				this.spawnObject(object, weaponType, dir);
			}
			break;

		// Shoot one instance of the weapon in the same
		// direction as the object is currently facing
		default:
			this.spawnObject(object, weaponType);
			break;
			
	}

	// Determine what sound (if any) to play
	// Attacking sound on weapon type > attacking sound on object performing attack
	var sound = null;
	if (weaponDef.soundAttacks) {
		sound = weaponDef.soundAttacks;
	} else if (object.soundAttacks) {
		sound = object.soundAttacks;
	}
	if (sound !== null) {
		horde.playSound(sound);
	}

};

proto.render = function horde_Engine_proto_render () {
	
	var ctx = this.canvases["display"].getContext("2d");

	switch (this.state) {

		case "loading":
			ctx.save();
			ctx.fillStyle = "rgb(255,0,0)";
			ctx.fillRect(0, 0, this.view.width, this.view.height);
			ctx.restore();
			break;
		
		// Company Logo
		case "intro":
			this.drawLogo(ctx);
			break;
		
		// Title Screen
		case "title":
			this.drawBackground(ctx);
			this.drawFauxGates(ctx);
			this.drawShadow(ctx);
			this.drawTitle(ctx);
			break;

		// The game!
		case "running":
			this.drawBackground(ctx);
			this.drawObjects(ctx);
			this.drawFauxGates(ctx);
			this.drawShadow(ctx);
			this.drawUI(ctx);
			break;
		
		case "game_over":
			this.drawGameOver(ctx);
			break;
		
	}

	if (this.debug === true) {
		this.drawDebugInfo(ctx);
	}
	
};

proto.drawGameOver = function horde_Engine_proto_drawGameOver (ctx) {

	if (!this.titleAlphaStep) {
		this.titleAlphaStep = -0.025;
		this.titleAlpha = 1;
	} else {
		this.titleAlpha += this.titleAlphaStep;
		if (this.titleAlpha <= 0) {
			this.titleAlpha = 0;
			this.titleAlphaStep = 0.025;
		}
		if (this.titleAlpha >= 1) {
			this.titleAlpha = 1;
			this.titleAlphaStep = -0.025;
		}
	}

	if (!this.gameOverBg) {
		this.drawUI(ctx);
		this.gameOverBg = ctx.getImageData(0, 0, this.view.width, this.view.height);
	}
	
	ctx.save();
	ctx.fillStyle = "rgb(0,0,255)";
	ctx.fillRect(0, 0, this.view.width, this.view.height);
	ctx.putImageData(this.gameOverBg, 0, 0);
	ctx.restore();

	ctx.save();
	ctx.globalAlpha = this.gameOverAlpha;
	ctx.fillStyle = "rgb(200, 0, 0)";
	ctx.fillRect(0, 0, this.view.width, this.view.height);
	ctx.restore();

	if (this.gameOverReady === true) {

		if (this.keyboard.keyStates[32]) {
			this.keyboard.keyStates[32] = false; // HACK: not very elegant to force the key off
			this.initGame();
			return;
		}

		var p = this.getPlayerObject();
		
		ctx.save();

		ctx.fillStyle = "rgb(255,255,255)";
		ctx.font = "Bold 35px Monospace";
		ctx.globalAlpha = 1;

		ctx.textAlign = "center";
		ctx.fillText("Game Over", 320, 200);

		ctx.drawImage(
			this.images.getImage("objects"),
			0, 32, 32, 32, 260, 224, 32, 32
		);
		ctx.textAlign = "left";
		ctx.fillText(p.gold, 300, 250);

		ctx.textAlign = "center";
		ctx.globalAlpha = this.titleAlpha;
		ctx.fillText("Press space to play again", 320, 300);

		ctx.restore();
		
	}
	
};

proto.drawLogo = function horde_Engine_proto_drawLogo (ctx) {

	// Clear the screen
	ctx.save();
	ctx.fillStyle = "rgb(0,0,0)";
	ctx.fillRect(0, 0, this.view.width, this.view.height);
	ctx.restore();
		
	// Draw the logo
	ctx.save();
	ctx.globalAlpha = this.logoAlpha;
	ctx.drawImage(this.preloader.getImage("logo"), 0, 0);
	ctx.restore();
	
};

proto.drawBackground = function horde_Engine_proto_drawBackground (ctx) {
	ctx.drawImage(
		this.images.getImage("background"), 
		0, 0, 640, 480, 
		0, 0, this.view.width, this.view.height
	);
};

proto.drawShadow = function horde_Engine_proto_drawShadow (ctx) {
	ctx.drawImage(
		this.images.getImage("shadow"),
		0, 0, 576, 386, 
		32, 0, 576, 386
	);
};

horde.Engine.prototype.getObjectDrawOrder = function () {
	var drawOrder = [];
	for (var id in this.objects) {
		drawOrder.push({
			id: this.objects[id].id,
			y: this.objects[id].position.y
		});
	}
	drawOrder.sort(function (a, b) {
		return a.y - b.y;
	});
	return drawOrder;
};

horde.Engine.prototype.drawObjects = function (ctx) {

	var drawOrder = this.getObjectDrawOrder();

	for (var x in drawOrder) {
	
		var o = this.objects[drawOrder[x].id];
		var s = o.getSpriteXY();
		
		if (o.alpha <= 0) {
			continue;
		}
		
		ctx.save();
		
		ctx.translate(
			o.position.x + o.size.width / 2, 
			o.position.y + o.size.height / 2
		);
		
		if (o.angle !== 0) {
			ctx.rotate(o.angle * Math.PI / 180);
		}
		
		if (o.alpha !== 1) {
			ctx.globalAlpha = o.alpha;
		}

		if (o.role === "powerup_weapon") {
			ctx.fillStyle = "rgb(255,0,255)";
			// Draw a scroll behind the weapon?
			ctx.drawImage(
				this.images.getImage("objects"),
				128, 196, 48, 48, -26, -20, 48, 48
			);
		}
		
		ctx.drawImage(
			this.images.getImage(o.spriteSheet),
			s.x, s.y + 1, o.size.width - 1, o.size.height - 1,
			-(o.size.width / 2), -(o.size.height / 2), o.size.width, o.size.height
		);

		ctx.restore();

	}
};

/**
 * Draws the game UI
 * @param {object} Canvas 2d context to draw on
 * @return {void}
 */
proto.drawUI = function horde_Engine_proto_drawUI (ctx) {
	
	var bar = {
		width : 320,
		height : 24,
		x : 50,
		y : 432
	};
	var o = this.getPlayerObject();
	var weaponInfo = o.getWeaponInfo();
	var w = horde.objectTypes[weaponInfo.type];
	var wCount = (weaponInfo.count === null) ? "\u221E": weaponInfo.count;
	
	// Draw health bar
	var width = (bar.width - Math.round((bar.width * o.wounds) / o.hitPoints));
	ctx.save();

	// Outside border
	ctx.fillStyle = "rgb(255, 255, 255)";
	ctx.fillRect(bar.x - 2, bar.y - 2, bar.width + 2, bar.height + 4);
	ctx.fillRect(bar.x + bar.width, bar.y, 2, bar.height);
	ctx.fillStyle = "rgb(0, 0, 0)";
	ctx.fillRect(bar.x, bar.y, bar.width, bar.height);

	// The bar itself
	ctx.fillStyle = "rgb(190, 22, 29)";
	ctx.fillRect(bar.x, bar.y, width, bar.height);
	ctx.fillStyle = "rgb(238, 28, 36)";
	ctx.fillRect(bar.x, bar.y + 5, width, bar.height - 10);
	ctx.fillStyle = "rgb(243, 97, 102)";
	ctx.fillRect(bar.x, bar.y + 10, width, bar.height - 20);

	// Heart icon
	ctx.drawImage(
		this.images.getImage("objects"),
		64, 192, 42, 42, 18, 424, 42, 42
	);

	ctx.restore();
	
	// Draw gold coin
	ctx.drawImage(
		this.images.getImage("objects"),
		0, 32, 32, 32, 603, 443, 32, 32
	);
	
	// Draw Weapon Icon
	ctx.drawImage(
		this.images.getImage("objects"),
		w.spriteX, w.spriteY, 32, 32, 603, 412, 32, 32
	);
	
	// Draw gold amount and weapon count
	ctx.save();
	ctx.textAlign = "right";
	ctx.fillStyle = "rgb(255,255,255)";
	ctx.font = "Bold 32px Monospace";
	ctx.fillText(o.gold, 603, 469);
	ctx.fillText(wCount, 603, 439);
	ctx.restore();

};

proto.drawTitle = function horde_Engine_proto_drawTitle (ctx) {
	
	ctx.drawImage(
		this.images.getImage("title"),
		320 - 214, 100
	);
	
	if (!this.titleAlphaStep) {
		this.titleAlphaStep = -0.025;
		this.titleAlpha = 1;
	} else {
		this.titleAlpha += this.titleAlphaStep;
		if (this.titleAlpha <= 0) {
			this.titleAlpha = 0;
			this.titleAlphaStep = 0.025;
		}
		if (this.titleAlpha >= 1) {
			this.titleAlpha = 1;
			this.titleAlphaStep = -0.025;
		}
	}

	ctx.save();
	ctx.globalAlpha = 1;
	ctx.font = "Bold 16px Monospace";
	ctx.textAlign = "right";
	ctx.fillStyle = "rgb(0,0,0)";
	ctx.fillText("v" + VERSION + " by Lost Decade Games", 632, 472);
	ctx.fillStyle = "rgb(255,255,255)";
	ctx.fillText("v" + VERSION + " by Lost Decade Games", 630, 470);
	ctx.restore();
	
	ctx.save();
	ctx.globalAlpha = this.titleAlpha;
	ctx.fillStyle = "rgb(0,0,0)";
	ctx.font = "Bold 35px Monospace";
	ctx.textAlign = "left";
	ctx.fillText("Press space to play", 110, 280);
	ctx.restore();

	ctx.save();
	ctx.globalAlpha = 1;
	ctx.fillStyle = "rgb(0,0,0)";
	ctx.font = "20px Monospace";
	ctx.textAlign = "center";
	ctx.fillText("Use arrow keys to move, space to attack.", 320, 330);
	ctx.fillText('Press "M" to mute sound.', 320, 350);
	ctx.restore();
		
};

/**
 * Draws fake gates for the title screen
 * @param {object} Canvas 2d context
 * @return {void}
 */
proto.drawFauxGates = function horde_Engine_proto_drawFauxGates (ctx) {
	for (var g = 0; g < NUM_GATES; g++) {
		ctx.drawImage(
			this.images.getImage("objects"),
			0, 192, 64, 64, gatesX + 96 + (g * 192), gatesY, 64, 64
		);
	}
};

/**
 * Draws debugging information to the screen
 * @param {object} Canvas 2d context
 * @return {void}
 */
proto.drawDebugInfo = function horde_Engine_proto_drawDebugInfo (ctx) {
	
	// Semi-transparent bar so we can see the text
	ctx.save();
	ctx.fillStyle = "rgba(0,0,0,0.3)";
	ctx.fillRect(0, 0, this.view.width, 30);
	ctx.restore();
	
	// Debugging info
	ctx.save();
	ctx.fillStyle = "rgb(255,255,255)";
	ctx.font = "bold 20px Monospace";
	ctx.fillText("Elapsed: " + this.lastElapsed, 10, 20);
	ctx.restore();
	
};

}());
