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
			G: 10000,

			// Number of iterations for calculating mean anomaly
			iterM: 10
		};
		window.debug = true;

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
			this.v = new Vector(0, 0);

			if (this.orbitParent) {
				this.setInitialOrbit();
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
				coords = coords.add(body.orbitParent.coords);
				body = body.orbitParent;
			}

			return coords;
		};

		CelestialBody.prototype.getGlobalVelocity = function () {
			// Untested
			var v = this.v,
				body = this;

			while (body.orbit) {
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
			// Untested
			parent = parent || this.orbitParent;

			return this.getGlobalVelocity().subtract(parent.getGlobalVelocity());
		};

		///////////////////////////
		// ORBITAL DETERMINATION //
		///////////////////////////
		CelestialBody.prototype.setInitialOrbit = function (parent, progression) {
			this.orbitParent = parent || this.orbitParent;

			var r, P;

			// Distance from orbiting parent
			r = Math.sqrt(Math.pow(this.coords.x, 2) + Math.pow(this.coords.y, 2));

			this.orbit = new Conic(0, 0, r*(Math.random()*0.02+0.995), r, Math.random()*Math.PI*2);
			this.orbit.translateFocusTo(this.orbitParent.getGlobalPosition());
		};

		CelestialBody.prototype.recalculateOrbit = function (parent) {
			// TODO: Support hyperbolic orbits

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


				// Semimajor axis of orbit, based on
				// solving the vis-viva equation for a
				a = r*u / (2*u - r*Math.pow(speed, 2));

				// Orbital eccentricity vector
				ev = coords.scale(Math.pow(speed, 2)/u - 1/r).subtract(velocity.scale(coords.dot(velocity)/u));

				// Eccentricity
				e = ev.mod();

				// Semiminor axis, calculated from semimajor axis
				// and the orbit's eccentricity
				if (e < 1) {
					// Elliptical orbit
					b = a * Math.sqrt(1 - Math.pow(e, 2));
				} else {
					// Hyperbolic orbit
					b = -a * Math.sqrt(Math.pow(e, 2) - 1);
				}

				// Argument of periapsis
				w = ev.getRotation();


				newOrbit = new Conic(0, 0, a, b, w);
				newOrbit.translateFocusTo(parent.getGlobalPosition());

				// Angular momentum
				// This would normally be a 3D vector, but since it's
				// the cross product of two vectors in the orbital plane
				// just represent it as the remaining Z component
				h = coords.x * velocity.y - coords.y * velocity.x;

				// The sign of the angular momentum component determines
				// the direction of the orbit
				orbitAnticlockwise = h < 0;


				// True anomaly
				f = coords.getRotation() - ev.getRotation();

				// Eccentric anomaly
				E = newOrbit.eccentricAnomaly(f);

				// Mean anomaly
				// Kepler's equation
				M = E - e * Math.sin(E);
				if (orbitAnticlockwise) {
					M = -M;
				}

				// Calculate time since periapsis
				if (e < 1) {
					// Elliptical orbit

					// Orbital period (Kepler's third law)
					P = 2*Math.PI*Math.sqrt(Math.pow(a, 3)/u);

					// Average rate of sweep
					n = Math.PI*2 / P;

					// Time since periapsis
					t = M / n;
				} else {
					// Hyperbolic orbit
					t = M / Math.sqrt(u / -Math.pow(a, 3));
				}

				// Set new orbit
				this.coords = this.getLocalPosition(parent);

				this.orbitParent = parent;
				this.orbit = newOrbit;
				this.orbitAnticlockwise = orbitAnticlockwise;
				this.t = t;
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
					P, n,
					M, E,
					i;

				// Eccentricity of orbit
				e = this.orbit.eccentricity();

				// Standard gravitational parameter
				u = config.G * this.orbitParent.mass;

				// Calculate mean anomaly
				if (e < 1) {
					// Elliptical orbit

					// Orbital period (Kepler's third law)
					P = Math.sqrt(4 * Math.pow(Math.PI, 2) / u * Math.pow(this.orbit.j, 3));

					// Average rate of sweep
					n = Math.PI*2 / P;

					// Mean anomaly
					M = n * (this.t);
				} else {
					// Hyperbolic orbit

					// Mean anomaly
					M = Math.sqrt(u / -Math.pow(this.orbit.j, 3)) * t;
				}

				if (this.orbitAnticlockwise) {
					M = -M;
				}

				// Eccentric anomaly
				// Calculated numerically from M
				E = M;
				for (i = 0; i < config.iterM; i++) {
					E = M + e * Math.sin(E);
				}

				return E;
			}
		};

		CelestialBody.prototype.orbitalPosition = function (E) {
			if (this.orbit) {
				// Point of orbital body, relative to centre of ellipse
				var B = this.orbit.getPointAtEccentricAnomaly(E);

				// TODO: Needs to support hyperbolic orbits
				// Translate to be relative to orbital parent (at the main focus of the ellipse) instead of ellipse's centre
				B = B.add(this.orbit.coords).subtract(this.orbit.foci[0]);

				return B;
			} else {
				// Not orbiting something, so no position vector from parent
				return new Vector(0, 0);
			}
		};

		CelestialBody.prototype.orbitalVelocity = function (E) {
			if (this.orbit) {
				var u,
					r,
					speed, velocity,
					tangent;

				// Calculate speed using vis-viva equation
				u = config.G * this.orbitParent.mass;
				r = this.coords.mod();
				speed = Math.sqrt(u * (2 / r - 1 / this.orbit.j));

				tangent = this.orbit.getTangentAtEccentricAnomaly(E);

				// Calculate velocity by combining tangent vector with speed
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
			// TODO: Support hyperbolic orbits

			// Calculates the body's location along its orbit
			// based on its previous location and the time that
			// has passed

			if (this.orbit) {
				// TODO: These should be calculated when a new orbit is set
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
				B = this.orbitalPosition(E);

				// New velocity depends on eccentric anomaly and position
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