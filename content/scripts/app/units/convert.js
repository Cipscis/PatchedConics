define(
	[],

	function () {
		// For converting values in different units, even on vastly different scales

		// Usage example:

		// convert(1).from(Units.distance.km).to(Units.distance.m).value; // 1000
		// convert(1).from(Units.distance.m / Units.time.seconds).to(Units.distance.km / Units.time.hours).value; // 1 m s^-1  is  3.6 km hour^-1

		// Can also just use convert().from().value to leave at default units
		// Equally, numbers in default units can have convert().to().value used on them

		var splitValue = function (value) {
			var exp = Math.floor(Math.log10(value)),
				val = value / Math.pow(10, exp);

			return {
				val: val,
				exp: exp
			};
		};

		var combineSplit = function (split1, split2) {
			var val = 1,
				exp = 0,
				i;

			for (i = 0; i < arguments.length; i++) {
				val = val * arguments[i].val;
				exp = exp + arguments[i].exp;
			}

			return {
				val: val,
				exp: exp
			};
		};

		var Converter = function (value) {
			this.value = value;
		};

		Object.defineProperty(Converter.prototype, 'value', {
			// Store value and exponent separately so as to allow
			// values of vastly different orders of magnitude to be
			// multiplied effectively

			get: function () {
				return this.val * Math.pow(10, this.exp);
			},

			set: function (value) {
				var split = splitValue(value);

				this.val = split.val;
				this.exp = split.exp;
			}
		});

		Converter.prototype.from = function (units) {
			var splits = [this],
				combination,
				i;

			for (i = 0; i < arguments.length; i++) {
				splits.push(splitValue(arguments[i]));
			}

			combination = combineSplit.apply(this, splits);
			this.val = combination.val;
			this.exp = combination.exp;

			return this;
		};

		Converter.prototype.to = function (unit) {
			var splits = [this],
				combination,
				i;

			for (i = 0; i < arguments.length; i++) {
				splits.push(splitValue(1/arguments[i]));
			}

			combination = combineSplit.apply(this, splits);
			this.val = combination.val;
			this.exp = combination.exp;

			return this;
		};

		var convert = function (value) {
			return new Converter(value);
		};

		return convert;
	}
);