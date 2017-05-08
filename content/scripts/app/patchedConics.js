define(
	[
		'util/start',

		'stellarSystem/stellarSystem',
		'stellarSystem/celestialBody'
	],

	function (start, StellarSystem, CelestialBody) {
		var ctx = {};

		// For debugging purposes
		window.debug = true;
		window.debugCB = null;

		var system;

		var benchmarking = 0.99;

		var Game = {
			init: function () {
				Game._initCtx();
				// Game._initEllipseTest(1);
				// Game._initHyperbolicTest(1);

				// Game._initEllipseSimpleTransferTest(1);

				// Game._initHyperbolicSimpleTransferTest(1);
				// Game._initHyperbolicSimpleTransferTest(0.9);

				Game._initHyperbolicComplexTransferTest(1);

				start(Game._doStep, 100, 0.5);
			},

			_initCtx: function () {
				var canvas = {};

				canvas.orbits = document.getElementById('orbits');
				canvas.celestialBodies = document.getElementById('celestial-bodies');

				ctx.orbits = canvas.orbits.getContext('2d');
				ctx.celestialBodies = canvas.celestialBodies.getContext('2d');
			},

			_initEllipseTest: function (scale) {
				scale = scale || 1;

				var sun = new CelestialBody({
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

				var planet = new CelestialBody({
					name: 'Planet',
					y: -50,
					x: 30,
					vy: 0,
					vx: -120*scale,

					size: 3,
					mass: 10,

					r: 100, g: 200, b: 100,

					orbitParent: sun
				});

				system.addCelestialBody(planet);

				var planet2 = new CelestialBody({
					name: 'Planet2',
					y: 20,
					x: 90,
					vy: 100*scale,
					vx: 0,

					size: 3,
					mass: 10,

					r: 200, g: 100, b: 100,

					orbitParent: sun
				});

				system.addCelestialBody(planet2);

				window.debugCB = planet2;
			},

			_initEllipseSimpleTransferTest: function (scale) {
				scale = scale || 1;

				var sun = new CelestialBody({
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

				var planet = new CelestialBody({
					name: 'Planet',
					y: -50,
					x: 30,
					vy: 0,
					vx: -120*scale,

					size: 3,
					mass: 10,

					r: 100, g: 200, b: 100,

					orbitParent: sun
				});

				system.addCelestialBody(planet);

				var planet2 = new CelestialBody({
					name: 'Planet2',
					y: 20,
					x: 90,
					vy: -100*scale,
					vx: 0,

					size: 3,
					mass: 10,

					r: 200, g: 100, b: 100,

					orbitParent: sun
				});

				system.addCelestialBody(planet2);

				var spaceship = new CelestialBody({
					name: 'Spaceship',
					y: 0,
					x: 10,
					vy: -40*scale,
					vx: 0,

					size: 2,
					mass: 0,

					r: 200, g: 200, b: 200,

					orbitParent: planet
				});

				system.addCelestialBody(spaceship);

				window.debugCB = spaceship;
			},

			_initHyperbolicTest: function (scale) {
				scale = scale || 1;

				var sun = new CelestialBody({
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

				var planet = new CelestialBody({
					name: 'Planet',
					y: -50,
					x: 110,
					vy: 0,
					vx: -160*scale,

					size: 3,
					mass: 10,

					r: 100, g: 200, b: 100,

					orbitParent: sun
				});

				system.addCelestialBody(planet);

				var planet2 = new CelestialBody({
					name: 'Planet2',
					y: 110,
					x: 90,
					vy: 130*scale,
					vx: 0,

					size: 3,
					mass: 10,

					r: 200, g: 100, b: 100,

					orbitParent: sun
				});

				system.addCelestialBody(planet2);

				window.debugCB = planet2;
			},

			_initHyperbolicSimpleTransferTest: function (scale) {
				scale = scale || 1;

				var sun = new CelestialBody({
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

				var planet = new CelestialBody({
					name: 'Planet',
					y: -50,
					x: 30,
					vy: 0,
					vx: -120*scale,

					size: 3,
					mass: 10,

					r: 100, g: 200, b: 100,

					orbitParent: sun
				});

				system.addCelestialBody(planet);

				var spaceship = new CelestialBody({
					name: 'Yellow Spaceship',
					y: 0,
					x: 10,
					vy: -45*scale,
					vx: 0,

					size: 2,
					mass: 0,

					r: 255, g: 255, b: 0,

					orbitParent: planet
				});

				system.addCelestialBody(spaceship);

				var spaceship2 = new CelestialBody({
					name: 'Purple Spaceship',
					y: 0,
					x: 10,
					vy: 39*scale,
					vx: 0,

					size: 2,
					mass: 0,

					r: 255, g: 0, b: 255,

					orbitParent: planet
				});

				system.addCelestialBody(spaceship2);

				window.debugCB = spaceship2;
			},

			_initHyperbolicComplexTransferTest: function (scale) {
				scale = scale || 1;

				var sun = new CelestialBody({
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

				var planet = new CelestialBody({
					name: 'Planet',
					y: -50,
					x: 0,
					vy: 0,
					vx: -139*scale,

					size: 3,
					mass: 10,

					r: 100, g: 200, b: 100,

					orbitParent: sun
				});

				system.addCelestialBody(planet);

				var spaceshipY = new CelestialBody({
					name: 'Yellow Spaceship',
					x: -20,
					y: 0,
					vx: 0,
					vy: 30*scale,

					size: 2,
					mass: 0,

					r: 255, g: 255, b: 0,

					orbitParent: planet,
					orbitAnticlockwise: true
				});

				system.addCelestialBody(spaceshipY);

				var spaceshipP = new CelestialBody({
					name: 'Purple Spaceship',
					x: 115,
					y: 0,
					vx: 0,
					vy: 86*scale,

					size: 2,
					mass: 0,

					r: 255, g: 0, b: 255,

					orbitParent: sun,
					orbitAnticlockwise: true
				});

				system.addCelestialBody(spaceshipP);

				var spaceshipT = new CelestialBody({
					name: 'Teal Spaceship',
					x: -80,
					y: 0,
					vx: 0,
					vy: -60*scale,

					size: 2,
					mass: 0,

					r: 0, g: 255, b: 255,

					orbitParent: sun,
					orbitAnticlockwise: true
				});

				system.addCelestialBody(spaceshipT);

				window.debugCB = spaceshipT;
			},

			_doStep: function (dt) {
				Game._clear(); // Moved here from _render for debugging purposes involving drawing in the _update step
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
				// Game._clear();
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

				var scale = 1;

				ctx.celestialBodies.scale(scale, scale);
				ctx.orbits.scale(scale, scale);

				system.draw(ctx.celestialBodies, ctx.orbits);

				ctx.celestialBodies.restore();
				ctx.orbits.restore();
			}
		};

		return Game;
	}
);
