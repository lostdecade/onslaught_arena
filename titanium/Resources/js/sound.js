(function define_horde_sound () {

horde.sound = {};

var api = "SoundManager2";
var sounds = {};
var muted = false;

horde.sound.init = function horde_sound_init (callback) {
	if (typeof(Titanium) !== "undefined") {
		api = "Titanium";
	}
	switch (api) {
		case "SoundManager2":
			var sm = soundManager;
			sm.useFastPolling = true;
			sm.useHighPerformance = true;
			sm.autoLoad = true;
			sm.multiShot = true;
			sm.volume = 100;
			sm.onload = callback;
			break;
		case "Titanium":
			callback();
			break;
	}
};

horde.sound.create = function horde_sound_create (id, url, loops, volume) {
	loops = loops || false;
	volume = Number(volume) || 100;
	switch (api) {
		case "SoundManager2":
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
		case "Titanium":
			sounds[id] = Titanium.Media.createSound("app://" + url);
			//sounds[id].setLooping(loops);
			/**
			 * Using this weaksauce looping workaround because Titanium.Media.Sound.stop()
			 * does NOT actually stop a looping sound... wtf Appcelerator!?
			 * @link http://developer.appcelerator.com/question/41791/titaniummediasoundstop-does-not-stop-looping-sounds
			 */
			if (loops) {
				sounds[id].oncomplete = function () {
					this.play();
				};
			}
			sounds[id].setVolume(0);
			sounds[id].play();
			sounds[id].stop();
			sounds[id].setVolume(volume / 100);
			break;
	}
};

horde.sound.play = function horde_sound_play (id) {
	if (muted) {
		return false;
	}
	switch (api) {
		case "SoundManager2":
			soundManager.play(id);
			break;
		case "Titanium":
			if (sounds[id].isPlaying()) {
				sounds[id].stop();
			}
			sounds[id].play();
			break;
	}
};

horde.sound.stop = function horde_sound_stop (id) {
	switch (api) {
		case "SoundManager2":
			soundManager.stop(id);
			break;
		case "Titanium":
			sounds[id].stop();
			break;
	}
};

horde.sound.stopAll = function horde_sound_stopAll () {
	switch (api) {
		case "SoundManager2":
			soundManager.stopAll();
			break;
		case "Titanium":
			for (var id in sounds) {
				sounds[id].stop();
			}
			break;
	}
};

horde.sound.pauseAll = function horde_sound_pauseAll () {
	switch (api) {
		case "SoundManager2":
			soundManager.pauseAll();
			break;
		case "Titanium":
			for (var id in sounds) {
				if (sounds[id].isPlaying()) {
					sounds[id].pause();
				}
			}
			break;
	}
};

horde.sound.resumeAll = function horde_sound_resumeAll () {
	switch (api) {
		case "SoundManager2":
			soundManager.resumeAll();
			break;
		case "Titanium":
			for (var id in sounds) {
				if (sounds[id].isPaused()) {
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
