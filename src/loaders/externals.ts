declare const define: any;

intern.registerLoader(async function(options = {}) {
	const { outputPath = 'externals', dependencies = [] } = options;
	const externalsPath = `output/test/unit/${outputPath}/`;

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

			const base = to || from;
			const baseDir = base[base.length - 1] === '/' ? base : `${base}/`;

			if (Array.isArray(inject)) {
				return paths.concat(inject.map((path) => prefixPath(`${baseDir}${path}`)));
			}

			return paths.concat(prefixPath(typeof inject === 'string' ? `${baseDir}${inject}` : base));
		},
		[]
	);

	await intern.loadScript(paths);

	const globalObj: any = typeof window !== 'undefined' ? window : global;

	if (globalObj.define && globalObj.define.amd) {
		const require: any = globalObj.require;

		return (modules: string[]) => {
			const paths = modules.map((module) => {
				if (module[0] !== '/') {
					return `${intern.config.basePath}${module}`;
				} else {
					return module;
				}
			});
			let handle: { remove(): void };

			return new Promise((resolve, reject) => {
				handle = require.on('error', (error: Error) => {
					intern.emit('error', error);
					reject(new Error(`AMD loader error: ${error.message}`));
				});

				intern.log('Loading modules:', paths);
				require(paths, () => {
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
