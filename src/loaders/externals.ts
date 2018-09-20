declare const define: any;

intern.registerLoader(async function(options = {}) {
	const { outputPath = 'externals', dependencies = [], config } = options;
	const externalsPath = config ? `output/test/${outputPath}/` : '';
	// const extensions = ['.js'];

	function prefixPath(path: string) {
		return `${externalsPath}${path}`;
	}

	const paths = dependencies.reduce(
		(
			paths: string[],
			dependency:
				| string
				| {
						inject?: string | boolean | string[];
						to?: string;
						from?: string;
				  }
		) => {
			if (typeof dependency === 'string') {
				return paths;
			}

			const { inject, to, from } = dependency;

			if (!inject || !from) {
				return paths;
			}

			const base = (config && to) || from;
			const baseDir = base[base.length - 1] === '/' ? base : `${base}/`;

			if (Array.isArray(inject)) {
				return paths.concat(inject.map((path) => prefixPath(`${baseDir}${path}`)));
			}

			return paths.concat(prefixPath(typeof inject === 'string' ? `${baseDir}${inject}` : base));
		},
		[]
	);

	console.log(`Paths: ${JSON.stringify(paths)}`);
	await intern.loadScript(paths);

	const globalObj: any = typeof window !== 'undefined' ? window : global;
	const require: any = globalObj.require;

	if (config && globalObj.define && globalObj.define.amd) {
		return (modules: string[]) => {
			let handle: { remove(): void };

			return new Promise((resolve, reject) => {
				handle = require.on('error', (error: Error) => {
					intern.emit('error', error);
					reject(new Error(`Dojo loader error: ${error.message}`));
				});

				intern.log('Loading modules:', modules);
				require(modules, () => {
					resolve();
				});
			}).then<void>(
				() => {
					handle.remove();
				},
				(error) => {
					handle && handle.remove();
					throw error;
				}
			);
		};
	}

	return (modules: string[]) => {
		return intern.loadScript(modules);
	};
});
