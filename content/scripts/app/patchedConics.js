define(
	[
		'util/start',

		'stellarSystem/stellarSystem',
		'stellarSystem/celestialBody'
	],

	function (start, StellarSystem, CelestialBody) {
		var ctx = {};

		// For debugging purposes
		window.ctx = ctx;
		window.debug = true;

		var system;

		var benchmarking = 0.99;

		var Game = {
			init: function () {
				Game._initCtx();
				Game._initSystem();

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
				system = new StellarSystem();

				var planet = new CelestialBody({
					name: 'Planet',
					x: -150,
					y: 0,
					size: 3,
					mass: 10,

					r: 100, g: 200, b: 100,
					orbitAnticlockwise: true
				});

				system.addCelestialBody(planet);

				var spaceshipE = new CelestialBody({
					name: 'Spaceship E',
					x: -30,
					y: 0,
					size: 2,
					mass: 0,

					r: 0, g: 255, b: 255,
					orbitParent: planet,
					orbitAnticlockwise: false
				});

				// system.addCelestialBody(spaceshipE);

				var spaceshipH = new CelestialBody({
					name: 'Spaceship H',
					x: -180,
					y: 0,
					size: 2,
					mass: 0,

					r: 255, g: 0, b: 255,
					// orbitParent: planet,
					// orbitAnticlockwise: true
				});

				system.addCelestialBody(spaceshipH);

				// var planet2 = new CelestialBody({
				// 	name: 'Planet 2',
				// 	x: -200,
				// 	y: 200,
				// 	size: 4,
				// 	mass: 10,

				// 	r: 200, g: 100, b: 100,
				// 	orbitAnticlockwise: Math.random() > 0.5
				// });

				// system.addCelestialBody(planet2);

				// var spaceship2 = new CelestialBody({
				// 	name: 'Spaceship2',
				// 	x: -55,
				// 	y: 0,
				// 	size: 2,
				// 	mass: 0,

				// 	r: 255, g: 255, b: 0,
				// 	orbitParent: planet2,
				// 	orbitAnticlockwise: Math.random() > 0.5
				// });

				// system.addCelestialBody(spaceship2);
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
				system.update(dt);
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
				system.draw(ctx.celestialBodies, ctx.orbits);
			}
		};

		return Game;
	}
);
