(function define_horde_Engine () {

var VERSION = "{{VERSION}}";
var DEMO = false;
var GATE_CUTOFF_Y = 64;
var HIGH_SCORE_KEY = "high_score";
var DEFAULT_HIGH_SCORE = 1000;
var NUM_GATES = 3;
var OVERLAY_ALPHA = 0.7;
var POINTER_X = 270;
var POINTER_HEIGHT = 24;
var SCREEN_WIDTH = 640;
var SCREEN_HEIGHT = 480;
var TEXT_HEIGHT = 20; // Ehh, kind of a hack, because stupid ctx.measureText only gives width (why??).
var TUTORIAL_HEIGHT = 70;
var TUTORIAL_NUM_TIPS = 4;

var COLOR_BLACK = "rgb(0, 0, 0)";
var COLOR_WHITE = "rgb(241, 241, 242)";

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

	// Sword pointer
	this.pointerY = 0;
	this.pointerYStart = 0;
	this.numPointerOptions = 0;
	this.pointerOptionsStart = 0;
	
	this.targetReticle = {
		angle: 0,
		rotateSpeed: 1,
		position: new horde.Vector2()
	};
	
	this.enableFullscreen = true;
	this.enableClouds = false;
	this.cloudTimer = null;
	this.woundsTo = 0;
	this.woundsToSpeed = 10;
	
	this.introTimer = new horde.Timer();
	this.introPhase = 0;
	this.introPhaseInit = false;
	
	this.wonGame = false;
	this.wonGamePhase = 0;
	
};

var proto = horde.Engine.prototype;

proto.resize = function horde_Engine_proto_resize () {
	if (!this.enableFullscreen) {
		return;
	}
	var height = window.innerHeight;
	height -= 40; // Some buffer around the game
	if (height < 480) {
		height = 480;
	}
	if (height > 768) {
		height = 768;
	}
	var width = Math.round(height * 1.333);
	var c = this.canvases["display"];
	c.style.width = width + "px";
	c.style.height = height + "px";
	c.style.marginLeft = -(width / 2) + "px";
	c.style.marginTop = -(height / 2) + "px";
};

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

		if (this.getPlayerObject().hasState(horde.Object.states.DYING)) {
			return;
		}

		if (this.paused) {
			this.paused = false;
			horde.sound.setMuted(isMuted);
			horde.sound.play("unpause");
			horde.sound.play(this.currentMusic);
		} else {
			this.paused = true;
			this.initOptions();
			isMuted = horde.sound.isMuted();
			horde.sound.play("pause");
			horde.sound.stop(this.currentMusic);
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
	return this.addObject(o);
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
	
	this.resize();
	horde.on("resize", this.resize, window, this);
	
	this.mouse = new horde.Mouse(this.canvases["display"]);
	
	horde.on("contextmenu", function (e) {
		horde.stopEvent(e);
	}, document.body, this);
	
	horde.on("blur", function () {
		if (this.state != "running" || this.wonGame) return;
		this.keyboard.keyStates = {};
		if (!this.paused) this.togglePause();
	}, window, this);

	// Load just the logo
	this.preloader = new horde.ImageLoader();
	this.preloader.load({
		"ui": "img/sheet_ui.png"
	}, this.preloadComplete, this);
	
	// Load the rest of the image assets
	this.images = new horde.ImageLoader();
	this.images.load({
		"arena": "img/sheet_arena.png",
		"characters": "img/sheet_characters.png",
		"objects": "img/sheet_objects.png",
		"beholder": "img/sheet_beholder.png"
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
	
		// Create all sound files
		var s = horde.sound;

		// Music
		s.create("normal_battle_music", "sound/music/normal_battle", true, 20);
		s.create("final_battle_music", "sound/music/final_battle", true, 20);
		s.create("victory", "sound/music/victory", true, 20);
		
		// UI
		s.create("move_pointer", "sound/effects/move_pointer", false, 50);
		s.create("select_pointer", "sound/effects/select_pointer", false, 50);
		s.create("pause", "sound/effects/pause");
		s.create("unpause", "sound/effects/unpause");
		
		// Environment
		s.create("code_entered", "sound/effects/code_entered");
		s.create("gate_opens", "sound/effects/gate_opens");
		s.create("gate_closes", "sound/effects/gate_closes");
		s.create("spike_attack", "sound/effects/spike_attacks");

		// Misc
		s.create("immunity", "sound/effects/immunity", false, 25);
		s.create("coins", "sound/effects/coins", false, 10);
		s.create("eat_food", "sound/effects/eat_food", false, 20);
		s.create("pickup_weapon", "sound/effects/pickup_weapon");
		// TODO: s.create("weapon_wall", "sound/effects/weapon_wall");
		
		// Hero
		s.create("fire_attack", "sound/effects/char_attacks_fire");
		s.create("hero_attacks", "sound/effects/char_attacks");
		s.create("hero_damage", "sound/effects/char_damage_3");
		s.create("hero_dies", "sound/effects/char_dies");
		
		// Bat
		// Attack: not needed
		s.create("bat_damage", "sound/effects/bat_damage");
		s.create("bat_dies", "sound/effects/bat_dies");
		
		// Goblin
		s.create("goblin_attacks", "sound/effects/goblin_attacks");
		s.create("goblin_damage", "sound/effects/goblin_damage");
		s.create("goblin_dies", "sound/effects/goblin_dies");

		// Demoblin
		s.create("demoblin_attacks", "sound/effects/demoblin_attacks", false, 80);
		// Damage: goblin_damage
		// Dies: goblin_dies

		// Imp
		// Attack: not needed
		s.create("imp_damage", "sound/effects/imp_damage", false, 50);
		s.create("imp_dies", "sound/effects/imp_dies", false, 50);

		// Gel
		// Attack: not needed
		s.create("gel_damage", "sound/effects/gel_damage", false, 20);
		s.create("gel_dies", "sound/effects/gel_dies", false, 20);

		// Flaming Skull
		// Attack: not needed
		s.create("skull_damage", "sound/effects/skull_damage", false, 25);
		s.create("skull_dies", "sound/effects/skull_dies", false, 5);
	
		// Wizard
		s.create("wizard_attacks", "sound/effects/wizard_attacks", false, 25);
		// Damage: goblin_damage
		// Dies: goblin_dies
		s.create("wizard_disappear", "sound/effects/wizard_disappear", false, 50);
		s.create("wizard_reappear", "sound/effects/wizard_reappear", false, 50);

		// Sandworm
		s.create("sandworm_attacks", "sound/effects/sandworm_attacks", false, 75);
		// Damage: goblin_damage
		s.create("sandworm_dies", "sound/effects/sandworm_dies", false, 40);

		// Cyclops
		s.create("cyclops_attacks", "sound/effects/cyclops_attacks");
		s.create("cyclops_damage", "sound/effects/cyclops_damage");
		s.create("cyclops_dies", "sound/effects/cyclops_dies");

		// Owlbear
		// Attack: TODO
		s.create("owlbear_damage", "sound/effects/owlbear_damage", false, 25);
		s.create("owlbear_dies", "sound/effects/owlbear_dies", false, 75);

		// Boss 1/5: Gelatinous Cube
		s.create("cube_attacks", "sound/effects/cube_attacks");
		s.create("cube_damage", "sound/effects/cube_damage");
		s.create("cube_dies", "sound/effects/cube_dies");

		// Demonclops
		// Attack: TODO
		// Damage: TODO
		// Dies: TODO

		// Boss 3/5: Green Dragon
		s.create("dragon_attacks", "sound/effects/dragon_attacks");
		s.create("dragon_damage", "sound/effects/dragon_damage");
		s.create("dragon_dies", "sound/effects/dragon_dies");

		// Boss 4/5: Beholder
		// Attack: TODO
		s.create("beholder_damage", "sound/effects/beholder_damage", false, 25);
		s.create("beholder_dies", "sound/effects/beholder_dies", false, 25);

		// Add: Eyelet
		// Attack: TODO
		s.create("eyelet_damage", "sound/effects/eyelet_damage", false, 25);
		s.create("eyelet_dies", "sound/effects/eyelet_dies", false, 25);

		// Boss 5/5: Doppelganger
		// Attack: TODO
		// Damage: TODO
		// Dies: TODO
			
	});
	
};

proto.initGame = function () {

	this.konamiEntered = false;
	this.enableClouds = false;

	this.closeGates();
	
	this.objects = {};
	this.state = "title";
	this.initOptions();
	
	this.initMap();

	this.initSpawnPoints();
	this.initWaves();
	
	this.initPlayer();

	this.gameOverBg = null;

	this.monstersAlive = 0;

	this.newHighScore = 0;
	this.statsCount = 0;
	this.statsIncrement = 0;
	this.statsIndex = 0;
	this.statsTimer = null;
	this.highScoreSaved = false;
	
	this.wonGame = false;
	this.wonGamePhase = 0;

	this.showReticle = false;
	this.hideReticleTimer = null;

	this.showTutorial = false;
	this.tutorialIndex = 0;
	this.tutorialY = -TUTORIAL_HEIGHT;
	this.tutorialDirection = "down";
	this.hideTutorialTimer = null;

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
			sp.queueSpawn(o.type, o.count);
		}
		var timeToSpawn = ((sp.queue.length - 1) * sp.delay);
		if (timeToSpawn > longestTTS) {
			longestTTS = timeToSpawn;
		}
	}
	var ttl = longestTTS + wave.nextWaveTime;
	this.waveTimer.start(ttl);
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

	this.waveText = {
		string: "<WAVE TEXT HERE>",
		size: 20,
		state: "off",
		alpha: 0
	};
	
	// Wave testing code...
	/*
	var testWave = 40;
	this.waveHack = true;
	this.currentWaveId = (testWave - 2);
	*/

	/*
	// Test Wave
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "owlbear", 1);
	w.addObjects(1, "owlbear", 1);
	w.addObjects(2, "owlbear", 1);
	w.nextWaveTime = Infinity;
	this.waves.push(w);
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
	w.addObjects(0, "bat", 5);
	w.addObjects(0, "goblin", 2);
	w.addObjects(1, "goblin", 2);
	w.addObjects(1, "cyclops", 1);
	w.addObjects(1, "goblin", 3);
	w.addObjects(2, "bat", 5);
	w.addObjects(2, "goblin", 2);
	w.nextWaveTime = 45000;
	this.waves.push(w);
	
	// Wave 6
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 200);
	w.addSpawnPoint(1, 200);
	w.addSpawnPoint(2, 200);
	w.addObjects(0, "bat", 10);
	w.addObjects(1, "bat", 10);
	w.addObjects(2, "bat", 10);
	w.nextWaveTime = 45000;
	this.waves.push(w);
	
	// Wave 7
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "demoblin", 3);
	w.addObjects(1, "cyclops", 1);
	w.addObjects(1, "goblin", 5);
	w.addObjects(2, "demoblin", 3);
	w.nextWaveTime = 45000;
	this.waves.push(w);

	// Wave 8
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 5000);
	w.addSpawnPoint(1, 1500);
	w.addSpawnPoint(2, 5000);
	w.addObjects(0, "imp", 5);
	w.addObjects(1, "imp", 10);
	w.addObjects(2, "imp", 5);
	w.nextWaveTime = 45000;
	this.waves.push(w);

	// Wave 9
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 750);
	w.addSpawnPoint(1, 750);
	w.addSpawnPoint(2, 750);
	w.addObjects(0, "cyclops", 1);
	w.addObjects(2, "cyclops", 1);
	w.addObjects(0, "bat", 10);
	w.addObjects(1, "bat", 10);
	w.addObjects(2, "bat", 10);
	w.nextWaveTime = 45000;
	this.waves.push(w);

	// Wave 10: Gelatinous Cube
	var w = new horde.SpawnWave();
	w.addSpawnPoint(1, 1000);
	w.addObjects(1, "cube", 1);
	w.nextWaveTime = Infinity;
	w.bossWave = true;
	w.bossName = "Gelatinous Cube";
	this.waves.push(w);

	// Wave 11: Level 2
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 20000);
	w.addSpawnPoint(1, 20000);
	w.addSpawnPoint(2, 20000);
	w.addObjects(0, "sandworm", 2);
	w.addObjects(1, "sandworm", 2);
	w.addObjects(2, "sandworm", 2);
	w.nextWaveTime = 60000;
	this.waves.push(w);

	// Wave 12
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 10000);
	w.addSpawnPoint(1, 10000);
	w.addSpawnPoint(2, 10000);
	w.addObjects(0, "wizard", 2);
	w.addObjects(1, "wizard", 2);
	w.addObjects(2, "wizard", 2);
	w.nextWaveTime = 60000;
	this.waves.push(w);

	// Wave 13
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 7500);
	w.addSpawnPoint(1, 7500);
	w.addSpawnPoint(2, 7500);
	w.addObjects(0, "flaming_skull", 2);
	w.addObjects(1, "flaming_skull", 2);
	w.addObjects(2, "flaming_skull", 2);
	w.nextWaveTime = 45000;
	this.waves.push(w);

	// Wave 14
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "demoblin", 3);
	w.addObjects(1, "hunter_goblin", 2);
	w.addObjects(2, "demoblin", 3);
	w.addObjects(0, "wizard", 1);
	w.addObjects(1, "wizard", 1);
	w.addObjects(2, "wizard", 1);
	w.nextWaveTime = 45000;
	this.waves.push(w);

	// Wave 15
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 15000);
	w.addSpawnPoint(1, 1500);
	w.addSpawnPoint(2, 15000);
	w.addObjects(0, "owlbear", 1);
	w.addObjects(2, "owlbear", 1);
	w.nextWaveTime = 45000;
	this.waves.push(w);

	// Wave 16
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 500);
	w.addSpawnPoint(1, 4000);
	w.addSpawnPoint(2, 500);
	w.addObjects(0, "dire_bat", 5);
	w.addObjects(0, "hunter_goblin", 2);
	w.addObjects(0, "dire_bat", 5);
	w.addObjects(0, "hunter_goblin", 2);
	w.addObjects(1, "sandworm", 2);
	w.addObjects(2, "dire_bat", 5);
	w.addObjects(2, "hunter_goblin", 2);
	w.addObjects(2, "dire_bat", 5);
	w.addObjects(2, "hunter_goblin", 2);
	w.nextWaveTime = 45000;
	this.waves.push(w);

	// Wave 17
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 3000);
	w.addSpawnPoint(1, 1500);
	w.addSpawnPoint(2, 3000);
	w.addObjects(0, "flaming_skull", 2);
	w.addObjects(1, "imp", 5);
	w.addObjects(1, "wizard", 3);
	w.addObjects(2, "flaming_skull", 2);
	w.nextWaveTime = 45000;
	this.waves.push(w);

	// Wave 18
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1500);
	w.addSpawnPoint(1, 1500);
	w.addSpawnPoint(2, 1500);
	w.addObjects(0, "cyclops", 1);
	w.addObjects(0, "goblin", 5);
	w.addObjects(1, "demoblin", 3);
	w.addObjects(1, "owlbear", 1);
	w.addObjects(1, "demoblin", 5);
	w.addObjects(2, "goblin", 5);
	w.addObjects(2, "cyclops", 1);
	w.nextWaveTime = 45000;
	this.waves.push(w);

	// Wave 19
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 3500);
	w.addSpawnPoint(1, 4000);
	w.addSpawnPoint(2, 5000);
	w.addObjects(0, "wizard", 5);
	w.addObjects(1, "imp", 5);
	w.addObjects(1, "owlbear", 1);
	w.addObjects(2, "sandworm", 3);
	w.nextWaveTime = 90000;
	this.waves.push(w);

	// Wave 20: Demonclops
	var w = new horde.SpawnWave();
	w.addSpawnPoint(1, 1000);
	w.addObjects(1, "superclops", 1);
	w.nextWaveTime = Infinity;
	w.bossWave = true;
	w.bossName = "Demonclops"
	this.waves.push(w);
	
	// Wave 21: Level 3
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 100);
	w.addSpawnPoint(1, 100);
	w.addSpawnPoint(2, 100);
	w.addObjects(0, "bat", 15);
	w.addObjects(1, "dire_bat", 15);
	w.addObjects(2, "bat", 15);
	w.nextWaveTime = 60000;
	this.waves.push(w);

	// Wave 22
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1500);
	w.addSpawnPoint(1, 1500);
	w.addSpawnPoint(2, 1500);
	w.addObjects(0, "goblin", 15);
	w.addObjects(1, "hunter_goblin", 15);
	w.addObjects(2, "goblin", 15);
	w.nextWaveTime = 60000;
	this.waves.push(w);

	// Wave 23
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 2000);
	w.addSpawnPoint(1, 2000);
	w.addSpawnPoint(2, 2000);
	w.addObjects(0, "demoblin", 12);
	w.addObjects(1, "demoblin", 12);
	w.addObjects(2, "demoblin", 12);
	w.nextWaveTime = 60000;
	this.waves.push(w);

	// Wave 24
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 25000);
	w.addSpawnPoint(1, 25000);
	w.addSpawnPoint(2, 25000);
	w.addObjects(0, "cyclops", 2);
	w.addObjects(1, "cyclops", 2);
	w.addObjects(2, "cyclops", 2);
	w.nextWaveTime = 60000;
	this.waves.push(w);
	
	// Wave 25
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 3000);
	w.addSpawnPoint(1, 3000);
	w.addSpawnPoint(2, 3000);
	w.addObjects(0, "imp", 10);
	w.addObjects(1, "imp", 10);
	w.addObjects(2, "imp", 10);
	w.nextWaveTime = 60000;
	this.waves.push(w);
	
	// Wave 26
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 25000);
	w.addSpawnPoint(1, 25000);
	w.addSpawnPoint(2, 25000);
	w.addObjects(0, "owlbear", 2);
	w.addObjects(1, "owlbear", 2);
	w.addObjects(2, "owlbear", 2);
	w.nextWaveTime = 60000;
	this.waves.push(w);
	
	// Wave 27
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 12000);
	w.addSpawnPoint(1, 12000);
	w.addSpawnPoint(2, 12000);
	w.addObjects(0, "wizard", 4);
	w.addObjects(1, "wizard", 4);
	w.addObjects(2, "wizard", 4);
	w.nextWaveTime = 120000;
	this.waves.push(w);
	
	// Wave 28
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 15000);
	w.addSpawnPoint(1, 15000);
	w.addSpawnPoint(2, 15000);
	w.addObjects(0, "flaming_skull", 5);
	w.addObjects(1, "flaming_skull", 5);
	w.addObjects(2, "flaming_skull", 5);
	w.nextWaveTime = 60000;
	this.waves.push(w);
	
	// Wave 29
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 15000);
	w.addSpawnPoint(1, 15000);
	w.addSpawnPoint(2, 15000);
	w.addObjects(0, "sandworm", 5);
	w.addObjects(1, "sandworm", 5);
	w.addObjects(2, "sandworm", 5);
	w.nextWaveTime = 120000;
	this.waves.push(w);
	
	// Wave 30: Green Dragon
	var w = new horde.SpawnWave();
	w.addSpawnPoint(1, 1000);
	w.addObjects(1, "dragon", 1);
	w.nextWaveTime = Infinity;
	w.bossWave = true;
	w.bossName = "Green Dragon"
	this.waves.push(w);

	// Wave 31: Level 4
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 3500);
	w.addSpawnPoint(1, 3500);
	w.addSpawnPoint(2, 3500);
	w.addObjects(0, "goblin", 25);
	w.addObjects(1, "demoblin", 25);
	w.addObjects(2, "hunter_goblin", 25);
	w.nextWaveTime = 60000;
	this.waves.push(w);

	// Wave 32
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 7500);
	w.addSpawnPoint(1, 5000);
	w.addSpawnPoint(2, 7500);
	w.addObjects(0, "sandworm", 2);
	w.addObjects(0, "wizard", 3);
	w.addObjects(1, "imp", 10);
	w.addObjects(2, "sandworm", 2);
	w.addObjects(2, "wizard", 3);
	w.nextWaveTime = 180000;
	this.waves.push(w);

	// Wave 33
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 15000);
	w.addSpawnPoint(1, 7500);
	w.addSpawnPoint(2, 15000);
	w.addObjects(0, "owlbear", 3);
	w.addObjects(1, "flaming_skull", 6);
	w.addObjects(2, "owlbear", 3);
	w.nextWaveTime = 120000;
	this.waves.push(w);

	// Wave 34
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 2500);
	w.addSpawnPoint(1, 15000);
	w.addSpawnPoint(2, 2500);
	w.addObjects(0, "demoblin", 10);
	w.addObjects(0, "goblin", 10);
	w.addObjects(1, "cyclops", 1);
	w.addObjects(1, "owlbear", 1);
	w.addObjects(1, "cyclops", 1);
	w.addObjects(1, "owlbear", 1);
	w.addObjects(2, "demoblin", 10);
	w.addObjects(2, "goblin", 10);
	w.nextWaveTime = 120000;
	this.waves.push(w);

	// Wave 35
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "goblin", 1);
	w.addObjects(1, "goblin", 1);
	w.addObjects(2, "goblin", 1);
	w.nextWaveTime = 30000;
	this.waves.push(w);

	// Wave 36
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	//w.addObjects(0, "goblin", 1);
	w.addObjects(1, "goblin", 1);
	//w.addObjects(2, "goblin", 1);
	w.nextWaveTime = 30000;
	this.waves.push(w);

	// Wave 37
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	//w.addObjects(0, "goblin", 1);
	w.addObjects(1, "goblin", 1);
	//w.addObjects(2, "goblin", 1);
	w.nextWaveTime = 30000;
	this.waves.push(w);

	// Wave 38
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	//w.addObjects(0, "goblin", 1);
	w.addObjects(1, "goblin", 1);
	//w.addObjects(2, "goblin", 1);
	w.nextWaveTime = 30000;
	this.waves.push(w);
	
	// Wave 39
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	//w.addObjects(0, "goblin", 1);
	w.addObjects(1, "goblin", 1);
	//w.addObjects(2, "goblin", 1);
	w.nextWaveTime = 30000;
	this.waves.push(w);

	// Wave 40: Beholder
	var w = new horde.SpawnWave();
	w.addSpawnPoint(1, 1000);
	w.addObjects(1, "beholder", 1);
	w.nextWaveTime = Infinity;
	w.bossWave = true;
	w.bossName = "Beholder"
	this.waves.push(w);
	
	// Wave 41: Level 5
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "cyclops", 1);
	w.addObjects(1, "superclops", 1);
	w.addObjects(2, "cyclops", 1);
	w.nextWaveTime = 180000;
	this.waves.push(w);

	// Wave 42
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "dragon", 1);
	//w.addObjects(1, "goblin", 1);
	w.addObjects(2, "superclops", 1);
	w.nextWaveTime = 180000;
	this.waves.push(w);

	// Wave 43
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	//w.addObjects(0, "goblin", 1);
	w.addObjects(1, "goblin", 1);
	//w.addObjects(2, "goblin", 1);
	w.nextWaveTime = 30000;
	this.waves.push(w);

	// Wave 44
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	//w.addObjects(0, "goblin", 1);
	w.addObjects(1, "goblin", 1);
	//w.addObjects(2, "goblin", 1);
	w.nextWaveTime = 30000;
	this.waves.push(w);

	// Wave 45
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	//w.addObjects(0, "goblin", 1);
	w.addObjects(1, "goblin", 1);
	//w.addObjects(2, "goblin", 1);
	w.nextWaveTime = 30000;
	this.waves.push(w);

	// Wave 46
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 2500);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 2500);
	w.addObjects(0, "wizard", 4);
	w.addObjects(1, "cube", 1);
	w.addObjects(2, "wizard", 4);
	w.nextWaveTime = 120000;
	this.waves.push(w);

	// Wave 47
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "demoblin", 5);
	w.addObjects(1, "superclops", 1);
	w.addObjects(1, "demoblin", 4);
	w.addObjects(2, "demoblin", 5);
	w.nextWaveTime = 120000;
	this.waves.push(w);

	// Wave 48
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 30000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 30000);
	w.addObjects(0, "sandworm", 1);
	w.addObjects(0, "owlbear", 1);
	w.addObjects(1, "dragon", 1);
	w.addObjects(2, "sandworm", 1);
	w.addObjects(2, "owlbear", 1);
	w.nextWaveTime = 120000;
	this.waves.push(w);

	// Wave 49
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 15000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 15000);
	w.addObjects(0, "wizard", 1);
	w.addObjects(0, "cyclops", 1);
	w.addObjects(1, "beholder", 1);
	w.addObjects(2, "wizard", 1);
	w.addObjects(2, "cyclops", 1);
	w.nextWaveTime = 120000;
	this.waves.push(w);

	// Wave 50: Doppelganger
	var w = new horde.SpawnWave();
	w.addSpawnPoint(1, 1000);
	w.addObjects(1, "nega_xam", 1);
	w.nextWaveTime = Infinity;
	w.bossWave = true;
	w.bossName = "Doppelganger"
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

	if (this.keyboard.isAnyKeyPressed() || this.mouse.isAnyButtonDown()) {
		kb.clearKeys();
		this.mouse.clearButtons();
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
				this.currentMusic = "normal_battle_music";
				horde.sound.play(this.currentMusic);
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

		case "intro":
			this.updateLogo(elapsed);
			this.render();
			break;

		case "title":
			this.handleInput();
			this.updateFauxGates(elapsed);
			this.render();
			break;

		case "credits":
			this.handleInput();
			this.render();
			break;

		case "high_scores":
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
			if (this.wonGame) {
				this.updateWonGame(elapsed);
			} else {
				this.handleInput();
			}
			if (!this.paused) {
				this.updateWaves(elapsed);
				this.updateSpawnPoints(elapsed);
				this.updateClouds(elapsed);
				this.updateObjects(elapsed);
				this.updateFauxGates(elapsed);
			}
			if (this.showTutorial) {
				this.updateTutorial(elapsed);
			}
			this.render();
			break;

		case "game_over":
			this.updateGameOver(elapsed);
			this.render();
			break;

	}

	if (!this.hideReticleTimer) {
		this.hideReticleTimer = new horde.Timer();
	}
	if (this.mouse.hasMoved) {
		this.showReticle = true;
		this.hideReticleTimer.start(5000);
		this.nextTutorial(3);
	}
	this.hideReticleTimer.update(elapsed);
	if (this.hideReticleTimer.expired()) {
		this.showReticle = false;
	}

	this.mouse.hasMoved = false;

};

proto.updateWonGame = function horde_Engine_proto_updateWonGame (elapsed) {
	
	var player = this.getPlayerObject();
	
	if (this.roseTimer) {
		this.roseTimer.update(elapsed);
	}
	
	switch (this.wonGamePhase) {
		
		// Move Xam to the center of the room
		case 0:
			var center = new horde.Vector2(304, 192);
			player.moveToward(center);
			var diff = player.position.clone().subtract(center).abs();
			if (diff.x <= 5 && diff.y <= 5) {
				this.wonGamePhase++;
			}
			break;
			
		case 1:
			player.setDirection(new horde.Vector2(0, 1));
			player.stopMoving();
			player.addState(horde.Object.states.VICTORIOUS);
			this.roseTimer = new horde.Timer();
			this.roseTimer.start(100);
			this.rosesThrown = 0;
			this.wonGamePhase++;
			break;
			
		case 2:
			if (this.roseTimer.expired()) {
				++this.rosesThrown;
				var rose = horde.makeObject("rose");
				if (horde.randomRange(1, 2) === 2) {
					rose.position.x = -32;
					rose.position.y = horde.randomRange(100, 300);
					rose.setDirection(new horde.Vector2(1, 0));
				} else {
					rose.position.x = 682;
					rose.position.y = horde.randomRange(100, 300);
					rose.setDirection(new horde.Vector2(-1, 0));
				}
				this.addObject(rose);
				this.roseTimer.reset();
			}
			if (this.rosesThrown > 100) {
				this.endGame();
			}
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
		var o = this.spawnPoints[x].update(elapsed, (this.monstersAlive === 0));
		if (o !== false) {
			// We need to spawn an object
			this.addObject(o);
		}
	}
	if (closeGates && !this.monstersAboveGates) {
		this.closeGates();
	}
};

proto.spawnWaveExtras = function horde_Engine_proto_spawnWaveExtras (waveNumber) {
	switch (waveNumber) {
		
		case 1:
			// Spawn a couple weapons scrolls to give the player an early taste of the fun!
			var player = this.getPlayerObject();

			// 1. Knife
			var wep = horde.makeObject("item_weapon_knife");
			wep.position = player.position.clone();
			wep.position.x -= 96;
			wep.position.y += 64;
			this.addObject(wep);

			// 2. Spear
			var wep = horde.makeObject("item_weapon_spear");
			wep.position = player.position.clone();
			wep.position.x -= 32;
			wep.position.y += 64;
			this.addObject(wep);

			// 3. Axe
			var wep = horde.makeObject("item_weapon_axe");
			wep.position = player.position.clone();
			wep.position.x += 32;
			wep.position.y += 64;
			this.addObject(wep);

			// 4. Fire
			var wep = horde.makeObject("item_weapon_fireball");
			wep.position = player.position.clone();
			wep.position.x += 96;
			wep.position.y += 64;
			this.addObject(wep);

			break;
		
		case 11:
			var locs = [
				{x: 192, y: 224},
				{x: 416, y: 224}
			];
			var len = locs.length;
			for (var x = 0; x < len; ++x) {
				var pos = locs[x];
				var s = horde.makeObject("spikes");
				s.position = new horde.Vector2(pos.x, pos.y);
				this.addObject(s);
			}
			break;
		
		case 21:
			// Spike sentries in each corner
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
			break;
	
		case 31:
			var locs = [
				{x: 304, y: 114},
				{x: 304, y: 304}
			];
			var len = locs.length;
			for (var x = 0; x < len; ++x) {
				var pos = locs[x];
				var s = horde.makeObject("spikes");
				s.position = new horde.Vector2(pos.x, pos.y);
				this.addObject(s);
			}
			break;
			
		case 41:
			this.enableClouds = true;
			break;
	
		case 50:
			// Despawn all traps; Nega Xam is hard enough!!
			for (var id in this.objects) {
				var obj = this.objects[id];
				if (obj.role === "trap") {
					obj.die();
				}
			}
			break;
		
	}
};

/**
 * Updates the waves
 * @param {number} elapsed Elapsed time in milliseconds since last update
 * @return {void}
 */
