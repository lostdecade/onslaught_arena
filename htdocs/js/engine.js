(function define_horde_Engine () {

var VERSION = 0.3;
var DEMO = false;
var DIFFICULTY_INCREMENT = 0.5;
var GATE_CUTOFF_Y = 64;
var NUM_GATES = 3;
var POINTER_Y_INC = 24;
var POINTER_Y_START = 280;
var SCREEN_WIDTH = 640;
var SCREEN_HEIGHT = 480;
var TEXT_HEIGHT = 20; // Ehh, kind of a hack, because stupid ctx.measureText only gives width (why??).

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
	this.mouse = new horde.Mouse();
	this.view = new horde.Size(SCREEN_WIDTH, SCREEN_HEIGHT);
	this.images = null;
	this.debug = false; // Debugging toggle
	this.konamiEntered = false;
		
	this.gateDirection = ""; // Set to "up" or "down"
	this.gateState = "down"; // "up" or "down"
	this.gatesX = 0;
	this.gatesY = 0;
	this.pointerY = POINTER_Y_START;

	if (typeof(Titanium) == "undefined") {
		this.maxPointerY = (this.pointerY + (POINTER_Y_INC * 2));
	} else {
		this.maxPointerY = (this.pointerY + (POINTER_Y_INC * 3));
	}
	
	this.targetReticle = {
		angle: 0,
		rotateSpeed: 1,
		position: new horde.Vector2()
	};
	
	this.enableClouds = true;
	this.cloudTimer = null;
	
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
 * Toggles pausing the engine
 * @return {void}
 */
proto.togglePause = (function horde_Engine_proto_togglePause () {

	var isMuted = false;

	return function horde_Engine_proto_togglePause () {

		if (this.paused) {
			this.paused = false;
			horde.sound.setMuted(isMuted);
		} else {
			this.paused = true;
			isMuted = horde.sound.isMuted();
			horde.sound.setMuted(true);
		}

	};

})();

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
 * Returns the RGB for either red, orange or green depending on the percentage.
 * @param {Number} max The max number, eg 100.
 * @param {Number} current The current number, eg 50 (which would be 50%).
 * @return {String} The RGB value based on the percentage.
 */
proto.getBarColor = function (max, current) {

	var percentage = ((current / max) * 100);

	if (percentage > 50) {
		return "rgb(98, 187, 70)";
	} else if (percentage > 25) {
		return "rgb(246, 139, 31)";
	} else {
		return "rgb(190, 22, 29)";
	}

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
	this.canvases["buffer"] = horde.makeCanvas("buffer", this.view.width, this.view.height, true);
	
	horde.on("blur", function () {
		if (this.state != "running") return;
		this.keyboard.keyStates = {};
		if (!this.paused) this.togglePause();
	}, window, this);

	// Load just the logo
	this.preloader = new horde.ImageLoader();
	this.preloader.load({
		"logo": "img/ldg.png"
	}, this.preloadComplete, this);
	
	// Load the rest of the image assets
	this.images = new horde.ImageLoader();
	this.images.load({
		"title_screen": "img/title_screen.png",
		"how_to_play": "img/how_to_play.png",
		"credits": "img/credits.png",
		"arena_floor": "img/arena_floor.png",
		"arena_walls": "img/arena_walls.png",
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
	
	horde.sound.init(function () {
	
		var s = horde.sound;
		
		s.create("normal_battle_music", "sound/music/normal_battle.mp3", true, 20);
		s.create("final_battle_music", "sound/music/final_battle.mp3", true, 20);

		s.create("move_pointer", "sound/effects/chest_damage.mp3");
		s.create("eat_food", "sound/effects/chest_food.mp3");
		s.create("coins", "sound/effects/chest_gold.mp3");
		s.create("chest_opens", "sound/effects/chest_opens.mp3");
		s.create("chest_weapon", "sound/effects/chest_weapon.mp3");

		s.create("gate_opens", "sound/effects/gate_opens.mp3");
		s.create("gate_closes", "sound/effects/gate_closes.mp3");

		s.create("hero_attacks", "sound/effects/char_attacks.mp3");
		s.create("hero_damage", "sound/effects/char_damage_3.mp3");
		s.create("hero_dies", "sound/effects/char_dies.mp3");
		
		s.create("fire_attack", "sound/effects/char_attacks_fire.mp3");
		
		s.create("bat_damage", "sound/effects/bat_damage.mp3");
		s.create("bat_dies", "sound/effects/bat_dies.mp3");
		
		s.create("goblin_attacks", "sound/effects/goblin_attacks.mp3");
		s.create("goblin_damage", "sound/effects/goblin_damage.mp3");
		s.create("goblin_dies", "sound/effects/goblin_dies.mp3");
		
		s.create("cyclops_attacks", "sound/effects/cyclops_attacks.mp3");
		s.create("cyclops_damage", "sound/effects/cyclops_damage.mp3");
		s.create("cyclops_dies", "sound/effects/cyclops_dies.mp3");

		s.create("dragon_attacks", "sound/effects/dragon_attacks.mp3");
		s.create("dragon_damage", "sound/effects/dragon_damage.mp3");
		s.create("dragon_dies", "sound/effects/dragon_dies.mp3");
		
	});
	
};

/**
 * Initialize traps
 * @return {void}
 */
proto.initTraps = function horde_Engine_proto_initTraps () {
	
	var spikeLocs = [
		{x: 32, y: 64},
		{x: 32, y: 352},
		{x: 576, y: 64},
		{x: 576, y: 352}
	];
	
	var len = spikeLocs.length;
	
	for (var x = 0; x < len; x++) {
		var pos = spikeLocs[x];
		var s = horde.makeObject("spike_sentry");
		s.position = new horde.Vector2(pos.x, pos.y);
		this.addObject(s);
	}
	
};

proto.initGame = function () {

	this.konamiEntered = false;

	this.closeGates();
	
	this.objects = {};
	this.state = "title";
	
	this.initMap();

	this.initSpawnPoints();
	this.initWaves();
	
	this.initPlayer();
	this.initTraps();

	// Spawn a couple weapons scrolls to give the player an early taste of the fun!
	var player = this.getPlayerObject();
	
	var wep = horde.makeObject("item_weapon");
	wep.position = player.position.clone();
	wep.position.x -= 128;
	this.addObject(wep);

	var wep = horde.makeObject("item_weapon");
	wep.position = player.position.clone();
	wep.position.x += 128;
	this.addObject(wep);

	this.gameOverBg = null;

	this.monstersAlive = 0;

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
 * @return {void}
 */
proto.initSpawnWave = function horde_Engine_proto_initSpawnWave (wave) {
	var longestTTS = 0;
	for (var x in wave.points) {
		var p = wave.points[x];
		var sp = this.spawnPoints[p.spawnPointId];
		sp.delay = p.delay;
		sp.lastSpawnElapsed = sp.delay;
		for (var z in p.objects) {
			var o = p.objects[z];
			sp.queueSpawn(o.type, o.count * this.waveModifier);
		}
		var timeToSpawn = ((sp.queue.length - 1) * sp.delay);
		if (timeToSpawn > longestTTS) {
			longestTTS = timeToSpawn;
		}
	}
	var ttl = longestTTS + wave.nextWaveTime;
	this.waveTimer.start(ttl * this.waveModifier);
	this.openGates();
};

/**
 * Initializes the waves of bad guys!
 * @return {void}
 */
proto.initWaves = function horde_Engine_proto_initWaves () {
	
	this.waves = [];
	this.waveTimer = new horde.Timer();
	this.waveTimer.start(1);
	this.currentWaveId = -1;
	this.waveModifier = 1;

	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "flaming_skull", 1);
	w.addObjects(1, "wizard", 1);
	w.addObjects(2, "flaming_skull", 1);
	w.nextWaveTime = 60000;
	this.waves.push(w);

	// Wave #1
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "goblin", 2);
	w.addObjects(1, "bat", 3);
	w.addObjects(2, "goblin", 2);
	this.waves.push(w);
	
	// Wave #2
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 500);
	w.addSpawnPoint(1, 500);
	w.addSpawnPoint(2, 500);
	w.addObjects(0, "bat", 5);
	w.addObjects(1, "dire_bat", 5);
	w.addObjects(2, "bat", 5);
	this.waves.push(w);
	
	// Wave #3
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 500);
	w.addSpawnPoint(1, 6000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "goblin", 3);
	w.addObjects(1, "cyclops", 1);
	w.addObjects(2, "goblin", 3);
	this.waves.push(w);
	
	// Wave #4
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 200);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 200);
	w.addObjects(0, "demoblin", 3);
	w.addObjects(1, "demoblin", 3);
	w.addObjects(2, "demoblin", 3);
	w.nextWaveTime = 60000; // 1 min
	this.waves.push(w);

	// Wave #5
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 500);
	w.addSpawnPoint(1, 6000);
	w.addSpawnPoint(2, 500);
	w.addObjects(0, "goblin", 5);
	w.addObjects(1, "superclops", 1);
	w.addObjects(2, "goblin", 5);
	w.nextWaveTime = 120000; // 2 min
	this.waves.push(w);

	// Wave #6
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 750);
	w.addSpawnPoint(1, 750);
	w.addSpawnPoint(2, 750);
	w.addObjects(0, "imp", 3);
	w.addObjects(1, "imp", 3);
	w.addObjects(2, "imp", 3);
	w.nextWaveTime = 60000; // 1 min
	this.waves.push(w);

	// Wave #7
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1500);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1500);
	w.addObjects(0, "wizard", 2);
	w.addObjects(1, "wizard", 1);
	w.addObjects(2, "wizard", 2);
	w.nextWaveTime = 60000; // 1 min
	this.waves.push(w);
	
	// Wave #8
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 300);
	w.addSpawnPoint(1, 300);
	w.addSpawnPoint(2, 300);
	w.addObjects(0, "dire_bat", 7);
	w.addObjects(1, "bat", 7);
	w.addObjects(2, "dire_bat", 7);
	w.nextWaveTime = 120000; // 2 min
	this.waves.push(w);

	// Wave #9
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 50);
	w.addSpawnPoint(1, 12000);
	w.addSpawnPoint(2, 50);
	w.addObjects(0, "dire_bat", 3);
	w.addObjects(1, "dragon", 1);
	w.addObjects(2, "dire_bat", 3);
	w.nextWaveTime = 60000 * 5; // 5 mins
	this.waves.push(w);
	
};

