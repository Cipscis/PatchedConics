define(
	[
		'conics/conic',

		'vector/vector'
	],

	function (Conic, Vector) {
		var defaults = {
			name: 'New celestial body',

			x: 100,
			y: 0,
			vx: 0,
			vy: 0,

			r: 100,
			g: 100,
			b: 100,

			size: 50,
			mass: 50,

			orbitParent: undefined,
			orbitAnticlockwise: false
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

			if (this.orbitParent) {
				if (this.v.x || this.v.y) {
					this.recalculateOrbit(this.orbitParent);
				} else {
					this.setInitialOrbit(this.orbitParent);
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

			while (body.orbitParent) {
				coords = coords.add(body.orbitParent.coords);
				body = body.orbitParent;
			}

			return coords;
		};

		CelestialBody.prototype.getGlobalVelocity = function () {
			var v = this.v,
				body = this;

			while (body.orbitParent) {
				v = v.add(body.orbitParent.v);
				body = body.orbitParent;
			}

			return v;
		};

		CelestialBody.prototype.getLocalPosition = function (parent) {
			// Untested
			parent = parent || this.orbitParent;

			return this.getGlobalPosition().subtract(parent.getGlobalPosition());
		};

		CelestialBody.prototype.getLocalVelocity = function (parent) {
			parent = parent || this.orbitParent;

			return this.getGlobalVelocity().subtract(parent.getGlobalVelocity());
		};

		///////////////////////////
		// ORBITAL DETERMINATION //
		///////////////////////////
		CelestialBody.prototype.setInitialOrbit = function (parent) {
			// Sets an initial orbit based on a body's distance from
			// its orbital parent and orbital parameters. The body's
			// velocity will be calculated from this during update step

			this.orbitParent = parent || this.orbitParent;

			var r;

			// Distance from orbiting parent
			r = Math.sqrt(Math.pow(this.coords.x, 2) + Math.pow(this.coords.y, 2));

			this.orbit = new Conic(0, 0, r, r, 0);
			this.orbit.translateFocusTo(this.orbitParent.getGlobalPosition());

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

			parent = parent || this.orbitParent;

			if (parent) {
				var u,
					coords, r,
					velocity, speed,
					a, b,
					ev, e,
					w,
					h, orbitAnticlockwise,
					f, E,
					P, n,
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

				// Semimajor axis of orbit, based on
				// solving the vis-viva equation for a
				a = r*u / (2*u - r*Math.pow(speed, 2));

				// Orbital eccentricity vector
				ev = coords.scale(Math.pow(speed, 2)/u - 1/r).subtract(velocity.scale(coords.dot(velocity)/u));

				// Eccentricity
				e = ev.mod();

				// Argument of periapsis
				w = ev.getRotation();

				// Semiminor axis, calculated from semimajor axis
				// and the orbit's eccentricity
				if (e < 1) {
					// Elliptical orbit
					b = a * Math.sqrt(1 - Math.pow(e, 2));
				} else {
					// Hyperbolic orbit
					b = -a * Math.sqrt(Math.pow(e, 2) - 1);
				}

				newOrbit = new Conic(0, 0, a, b, w);
				newOrbit.translateFocusTo(parent.getGlobalPosition());


				// DIRECTION //

				// Angular momentum
				// This would normally be a 3D vector, but since it's
				// the cross product of two vectors in the orbital plane
				// just represent it as the remaining Z component
				h = coords.x * velocity.y - coords.y * velocity.x;

				// The sign of the angular momentum Z component determines
				// the direction of the orbit in the XY plane
				if (a > 0) {
					// Elliptic
					orbitAnticlockwise = h < 0;
				} else {
					// Hyperbolic
					orbitAnticlockwise = h > 0;
				}


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

				if (orbitAnticlockwise) {
					M = -M;
				}

				// Calculate time since periapsis
				n = Math.sqrt(u / Math.abs(Math.pow(a, 3)));
				t = M / n;

				// Set new orbit
				this.coords = this.getLocalPosition(parent);
				this.orbitParent = parent;
				this.orbit = newOrbit;
				this.orbitAnticlockwise = orbitAnticlockwise;
				this.t = t;

				console.log(this.name + ' is in a' + (a < 0 ? ' hyperbolic' : 'n elliptic') + ' orbit around ' + parent.name);
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

			if (this.orbit.j < 0) {
				// Negative semimajor axis indicates a hyperbolic orbit
				// Spheres of influence are only calculated for massive bodies,
				// and massive bodies should never be on escape trajectories

				console.warn('Massive body ' + this.name + ' on a hyperbolic orbit');
				console.log(this.orbit);
				console.trace();
				return 0;
			}

			if (this.orbit) {
				return this.orbit.j * Math.pow(this.mass / this.orbitParent.mass, 2/5);
			}
		};

		CelestialBody.prototype.eccentricAnomaly = function (t) {
			t = t || this.t;

			if (this.orbit) {
				var e,
					u,
					n,
					M, E,
					i;

				// Eccentricity of orbit
				e = this.orbit.eccentricity();

				// Standard gravitational parameter
				u = config.G * this.orbitParent.mass;

				// Mean motion
				n = Math.sqrt(u / Math.abs(Math.pow(this.orbit.j, 3)));

				// Calculate mean anomaly
				M = n * t;

				if (this.orbitAnticlockwise) {
					M = -M;
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
					trueAnomaly, e,
					flightPathAngle,
					tangent;

				// Need to calculate and combine two components to get velocity:
				// 		Speed
				// 		Direction


				// SPEED //
				// Standard gravitational parameter
				u = config.G * this.orbitParent.mass;

				// Distance from orbiting body
				r = this.coords.mod();

				// Vis-viva equation
				speed = Math.sqrt(u * (2 / r - 1 / this.orbit.j));

				// DIRECTION //
				tangent = this.orbit.getTangentAtEccentricAnomaly(E);

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
				if (typeof this.t === 'undefined') {
					// t is time since periapsis (closest approach to focus)
					this.t = 0;
				}

				// Time is how the position is calculated
				// Past position is discarded each time, and
				// instantaneous velocity is only recorded for
				// recalculating an orbit when changing orbits
				this.t += dt;

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


				// Debug: Draw sphere of influence
				if (window.debug) {
					var r = this.sphereOfInfluenceRadius();
					ctx.celestialBodies.save();

					var coords = this.getGlobalPosition();
					ctx.celestialBodies.translate(coords.x, coords.y);
					ctx.celestialBodies.beginPath();
					ctx.celestialBodies.strokeStyle = 'rgba(' + this.r + ', ' + this.g + ', ' + this.b + ', 1)';
					ctx.celestialBodies.arc(0, 0, r, 0, Math.PI*2);
					ctx.celestialBodies.stroke();

					ctx.celestialBodies.restore();
				}
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
		};

		CelestialBody.prototype.drawOrbit = function (ctx) {
			if (this.orbit) {
				this.orbit.translateFocusTo(this.orbitParent.getGlobalPosition());
				this.orbit.draw(ctx, 'rgba(' + this.r + ', ' + this.g + ', ' + this.b + ', 0.3)');
			}
		};

		return CelestialBody;
	}
);