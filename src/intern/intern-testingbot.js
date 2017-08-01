define([
	'./intern-local'
], function (intern) {

	intern.environments = [
		{ browserName: 'internet explorer', version: [ '11' ], platform: 'WIN8' },
		{ browserName: 'firefox', version: '49', platform: 'WIN10' },
		{ browserName: 'chrome', platform: 'WIN10' }
	];

	/* Testingbot supports more max concurrency */
	intern.maxConcurrency = 3;
	intern.tunnel = 'TestingBotTunnel';
	intern.webdriver = {
		host: 'http://hub.testingbot.com/wd/hub',
		username: 'key',
		accessKey: 'secret'
	};

	intern.tunnelOptions = {
		verbose: true,
		apiKey: 'key',
		apiSecret: 'secret'
	};
	intern.useSauceConnect = false;

	return intern;
});
