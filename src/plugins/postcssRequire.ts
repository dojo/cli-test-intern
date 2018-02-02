import Node from 'intern/lib/executors/Node';

declare const intern: Node;

const PLUGIN_NAME = 'postcss-node';

/**
 * PostCSS Intern plugin for Node.js
 *
 * This plugin augments Node.js's `require` method to allow for run-time loading and compiling of css files
 */
intern.registerPlugin(PLUGIN_NAME, (options: any = {}) => {
	if (intern.environment !== 'node') {
		intern.emit('warning', `${PLUGIN_NAME} cannot run outside of a nodejs environment`);
	}

	const hook = require('css-modules-require-hook');
	hook(options);
});
