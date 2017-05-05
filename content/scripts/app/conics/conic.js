define(
	[
		'vector/vector'
	],

	function (Vector) {
		// Do all calculations using a system of local coordinates:
		// treat the x axis as the semimajor axis and the origin as
		// the centre of the ellipse, then take global coords and
		// rotation into account when rendering

		var Conic = function (x, y, j, n, angle) {
			// x and y are the coordinates of the conic's main focus
			// j and n are the lengths of the semimajor and semiminor axes
			// angle is the angle of the semimajor axis measured from the horizontal, in radians

			this.coords = new Vector(x, y);
			this.j = j;
			this.n = n;
			this.angle = angle;

			if (this.j > 0 && this.n > this.j) {
				// Ellipse but semiminor axis larger than semimajor axis
				// Use a as temp, swap n and j so j is larger
				a = this.j;
				this.j = this.n;
				this.n = a;

				// Increment angle by pi/2 to compensate for swap
				this.angle += Math.PI/2;
			}

			// Distance between foci
			this.a = Math.sqrt(Math.pow(this.j, 2) - Math.pow(this.n, 2));
		};

		Conic.prototype.eccentricity = function () {
			var e;

			if (this.j > 0) {
				// Ellipse
				e = this.a / this.j;
			} else {
				// Hyperbola
				e = Math.sqrt(1 + (Math.pow(this.n, 2) + Math.pow(this.j, 2)));
			}

			return e;
		};

		Conic.prototype.translateTo = function (v) {
			if (v && v instanceof Vector) {
				this.coords = v;
			}
		};

		Conic.prototype.translate = function (v) {
			if (v && v instanceof Vector) {
				this.translateTo(this.coords.add(v));
			}
		};

		Conic.prototype.translateFocusTo = function (v) {
			// TODO: This is now identical to translateTo, so remove it

			// Treat the first focus as the "main" one

			// Move the main focus to the passed position

			var d;

			if (v && v instanceof Vector) {
				d = v.subtract(this.coords);
				this.translate(d);
			}
		};

		Conic.prototype.centreOnFocus = function (v) {
			// Takes in a vector relative to the centre
			// of an ellipse, and makes it relative to the
			// main focus instead

			var d = new Vector(Math.cos(this.angle) * this.a, Math.sin(this.angle) * this.a);

			return v.subtract(d);
		};

		Conic.prototype.getPointAtEccentricAnomaly = function (E) {
			// Return a point along an ellipse given an eccentric anomaly
			// The point is relative to the centre of the ellipse

			// TODO: Be relative to focus, not centre of ellipse
			// TODO: Support hyperbola

			var v;

			v = new Vector(Math.cos(E) * this.j, Math.sin(E) * this.n);

			v = v.rotate(this.angle);
			v = this.centreOnFocus(v);

			return v;
		};

		Conic.prototype.getTangentAtEccentricAnomaly = function (E) {
			// Return a unit vector that is tangent to the ellipse at a
			// given eccentric anomaly

			var tangent,
				tangentSlope;

			if (Math.sin(E) === 0) {
				tangent = new Vector(0, 1);
			} else {
				tangentSlope = -(this.n * Math.cos(E))/(this.j * Math.sin(E));
				tangent = new Vector(1, tangentSlope);
			}

			// Correct the tangent's direction if necessary
			if ((Math.abs(E) % (Math.PI*2)) < Math.PI) {
				// E should already be above 0
				tangent = tangent.scale(-1);
			}

			return tangent.normalise().rotate(this.angle);
		};

		Conic.prototype.eccentricAnomaly = function (f) {
			// Calculate the eccentric anomaly from the given true anomaly f

			var e, E;

			// Ensure f is between 0 and 2*pi
			f = f % (Math.PI*2);
			if (f < 0) {
				f += Math.PI*2;
			}

			// Eccentricity
			e = this.eccentricity();

			// Eccentric anomaly
			if (e < 1) {
				// Elliptical orbit
				E = Math.acos((e + Math.cos(f))/(1 + e * Math.cos(f)));
				if (f > Math.PI) {
					E = Math.PI*2 - E;
				}
			} else {
				// Hyperbolic orbit
				E = Math.acosh((Math.cos(f) - e)/(1 - e * Math.cos(f)));
			}

			return E;
		};


		/////////////
		// DRAWING //
		/////////////
		Conic.prototype.draw = function (ctx, strokeStyle) {
			if (this.j > 0) {
				// Ellipse

				var d = new Vector(Math.cos(this.angle) * this.a, Math.sin(this.angle) * this.a);
				d = this.coords.subtract(d);

				ctx.save();

				ctx.strokeStyle = strokeStyle || '#ffffff';

				ctx.translate(d.x, d.y);
				ctx.rotate(this.angle);
				ctx.beginPath();
				ctx.ellipse(0, 0, this.j, this.n, 0, 0, Math.PI*2);
				ctx.stroke();

				ctx.restore();
			}
		};

		return Conic;
	}
);