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
					vx: -139,

					size: 3,
					mass: 10,

					r: 100, g: 200, b: 100,

					orbitParent: sun
				});

				system.addCelestialBody(planet);

				var spaceshipH = new CelestialBody({
					name: 'Spaceship H',
					x: 115,
					y: 0,
					vx: 0,
					vy: 86,

					size: 2,
					mass: 0,

					r: 255, g: 0, b: 255,

					orbitParent: sun,
					orbitAnticlockwise: true
				});

				system.addCelestialBody(spaceshipH);
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
