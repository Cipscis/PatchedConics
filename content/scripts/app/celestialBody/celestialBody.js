define(
	[
		'celestialBody/orbit',

		'vector/vector'
	],

	function (Orbit, Vector) {
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
			orbitSpeed: Math.PI/3,
			anticlockwise: false
		};

		var config = {
			// Gravitational constant
			// G = 6.67408 * Math.pow(10, -11); // m^3 kg^-1 s^-2
			G: 100000,

			// Number of iterations for calculating mean anomaly
			iterM: 100
		};

		// TODO: Remove "Orbit" type, instead give CelestialBody an attractor
		// and an orbit that is a Conic type, which Ellipsis can inherit from?
		// Start with just Ellipsis

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
				this.orbit = new Orbit(this, this.orbitParent, {
					speed: this.orbitSpeed,
					anticlockwise: this.anticlockwise
				});
			}
		};

		// POSITION //
		CelestialBody.prototype.getGlobalCoords = function () {
			var x = this.coords.x,
				y = this.coords.y,
				body = this;

			while (body.orbit) {
				x += body.orbit.parent.coords.x;
				y += body.orbit.parent.coords.y;
				body = body.orbit.parent;
			}

			return new Vector(x, y);
		};

		// PHYSICS //
		CelestialBody.prototype.update = function (dt) {
			if (this.orbit) {
				if (typeof this.tP === 'undefined') {
					this.tP = 0;
					this.t = 0;
				}
				this.t += dt;

				var e,
					P, n,
					M, E,
					B;

				// Eccentricity of orbit
				e = this.orbit.ellipse.e;

				// Orbital period
				// Kepler's 3rd law, adjusted for Newtonian mechanics
				// P^2/a^3 = 4pi^2/G(M+m)
				P = Math.sqrt(4 * Math.pow(Math.PI, 2) / (config.G * (this.orbit.parent.mass + this.mass)) * Math.pow(this.orbit.ellipse.j, 3));

				// mean motion
				n = 2*Math.PI / P;

				// Mean anomaly
				M = n * (this.t - this.tP);
				if (this.orbit.anticlockwise) {
					M = -M;
				}

				// Eccentric anomaly
				// Calculated numerically from M
				E = M;
				for (var i = 0; i < config.iterM; i++) {
					E = M + e * Math.sin(E);
				}

				// Point of orbital body, relative to centre of ellipse
				B = this.orbit.ellipse.getPointAtEccentricAnomaly(E);

				// Rotate to match orbital angle
				B = B.rotate(this.orbit.ellipse.angle);

				// Translate to be relative to orbital parent (at the main focus of the ellipse) instead of ellipse's centre
				B = B.add(this.orbit.ellipse.coords).subtract(this.orbit.ellipse.foci[0]);

				var v = B.subtract(this.coords).scale(1/dt);
				document.getElementById('x').innerHTML = Math.round(v.x);
				document.getElementById('y').innerHTML = Math.round(v.y);
				document.getElementById('v').innerHTML = Math.round(v.mod());

				this.coords = B;
			}
		};

		// RENDERING //
		CelestialBody.prototype.draw = function (ctx) {
			var coords = this.getGlobalCoords();

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
				this.orbit.draw(ctx);
			}
		};

		return CelestialBody;
	}
);