define(
	[
		'util/start',

		'stellarSystem/stellarSystem',
		'stellarSystem/attractor',
		'stellarSystem/orbiter',

		'vector/vector',

		'units/units',
		'units/convert'
	],

	function (start, StellarSystem, Attractor, Orbiter, Vector, Units, convert) {
		var ctx = {};

		// For debugging purposes
		window.debug = true;

		var system;
		var followObject;
		var path;

		var benchmarking = 0.99;

		var Game = {
			init: function () {
				Game._initCtx();

				Game._initSystem();

				// Test cases:
				// Game._initEllipseTest(1);
				// Game._initHyperbolicTest(1);

				// Game._initEllipseSimpleTransferTest(1);

				// Game._initHyperbolicSimpleTransferTest(1);
				// Game._initHyperbolicSimpleTransferTest(0.9);

				// Game._initHyperbolicComplexTransferTest(1);

				start(Game._doStep, 100, 0.5);
			},

			_initCtx: function () {
				var canvas = {};

				canvas.orbits = document.getElementById('orbits');
				canvas.celestialBodies = document.getElementById('celestial-bodies');

				ctx.orbits = canvas.orbits.getContext('2d');
				ctx.celestialBodies = canvas.celestialBodies.getContext('2d');
			},

			_initSystem: function () {
				var sun = new Attractor({
					name: 'Sun',
					x: 0,
					y: 0,
					vx: 0,
					vy: 0,

					size: 15,
					mass: 600,

					r: 200, g: 200, b: 100
				});

				system = new StellarSystem(sun);

				var planet = new Attractor({
					name: 'Planet',
					x: 200,
					y: 0,

					vx: 0,
					vy: 60,

					attractor: sun,

					size: 5,
					mass: 15,

					r: 100, g: 200, b: 100
				});

				system.addCelestialBody(planet);

				var moon = new Attractor({
					name: 'Moon',
					x: 20,
					y: 0,

					vx: 0,
					vy: -29.8,

					attractor: planet,

					size: 2,
					mass: 5,

					r: 100, g: 100, b: 100
				});

				system.addCelestialBody(moon);

				var spaceship = new Orbiter({
					name: 'Spaceship',
					x: 10,
					y: 0,

					vx: 0,
					vy: 22.2,

					attractor: moon,

					size: 2,
					mass: 0.1,

					r: 200, g: 200, b: 200
				});

				system.addCelestialBody(spaceship);

				followObject = sun;

				document.getElementById('increase-speed').addEventListener('click', function () {
					spaceship.v = spaceship.v.add(spaceship.v.normalise());
					spaceship.recalculateOrbit();
				});

				document.getElementById('decrease-speed').addEventListener('click', function () {
					spaceship.v = spaceship.v.subtract(spaceship.v.normalise());
					spaceship.recalculateOrbit();
				});
			},

			_doStep: function (dt) {
				Game._update(dt);
				Game._render();

				benchmarking += dt;
				if (benchmarking >= 1) {
					benchmarking = 0;
					document.getElementById('fps').innerHTML = Math.round(1/dt);
				}
			},

			_update: function (dt) {
				var numSteps = 1, i,
					timeScale = 1;

				for (i = 0; i < numSteps; i++) {
					system.update(dt*timeScale/numSteps);
				}
			},

			_render: function () {
				Game._clear();
				Game._draw();
			},

			_clearCtx: function (ctx) {
				ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
				ctx.beginPath();
			},

			_clear: function () {
				Game._clearCtx(ctx.celestialBodies);
				Game._clearCtx(ctx.orbits);
			},

			_draw: function () {
				ctx.celestialBodies.save();
				ctx.orbits.save();

				var scale = 1,
					followCoords;

				ctx.celestialBodies.translate(
					ctx.celestialBodies.canvas.width/2,
					ctx.celestialBodies.canvas.height/2
				);
				ctx.orbits.translate(
					ctx.orbits.canvas.width/2,
					ctx.orbits.canvas.height/2
				);

				ctx.celestialBodies.scale(scale, scale);
				ctx.orbits.scale(scale, scale);

				if (followObject) {
					followCoords = followObject.getGlobalPosition();

					ctx.celestialBodies.translate(
						-followCoords.x,
						-followCoords.y
					);
					ctx.orbits.translate(
						-followCoords.x,
						-followCoords.y
					);
				}

				system.draw(ctx.celestialBodies, ctx.orbits);

				ctx.celestialBodies.restore();
				ctx.orbits.restore();
			},

			// TESTS CASES //
			_initEllipseTest: function (scale) {
				scale = scale || 1;

				var sun = new Attractor({
					name: 'Sun',
					x: 600,
					y: 300,
					vx: 0,
					vy: 0,

					size: 15,
					mass: 600,

					r: 200, g: 200, b: 100
				});

				system = new StellarSystem(sun);

				var planet = new Attractor({
					name: 'Planet',
					y: -50,
					x: 30,
					vy: 0,
					vx: -120*scale,

					size: 3,
					mass: 10,

					r: 100, g: 200, b: 100,

					attractor: sun
				});

				system.addCelestialBody(planet);

				var planet2 = new Attractor({
					name: 'Planet2',
					y: 20,
					x: 90,
					vy: 100*scale,
					vx: 0,

					size: 3,
					mass: 10,

					r: 200, g: 100, b: 100,

					attractor: sun
				});

				system.addCelestialBody(planet2);

				followObject = sun;
			},

			_initEllipseSimpleTransferTest: function (scale) {
				scale = scale || 1;

				var sun = new Attractor({
					name: 'Sun',
					x: 600,
					y: 300,
					vx: 0,
					vy: 0,

					size: 15,
					mass: 600,

					r: 200, g: 200, b: 100
				});

				system = new StellarSystem(sun);

				var planet = new Attractor({
					name: 'Planet',
					y: -50,
					x: 30,
					vy: 0,
					vx: -120*scale,

					size: 3,
					mass: 10,

					r: 100, g: 200, b: 100,

					attractor: sun
				});

				system.addCelestialBody(planet);

				var planet2 = new Attractor({
					name: 'Planet2',
					y: 20,
					x: 90,
					vy: -100*scale,
					vx: 0,

					size: 3,
					mass: 10,

					r: 200, g: 100, b: 100,

					attractor: sun
				});

				system.addCelestialBody(planet2);

				var spaceship = new Orbiter({
					name: 'Spaceship',
					y: 0,
					x: 10,
					vy: -40*scale,
					vx: 0,

					size: 2,
					mass: 0,

					r: 200, g: 200, b: 200,

					attractor: planet
				});

				system.addCelestialBody(spaceship);

				followObject = sun;
			},

			_initHyperbolicTest: function (scale) {
				scale = scale || 1;

				var sun = new Attractor({
					name: 'Sun',
					x: 600,
					y: 300,
					vx: 0,
					vy: 0,

					size: 15,
					mass: 600,

					r: 200, g: 200, b: 100
				});

				system = new StellarSystem(sun);

				var planet = new Attractor({
					name: 'Planet',
					y: -50,
					x: 110,
					vy: 0,
					vx: -160*scale,

					size: 3,
					mass: 10,

					r: 100, g: 200, b: 100,

					attractor: sun
				});

				system.addCelestialBody(planet);

				var planet2 = new Attractor({
					name: 'Planet2',
					y: 110,
					x: 90,
					vy: 130*scale,
					vx: 0,

					size: 3,
					mass: 10,

					r: 200, g: 100, b: 100,

					attractor: sun
				});

				system.addCelestialBody(planet2);

				followObject = sun;
			},

			_initHyperbolicSimpleTransferTest: function (scale) {
				scale = scale || 1;

				var sun = new Attractor({
					name: 'Sun',
					x: 600,
					y: 300,
					vx: 0,
					vy: 0,

					size: 15,
					mass: 600,

					r: 200, g: 200, b: 100
				});

				system = new StellarSystem(sun);

				var planet = new Attractor({
					name: 'Planet',
					y: -50,
					x: 30,
					vy: 0,
					vx: -120*scale,

					size: 3,
					mass: 10,

					r: 100, g: 200, b: 100,

					attractor: sun
				});

				system.addCelestialBody(planet);

				var spaceship = new Orbiter({
					name: 'Yellow Spaceship',
					y: 0,
					x: 10,
					vy: -45*scale,
					vx: 0,

					size: 2,
					mass: 0,

					r: 255, g: 255, b: 0,

					attractor: planet
				});

				system.addCelestialBody(spaceship);

				var spaceship2 = new Orbiter({
					name: 'Purple Spaceship',
					y: 0,
					x: 10,
					vy: 39*scale,
					vx: 0,

					size: 2,
					mass: 0,

					r: 255, g: 0, b: 255,

					attractor: planet
				});

				system.addCelestialBody(spaceship2);

				followObject = sun;
			},

			_initHyperbolicComplexTransferTest: function (scale) {
				scale = scale || 1;

				var sun = new Attractor({
					name: 'Sun',
					x: 600,
					y: 300,
					vx: 0,
					vy: 0,

					size: 15,
					mass: 600,

					r: 200, g: 200, b: 100
				});

				system = new StellarSystem(sun);

				var planet = new Attractor({
					name: 'Planet',
					y: -50,
					x: 0,
					vy: 0,
					vx: -139*scale,

					size: 3,
					mass: 10,

					r: 100, g: 200, b: 100,

					attractor: sun
				});

				system.addCelestialBody(planet);

				var spaceshipY = new Orbiter({
					name: 'Yellow Spaceship',
					x: -20,
					y: 0,
					vx: 0,
					vy: 30*scale,

					size: 2,
					mass: 0,

					r: 255, g: 255, b: 0,

					attractor: planet
				});

				system.addCelestialBody(spaceshipY);

				var spaceshipP = new Orbiter({
					name: 'Purple Spaceship',
					x: 115,
					y: 0,
					vx: 0,
					vy: 86*scale,

					size: 2,
					mass: 0,

					r: 255, g: 0, b: 255,

					attractor: sun
				});

				system.addCelestialBody(spaceshipP);

				var spaceshipT = new Orbiter({
					name: 'Teal Spaceship',
					x: -80,
					y: 0,
					vx: 0,
					vy: -60*scale,

					size: 2,
					mass: 0,

					r: 0, g: 255, b: 255,

					attractor: sun
				});

				system.addCelestialBody(spaceshipT);

				followObject = sun;
			}
		};

		return Game;
	}
);
