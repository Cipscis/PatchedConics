define(
	[
		'util/start',

		'celestialBody/celestialBody'
	],

	function (start, CelestialBody) {
		var ctx = {};

		// For debugging purposes
		window.ctx = ctx;

		var cb = [];

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
				var sun = new CelestialBody({
					name: 'Sun',
					x: 400,
					y: 300,
					size: 50,
					mass: 100,

					r: 200, g: 200, b: 100
				});

				cb.push(sun);

				var planet = new CelestialBody({
					name: 'Planet',
					x: -150,
					y: 0,
					size: 10,
					mass: 10,

					r: 100, g: 200, b: 100,
					orbitParent: sun,
					orbitAnticlockwise: Math.random() > 0.5
				});

				cb.push(planet);

				var moon = new CelestialBody({
					name: 'Moon',
					x: -30,
					y: 0,
					size: 3,

					r: 255, g: 255, b: 255,
					orbitParent: planet,
					orbitAnticlockwise: Math.random() > 0.5
				});

				cb.push(moon);
				window.sun = sun;

				document.getElementById('celestial-bodies').addEventListener('click', function () {
					moon.recalculateOrbit(sun, true);
				});

				var planet2 = new CelestialBody({
					name: 'Planet 2',
					x: -200,
					y: 200,
					size: 12,

					r: 200, g: 100, b: 100,
					orbitParent: sun,
					orbitAnticlockwise: Math.random() > 0.5
				});

				// cb.push(planet2);
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
				var i;

				for (i = 0; i < cb.length; i++) {
					cb[i].update(dt);
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
				for (i = 0; i < cb.length; i++) {
					cb[i].draw(ctx.celestialBodies);
					cb[i].drawOrbit(ctx.orbits);
				}
			}
		};

		return Game;
	}
);
