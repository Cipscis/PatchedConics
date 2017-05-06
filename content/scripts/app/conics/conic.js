define(
	[
		'vector/vector'
	],

	function (Vector) {
		// Do all calculations using a system of local coordinates:
		// treat the x axis as the semimajor axis and the origin as
		// the centre of the conic section, then take global coords and
		// rotation into account when rendering

		// Ignoring parabolas due to unlikeliness of getting that precise
		// shape in an environment involving floating point operations

		var Conic = function (x, y, j, n, angle) {
			// x and y are the coordinates of the conic's centre
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
			if (this.j > 0) {
				// Ellipse
				this.a = Math.sqrt(Math.pow(this.j, 2) - Math.pow(this.n, 2));
			} else {
				// Hyperbola
				this.a = Math.sqrt(Math.pow(this.j, 2) + Math.pow(this.n, 2));
			}
		};

		Object.defineProperty(Conic.prototype, 'foci', {
			get: function () {
				var d,
					foci;

				if (this.j > 0) {
					// Elliptical
					d = new Vector(Math.cos(this.angle) * this.a, Math.sin(this.angle) * this.a);
				} else {
					// Hyperbolic
					d = new Vector(Math.cos(this.angle) * -this.a, Math.sin(this.angle) * -this.a);
				}

				foci = [
					this.coords.add(d),
					this.coords.subtract(d)
				];

				return foci;
			}
		});

		Conic.prototype.eccentricity = function () {
			if (this.j > 0) {
				// Ellipse
				return this.a / this.j;
			} else {
				// Hyperbola
				return Math.sqrt(1 + (Math.pow(this.n, 2) / Math.pow(this.j, 2)));
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
			// Return a point along a conic section given an
			// eccentric anomaly, relative to its main focus

			var e, f,
				r, v;

			e = this.eccentricity();

			if (this.j > 0) {
				// Ellipse

				// True anomaly
				f = 2 * Math.atan((Math.sqrt((1 + e)/(1 - e)))*(Math.tan(E / 2)));

				r = this.j * (1 - Math.pow(e, 2)) / (1 + e * Math.cos(f));
			} else {
				// Hyperbola

				// True anomaly
				// tanh(E/2) = sqrt((e-1)/(e+1)) * tan(f/2)
				// tan(f/2) = tanh(E/2) / sqrt((e-1)/(e+1))
				// f/2 = atan(tanh(E/2) / sqrt((e-1)/(e+1)))
				// f = 2 * atan(tahn(E/2) / sqrt((e-1)/(e+1)))

				f = 2 * Math.atan2(Math.sqrt((e-1)/(e+1)), Math.tanh(E/2));

				// Distance from focus
				// Positive to make it appear on the correct side of the hyperbola
				r = this.j * (e * Math.cosh(E) - 1);

				var temp = new Vector(r, 0).rotate(f + this.angle);
			}

			v = new Vector(r, 0).rotate(f + this.angle);

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

			// Eccentricity
			e = this.eccentricity();

			// Eccentric anomaly
			if (e < 1) {
				// Elliptical orbit
				// TODO: This is not always getting the correct result?
				E = Math.atan2(Math.sqrt(1 - Math.pow(e, 2)) * Math.sin(f), e + Math.cos(f));
			} else {
				// Hyperbolic orbit
				E = Math.acosh((e + Math.cos(f))/(1 + e * Math.cos(f)));
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
			} else {
				// Hyperbola

				ctx.save();

				ctx.strokeStyle = strokeStyle || '#ffffff';

				ctx.translate(this.coords.x, this.coords.y);
				ctx.rotate(this.angle);

				var segmentsPerSide = 1000;
				var segmentLength = 1;
				var i,
					x, y;

				// Hyperbola with centre at (0, 0):
				// x^2/a^2 - y^2/b^2 = 1
				// a and b are known, set y

				ctx.beginPath();
				for (i = 1-segmentsPerSide; i < segmentsPerSide; i += segmentLength) {
					y = i * segmentLength;

					// Positive to make it draw the primary focus
					x = this.j * Math.sqrt(1 + Math.pow(y / this.n, 2));

					if (i === 1-segmentsPerSide) {
						// First segment
						ctx.moveTo(x, y);
					} else {
						ctx.lineTo(x, y);
					}
				}
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