const PLUGIN_NAME = 'hasTest';
intern.registerPlugin(PLUGIN_NAME, () => {
	let globalObj: any;
	if (typeof self !== 'undefined') {
		globalObj = self;
	} else if (typeof window !== 'undefined') {
		globalObj = window;
	} else {
		globalObj = global;
	}

	let { DojoHasEnvironment = {} } = globalObj;
	const { staticFeatures = {} } = DojoHasEnvironment;

	DojoHasEnvironment = {
		...DojoHasEnvironment,
		staticFeatures: {
			...staticFeatures,
			test: true
		}
	};

	if (typeof global !== 'undefined') {
		(global as any).DojoHasEnvironment = DojoHasEnvironment;
	}

	if (typeof window !== 'undefined') {
		window.DojoHasEnvironment = DojoHasEnvironment;
	}

	if (typeof self !== 'undefined') {
		self.DojoHasEnvironment = DojoHasEnvironment;
	}
});
