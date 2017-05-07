define(
	[
		'stellarSystem/celestialBody'
	],

	function (CelestialBody) {
		var StellarSystem = function (sun) {
			sun = sun || new CelestialBody({
				name: 'Sun',
				x: 600,
				y: 300,
				size: 15,
				mass: 600,

				r: 200, g: 200, b: 100
			});

			this.celestialBodies = [sun];
		};

		StellarSystem.prototype.addCelestialBody = function (celestialBody) {
			this.celestialBodies.push(celestialBody);

			if (!celestialBody.orbitParent) {
				celestialBody.setInitialOrbit(this.celestialBodies[0]);
			}
		};

		StellarSystem.prototype.update = function (dt) {
			var i, body,
				j, planet,
				r, d,
				minD, closestPlanet,
				newParent;

			for (i = 0; i < this.celestialBodies.length; i++) {
				this.celestialBodies[i].update(dt);
			}

			for (i = 0; i < this.celestialBodies.length; i++) {
				body = this.celestialBodies[i];

				if (body.mass) {
					// Only worry about objects with negligible mass
					continue;
				}

				// Re-evaluate the current sphere of influence
				// for all massless bodies. Assume no spheres of influence
				// of objects with non-negligible mass overlap
				minD = null;
				closestPlanet = null;
				for (j = 1; j < this.celestialBodies.length; j++) {
					// j = 1 to skip sun
					planet = this.celestialBodies[j];

					if (!planet.mass) {
						// Only worry about objects with non-negligible mass
						continue;
					}

					r = planet.sphereOfInfluenceRadius();
					d = body.getLocalPosition(planet).mod();

					if (d < r) {
						if (minD === null || d < minD) {
							minD = d;
							closestPlanet = planet;
						}
					}
				}
				newParent = closestPlanet;

				if (!newParent) {
					newParent = this.celestialBodies[0]; // Sun
				}

				if (newParent !== body.orbitParent) {
					body.recalculateOrbit(newParent, true);
				}
			}
		};

		StellarSystem.prototype.draw = function (ctxBodies, ctxOrbits) {
			for (i = 0; i < this.celestialBodies.length; i++) {
				this.celestialBodies[i].draw(ctxBodies);
				if (window.debug) {
					this.celestialBodies[i].drawOrbit(ctxOrbits);
				}
			}
		};

		return StellarSystem;
	}
);