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

		var Conic = function (j, n) {
			// j and n are the lengths of the semimajor and semiminor axes

			this.j = j;
			this.n = n;

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
					d = new Vector(this.a, 0);
				} else {
					// Hyperbolic
					d = new Vector(-this.a, 0);
				}

				foci = [
					d,
					d.scale(-1)
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
				r = this.j * (e * Math.cosh(E) - 1);
			}

			v = new Vector(r, 0).rotate(f);

			return v;
		};

		Conic.prototype.getGradientAtEccentricAnomaly = function (E) {
			// Return a unit vector that is tangent to the conic at a
			// given eccentric anomaly

			var point,
				tangentSlope;


			// Get point relative to focus
			point = this.getPointAtEccentricAnomaly(E);

			// Convert to relative to centre
			point = point.add(this.foci[0]);

			if (Math.sin(E) === 0) {
				// At apsis, so velocity parallel with semiminor axis
				tangent = new Vector(0, 1);
			} else {
				if (this.j > 0) {
					// Ellipse
					tangentSlope = -(Math.pow(this.n, 2)*point.x)/(Math.pow(this.j, 2)*point.y);
				} else {
					// Hyperbola
					tangentSlope = (Math.pow(this.n, 2)*point.x)/(Math.pow(this.j, 2)*point.y);
				}
			}

			return tangentSlope;
		};

		Conic.prototype.eccentricAnomaly = function (f) {
			// Calculate the eccentric anomaly from the given true anomaly f

			var e, E;

			// Eccentricity
			e = this.eccentricity();

			// Eccentric anomaly
			if (e < 1) {
				// Elliptical orbit
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

				ctx.beginPath();
				ctx.ellipse(0, 0, this.j, this.n, 0, 0, Math.PI*2);
				ctx.stroke();

				ctx.restore();
			} else {
				// Hyperbola

				ctx.save();

				ctx.strokeStyle = strokeStyle || '#ffffff';

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

				// Debug: Draw other side
				ctx.beginPath();
				for (i = 1-segmentsPerSide; i < segmentsPerSide; i += segmentLength) {
					y = i * segmentLength;

					// Negative to make it draw the primary focus
					x = -this.j * Math.sqrt(1 + Math.pow(y / this.n, 2));

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