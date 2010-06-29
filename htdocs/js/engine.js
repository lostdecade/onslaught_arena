(function define_horde_Engine () {

/**
 * Creates a new Engine object
 * @constructor
 */
horde.Engine = function horde_Engine () {
	this.lastUpdate = 0;
	this.canvases = {};
	
	this.objects = {};
	this.objectIdSeed = 0;
	this.activeObjectId = null;
	
	this.keyboard = new horde.Keyboard();
	
	this.view = new horde.Size(640, 480);
	
	this.images = null;

};

var proto = horde.Engine.prototype;

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

proto.makeObject = function horde_Engine_proto_makeObject (type) {
	var obj = new horde.Object();
	for (var x in horde.objectTypes[type]) {
		obj[x] = horde.objectTypes[type][x];
	}
	return obj;
};

proto.spawnObject = function horde_Engine_proto_spawnObject (parent, type) {
	var o = this.makeObject(type);
	o.ownerId = parent.id;
	o.team = parent.team;
	o.centerOn(parent.boundingBox().center());
	o.setDirection(parent.facing);
	this.addObject(o);
};

/**
 * Initializes the engine
 * @return {void}
 */
proto.init = function horde_Engine_proto_init () {
	
	this.map = [
		[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
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
	
	this.tileSize = new horde.Size(32, 32);
	
	var hero = this.makeObject("hero");
	hero.centerOn(horde.Vector2.fromSize(this.view).scale(0.5));
	this.activeObjectId = this.addObject(hero);
	
	var numEnemies = horde.randomRange(1, 1);
	for (var x = 0; x < numEnemies; x++) {
		var e = this.makeObject("bat");
		e.position.x = 9 * this.tileSize.width;
		e.position.y = 2 * this.tileSize.height;
		this.addObject(e);
	}
	
	this.canvases["display"] = horde.makeCanvas("display", this.view.width, this.view.height);
	
	this.images = new horde.ImageLoader();
	this.images.load({
		"background": "img/arena.png",
		"shadow": "img/arena_shadow.png",
		"characters": "img/char.png"
	}, this.handleImagesLoaded, this);
	
};

horde.Engine.prototype.handleImagesLoaded = function horde_Engine_proto_handleImagesLoaded () {
	this.imagesLoaded = true;
};

horde.Engine.prototype.update = function horde_Engine_proto_update () {

	var now = horde.now();
	var elapsed = now - this.lastUpdate;
	this.lastUpdate = now;

	if (this.imagesLoaded !== true) {
		return;
	}
	
	this.handleInput();
	
	for (var id in this.objects) {

		var o = this.objects[id];
		
		if (o.wounds >= o.hitPoints) {
			delete(this.objects[o.id]);
			continue;
		}
		
		o.update(elapsed);
		
		if (o.id !== this.activeObjectId) {
			o.think(this.objects);
		}

		var px = ((o.speed / 1000) * elapsed);
		
		if (o.direction.x !== 0) {
			// the object is moving along the "x" axis
			o.position.x += (o.direction.x * px);
			var b = o.boundingBox();
			var size = new horde.Vector2(b.width, b.height);
			var b = o.position.clone().scale(1 / this.tileSize.width).floor();
			var e = o.position.clone().add(size).scale(1 / this.tileSize.width).floor();
			for (var y = b.y; y <= e.y; y++) {
				for (var x = b.x; x <= e.x; x++) {
					if (this.map[y][x] === 0) {
						// unwalkable
						// hit a wall
						if (o.ownerId === "o1") {
							o.wounds = o.hitPoints;
						}
						if (o.direction.x > 0) {
							// moving right
							o.position.x = x * this.tileSize.width - o.size.width;
						} else {
							// moving left
							o.position.x = x * this.tileSize.width + this.tileSize.width;
						}
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
			for (var y = b.y; y <= e.y; y++) {
				for (var x = b.x; x <= e.x; x++) {
					if (this.map[y][x] === 0) {
						// unwalkable
						if (o.ownerId === "o1") {
							o.wounds = o.hitPoints;
						}
						if (o.direction.y > 0) {
							// moving down
							o.position.y = y * this.tileSize.height - o.size.height;
						} else {
							// moving up
							o.position.y = y * this.tileSize.height + this.tileSize.height;
						}
					}
				}
			}
		}
		
		
		//o.position.add(o.direction.clone().scale(px));
		
		for (var x in this.objects) {
			
			var o2 = this.objects[x];
			
			if (o2.wounds >= o2.hitPoints) {
				continue;
			}
			
			if (o2.team === o.team) {
				continue;
			}
			
			if (o.boundingBox().intersects(o2.boundingBox())) {
				o.wounds += o2.damage;
				o2.wounds += o.damage;
			}
			
		}
		
	}
	
	this.render();
};

horde.Engine.prototype.handleInput = function () {
	
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
	
	var o = this.objects["o1"];
	
	o.stopMoving();
	
	if (move.x !== 0 || move.y !== 0) {
		o.setDirection(move);
	}
	
	if (this.keyboard.isKeyPressed(32)) {
		this.spawnObject(o, "h_rock");
	}
	
	this.keyboard.storeKeyStates();
	
};

horde.Engine.prototype.render = function () {
	var ctx = this.canvases["display"].getContext("2d");

	// TODO: remove this once we have a map
	//ctx.fillStyle = "rgb(0,0,0)";
	//ctx.fillRect(0, 0, this.view.width, this.view.height);
	
	ctx.drawImage(this.images.getImage("background"), 
			0, 0, 640, 480, 
			0, 0, this.view.width, this.view.height);
	
	var hpWidth = 300;
	
	var o = this.objects["o1"];
	
	// draw objects
	this.drawObjects(ctx);
	
	// Draw shadow layer
	ctx.drawImage(this.images.getImage("shadow"),
		0, 0, 576, 386,
		32, 0, 576, 386
	);
	
	ctx.save();
	ctx.fillStyle = "rgb(255, 0, 0)";
	ctx.strokeStyle = "rgb(255, 255, 255)";
	ctx.lineWidth = 2;
	ctx.fillRect(10, 430, hpWidth - Math.round((hpWidth * o.wounds) / o.hitPoints), 30);
	ctx.strokeRect(10, 430, hpWidth, 30);
	ctx.restore();

};

horde.Engine.prototype.drawObjects = function (ctx) {
	for (var id in this.objects) {
		var o = this.objects[id];
		if (o.role === "monster") {
			var s = o.getSpriteXY();
			ctx.drawImage(this.images.getImage(o.spriteSheet),
				s.x, s.y, o.size.width, o.size.height,
				o.position.x, o.position.y, o.size.width, o.size.height
			);
		} else {
			ctx.fillStyle = o.color;
			ctx.fillRect(parseInt(o.position.x), parseInt(o.position.y), o.size.width, o.size.height);
		}
	}
};

horde.Engine.prototype.run = function () {
	this.init();
	this.lastUpdate = horde.now();
	this.interval = horde.setInterval(0, this.update, this);
};

horde.Engine.prototype.stop = function () {
	window.clearInterval(this.interval);
};

}());
