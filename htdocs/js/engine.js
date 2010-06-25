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

/**
 * Initializes the engine
 * @return {void}
 */
proto.init = function horde_Engine_proto_init () {
	
	var hero = new horde.Object();
	hero.team = 0;
	hero.hitPoints = 10;
	hero.centerOn(horde.Vector2.fromSize(this.view).scale(0.5));
	this.activeObjectId = this.addObject(hero);
	
	var numEnemies = horde.randomRange(5, 8);
	for (var x = 0; x < numEnemies; x++) {
		var e = new horde.Object();
		e.team = 1;
		e.hitPoints = 2;
		e.color = "rgb(0, 255, 0)";
		e.speed = 50;
		e.position.x = horde.randomRange(0, this.view.width - e.size.width);
		e.position.y = horde.randomRange(0, this.view.height - e.size.height);
		
		this.addObject(e);
	}
	
	this.canvases["display"] = horde.makeCanvas("display", this.view.width, this.view.height);
};

horde.Engine.prototype.update = function horde_Engine_proto_update () {

	var now = horde.now();
	var elapsed = now - this.lastUpdate;
	this.lastUpdate = now;

	this.handleInput();
	
	for (var id in this.objects) {

		var o = this.objects[id];
		
		if (o.wounds >= o.hitPoints) {
			delete(this.objects[o.id]);
			continue;
		}
		
		if (o.id !== this.activeObjectId) {
			o.think(this.objects);
		}

		var px = ((o.speed / 1000) * elapsed);
		o.position.add(o.direction.clone().scale(px));
		
		for (var x in this.objects) {
			
			var o2 = this.objects[x];
			
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
	
	o.stop();
	
	if (move.x !== 0 || move.y !== 0) {
		o.setDirection(move);
	}
	
	if (this.keyboard.isKeyPressed(32)) {
		
		var p = new horde.Object();
		p.ownerId = o.id;
		p.team = o.team;
		p.speed = 400;
		p.size.width = 16;
		p.size.height = 16;
		p.color = "rgb(200, 200, 200)";
		p.centerOn(o.boundingBox().center());		
		p.setDirection(o.facing);
		this.addObject(p);
		
	}
	
	this.keyboard.storeKeyStates();
	
};

horde.Engine.prototype.render = function () {
	var ctx = this.canvases["display"].getContext("2d");

	// TODO: remove this once we have a map
	ctx.fillStyle = "rgb(0,0,0)";
	ctx.fillRect(0, 0, this.view.width, this.view.height);
	
	var hpWidth = 300;
	
	var o = this.objects["o1"];
	
	// draw objects
	this.drawObjects(ctx);
	
	ctx.save();
	//ctx.globalAlpha = 0.5;
	ctx.fillStyle = "rgb(255, 0, 0)";
	ctx.strokeStyle = "rgb(255, 255, 255)";
	ctx.lineWidth = 2;
	ctx.fillRect(10, 10, hpWidth - Math.round((hpWidth * o.wounds) / o.hitPoints), 30);
	ctx.strokeRect(10, 10, hpWidth, 30);
	ctx.restore();

};

horde.Engine.prototype.drawObjects = function (ctx) {
	for (var id in this.objects) {
		var o = this.objects[id];
		ctx.fillStyle = o.color;
		ctx.fillRect(parseInt(o.position.x), parseInt(o.position.y), o.size.width, o.size.height);
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
