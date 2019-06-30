import Node from 'intern/lib/executors/Node';
import { JSDOM, Options as JSDOMOptions } from 'jsdom';
import global from '@dojo/framework/shim/global';
import { add as hasAdd, exists } from '@dojo/framework/core/has';

declare const intern: Node;

const PLUGIN_NAME = 'jsdom';

export interface Options {
	global?: boolean;
}

declare global {
	interface Window {
		CustomEvent: typeof CustomEvent;
		CSSStyleDeclaration: typeof CSSStyleDeclaration;
	}
}

interface JSDOMSecretOptions extends JSDOMOptions {
	pretendToBeVisual: boolean;
}

intern.registerPlugin(PLUGIN_NAME, (options?: Options) => {
	if (intern.environment !== 'node') {
		intern.emit('warning', `${PLUGIN_NAME} cannot run outside of a nodejs environment`);
	}

	const jsdom = require('jsdom');

	function createDom() {
		return new jsdom.JSDOM(
			`
		<!DOCTYPE html>
		<html>
		<head></head>
		<body></body>
		<html>
	`,
			{
				pretendToBeVisual: true,
				runScripts: 'dangerously'
			} as JSDOMSecretOptions
		);
	}

	function globalizeDom(dom: JSDOM) {
		global.window = dom.window;
		const doc = (global.document = global.window.document);
		global.DOMParser = global.window.DOMParser;
		global.Element = global.window.Element;

		Object.defineProperty(
			window.CSSStyleDeclaration.prototype,
			'transition',
			Object.getOwnPropertyDescriptor((<any>window).CSSStyleDeclaration.prototype, 'webkitTransition')!
		);

		hasAdd('jsdom', true);

		return doc;
	}

	if (options && options.global) {
		if (!('document' in global)) {
			const dom = createDom();
			globalizeDom(dom);
		} else {
			if (!exists('jsdom')) {
				hasAdd('jsdom', false);
			}
		}
	}

	return {
		createDom,
		jsdom,
		globalizeDom
	};
});
