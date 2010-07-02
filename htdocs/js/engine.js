(function define_horde_Engine () {

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

/**
 * Initializes the engine
 * @return {void}
 */
proto.init = function horde_Engine_proto_init () {

	this.state = "title";

	this.initMap();

	this.initSpawnPoints();
	this.initWaves();
	
	this.initPlayer();

	this.canvases["display"] = horde.makeCanvas("display", this.view.width, this.view.height);
	
	this.images = new horde.ImageLoader();
	this.images.load({
		"background": "img/arena.png",
		"shadow": "img/arena_shadow.png",
		"characters": "img/sheet_characters.png",
		"objects": "img/sheet_objects.png"
	}, this.handleImagesLoaded, this);
	
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
			sp.queueSpawn(o.type, o.count);
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
	w.addObjects(0, "bat", 5 * this.waveModifier);
	w.addObjects(1, "bat", 5 * this.waveModifier);
	w.addObjects(2, "bat", 5 * this.waveModifier);
	this.waves.push(w);
	
	// Wave #2
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 2000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "bat", 10 * this.waveModifier);
	w.addObjects(1, "goblin", 5 * this.waveModifier);
	w.addObjects(2, "bat", 10 * this.waveModifier);
	this.waves.push(w);
	
	// Wave #3
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "goblin", 15 * this.waveModifier);
	w.addObjects(1, "goblin", 15 * this.waveModifier);
	w.addObjects(2, "goblin", 15 * this.waveModifier);
	this.waves.push(w);
	
	// Wave #4
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "goblin", 5 * this.waveModifier);
	w.addObjects(0, "bat", 15 * this.waveModifier);
	w.addObjects(1, "bat", 10 * this.waveModifier);
	w.addObjects(1, "goblin", 20 * this.waveModifier);
	w.addObjects(2, "goblin", 5 * this.waveModifier);
	w.addObjects(2, "bat", 15 * this.waveModifier);
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
	player.weapons.push({
		type: "h_spear",
		count: 10
	})
};

horde.Engine.prototype.handleImagesLoaded = function horde_Engine_proto_handleImagesLoaded () {
	this.imagesLoaded = true;
};

horde.Engine.prototype.update = function horde_Engine_proto_update () {

	var now = horde.now();
	var elapsed = now - this.lastUpdate;
	this.lastUpdate = now;

	this.lastElapsed = elapsed;

	if (this.imagesLoaded !== true) {
		return;
	}

	switch (this.state) {

		// Title Screen
		case "title":
			this.handleInput();
			this.render();
			break;
			
		// The game!
		case "running":
			this.handleInput();
			this.updateWaves(elapsed);
			this.updateSpawnPoints(elapsed);
			this.updateObjects(elapsed);
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
			this.waveModifier += 0.5;
		}
		this.initSpawnWave(this.waves[this.currentWaveId]);
	}
};

horde.Engine.prototype.updateObjects = function (elapsed) {
	
	for (var id in this.objects) {

		var o = this.objects[id];
		
		if (o.state === "dead") {
			delete(this.objects[o.id]);
			continue;
		}
		
		o.update(elapsed);

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
		
		if (o.role === "fluff") {
			continue;
		}
		
		for (var x in this.objects) {
			var o2 = this.objects[x];
			if (o2.state !== "alive" || o2.team === o.team || o2.role === "fluff") {
				continue;
			}
			if (o.boundingBox().intersects(o2.boundingBox())) {
				this.dealDamage(o2, o);
				this.dealDamage(o, o2);
			}
		}
		
	}
	
};

// Deals damage from object "attacker" to "defender"
horde.Engine.prototype.dealDamage = function (attacker, defender) {
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
			/*
			// Random chance to drop treasure!
			if (horde.randomRange(1, 10) === 10) {
				var chest = this.makeObject("chest");
				chest.position = defender.position.clone();
				this.addObject(chest);
			}
			*/
		}
	}
};