/**
 * Initializes the player
 * @return {void}
 */
proto.initPlayer = function horde_Engine_proto_initPlayer () {
	var player = horde.makeObject("hero");
	// NOTE: below line shouldn't be necessary, but it fixes the weapon retention bug for now.
	player.weapons = [
		{type: "h_sword", count: null}
	];
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

	var kb = this.keyboard;
	var keys = horde.Keyboard.Keys;

	if (kb.isKeyDown(keys.ENTER) || kb.isKeyDown(keys.SPACE)) {
		kb.clearKey(keys.ENTER);
		kb.clearKey(keys.SPACE);
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
			this.handleInput();
			this.updateFauxGates(elapsed);
			this.render();
			break;

		case "how_to_play":
			this.handleInput();
			this.render();
			break;

		case "credits":
			this.handleInput();
			this.render();
			break;
			
		// The game!
		case "running":
			this.handleInput();
			if (!this.paused) {
				this.updateWaves(elapsed);
				this.updateSpawnPoints(elapsed);
				this.updateClouds(elapsed);
				this.updateObjects(elapsed);	
				this.updateFauxGates(elapsed);
			}
			this.render();
			break;

		case "game_over":
			this.updateGameOver(elapsed);
			this.render();
			break;

	}

};

proto.updateClouds = function horde_Engine_proto_updateClouds (elapsed) {

	if (this.enableClouds !== true) {
		return;
	}
	
	if (this.cloudTimer === null) {
		this.cloudTimer = new horde.Timer();
		this.cloudTimer.start(2000);
	}
	
	var clouds = 0;
	
	// Kill off clouds that are past the screen
	for (var id in this.objects) {
		var o = this.objects[id];
		if (o.type === "cloud") {
			clouds++;
			if (o.position.x < -(o.size.width)) {
				o.die();
			}
		}
	}

	// Spawn new clouds
	if (clouds < 10 && this.cloudTimer.expired()) {
		if (horde.randomRange(1, 10) >= 1) {
			var numClouds = horde.randomRange(1, 3);
			for (var x = 0; x < numClouds; x++) {
				var cloud = horde.makeObject("cloud");
				cloud.position.x = SCREEN_WIDTH + horde.randomRange(1, 32);
				cloud.position.y = horde.randomRange(
					-(cloud.size.height / 2),
					SCREEN_HEIGHT + (cloud.size.height / 2)
				);
				cloud.setDirection(new horde.Vector2(-1, 0));
				this.addObject(cloud);
			}
		}
		this.cloudTimer.reset();
	}
	
};

