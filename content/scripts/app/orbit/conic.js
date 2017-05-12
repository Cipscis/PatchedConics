define(
	[
		'vector/vector'
	],

	function (Vector) {
		// All conics are created in their own local set of coordinates,
		// where the x axis is the conic's semimajor axis and the origin
		// is its centre

		// Ignoring parabolas due to unlikeliness of getting that precise
		// shape in an environment involving floating point operations

		var Conic = function (a, b) {
			// a and b are the lengths of the semimajor and semiminor axes

			this.a = a;
			this.b = b;

			if (this.a > 0 && this.a < this.b) {
				// Can be corrected, but not without an additional rotation
				// which is impossible to track in this local coordinate space.

				// If this is necessary, it should be done outside this constructor
				// and kept track of there
				console.error('Semimajor axis shorter than semiminor axis for ellipse');
			}

			// Distance between foci
			if (this.a > 0) {
				// Ellipse
				this.c = Math.sqrt(Math.pow(this.a, 2) - Math.pow(this.b, 2));
			} else {
				// Hyperbola
				this.c = Math.sqrt(Math.pow(this.a, 2) + Math.pow(this.b, 2));
			}

			if (this.a > 0) {
				// Ellipse
				this.foci = [
					new Vector(this.c, 0),
					new Vector(-this.c, 0)
				];

				// Eccentricity
				this.e = this.c / this.a;
			} else {
				// Hyperbola
				this.foci = [
					new Vector(-this.c, 0),
					new Vector(this.c, 0)
				];

				// Eccentricity
				this.e = Math.sqrt(1 + (Math.pow(this.b, 2) / Math.pow(this.a, 2)));
			}
		};

		Conic.prototype.getPointAtEccentricAnomaly = function (E) {
			// Return a point along a conic section given an
			// eccentric anomaly, relative to its main focus

			var f,
				r, v;

			if (this.a > 0) {
				// Ellipse

				// True anomaly
				f = 2 * Math.atan((Math.sqrt((1 + this.e)/(1 - this.e)))*(Math.tan(E / 2)));

				// Distance from focus
				r = this.a * (1 - Math.pow(this.e, 2)) / (1 + this.e * Math.cos(f));
			} else {
				// Hyperbola

				// True anomaly
				// tanh(E/2) = sqrt((e-1)/(e+1)) * tan(f/2)
				// tan(f/2) = tanh(E/2) / sqrt((e-1)/(e+1))
				// f/2 = atan(tanh(E/2) / sqrt((e-1)/(e+1)))
				// f = 2 * atan(tahn(E/2) / sqrt((e-1)/(e+1)))

				f = 2 * Math.atan2(Math.sqrt((this.e-1)/(this.e+1)), Math.tanh(E/2));

				// Distance from focus
				r = this.a * (this.e * Math.cosh(E) - 1);
			}

			v = new Vector(r, 0).rotate(f);

			return v;
		};

		Conic.prototype.getGradientAtEccentricAnomaly = function (E) {
			// Return a the gradient to the conic section at a given eccentric anomaly

			// The sign of the gradient will be as if the x component of a vector
			// in its direction is positive

			var point,
				tangentSlope;

			// Get point relative to focus
			point = this.getPointAtEccentricAnomaly(E);

			// Convert from relative to main focus to relative to centre
			point = point.add(this.foci[0]);

			if (Math.sin(E) === 0) {
				// At apsis, so velocity parallel with semiminor axis
				tangent = new Vector(0, 1);
			} else {
				if (this.e < 1) {
					// Ellipse
					tangentSlope = -(Math.pow(this.b, 2)*point.x)/(Math.pow(this.a, 2)*point.y);
				} else {
					// Hyperbola
					tangentSlope = (Math.pow(this.b, 2)*point.x)/(Math.pow(this.a, 2)*point.y);
				}
			}

			return tangentSlope;
		};

		Conic.prototype.eccentricAnomalyAtTrueAnomaly = function (f) {
			// Calculate the eccentric anomaly from the given true anomaly f

			var E;

			// Eccentric anomaly
			if (this.e < 1) {
				// Ellipse
				E = Math.atan2(Math.sqrt(1 - Math.pow(this.e, 2)) * Math.sin(f), this.e + Math.cos(f));
			} else {
				// Hyperbola
				E = Math.acosh((this.e + Math.cos(f))/(1 + this.e * Math.cos(f)));
			}

			return E;
		};


		// DRAWING //
		Conic.prototype.draw = function (ctx, strokeStyle) {
			if (this.e < 1) {
				// Ellipse

				ctx.save();

				ctx.strokeStyle = strokeStyle || '#ffffff';

				ctx.beginPath();
				ctx.ellipse(0, 0, this.a, this.b, 0, 0, Math.PI*2);
				ctx.stroke();

				ctx.restore();
			} else {
				// Hyperbola

				ctx.save();

				ctx.strokeStyle = strokeStyle || '#ffffff';

				// TODO: Be precise near foci, but not necessary elsewhere
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
					x = this.a * Math.sqrt(1 + Math.pow(y / this.b, 2));

					if (i === 1-segmentsPerSide) {
						// First segment
						ctx.moveTo(x, y);
					} else {
						ctx.lineTo(x, y);
					}
				}
				ctx.stroke();

				// Debug: Draw other side
				ctx.beginPath();
				for (i = 1-segmentsPerSide; i < segmentsPerSide; i += segmentLength) {
					y = i * segmentLength;

					// Negative to make it draw the primary focus
					x = -this.a * Math.sqrt(1 + Math.pow(y / this.b, 2));

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

			// Debug
			this.drawCentre(ctx, strokeStyle);
			// this.drawFoci(ctx, strokeStyle);
		};

		Conic.prototype.drawFoci = function (ctx, fillStyle) {
			// Debug: Draw the foci
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

		Conic.prototype.drawCentre = function (ctx, fillStyle) {
			// Debug: Draw the centre
			ctx.save();

			ctx.fillStyle = fillStyle || '#ffffff';

			ctx.beginPath();
			ctx.arc(0, 0, 5, 0, Math.PI*2);
			ctx.fill();

			ctx.restore();
		};

		return Conic;
	}
);