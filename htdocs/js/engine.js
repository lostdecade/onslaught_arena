(function define_horde_Engine () {

var VERSION = "{{VERSION}}";
var DEMO = false;
var DEFAULT_HIGH_SCORE = 10000;
var DIFFICULTY_INCREMENT = 0.5;
var GATE_CUTOFF_Y = 64;
var HIGH_SCORE_KEY = "high_score";
var NUM_GATES = 3;
var POINTER_Y_INC = 30;
var POINTER_Y_START = 300;
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
	this.view = new horde.Size(SCREEN_WIDTH, SCREEN_HEIGHT);
	this.images = null;
	this.debug = false; // Debugging toggle
	this.konamiEntered = false;
	
	this.gateDirection = ""; // Set to "up" or "down"
	this.gateState = "down"; // "up" or "down"
	this.gatesX = 0;
	this.gatesY = 0;
	this.titlePointerY = 0;
	this.numTitleOptions = 2; // 2 means 3 ... sigh ... ;)
	
	this.targetReticle = {
		angle: 0,
		rotateSpeed: 1,
		position: new horde.Vector2()
	};
	
	this.enableClouds = false;
	this.cloudTimer = null;
	this.woundsTo = 0;
	this.woundsToSpeed = 10;
	
	this.introTimer = new horde.Timer();
	this.introPhase = 0;
	this.introPhaseInit = false;
	
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
	clearInterval(this.interval);
};

/**
 * Toggles pausing the engine
 * Note: isMuted would be used by every instance since it's within its own closure. Ew!
 * @return {void}
 */
proto.togglePause = (function horde_Engine_proto_togglePause () {

	var isMuted = false;

	return function horde_Engine_proto_togglePause () {

		if (this.paused) {
			this.paused = false;
			horde.sound.setMuted(isMuted);
			horde.sound.play("unpause");
		} else {
			this.paused = true;
			isMuted = horde.sound.isMuted();
			horde.sound.play("pause");
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
		return "rgb(238, 28, 36)";
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
	var owner = parent;
	while (owner.ownerId !== null) {
		owner = this.objects[owner.ownerId];
	}
	o.ownerId = owner.id;
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

proto.getObjectCountByType = function horde_Engine_proto_getObjectCountByType (type) {
	var count = 0;
	for (var id in this.objects) {
		var obj = this.objects[id];
		if (obj.type === type) {
			count++;
		}
	}
	return count;
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
	
	this.mouse = new horde.Mouse(this.canvases["display"]);
	
	horde.on("contextmenu", function (e) {
		horde.stopEvent(e);
	}, document.body, this);
	
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
		"paused": "img/paused.png",
		"arena_floor": "img/arena_floor.png",
		"arena_walls": "img/arena_walls.png",
		"shadow": "img/arena_shadow.png",
		"characters": "img/sheet_characters.png",
		"objects": "img/sheet_objects.png",
		"beholder": "img/sheet_beholder.png",
		"stats_defeat": "img/stats_defeat.png",
		"stats_victory": "img/stats_victory.png"
	}, this.handleImagesLoaded, this);

	var highScore = this.getData(HIGH_SCORE_KEY);
	if (highScore === null) {
		this.putData(HIGH_SCORE_KEY, DEFAULT_HIGH_SCORE);
	}
	
	this.initSound();
	
};

/**
 * Initializes music and sound effects
 * @return {void}
 */
proto.initSound = function horde_Engine_proto_initSound () {
	
	horde.sound.init(function () {
	
		var s = horde.sound;
		
		s.create("normal_battle_music", "sound/music/normal_battle", true, 20);
		s.create("final_battle_music", "sound/music/final_battle", true, 20);

		s.create("move_pointer", "sound/effects/chest_damage");
		s.create("eat_food", "sound/effects/chest_food", false, 20);
		s.create("coins", "sound/effects/chest_gold", false, 10);
		s.create("chest_opens", "sound/effects/chest_opens");
		s.create("chest_weapon", "sound/effects/chest_weapon");

		s.create("gate_opens", "sound/effects/gate_opens");
		s.create("gate_closes", "sound/effects/gate_closes");

		s.create("hero_attacks", "sound/effects/char_attacks");
		s.create("hero_damage", "sound/effects/char_damage_3");
		s.create("hero_dies", "sound/effects/char_dies");
		
		s.create("fire_attack", "sound/effects/char_attacks_fire");
		
		s.create("bat_damage", "sound/effects/bat_damage");
		s.create("bat_dies", "sound/effects/bat_dies");
		
		s.create("goblin_attacks", "sound/effects/goblin_attacks");
		s.create("goblin_damage", "sound/effects/goblin_damage");
		s.create("goblin_dies", "sound/effects/goblin_dies");

		s.create("imp_attacks", "sound/effects/imp_attacks");
		s.create("imp_damage", "sound/effects/imp_damage");
		s.create("imp_dies", "sound/effects/imp_dies");
		
		s.create("cyclops_attacks", "sound/effects/cyclops_attacks");
		s.create("cyclops_damage", "sound/effects/cyclops_damage");
		s.create("cyclops_dies", "sound/effects/cyclops_dies");

		s.create("dragon_attacks", "sound/effects/dragon_attacks");
		s.create("dragon_damage", "sound/effects/dragon_damage");
		s.create("dragon_dies", "sound/effects/dragon_dies");

		s.create("cube_attacks", "sound/effects/cube_attacks");
		s.create("cube_damage", "sound/effects/cube_damage");
		s.create("cube_dies", "sound/effects/cube_death");

		s.create("pause", "sound/effects/pause");
		s.create("unpause", "sound/effects/unpause");
		
		s.create("spike_attack", "sound/effects/spike_attacks");
		
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
	//this.initTraps();

	// Spawn a couple weapons scrolls to give the player an early taste of the fun!
	var player = this.getPlayerObject();
	
	var wep = horde.makeObject("item_weapon_knife");
	wep.position = player.position.clone();
	wep.position.x -= 128;
	this.addObject(wep);

	var wep = horde.makeObject("item_weapon_spear");
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

	/*
	// Wave testing code...
	var testWave = 9;
	this.currentWaveId = (testWave - 2);
	*/

	/***** START WAVES *********/

	// Wave 1: Level 1
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "bat", 1);
	w.addObjects(1, "bat", 1);
	w.addObjects(2, "bat", 1);
	w.nextWaveTime = 30000;
	this.waves.push(w);

	// Wave 2
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "goblin", 2);
	w.addObjects(1, "goblin", 2);
	w.addObjects(2, "goblin", 2);
	w.nextWaveTime = 30000;
	this.waves.push(w);

	// Wave 3
	var w = new horde.SpawnWave();
	w.addSpawnPoint(1, 1000);
	w.addObjects(1, "cyclops", 1);
	w.nextWaveTime = 30000;
	this.waves.push(w);

	// Wave 4
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "demoblin", 2);
	w.addObjects(1, "demoblin", 3);
	w.addObjects(2, "demoblin", 2);
	w.nextWaveTime = 30000;
	this.waves.push(w);

	// Wave 5
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 500);
	w.addSpawnPoint(1, 750);
	w.addSpawnPoint(2, 500);
	w.addObjects(0, "bat", 10);
	w.addObjects(0, "goblin", 2);
	w.addObjects(1, "goblin", 2);
	w.addObjects(1, "cyclops", 1);
	w.addObjects(1, "goblin", 5);
	w.addObjects(2, "bat", 10);
	w.addObjects(2, "goblin", 2);
	w.nextWaveTime = 30000;
	this.waves.push(w);
	
	// Wave 6
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "demoblin", 5);
	w.addObjects(0, "cyclops", 1);
	w.addObjects(1, "goblin", 10);
	w.addObjects(2, "demoblin", 5);
	w.addObjects(2, "cyclops", 1);
	w.nextWaveTime = 30000;
	this.waves.push(w);
	
	// Wave 7
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 200);
	w.addSpawnPoint(1, 200);
	w.addSpawnPoint(2, 200);
	w.addObjects(0, "bat", 30);
	w.addObjects(1, "bat", 30);
	w.addObjects(2, "bat", 30);
	w.nextWaveTime = 30000;
	this.waves.push(w);
	
	// Wave 8
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 750);
	w.addSpawnPoint(1, 750);
	w.addSpawnPoint(2, 750);
	w.addObjects(0, "cyclops", 1);
	w.addObjects(1, "cyclops", 1);
	w.addObjects(2, "cyclops", 1);
	w.addObjects(0, "bat", 15);
	w.addObjects(1, "bat", 15);
	w.addObjects(2, "bat", 15);
	w.nextWaveTime = 30000;
	this.waves.push(w);
	
	// Wave 9
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 5000);
	w.addSpawnPoint(1, 1500);
	w.addSpawnPoint(2, 5000);
	w.addObjects(0, "imp", 5);
	w.addObjects(1, "imp", 5);
	w.addObjects(2, "imp", 5);
	w.nextWaveTime = 30000;
	this.waves.push(w);

	// Wave 10: Superclops
	var w = new horde.SpawnWave();
	w.addSpawnPoint(1, 1000);
	w.addObjects(1, "superclops", 1);
	w.nextWaveTime = 60000;
	w.bossWave = true;
	this.waves.push(w);

	// Wave 11: Level 2
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 15000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "sandworm", 2);
	w.addObjects(1, "cyclops", 3);
	w.addObjects(2, "sandworm", 2);
	w.nextWaveTime = 30000;
	this.waves.push(w);

	// Wave 12
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 500);
	w.addSpawnPoint(1, 500);
	w.addSpawnPoint(2, 500);
	w.addObjects(0, "goblin", 5);
	w.addObjects(1, "goblin", 5);
	w.addObjects(2, "goblin", 5);
	w.addObjects(0, "wizard", 2);
	w.addObjects(1, "wizard", 1);
	w.addObjects(2, "wizard", 2);
	w.addObjects(0, "goblin", 5);
	w.addObjects(1, "goblin", 5);
	w.addObjects(2, "goblin", 5);
	w.nextWaveTime = 30000;
	this.waves.push(w);

	// Wave 13
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 5000);
	w.addSpawnPoint(1, 5000);
	w.addSpawnPoint(2, 5000);
	w.addObjects(0, "flaming_skull", 3);
	w.addObjects(1, "flaming_skull", 3);
	w.addObjects(2, "flaming_skull", 3);
	w.nextWaveTime = 45000;
	this.waves.push(w);

	// Wave 14
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "demoblin", 10);
	w.addObjects(1, "demoblin", 10);
	w.addObjects(2, "demoblin", 10);
	w.addObjects(0, "wizard", 3);
	w.addObjects(1, "wizard", 3);
	w.addObjects(2, "wizard", 3);
	w.nextWaveTime = 45000;
	this.waves.push(w);

	// Wave 15
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 15000);
	w.addSpawnPoint(1, 1500);
	w.addSpawnPoint(2, 15000);
	w.addObjects(0, "cyclops", 2);
	w.addObjects(1, "imp", 15);
	w.addObjects(2, "cyclops", 2);
	w.nextWaveTime = 45000;
	this.waves.push(w);

	// Wave 16
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 500);
	w.addSpawnPoint(1, 4000);
	w.addSpawnPoint(2, 500);
	w.addObjects(0, "dire_bat", 10);
	w.addObjects(0, "hunter_goblin", 5);
	w.addObjects(0, "dire_bat", 10);
	w.addObjects(0, "hunter_goblin", 5);
	w.addObjects(1, "sandworm", 3);
	w.addObjects(2, "dire_bat", 10);
	w.addObjects(2, "hunter_goblin", 5);
	w.addObjects(2, "dire_bat", 10);
	w.addObjects(2, "hunter_goblin", 5);
	w.nextWaveTime = 45000;
	this.waves.push(w);

	// Wave 17
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 3000);
	w.addSpawnPoint(1, 1500);
	w.addSpawnPoint(2, 3000);
	w.addObjects(0, "flaming_skull", 3);
	w.addObjects(1, "imp", 5);
	w.addObjects(1, "wizard", 5);
	w.addObjects(2, "flaming_skull", 3);
	w.nextWaveTime = 45000;
	this.waves.push(w);

	// Wave 18
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1500);
	w.addSpawnPoint(1, 1500);
	w.addSpawnPoint(2, 1500);
	w.addObjects(0, "cyclops", 1);
	w.addObjects(0, "goblin", 10);	
	w.addObjects(1, "demoblin", 5);
	w.addObjects(1, "cyclops", 1);
	w.addObjects(1, "demoblin", 10);
	w.addObjects(2, "goblin", 10);
	w.addObjects(2, "cyclops", 1);
	w.nextWaveTime = 45000;
	this.waves.push(w);

	// Wave 19
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 3500);
	w.addSpawnPoint(1, 4000);
	w.addSpawnPoint(2, 5000);
	w.addObjects(0, "wizard", 7);
	w.addObjects(1, "imp", 10);
	w.addObjects(1, "cyclops", 1);
	w.addObjects(2, "sandworm", 4);
	w.nextWaveTime = 30000;
	this.waves.push(w);

	// Dragon
	var w = new horde.SpawnWave();
	w.addSpawnPoint(1, 1000);
	w.addObjects(1, "dragon", 1);
	w.nextWaveTime = 120000;
	w.bossWave = true;
	this.waves.push(w);
	
	/*
	// Level 3
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	//w.addObjects(0, "goblin", 1);
	w.addObjects(1, "goblin", 1);
	//w.addObjects(2, "goblin", 1);
	w.nextWaveTime = 30000;
	this.waves.push(w);

	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	//w.addObjects(0, "goblin", 1);
	w.addObjects(1, "goblin", 1);
	//w.addObjects(2, "goblin", 1);
	w.nextWaveTime = 30000;
	this.waves.push(w);

	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	//w.addObjects(0, "goblin", 1);
	w.addObjects(1, "goblin", 1);
	//w.addObjects(2, "goblin", 1);
	w.nextWaveTime = 30000;
	this.waves.push(w);

	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	//w.addObjects(0, "goblin", 1);
	w.addObjects(1, "goblin", 1);
	//w.addObjects(2, "goblin", 1);
	w.nextWaveTime = 30000;
	this.waves.push(w);
	*/
	
	// Gelatinous Cube
	var w = new horde.SpawnWave();
	w.addSpawnPoint(1, 1000);
	w.addObjects(1, "cube", 1);
	w.nextWaveTime = 60000;
	w.bossWave = true;
	this.waves.push(w);

	/*
	// Level 4
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	//w.addObjects(0, "goblin", 1);
	w.addObjects(1, "goblin", 1);
	//w.addObjects(2, "goblin", 1);
	w.nextWaveTime = 30000;
	this.waves.push(w);

	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	//w.addObjects(0, "goblin", 1);
	w.addObjects(1, "goblin", 1);
	//w.addObjects(2, "goblin", 1);
	w.nextWaveTime = 30000;
	this.waves.push(w);

	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	//w.addObjects(0, "goblin", 1);
	w.addObjects(1, "goblin", 1);
	//w.addObjects(2, "goblin", 1);
	w.nextWaveTime = 30000;
	this.waves.push(w);

	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	//w.addObjects(0, "goblin", 1);
	w.addObjects(1, "goblin", 1);
	//w.addObjects(2, "goblin", 1);
	w.nextWaveTime = 30000;
	this.waves.push(w);

	// Beholder
	var w = new horde.SpawnWave();
	w.addSpawnPoint(1, 1000);
	w.addObjects(1, "demoblin", 1);
	w.nextWaveTime = 60000;
	w.bossWave = true;
	this.waves.push(w);

	// Wave 41: Level 5
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "cyclops", 1);
	w.addObjects(1, "superclops", 1);
	w.addObjects(2, "cyclops", 1);
	w.nextWaveTime = 120000;
	this.waves.push(w);

	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	//w.addObjects(0, "goblin", 1);
	w.addObjects(1, "goblin", 1);
	//w.addObjects(2, "goblin", 1);
	w.nextWaveTime = 30000;
	this.waves.push(w);

	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	//w.addObjects(0, "goblin", 1);
	w.addObjects(1, "goblin", 1);
	//w.addObjects(2, "goblin", 1);
	w.nextWaveTime = 30000;
	this.waves.push(w);

	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	//w.addObjects(0, "goblin", 1);
	w.addObjects(1, "goblin", 1);
	//w.addObjects(2, "goblin", 1);
	w.nextWaveTime = 30000;
	this.waves.push(w);

	// Nega Xam
	var w = new horde.SpawnWave();
	w.addSpawnPoint(1, 1000);
	w.addObjects(1, "demoblin", 1);
	w.nextWaveTime = 60000;
	w.bossWave = true;
	this.waves.push(w);
	*/
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

	if (this.keyboard.isAnyKeyPressed()) {
		kb.clearKeys();
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

proto.updateIntroCinematic = function horde_Engine_proto_updateIntroCinematic (elapsed) {
	
	this.introTimer.update(elapsed);
	
	switch (this.introPhase) {
		
		// Fade out
		case 0:
			if (!this.introPhaseInit) {
				this.introFadeAlpha = 0;
				this.introPhaseInit = true;
			}
			this.introFadeAlpha += (1 / 1000) * elapsed;
			if (this.introFadeAlpha >= 1) {
				this.introFadeAlpha = 1;
				this.introPhase++;
				this.introPhaseInit = false;
			}
			break;
		
		// Fade in
		case 1:
			if (!this.introPhaseInit) {
				this.introFadeAlpha = 1;
				this.introPhaseInit = true;
			}
			this.introFadeAlpha -= (0.5 / 1000) * elapsed;
			if (this.introFadeAlpha <= 0) {
				this.introFadeAlpha = 0;
				this.introPhase++;
				this.introPhaseInit = false;
			}
			break;
		
		// Wait for a sec...
		case 2:
			if (!this.introPhaseInit) {
				this.introTimer.start(1000);
				this.introPhaseInit = true;
			}
			if (this.introTimer.expired()) {
				this.introPhase++;
				this.introPhaseInit = false;
			}
			break;
			
		// Open the gates
		case 3:
			if (!this.introPhaseInit) {
				this.openGates();
				this.introPhaseInit = true;
			}
			if (this.gateState === "up") {
				this.introPhase++;
				this.introPhaseInit = false;
			}
			break;
		
		// Move hero out
		case 4:
			if (!this.introPhaseInit) {
				var h = horde.makeObject("hero");
				h.position.x = 304;
				h.position.y = -64;
				h.collidable = false;
				h.setDirection(new horde.Vector2(0, 1));
				this.introHero = h;
				this.introPhaseInit = true;
			}
			this.introHero.update(elapsed);
			this.moveObject(this.introHero, elapsed);
			if (this.introHero.position.y >= 222) {
				this.introHero.centerOn(horde.Vector2.fromSize(this.view).scale(0.5));
				this.introHero.stopMoving();
				this.introPhase++;
				this.introPhaseInit = false;
			}
			break;
		
		case 5:
		case 6:
		case 8:
			if (!this.introPhaseInit) {
				this.introTimer.start(500);
				this.introPhaseInit = true;
			}
			if (this.introTimer.expired()) {
				this.introPhase++;
				this.introPhaseInit = false;
			}
			break;
		
		case 7:
			if (!this.introPhaseInit) {
				this.closeGates();
				this.introPhaseInit = true;
			}
			if (this.gateState === "down") {
				this.introPhase++;
				this.introPhaseInit = false;
			}
			break;
		
		case 9:
			if (!this.introPhaseInit) {
				this.introTimer.start(1000);
				this.introPhaseInit = true;
			}
			this.introHero.update(elapsed);
			if (this.introTimer.expired()) {
				horde.sound.play("normal_battle_music");
				this.state = "running";
			}
			break;

	}
	
};

proto.update = function horde_Engine_proto_update () {

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
			
		case "intro_cinematic":
			this.handleInput();
			this.updateIntroCinematic(elapsed);
			this.updateFauxGates(elapsed);
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
	
	this.cloudTimer.update(elapsed);
	
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
	this.waveTimer.update(elapsed);
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
		}
		if (this.waves[this.currentWaveId].bossWave) {
			if (!horde.sound.isPlaying("final_battle_music")) {
				horde.sound.stop("normal_battle_music");
				horde.sound.play("final_battle_music");
			}
		} else {
			if (!horde.sound.isPlaying("normal_battle_music")) {
				horde.sound.stop("final_battle_music");
				horde.sound.play("normal_battle_music");
			}
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
	
	if (!object.badass && object.hasState(horde.Object.states.HURTING)) {
		return false;
	}
	
	var speed = object.speed;
	if (object.hasState(horde.Object.states.SLOWED)) {
		speed *= 0.15;
	}
	
	var px = ((speed / 1000) * elapsed);
		
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
		
		var yStop = 0;
		if (
			this.gateState === "down"
			|| object.role === "monster"
			|| object.role === "hero"
		) {
			yStop = GATE_CUTOFF_Y;
		}
		
		if (object.direction.y < 0 && object.position.y < yStop) {
			object.position.y = yStop;
			axis.push("y");
		}

		if (axis.length > 0) {
			object.wallCollide(axis);
		}
		
	}
	
};