/**
 * Handles game input
 * @return {void}
 */
proto.handleInput = function horde_Engine_proto_handleInput () {

	if (this.state === "title") {
		if (this.keyboard.historyMatch(horde.Keyboard.konamiCode)) {
			this.konamiEntered = true;
		}
		if (this.keyboard.isKeyPressed(32)) {
			if (this.konamiEntered) {
				var p = this.getPlayerObject();
				p.weapons.push({
					type: "h_trident",
					count: null 
				});
			}
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
		if (move.x !== 0 || move.y !== 0) {
			player.setDirection(move);
		}

		// Have the player fire
		if (this.keyboard.isKeyPressed(32)) {
			
			var weapon_type = player.fireWeapon();
			if (weapon_type === false) {
				break;
			}
			
			switch (weapon_type) {

				case "h_fireball":
					for (var d = 0; d < 8; d++) {
						var dir = horde.directions.toVector(d);
						this.spawnObject(player, weapon_type, dir);
					}
					break;

				case "h_knife":
					var f = horde.directions.fromVector(player.facing);
					for (var o = -1; o < 2; o++) {
						var dir = horde.directions.toVector(f + o);
						this.spawnObject(player, weapon_type, dir);
					}
					break;

				default:
					this.spawnObject(player, weapon_type);
					break;
			}

		}

		this.keyboard.storeKeyStates();
	}

};

horde.Engine.prototype.render = function () {
	
	var ctx = this.canvases["display"].getContext("2d");

	switch (this.state) {
		
		// Title Screen
		case "title":
			this.drawBackground(ctx);
			this.drawShadow(ctx);
			this.drawTitle(ctx);
			break;

		// The game!
		case "running":
			this.drawBackground(ctx);
			this.drawObjects(ctx);
			this.drawShadow(ctx);
			this.drawUI(ctx);
			break;
		
	}

	if (this.debug === true) {
		this.drawDebugInfo(ctx);
	}
	
};

proto.drawBackground = function horde_Engine_proto_drawBackground (ctx) {
	ctx.drawImage(this.images.getImage("background"), 
		0, 0, 640, 480, 
		0, 0, this.view.width, this.view.height
	);
};

proto.drawShadow = function horde_Engine_proto_drawShadow (ctx) {
	ctx.drawImage(this.images.getImage("shadow"),
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
		
		ctx.drawImage(this.images.getImage(o.spriteSheet),
			s.x, s.y, o.size.width, o.size.height,
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
	
	var o = this.getPlayerObject();
	
	// Draw health bar
	var hpWidth = 300;
	ctx.save();
	ctx.fillStyle = "rgb(50, 0, 0)";
	ctx.fillRect(10, 430, hpWidth, 30);
	ctx.fillStyle = "rgb(255, 0, 0)";
	ctx.strokeStyle = "rgb(255, 255, 255)";
	ctx.lineWidth = 2;
	ctx.fillRect(10, 430, hpWidth - Math.round((hpWidth * o.wounds) / o.hitPoints), 30);
	ctx.strokeRect(10, 430, hpWidth, 30);
	ctx.restore();
	
	// Draw gold coin
	ctx.drawImage(this.images.getImage("objects"),
		0, 32, 32, 32, 603, 443, 32, 32
	);
	
	// Draw gold amount
	ctx.save();
	ctx.textAlign = "right";
	ctx.fillStyle = "rgb(255,255,255)";
	ctx.font = "Bold 32px Monospace";
	ctx.fillText(o.gold, 603, 469);
	ctx.restore();

};

proto.drawTitle = function horde_Engine_proto_drawTitle (ctx) {
	
	// TODO: DRAW GAME LOGO HERE
	
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
	ctx.globalAlpha = this.titleAlpha;
	ctx.fillStyle = "rgb(0,0,0)";
	ctx.font = "Bold 35px Monospace";
	ctx.fillText("Press space to begin", 110, 280);
	ctx.restore();
		
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
