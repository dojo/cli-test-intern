import Node from 'intern/lib/executors/Node';

declare const intern: Node;

const PLUGIN_NAME = 'placeholder-node';

export interface Options {
	extensions?: string[];
}

export interface CodeCompiler {
	(code: string, filename: string, compile: any, mod: NodeModule): any;
}

function registerExtension(extension: string, handler: CodeCompiler) {
	const original = require.extensions[extension] || require.extensions['.js'];

	require.extensions[extension] = (mod: NodeModule | any, filename: string) => {
		const oldCompile = mod._compile;
		mod._compile = function(code: string, filename: string) {
			return handler.call(this, code, filename, oldCompile, mod);
		};
		return original(mod, filename);
	};
}

function registerProxyExtension(extension: string) {
	const proxy = new Proxy(
		{},
		{
			get(target: any, propertyName: PropertyKey) {
				if (propertyName in target) {
					return target[propertyName];
				}
				if (typeof propertyName === 'string') {
					return propertyName;
				}
			}
		}
	);

	registerExtension(extension, (code, filename, oldCompile, mod) => {
		mod.exports = proxy;
	});
}

/**
 * A placeholder Intern plugin for Node.js.
 *
 * This plugin augments Node.js's `require` to automatically return string "placeholders"
 */
intern.registerPlugin(PLUGIN_NAME, (options: Options | undefined) => {
	if (intern.environment !== 'node') {
		intern.emit('warning', `${PLUGIN_NAME} cannot run outside of a nodejs environment`);
	}
	if (options) {
		const { extensions = [] } = options;

		for (let extension of extensions) {
			registerProxyExtension(extension);
		}
	}

	return registerExtension;
});