proto.dropObject = function horde_Engine_proto_dropObject (object, type) {
	var drop = horde.makeObject(type);
	drop.position = object.position.clone();
	drop.position.y -= 1;
	this.addObject(drop);
};

proto.spawnLoot = function horde_Engine_proto_spawnLoot (object) {

	var table = object.lootTable;
	var len = table.length;
	
	var weightedTable = [];
	for (var x = 0; x < len; x++) {
		var entry = table[x];
		for (var j = 0; j < entry.weight; j++) {
			weightedTable.push(entry.type);
		}
	}
	
	var rand = horde.randomRange(0, weightedTable.length - 1);
	var type = weightedTable[rand];
	
	if (type !== null) {
		var player = this.getPlayerObject();
		if (type === "item_food" && player.wounds === 0) {
			type = "item_chest";
		}
		this.dropObject(object, type);
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

				var highScore = Number(this.getData(HIGH_SCORE_KEY));
				if (o.gold > highScore) {
					this.putData(HIGH_SCORE_KEY, o.gold);
				}
				return;
			}
			o.execute("onDelete", [this]);
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

		if (o.isMoving() && !o.hasState(horde.Object.states.STUNNED)) {
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
						o.meatEaten++;
						horde.sound.play("eat_food");
						for (var j = 0; j < 5; ++j) {
							var heart = horde.makeObject("mini_heart");
							heart.position.x = (o.position.x + (j * (o.size.width / 5)));
							heart.position.y = (o.position.y + o.size.height - horde.randomRange(0, o.size.height));
							this.addObject(heart);
						}
					} else if (o2.role == "powerup_coin") {
						o2.die();
						o.gold += o2.coinAmount;
						horde.sound.play("coins");
						for (var j = 0; j < 5; ++j) {
							var heart = horde.makeObject("mini_sparkle");
							heart.position.x = (o.position.x + (j * (o.size.width / 5)));
							heart.position.y = (o.position.y + o.size.height - horde.randomRange(0, o.size.height));
							this.addObject(heart);
						}
					} else if (o2.role == "powerup_weapon") {
						o2.die();
						o.addWeapon(o2.wepType, o2.wepCount);
						horde.sound.play("chest_weapon");
						for (var j = 0; j < 5; ++j) {
							var heart = horde.makeObject("mini_sword");
							heart.position.x = (o.position.x + (j * (o.size.width / 5)));
							heart.position.y = (o.position.y + o.size.height - horde.randomRange(0, o.size.height));
							this.addObject(heart);
						}
					}
				}
				if (
					o.team !== null
					&& o2.team !== null
					&& o.team !== o2.team
				) {
					if (
						!(o.role === "projectile" && o2.role === "trap")
						&& !(o.role === "trap" && o2.role === "projectile")
					) {
						this.dealDamage(o2, o);
						this.dealDamage(o, o2);
					}
				}
			}
		}
		
	}
	
	this.monstersAlive = numMonsters;
	this.monstersAboveGates = (numMonstersAboveGate > 0);

	var player = this.getPlayerObject();
	if (this.woundsTo < player.wounds) {
		this.woundsTo += ((this.woundsToSpeed / 1000) * elapsed);
	} else if (this.woundsTo > player.wounds) {
		this.woundsTo -= ((this.woundsToSpeed / 1000) * elapsed);
	} else {
		this.woundsTo = player.wounds;
	}

	// Snap to grid to prevent vibrating bars
	if (Math.abs(player.wounds - this.woundsTo) <= 1) {
		this.woundsTo = player.wounds
	}
	
};

