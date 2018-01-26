import * as mockery from 'mockery';
import * as sinon from 'sinon';
import * as path from 'path';

function load(modulePath: string): any {
	return require(modulePath);
}

function resolvePath(basePath: string, modulePath: string): string {
	return modulePath.replace('./', `${basePath}/`);
}

export default class MockModule {
	private basePath: string;
	private moduleUnderTestPath: string;
	private mocks: any;
	private sandbox: sinon.SinonSandbox;

	constructor(moduleUnderTestPath: string, require: NodeRequire) {
		this.moduleUnderTestPath = require.resolve(moduleUnderTestPath);
		this.basePath = path.dirname(this.moduleUnderTestPath);
		this.sandbox = sinon.sandbox.create();
		this.mocks = {};
	}

	dependencies(dependencies: string[], depMap: { [dep: string]: string } = {}): void {
		dependencies.forEach((dependencyName) => {
			let dependency = load(resolvePath(this.basePath, dependencyName));
			const mock: any = {};

			for (let prop in dependency) {
				if (typeof dependency[prop] === 'function') {
					mock[prop] = function() {};
					this.sandbox.stub(mock, prop);
				} else {
					mock[prop] = dependency[prop];
				}
			}

			if (typeof dependency === 'function') {
				if (depMap[dependencyName]) {
					const ctor = require(depMap[dependencyName]);
					mockery.registerMock(dependencyName, ctor);
				} else {
					const ctor = this.sandbox.stub().returns(mock);
					Object.assign(ctor, mock);
					mockery.registerMock(dependencyName, ctor);
					mock.ctor = ctor;
				}
			} else {
				mockery.registerMock(dependencyName, mock);
			}
			this.mocks[dependencyName] = mock;
		});
	}

	getMock(dependencyName: string): any {
		return this.mocks[dependencyName];
	}

	getModuleUnderTest(): any {
		this.start();
		const allowable = require(this.moduleUnderTestPath) + '.js';
		mockery.registerAllowable(allowable, true);
		return load(this.moduleUnderTestPath);
	}

	destroy(): void {
		this.sandbox.restore();
		mockery.deregisterAll();
		mockery.disable();
	}

	start() {
		mockery.enable({ warnOnUnregistered: false, useCleanCache: true });
	}
}
