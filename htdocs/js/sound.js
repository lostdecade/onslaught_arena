(function define_horde_sound () {

horde.sound = {};

// Supported APIs
horde.sound.API = {
	SoundManager2: 0,
	HTML5: 1
};

// TODO: Fallback to HTML5 (lolz!)
var api = horde.sound.API.SoundManager2;
var format = ".mp3";
var muted = false;
var sounds = {};

var sm = soundManager;

horde.sound.init = function horde_sound_init (callback) {

	switch (api) {
		case horde.sound.API.SoundManager2:
			sm.url = "lib/sm2/";
			sm.useFastPolling = true;
			sm.useHighPerformance = true;
			sm.autoLoad = true;
			sm.multiShot = true;
			sm.volume = 100;
			sm.onload = callback;
			sm.useHTML5Audio = false;
			sm.onerror = (function (init) {
				return function () {
					api = horde.sound.API.HTML5;
					init(callback);
				};
			}(arguments.callee));
			break;

		case horde.sound.API.HTML5:
			var audio = document.createElement("audio");
			if (audio.canPlayType) {
				if (!audio.canPlayType("audio/mpeg;")) {
					api = null;
				}
			}

			callback();
			break;
	}
};

horde.sound.create = function horde_sound_create (id, url, loops, volume) {

	loops = Boolean(loops);
	url += format;

	if (volume === undefined) {
		volume = 100;
	}

	switch (api) {
		case horde.sound.API.SoundManager2:
			var params = {
				id: id,
				url: url,
				volume: volume
			};
			if (loops) {
				params.onfinish = function () {
					this.play();
				};
			}
			var sound = sm.createSound(params);
			sound.load();
			break;
		case horde.sound.API.HTML5:
			var audio = new Audio();
			audio.preload = "auto";
			audio.src = url;
			if (loops) {
				audio.addEventListener("ended", function () {
					this.currentTime = 0;
					this.play();
				}, false);
			} else {
				audio.addEventListener("ended", function () {
					this.pause();
					this.currentTime = 0;
				}, false);
			}
			audio.load();
			audio.volume = volume / 100;
			sounds[id] = audio;
			break;
	}
};

horde.sound.isPlaying = function (id) {
	switch (api) {
		case horde.sound.API.SoundManager2:
			var sound = sm.getSoundById(id);
			if (sound) {
				return (sound.playState === 1);
			}
			return false;
		case horde.sound.API.HTML5:
			return (sounds[id].currentTime > 0);
	}
};

horde.sound.play = function horde_sound_play (id) {
	if (muted) {
		return false;
	}
	switch (api) {
		case horde.sound.API.SoundManager2:
			sm.play(id);
			break;
		case horde.sound.API.HTML5:
			try {
				sounds[id].pause();
				sounds[id].currentTime = 0;
				sounds[id].play();
			} catch (e) {}
			break;
	}
};

horde.sound.stop = function horde_sound_stop (id) {
	switch (api) {
		case horde.sound.API.SoundManager2:
			sm.stop(id);
			break;
		case horde.sound.API.HTML5:
			sounds[id].pause();
			sounds[id].currentTime = 0;
			break;
	}
};

horde.sound.stopAll = function horde_sound_stopAll () {
	switch (api) {
		case horde.sound.API.SoundManager2:
			sm.stopAll();
			break;
		case horde.sound.API.HTML5:
			try {
				for (var id in sounds) {
					sounds[id].pause();
					sounds[id].currentTime = 0;
				}
			} catch (e) {
				console.log("[ERROR horde.sound.stopAll]", e);
			}
			break;
	}
};

horde.sound.pauseAll = function horde_sound_pauseAll () {
	switch (api) {
		case horde.sound.API.SoundManager2:
			sm.pauseAll();
			break;
		case horde.sound.API.HTML5:
			for (var id in sounds) {
				if (sounds[id].currentTime > 0) {
					sounds[id].pause();
				}
			}
			break;
	}
};

horde.sound.resumeAll = function horde_sound_resumeAll () {
	switch (api) {
		case horde.sound.API.SoundManager2:
			sm.resumeAll();
			break;
		case horde.sound.API.HTML5:
			for (var id in sounds) {
				if (sounds[id].currentTime > 0) {
					sounds[id].play();
				}
			}
			break;
	}
};

horde.sound.toggleMuted = function horde_sound_toggleMuted () {
	horde.sound.setMuted(!horde.sound.isMuted());
};

horde.sound.isMuted = function horde_sound_isMuted () {
	return muted;
};

horde.sound.setMuted = function horde_sound_setMuted (muteSound) {
	if (muted === muteSound) {
		return;
	}
	muted = muteSound;
	if (muted) {
		horde.sound.pauseAll();
	} else {
		horde.sound.resumeAll();
	}
};

}());
