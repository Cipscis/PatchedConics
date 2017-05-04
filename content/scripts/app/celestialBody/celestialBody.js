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
			G: 1000,

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
			this.v = new Vector(0, 0);

			if (this.orbitParent) {
				var r = Math.sqrt(Math.pow(this.coords.x, 2) + Math.pow(this.coords.y, 2));

				this.orbit = new Ellipse(0, 0, r*(Math.random()*0.2+0.9), r, Math.random()*Math.PI*2);
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
		CelestialBody.prototype.recalculateOrbit = function (parent, setNewOrbit) {
			// Currently assumes new orbit will be an Ellipse

			parent = parent || this.orbitParent;

			if (parent) {
				var u,
					coords, r,
					velocity, speed,
					a, b,
					P,
					ev, e,
					w,
					h, orbitAnticlockwise,
					f, E,
					n, M,
					t,

					newOrbit;

				// Orbital state vectors are known:
					// this.coords
					// this.v

				// Standard gravitational parameter
				u = parent.mass * config.G;

				// Position vector of orbiting body relative to parent
				coords = this.getLocalPosition(parent);

				// Distance between orbiting bodies
				r = coords.mod();

				// Velocity of orbiting body relative to parent
				velocity = this.getLocalVelocity(parent);

				// Speed of orbiting body relative to parent
				speed = velocity.mod();

				// Semimajor axis of orbital ellipse, based on
				// solving the vis-viva equation for a
				a = r*u / (2*u - r*Math.pow(speed, 2));

				// Orbital period (Kepler's third law)
				P = 2*Math.PI*Math.sqrt(Math.pow(a, 3)/u);

				// Orbital eccentricity vector
				// TODO: Something is going wrong here, particularly
				// prominent when the original orbit's angle gets closer to pi/2
				ev = coords.scale(Math.pow(speed, 2)/u - 1/r).subtract(velocity.scale(coords.dot(velocity)/u));

				// Eccentricity
				e = ev.mod();

				// Semiminor axis, calculated from semimajor axis
				// and the ellipse's eccentricity
				b = a * Math.sqrt(1 - Math.pow(e, 2));

				// Argument of periapsis
				w = ev.getRotation();

				newOrbit = new Ellipse(0, 0, a, b, w);
				newOrbit.translateFocusTo(parent.getGlobalPosition());

				// Angular momentum
				// This would normally be a 3D vector, but since it's
				// the cross product of two vectors in the orbital plane
				// just represent it as the remaining Z component
				h = coords.x * velocity.y - coords.y * velocity.x;

				// The sign of the angular momentum component determines
				// the direction of the obrit
				orbitAnticlockwise = h < 0;

				// Draw for debugging
				newOrbit.draw(ctx.orbits, 'rgba(255, 0, 0, 0.6)');


				// Debug: Check calculated position of orbiting body on new ellipse

				// True anomaly
				f = coords.getRotation() - ev.getRotation();

				// Eccentric anomaly
				E = newOrbit.eccentricAnomaly(f);

				// Calculate time since epoch

				// Average rate of sweep
				n = Math.PI*2 / P;

				// Mean anomaly
				// Kepler's equation
				M = E - e * Math.sin(E);
				if (orbitAnticlockwise) {
					M = -M;
				}

				t = M / n;


				// Debug: Draw orbit and new calculated position
				var newPoint = newOrbit.getPointAtEccentricAnomaly(E);
				ctx.celestialBodies.save();

				ctx.celestialBodies.translate(newOrbit.coords.x, newOrbit.coords.y);
				ctx.celestialBodies.translate(newPoint.x, newPoint.y);

				ctx.celestialBodies.beginPath();
				ctx.celestialBodies.strokeStyle = '#ffffff';
				ctx.celestialBodies.arc(0, 0, 15, 0, Math.PI*2);
				ctx.celestialBodies.stroke();

				ctx.celestialBodies.restore();

				if (setNewOrbit) {
					this.orbit = newOrbit;
					this.orbitParent = parent;
					this.orbitAnticlockwise = orbitAnticlockwise;
					this.t = t;
				}

				// TODO: Need to be able to return the direction of the orbit and position along it as well
				return newOrbit;
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

				// Eccentric anomaly depends on time only
				E = this.eccentricAnomaly();

				// New coords depends on eccentric anomaly
				B = this.orbitalPosition(E);

				// New velocity depends on eccentric anomaly and position
				this.coords = B;
				v = this.orbitalVelocity(E);

				this.v = v;

				// TODO: check if it's changed sphere of influence
				// If it has, find the intersection point and time of crossover,
				// then calculate the new orbit for the new orbital parent, and
				// update the object's orbit
				// Debug: Show calculated orbit around sun
				this.recalculateOrbit(sun);
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
				if (this.orbitAnticlockwise) {
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