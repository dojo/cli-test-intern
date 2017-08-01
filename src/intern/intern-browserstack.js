define([
	'./intern-local'
], function (intern) {
	intern.tunnel = 'BrowserStackTunnel';
	intern.tunnelOptions = {};
	intern.maxConcurrency = 2;

	intern.environments = [
		{ browserName: 'internet explorer', version: [ '11' ], platform: 'WINDOWS' },
		{ browserName: 'firefox', platform: 'WINDOWS' },
		{ browserName: 'chrome', platform: 'WINDOWS' }
	];

	return intern;
});
