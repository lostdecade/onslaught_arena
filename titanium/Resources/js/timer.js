(function define_horde_Timer () {

/**
 * General purpose timer
 * @constructor
 */
horde.Timer = function horde_Timer () {
	this.startTime = 0;
	this.endTime = null;
	this.ttl = 0;
};

var Timer = horde.Timer;
var proto = Timer.prototype;

/**
 * Returns the current time
 * @return {number} Milliseconds since epoch
 */
Timer.now = function horde_Timer_now () {
	return Date.now();
};

/**
 * Starts the timer
 * @param {number} ttl Time to live
 * @return {void}
 */
proto.start = function horde_Timer_proto_start (ttl) {
	if (ttl) {
		this.ttl = Number(ttl);
	}
	this.startTime = Timer.now();
};

/**
 * Resets the timer's start time to now (same as calling start())
 * @return {void}
 */
proto.reset = function horde_Timer_proto_reset () {
	this.start();
};

/**
 * Stops the timer
 * @return {number} Elapsed time since start in milliseconds
 */
proto.stop = function horde_Timer_proto_stop () {
	this.endTime = Timer.now();
	return this.elapsed();
};

/**
 * Returns the elapsed time since start (in milliseconds)
 * @return {number} Elapsed time since start (in milliseconds)
 */
proto.elapsed = function horde_Timer_proto_elapsed () {
	if (this.endTime !== null) {
		return this.endTime - this.startTime;
	} else {
		var now = Timer.now();
		return now - this.startTime;
	}
};

/**
 * Returns if this timer is expired or not based on it's TTL
 * @return {boolean} True if elapsed > ttl otherwise false
 */
proto.expired = function horde_Timer_proto_expired () {
	if (this.ttl > 0) {
		var elapsed = this.elapsed();
		return (elapsed > this.ttl);
	}
	return false;
};

}());
