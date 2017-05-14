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
			this.attractorPaths = [];

			this.orbiters = [];
			this.orbiterPaths = [];

			this.t = 0;
		};

		StellarSystem.prototype.addCelestialBody = function (celestialBody) {
			if (celestialBody instanceof Attractor) {
				this.attractors.push(celestialBody);
				this.attractorPaths.push(this.predictPath(celestialBody));
			} else if (celestialBody instanceof Orbiter) {
				this.orbiters.push(celestialBody);
				this.orbiterPaths.push(this.predictPath(celestialBody));
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

		StellarSystem.prototype.getPath = function (cb) {
			var path,
				findPath;

			findPath = function (body) {
				return function (obj) {
					return obj.celestialBody === body;
				};
			};

			if (cb instanceof Attractor) {
				path = this.attractorPaths.filter(findPath(cb));
			} else if (cb instanceof Orbiter) {
				path = this.orbiterPaths.filter(findPath(cb));
			} else {
				console.error(cb.name + ' is neither an Attractor nor an Orbiter');
				return;
			}

			if (path.length === 1) {
				path = path[0];
			} else {
				console.error('Expected to find 1 path for ' + cb.name + ', but found ' + path.length);
				return;
			}

			return path;
		};

		StellarSystem.prototype.getPathAtTime = function (path, time) {
			var point,
				findPointAtTime;

			findPointAtTime = function (time) {
				return function (obj) {
					return obj.time === time;
				};
			};

			point = path.points.filter(findPointAtTime(time));

			if (point.length === 1) {
				point = point[0];
			} else {
				console.warn('Expected to find 1 point for ' + path.celestialBody.name + ' at time ' + time + ', but found ' + point.length);
				return;
			}

			return point;
		};

		StellarSystem.prototype.drawPath = function (cb, ctx) {
			var path,
				findPath,

				time, i,

				globalPoints = [],
				parent,
				parentPaths = [],

				parentPath, j,
				parentPoint;

			path = this.getPath(cb);

			// Find parent paths
			if (cb.orbit) {
				parent = cb.orbit.attractor;
				while (parent.orbit) {
					parentPaths.push(this.getPath(parent));
					parent = parent.orbit.attractor;
				}
			}

			ctx.save();
			ctx.beginPath();

			ctx.translate(this.attractors[0].coords.x, this.attractors[0].coords.y);
			for (i = 0; i < path.points.length; i++) {
				globalPoints.push(path.points[i].coords);
				time = path.points[i].time;

				// Convert to global coordinates
				for (j = 0; j < parentPaths.length; j++) {
					parentPath = parentPaths[j];
					parentPoint = this.getPathAtTime(parentPath, time);

					globalPoints[i] = globalPoints[i].add(parentPoint.coords);
				}

				if (i === 0) {
					ctx.moveTo(globalPoints[i].x, globalPoints[i].y);
				} else {
					ctx.lineTo(globalPoints[i].x, globalPoints[i].y);
				}
			}

			ctx.strokeStyle = 'rgba(' + path.celestialBody.r + ', ' + path.celestialBody.g + ', ' + path.celestialBody.b + ', 1)';
			ctx.lineWidth = 2;
			ctx.stroke();

			ctx.restore();
		};

		StellarSystem.prototype.predictPath = function (cb) {
			// Predicts the path of CelestialBody cb, for
			// stepSize passed as time in seconds, and returns
			// an array of coordinates relative to the main
			// body of the system, that can be drawn

			var originalParams,
				attractorOriginalParams,

				params, coords,
				points = [],

				time,
				times = [],

				attractor,

				i, j,

				path;

			// TODO: If cb is an Orbiter, check for orbit changes

			if (cb.orbit) {

				// Create time steps
				for (i = 0; i < pathConfig.pathLength; i++) {
					times.push(this.t + (i * pathConfig.stepSize));
				}

				// Predict future path
				for (i = 0; i < times.length; i++) {
					time = times[i];

					params = cb.getOrbitalState(time);
					coords = params.coords;

					points.push({
						time: time,
						coords: coords
					});
				}

			}

			path = {
				celestialBody: cb,
				points: points
			};

			return path;
		};

		StellarSystem.prototype.updatePaths = function (dt) {
			var allPaths,
				i, path,
				j, time;

			allPaths = this.orbiterPaths.concat(this.attractorPaths);

			for (i = 0; i < allPaths.length; i++) {
				path = allPaths[i];

				// Cut off paths earlier than new time
				for (j = 0; j < path.points.length; j++) {
					time = path.points[j].time;
					if (time >= this.t) {

						// Remove all before this
						path.points = path.points.splice(j-1);

						// Turn first point in path into current position
						path.points[0].coords = path.celestialBody.coords;

						break;
					}
				}

				// Add new points to the end
				// TODO: Make final point smooth
				while (path.points.length < pathConfig.pathLength) {
					// We removed a point, so add a new one to keep
					// the path the same length

					time = path.points[path.points.length-1].time + pathConfig.stepSize;

					path.points.push({
						time: time,
						coords: path.celestialBody.getOrbitalState(time).coords
					});
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