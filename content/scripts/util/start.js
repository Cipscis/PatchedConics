define(
	[],

	function () {
		return function (callback, maxDt, inactiveTimeout) {
			var time = 0;

			var doCallback = function (timestamp) {
				var dt = time ? (timestamp - time)/1000 : 0;
				time = timestamp;
				if (inactiveTimeout && dt > inactiveTimeout) {
					dt = 0;
				} else if (maxDt && dt > maxDt) {
					dt = maxDt;
				}

				callback(dt);

				requestAnimationFrame(doCallback);
			};

			requestAnimationFrame(doCallback);
		};
	}
);