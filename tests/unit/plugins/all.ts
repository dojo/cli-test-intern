if (intern.environment === 'node') {
	// These node.js specific tests have node-only dependencies (i.e. mockery)
	require('./jsdom');
	require('./postcssRequire');
	require('./registerExtension');
	require('./tsnode');
}
