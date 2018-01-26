const { exec } = require('child_process');
import { TestArgs } from './main';

function requiresTunnel(args: TestArgs) {
	const { all, functional, config } = args;
	return all || functional || (config != null && config !== 'local');
}

function containsVersionString(str: string): boolean {
	return str != null && str.indexOf('java version') >= 0;
}

export default function(args: TestArgs) {
	return new Promise<boolean>((resolve) => {
		if (!requiresTunnel(args)) {
			resolve(true);
		} else {
			exec('java -version', (err: Error, stdout: string, stderr: string) => {
				if (!err && (containsVersionString(stderr) || containsVersionString(stdout))) {
					resolve(true);
				} else {
					// Dereference the environment variables here so the exec script does not have to use
					// an operating system specific way to dereference an environment variable.
					const javaHome = process.env.JAVA_HOME || process.env.JDK_HOME || process.env.JRE_HOME;
					if (javaHome) {
						exec(`"${javaHome}/bin/java" -version`, (err: Error, stdout: string, stderr: string) => {
							resolve(!err && (containsVersionString(stderr) || containsVersionString(stdout)));
						});
					} else {
						resolve(false);
					}
				}
			});
		}
	});
}
