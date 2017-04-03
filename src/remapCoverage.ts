import { red, blue, green, underline, yellow } from 'chalk';
import { accessSync, constants, unlinkSync } from 'fs';
import * as path from 'path';
import * as MemoryStore from 'istanbul/lib/store/memory';
import { loadCoverage, remap, writeReport } from 'remap-istanbul/lib/main';
import { TestArgs } from './main';

const process: NodeJS.Process = require('process');
const projectName = require(path.join(process.cwd(), './package.json')).name;

/**
 * Returns true for files that should be remapped.
 *
 * Matches files that don't start with `webpack:/` and end in `.js` (likely bundles)
 * Or matches files that start with `webpack:///src/` but don't have an extension like `.css?`
 */
const REMAP_INCLUDE_PATTERN = /^(?:(?!webpack:\/).*\.js|webpack:\/{3}src\/(?!.*\.css\?))/;

export default async function remapCoverage(testArgs: TestArgs) {

	function checkCoverageFinal() {
		try {
			accessSync('coverage-final.json', constants.W_OK | constants.R_OK);
		}
		catch (e) {
			return false;
		}
		return true;
	}

	if (testArgs.verbose) {
		console.log('\n' + underline('remapping coverage...') + '\n');
		console.log(blue('  Include Pattern: ' + REMAP_INCLUDE_PATTERN));
		console.log(blue('  Coverage File Accessible: ' + checkCoverageFinal()));
		console.log(blue('  HTML Report: ' + path.join(process.cwd(), testArgs.output, 'html-report')));
		console.log(blue('  JSON Report: ' + path.join(process.cwd(), testArgs.output, 'coverage-final.json')));
		console.log(blue('  LCOV Report: ' + path.join(process.cwd(), testArgs.output, 'coverage-final.lcov')));
	}

	if (checkCoverageFinal()) {
		const sources = new MemoryStore();
		const collector = remap(loadCoverage('coverage-final.json'), {
			exclude(filename) {
				if (testArgs.verbose) {
					console.log(blue(`${!REMAP_INCLUDE_PATTERN.test(filename) ? red.bold('  excluding') : green.bold('  including') } "${filename}"`));
				}
				return !REMAP_INCLUDE_PATTERN.test(filename);
			},

			mapFileName(filename) {
				const mappedFileName = filename
					.replace(/\?\S+$/, '')
					.replace(/^webpack:\/{3}/, '');
				if (testArgs.verbose) {
					console.log(yellow(`  mapping`) + blue(` "${filename}" to "${mappedFileName}"`));
				}
				return mappedFileName;
			},

			sources,

			warn(message, ...args) {
				if (message instanceof Error && message.message.includes('Could not find source map for')) {
					console.log(yellow.bold(`  WARN: `) + yellow(message.message));
				}
				else {
					console.warn(message, ...args);
				}
			}
		});

		unlinkSync('coverage-final.json');

		const reports = [ (() => {
			console.log('\n' + underline(`code coverage for "${projectName}"...`) + '\n');
			return writeReport(collector, 'text', {}, null, sources);
		})() ];

		console.log(yellow('  writing') + ` coverage reports to: "${testArgs.output}"\n`);
		reports.push(writeReport(collector, 'html', {}, path.join(process.cwd(), testArgs.output, 'html-report'), sources));
		reports.push(writeReport(collector, 'json', {}, path.join(process.cwd(), testArgs.output, 'coverage-final.json'), sources));
		reports.push(writeReport(collector, 'lcovonly', {}, path.join(process.cwd(), testArgs.output, 'lcov.info'), sources));

		return Promise.all(reports);
	}
	else {
		return Promise.resolve([]);
	}
};
