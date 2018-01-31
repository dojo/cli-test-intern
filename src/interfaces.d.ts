declare module 'remap-istanbul/lib/main' {
	namespace main {
		export interface ReportMap {
			[type: string]: string | null;
		}

		export interface RemapOptions {
			[option: string]: any;
			exclude?: string | RegExp | ((filename: string) => boolean);
			mapFileName?: (filename: string) => string;
			warn?: (...args: any[]) => void;
		}

		export function loadCoverage(sources: string | string[], options?: RemapOptions): any;

		export function remap(coverage: any, options?: RemapOptions): any;

		export function writeReport(
			collector: any,
			reportType: string,
			reportOptions: object,
			dest: string | ((output: string) => void) | null,
			sources?: any
		): Promise<void>;
	}

	function main(sources: string | string[], reports: main.ReportMap, options?: main.RemapOptions): Promise<void>;

	export = main;
}
