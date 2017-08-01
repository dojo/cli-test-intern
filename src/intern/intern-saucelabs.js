define([
	'./intern-local'
], function (intern) {

	intern.environments = [
		{ browserName: 'internet explorer', version: [ '11.0' ], platform: 'Windows 7' },
		{ browserName: 'firefox', version: '49', platform: 'Windows 10' },
		{ browserName: 'chrome', platform: 'Windows 10' }
	];

	/* SauceLabs supports more max concurrency */
	intern.maxConcurrency = 4;

	/* SauceLabs combined with Travis often causes functional tests to fail with too short a timeout */
	intern.defaultTimeout = 10000;

	intern.tunnel = 'SauceLabsTunnel';
    intern.tunnelOptions = {};

	return intern;
});
