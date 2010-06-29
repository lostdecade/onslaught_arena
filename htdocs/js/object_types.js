(function defne_horde_objectTypes () {

horde.objectTypes = {};

var o = horde.objectTypes;

o.hero = {
	role: "hero",
	team: 0,
	speed: 150,
	hitPoints: 25,
	damage: 1,
	spriteSheet: "characters",
	spriteY: 0,
	animated: true,
	weapons: [
		{type: "h_rock", count: -1}
	]
};

// HERO WEAPONS

o.h_rock = {
	role: "projectile",
	speed: 250,
	hitPoints: 1,
	damage: 1,
	spriteSheet: "objects",
	spriteX: 0,
	spriteY: 0
};

o.h_sword = {
	role: "projetile",
	speed: 250,
	hitPoints: 1,
	damage: 2
};

o.h_spear = {
	role: "projectile",
	speed: 300,
	hitPoints: 5,
	damage: 5
};

o.h_fireball = {
	role: "projectile",
	speed: 400,
	hitPoints: 1,
	damage: 1
};

// ENEMIES

o.bat = {
	role: "monster",
	team: 1,
	speed: 100,
	hitPoints: 1,
	damage: 1,
	spriteSheet: "characters",
	spriteY: 96,
	animated: true,
	animDelay: 150
};

o.goblin = {
	role: "monster",
	team: 1,
	speed: 75,
	hitPoints: 3,
	damage: 1
};

o.ogre = {
	role: "monster",
	size: new horde.Size(64, 64),
	team: 1,
	speed: 50,
	hitPoints: 10,
	damage: 5
};

// ENEMY WEAPONS

o.e_rock = {
	
};

o.e_arrow = {
	
};
	
// OTHER SHIT

o.chest = {
	
};

o.gold_chest = {
	
};
	
}());
