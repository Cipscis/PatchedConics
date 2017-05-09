define(
	[
		'orbit/orbit',

		'vector/vector'
	],

	function (Orbit, Vector) {
		var defaults = {
			name: 'New celestial body',

			// Converted to coords (Vector)
			x: 100,
			y: 0,

			// Converted to v (Vector)
			vx: 0,
			vy: 0,

			// Colour
			r: 100,
			g: 100,
			b: 100,

			size: 50,
			mass: 50,

			// Used to create initial orbit
			attractor: undefined
		};

		var config = {
			// Gravitational constant
			// G = 6.67408 * Math.pow(10, -11); // m^3 kg^-1 s^-2
			G: 1000,

			// Number of iterations for calculating mean anomaly
			iterM: 1000
		};

		var CelestialBody = function (options) {
			options = options || {};

			for (var prop in defaults) {
				if (options.hasOwnProperty(prop)) {
					this[prop] = options[prop];
				} else {
					this[prop] = defaults[prop];
				}
			}

			this.coords = new Vector(this.x, this.y);
			delete this.x;
			delete this.y;

			this.v = new Vector(this.vx, this.vy);
			delete this.vx;
			delete this.vy;

			if (this.attractor) {
				this.orbit = new Orbit({
					orbiter: this,
					attractor: this.attractor
				});
				delete this.attractor;

				if (this.v.x || this.v.y) {
					this.recalculateOrbit(this.attractor);
				} else {
					this.setInitialOrbit(this.attractor);
				}
			}
		};

		///////////////////////////
		// COORDINATE CONVERSION //
		///////////////////////////

		// Position and velocity are stored relative to the current orbital parent
		CelestialBody.prototype.getGlobalPosition = function () {
			var coords = this.coords,
				body = this;

			while (body.orbit) {
				coords = coords.add(body.orbit.attractor.coords);
				body = body.orbit.attractor;
			}

			return coords;
		};

		CelestialBody.prototype.getGlobalVelocity = function () {
			var v = this.v,
				body = this;

			while (body.orbit) {
				v = v.add(body.orbit.attractor.v);
				body = body.orbit.attractor;
			}

			return v;
		};

		CelestialBody.prototype.getLocalPosition = function (parent) {
			parent = parent || (this.orbit && this.orbit.attractor);

			var coords;

			if (parent === (this.orbit && this.orbit.attractor)) {
				coords = this.coords;
			} else {
				coords = this.getGlobalPosition().subtract(parent.getGlobalPosition());
			}

			return coords;
		};

		CelestialBody.prototype.getLocalVelocity = function (parent) {
			parent = parent || (this.orbit && this.orbit.attractor);

			var v;

			if (parent === (this.orbit && this.orbit.attractor)) {
				v = this.v;
			} else {
				v = this.getGlobalVelocity().subtract(parent.getGlobalVelocity());
			}

			return v;
		};

		///////////////////////////
		// ORBITAL DETERMINATION //
		///////////////////////////
		CelestialBody.prototype.setInitialOrbit = function (parent) {
			// Sets an initial orbit based on a body's distance from
			// its orbital parent and orbital parameters. The body's
			// velocity will be calculated from this during update step

			parent = parent || (this.orbit && this.orbit.attractor);

			var r;

			// Distance from orbiting parent
			r = Math.sqrt(Math.pow(this.coords.x, 2) + Math.pow(this.coords.y, 2));

			this.orbit = new Orbit({
				a: r,
				b: r,

				attractor: parent,
				orbiter: this
			});

			console.warn('Manually setting orbit of ' + this.name);
		};

		CelestialBody.prototype.recalculateOrbit = function (parent) {
			// Need to determine three things:
			// 		The shape of the new orbit
			// 			Semimajor axis
			// 			Semiminor axis
			// 			Argument of periapsis

			// 		The direction of the new orbit
			// 			Clockwise or anticlockwise

			// 		The time since periapsis of the new orbit
			// 			Scalar time value

			parent = parent || (this.orbit && this.orbit.attractor);

			if (parent) {
				var u,
					coords, r,
					velocity, speed,
					a, b,
					ev, e,
					w,
					h, orbitAnticlockwise,
					f, E,
					n,
					M,
					t,

					newOrbit;

				// Standard gravitational parameter
				u = parent.mass * config.G;


				// Orbital state vectors relative to parent are known:
					// Position
					// Velocity

				// Position vector of orbiting body relative to parent
				coords = this.getLocalPosition(parent);

				// Distance between orbiting bodies
				r = coords.mod();

				// Velocity of orbiting body relative to parent
				velocity = this.getLocalVelocity(parent);

				// Speed of orbiting body relative to parent
				speed = velocity.mod();


				// SHAPE //

				// Semimajor axis of new orbit, based on
				// solving the vis-viva equation for a
				a = r*u / (2*u - r*Math.pow(speed, 2));

				// New orbit's eccentricity vector
				ev = coords.scale(Math.pow(speed, 2)/u - 1/r).subtract(velocity.scale(coords.dot(velocity)/u));

				// New orbit's eccentricity
				e = ev.mod();

				// New orbit's argument of periapsis
				w = ev.getRotation();

				// New orbit's semiminor axis, calculated from semimajor axis
				// and its eccentricity
				if (e < 1) {
					// Elliptical orbit
					b = a * Math.sqrt(1 - Math.pow(e, 2));
				} else {
					// Hyperbolic orbit
					b = -a * Math.sqrt(Math.pow(e, 2) - 1);
				}

				newOrbit = new Orbit({
					a: a,
					b: b,
					angle: w,

					attractor: parent,
					orbiter: this
				});


				// DIRECTION //

				// Angular momentum
				// This would normally be a 3D vector, but since it's
				// the cross product of two vectors in the orbital plane
				// just represent it as the remaining Z component
				h = coords.x * velocity.y - coords.y * velocity.x;

				// The sign of the angular momentum Z component determines
				// the direction of the orbit in the XY plane
				orbitAnticlockwise = h < 0;


				// TIME SINCE PERIAPSIS //

				// True anomaly
				f = coords.getRotation() - w;

				// Eccentric anomaly
				E = newOrbit.eccentricAnomaly(f);

				// Mean anomaly
				if (e < 1) {
					// Elliptical orbit
					// Kepler's equation
					M = E - e * Math.sin(E);
				} else {
					// Hyperbolic orbit
					// Hyperbolic Kepler's equation
					M = e * Math.sinh(E) - E;
				}

				if (e < 1) {
					// Elliptical orbit
					if (orbitAnticlockwise) {
						M = -M;
					}
				} else {
					// Hyperbolic orbit

					// Need to determing if it's moving towards the focus or
					// away from it, and set the sign of mean anomaly as appropriate
					var toFocus = newOrbit.foci[0].subtract(this.getGlobalPosition());
					var movingToFocus = toFocus.add(velocity);
					var movingFromFocus = toFocus.subtract(velocity);

					if (movingFromFocus.mod() < movingToFocus.mod()) {
						M = -Math.abs(M);
					} else {
						M = Math.abs(M);
					}
				}

				// Calculate time since periapsis
				n = Math.sqrt(u / Math.abs(Math.pow(a, 3)));
				t = M / n;

				// Set new orbit
				this.coords = this.getLocalPosition(parent);
				this.orbit = newOrbit;
				this.orbit.anticlockwise = orbitAnticlockwise;
				this.orbit.t = t;
			}
		};

		CelestialBody.prototype.sphereOfInfluenceRadius = function () {
			// TODO:
			// This calculation is a fine approximation for very circular
			// orbits, but for more elliptical ones it would be good to
			// implement the more accurate version. Though not sure how
			// best to check the collision on that?

			if (!this.mass) {
				return 0;
			}

			if (this.orbit.a < 0) {
				// Negative semimajor axis indicates a hyperbolic orbit
				// Spheres of influence are only calculated for massive bodies,
				// and massive bodies should never be on escape trajectories

				// console.warn('Massive body ' + this.name + ' on a hyperbolic orbit');
				// console.log(this.orbit);
				// console.trace();
				return 0;
			}

			if (this.orbit) {
				return this.orbit.a * Math.pow(this.mass / this.orbit.attractor.mass, 2/5);
			}
		};

		CelestialBody.prototype.eccentricAnomaly = function (t) {
			t = t || this.orbit.t;

			if (this.orbit) {
				var e,
					u,
					n,
					M, E,
					i;

				// Eccentricity of orbit
				e = this.orbit.e;

				// Standard gravitational parameter
				u = config.G * this.orbit.attractor.mass;

				// Mean motion
				n = Math.sqrt(u / Math.abs(Math.pow(this.orbit.a, 3)));

				// Calculate mean anomaly
				M = n * t;

				if (this.orbit.a > 0) {
					// Ellipse
					if (this.orbit.anticlockwise) {
						M = -M;
					}
				} else {
					// Hyperbolic
					if (!this.orbit.anticlockwise) {
						M = -M;
					}
				}

				// Eccentric anomaly
				// Calculated numerically from M
				E = M;
				if (e < 1) {
					// Elliptical orbit
					for (i = 0; i < config.iterM; i++) {
						E = M + e * Math.sin(E);
					}
				} else {
					// Hyperbolic orbit
					for (i = 0; i < config.iterM; i++) {
						E = E + (M - e*Math.sinh(E) + E) / (e * Math.cosh(E) - 1);
					}
				}
				return E;
			}
		};

		CelestialBody.prototype.orbitalVelocity = function (E) {
			if (this.orbit) {
				var u,
					r,
					speed, velocity,
					tangent;

				// Need to calculate and combine two components to get velocity:
				// 		Speed
				// 		Direction


				// SPEED //
				// Standard gravitational parameter
				u = config.G * this.orbit.attractor.mass;

				// Distance from orbiting body
				r = this.coords.mod();

				// Vis-viva equation
				speed = Math.sqrt(u * (2 / r - 1 / this.orbit.a));

				// DIRECTION //
				tangent = this.orbit.getTangentAtEccentricAnomaly(E);

				if (this.orbit.a > 0) {
					// Elliptic
					if (this.orbit.anticlockwise) {
						speed = -speed;
					}
				} else {
					// Hyperbolic
					if (!this.orbit.anticlockwise) {
						speed = -speed;
					}
				}

				velocity = tangent.scale(speed);

				return velocity;
			} else {
				// Not orbiting anything, so no velocity relative to parent
				return new Vector(0, 0);
			}
		};

		//////////////////
		// PHYSICS STEP //
		//////////////////
		CelestialBody.prototype.update = function (dt) {
			// Calculates the body's location along its orbit
			// based on its previous location and the time that
			// has passed

			if (this.orbit) {
				// Time is how the position is calculated
				// Past position is discarded each time, and
				// instantaneous velocity is only recorded for
				// recalculating an orbit when changing orbits
				this.orbit.t += dt;

				var E, B,
					v;

				// Eccentric anomaly depends on time only
				E = this.eccentricAnomaly();

				// New coords depends on eccentric anomaly
				B = this.orbit.getPointAtEccentricAnomaly(E);

				// New velocity depends on position and uses eccentric anomaly
				this.coords = B;
				v = this.orbitalVelocity(E);

				this.v = v;
			}
		};

		///////////////
		// RENDERING //
		///////////////
		CelestialBody.prototype.draw = function (ctx) {
			var coords = this.getGlobalPosition();

			ctx.save();

			ctx.translate(coords.x, coords.y);
			ctx.beginPath();
			ctx.fillStyle = 'rgb(' + this.r + ', ' + this.g + ', ' + this.b + ')';
			ctx.arc(0, 0, this.size, 0, Math.PI*2);
			ctx.fill();

			ctx.restore();

			// Debug: Draw sphere of influence
			if (window.debug && this.orbit) {
				var r = this.sphereOfInfluenceRadius();
				ctx.save();

				var coords = this.getGlobalPosition();
				ctx.translate(coords.x, coords.y);
				ctx.beginPath();
				ctx.strokeStyle = 'rgba(' + this.r + ', ' + this.g + ', ' + this.b + ', 1)';
				ctx.arc(0, 0, r, 0, Math.PI*2);
				ctx.stroke();

				ctx.restore();
			}
		};

		CelestialBody.prototype.drawOrbit = function (ctx) {
			if (this.orbit) {
				this.orbit.translateFocusTo(this.orbit.attractor.getGlobalPosition());
				this.orbit.draw(ctx, 'rgba(' + this.r + ', ' + this.g + ', ' + this.b + ', 0.3)');
			}
		};

		return CelestialBody;
	}
);