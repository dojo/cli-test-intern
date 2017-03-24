import { red, blue, green } from 'chalk';
import { accessSync, constants, unlinkSync } from 'fs';
import * as path from 'path';
import * as MemoryStore from 'istanbul/lib/store/memory';
import { loadCoverage, remap, writeReport } from 'remap-istanbul/lib/main';
import { TestArgs } from './main';

const projectName = require(path.join(process.cwd(), './package.json')).name;

const REMAP_EXCLUDE_PATTERN = /^webpack:[\/]{1,3}((node_modules|tests|~|\(?webpack\)?)\/|external\s)/;

export default async function remapCoverage(testArgs: TestArgs): Promise<void[]> {

	function checkCoverageFinal() {
		try {
			accessSync('coverage-final.json', constants.W_OK | constants.R_OK);
		}
		catch (e) {
			return false;
		}
		return true;
	}

	if (testArgs.debug) {
		console.log(blue.bold('\nRemapping coverage...\n'));
		console.log(blue('Exclude Pattern: ' + REMAP_EXCLUDE_PATTERN));
		console.log(blue('Coverage File Accessible: ' + checkCoverageFinal()));
		if (testArgs.coverage) {
			console.log(blue('Outputting Extra Coverage Files'));
			console.log(blue('HTML Report: ' + path.join(process.cwd(), testArgs.output, 'html-report')));
			console.log(blue('JSON Report: ' + path.join(process.cwd(), testArgs.output, 'coverage-final.json')));
			console.log(blue('LCOV Report: ' + path.join(process.cwd(), testArgs.output, 'coverage-final.lcov')));
		}
	}

	if (checkCoverageFinal()) {
		const sources = new MemoryStore();
		const collector = remap(loadCoverage('coverage-final.json'), {
			exclude(filename: string) {
				if (testArgs.debug) {
					console.log(blue(`${REMAP_EXCLUDE_PATTERN.test(filename) ? red('Exclude') : green('Include') }: ${filename}`));
				}
				return REMAP_EXCLUDE_PATTERN.test(filename);
			},

			sources,

			warn(message, ...args: any[]) {
				console.warn(message, ...args);
			}
		});

		unlinkSync('coverage-final.json');

		const reports = [ (() => {
			console.log(blue.bgWhite.bold(`\n Code coverage for "${projectName}":`) + '\n');
			return writeReport(collector, 'text', {}, null, sources);
		})() ];

		if (testArgs.coverage) {
			console.log(blue.bold('Additional coverage reports written to: ') + blue(testArgs.output) + '\n');
			reports.push(writeReport(collector, 'html', {}, path.join(process.cwd(), testArgs.output, 'html-report'), sources));
			reports.push(writeReport(collector, 'json', {}, path.join(process.cwd(), testArgs.output, 'coverage-final.json'), sources));
			reports.push(writeReport(collector, 'lcovonly', {}, path.join(process.cwd(), testArgs.output, 'coverage-final.lcov'), sources));
		}

		return Promise.all(reports);
	}
	else {
		return Promise.resolve([]);
	}
};
