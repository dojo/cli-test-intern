import global from '@dojo/shim/global';
import { add as hasAdd, exists } from '@dojo/has/has';

declare global {
	interface Window {
		CustomEvent: typeof CustomEvent;
		CSSStyleDeclaration: typeof CSSStyleDeclaration;
	}
}

let doc: Document;

if (!('document' in global)) {
	const jsdom = require('jsdom');
	const dom = new jsdom.JSDOM(
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
		}
	);

	global.window = dom.window;
	doc = global.document = global.window.document;
	global.DOMParser = global.window.DOMParser;
	global.Element = global.window.Element;

	Object.defineProperty(
		window.CSSStyleDeclaration.prototype,
		'transition',
		Object.getOwnPropertyDescriptor((<any>window).CSSStyleDeclaration.prototype, 'webkitTransition')!
	);

	hasAdd('jsdom', true);
} else {
	doc = document;
	/* istanbul ignore else */
	if (!exists('jsdom')) {
		hasAdd('jsdom', false);
	}
}

export default doc;
