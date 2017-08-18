// Default desired capabilities for all environments. Individual capabilities can be overridden by any of the
// specified browser environments in the `environments` array below as well. See
// https://code.google.com/p/selenium/wiki/DesiredCapabilities for standard Selenium capabilities and
// https://saucelabs.com/docs/additional-config#desired-capabilities for Sauce Labs capabilities.
// Note that the `build` capability will be filled in with the current commit ID from the Travis CI environment
// automatically
export const capabilities = {
	project: 'Dojo 2',
	name: '@dojo/cli-test-intern'
};

// Non-functional test suite(s) to run in each browser
export const suites = [ '_build/tests/unit/all' ];

export const coverage = '_build/src/**/*.js';