// Deals damage from object "attacker" to "defender"
horde.Engine.prototype.dealDamage = function (attacker, defender) {
	var nullify = defender.execute("onThreat", [attacker, this]);
	if (
		defender.hasState(horde.Object.states.INVINCIBLE)
		|| defender.role === "trap"
		|| defender.role === "projectile"
		|| nullify === true
	) {
		// Defender is invincible
		if (attacker.role === "projectile" && attacker.hitPoints !== Infinity) {
			attacker.die();
		}
		return false;
	}
	if (attacker.damage > 0 && defender.role === "hero") {
		defender.addState(horde.Object.states.INVINCIBLE, 2500);
	}
	attacker.execute("onDamage", [defender, this]);
	var scorer = attacker;
	if (scorer.ownerId !== null) {
		var owner = this.objects[scorer.ownerId];
		if (owner) {
			scorer = owner;
		}
	}
	if (attacker.role === "projectile") {
		scorer.shotsLanded++;
	}
	if (defender.wound(attacker.damage)) {
		// defender has died; assign gold/kills etc
		scorer.gold += defender.worth;
		scorer.kills++;
		defender.execute("onKilled", [attacker, this]);
		if (defender.lootTable.length > 0) {
			this.spawnLoot(defender);
		}
	} else {
		if (attacker.role === "projectile" && attacker.hitPoints !== Infinity) {
			attacker.die();
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
			this.keyboard.clearKeys();
			return;
		}

		// Press any key to unpause.
		if (this.paused && this.keyboard.isAnyKeyPressed()) {
			this.togglePause();
			return;
		}

		// Toggle sound with "M" for "mute".
		if (this.keyboard.isKeyPressed(77)) {
			horde.sound.toggleMuted();
		}

	}

	if (this.state === "title") {

		// ZOMG INFINITE AXES!!!111!!
		if (!this.konamiEntered && this.keyboard.historyMatch(horde.Keyboard.konamiCode)) {
			horde.sound.play("chest_opens");
			this.konamiEntered = true;

			var p = this.getPlayerObject();
			p.addWeapon("h_axe", null);
		}

		if (kb.isKeyPressed(keys.ENTER) || kb.isKeyPressed(keys.SPACE)) {
		
			kb.clearKey(keys.ENTER);
			kb.clearKey(keys.SPACE);

			switch (this.titlePointerY) {
				case 0:
					this.state = "intro_cinematic";
					break;
				case 1:
					this.state = "how_to_play";
					break;
				case 2:
					this.state = "credits";
					break;
			}

		}

		if (
			this.keyboard.isKeyPressed(keys.W)
			|| this.keyboard.isKeyPressed(keys.UP)
		) {
			this.keyboard.keyStates[keys.W] = false;
			this.keyboard.keyStates[keys.UP] = false;
			this.titlePointerY--;
			if (this.titlePointerY < 0) this.titlePointerY = this.numTitleOptions;
			horde.sound.play("move_pointer");
		}
		if (
			this.keyboard.isKeyPressed(keys.S)
			|| this.keyboard.isKeyPressed(keys.DOWN)
		) {
			this.keyboard.keyStates[keys.S] = false;
			this.keyboard.keyStates[keys.DOWN] = false;
			this.titlePointerY++;
			if (this.titlePointerY > this.numTitleOptions) this.titlePointerY = 0;
			horde.sound.play("move_pointer");
		}

		this.keyboard.storeKeyStates();
		return;

	}

	if (this.state === "how_to_play") {
		if (this.keyboard.isAnyKeyPressed()) {
			kb.clearKeys();
			this.state = "title";
		}
	}

	if (this.state === "credits") {
		if (this.keyboard.isAnyKeyPressed()) {
			kb.clearKeys();
			this.state = "title";
		}
	}

	if (this.state === "intro_cinematic") {
		if (this.keyboard.isAnyKeyPressed()) {
			kb.clearKeys();
			this.state = "running";
			this.woundsTo = 0;
			horde.sound.play("normal_battle_music");
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

	if (!v) {
		v = object.facing;
	}

	var weaponType = object.fireWeapon();
	if (weaponType === false) {
		return;
	}
	
	var weaponDef = horde.objectTypes[weaponType];

	switch (weaponType) {
		
		case "e_energy_ball":
			var h = v.heading();
			for (var x = -0.5; x <= 0.5; x += 0.5) {
				this.spawnObject(
					object,
					weaponType,
					horde.Vector2.fromHeading(h + x)
				);
			}
			object.shotsFired += 3;
			break;
		
		// Shoot 2 knives in a spread pattern
		case "h_knife":
			var h = v.heading();
			this.spawnObject(object, weaponType, horde.Vector2.fromHeading(
				h - 0.1
			));
			this.spawnObject(object, weaponType, horde.Vector2.fromHeading(
				h + 0.1
			));
			object.shotsFired += 2;
			break;

		// Spread fire shotgun style
		case "h_fireball":
		case "e_fireball_2":
			for (var x = -0.25; x <= 0.25; x += 0.25) {
				var h = v.heading();
				h += (x + (horde.randomRange(-1, 1) / 10));
				this.spawnObject(
					object,
					weaponType,
					horde.Vector2.fromHeading(h)
				);
			}
			object.shotsFired += 3;
			break;

		case "e_ring_fire":
			var len = (Math.PI * 2);
			var step = (len / 12);
			for (var h = 0; h < len; h += step) {
				this.spawnObject(
					object,
					weaponType,
					horde.Vector2.fromHeading(h)
				);
			}
			break;

			case "e_ring_fire_blue":
				var len = (Math.PI * 2);
				var step = (len / 12);
				var seed = (step / 2);
				for (var h = seed; h < len + seed; h += step) {
					this.spawnObject(
						object,
						weaponType,
						horde.Vector2.fromHeading(h)
					);
				}
				break;

		// Spawn in a circle around the object
		case "e_bouncing_boulder":
			var len = (Math.PI * 2);
			var step = (len / 8);
			for (var h = 0; h < len; h += step) {
				this.spawnObject(
					object,
					weaponType,
					horde.Vector2.fromHeading(h)
				);
			}
			break;

		// Shoot one instance of the weapon
		default:
			this.spawnObject(object, weaponType, v);
			object.shotsFired++;
			break;
			
	}

	// Increment shots per weapon counter
	if (!object.shotsPerWeapon[weaponType]) {
		object.shotsPerWeapon[weaponType] = 0;
	}
	object.shotsPerWeapon[weaponType]++;

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

		case "intro_cinematic":
			this.drawIntroCinematic(ctx);
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

/**
 * Draws the game over screen.
 * @param {object} Canvas 2d context to draw on.
 */
proto.drawGameOver = function horde_Engine_proto_drawGameOver (ctx) {

	if (this.goAlphaStep) {
		this.goAlpha += this.goAlphaStep;
		if (this.goAlpha <= 0) {
			this.goAlpha = 0;
			this.goAlphaStep = 0.025;
		}
		if (this.goAlpha >= 1) {
			this.goAlpha = 1;
			this.goAlphaStep = -0.025;
		}
	} else {
		this.goAlphaStep = -0.025;
		this.goAlpha = 1;
	}

	if (!this.gameOverBg) {
		this.drawUI(ctx);
		this.gameOverBg = ctx.getImageData(0, 0, this.view.width, this.view.height);
	}
	
	ctx.save();
	ctx.putImageData(this.gameOverBg, 0, 0);
	ctx.restore();

	ctx.save();
	ctx.globalAlpha = this.gameOverAlpha;
	ctx.fillStyle = "rgb(215, 25, 32)";
	ctx.fillRect(0, 0, this.view.width, this.view.height);
	ctx.restore();

	if (this.gameOverReady === true) {
		
		if (this.keyboard.isAnyKeyPressed()) {
			this.keyboard.clearKeys();
			this.initGame();
			return;
		}

		ctx.drawImage(
			this.images.getImage("stats_defeat"),
			38, 38, 564, 404
		);
		
		this.drawObjectStats(this.getPlayerObject(), ctx);
		
	}
	
};

proto.drawObjectStats = function horde_Engine_proto_drawObjectStats (object, ctx) {
	
	// Calculate weapon accuracy
	var accuracy = ((object.shotsLanded / object.shotsFired) * 100).toFixed(0) + "%";
	
	// Determine favorite weapon
	var high = 0;
	var favoredType = null;
	for (var x in object.shotsPerWeapon) {
		if (object.shotsPerWeapon[x] > high) {
			high = object.shotsPerWeapon[x];
			favoredType = x;
		}
	}
	// This line is throwing this error: Uncaught TypeError: Cannot read property 'name' of undefined
	favoredType = horde.objectTypes[favoredType].name;
	
	ctx.save();
	
	ctx.fillStyle = "rgb(255, 255, 255)";
	ctx.font = "Bold 35px Monospace";
	ctx.textAlign = "center";

	ctx.fillStyle = "rgb(237, 28, 36)";
	ctx.fillText(object.kills, 175, 225);
	ctx.fillStyle = "rgb(255, 245, 121)";
	ctx.fillText(object.gold, 175, 305);
	ctx.fillStyle = "rgb(108, 192, 113)";
	ctx.fillText(object.meatEaten, 175, 385);
	
	ctx.fillStyle = "rgb(199, 234, 251)";
	ctx.fillText(object.shotsFired, 450, 225);
	ctx.fillStyle = "rgb(207, 18, 140)";
	ctx.fillText(accuracy, 450, 305);
	ctx.fillStyle = "rgb(250, 166, 26)";
	ctx.fillText(favoredType, 450, 385);
	
	ctx.restore();
	
};

proto.drawLogo = function horde_Engine_proto_drawLogo (ctx) {

	// Clear the screen
	ctx.save();
	ctx.fillStyle = "rgb(0, 0, 0)";
	ctx.fillRect(0, 0, this.view.width, this.view.height);
	ctx.restore();
		
	// Draw the logo
	if (this.logoAlpha > 0) {
		ctx.save();
		ctx.globalAlpha = this.logoAlpha;
		ctx.drawImage(this.preloader.getImage("logo"), 0, 0);
		ctx.restore();
	}

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

	ctx.save();
	ctx.globalAlpha = 0.5;
	ctx.fillRect(0, 0, this.view.width, this.view.height);
	ctx.globalAlpha = 1;
	ctx.drawImage(
		this.images.getImage("paused"),
		38, 38, 564, 404
	);
	ctx.restore();

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
			drawIndex: obj.drawIndex,
			y: obj.position.y + obj.size.height
		});
	}
	drawOrder.sort(function (a, b) {
		if (a.drawIndex === b.drawIndex) {
			return (a.y - b.y);
		} else {
			return (a.drawIndex - b.drawIndex);
		}
	});
	return drawOrder;
};

