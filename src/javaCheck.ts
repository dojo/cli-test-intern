const { exec } = require('child_process');
import { TestArgs } from './main';

function requiresTunnel(args: TestArgs) {
	const { all, functional, config } = args;
	return all || functional || ( config != null && config !== 'local');
}

function containsVersionString(str: string): boolean {
	return str != null && str.indexOf('java version') >= 0;
}

export default function (args: TestArgs) {
	return new Promise<boolean>((resolve) => {
		if (!requiresTunnel(args)) {
			resolve(true);
		} else {
			exec('java -version', (err: Error, stdout: string, stderr: string) => {
				resolve(!err && (containsVersionString(stderr) || containsVersionString(stdout)));
			});
		}
	});
}
