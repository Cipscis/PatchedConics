define(
	[
		'orbit/conic',

		'vector/vector'
	],

	function (Conic, Vector) {
		// An orbit contains all the information necessary to determine an object's position
		// in orbit. This includes the shape and angle of the orbit, as well as its direction,
		// the orbiter, and the body being orbited (the attractor).

		// It acts as an interface for the various methods of conics, placing them in the
		// appropriate coordinate system for the orbit

		var defaults = {
			angle: 0,
			anticlockwise: false,
			t: 0,

			// Conic properties
			a: 10,
			b: 5
		};

		var Orbit = function (options) {
			options = options || {};

			for (var prop in defaults) {
				if (options.hasOwnProperty(prop)) {
					this[prop] = options[prop];
				} else {
					this[prop] = defaults[prop];
				}
			}

			this.coords = new Vector(this.x, this.y);

			this.attractor = options.attractor;
			this.orbiter = options.orbiter;

			if (this.a > 0 && this.b > this.a) {
				// Ellipse, but semiminor axis larger than semimajor axis
				// Swap axes and rotate by pi/2 to compensate

				var temp = this.a;
				this.a = this.b;
				this.b = temp;
				this.angle = (this.angle + Math.PI/2) % (Math.PI*2);
			}

			this.shape = new Conic(this.a, this.b);

			if (!this.attractor) {
				console.error('No attractor specified for orbit');
				console.trace();
			} else {
				this.coords = new Vector(0, 0);
				this.translateFocusTo(this.attractor.getGlobalPosition());
			}
			if (!this.orbiter) {
				console.error('No orbiter specified for orbit');
				console.trace();
			}
		};

		// POSITION //
		Orbit.prototype.translateTo = function (v) {
			if (v && v instanceof Vector) {
				this.coords = v;
			}
		};

		Orbit.prototype.translate = function (v) {
			if (v && v instanceof Vector) {
				this.translateTo(this.coords.add(v));
			}
		};

		Orbit.prototype.translateFocusTo = function (v) {
			// Treat the first focus as the "main" one

			// Move the main focus to the passed position

			var d;

			if (v && v instanceof Vector) {
				d = v.subtract(this.foci[0]);
				this.translate(d);
			}
		};

		// CONIC INTERFACE //
		Object.defineProperty(Orbit.prototype, 'foci', {
			get: function () {
				var shapeFoci = this.shape.foci;

				foci = [
					this.coords.add(shapeFoci[0].rotate(this.angle)),
					this.coords.add(shapeFoci[1].rotate(this.angle))
				];

				return foci;
			}
		});

		Orbit.prototype.eccentricity = function () {
			return this.shape.eccentricity();
		};

		Orbit.prototype.getPointAtEccentricAnomaly = function (E) {
			var point = this.shape.getPointAtEccentricAnomaly(E);

			point = point.rotate(this.angle);

			return point;
		};

		Orbit.prototype.getTangentAtEccentricAnomaly = function (E) {
			var gradient,
				leavingPeriapsis,
				tangent;

			gradient = this.shape.getGradientAtEccentricAnomaly(E);

			if (this.eccentricity() < 1) {
				// Ellipse
				leavingPeriapsis = Math.sin(E) > 0;
			} else {
				// Hyperbola
				leavingPeriapsis = E > 0;
			}

			if (leavingPeriapsis) {
				tangent = new Vector(-1, -gradient);
			} else {
				tangent = new Vector(1, gradient);
			}

			tangent = tangent.normalise().rotate(this.angle);

			return tangent;
		};

		Orbit.prototype.eccentricAnomaly = function (f) {
			return this.shape.eccentricAnomaly(f);
		};

		Orbit.prototype.draw = function (ctx, strokeStyle) {
			ctx.save();

			ctx.translate(this.coords.x, this.coords.y);
			ctx.rotate(this.angle);

			this.shape.draw(ctx, strokeStyle);

			ctx.restore();
		};

		Orbit.prototype.drawFoci = function (ctx, fillStyle) {
			ctx.save();

			ctx.translate(this.coords.x, this.coords.y);
			ctx.rotate(this.angle);

			this.shape.drawFoci(ctx.fillStyle);

			ctx.restore();
		};

		Orbit.prototype.drawCentre = function (ctx, fillStyle) {
			ctx.save();

			ctx.translate(this.coords.x, this.coords.y);
			ctx.rotate(this.angle);

			this.shape.drawCentre(ctx.fillStyle);

			ctx.restore();
		};

		return Orbit;
	}
);