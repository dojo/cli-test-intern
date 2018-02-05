import * as jsdom from 'jsdom';
import { readFileSync } from 'fs';
import * as path from 'path';

const units = readFileSync(path.join('output', 'test', 'unit.js'), 'utf-8');

const window: any = new jsdom.JSDOM(
	`
<!DOCTYPE html>
<html>
<head></head>
<body></body>
<html>
`,
	{
		runScripts: 'outside-only',
		pretendToBeVisual: true,
		beforeParse(window: any) {
			window.intern = intern;
		}
	} as any
).window;
window.eval(units);
