define([], function () {
	// 2D Vectors

	var Vector = function (x, y) {
		this.x = x;
		this.y = y;
	};

	Vector.prototype.mod = function () {
		return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
	};

	Vector.prototype.add = function (v2) {
		if (v2 && v2 instanceof Vector) {
			return new Vector(this.x + v2.x, this.y + v2.y);
		}
	};

	Vector.prototype.subtract = function (v2) {
		if (v2 && v2 instanceof Vector) {
			return new Vector(this.x - v2.x, this.y - v2.y);
		}
	};

	Vector.prototype.scale = function (x, y) {
		if (typeof y === 'undefined') {
			// Uniform scale by default
			y = x;
		}

		return new Vector(x*this.x, y*this.y);
	};

	Vector.prototype.rotate = function (a) {
		var x, y;

		x = this.x * Math.cos(a) - this.y * Math.sin(a);
		y = this.x * Math.sin(a) + this.y * Math.cos(a);

		return new Vector(x, y);
	};

	Vector.prototype.dot = function (v2) {
		if (v2 && v2 instanceof Vector) {
			return this.x*v2.x + this.y*v2.y;
		}
	};

	Vector.prototype.getAngle = function (v2) {
		if (v2 && v2 instanceof Vector) {
			var dot = this.dot(v2),
				mod = this.mod() * v2.mod();

			return Math.acos(dot/mod);
		}
	};

	return Vector;
});