import Node from 'intern/lib/executors/Node';
import { join, basename } from 'path';
import { existsSync } from 'fs';

declare const intern: Node;

const PLUGIN_NAME = 'postcss-node';

const basePath = process.cwd();
const packageJsonPath = join(basePath, 'package.json');
const packageJson = existsSync(packageJsonPath) ? require(packageJsonPath) : {};
const packageName = packageJson.name || '';

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

	/**
	 * Dojo themes require a ` _key` property, but css-modules-require-hook doesn't have a way to process the result
	 * after a module has been generated (only to process CSS).  So instead, we need to wrap the css hook and manually
	 * create the ` _key` required by theming.
	 */
	const postCssExtension = require.extensions['.css'];
	require.extensions['.css'] = (m, filename) => {
		postCssExtension(m, filename);

		m.exports = {
			' _key': `${packageName}/${basename(filename, '.m.css')}`,
			...m.exports
		};

		return m;
	};
});
