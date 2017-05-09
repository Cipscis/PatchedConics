define(
	[
		'stellarSystem/celestialBody'
	],

	function (CelestialBody) {
		var Attractor = function (options) {
			CelestialBody.call(this, options);
		};

		Attractor.prototype = Object.create(CelestialBody.prototype);
		Attractor.prototype.constructor = CelestialBody;

		return Attractor;
	}
);