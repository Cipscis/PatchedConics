define(
	[
		'stellarSystem/attractor',
		'stellarSystem/orbiter'
	],

	function (Attractor, Orbiter) {
		var StellarSystem = function (sun) {
			sun = sun || new Attractor({
				name: 'Sun',
				x: 600,
				y: 300,
				size: 15,
				mass: 600,

				r: 200, g: 200, b: 100
			});

			this.attractors = [sun];
			this.orbiters = [];
		};

		StellarSystem.prototype.addCelestialBody = function (celestialBody) {
			if (celestialBody instanceof Attractor) {
				this.attractors.push(celestialBody);
			} else if (celestialBody instanceof Orbiter) {
				this.orbiters.push(celestialBody);
			} else {
				console.error('Neither an attractor nor an orbiter', celestialBody);
			}

			if (!(celestialBody.orbit && celestialBody.orbit.attractor)) {
				celestialBody.setInitialOrbit(this.attractors[0]);
			}
		};

		StellarSystem.prototype.update = function (dt) {
			var i, orbiter,
				j, attractor,
				r, d,
				minD, closestAttractor,
				newAttractor;

			// Do update step for all attractors
			for (i = 0; i < this.attractors.length; i++) {
				this.attractors[i].update(dt);
			}

			// Do update step for all orbiters
			for (i = 0; i < this.orbiters.length; i++) {
				this.orbiters[i].update(dt);
			}

			// Evaluate interaction between attractors and orbiters
			// TODO: At high speeds, interaction during the time step can
			// result in inaccuracies. Could interpolate to find when the
			// interaction should have happened and recalculate new orbit
			for (i = 0; i < this.orbiters.length; i++) {
				orbiter = this.orbiters[i];

				// Re-evaluate the current sphere of influence
				// for all orbiters. Assume no spheres of influence
				// of objects with non-negligible mass overlap

				minD = null;
				closestAttractor = null;
				for (j = 1; j < this.attractors.length; j++) {
					// j = 1 to skip sun
					attractor = this.attractors[j];

					r = attractor.sphereOfInfluenceRadius();
					d = orbiter.getLocalPosition(attractor).mod();

					if (d < r) {
						if (minD === null || d < minD) {
							minD = d;
							closestAttractor = attractor;
						}
					}
				}
				newAttractor = closestAttractor;

				if (!newAttractor) {
					newAttractor = this.attractors[0]; // Sun
				}

				if (newAttractor !== orbiter.orbit.attractor) {
					orbiter.recalculateOrbit(newAttractor);
				}
			}

			if (window.debugPathCB) {
				this.path = this.predictPath(debugPathCB, 60);
			}
		};

		StellarSystem.prototype.draw = function (ctxBodies, ctxOrbits) {
			var i;

			// Draw attractors
			for (i = 0; i < this.attractors.length; i++) {
				this.attractors[i].draw(ctxBodies);
				if (window.debug) {
					this.attractors[i].drawOrbit(ctxOrbits);
				}
			}

			// Draw orbiters
			for (i = 0; i < this.orbiters.length; i++) {
				this.orbiters[i].draw(ctxBodies);
				if (window.debug) {
					this.orbiters[i].drawOrbit(ctxOrbits);
				}
			}

			// Debug: Draw path
			if (this.path && this.path.length) {
				ctxOrbits.save();

				ctxOrbits.beginPath();
				ctxOrbits.moveTo(this.path[0].x, this.path[0].y);
				for (var i = 1; i < this.path.length; i++) {
					ctxOrbits.lineTo(this.path[i].x, this.path[i].y);
				}
				ctxOrbits.strokeStyle = '#ff0000';
				ctxOrbits.stroke();

				ctxOrbits.restore();
			}
		};

		StellarSystem.prototype.predictPath = function (cb, time, relativeTo) {
			// Predicts the path of CelestialBody cb
			// relative to Attractor relativeTo, for
			// passed time, and returns an array of
			// coordinates that can be drawn

			var params, coords,
				path = [],

				times = [],
				timeSteps = 360,

				i, j;

			// TODO: In order to be relative to a moving body, you will also need
			// to predict the path of relativeTo and all of its parents

			// Create time steps
			for (i = 0; i < timeSteps; i++) {
				times.push(i * time / timeSteps);
			}

			// Predict future path
			for (i = 0; i < times.length; i++) {
				time = times[i];

				params = cb.progressOrbit(time);
				coords = params.coords;

				// TODO: Check if the orbit will have changed

				// TODO: Convert to be relative to relativeTo

				path.push(params.coords);
			}

			return path;
		};

		return StellarSystem;
	}
);