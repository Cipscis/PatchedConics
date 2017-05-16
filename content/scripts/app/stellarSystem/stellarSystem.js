define(
	[
		'stellarSystem/attractor',
		'stellarSystem/orbiter'
	],

	function (Attractor, Orbiter) {
		var pathConfig = {
			pathLength: 360,
			stepSize: 30 / 360
		};

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

			this.t = 0;

			this.initPaths();
		};

		StellarSystem.prototype.addCelestialBody = function (celestialBody) {
			if (celestialBody instanceof Attractor) {
				this.attractors.push(celestialBody);
				this.predictPath(celestialBody);
			} else if (celestialBody instanceof Orbiter) {
				this.orbiters.push(celestialBody);
				this.predictPath(celestialBody);
			} else {
				console.error('Tried to add an aobject to StellarSystem that is neither an attractor nor an orbiter', celestialBody);
			}

			if (!(celestialBody.orbit && celestialBody.orbit.attractor)) {
				celestialBody.setInitialOrbit(this.attractors[0]);
			}
		};

		StellarSystem.prototype.update = function (dt) {
			var i, orbiter,
				newAttractor;

			this.t += dt;

			// Do update step for all attractors
			for (i = 0; i < this.attractors.length; i++) {
				this.attractors[i].update(this.t);
			}

			// Do update step for all orbiters
			for (i = 0; i < this.orbiters.length; i++) {
				this.orbiters[i].update(this.t);
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
					orbiter.setNewOrbit(newAttractor, this.t);
				}
			}

			this.updatePaths(dt);
		};

		// TODO: Allow this to work based on a time predicted in the paths
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

					if (this.attractors[i].orbit) {
						this.drawPath(this.attractors[i], ctxOrbits);
					}
				}
			}

			// Draw orbiters
			for (i = 0; i < this.orbiters.length; i++) {
				this.orbiters[i].draw(ctxBodies);
				if (window.debug) {
					this.orbiters[i].drawOrbit(ctxOrbits);
					this.drawPath(this.orbiters[i], ctxOrbits);
				}
			}
		};

		// PATH PREDICTION //
		StellarSystem.prototype.initPaths = function () {
			var i,
				times = [];

			// Create time steps
			for (i = 0; i < pathConfig.pathLength; i++) {
				times.push(this.t + pathConfig.stepSize * i);
			}

			this.paths = [];
			for (i = 0; i < times.length; i++) {
				this.paths.push({
					time: times[i],
					paths: []
				});
			}
		};

		StellarSystem.prototype.createPathPoint = function (cb, time) {
			return {
				coords: time === this.t ? cb.coords : cb.getOrbitalState(time).coords,
				cb: cb,
				orbit: cb.orbit
			};
		};

		StellarSystem.prototype.predictPath = function (cb) {
			var i,
				cbIndex,
				time,
				pathPoint;

			// Fetch index for this cb, if it exists
			for (i = 0; i < this.paths[0].paths.length; i++) {
				if (this.paths[0].paths[i].cb === cb) {
					cbIndex = i;
					break;
				}
			}

			for (i = 0; i < this.paths.length; i++) {
				time = this.paths[i].time;

				// TODO: If cb is an Orbiter, check for orbit changes
				pathPoint = this.createPathPoint(cb, time);

				// Either update or create this object's path
				if (cbIndex) {
					this.paths[i].paths[cbIndex] = pathPoint;
				} else {
					this.paths[i].paths.push(pathPoint);
				}
			}
		};

		StellarSystem.prototype.drawPath = function (cb, ctx) {
			var i,
				pathIndex,

				timeStep,
				coords,
				parent,
				parentIndex,

				lineStarted;

			ctx.save();
			ctx.beginPath();

			// Central body doesn't have a path, so add its coords to everything first
			ctx.translate(this.attractors[0].coords.x, this.attractors[0].coords.y);

			// Fetch this object's index in the paths
			for (i = 0; i < this.paths[0].paths.length; i++) {
				if (this.paths[0].paths[i].cb === cb) {
					pathIndex = i;
					break;
				}
			}

			// Step through times
			for (i = 0; i < this.paths.length; i++) {
				timeStep = this.paths[i].paths;

				coords = timeStep[pathIndex].coords;

				// Convert to global coordinates
				parent = cb;
				while (parent.orbit && (parent.orbit.attractor !== this.attractors[0])) {
					parent = parent.orbit.attractor;

					// Fetch parent's coords from this time step
					for (parentIndex = 0; parentIndex < timeStep.length; parentIndex++) {
						if (timeStep[parentIndex].cb === parent) {
							break;
						}
					}

					coords = coords.add(timeStep[parentIndex].coords);
				}

				if (lineStarted) {
					ctx.lineTo(coords.x, coords.y);
				} else {
					lineStarted = true;
					ctx.moveTo(coords.x, coords.y);
				}
			}

			ctx.strokeStyle = 'rgba(' + cb.r + ', ' + cb.g + ', ' + cb.b + ', 1)';
			ctx.lineWidth = 2;

			ctx.stroke();

			ctx.restore();
		};

		StellarSystem.prototype.updatePaths = function () {
			var i,
				j,
				time,
				cb;

			// Trim start of paths
			for (i = 0; i < this.paths.length; i++) {
				if (this.paths[i].time > this.t) {
					// Remove any points before this;
					this.paths = this.paths.splice(i-1);

					// Turn first point in path into current position
					for (j = 0; j < this.paths[0].paths.length; j++) {
						cb = this.paths[0].paths[j].cb;
						this.paths[0].paths[j] = this.createPathPoint(cb, this.t);
					}

					break;
				}
			}

			// Add new points to the end
			// TODO: Make the end smooth by updating it each time step as well
			while (this.paths.length < pathConfig.pathLength) {
				time = this.paths[this.paths.length-1].time + pathConfig.stepSize;

				this.paths.push({
					time: time,
					paths: []
				});

				for (j = 0; j < this.paths[0].paths.length; j++) {
					cb = this.paths[0].paths[j].cb;

					this.paths[this.paths.length-1].paths.push(this.createPathPoint(cb, time));
				}
			}
		};

		// TODO: Update orbiters' predicted paths when their orbit changes

		// TODO: Allow path prediction to take future orbital changes into account
		// This will require re-predicting every orbiter's path whenever an attractor
		// is added to the system

		return StellarSystem;
	}
);