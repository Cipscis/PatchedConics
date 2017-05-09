define(
	[],

	function () {
		var Units = {};

		// DISTANCE //
		Units.distance = {};

		// Based on the astronomical unit
		Units.distance.AU = 1;

		Units.distance.m = 1 / 149600000000;
		Units.distance.metre = Units.distance.m;
		Units.distance.metres = Units.distance.m;

		Units.distance.km = Units.distance.m * 1000;
		Units.distance.kilometre = Units.distance.km;
		Units.distance.kilometres = Units.distance.km;

		// This will apply at default zoom level
		Units.distance.px = 100;


		// MASS //
		Units.mass = {};

		// Based on solar mass
		Units.mass.sol = 1;
		Units.mass.sols = 1;

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