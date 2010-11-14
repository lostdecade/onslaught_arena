// Bare bones Closure Compiler externs for Sound Manager 2

var soundManager = {};

soundManager.url;
soundManager.useFastPolling;
soundManager.useHighPerformance;
soundManager.useHTML5Audio;
soundManager.autoLoad;
soundManager.multiShot;
soundManager.volume;
soundManager.onload;
soundManager.onerror;

soundManager.createSound = function () {};

/**
 * @return {SMSound}
 */
soundManager.getSoundById = function () {};

soundManager.play = function () {};
soundManager.stop = function () {};
soundManager.stopAll = function () {};
soundManager.pauseAll = function () {};
soundManager.resumeAll = function () {};

var SMSound = {};

SMSound.playState;