proto.updateWaves = function horde_Engine_proto_updateWaves (elapsed) {
	if (this.wonGame) {
		return;
	}
	this.waveTimer.update(elapsed);
	var spawnsEmpty = true;
	for (var x in this.spawnPoints) {
		if (this.spawnPoints[x].queue.length > 0) {
			spawnsEmpty = false;
		}
	}
	// If the spawns are empty AND there are no monsters alive
	if (spawnsEmpty === true && this.monstersAlive === 0) {
		if (this.currentWaveId === (this.waves.length - 1)) {
			// Player won the game!!
			this.wonGame = true;
			horde.sound.stop("normal_battle_music");
			horde.sound.stop("final_battle_music");
			horde.sound.play("victory");
			return;
		}
		this.currentWaveId++;
		var actualWave = (this.currentWaveId + 1);
		if (this.continuing || this.waveHack) {
			// Start with 2 as we don't want the bonus weapons spawning at continue
			for (var wn = 2; wn <= actualWave; ++wn) {
				this.spawnWaveExtras(wn);
			}
			this.waveHack = false;
		} else {
			this.spawnWaveExtras(actualWave);
		}
		var waveTextString = "Wave " + actualWave;
		if (actualWave > 1 && (actualWave % 10) === 1) {
			// CHECKPOINT REACHED!
			// Triggers on the first wave after a boss: 11, 21, 31, 41
			this.putData("checkpoint_wave", this.currentWaveId);
			this.putData("checkpoint_hero", JSON.stringify(this.getPlayerObject()));
			if (!this.continuing) {
				waveTextString = "Game Saved!";
			}
		}
		if (this.waves[this.currentWaveId].bossWave) {
			waveTextString = ("Boss: " + this.waves[this.currentWaveId].bossName) + "!";
			if (horde.sound.isPlaying("normal_battle_music")) {
				horde.sound.stop("normal_battle_music");
			}
			this.currentMusic = "final_battle_music";
			horde.sound.play(this.currentMusic);
		} else {
			if (horde.sound.isPlaying("final_battle_music")) {
				horde.sound.stop("final_battle_music");
			}
			if (!horde.sound.isPlaying("normal_battle_music")) {
				this.currentMusic = "normal_battle_music";
				horde.sound.play(this.currentMusic);
			}
		}
		this.initSpawnWave(this.waves[this.currentWaveId]);
		this.waveText.string = waveTextString;
		this.waveText.alpha = 0;
		this.waveText.size = 30;
		this.waveText.state = "show";
		this.continuing = false;
	}
	switch (this.waveText.state) {
		case "show":
			this.waveText.alpha += ((2 / 1000) * elapsed);
			if (this.waveText.alpha >= 1) {
				this.waveText.alpha = 1;
				this.waveText.timer = new horde.Timer();
				this.waveText.timer.start(250);
				this.waveText.state = "display";
			}
			break;
		case "display":
			this.waveText.timer.update(elapsed);
			if (this.waveText.timer.expired()) {
				this.waveText.state = "hide";
			}
			break;
		case "hide":
			// hide the text
			this.waveText.alpha -= ((1.5 / 1000) * elapsed);
			this.waveText.size += ((200 / 1000) * elapsed);
			if (this.waveText.alpha <= 0) {
				this.waveText.alpha = 0;
				this.waveText.state = "off";
			}
			break;
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

	if (this.gameOverReady) {
		if (!this.statsTimer) {
			this.statsTimer = new horde.Timer();
			this.statsCount = 0;
			this.statsIndex = 0;
			// Settings for Wave reached:
			this.statsTimer.start(50);
			this.statsIncrement = 1;
		}
		this.statsTimer.update(elapsed);
		if (this.statsTimer.expired()) {
			this.statsTimer.reset();
			this.statsCount += this.statsIncrement;
		}
	}

	if ((this.statsIndex	>= 4) && !this.highScoreSaved) {
		this.highScoreSaved = true;

		var highScore = Number(this.getData(HIGH_SCORE_KEY));
		var totalScore = this.getTotalScore();

		if (totalScore > highScore) {
			this.putData(HIGH_SCORE_KEY, totalScore);
			horde.sound.play("victory");
			this.newHighScore = totalScore;
		}

		if (this.debug || this.showHighScores()) {
			this.sendHighScore(totalScore);
		}
	}

};

proto.showHighScores = function horde_Engine_proto_showHighScores () {
	return (
		(location.hostname == "play.lostdecadegames.com")
		|| (Number(location.port) > 9000) // It's over NINE THOUSAAAANDDDDD!!
	);
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

proto.updateTutorial = function horde_Engine_proto_updateTutorial (elapsed) {

	var speed = 0.1;

	if (this.tutorialDirection === "down") {
		this.tutorialY += (speed * elapsed);
		if (this.tutorialY >= 0) {
			this.tutorialY = 0;
			this.tutorialDirection = null;

			if (this.tutorialIndex >= TUTORIAL_NUM_TIPS) {
				this.hideTutorialTimer.start(4000);
			}
		}
	}
	
	if (this.tutorialDirection === "up") {
		this.tutorialY -= (speed * elapsed);
		if (this.tutorialY < -TUTORIAL_HEIGHT) {
			this.tutorialY = -TUTORIAL_HEIGHT;
			this.tutorialDirection = "down";
			this.tutorialIndex += 1;
			if (this.tutorialIndex > TUTORIAL_NUM_TIPS) {
				this.showTutorial = false;
			}
		}
	}

	if (!this.hideTutorialTimer) {
		this.hideTutorialTimer = new horde.Timer();
	}

	this.hideTutorialTimer.update(elapsed);

	if (this.hideTutorialTimer.expired()) {
		this.tutorialDirection = "up";
	}

};

proto.nextTutorial = function horde_Engine_proto_nextTutorial (index) {

	if (!this.showTutorial || (this.tutorialDirection !== null)) {
		return;
	}

	if (this.tutorialIndex === (index - 1)) {
		this.tutorialDirection = "up";
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
		speed *= 0.20;
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
				var objCenterX = (object.position.x + (object.size.width / 2));
				var tileCenterX = ((tile.x * this.tileSize.width) + (this.tileSize.width / 2));
				if (objCenterX < tileCenterX) {
					object.position.x = tile.x * this.tileSize.width - object.size.width;
				} else {
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
				var objCenterY = (object.position.y + (object.size.height / 2));
				var tileCenterY = ((tile.y * this.tileSize.height) + (this.tileSize.height / 2));
				if (objCenterY < tileCenterY) {
					object.position.y = tile.y * this.tileSize.height - object.size.height;
				} else {
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
		if (type === "WEAPON_DROP") {
			switch (horde.randomRange(1, 4)) {
				case 1: type = "item_weapon_knife"; break;
				case 2: type = "item_weapon_spear"; break;
				case 3: type = "item_weapon_fireball"; break;
				case 4: type = "item_weapon_axe"; break;
			}
		}
		if (
			type.indexOf("item_weapon") >= 0
			&& player.hasWeapon("h_fire_sword")
		) {
			type = "item_gold_chest";
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
				this.endGame();
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
					} else if (o2.role == "powerup_weapon") {
						o2.die();
						o.addWeapon(o2.wepType, o2.wepCount);
						horde.sound.play("pickup_weapon");
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
	
	// Monsters don't damage projectiles
	if (attacker.role === "monster" && defender.role === "projectile") {
		return false;
	}
	
	// Allow the objects to handle the collision
	attacker.execute("onObjectCollide", [defender, this]);
	
	// Allow the defender to declare themselves immune to attacks from the attacker
	// For example: Cube is immune to non-fire attacks
	var nullify = defender.execute("onThreat", [attacker, this]);
	
	// Check for defender immunity
	if (
		defender.hasState(horde.Object.states.INVINCIBLE)
		|| defender.hitPoints === Infinity
		|| nullify === true
	) {
		// Defender is immune/invincible
		if (
			attacker.role === "projectile"
			&& attacker.hitPoints !== Infinity
		) {
			if (
				defender.damageType === "physical"
				&& attacker.damageType === "physical"
			) {
				// deflect if both parties are physical
				attacker.reverseDirection();
				attacker.deflect();
				horde.sound.play("immunity");
			} else {
				// otherwise just kill the attacker
				attacker.die();
			}
		}
		return false;
	}

	// Special case for non-immune projectiles hitting each other
	if (
		attacker.hitPoints !== Infinity
		&& attacker.role === "projectile"
		&& defender.role === "projectile"
		&& attacker.damageType === "physical"
		&& defender.damageType === "physical"
	) {
		if (attacker.piercing === false) {
			attacker.reverseDirection();
			attacker.deflect();
		}
		if (defender.piercing === false) {
			defender.reverseDirection();
			defender.deflect();
		}
		return false;
	}

	// Allow attackers to do stuff when they've hurt something
	attacker.execute("onDamage", [defender, this]);
	
	// Track combat stats
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

	// Deal damage and check for death
	if (defender.wound(attacker.damage)) {
		// defender has died
		
		// Assign gold/kills etc
		scorer.gold += defender.worth;
		scorer.kills++;
		defender.execute("onKilled", [attacker, this]);
		if (defender.lootTable.length > 0) {
			this.spawnLoot(defender);
		}
		
		// Handler piercing weapons
		if (
			attacker.role === "projectile"
			&& attacker.piercing === false
			&& attacker.hitPoints !== Infinity
		) {
			attacker.die();
		}
		
	} else {
		// defender did NOT die
		
		// Make the player invincible after some damage
		if (attacker.damage > 0 && defender.role === "hero") {
			defender.addState(horde.Object.states.INVINCIBLE, 2500);
		}
		
		// Projectile failed to kill it's target; automatic death for projectile
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
	var newPointerY;
	var usingPointerOptions = false;

	if (this.state == "running") {
		// Press "p" to pause.
		if (this.keyboard.isKeyPressed(keys.P) || this.keyboard.isKeyPressed(keys.ESCAPE)) {
			if (this.showTutorial) {
				this.showTutorial = false;
			} else {
				this.togglePause();
				this.keyboard.clearKeys();
				return;
			}
		}

		if (this.paused) {
			usingPointerOptions = true;
		}

		// Toggle sound with "M" for "mute".
		if (this.keyboard.isKeyPressed(77)) {
			horde.sound.toggleMuted();
		}

		// Code: lddqd = god mode
		if (this.keyboard.historyMatch(horde.Keyboard.godModeCode)) {
			this.keyboard.clearHistory();
			var p = this.getPlayerObject();
			p.cheater = true;
			if (p.hasState(horde.Object.states.INVINCIBLE)) {
				p.removeState(horde.Object.states.INVINCIBLE);
			} else {
				p.addState(horde.Object.states.INVINCIBLE);
			}
			horde.sound.play("code_entered");
		}

		// Code: ldkfa = Infinite fire swords
		if (this.keyboard.historyMatch(horde.Keyboard.allWeaponsCode)) {
			this.keyboard.clearHistory();
			var p = this.getPlayerObject();
			p.cheater = true;
			p.weapons = [{
				type: "h_fire_sword",
				count: null
			}];
			horde.sound.play("code_entered");
		}

		// Code: awesm = Infinite fire knives
		if (this.keyboard.historyMatch(horde.Keyboard.awesmCode)) {
			this.keyboard.clearHistory();
			var p = this.getPlayerObject();
			p.cheater = true;
			p.weapons = [{
				type: "h_fire_knife",
				count: null
			}];
			horde.sound.play("code_entered");
		}

		// Code: lddebug = toggle debug
		if (this.keyboard.historyMatch(horde.Keyboard.debugCode)) {
			this.keyboard.clearHistory();
			this.debug = !this.debug;
			horde.sound.play("code_entered");
		}

		// Code: ldreset = reset save data
		if (this.keyboard.historyMatch(horde.Keyboard.resetCode)) {
			this.keyboard.clearHistory();
			this.clearData("checkpoint_wave");
			this.clearData("checkpoint_hero");
			this.putData(HIGH_SCORE_KEY, DEFAULT_HIGH_SCORE);
			horde.sound.play("code_entered");
		}

		if (this.paused) {

			var startY = (this.pointerYStart - 22);

			if (this.verifyQuit) {
				// Nevermind
				if (
					(mouseV.x >= POINTER_X && mouseV.x <= (POINTER_X + 192))
					&& (mouseV.y > startY && mouseV.y < (startY + (POINTER_HEIGHT - 1)))
				) {
					if (this.mouse.hasMoved && this.pointerY !== 0) newPointerY = 0;
					if (this.mouse.isButtonDown(buttons.LEFT)) {
						this.keyboard.keyStates[keys.SPACE] = true;
					}
				}

				// Quit, seriously
				if (
					(mouseV.x >= POINTER_X && mouseV.x <= (POINTER_X + 192))
					&& (mouseV.y > (startY + POINTER_HEIGHT) && mouseV.y < ((startY + POINTER_HEIGHT) + 36))
				) {
					if (this.mouse.hasMoved && this.pointerY !== 1) newPointerY = 1;
					if (this.mouse.isButtonDown(buttons.LEFT)) {
						this.keyboard.keyStates[keys.SPACE] = true;
					}
				}
			} else {
				// Resume
				if (
					(mouseV.x >= POINTER_X && mouseV.x <= (POINTER_X + 106))
					&& (mouseV.y > startY && mouseV.y < (startY + (POINTER_HEIGHT - 1)))
				) {
					if (this.mouse.hasMoved && this.pointerY !== 0) newPointerY = 0;
					if (this.mouse.isButtonDown(buttons.LEFT)) {
						this.keyboard.keyStates[keys.SPACE] = true;
					}
				}

				// Quit
				if (
					(mouseV.x >= POINTER_X && mouseV.x <= (POINTER_X + 106))
					&& (mouseV.y > (startY + POINTER_HEIGHT) && mouseV.y < ((startY + POINTER_HEIGHT) + 36))
				) {
					if (this.mouse.hasMoved && this.pointerY !== 1) newPointerY = 1;
					if (this.mouse.isButtonDown(buttons.LEFT)) {
						this.keyboard.keyStates[keys.SPACE] = true;
					}
				}
			}
			
			if (kb.isKeyPressed(keys.ENTER) || kb.isKeyPressed(keys.SPACE)) {

				kb.clearKey(keys.ENTER);
				kb.clearKey(keys.SPACE);
				this.mouse.clearButtons();

				switch (this.pointerY) {
					case 0: // Resume
						this.togglePause();
						break;
					case 1: // Quit
						horde.sound.play("select_pointer");
						if (this.verifyQuit) {
							this.verifyQuit = false;
							this.togglePause();
							var p = this.getPlayerObject();
							p.wound(100);
						} else {
							this.pointerY = 0;
							this.verifyQuit = true;
						}
						break;
				}

			}
		}

	}

	if (this.state === "title") {

		usingPointerOptions = true;

		// Konami code! Hit Points *= 3
		if (!this.konamiEntered && this.keyboard.historyMatch(horde.Keyboard.konamiCode)) {
			horde.sound.play("code_entered");
			this.konamiEntered = true;
			var p = this.getPlayerObject();
			p.cheater = true;
			p.hitPoints *= 3;
		}

		// Accept hover/click with mouse on title screen options [#102]
		var startX = (POINTER_X - 40);
		var stopX = (POINTER_X + 130);
		var startY = (this.pointerYStart - 22);

		// Continue
		if (this.canContinue()) {
			if (
				(mouseV.x >= startX && mouseV.x <= stopX)
				&& (mouseV.y >= startY && mouseV.y < (startY + 20))
			) {
				if (this.mouse.hasMoved && this.pointerY !== 0) newPointerY = 0;
				if (this.mouse.isButtonDown(buttons.LEFT)) {
					this.keyboard.keyStates[keys.SPACE] = true;
				}
			}
		}

		// New game
		startY += POINTER_HEIGHT;
		if (
			(mouseV.x >= startX && mouseV.x <= stopX)
			&& (mouseV.y >= startY && mouseV.y < (startY + 20))
		) {
			if (this.mouse.hasMoved && this.pointerY !== 1) newPointerY = 1;
			if (this.mouse.isButtonDown(buttons.LEFT)) {
				this.keyboard.keyStates[keys.SPACE] = true;
			}
		}

		// Credits
		startY += POINTER_HEIGHT;
		if (
			(mouseV.x >= startX && mouseV.x <= stopX)
			&& (mouseV.y >= startY && mouseV.y < (startY + 20))
		) {
			if (this.mouse.hasMoved && this.pointerY !== 2) newPointerY = 2;
			if (this.mouse.isButtonDown(buttons.LEFT)) {
				this.keyboard.keyStates[keys.SPACE] = true;
			}
		}

		// High scores
		if (this.showHighScores()) {
			startY += POINTER_HEIGHT;
			if (
				(mouseV.x >= startX && mouseV.x <= stopX)
				&& (mouseV.y >= startY && mouseV.y < (startY + 20))
			) {
				if (this.mouse.hasMoved && this.pointerY !== 3) newPointerY = 3;
				if (this.mouse.isButtonDown(buttons.LEFT)) {
					this.keyboard.keyStates[keys.SPACE] = true;
				}
			}
		}

		if (kb.isKeyPressed(keys.ENTER) || kb.isKeyPressed(keys.SPACE)) {

			horde.sound.play("select_pointer");
			kb.clearKey(keys.ENTER);
			kb.clearKey(keys.SPACE);
			this.mouse.clearButtons();

			switch (this.pointerY) {
				case 0: // Continue
					var checkpointWave = this.getData("checkpoint_wave");
					if (checkpointWave !== null) {
						// Checkpoint data exists
						this.currentWaveId = (checkpointWave - 1);
						var checkpointHero = this.getData("checkpoint_hero");
						if (checkpointHero !== null) {
							var player = this.getPlayerObject();
							player.load(checkpointHero);
							// Start the player at full life but ding him for the amount of wounds he had
							player.totalDamageTaken += player.wounds;
							player.wounds = 0;
						}
						this.continuing = true;
						this.showTutorial = false;
						this.state = "intro_cinematic";
					}
					break;
				case 1: // New game
					this.continuing = false;
					this.showTutorial = true;
					this.state = "intro_cinematic";
					break;
				case 2: // Credits
					this.state = "credits";
					break;
				case 3: // High scores
					this.state = "high_scores";
					break;
			}

		}

	}

	// Want to see all high scores? Click here!
	if (this.state === "high_scores") {
		if (this.mouse.isButtonDown(buttons.LEFT)) {
			if ((mouseV.x > 76) && (mouseV.x < 560)) {
				if ((mouseV.y > 392) && (mouseV.y < 416)) {
					open("/onslaught_arena/high_scores");
					return;
				}
			}
		}
	}

	if (
		(this.state === "credits")
		|| (this.state === "high_scores")
	) {
		if (this.keyboard.isAnyKeyPressed() || this.mouse.isAnyButtonDown()) {
			kb.clearKeys();
			this.mouse.clearButtons();
			this.state = "title";
		}
	}

	if (this.state === "intro_cinematic") {
		if (this.keyboard.isAnyKeyPressed() || this.mouse.isAnyButtonDown()) {
			kb.clearKeys();
			this.mouse.clearButtons();
			this.state = "running";
			var player = this.getPlayerObject();
			this.woundsTo = player.wounds;
			this.currentMusic = "normal_battle_music";
			horde.sound.play(this.currentMusic);
		}
	}

	if (usingPointerOptions) {

		if (
			this.keyboard.isKeyPressed(keys.W)
			|| this.keyboard.isKeyPressed(keys.UP)
		) {
			this.keyboard.keyStates[keys.W] = false;
			this.keyboard.keyStates[keys.UP] = false;
			this.pointerY--;
			if (this.pointerY < this.pointerOptionsStart) this.pointerY = this.numPointerOptions;
			horde.sound.play("move_pointer");
		}
		if (
			this.keyboard.isKeyPressed(keys.S)
			|| this.keyboard.isKeyPressed(keys.DOWN)
		) {
			this.keyboard.keyStates[keys.S] = false;
			this.keyboard.keyStates[keys.DOWN] = false;
			this.pointerY++;
			if (this.pointerY > this.numPointerOptions) this.pointerY = this.pointerOptionsStart;
			horde.sound.play("move_pointer");
		}

		this.keyboard.storeKeyStates();

		if (newPointerY !== undefined) {
			horde.sound.play("move_pointer");
			this.pointerY = newPointerY;
		}

	}

	if (this.state === "running") {
		var player = this.getPlayerObject();

		if (this.paused || player.hasState(horde.Object.states.DYING)) {
			this.keyboard.storeKeyStates();
			return;
		}

		this.updateTargetReticle();

		var move = new horde.Vector2();
		var shoot = new horde.Vector2();

		if (kb.isKeyDown(keys.W)) {
			move.y = -1;
			this.nextTutorial(1);
		}
		if (kb.isKeyDown(keys.A)) {
			move.x = -1;
			this.nextTutorial(1);
		}
		if (kb.isKeyDown(keys.S)) {
			move.y = 1;
			this.nextTutorial(1);
		}
		if (kb.isKeyDown(keys.D)) {
			move.x = 1;
			this.nextTutorial(1);
		}
		
		if (kb.isKeyDown(keys.UP)) {
			shoot.y = -1;
			this.nextTutorial(2);
		}
		if (kb.isKeyDown(keys.DOWN)) {
			shoot.y = 1;
			this.nextTutorial(2);
		}
		if (kb.isKeyDown(keys.LEFT)) {
			shoot.x = -1;
			this.nextTutorial(2);
		}
		if (kb.isKeyDown(keys.RIGHT)) {
			shoot.x = 1;
			this.nextTutorial(2);
		}
		
		// Move the player
		player.stopMoving();
		if ((move.x !== 0) || (move.y !== 0)) {
			player.setDirection(move);
		}

		// Fire using the targeting reticle
		if (this.mouse.isButtonDown(buttons.LEFT)) {

			// Where did the click take place?
			if (
				this.showTutorial
				&& (mouseV.y <= (TUTORIAL_HEIGHT + this.tutorialY))
			) {
				this.showTutorial = false;
			} else if (
				((mouseV.x >= 380) && (mouseV.x <= 380+96))
				&& ((mouseV.y >= 416) && (mouseV.y <= 416+58))
			) {
				// Toggle mute
				horde.sound.toggleMuted();
				this.mouse.clearButtons();
			} else {
				// Anywhere else: ATTACK!
				var v = this.targetReticle.position.clone().subtract(player.boundingBox().center()).normalize();
				this.objectAttack(player, v);
				this.heroFiring = true;
				this.heroFiringDirection = v;
				if (this.tutorialIndex < 3) {
					this.tutorialIndex = 3;
					this.nextTutorial(4);
				}
				this.showReticle = true;
			}

		} else if (shoot.x !== 0 || shoot.y !== 0) {
			this.objectAttack(player, shoot);
			this.heroFiring = true;
			this.heroFiringDirection = shoot;
		} else {
			this.heroFiring = false;
			this.heroFiringDirection = null;
		}
		
		// Fire using the keyboard
		if (this.keyboard.isKeyDown(keys.SPACE)) {
			this.objectAttack(player);
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
		case "h_fire_knife":
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
		case "e_fireball_green":
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

		case "h_fireball":
			var h = v.heading();
			var vh = horde.Vector2.fromHeading(h);

			var id = this.spawnObject(object, weaponType, vh.clone());
			var o = this.objects[id];
			o.position.add(horde.Vector2.fromHeading(h - (Math.PI / 2)).scale(16));
			o.position.add(vh.clone().scale(16));

			var id = this.spawnObject(object, weaponType, vh.clone());
			var o = this.objects[id];
			o.position.add(vh.clone().scale(32));

			var id = this.spawnObject(object, weaponType, vh.clone());
			var o = this.objects[id];
			o.position.add(horde.Vector2.fromHeading(h + (Math.PI / 2)).scale(16));
			o.position.add(vh.clone().scale(16));
			break;

		case "e_ring_fire":
			var len = (Math.PI * 2);
			var step = (len / 10);
			var seed = (step / 2);
			for (var h = seed; h < len + seed; h += step) {
				this.spawnObject(
					object,
					weaponType,
					horde.Vector2.fromHeading(h)
				);
			}
			break;

			case "e_ring_fire_nega":
				var len = (Math.PI * 2);
				var step = (len / 10);
				for (var h = 0; h < len; h += step) {
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

		// Company Logo
		case "intro":
			this.drawLogo(ctx);
			break;
		
		// Title Screen
		case "title":
			this.drawTitle(ctx);
			this.drawPointer(ctx);
			this.drawTitlePointerOptions(ctx);
			break;

		// Credits
		case "credits":
			this.drawTitle(ctx);
			this.drawCredits(ctx);
			break;

		// High Scores
		case "high_scores":
			this.drawTitle(ctx);
			this.drawHighScores(ctx);
			break;

		case "intro_cinematic":
			this.drawIntroCinematic(ctx);
			break;

		// The game!
		case "running":
			this.drawFloor(ctx);
			if (!this.wonGame) {
				this.drawTargetReticle(ctx);
			}
			this.drawObjects(ctx);
			this.drawFauxGates(ctx);
			this.drawWalls(ctx);
			this.drawWaveText(ctx);
			this.drawUI(ctx);
			if (this.paused) {
				this.drawPaused(ctx);
				this.drawPointer(ctx);
				this.drawPausedPointerOptions(ctx);
			}
			if (this.showTutorial) {
				this.drawTutorial(ctx);
			}
			break;
		
		case "game_over":
			this.drawGameOver(ctx);
			break;
		
	}

	if (this.debug === true) {
		this.drawDebugInfo(ctx);
	}
	
};

proto.drawWaveText = function horde_Engine_proto_drawWaveText (ctx) {

	if (
		this.waveText.state == "show"
		|| this.waveText.state == "hide"
		|| this.waveText.state == "display"
	) {

		var text = this.waveText.string;
		var size = parseInt(this.waveText.size);

		var b = this.canvases.buffer.getContext("2d");

		var bw = (SCREEN_WIDTH / 2);
		var bh = (SCREEN_HEIGHT / 2);

		b.save();
		b.clearRect(0, 0, bw, bh);
		b.font = ("Bold " + size + "px Cracked");
		b.textBaseline = "top";
		b.lineWidth = 3;
		b.strokeStyle = COLOR_BLACK;
		b.fillStyle = "rgb(230, 103, 8)";

		var metrics = b.measureText(text);
		var x = ((bw / 2) - (metrics.width / 2));
		var y = ((bh / 2) - (size / 2) - 20);

		b.strokeText(text, x, y);
		b.fillText(text, x, y);
		b.restore();

		ctx.save();
		ctx.globalAlpha = this.waveText.alpha;
		ctx.drawImage(
			this.canvases.buffer,
			0, 0, bw, bh,
			0, 0, SCREEN_WIDTH, SCREEN_HEIGHT
		);
		ctx.restore();

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
	
	ctx.putImageData(this.gameOverBg, 0, 0);

	ctx.save();
	ctx.globalAlpha = this.gameOverAlpha;
	if (this.wonGame) {
		ctx.fillStyle = COLOR_BLACK;
	} else {
		ctx.fillStyle = "rgb(215, 25, 32)"; // red
	}
	ctx.fillRect(0, 0, this.view.width, this.view.height);
	ctx.restore();

	if (this.gameOverReady === true) {
		
		if (this.keyboard.isAnyKeyPressed() || this.mouse.isAnyButtonDown()) {
			this.keyboard.clearKeys();
			this.mouse.clearButtons();
			this.statsIndex += 1;
			if (this.statsIndex >= 5) {
				horde.sound.stop("victory");
				this.initGame();
				return;
			}
		}

		var headerY = 70;

		// Modal
		ctx.drawImage(
			this.preloader.getImage("ui"),
			0, 2322, 564, 404,
			38, 38, 564, 404
		);

		// Game Over
		if (this.wonGame) {
			ctx.drawImage(
				this.preloader.getImage("ui"),
				564, 2444, 256, 50,
				192, headerY, 256, 50
			);
		} else if (this.newHighScore) {
			ctx.drawImage(
				this.preloader.getImage("ui"),
				564, 2374, 404, 50,
				119, headerY, 404, 50
			);
		} else {
			ctx.drawImage(
				this.preloader.getImage("ui"),
				564, 2324, 218, 50,
				211, headerY, 218, 50
			);
		}

		this.drawObjectStats(this.getPlayerObject(), ctx);

		// Press anything to continue ...
		if (this.statsIndex >= 4) {
			ctx.drawImage(
				this.preloader.getImage("ui"),
				564, 2424, 334, 20,
				153, 404, 334, 20
			);
		}
		
	}
	
};

proto.drawObjectStats = function horde_Engine_proto_drawObjectStats (object, ctx) {

	var textX = 350;
	var textHeight = 55;
	
	ctx.save();
	ctx.font = "Bold 40px Cracked";

	var increment;
	var max = 0;
	var nextTimer = 0;

	var wavesComplete = this.currentWaveId;

	if (this.wonGame) {
		wavesComplete += 1;
	}

	// Waves
	var displayWave = 0;
	if (this.statsIndex === 0) {
		displayWave = this.statsCount;
		max = wavesComplete;
		// Settings for Gold earned:
		increment = 199;
		nextTimer = 10;
	} else {
		displayWave = wavesComplete;
	}
	ctx.fillStyle = "rgb(199, 234, 251)";
	ctx.fillText(displayWave + " x 1000", textX, 182);

	// Gold earned
	var displayGold = 0;
	if (this.statsIndex === 1) {
		displayGold = this.statsCount;
		max = object.gold;
		// Settings for Damage taken:
		increment = 10;
		nextTimer = 10;
	} else if (this.statsIndex > 1) {
		displayGold = object.gold;
	}
	ctx.fillStyle = "rgb(255, 245, 121)";
	ctx.fillText(displayGold, textX, (180 + textHeight));

	// Damage taken
	var displayDamage = 0;
	if (this.statsIndex === 2) {
		displayDamage = this.statsCount;
		max = object.totalDamageTaken;
		// Settings for Total score:
		increment = 299;
		nextTimer = 5;
	} else if (this.statsIndex > 2) {
		displayDamage = object.totalDamageTaken;
	}
	ctx.fillStyle = "rgb(237, 28, 36)";
	ctx.fillText("-" + displayDamage + " x 10", textX, 180 + (textHeight * 2));

	// Total score
	var displayScore = "";
	var totalScore = this.getTotalScore();
	if (this.statsIndex === 3) {
		displayScore = this.statsCount;
		max = totalScore;
	} else if (this.statsIndex > 3) {
		displayScore = totalScore;
	}
	ctx.fillStyle = "rgb(250, 166, 26)";
	ctx.fillText(displayScore, textX, (184 + (textHeight * 3)));

	if (this.statsCount >= max) {
		this.statsCount = 0;
		this.statsIncrement = increment;
		this.statsIndex += 1;
		this.statsTimer.start(nextTimer);
	}

	ctx.restore();
	
};

/**
 * Calculates the player's total score
 */
proto.getTotalScore = function () {

	var player = this.getPlayerObject();
	var wavesComplete = this.currentWaveId;

	if (this.wonGame) {
		wavesComplete += 1;
	}

	var score = (wavesComplete * 1000);
	score += player.gold;
	score -= (player.totalDamageTaken * 10);

	if (player.cheater === true) {
		score /= 2;
	}

	if (score < 0) {
		score = 0;
	}

	return score;
};

proto.drawLogo = function horde_Engine_proto_drawLogo (ctx) {

	// Clear the screen
	ctx.save();
	ctx.fillStyle = COLOR_BLACK;
	ctx.fillRect(0, 0, this.view.width, this.view.height);
	ctx.restore();
		
	// Draw the logo
	if (this.logoAlpha > 0) {
		ctx.save();
		ctx.globalAlpha = this.logoAlpha;
		ctx.drawImage(
			this.preloader.getImage("ui"),
			0, 0, 370, 430,
			160, 0, 370, 430
		);
		ctx.restore();
	}

};

proto.drawFloor = function horde_Engine_proto_drawFloor (ctx) {
	ctx.drawImage(
		this.images.getImage("arena"),
		32, 480, 576, 386,
		32, 0, 576, 386
	);
};

proto.drawWalls = function horde_Engine_proto_drawWalls (ctx) {
	ctx.drawImage(
		this.images.getImage("arena"),
		0, 0, SCREEN_WIDTH, SCREEN_HEIGHT,
		0, 0, this.view.width, this.view.height
	);
};

proto.drawArena = function horde_Engine_proto_drawArena (ctx) {
	this.drawFloor(ctx);
	this.drawWalls(ctx);
};

proto.drawPaused = function horde_Engine_proto_drawPaused (ctx) {

	ctx.save();

	ctx.globalAlpha = OVERLAY_ALPHA;
	ctx.fillRect(0, 0, this.view.width, this.view.height);

	ctx.globalAlpha = 1;
	ctx.drawImage(
		this.preloader.getImage("ui"),
		0, 1718, 564, 404,
		38, 38, 564, 404
	);

	var player = this.getPlayerObject();

	ctx.font = "Bold 30px Cracked";
	ctx.textAlign = "left";

	ctx.fillStyle = "rgb(237, 28, 36)";
	ctx.fillText(player.kills, 390, 160);

	ctx.fillStyle = "rgb(145, 102, 0)";
	ctx.fillText(player.meatEaten, 390, 210);

	ctx.fillStyle = "rgb(199, 234, 251)";
	ctx.fillText(player.shotsFired, 390, 264);

	ctx.fillStyle = "rgb(250, 166, 26)";
	ctx.fillText(this.getAccuracy(player) + "%", 390, 320);

	ctx.restore();

};

proto.getAccuracy = function horde_Engine_proto_getAccuracy (player) {

	if (player.shotsFired === 0) return 0;

	return Math.round((player.shotsLanded / player.shotsFired) * 100);

};

proto.drawTutorial = function horde_Engine_proto_drawTutorial (ctx) {

	if (this.paused) return;

	ctx.save();
	ctx.globalAlpha = OVERLAY_ALPHA;
	ctx.fillRect(0, this.tutorialY, this.view.width, TUTORIAL_HEIGHT);

	ctx.globalAlpha = 1;
	ctx.font = "Bold 30px Cracked";
	ctx.textAlign = "center";

	var tips = [
		"Tip 1/4: Use the WASD keys to move the character.",
		"Tip 2/4: Throw weapons with the arrow keys.",
		"Tip 3/4: Or use the mouse to aim with the target reticle.",
		"Tip 4/4: And throw weapons with the left mouse button.",
		"Kill monsters and collect gold to raise your score!"
	];

	ctx.fillStyle = COLOR_BLACK;
	ctx.fillText(tips[this.tutorialIndex], 322, (this.tutorialY + 36));

	ctx.fillStyle = "rgb(230, 230, 230)";
	ctx.fillText(tips[this.tutorialIndex], 320, (this.tutorialY + 34));

	ctx.font = "20px Cracked";

	ctx.fillStyle = COLOR_BLACK;
	ctx.fillText("press here or ESC to skip", 322, (this.tutorialY + 62));

	ctx.fillStyle = "rgb(118, 151, 183)";
	ctx.fillText("press here or ESC to skip", 320, (this.tutorialY + 60));
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
	
	if (o.role === "hero" && this.heroFiring) {
		var s = o.getSpriteXY(this.heroFiringDirection);
	} else {
		var s = o.getSpriteXY();
	}

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

		ctx.fillStyle = COLOR_WHITE;
		ctx.fillRect(-(o.size.width / 2), (o.size.height / 2), o.size.width, hpHeight);
		ctx.fillStyle = COLOR_BLACK;
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

	if (!this.showReticle) return;

	ctx.save();
	ctx.globalAlpha = 0.5;
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
	var wCount = (weaponInfo.count ? weaponInfo.count : "");
	
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
	ctx.fillStyle = COLOR_WHITE;
	ctx.fillRect(bar.x - 2, bar.y - 2, bar.width + 2, bar.height + 4);
	ctx.fillRect(bar.x + bar.width, bar.y, 2, bar.height);
	ctx.fillStyle = COLOR_BLACK;
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

	// Mute button
	ctx.drawImage(
		this.images.getImage("objects"),
		(horde.sound.isMuted() ? 96 : 0), 96, 96, 58,
		380, 416, 96, 58
	);
	
	// Draw gold coin
	ctx.drawImage(
		this.images.getImage("objects"),
		32, 32, 32, 32,
		603, 443, 32, 32
	);
	
	// Draw Weapon Icon
	ctx.drawImage(
		this.images.getImage("objects"),
		w.spriteX, w.spriteY, 32, 32,
		603, 412, 32, 32
	);
	
	// Draw gold amount and weapon count
	ctx.save();
	ctx.textAlign = "right";
	ctx.fillStyle = COLOR_WHITE;
	ctx.font = "Bold 38px Cracked";

	var totalScore = this.getTotalScore();

	ctx.fillText(wCount, 600, 440);
	ctx.fillText(totalScore, 600, 472);
	ctx.restore();

};

/**
 * Draws the title screen.
 * @param {object} Canvas 2d context to draw on.
 * @return {void}
 */
proto.drawTitle = function horde_Engine_proto_drawTitle (ctx) {

	var grey = "rgb(230, 230, 230)";
	
	ctx.drawImage(
		this.preloader.getImage("ui"),
		0, 430, 640, 480,
		0, 0, 640, 480
	);
	
	var highScore = ("High Score: " + this.getData(HIGH_SCORE_KEY));

	ctx.save();
	ctx.font = "Bold 36px Cracked";
	ctx.textAlign = "center";

	ctx.fillStyle = COLOR_BLACK;
	ctx.fillText(highScore, 322, 456);

	ctx.fillStyle = grey;
	ctx.fillText(highScore, 320, 454);
	ctx.restore();

	// Version
	var version = ("v" + VERSION);
	ctx.save();
	ctx.font = "Bold 14px Monospace";
	ctx.textAlign = "right";

	ctx.fillStyle = COLOR_BLACK;
	ctx.fillText(version, 638, 478);

	ctx.fillStyle = grey;
	ctx.fillText(version, 636, 476);
	ctx.restore();
	
	// Copyright text
	var copyright = "\u00A9 2010 Lost Decade Games";
	ctx.save();
	ctx.font = "Bold 14px Monospace";

	ctx.fillStyle = COLOR_BLACK;
	ctx.fillText(copyright, 6, 478);

	ctx.fillStyle = grey;
	ctx.fillText(copyright, 4, 476);
	ctx.restore();

};

proto.drawPointer = function horde_Engine_proto_drawPointer (ctx) {

	var textY = (this.pointerYStart - 18);
	var x = (POINTER_X - 42);
	var y = (this.pointerYStart + (this.pointerY * POINTER_HEIGHT) - POINTER_HEIGHT);

	ctx.save();
	ctx.drawImage(
		this.images.getImage("objects"),
		320, 192, 36, 26,
		x, y,
		36, 26
	);
	ctx.restore();

};

proto.canContinue = function () {
	var checkpointWave = this.getData("checkpoint_wave");
	return Boolean(checkpointWave);
};

proto.drawTitlePointerOptions = function horde_Engine_proto_drawTitlePointerOptions (ctx) {

	var startY = (this.pointerYStart - 22);
	var spriteY;

	// Continue
	if (this.canContinue()) {
		spriteY = ((this.pointerY == 0) ? 638 : 430);
	} else {
		spriteY = 534;
	}
	ctx.drawImage(
		this.preloader.getImage("ui"),
		640, spriteY, 116, 20,
		POINTER_X, startY, 116, 20
	);

	// New game
	spriteY = ((this.pointerY == 1) ? 664 : 456);
	ctx.drawImage(
		this.preloader.getImage("ui"),
		640, spriteY, 132, 26,
		POINTER_X, (startY + POINTER_HEIGHT), 132, 26
	);

	// Credits
	spriteY = ((this.pointerY == 2) ? 690 : 482);
	ctx.drawImage(
		this.preloader.getImage("ui"),
		640, spriteY, 90, 22,
		POINTER_X, (startY + (POINTER_HEIGHT * 2)), 90, 22
	);

	// High scores
	if (this.showHighScores()) {
		spriteY = ((this.pointerY == 3) ? 714 : 506);
		ctx.drawImage(
			this.preloader.getImage("ui"),
			640, spriteY, 146, 28,
			POINTER_X, (startY + (POINTER_HEIGHT * 3)), 146, 28
		);
	}

};

proto.drawPausedPointerOptions = function horde_Engine_proto_drawPausedPointerOptions (ctx) {

	var startY = (this.pointerYStart - 22);
	var spriteY;

	if (this.verifyQuit) {
		// Nevermind
		spriteY = ((this.pointerY == 0) ? 1932 : 1860);
		ctx.drawImage(
			this.preloader.getImage("ui"),
			564, spriteY, 158, 26,
			POINTER_X, startY, 158, 26
		);
	} else {
		// Resume
		spriteY = ((this.pointerY == 0) ? 1788 : 1718);
		ctx.drawImage(
			this.preloader.getImage("ui"),
			564, spriteY, 106, 26,
			POINTER_X, startY, 106, 26
		);
	}

	if (this.verifyQuit) {
		// Quit, seriously
		spriteY = ((this.pointerY == 1) ? 1966 : 1894);
		ctx.drawImage(
			this.preloader.getImage("ui"),
			564, spriteY, 192, 32,
			POINTER_X, (startY + POINTER_HEIGHT), 196, 32
		);
	} else {
		// Quit
		spriteY = ((this.pointerY == 1) ? 1822 : 1752);
		ctx.drawImage(
			this.preloader.getImage("ui"),
			564, spriteY, 70, 36,
			POINTER_X, (startY + POINTER_HEIGHT), 70, 36
		);
	}

};

proto.initOptions = function () {

	switch (this.state) {
		case "title":
			this.pointerYStart = 300;

			if (this.canContinue()) {
				this.pointerY = 0;
				this.pointerOptionsStart = 0;
			} else {
				this.pointerY = 1;
				this.pointerOptionsStart = 1;
			}
			if (this.showHighScores()) {
				this.numPointerOptions = 3;
			} else {
				this.numPointerOptions = 2;
			}
			break;
		case "running":
			this.pointerYStart = 378;
			this.pointerY = 0;
			this.numPointerOptions = 1;
			this.pointerOptionsStart = 0;
			this.verifyQuit = false;
			break;
	}

};

proto.drawHighScores = function horde_Engine_proto_drawHighScores (ctx) {
	ctx.save();
	ctx.globalAlpha = OVERLAY_ALPHA;
	ctx.fillRect(0, 0, this.view.width, this.view.height);

	ctx.globalAlpha = 1;
	ctx.drawImage(
		this.preloader.getImage("ui"),
		0, 910, 564, 404,
		38, 38, 564, 404
	);

	try {
		var scores = JSON.parse(window.onslaughtScores);
	} catch (e) {
		var scores = null;
	}

	ctx.font = "Bold 40px Cracked";

	if (scores && scores.length) {
		var height = 50;

		for (var i = 0, l = scores.length; i < l; ++i) {
			var score = scores[i];
			var name = ((i+1) + ".   " + score.name);

			ctx.fillStyle = COLOR_WHITE;
			ctx.textAlign = "left";
			ctx.fillText(name, 100, (160 + (i * height)));

			ctx.fillStyle = "rgb(255, 203, 5)";
			ctx.textAlign = "right";
			ctx.fillText(score.value, 500, (160 + (i * height)));
		}
	} else {
		ctx.fillStyle = COLOR_WHITE;
		ctx.textAlign = "center";
		ctx.fillText("None yet. Submit yours!", 320, 240);
	}

	ctx.restore();
};

proto.drawCredits = function horde_Engine_proto_drawCredits (ctx) {
	ctx.save();
	ctx.globalAlpha = OVERLAY_ALPHA;
	ctx.fillRect(0, 0, this.view.width, this.view.height);
	ctx.globalAlpha = 1;
	ctx.drawImage(
		this.preloader.getImage("ui"),
		0, 1314, 564, 404,
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
			ctx.fillStyle = COLOR_BLACK;
			ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
			ctx.save();
			ctx.putImageData(this.introFadeOutBg, 0, 0);
			ctx.restore();
			if (this.introFadeAlpha > 0) {
				ctx.save();
				ctx.globalAlpha = this.introFadeAlpha;
				ctx.fillStyle = COLOR_BLACK;
				ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
				ctx.restore();
			}
			break;
		
		case 1:
			this.drawFloor(ctx);
			this.drawFauxGates(ctx);
			this.drawWalls(ctx);
			if (this.introFadeAlpha > 0) {
				ctx.save();
				ctx.globalAlpha = this.introFadeAlpha;
				ctx.fillStyle = COLOR_BLACK;
				ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
				ctx.restore();
			}
			break;
		
		case 2:
		case 3:
			this.drawFloor(ctx);
			this.drawFauxGates(ctx);
			this.drawWalls(ctx);
			break;
			
		case 4:
		case 5:
		case 9:
			this.drawFloor(ctx);
			if (this.introHero) {
				this.drawObject(ctx, this.introHero);
			}
			this.drawFauxGates(ctx);
			this.drawWalls(ctx);
			break;
			
		case 6:
		case 7:
		case 8:
			this.drawFloor(ctx);
			ctx.drawImage(this.images.getImage("characters"),
				20 * 32, 0, 32, 32,
				304, 224, 32, 32
			);
			this.drawFauxGates(ctx);
			this.drawWalls(ctx);
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
		var spriteX = 0;
		var spriteY = 192;

		if (g > 0) {
			spriteX = 320;
			spriteY = ((g == 1) ? 288 : 352);
		}

		ctx.drawImage(
			this.images.getImage("objects"),
			spriteX, spriteY, 64, 64,
			(this.gatesX + 96 + (g * 192)), this.gatesY, 64, 64
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
	ctx.fillStyle = COLOR_WHITE;
	ctx.font = "Bold 20px Monospace";
	ctx.fillText("Elapsed: " + this.lastElapsed, 10, 20);
	ctx.textAlign = "right";
	ctx.fillText(Math.round(1000 / this.lastElapsed) + " FPS", 630, 20);
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

/**
 * Clears some persistent data by key
 * @param {String} key The key of the data to clear
 */
proto.clearData = function horde_Engine_proto_clearData (key) {
	if (typeof localStorage == "object") {
		localStorage.removeItem(key);
	}
};

proto.endGame = function () {
	this.gameOverReady = false;
	this.gameOverAlpha = 0;
	this.updateGameOver();
	this.state = "game_over";
};

proto.sendHighScore = function (highScore) {

	var xhr = new XMLHttpRequest();
	xhr.open("POST", "/onslaught_arena/high_scores");
	xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
	xhr.send("high_score=" + highScore);

};

}());