/**
 * Updates the spawn points
 * @param {number} elapsed Elapsed time in milliseconds since last update
 * @return {void}
 */
proto.updateSpawnPoints = function horde_Engine_proto_updateSpawnPoints (elapsed) {
	if (this.gateState !== "up") {
		return;
	}
	var closeGates = true;
	// Iterate over the spawn points and update them
	for (var x in this.spawnPoints) {
		if (this.spawnPoints[x].queue.length >= 1) {
			closeGates = false;
		}
		// Spawn points can return an object to spawn
		var o = this.spawnPoints[x].update(elapsed);
		if (o !== false) {
			// We need to spawn an object
			this.addObject(o);
		}
	}
	if (closeGates && !this.monstersAboveGates) {
		this.closeGates();
	}
};

/**
 * Updates the waves
 * @param {number} elapsed Elapsed time in milliseconds since last update
 * @return {void}
 */
proto.updateWaves = function horde_Engine_proto_updateWaves (elapsed) {
	var spawnsEmpty = true;
	for (var x in this.spawnPoints) {
		if (this.spawnPoints[x].queue.length > 0) {
			spawnsEmpty = false;
		}
	}
	// If the timer has expired OR the spawns are empty AND there are no monsters alive
	if (this.waveTimer.expired() || (spawnsEmpty === true && this.monstersAlive === 0)) {
		this.currentWaveId++;
		if (this.currentWaveId >= this.waves.length) {
			// Waves have rolled over, increase the difficulty!!
			this.currentWaveId = 0;
			this.waveModifier += DIFFICULTY_INCREMENT;
			horde.sound.stop("normal_battle_music");
			horde.sound.stop("final_battle_music");
			horde.sound.play("normal_battle_music");
		}
		if (this.currentWaveId === (this.waves.length - 1)) {
			horde.sound.stop("normal_battle_music");
			horde.sound.stop("final_battle_music");
			horde.sound.play("final_battle_music");
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

proto.openGates = function horde_Engine_proto_openGates () {
	if (this.gateState !== "up") {
		this.gateDirection = "up";
		horde.sound.play("gate_opens");
	}
};

proto.closeGates = function horde_Engine_proto_closeGates () {
	if (this.gateState !== "down") {
		this.gateDirection = "down";
		horde.sound.play("gate_closes");
	}
};

proto.updateFauxGates = function horde_Engine_proto_updateFauxGates (elapsed) {

	if (this.gateDirection === "down") {
		this.gatesX = 0;
		this.gatesY += ((200 / 1000) * elapsed);
		if (this.gatesY >= 0) {
			this.gatesX = 0;
			this.gatesY = 0;
			this.gateDirection = "";
			this.gateState = "down";
		}
	}
	
	if (this.gateDirection === "up") {
		this.gatesX = horde.randomRange(-1, 1);
		this.gatesY -= ((50 / 1000) * elapsed);
		if (this.gatesY <= -54) {
			this.gatesX = 0;
			this.gatesY = -54;
			this.gateDirection = "";
			this.gateState = "up";
		}
	}
	
};

/**
 * Returns an array of tiles which intersect a given rectangle
 * @param {horde.Rect} rect Rectangle
 * @return {array} Array of tiles
 */
proto.getTilesByRect = function horde_Engine_proto_getTilesByRect (rect) {

	var tiles = [];

	var origin = new horde.Vector2(rect.left, rect.top);
	var size = new horde.Vector2(rect.width, rect.height);
	
	var begin = origin.clone().scale(1 / this.tileSize.width).floor();
	var end = origin.clone().add(size).scale(1 / this.tileSize.width).floor();
	
	for (var tx = begin.x; tx <= end.x; tx++) {
		for (var ty = begin.y; ty <= end.y; ty++) {
			tiles.push({
				x: tx,
				y: ty
			});
		}
	}
	
	return tiles;
	
};

/**
 * Checks if a given object is colliding with any tiles
 * @param {horde.Object} object Object to check
 * @return {boolean} True if object is colliding with tiles, otherwise false
 */
proto.checkTileCollision = function horde_Engine_proto_checkTileCollision (object) {
	
	var tilesToCheck = this.getTilesByRect(object.boundingBox());
	
	for (var i = 0, len = tilesToCheck.length; i < len; i++) {
		var t = tilesToCheck[i];
		if (this.map[t.y] && this.map[t.y][t.x] === 0) {
			// COLLISION!
			return t;
		}
	}
	
	// No tile collision
	return false;
	
};

proto.moveObject = function horde_Engine_proto_moveObject (object, elapsed) {
	
	if (object.hasState(horde.Object.states.HURTING)) {
		return false;
	}
	
	var px = ((object.speed / 1000) * elapsed);
		
	var axis = [];
	var collisionX = false;
	var collisionY = false;
	
	// Check tile collision for X axis
	if (object.direction.x !== 0) {
		// the object is moving along the "x" axis
		object.position.x += (object.direction.x * px);
		if (object.collidable) {
			var tile = this.checkTileCollision(object);
			if (tile !== false) {
				axis.push("x");
				collisionX = true;
				if (object.direction.x > 0) { // moving right
					object.position.x = tile.x * this.tileSize.width - object.size.width;
				} else { // moving left
					object.position.x = tile.x * this.tileSize.width + this.tileSize.width;
				}
			}
		}
	}
	
	// Check tile collision for Y axis
	if (object.direction.y !== 0) {
		// the object is moving along the "y" axis
		object.position.y += (object.direction.y * px);
		if (object.collidable) {
			var tile = this.checkTileCollision(object);
			if (tile !== false) {
				axis.push("y");
				collisionY = true;
				if (object.direction.y > 0) { // moving down
					object.position.y = tile.y * this.tileSize.height - object.size.height;
				} else { // moving up
					object.position.y = tile.y * this.tileSize.height + this.tileSize.height;
				}
			}
		}
	}
	
	if (object.collidable) {
		
		var yStop = ((this.gateState === "down" || object.role === "monster") ? GATE_CUTOFF_Y : 0);

		if (object.direction.y < 0 && object.position.y < yStop) {
			object.position.y = yStop;
			axis.push("y");
		}

		if (axis.length > 0) {
			object.wallCollide(axis);
		}
		
	}
	
};

proto.spawnLoot = function horde_Engine_proto_spawnLoot (position) {
	
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
		drop.position = position.clone();
		drop.position.y -= 1;
		this.addObject(drop);
	}
	
};

horde.Engine.prototype.updateObjects = function (elapsed) {

	var tr = this.targetReticle;
	tr.angle += (tr.rotateSpeed / 1000) * elapsed;
	if (tr.angle > 360) {
		tr.angle = 0;
	}

	var numMonsters = 0;
	var numMonstersAboveGate = 0;
	
	for (var id in this.objects) {

		var o = this.objects[id];
		
		if (o.isDead()) {
			if (o.role === "hero") {
				this.gameOverReady = false;
				this.gameOverAlpha = 0;
				this.updateGameOver();
				this.state = "game_over";
				return;
			}
			delete(this.objects[o.id]);
			continue;
		}

		if (o.role === "monster") {
			numMonsters++;
			if (o.position.y <= GATE_CUTOFF_Y) {
				numMonstersAboveGate++;
			}
		}

		var action = o.update(elapsed, this);
		switch (action) {
			case "shoot":
				this.objectAttack(o);
				break;
		}

		if (o.isMoving()) {
			this.moveObject(o, elapsed);
		}

		if (
			o.role === "fluff" 
			|| o.role === "powerup_food" 
			|| o.hasState(horde.Object.states.DYING)
			|| o.hasState(horde.Object.states.INVISIBLE)
		) {
			continue;
		}
		
		for (var x in this.objects) {
			var o2 = this.objects[x];
			if (
				o2.isDead() 
				|| o2.team === o.team 
				|| o2.role === "fluff" 
				|| o2.hasState(horde.Object.states.DYING)
				|| o2.hasState(horde.Object.states.INVISIBLE)
			) {
				continue;
			}
			// Reduce the size of the bounding boxes a tad when evaluating object => object collision
			if (o.boundingBox().reduce(5).intersects(o2.boundingBox().reduce(5))) {
				if (o.role == "hero") {
					if (o2.role == "powerup_food") {
						o2.die();
						o.wounds -= o2.healAmount;
						if (o.wounds < 0) o.wounds = 0;
						horde.sound.play("eat_food");
					} else if (o2.role == "powerup_coin") {
						o2.die();
						o.gold += o2.coinAmount;
						horde.sound.play("coins");
					} else if (o2.role == "powerup_weapon") {
						o2.die();
						o.addWeapon(o2.wepType, o2.wepCount);
						horde.sound.play("chest_weapon");
					}
				}
				if (o.team !== null && o2.team !== null && o.team !== o2.team) {
					this.dealDamage(o2, o);
					this.dealDamage(o, o2);
				}
			}
		}
		
	}
	
	this.monstersAlive = numMonsters;
	this.monstersAboveGates = (numMonstersAboveGate > 0);
	
};

// Deals damage from object "attacker" to "defender"
horde.Engine.prototype.dealDamage = function (attacker, defender) {
	if (
		defender.hasState(horde.Object.states.INVINCIBLE) 
		|| defender.role === "trap"
	) {
		// Defender is invincible; gtfo
		return false;
	}
	if (defender.role === "hero") {
		defender.addState(horde.Object.states.INVINCIBLE, 2500);
	}
	if (defender.wound(attacker.damage)) {
		// defender has died; assign gold
		if (attacker.ownerId === null) {
			attacker.gold += defender.worth;
		} else {
			var owner = this.objects[attacker.ownerId];
			if (owner) {
				owner.gold += defender.worth;
			}
		}
		defender.execute("onKilled", [attacker, this]);
		if (defender.role === "monster") {
			this.spawnLoot(defender.position.clone());
		}
	}
};

/**
 * Updates the targeting reticle position based on mouse input
 * @return {void}
 */
proto.updateTargetReticle = function horde_Engine_proto_updateTargetReticle () {
	
	// Grab the current mouse position as a vector
	var mouseV = new horde.Vector2(this.mouse.mouseX, this.mouse.mouseY);

	// Keep the targeting reticle inside of the play area
	// NOTE: This will need to be updated if the non-blocked map area changes
	var mouseBounds = new horde.Rect(
		32, 64, SCREEN_WIDTH - 64, SCREEN_HEIGHT - 160
	);

	var trp = this.targetReticle.position;

	// Adjust the X position
	if (mouseV.x < mouseBounds.left) {
		trp.x = mouseBounds.left;
	} else if (mouseV.x > mouseBounds.left + mouseBounds.width) {
		trp.x = mouseBounds.left + mouseBounds.width;
	} else {
		trp.x = mouseV.x;
	}

	// Adjust the Y position
	if (mouseV.y < mouseBounds.top) {
		trp.y = mouseBounds.top;
	} else if (mouseV.y > mouseBounds.top + mouseBounds.height) {
		trp.y = mouseBounds.top + mouseBounds.height;
	} else {
		trp.y = mouseV.y;
	}
	
};

/**
 * Handles game input
 * @return {void}
 */
proto.handleInput = function horde_Engine_proto_handleInput () {

	var kb = this.keyboard;
	var keys = horde.Keyboard.Keys;
	var buttons = horde.Mouse.Buttons;

	var mouseV = new horde.Vector2(this.mouse.mouseX, this.mouse.mouseY);

	if (this.state == "running") {
		// Press "p" to pause.
		if (this.keyboard.isKeyPressed(80)) {
			this.togglePause();
		}

		// Toggle sound with "M" for "mute".
		if (this.keyboard.isKeyPressed(77)) {
			horde.sound.toggleMuted();
		}

	}

	if (this.state === "title") {

		// ZOMG INFINITE TRIDENTS!!!111!!
		if (!this.konamiEntered && this.keyboard.historyMatch(horde.Keyboard.konamiCode)) {
			horde.sound.play("chest_opens");
			this.konamiEntered = true;

			var p = this.getPlayerObject();
			p.addWeapon("h_trident", null);
		}

		if (kb.isKeyPressed(keys.ENTER) || kb.isKeyPressed(keys.SPACE)) {
		
			kb.clearKey(keys.ENTER);
			kb.clearKey(keys.SPACE);

			switch (this.pointerY) {
				case POINTER_Y_START:
					horde.sound.play("normal_battle_music");
					this.state = "running";
					break;
				case (POINTER_Y_START + POINTER_Y_INC):
					this.state = "how_to_play";
					break;
				case (POINTER_Y_START + POINTER_Y_INC*2):
					this.state = "credits";
					break;
				case (POINTER_Y_START + POINTER_Y_INC*3):
					if (typeof(Titanium) != "undefined") {
						Titanium.App.exit();
					}
					break;
			}

		}

		if (
			this.keyboard.isKeyPressed(keys.W)
			|| this.keyboard.isKeyPressed(keys.UP)
		) {
			this.keyboard.keyStates[keys.W] = false;
			this.keyboard.keyStates[keys.UP] = false;
			this.pointerY -= POINTER_Y_INC;
			if (this.pointerY < POINTER_Y_START) this.pointerY = this.maxPointerY;
			horde.sound.play("move_pointer");
		}
		if (
			this.keyboard.isKeyPressed(keys.S)
			|| this.keyboard.isKeyPressed(keys.DOWN)
		) {
			this.keyboard.keyStates[keys.S] = false;
			this.keyboard.keyStates[keys.DOWN] = false;
			this.pointerY += POINTER_Y_INC;
			if (this.pointerY > this.maxPointerY) this.pointerY = POINTER_Y_START;
			horde.sound.play("move_pointer");
		}

		this.keyboard.storeKeyStates();
		return;

	}

	if (this.state === "how_to_play") {
		if (kb.isKeyPressed(keys.ENTER) || kb.isKeyPressed(keys.SPACE)) {
			kb.clearKey(keys.ENTER);
			kb.clearKey(keys.SPACE);
			this.state = "title";
		}
	}

	if (this.state === "credits") {
		if (kb.isKeyPressed(keys.ENTER) || kb.isKeyPressed(keys.SPACE)) {
			kb.clearKey(keys.ENTER);
			kb.clearKey(keys.SPACE);
			this.state = "title";
		}
	}

	if (this.state === "running") {
		var player = this.getPlayerObject();

		if (this.paused || player.hasState(horde.Object.states.DYING)) {
			this.keyboard.storeKeyStates();
			return;
		}

		this.updateTargetReticle();

		// Determine which way we should move the player
		var move = new horde.Vector2();

		if (
			this.keyboard.isKeyDown(keys.W)
			|| this.keyboard.isKeyDown(keys.UP)
		) {
			move.y = -1;
		}
		if (
			this.keyboard.isKeyDown(keys.A)
			|| this.keyboard.isKeyDown(keys.LEFT)
		) {
			move.x = -1;
		}
		if (
			this.keyboard.isKeyDown(keys.S)
			|| this.keyboard.isKeyDown(keys.DOWN)
		) {
			move.y = 1;
		}
		if (
			this.keyboard.isKeyDown(keys.D)
			|| this.keyboard.isKeyDown(keys.RIGHT)
		) {
			move.x = 1;
		}
		
		// Move the player
		player.stopMoving();
		if ((move.x !== 0) || (move.y !== 0)) {
			player.setDirection(move);
		}

		// Fire using the targeting reticle
		if (this.mouse.isButtonDown(buttons.LEFT)) {
			var v = this.targetReticle.position.clone().subtract(player.position).normalize();
			this.objectAttack(player, v);
		}
		
		// Fire using the keyboard
		if (this.keyboard.isKeyDown(keys.SPACE)) {
			this.objectAttack(player);
		}

		// Cycle weapons (Z)
		if (this.keyboard.isKeyPressed(90)) {
			player.cycleWeapon();
		}
		// X
		if (this.keyboard.isKeyPressed(88)) {
			player.cycleWeapon(true);
		}
		
		this.keyboard.storeKeyStates();
	}

};

proto.objectAttack = function (object, v) {

	var weaponType = object.fireWeapon();
	if (weaponType === false) {
		return;
	}
	
	var weaponDef = horde.objectTypes[weaponType];

	switch (weaponType) {

		// Shoot a fireball in each of the 8 directions
		/*
		case "h_fireball":
			for (var d = 0; d < 8; d++) {
				var dir = horde.directions.toVector(d);
				this.spawnObject(object, weaponType, dir);
			}
			break;
		*/
		
		// Shoot 3 knives in a spread pattern

		case "h_knife":
			var h = v.heading();
			this.spawnObject(object, weaponType, horde.Vector2.fromHeading(
				h - 0.1
			));
			this.spawnObject(object, weaponType, horde.Vector2.fromHeading(
				h + 0.1
			));
			break;


		// Shoot one instance of the weapon in the same
		// direction as the object is currently facing
		default:
			this.spawnObject(object, weaponType, v);
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
		horde.sound.play(sound);
	}

};

proto.render = function horde_Engine_proto_render () {
	
	var ctx = this.canvases["display"].getContext("2d");

	switch (this.state) {

		case "loading":
			ctx.save();
			ctx.fillStyle = "rgb(255, 0, 0)";
			ctx.fillRect(0, 0, this.view.width, this.view.height);
			ctx.restore();
			break;
		
		// Company Logo
		case "intro":
			this.drawLogo(ctx);
			break;
		
		// Title Screen
		case "title":
			this.drawTitle(ctx);
			break;

		// How to Play
		case "how_to_play":
			this.drawTitle(ctx);
			this.drawHowToPlay(ctx);
			break;

		// Credits
		case "credits":
			this.drawTitle(ctx);
			this.drawCredits(ctx);
			break;

		// The game!
		case "running":
			this.drawFloor(ctx);
			this.drawTargetReticle(ctx);
			this.drawWalls(ctx);
			this.drawObjects(ctx);
			this.drawFauxGates(ctx);
			this.drawShadow(ctx);
			this.drawUI(ctx);
			if (this.paused) this.drawPaused(ctx);
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
	ctx.fillStyle = "rgb(0, 0, 255)";
	ctx.fillRect(0, 0, this.view.width, this.view.height);
	ctx.putImageData(this.gameOverBg, 0, 0);
	ctx.restore();

	ctx.save();
	ctx.globalAlpha = this.gameOverAlpha;
	ctx.fillStyle = "rgb(200, 0, 0)";
	ctx.fillRect(0, 0, this.view.width, this.view.height);
	ctx.restore();

	if (this.gameOverReady === true) {

		if (this.keyboard.isKeyDown(horde.Keyboard.Keys.SPACE)) {
			this.keyboard.clearKey(horde.Keyboard.Keys.SPACE);
			this.initGame();
			return;
		}

		var p = this.getPlayerObject();
		
		ctx.save();

		ctx.fillStyle = "rgb(255, 255, 255)";
		ctx.font = "Bold 35px Monospace";
		ctx.globalAlpha = 1;

		ctx.textAlign = "center";
		ctx.fillText("Game Over", 320, 200);

		ctx.drawImage(
			this.images.getImage("objects"),
			64, 32, 32, 32, 260, 224, 32, 32
		);
		ctx.textAlign = "left";
		ctx.fillText(p.gold, 300, 250);

		ctx.textAlign = "center";
		ctx.globalAlpha = this.titleAlpha;
		ctx.fillText("Press space to continue", 320, 300);

		ctx.restore();
		
	}
	
};

proto.drawLogo = function horde_Engine_proto_drawLogo (ctx) {

	// Clear the screen
	ctx.save();
	ctx.fillStyle = "rgb(0, 0, 0)";
	ctx.fillRect(0, 0, this.view.width, this.view.height);
	ctx.restore();
		
	// Draw the logo
	ctx.save();
	ctx.globalAlpha = this.logoAlpha;
	ctx.drawImage(this.preloader.getImage("logo"), 0, 0);
	ctx.restore();
	
};

proto.drawFloor = function horde_Engine_proto_drawFloor (ctx) {
	ctx.drawImage(
		this.images.getImage("arena_floor"),
		0, 0, 576, 386,
		32, 0, 576, 386
	);
};

proto.drawWalls = function horde_Engine_proto_drawWalls (ctx) {
	ctx.drawImage(
		this.images.getImage("arena_walls"),
		0, 0, SCREEN_WIDTH, SCREEN_HEIGHT,
		0, 0, this.view.width, this.view.height
	);
};

proto.drawArena = function horde_Engine_proto_drawArena (ctx) {
	this.drawFloor(ctx);
	this.drawWalls(ctx);
};

proto.drawShadow = function horde_Engine_proto_drawShadow (ctx) {
	ctx.drawImage(
		this.images.getImage("shadow"),
		0, 0, 576, 386,
		32, 0, 576, 386
	);
};

proto.drawPaused = function horde_Engine_proto_drawPaused (ctx) {
	var margin = 50;

	ctx.save();
	ctx.fillStyle = "rgb(0, 0, 0)";
	ctx.globalAlpha = 0.75;
	ctx.fillRect(
		margin, margin,
		(SCREEN_WIDTH - (margin * 2)), (SCREEN_HEIGHT - (margin * 2))
	);
	ctx.restore();

	ctx.save();
	ctx.textAlign = "left";
	ctx.fillStyle = "rgb(255, 255, 255)";
	ctx.font = "Bold 32px Monospace";
	this.centerText(ctx, "Paused", 210);
	ctx.font = "20px Monospace";
	this.centerText(ctx, 'Press "P" to resume.', 240);
	ctx.restore();

};

/**
 * Draws text centered horizontally. Could have many more options.
 */
proto.centerText = function (ctx, text, y) {
	var width = ctx.measureText(text).width;
	ctx.fillText(text, ((SCREEN_WIDTH / 2) - (width / 2)), y);
};

/**
 * Returns the draw order of objects based on their Y position + height
 * @return {array} Array of object IDs in the order that they should be drawn
 */
proto.getObjectDrawOrder = function horde_Engine_proto_getObjectDrawOrder () {
	var drawOrder = [];
	for (var id in this.objects) {
		var obj = this.objects[id];
		drawOrder.push({
			id: obj.id,
			y: obj.position.y + obj.size.height
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
		
		if (o.alpha <= 0 || o.hasState(horde.Object.states.INVISIBLE)) {
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
			ctx.fillStyle = "rgb(255, 0, 255)";
			// Draw a scroll behind the weapon
			ctx.drawImage(
				this.images.getImage("objects"),
				128, 192, 48, 48, -22, -20, 48, 48
			);
		}
		
		ctx.drawImage(
			this.images.getImage(o.spriteSheet),
			s.x, s.y + 1, o.size.width - 1, o.size.height - 1,
			-(o.size.width / 2), -(o.size.height / 2), o.size.width, o.size.height
		);

		// HP bar
		if (
			(this.debug && (o.role === "monster"))
			|| (o.badass && !o.hasState(horde.Object.states.DYING))
		) {
			var hpWidth = (o.size.width - 2);
			var hpHeight = 8;
			var width = (hpWidth - Math.round((hpWidth * o.wounds) / o.hitPoints));

			ctx.fillStyle = "rgb(255, 255, 255)";
			ctx.fillRect(-(o.size.width / 2), (o.size.height / 2), o.size.width, hpHeight);
			ctx.fillStyle = "rgb(0, 0, 0)";
			ctx.fillRect(-(o.size.width / 2) + 1, ((o.size.height / 2) + 1), (o.size.width - 2), (hpHeight - 2));
			ctx.fillStyle = this.getBarColor(o.hitPoints, (o.hitPoints - o.wounds));
			ctx.fillRect(-(o.size.width / 2) + 1, ((o.size.height / 2) + 1), width, (hpHeight - 2));
		}

		ctx.restore();

	}
};

/**
 * Draws the targeting reticle to the screen
 * @param {object} Canvas 2d context to draw on
 * @return {void}
 */
proto.drawTargetReticle = function horde_Engine_proto_drawTargetReticle (ctx) {
	ctx.save();
	ctx.globalAlpha = 0.50;
	ctx.translate(this.targetReticle.position.x, this.targetReticle.position.y);
	ctx.rotate(this.targetReticle.angle);
	ctx.drawImage(
		this.images.getImage("objects"),
		256, 192, 64, 64,
		-32, -32, 64, 64
	);
	ctx.restore();
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

	// Outside border
	ctx.save();
	ctx.fillStyle = "rgb(255, 255, 255)";
	ctx.fillRect(bar.x - 2, bar.y - 2, bar.width + 2, bar.height + 4);
	ctx.fillRect(bar.x + bar.width, bar.y, 2, bar.height);
	ctx.fillStyle = "rgb(0, 0, 0)";
	ctx.fillRect(bar.x, bar.y, bar.width, bar.height);

	// The bar itself
	ctx.fillStyle = this.getBarColor(o.hitPoints, (o.hitPoints - o.wounds));
	ctx.globalAlpha = 0.6;
	ctx.fillRect(bar.x, bar.y, width, bar.height);
	ctx.fillRect(bar.x, bar.y + 5, width, bar.height - 10);
	ctx.fillRect(bar.x, bar.y + 10, width, bar.height - 20);
	ctx.restore();

	// Heart icon
	ctx.drawImage(
		this.images.getImage("objects"),
		64, 192, 42, 42, 18, 424, 42, 42
	);
	
	// Draw gold coin
	ctx.drawImage(
		this.images.getImage("objects"),
		64, 32, 32, 32, 603, 443, 32, 32
	);
	
	// Draw Weapon Icon
	ctx.drawImage(
		this.images.getImage("objects"),
		w.spriteX, w.spriteY, 32, 32, 603, 412, 32, 32
	);
	
	// Draw gold amount and weapon count
	ctx.save();
	ctx.textAlign = "right";
	ctx.fillStyle = "rgb(255, 255, 255)";
	ctx.font = "Bold 32px Monospace";
	ctx.fillText(o.gold, 603, 469);
	ctx.fillText(wCount, 603, 439);
	ctx.restore();

};

/**
 * Draws text, baby.
 * @param {Object} ctx Canvas 2d context to draw on.
 * @param {String} text The string to draw.
 * @param {Number} x The x coordinate.
 * @param {Number} y The y coordinate.
 * @param {Object} params A key/value pair to pass to the drawing context (eg, {globalAlpha : 1}).
 */
proto.drawText = function horde_Engine_proto_drawText (ctx, text, x, y, params) {

	var buffer = this.canvases.buffer.getContext("2d");

	buffer.save();
	buffer.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

	for (var key in params) {
		buffer[key] = params[key];
	}

	buffer.fillText(text, 0, TEXT_HEIGHT);
	buffer.restore();

	ctx.drawImage(
		this.canvases.buffer,
		0, 0,
		SCREEN_WIDTH, SCREEN_HEIGHT,
		x, (y - TEXT_HEIGHT),
		(SCREEN_WIDTH * 2), (SCREEN_HEIGHT * 2)
	);

};

/**
 * Draws the title screen.
 * @param {object} Canvas 2d context to draw on.
 * @return {void}
 */
proto.drawTitle = function horde_Engine_proto_drawTitle (ctx) {
	
	ctx.drawImage(
		this.images.getImage("title_screen"),
		0, 0
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

	var version = ("v" + VERSION + " \u00A9 Lost Decade Games");
	this.drawText(ctx, version, 172, 438, {
		fillStyle : "rgb(0, 0, 0)",
		font : "Bold 10px Monospace"
	});

	this.drawText(ctx, version, 174, 440, {
		fillStyle : "rgb(255, 255, 255)",
		font : "Bold 10px Monospace"
	});

	ctx.save();
	ctx.globalAlpha = 0.75;
	ctx.fillStyle = "rgb(0, 0, 0)";
	ctx.fillRect(185, 245, 270, 105);
	ctx.restore();
	
	ctx.save();
	ctx.fillStyle = "rgb(255, 255, 255)";
	ctx.font = "Bold 24px Monospace";
	ctx.textAlign = "left";

	var params = {
		fillStyle : "rgb(255, 255, 255)",
		font : "Bold 10px Monospace",
		textAlign : "left"
	};

	var textX = 240;
	var textY = (POINTER_Y_START - TEXT_HEIGHT);

	this.drawText(ctx, "Play!", textX, textY, params);
	this.drawText(ctx, "How to play", textX, (textY + POINTER_Y_INC), params);
	this.drawText(ctx, "Credits", textX, (textY + POINTER_Y_INC * 2), params);
	if (typeof(Titanium) != "undefined") {
		this.drawText(ctx, "Exit", textX, (textY + POINTER_Y_INC * 3), params);
	}
	ctx.restore();

	// Sword pointer
	ctx.save();
	ctx.drawImage(
		this.images.getImage("objects"),
		320, 192, 36, 26,
		(textX - 48), (this.pointerY - 20),
		36, 26
	);
	ctx.restore();

};

proto.drawHowToPlay = function horde_Engine_proto_drawHowToPlay (ctx) {
	ctx.save();
	ctx.globalAlpha = 0.5;
	ctx.fillRect(0, 0, this.view.width, this.view.height);
	ctx.globalAlpha = 1;
	ctx.drawImage(
		this.images.getImage("how_to_play"),
		38, 38, 564, 404
	);
	ctx.restore();
};

proto.drawCredits = function horde_Engine_proto_drawCredits (ctx) {
	ctx.save();
	ctx.globalAlpha = 0.5;
	ctx.fillRect(0, 0, this.view.width, this.view.height);
	ctx.globalAlpha = 1;
	ctx.drawImage(
		this.images.getImage("credits"),
		38, 38, 564, 404
	);
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
			0, 192, 64, 64, this.gatesX + 96 + (g * 192), this.gatesY, 64, 64
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
	ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
	ctx.fillRect(0, 0, this.view.width, 30);
	ctx.restore();
	
	// Debugging info
	ctx.save();
	ctx.fillStyle = "rgb(255, 255, 255)";
	ctx.font = "bold 20px Monospace";
	ctx.fillText("Elapsed: " + this.lastElapsed, 10, 20);
	ctx.restore();
	
};

}());
