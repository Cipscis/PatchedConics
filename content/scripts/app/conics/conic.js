define(
	[
		'vector/vector'
	],

	function (Vector) {
		// TODO: Hyperbolae have no centre, so find another way to represent them
		// Presumably best to set location based on main focus, and then
		// translate the canvas prior to drawing an ellipse

		// Do all calculations using a system of local coordinates:
		// treat the x axis as the semimajor axis and the origin as
		// the centre of the ellipse, then take global coords and
		// rotation into account when rendering

		var Conic = function (x, y, j, n, angle) {
			// x and y are the coordinates of the ellipse's centre
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

		Object.defineProperty(Conic.prototype, 'foci', {
			get: function () {
				var d = new Vector(Math.cos(this.angle) * this.a, Math.sin(this.angle) * this.a);

				return [
					this.coords.add(d),
					this.coords.subtract(d)
				];
			}
		});

		Conic.prototype.eccentricity = function () {
			if (this.j > 0) {
				// Ellipse
				return this.a / this.j;
			} else {
				// Hyperbola
				return Math.sqrt(1 + (Math.pow(this.n, 2) + Math.pow(this.j, 2)));
			}
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
			// Treat the first focus as the "main" one

			// Move the main focus to the passed position

			var d;

			if (v && v instanceof Vector) {
				d = v.subtract(this.foci[0]);
				this.translate(d);
			}
		};

		Conic.prototype.getPointAtEccentricAnomaly = function (E) {
			// Return a point along an ellipse given an eccentric anomaly
			// The point is relative to the centre of the ellipse

			// TODO: Support hyperbola

			var x, y;

			x = Math.cos(E) * this.j;
			y = Math.sin(E) * this.n;

			return new Vector(x, y).rotate(this.angle);
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


		// DRAWING //
		Conic.prototype.draw = function (ctx, strokeStyle) {
			if (this.j > 0) {
				// Ellipse
				
				ctx.save();

				ctx.strokeStyle = strokeStyle || '#ffffff';

				ctx.translate(this.coords.x, this.coords.y);
				ctx.rotate(this.angle);
				ctx.beginPath();
				ctx.ellipse(0, 0, this.j, this.n, 0, 0, Math.PI*2);
				ctx.stroke();

				ctx.restore();
			}
		};

		Conic.prototype.drawFoci = function (ctx, fillStyle) {
			// For debugging, draw the foci of an ellipse
			ctx.save();

			ctx.fillStyle = fillStyle || '#ffffff';

			ctx.beginPath();
			ctx.arc(this.foci[0].x, this.foci[0].y, 5, 0, Math.PI*2);
			ctx.fill();

			ctx.beginPath();
			ctx.arc(this.foci[1].x, this.foci[1].y, 5, 0, Math.PI*2);
			ctx.fill();

			ctx.restore();
		};

		return Conic;
	}
);