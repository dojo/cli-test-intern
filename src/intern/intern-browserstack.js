define([
	'./intern'
], function (intern) {
	intern.tunnel = 'BrowserstackTunnel';
	intern.tunnelOptions = {};
	intern.maxConcurrency = 2;

	intern.environments = [
		{ browserName: 'internet explorer', version: [ '10', '11' ], platform: 'WINDOWS' },
		{ browserName: 'firefox', platform: 'WINDOWS' },
		{ browserName: 'chrome', platform: 'WINDOWS' }
	];

	return intern;
});
