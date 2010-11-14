horde.isDemo = function () {
	return false;
};

horde.populateWaves = function (engine) {

	// FULL GAME WAVES

	// Wave 1: Level 1
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, horde.objectTypes.bat, 1);
	w.addObjects(1, horde.objectTypes.bat, 1);
	w.addObjects(2, horde.objectTypes.bat, 1);
	engine.waves.push(w);

	// Wave 2
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, horde.objectTypes.goblin, 2);
	w.addObjects(1, horde.objectTypes.goblin, 2);
	w.addObjects(2, horde.objectTypes.goblin, 2);
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
	w.addSpawnPoint(0, 200);
	w.addSpawnPoint(1, 200);
	w.addSpawnPoint(2, 200);
	w.addObjects(0, horde.objectTypes.bat, 10);
	w.addObjects(1, horde.objectTypes.bat, 10);
	w.addObjects(2, horde.objectTypes.bat, 10);
	engine.waves.push(w);
	
	// Wave 7
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, horde.objectTypes.demoblin, 3);
	w.addObjects(1, horde.objectTypes.cyclops, 1);
	w.addObjects(1, horde.objectTypes.goblin, 5);
	w.addObjects(2, horde.objectTypes.demoblin, 3);
	engine.waves.push(w);

	// Wave 8
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 5000);
	w.addSpawnPoint(1, 1500);
	w.addSpawnPoint(2, 5000);
	w.addObjects(0, horde.objectTypes.imp, 5);
	w.addObjects(1, horde.objectTypes.imp, 10);
	w.addObjects(2, horde.objectTypes.imp, 5);
	engine.waves.push(w);

	// Wave 9
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 750);
	w.addSpawnPoint(1, 750);
	w.addSpawnPoint(2, 750);
	w.addObjects(0, horde.objectTypes.cyclops, 1);
	w.addObjects(2, horde.objectTypes.cyclops, 1);
	w.addObjects(0, horde.objectTypes.bat, 10);
	w.addObjects(1, horde.objectTypes.bat, 10);
	w.addObjects(2, horde.objectTypes.bat, 10);
	engine.waves.push(w);

	// Wave 10: Gelatinous Cube
	var w = new horde.SpawnWave();
	w.addSpawnPoint(1, 1000);
	w.addObjects(1, horde.objectTypes.cube, 1);
	w.bossWave = true;
	w.bossName = "Gelatinous Cube";
	engine.waves.push(w);

	// Wave 11: Level 2
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 20000);
	w.addSpawnPoint(1, 20000);
	w.addSpawnPoint(2, 20000);
	w.addObjects(0, horde.objectTypes.sandworm, 2);
	w.addObjects(1, horde.objectTypes.sandworm, 2);
	w.addObjects(2, horde.objectTypes.sandworm, 2);
	engine.waves.push(w);

	// Wave 12
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 10000);
	w.addSpawnPoint(1, 10000);
	w.addSpawnPoint(2, 10000);
	w.addObjects(0, horde.objectTypes.wizard, 2);
	w.addObjects(1, horde.objectTypes.wizard, 2);
	w.addObjects(2, horde.objectTypes.wizard, 2);
	engine.waves.push(w);

	// Wave 13
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 7500);
	w.addSpawnPoint(1, 7500);
	w.addSpawnPoint(2, 7500);
	w.addObjects(0, horde.objectTypes.flaming_skull, 2);
	w.addObjects(1, horde.objectTypes.flaming_skull, 2);
	w.addObjects(2, horde.objectTypes.flaming_skull, 2);
	engine.waves.push(w);

	// Wave 14
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 15000);
	w.addSpawnPoint(1, 1500);
	w.addSpawnPoint(2, 15000);
	w.addObjects(0, horde.objectTypes.owlbear, 1);
	w.addObjects(2, horde.objectTypes.owlbear, 1);
	engine.waves.push(w);

	// Wave 15
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, horde.objectTypes.huge_skull, 1);
	w.addObjects(1, horde.objectTypes.huge_skull, 1);
	w.addObjects(2, horde.objectTypes.huge_skull, 1);
	engine.waves.push(w);

	// Wave 16
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 500);
	w.addSpawnPoint(1, 4000);
	w.addSpawnPoint(2, 500);
	w.addObjects(0, horde.objectTypes.dire_bat, 5);
	w.addObjects(0, horde.objectTypes.hunter_goblin, 2);
	w.addObjects(0, horde.objectTypes.dire_bat, 5);
	w.addObjects(0, horde.objectTypes.hunter_goblin, 2);
	w.addObjects(1, horde.objectTypes.sandworm, 2);
	w.addObjects(2, horde.objectTypes.dire_bat, 5);
	w.addObjects(2, horde.objectTypes.hunter_goblin, 2);
	w.addObjects(2, horde.objectTypes.dire_bat, 5);
	w.addObjects(2, horde.objectTypes.hunter_goblin, 2);
	engine.waves.push(w);

	// Wave 17
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 3000);
	w.addSpawnPoint(1, 1500);
	w.addSpawnPoint(2, 3000);
	w.addObjects(0, horde.objectTypes.flaming_skull, 2);
	w.addObjects(1, horde.objectTypes.imp, 5);
	w.addObjects(1, horde.objectTypes.wizard, 3);
	w.addObjects(2, horde.objectTypes.flaming_skull, 2);
	engine.waves.push(w);

	// Wave 18
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1500);
	w.addSpawnPoint(1, 1500);
	w.addSpawnPoint(2, 1500);
	w.addObjects(0, horde.objectTypes.cyclops, 1);
	w.addObjects(0, horde.objectTypes.goblin, 5);
	w.addObjects(1, horde.objectTypes.demoblin, 3);
	w.addObjects(1, horde.objectTypes.owlbear, 1);
	w.addObjects(1, horde.objectTypes.demoblin, 5);
	w.addObjects(2, horde.objectTypes.goblin, 5);
	w.addObjects(2, horde.objectTypes.cyclops, 1);
	engine.waves.push(w);

	// Wave 19
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 3500);
	w.addSpawnPoint(1, 4000);
	w.addSpawnPoint(2, 5000);
	w.addObjects(0, horde.objectTypes.wizard, 5);
	w.addObjects(1, horde.objectTypes.imp, 5);
	w.addObjects(1, horde.objectTypes.owlbear, 1);
	w.addObjects(2, horde.objectTypes.sandworm, 3);
	engine.waves.push(w);

	// Wave 20: Minotaur
	var w = new horde.SpawnWave();
	w.addSpawnPoint(1, 1000);
	w.addObjects(1, horde.objectTypes.superclops, 1);
	w.bossWave = true;
	w.bossName = "Minotaur"
	engine.waves.push(w);
	
	// Wave 21: Level 3
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 100);
	w.addSpawnPoint(1, 100);
	w.addSpawnPoint(2, 100);
	w.addObjects(0, horde.objectTypes.bat, 15);
	w.addObjects(1, horde.objectTypes.dire_bat, 15);
	w.addObjects(2, horde.objectTypes.bat, 15);
	engine.waves.push(w);

	// Wave 22
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1500);
	w.addSpawnPoint(1, 1500);
	w.addSpawnPoint(2, 1500);
	w.addObjects(0, horde.objectTypes.goblin, 15);
	w.addObjects(1, horde.objectTypes.hunter_goblin, 15);
	w.addObjects(2, horde.objectTypes.goblin, 15);
	engine.waves.push(w);

	// Wave 23
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 2000);
	w.addSpawnPoint(1, 2000);
	w.addSpawnPoint(2, 2000);
	w.addObjects(0, horde.objectTypes.demoblin, 12);
	w.addObjects(1, horde.objectTypes.demoblin, 12);
	w.addObjects(2, horde.objectTypes.demoblin, 12);
	engine.waves.push(w);

	// Wave 24
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 25000);
	w.addSpawnPoint(1, 25000);
	w.addSpawnPoint(2, 25000);
	w.addObjects(0, horde.objectTypes.cyclops, 2);
	w.addObjects(1, horde.objectTypes.cyclops, 2);
	w.addObjects(2, horde.objectTypes.cyclops, 2);
	engine.waves.push(w);
	
	// Wave 25
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 3000);
	w.addSpawnPoint(1, 3000);
	w.addSpawnPoint(2, 3000);
	w.addObjects(0, horde.objectTypes.imp, 10);
	w.addObjects(1, horde.objectTypes.imp, 10);
	w.addObjects(2, horde.objectTypes.imp, 10);
	engine.waves.push(w);
	
	// Wave 26
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 25000);
	w.addSpawnPoint(1, 25000);
	w.addSpawnPoint(2, 25000);
	w.addObjects(0, horde.objectTypes.owlbear, 2);
	w.addObjects(1, horde.objectTypes.owlbear, 2);
	w.addObjects(2, horde.objectTypes.owlbear, 2);
	engine.waves.push(w);
	
	// Wave 27
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 12000);
	w.addSpawnPoint(1, 12000);
	w.addSpawnPoint(2, 12000);
	w.addObjects(0, horde.objectTypes.wizard, 4);
	w.addObjects(1, horde.objectTypes.wizard, 4);
	w.addObjects(2, horde.objectTypes.wizard, 4);
	engine.waves.push(w);
	
	// Wave 28
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 15000);
	w.addSpawnPoint(1, 20000);
	w.addSpawnPoint(2, 15000);
	w.addObjects(0, horde.objectTypes.flaming_skull, 5);
	w.addObjects(1, horde.objectTypes.huge_skull, 3);
	w.addObjects(2, horde.objectTypes.flaming_skull, 5);
	engine.waves.push(w);
	
	// Wave 29
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 15000);
	w.addSpawnPoint(1, 15000);
	w.addSpawnPoint(2, 15000);
	w.addObjects(0, horde.objectTypes.sandworm, 5);
	w.addObjects(1, horde.objectTypes.sandworm, 5);
	w.addObjects(2, horde.objectTypes.sandworm, 5);
	engine.waves.push(w);
	
	// Wave 30: Green Dragon
	var w = new horde.SpawnWave();
	w.addSpawnPoint(1, 1000);
	w.addObjects(1, horde.objectTypes.dragon, 1);
	w.bossWave = true;
	w.bossName = "Green Dragon"
	engine.waves.push(w);

	// Wave 31: Level 4
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 3500);
	w.addSpawnPoint(1, 3500);
	w.addSpawnPoint(2, 3500);
	w.addObjects(0, horde.objectTypes.goblin, 25);
	w.addObjects(1, horde.objectTypes.demoblin, 25);
	w.addObjects(2, horde.objectTypes.hunter_goblin, 25);
	engine.waves.push(w);

	// Wave 32
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 7500);
	w.addSpawnPoint(1, 5000);
	w.addSpawnPoint(2, 7500);
	w.addObjects(0, horde.objectTypes.sandworm, 2);
	w.addObjects(0, horde.objectTypes.wizard, 3);
	w.addObjects(1, horde.objectTypes.imp, 10);
	w.addObjects(2, horde.objectTypes.sandworm, 2);
	w.addObjects(2, horde.objectTypes.wizard, 3);
	engine.waves.push(w);

	// Wave 33
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 15000);
	w.addSpawnPoint(1, 7500);
	w.addSpawnPoint(2, 15000);
	w.addObjects(0, horde.objectTypes.owlbear, 3);
	w.addObjects(1, horde.objectTypes.flaming_skull, 6);
	w.addObjects(2, horde.objectTypes.owlbear, 3);
	engine.waves.push(w);

	// Wave 34
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 2500);
	w.addSpawnPoint(1, 15000);
	w.addSpawnPoint(2, 2500);
	w.addObjects(0, horde.objectTypes.demoblin, 10);
	w.addObjects(0, horde.objectTypes.goblin, 10);
	w.addObjects(1, horde.objectTypes.cyclops, 1);
	w.addObjects(1, horde.objectTypes.owlbear, 1);
	w.addObjects(1, horde.objectTypes.cyclops, 1);
	w.addObjects(1, horde.objectTypes.owlbear, 1);
	w.addObjects(2, horde.objectTypes.demoblin, 10);
	w.addObjects(2, horde.objectTypes.goblin, 10);
	engine.waves.push(w);

	// Wave 35
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 12500);
	w.addSpawnPoint(1, 20000);
	w.addSpawnPoint(2, 12500);
	w.addObjects(0, horde.objectTypes.sandworm, 5);
	w.addObjects(1, horde.objectTypes.huge_skull, 1);
	w.addObjects(1, horde.objectTypes.owlbear, 1);
	w.addObjects(1, horde.objectTypes.cyclops, 1);
	w.addObjects(1, horde.objectTypes.huge_skull, 1);
	w.addObjects(2, horde.objectTypes.sandworm, 5);
	engine.waves.push(w);

	// Wave 36
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 20000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 20000);
	w.addObjects(0, horde.objectTypes.cyclops, 1);
	w.addObjects(0, horde.objectTypes.flaming_skull, 1);
	w.addObjects(1, horde.objectTypes.wizard, 8);
	w.addObjects(2, horde.objectTypes.cyclops, 1);
	w.addObjects(2, horde.objectTypes.flaming_skull, 1);
	engine.waves.push(w);

	// Wave 37
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 4000);
	w.addSpawnPoint(1, 10000);
	w.addSpawnPoint(2, 4000);
	w.addObjects(0, horde.objectTypes.demoblin, 8);
	w.addObjects(1, horde.objectTypes.owlbear, 2);
	w.addObjects(2, horde.objectTypes.demoblin, 8);
	engine.waves.push(w);

	// Wave 38
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 5000);
	w.addSpawnPoint(1, 7500);
	w.addSpawnPoint(2, 5000);
	w.addObjects(0, horde.objectTypes.sandworm, 1);
	w.addObjects(0, horde.objectTypes.wizard, 3);
	w.addObjects(1, horde.objectTypes.flaming_skull, 4);
	w.addObjects(1, horde.objectTypes.huge_skull, 1);
	w.addObjects(2, horde.objectTypes.sandworm, 1);
	w.addObjects(2, horde.objectTypes.wizard, 3);
	engine.waves.push(w);
	
	// Wave 39
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 2000);
	w.addSpawnPoint(1, 2500);
	w.addSpawnPoint(2, 2000);
	w.addObjects(0, horde.objectTypes.goblin, 30);
	w.addObjects(1, horde.objectTypes.demoblin, 25);
	w.addObjects(2, horde.objectTypes.hunter_goblin, 30);
	engine.waves.push(w);

	// Wave 40: Beholder
	var w = new horde.SpawnWave();
	w.addSpawnPoint(1, 1000);
	w.addObjects(1, horde.objectTypes.beholder, 1);
	w.bossWave = true;
	w.bossName = "Beholder"
	engine.waves.push(w);
	
	// Wave 41: Level 5
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 3000);
	w.addSpawnPoint(1, 3000);
	w.addSpawnPoint(2, 3000);
	w.addObjects(0, horde.objectTypes.cyclops, 2);
	w.addObjects(1, horde.objectTypes.owlbear, 2);
	w.addObjects(2, horde.objectTypes.cyclops, 2);
	engine.waves.push(w);

	// Wave 42
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, horde.objectTypes.wizard, 3);
	w.addObjects(0, horde.objectTypes.flaming_skull, 1);
	w.addObjects(1, horde.objectTypes.wizard, 3);
	w.addObjects(1, horde.objectTypes.huge_skull, 1);
	w.addObjects(2, horde.objectTypes.wizard, 3);
	w.addObjects(2, horde.objectTypes.flaming_skull, 1);
	engine.waves.push(w);

	// Wave 43
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 3000);
	w.addSpawnPoint(1, 3000);
	w.addSpawnPoint(2, 3000);
	w.addObjects(0, horde.objectTypes.sandworm, 3);
	w.addObjects(0, horde.objectTypes.owlbear, 1);
	w.addObjects(1, horde.objectTypes.sandworm, 3);
	w.addObjects(1, horde.objectTypes.huge_skull, 1);
	w.addObjects(2, horde.objectTypes.sandworm, 3);
	w.addObjects(2, horde.objectTypes.cyclops, 1);
	engine.waves.push(w);

	// Wave 44
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 200);
	w.addSpawnPoint(1, 200);
	w.addSpawnPoint(2, 200);
	w.addObjects(0, horde.objectTypes.dire_bat, 20);
	w.addObjects(0, horde.objectTypes.wizard, 2);
	w.addObjects(0, horde.objectTypes.cyclops, 1);
	w.addObjects(1, horde.objectTypes.dire_bat, 20);
	w.addObjects(1, horde.objectTypes.sandworm, 2);
	w.addObjects(1, horde.objectTypes.owlbear, 1);
	w.addObjects(2, horde.objectTypes.dire_bat, 20);
	w.addObjects(2, horde.objectTypes.wizard, 2);
	w.addObjects(2, horde.objectTypes.cyclops, 1);
	engine.waves.push(w);

	// Wave 45
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 3000);
	w.addSpawnPoint(1, 3000);
	w.addSpawnPoint(2, 3000);
	w.addObjects(0, horde.objectTypes.goblin, 10);
	w.addObjects(0, horde.objectTypes.cyclops, 1);
	w.addObjects(0, horde.objectTypes.wizard, 3);
	w.addObjects(1, horde.objectTypes.demoblin, 10);
	w.addObjects(1, horde.objectTypes.huge_skull, 1);
	w.addObjects(1, horde.objectTypes.sandworm, 3);
	w.addObjects(2, horde.objectTypes.hunter_goblin, 10);
	w.addObjects(2, horde.objectTypes.owlbear, 1);
	w.addObjects(2, horde.objectTypes.flaming_skull, 3);
	engine.waves.push(w);

	// Wave 46
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 2500);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 2500);
	w.addObjects(0, horde.objectTypes.wizard, 4);
	w.addObjects(1, horde.objectTypes.cube, 1);
	w.addObjects(2, horde.objectTypes.wizard, 4);
	engine.waves.push(w);

	// Wave 47
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, horde.objectTypes.demoblin, 5);
	w.addObjects(1, horde.objectTypes.superclops, 1);
	w.addObjects(1, horde.objectTypes.demoblin, 4);
	w.addObjects(2, horde.objectTypes.demoblin, 5);
	engine.waves.push(w);

	// Wave 48
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 30000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 30000);
	w.addObjects(0, horde.objectTypes.sandworm, 1);
	w.addObjects(0, horde.objectTypes.owlbear, 1);
	w.addObjects(1, horde.objectTypes.dragon, 1);
	w.addObjects(2, horde.objectTypes.sandworm, 1);
	w.addObjects(2, horde.objectTypes.owlbear, 1);
	engine.waves.push(w);

	// Wave 49
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 15000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 15000);
	w.addObjects(0, horde.objectTypes.wizard, 1);
	w.addObjects(0, horde.objectTypes.cyclops, 1);
	w.addObjects(1, horde.objectTypes.beholder, 1);
	w.addObjects(2, horde.objectTypes.wizard, 1);
	w.addObjects(2, horde.objectTypes.cyclops, 1);
	engine.waves.push(w);

	// Wave 50: Doppelganger
	var w = new horde.SpawnWave();
	w.addSpawnPoint(1, 1000);
	w.addObjects(1, horde.objectTypes.doppelganger, 1);
	w.bossWave = true;
	w.bossName = "Doppelganger"
	engine.waves.push(w);
	
};
