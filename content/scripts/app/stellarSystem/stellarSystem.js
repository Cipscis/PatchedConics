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

				newAttractor = this.getAttractor(orbiter);

				if (newAttractor !== orbiter.orbit.attractor) {
					orbiter.setNewOrbit(newAttractor);
				}
			}

			if (window.debugPathCB) {
				this.path = this.predictPath(debugPathCB, 31.5, true);
			}
		};

		StellarSystem.prototype.getAttractor = function (orbiter) {
			// Evaluate interaction between attractors and orbiters
			// TODO: At high speeds, interaction during the time step can
			// result in inaccuracies. Could interpolate to find when the
			// interaction should have happened and recalculate new orbit

			var i, attractor,
				r, d,
				minD = null,
				closestAttractor, newAttractor;

			for (i = 1; i < this.attractors.length; i++) {
				// i = 1 to skip sun
				attractor = this.attractors[i];

				r = attractor.sphereOfInfluenceRadius();
				d = orbiter.getLocalPosition(attractor).mod();

				if (d < r) {
					if (minD === null || d < minD) {
						minD = d;
						closestAttractor = attractor;
					}
				}
			}

			// Sun by default
			newAttractor = closestAttractor || this.attractors[0];

			return newAttractor;
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
				for (i = 1; i < this.path.length; i++) {
					ctxOrbits.lineTo(this.path[i].x, this.path[i].y);
				}
				ctxOrbits.strokeStyle = 'rgba(200, 100, 0, 1)';
				ctxOrbits.lineWidth = 2;
				ctxOrbits.stroke();

				ctxOrbits.restore();
			}
		};

		StellarSystem.prototype.predictPath = function (cb, time) {
			// Predicts the path of CelestialBody cb, for
			// duration passed as time in seconds, and returns
			// an array of coordinates relative to the main
			// body of the system, that can be drawn

			var originalParams,
				attractorOriginalParams,

				params, coords,
				path = [],

				times = [],
				timeSteps = 360,

				attractor,

				i, j;

			// TODO: If cb is an Orbiter, check for orbit changes

			if (cb.orbit) {

				// Create time steps
				for (i = 0; i < timeSteps; i++) {
					times.push(i * time / timeSteps);
				}

				// Predict future path
				for (i = 0; i < times.length; i++) {
					time = times[i];

					params = cb.progressOrbit(time);
					coords = params.coords;

					// Transform to global coordinate system
					attractor = cb;
					while (attractor.orbit) {
						attractor = attractor.orbit.attractor;

						params = attractor.progressOrbit(time);
						coords = coords.add(params.coords);
					}

					path.push(coords);
				}

			}

			return path;
		};

		return StellarSystem;
	}
);