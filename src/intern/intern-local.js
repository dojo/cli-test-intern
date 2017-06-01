define({
	proxyPort: 9000,

	// A fully qualified URL to the Intern proxy
	proxyUrl: 'http://localhost:9000/',

	// Browsers to run integration testing against. Note that version numbers must be strings if used with Sauce
	// OnDemand. Options that will be permutated are browserName, version, platform, and platformVersion; any other
	// capabilities options specified for an environment will be copied as-is
	environments: [
		{ browserName: 'chrome' }
	],

	// Maximum number of simultaneous integration tests that should be executed on the remote WebDriver service
	maxConcurrency: 2,

	// Name of the tunnel class to use for WebDriver tests
	tunnel: 'SeleniumTunnel',
	tunnelOptions: {
		hostname: 'localhost',
		port: '4444'
	},
	// Support running unit tests from a web server that isn't the intern proxy
	initialBaseUrl: (function () {
		if (typeof location !== 'undefined' && location.pathname.indexOf('__intern/') > -1) {
			return '/';
		}
		return null;
	})(),

	// The desired AMD loader to use when running unit tests (client.html/client.js). Omit to use the default Dojo
	// loader
	loaders: {
		'host-browser': 'node_modules/@dojo/loader/loader.js',
		'host-node': '@dojo/loader'
	},

	// Configuration options for the module loader; any AMD configuration options supported by the specified AMD loader
	// can be used here
	loaderOptions: {
		// Packages that should be registered with the loader in each testing environment
		packages: [
			{ name: 'src', location: '_build/src' },
			{ name: 'tests', location: '_build/tests' },
			{ name: 'dojo', location: 'node_modules/intern/browser_modules/dojo' },
			{ name: 'sinon', location: 'node_modules/sinon/pkg', main: 'sinon' },
			{ name: '@dojo', location: 'node_modules/@dojo' }
		]
	},

	// Non-functional test suite(s) to run in each browser
	suites: [ '@dojo/test-extras/support/loadJsdom', 'tests/unit/all' ],

	// Functional test suite(s) to run in each browser once non-functional tests are completed
	functionalSuites: [ 'tests/functional/all' ],

	// A regular expression matching URLs to files that should not be included in code coverage analysis
	excludeInstrumentation: /(?:node_modules|_build\/src)[\/]/,

	defaultTimeout: 15000
});
