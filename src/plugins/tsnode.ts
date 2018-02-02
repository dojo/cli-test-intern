import Node from 'intern/lib/executors/Node';

declare const intern: Node;

const PLUGIN_NAME = 'ts-node';

/**
 * TypeScript Intern plugin for Node.js
 *
 * This plugin augments Node.js's `require` method to allow for run-time loading and compiling of TypeScript files
 */
intern.registerPlugin(PLUGIN_NAME, (options?: any) => {
	if (intern.environment !== 'node') {
		intern.emit('warning', `${PLUGIN_NAME} cannot run outside of a nodejs environment`);
	}

	const tsnode = require('ts-node');
	options ? tsnode.register(options) : tsnode.register();
});
