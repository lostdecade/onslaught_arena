horde.isDemo = function () {
	return true;
};

horde.populateWaves = function (engine) {

	// DEMO WAVES

	// Wave 1: Level 1
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 5000);
	w.addSpawnPoint(1, 5000);
	w.addSpawnPoint(2, 5000);
	w.addObjects(0, horde.objectTypes.bat, 2);
	w.addObjects(1, horde.objectTypes.bat, 2);
	w.addObjects(2, horde.objectTypes.bat, 2);
	engine.waves.push(w);

	// Wave 2
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 3000);
	w.addSpawnPoint(1, 3000);
	w.addSpawnPoint(2, 3000);
	w.addObjects(0, horde.objectTypes.goblin, 5);
	w.addObjects(1, horde.objectTypes.goblin, 5);
	w.addObjects(2, horde.objectTypes.goblin, 5);
	engine.waves.push(w);

	// Wave 3
	var w = new horde.SpawnWave();
	w.addSpawnPoint(1, 1000);
	w.addObjects(1, horde.objectTypes.cyclops, 1);
	engine.waves.push(w);

	// Wave 4
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, horde.objectTypes.demoblin, 2);
	w.addObjects(1, horde.objectTypes.demoblin, 3);
	w.addObjects(2, horde.objectTypes.demoblin, 2);
	engine.waves.push(w);

	// Wave 5
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 500);
	w.addSpawnPoint(1, 750);
	w.addSpawnPoint(2, 500);
	w.addObjects(0, horde.objectTypes.bat, 5);
	w.addObjects(0, horde.objectTypes.goblin, 2);
	w.addObjects(1, horde.objectTypes.goblin, 2);
	w.addObjects(1, horde.objectTypes.cyclops, 1);
	w.addObjects(1, horde.objectTypes.goblin, 3);
	w.addObjects(2, horde.objectTypes.bat, 5);
	w.addObjects(2, horde.objectTypes.goblin, 2);
	engine.waves.push(w);

	// Wave 6
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 10000);
	w.addSpawnPoint(1, 10000);
	w.addSpawnPoint(2, 10000);
	w.addObjects(0, horde.objectTypes.wizard, 2);
	w.addObjects(1, horde.objectTypes.wizard, 2);
	w.addObjects(2, horde.objectTypes.wizard, 2);
	engine.waves.push(w);

	// Wave 7
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 5000);
	w.addSpawnPoint(1, 1500);
	w.addSpawnPoint(2, 5000);
	w.addObjects(0, horde.objectTypes.imp, 5);
	w.addObjects(1, horde.objectTypes.imp, 10);
	w.addObjects(2, horde.objectTypes.imp, 5);
	engine.waves.push(w);

	// Wave 8
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 750);
	w.addSpawnPoint(1, 750);
	w.addSpawnPoint(2, 750);
	w.addObjects(0, horde.objectTypes.cyclops, 1);
	w.addObjects(2, horde.objectTypes.cyclops, 1);
	w.addObjects(0, horde.objectTypes.dire_bat, 10);
	w.addObjects(1, horde.objectTypes.dire_bat, 10);
	w.addObjects(2, horde.objectTypes.dire_bat, 10);
	engine.waves.push(w);

	// Wave 9
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 3000);
	w.addSpawnPoint(1, 3000);
	w.addSpawnPoint(2, 3000);
	w.addObjects(0, horde.objectTypes.wizard, 1);
	w.addObjects(1, horde.objectTypes.wizard, 1);
	w.addObjects(2, horde.objectTypes.wizard, 1);
	w.addObjects(0, horde.objectTypes.imp, 2);
	w.addObjects(1, horde.objectTypes.imp, 2);
	w.addObjects(2, horde.objectTypes.imp, 2);
	w.addObjects(0, horde.objectTypes.demoblin, 4);
	w.addObjects(1, horde.objectTypes.demoblin, 3);
	w.addObjects(1, horde.objectTypes.cyclops, 1);
	w.addObjects(2, horde.objectTypes.demoblin, 4);
	engine.waves.push(w);

	// Wave 10: Minotaur
	var w = new horde.SpawnWave();
	w.addSpawnPoint(1, 1000);
	w.addObjects(1, horde.objectTypes.superclops, 1);
	w.bossWave = true;
	w.bossName = "Minotaur";
	engine.waves.push(w);

};
