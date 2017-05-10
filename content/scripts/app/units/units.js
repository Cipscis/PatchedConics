define(
	[
		'units/convert'
	],

	function (convert) {
		var Units = {};

		// DISTANCE //
		Units.distance = {};

		// Use px as 1 to make drawing easier
		Units.distance.px = 1;

		// Set 1 AU to 100 px at default scale
		Units.distance.AU = 1 / 200;

		Units.distance.m = Units.distance.AU * 149600000000;
		Units.distance.metre = Units.distance.m;
		Units.distance.metres = Units.distance.m;

		Units.distance.km = Units.distance.m * 1000;
		Units.distance.kilometre = Units.distance.km;
		Units.distance.kilometres = Units.distance.km;

		Units.distance.solRadius = Units.distance.km / 695700;
		Units.distance.earthRadius = Units.distance.km / 6371;


		// MASS //
		Units.mass = {};

		// Based on solar mass
		Units.mass.sol = 1;
		Units.mass.sols = 1;

		Units.mass.earth = 1 / 0.000003003;
		Units.mass.earths = Units.mass.earth;

		Units.mass.kg = 1.988435 * Math.pow(10, 30);
		Units.mass.kilograms = Units.mass.kg;
		Units.mass.kilogram = Units.mass.kg;

		Units.mass.g = Units.mass.kg / 1000;
		Units.mass.grams = Units.mass.g;
		Units.mass.gram = Units.mass.g;


		// TIME //
		Units.time = {};

		// Based on Earth years
		Units.time.years = 1;
		Units.time.year = 1;

		Units.time.days = Units.time.year / 365.25;
		Units.time.day = Units.time.days;

		Units.time.hours = Units.time.day / 24;
		Units.time.hour = Units.time.hours;

		Units.time.minutes = Units.time.hour / 60;
		Units.time.minute = Units.time.minutes;
		Units.time.min = Units.time.minutes;

		Units.time.s = Units.time.minutes / 60;
		Units.time.second = Units.time.s;
		Units.time.seconds = Units.time.s;

		return Units;
	}
);