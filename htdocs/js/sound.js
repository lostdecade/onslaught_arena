(function define_horde_sound () {

horde.sound = {};

// TODO: Fallback to HTML5 (lolz!)
var api = "sm2";
var format = ".mp3";
var muted = false;
var sounds = {};

horde.sound.init = function horde_sound_init (callback) {

	switch (api) {
		case "sm2":
			soundManager.useFastPolling = true;
			soundManager.useHighPerformance = true;
			soundManager.autoLoad = true;
			soundManager.multiShot = true;
			soundManager.volume = 100;
			soundManager.onload = callback;
			soundManager.useHTML5Audio = false;
			break;
		case "html5":
			var audio = document.createElement("audio");

			if (audio.canPlayType) {
				//audio.canPlayType('audio/ogg; codecs="vorbis"');
				if (!audio.canPlayType("audio/mpeg;")) {
					format = ".ogg";
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
		case "sm2":
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
			soundManager.createSound(params);
			break;
		case "html5":
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
		case "sm2":
			var sound = soundManager.getSoundById(id);
			if (sound) {
				return (sound.playState === 1);
			}
			return false;
		case "html5":
			return (sounds[id].currentTime > 0);
	}
};

horde.sound.play = function horde_sound_play (id) {
	if (muted) {
		return false;
	}
	switch (api) {
		case "sm2":
			soundManager.play(id);
			break;
		case "html5":
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
		case "sm2":
			soundManager.stop(id);
			break;
		case "html5":
			sounds[id].pause();
			sounds[id].currentTime = 0;
			break;
	}
};

horde.sound.stopAll = function horde_sound_stopAll () {
	switch (api) {
		case "sm2":
			soundManager.stopAll();
			break;
		case "html5":
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
		case "sm2":
			soundManager.pauseAll();
			break;
		case "html5":
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
		case "sm2":
			soundManager.resumeAll();
			break;
		case "html5":
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
