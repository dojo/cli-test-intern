define([
	'./intern'
], function (intern) {
	intern.tunnel = 'SeleniumTunnel';
	intern.tunnelOptions = {
		hostname: 'localhost',
		port: '4444'
	};

	intern.environments = [
		{ browserName: 'chrome' }
	];

	return intern;
});
