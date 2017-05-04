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

		var system;

		var benchmarking = 0.99;

		var Game = {
			init: function () {
				Game._initCtx();
				Game._initSystem();

				start(Game._doStep, 100, 50000);
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

				var sun = new CelestialBody({
					name: 'Sun',
					x: 400,
					y: 300,
					size: 15,
					mass: 600,

					r: 200, g: 200, b: 100
				});

				var planet = new CelestialBody({
					name: 'Planet',
					x: -150,
					y: 0,
					size: 3,
					mass: 10,

					r: 100, g: 200, b: 100,
					orbitAnticlockwise: Math.random() > 0.5
				});

				system.addCelestialBody(planet);

				var spaceship = new CelestialBody({
					name: 'Spaceship',
					x: -30,
					y: 0,
					size: 2,
					mass: 0,

					r: 255, g: 255, b: 255,
					orbitParent: planet,
					orbitAnticlockwise: Math.random() > 0.5
				});

				system.addCelestialBody(spaceship);

				var planet2 = new CelestialBody({
					name: 'Planet 2',
					x: -200,
					y: 200,
					size: 4,
					mass: 10,

					r: 200, g: 100, b: 100,
					orbitAnticlockwise: Math.random() > 0.5
				});

				system.addCelestialBody(planet2);
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
