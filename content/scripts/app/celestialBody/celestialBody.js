define(
	[
		'conics/ellipse',

		'vector/vector'
	],

	function (Ellipse, Vector) {
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

			if (this.orbitParent) {
				var r = Math.sqrt(Math.pow(this.coords.x, 2) + Math.pow(this.coords.y, 2));

				this.orbit = new Ellipse(0, 0, r*1.1, r, Math.PI/2);
				this.orbit.translateFocusTo(this.orbitParent.getGlobalPosition());
			}
		};

		// COORDINATE SYSTEMS //
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

		// DETERMINATION //
		CelestialBody.prototype.recalculateOrbit = function (parent) {
			// Currently assumes new orbit will be an Ellipse

			parent = parent || this.orbitParent;

			if (parent) {
				var u,
					r, speed,
					a, b,
					P,
					ev, e,
					w,

					newOrbit;

				// Orbital state vectors are known:
					// this.coords
					// this.v

				// Standard gravitational parameter
				u = parent.mass * config.G;

				// Distance between orbiting bodies
				r = this.coords.mod();

				// Velocity of orbiting body relative to parent
				velocity = this.v;

				// Speed of orbiting body relative to parent

				// Measured velocity
				speed = velocity.mod();

				// vis-viva equation
				// speed = Math.sqrt(u * (2 / r - 1 / this.orbit.j));
				// velocity = velocity.normalise().scale(speed);

				// Semimajor axis of orbital ellipse, based on
				// solving the vis-viva equation for a
				a = r*u / (2*u - r*Math.pow(speed, 2));

				// Orbital period (Kepler's third law)
				P = 2*Math.PI*Math.sqrt(Math.pow(a, 3)/u);

				// Orbital eccentricity vector
				// TODO: Something is going wrong here, particularly
				// prominent when the original orbit's angle gets closer to pi/2
				ev = this.coords.scale(Math.pow(speed, 2)/u - 1/r).subtract(velocity.scale(this.coords.dot(velocity)/u));

				// Eccentricity
				e = ev.mod();

				// Semiminor axis, calculated from semimajor axis
				// and the ellipse's eccentricity
				b = a * Math.sqrt(1 - Math.pow(e, 2));

				// Argument of periapsis
				w = ev.getRotation();

				newOrbit = new Ellipse(0, 0, a, b, w);
				newOrbit.translateFocusTo(this.orbitParent.getGlobalPosition());

				// Draw for debugging
				newOrbit.draw(ctx.orbits, 'rgba(255, 0, 0, 0.6)');


				// Check calculated position of orbiting body on new ellipse

				// True anomaly
				var f = this.coords.getRotation() - ev.getRotation();

				// Eccentric anomaly
				var E = newOrbit.eccentricAnomaly(f);

				var newPoint = newOrbit.getPointAtEccentricAnomaly(E);

				ctx.celestialBodies.save();

				ctx.celestialBodies.translate(newOrbit.coords.x, newOrbit.coords.y);

				ctx.celestialBodies.beginPath();
				ctx.celestialBodies.strokeStyle = '#ffffff';
				ctx.celestialBodies.arc(newPoint.x, newPoint.y, 15, 0, Math.PI*2);
				ctx.celestialBodies.stroke();

				ctx.celestialBodies.restore();
			}
		};

		// PHYSICS //
		CelestialBody.prototype.update = function (dt) {
			// Currently assumes this.orbit is an Ellipse

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

				E = this.eccentricAnomaly();
				B = this.orbitalPosition(E);
				v = this.orbitalVelocity(E);

				this.v = v;
				this.coords = B;

				this.recalculateOrbit();
			}
		};

		CelestialBody.prototype.eccentricAnomaly = function (t) {
			t = t || this.t;

			if (this.orbit) {
				var e,
					P, n,
					M, E,
					B,
					v;

				// Eccentricity of orbit
				e = this.orbit.eccentricity();

				// Orbital period
				// Kepler's 3rd law, adjusted for Newtonian mechanics
				// P^2/a^3 = 4pi^2/G(M)
				P = Math.sqrt(4 * Math.pow(Math.PI, 2) / (config.G * (this.orbitParent.mass)) * Math.pow(this.orbit.j, 3));

				// mean motion
				n = 2*Math.PI / P;

				// Mean anomaly
				M = n * (this.t);
				if (this.orbit.anticlockwise) {
					M = -M;
				}

				// Eccentric anomaly
				// Calculated numerically from M
				E = M;
				for (var i = 0; i < config.iterM; i++) {
					E = M + e * Math.sin(E);
				}

				return E;
			}
		};

		CelestialBody.prototype.orbitalPosition = function (E) {
			if (this.orbit) {
				// Point of orbital body, relative to centre of ellipse
				var B = this.orbit.getPointAtEccentricAnomaly(E);

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
					tangent, tangentSlope;

				// Calculate speed using vis-viva equation
				u = config.G * this.orbitParent.mass;
				r = this.coords.mod();
				speed = Math.sqrt(u * (2 / r - 1 / this.orbit.j));

				// Calculate tangent to ellipse at current point
				if (Math.sin(E) === 0) {
					tangent = new Vector(0, 1);
				} else {
					tangentSlope = -(this.orbit.n * Math.cos(E))/(this.orbit.j * Math.sin(E));
					tangent = new Vector(1, tangentSlope);
				}

				// Calculate velocity by combining tangent vector with speed
				velocity = tangent.normalise().scale(speed);

				// Correct the velocity's direction if necessary
				if ((E % (Math.PI*2)) < Math.PI) {
					// E should already be above 0
					velocity = velocity.scale(-1);
				}

				return velocity;
			} else {
				// Not orbiting anything, so no velocity relative to parent
				return new Vector(0, 0);
			}
		};

		// RENDERING //
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