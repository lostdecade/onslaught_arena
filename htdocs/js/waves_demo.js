horde.populateWaves = function (engine) {

	// DEMO WAVES

	// Wave 1: Level 1
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 5000);
	w.addSpawnPoint(1, 5000);
	w.addSpawnPoint(2, 5000);
	w.addObjects(0, "bat", 5);
	w.addObjects(1, "bat", 5);
	w.addObjects(2, "bat", 5);
	engine.waves.push(w);

	// Wave 2
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 3000);
	w.addSpawnPoint(1, 3000);
	w.addSpawnPoint(2, 3000);
	w.addObjects(0, "goblin", 5);
	w.addObjects(1, "goblin", 5);
	w.addObjects(2, "goblin", 5);
	engine.waves.push(w);

	// Wave 3
	var w = new horde.SpawnWave();
	w.addSpawnPoint(1, 1000);
	w.addObjects(1, "cyclops", 1);
	engine.waves.push(w);

	// Wave 4
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "demoblin", 2);
	w.addObjects(1, "demoblin", 3);
	w.addObjects(2, "demoblin", 2);
	engine.waves.push(w);

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
	engine.waves.push(w);
	
	// Wave 6
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 200);
	w.addSpawnPoint(1, 200);
	w.addSpawnPoint(2, 200);
	w.addObjects(0, "bat", 10);
	w.addObjects(1, "bat", 10);
	w.addObjects(2, "bat", 10);
	engine.waves.push(w);
	
	// Wave 7
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "demoblin", 3);
	w.addObjects(1, "cyclops", 1);
	w.addObjects(1, "goblin", 5);
	w.addObjects(2, "demoblin", 3);
	engine.waves.push(w);

	// Wave 8
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 5000);
	w.addSpawnPoint(1, 1500);
	w.addSpawnPoint(2, 5000);
	w.addObjects(0, "imp", 5);
	w.addObjects(1, "imp", 10);
	w.addObjects(2, "imp", 5);
	engine.waves.push(w);

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
	engine.waves.push(w);

	// Wave 10: Gelatinous Cube
	var w = new horde.SpawnWave();
	w.addSpawnPoint(1, 1000);
	w.addObjects(1, "cube", 1);
	w.bossWave = true;
	w.bossName = "Gelatinous Cube";
	engine.waves.push(w);
	
};
