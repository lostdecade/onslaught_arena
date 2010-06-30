(function define_horde_SpawnPoint () {

horde.SpawnPoint = function horde_SpawnPoint (top, left, width, height) {
	this.delay = 500; // Default delay between spawns
	this.lastSpawnElapsed = this.delay; // Milliseconds since last spawn
	this.location = new horde.Rect(top, left, width, height);
	this.queue = [];
};

var proto = horde.SpawnPoint.prototype;

proto.update = function horde_SpawnPoint_proto_update (elapsed) {
	this.lastSpawnElapsed += elapsed;
	if (this.lastSpawnElapsed >= this.delay) {
		this.lastSpawnElapsed = 0;
		if (this.queue.length < 1) {
			return false;
		}
		var type = this.queue.shift();
		var loc = this.location
		var o = horde.makeObject(type);
		o.position.x = horde.randomRange(loc.left, loc.left + loc.width - o.size.width);
		o.position.y = horde.randomRange(loc.top, loc.top + loc.height - o.size.height);
		o.setDirection(new horde.Vector2(0, 1));
		return o;
	}
	return false;
};

proto.queueSpawn = function horde_SpawnPoint_proto_queueSpawn (type, count) {
	count = Number(count) || 1;
	for (var i = 0; i < count; i++) {
		this.queue.push(type);
	}
};

}());