proto.drawObject = function horde_Engine_proto_drawObject (ctx, o) {
	
	var s = o.getSpriteXY();
	
	if (o.alpha <= 0 || o.hasState(horde.Object.states.INVISIBLE)) {
		return;
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

	// Boss pain!
	if (
		(o.role === "monster")
		&& o.badass
		&& o.hasState(horde.Object.states.HURTING)
	) {
console.log('hurt ...');
		this.drawImagePain(
			ctx, this.images.getImage(o.spriteSheet),
			s.x, s.y + 1, o.size.width - 1, o.size.height - 1,
			-(o.size.width / 2), -(o.size.height / 2), o.size.width, o.size.height,
			"rgba(186, 51, 35, 0.6)"
		);
	}

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
	
};

horde.Engine.prototype.drawObjects = function (ctx) {
	var drawOrder = this.getObjectDrawOrder();
	for (var x in drawOrder) {
		var o = this.objects[drawOrder[x].id];
		this.drawObject(ctx, o);
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

proto.drawImagePain = function horde_Engine_proto_drawImagePain (
	ctx, image,
	spriteX, spriteY,
	spriteWidth, spriteHeight,
	destX, destY,
	destWidth, destHeight,
	fillStyle
) {

	var buffer = this.canvases.buffer.getContext("2d");
	buffer.save();
	buffer.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

	buffer.drawImage(
		image,
		spriteX, spriteY, spriteWidth, spriteHeight,
		0, 0,
		destWidth, destHeight
	);
	buffer.globalCompositeOperation = "source-in";
	buffer.fillStyle = fillStyle;
	buffer.fillRect(0, 0, destWidth, destHeight);
	buffer.restore();

	ctx.drawImage(
		this.canvases.buffer,
		0, 0,
		destWidth, destHeight,
		destX, destY,
		destWidth, destHeight
	);

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
	var width1 = (bar.width - Math.round((bar.width * o.wounds) / o.hitPoints));
	var width2 = (bar.width - Math.round((bar.width * this.woundsTo) / o.hitPoints));

	if (this.woundsTo < o.wounds) {
		var width = width1;
		var toWidth = width2;
	} else {
		var width = width2;
		var toWidth = width1;
	}

	// Outside border
	ctx.save();
	ctx.fillStyle = "rgb(255, 255, 255)";
	ctx.fillRect(bar.x - 2, bar.y - 2, bar.width + 2, bar.height + 4);
	ctx.fillRect(bar.x + bar.width, bar.y, 2, bar.height);
	ctx.fillStyle = "rgb(0, 0, 0)";
	ctx.fillRect(bar.x, bar.y, bar.width, bar.height);

	// The bar itself
	ctx.fillStyle = this.getBarColor(o.hitPoints, (o.hitPoints - o.wounds));
	ctx.globalAlpha = 0.4;

	ctx.fillRect(bar.x, bar.y, toWidth, bar.height);

	ctx.fillRect(bar.x, bar.y, width, bar.height);
	ctx.fillRect(bar.x, bar.y + 5, width, bar.height - 10);
	ctx.fillRect(bar.x, bar.y + 10, width, bar.height - 20);
	ctx.restore();

	// Heart icon
	var percentage = (((o.hitPoints - o.wounds) / o.hitPoints) * 100);
	var spriteX = 352;
	if (percentage > 50) {
		spriteX = 224;
	} else if (percentage > 25) {
		spriteX = 288;
	}
	ctx.drawImage(
		this.images.getImage("objects"),
		spriteX, 64, 42, 42, 18, 424, 42, 42
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
 * Draws text, baby. Scales it up 'n stuff.
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

	ctx.drawImage(
		this.canvases.buffer,
		0, 0,
		SCREEN_WIDTH, SCREEN_HEIGHT,
		x, (y - TEXT_HEIGHT),
		(SCREEN_WIDTH * 2), (SCREEN_HEIGHT * 2)
	);
	buffer.restore();

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
	
	if (this.titleAlphaStep) {
		this.titleAlpha += this.titleAlphaStep;
		if (this.titleAlpha <= 0.5) {
			this.titleAlpha = 0.5;
			this.titleAlphaStep = 0.025;
		}
		if (this.titleAlpha >= 1) {
			this.titleAlpha = 1;
			this.titleAlphaStep = -0.025;
		}
	} else {
		this.titleAlphaStep = -0.025;
		this.titleAlpha = 1;
	}

	var highScore = ("High Score: " + this.getData(HIGH_SCORE_KEY));
	this.drawText(ctx, highScore, 218, 424, {
		fillStyle : "rgb(0, 0, 0)",
		font : "Bold 10px Monospace"
	});
	this.drawText(ctx, highScore, 220, 426, {
		fillStyle : "rgb(255, 255, 255)",
		font : "Bold 10px Monospace"
	});

	// Version
	var version = ("v" + VERSION);
	ctx.save();
	ctx.fillStyle = "rgb(150, 150, 150)";
	ctx.font = "Bold 14px Monospace";
	ctx.textAlign = "right";
	ctx.fillText(version, 637, 477);
	ctx.restore();
	
	// Copyright text
	var copyright = "\u00A9 Lost Decade Games";
	this.drawText(ctx, copyright, 200, 448, {
		fillStyle : "rgb(0, 0, 0)",
		font : "Bold 10px Monospace"
	});
	this.drawText(ctx, copyright, 202, 450, {
		fillStyle : "rgb(255, 255, 255)",
		font : "Bold 10px Monospace"
	});

	var params = {
		fillStyle : "rgb(0, 0, 0)",
		font : "Bold 10px Monospace",
		textAlign : "left"
	};

	// Sword pointer
	var textX = 280;
	var textY = (POINTER_Y_START - TEXT_HEIGHT);
	var pointerX = (textX - 48);
	var pointerY = (POINTER_Y_START + (this.titlePointerY * POINTER_Y_INC) - 20);

	ctx.save();
	ctx.globalAlpha = this.titleAlpha;
	ctx.drawImage(
		this.images.getImage("objects"),
		320, 192, 36, 26,
		pointerX, pointerY,
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

proto.drawIntroCinematic = function horde_Engine_proto_drawIntroCinematic (ctx) {

	switch (this.introPhase) {
		
		case 0:
			if (!this.introFadeOutBg) {
				this.introFadeOutBg = ctx.getImageData(0, 0, this.view.width, this.view.height);
				this.introFadeAlpha = 0;
			}
			ctx.fillStyle = "rgb(0,0,0)";
			ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
			ctx.save();
			ctx.fillStyle = "rgb(0, 0, 255)";
			ctx.fillRect(0, 0, this.view.width, this.view.height);
			ctx.putImageData(this.introFadeOutBg, 0, 0);
			ctx.restore();
			if (this.introFadeAlpha > 0) {
				ctx.save();
				ctx.globalAlpha = this.introFadeAlpha;
				ctx.fillStyle = "rgb(0,0,0)";
				ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
				ctx.restore();
			}
			break;
		
		case 1:
			this.drawArena(ctx);
			this.drawFauxGates(ctx);
			this.drawShadow(ctx);
			if (this.introFadeAlpha > 0) {
				ctx.save();
				ctx.globalAlpha = this.introFadeAlpha;
				ctx.fillStyle = "rgb(0,0,0)";
				ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
				ctx.restore();
			}
			break;
		
		case 2:
		case 3:
			this.drawArena(ctx);
			this.drawFauxGates(ctx);
			this.drawShadow(ctx);
			break;
			
		case 4:
		case 5:
		case 9:
			this.drawArena(ctx);
			if (this.introHero) {
				this.drawObject(ctx, this.introHero);
			}
			this.drawFauxGates(ctx);
			this.drawShadow(ctx);
			break;
			
		case 6:
		case 7:
		case 8:
			this.drawArena(ctx);
			ctx.drawImage(this.images.getImage("characters"),
				20 * 32, 0, 32, 32,
				304, 224, 32, 32
			);
			this.drawFauxGates(ctx);
			this.drawShadow(ctx);
			break;
	}

	
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

/**
 * Fetches some persistent data
 * @param {String} key The key of the data to fetch
 * @return {String} The data (or undefined on failure)
 */
proto.getData = function horde_Engine_proto_getData (key, value) {
	if (typeof localStorage == "object") {
		return localStorage.getItem(key);
	}
	return undefined;
};

/**
 * Saves some data persistently
 * @param {String} key The key of the data to store
 * @param {String} value The data to store
 */
proto.putData = function horde_Engine_proto_putData (key, value) {
	if (typeof localStorage == "object") {
		localStorage.setItem(key, value);
	}
};

}());
