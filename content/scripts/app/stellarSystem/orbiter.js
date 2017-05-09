define(
	[
		'stellarSystem/celestialBody'
	],

	function (CelestialBody) {
		var Orbiter = function (options) {
			CelestialBody.call(this, options);
		};

		Orbiter.prototype = Object.create(CelestialBody.prototype);
		Orbiter.prototype.constructor = CelestialBody;

		return Orbiter;
	}
);