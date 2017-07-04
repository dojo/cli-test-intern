import * as path from 'path';

export default __dirname;

export function projectName() {
	return require(path.join(process.cwd(), './package.json')).name;
}
