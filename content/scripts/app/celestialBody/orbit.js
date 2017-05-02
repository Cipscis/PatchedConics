define(
	[
		'conics/ellipse'
	],

	function (Ellipse) {
		// Need to have a good think about how to define an orbit initially
		// Two points will be known to start with:
			// The position of the attractor (the ellipse's main focus)
			// The position of the orbiter (somewhere along the ellipse's edge)

		// It will also be necessary to know - or somehow derive - the time
		// since periapsis. Currently it is just assumed that all bodies start
		// at periapsis, which won't always be true

		// Once spacecraft are to be added, and patched conics will be used,
		// it will be necessary to calculate an orbit based on an object's global
		// position, velocity, and the body it is orbiting (which will be based on
		// sphere of influence calculations)

		var defaults = {
			anticlockwise: false
		};

		var Orbit = function (child, parent, options) {
			for (var prop in defaults) {
				if (options.hasOwnProperty(prop)) {
					this[prop] = options[prop];
				} else {
					this[prop] = defaults[prop];
				}
			}

			this.child = child;
			this.parent = parent;

			this.r = Math.sqrt(Math.pow(this.child.coords.x, 2) + Math.pow(this.child.coords.y, 2));
			this.speed = 100/this.r;

			var coords = this.parent.getGlobalCoords();
			this.ellipse = new Ellipse(coords.x, coords.y, this.r*(Math.random()*0.2+0.9), this.r, 0);
			this.ellipse.angle = Math.random() * Math.PI*2;
		};

		Orbit.prototype.draw = function (ctx) {
			var coords = this.parent.getGlobalCoords();

			this.ellipse.translateFocusTo(coords);

			this.ellipse.draw(ctx, 'rgba(' + this.child.r + ', ' + this.child.g + ', ' + this.child.b + ', 0.3)');
		};

		return Orbit;
	}
);