import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'node:path';
const fixture = process.env.ASTRA_FIXTURE ?? 'Parity';
export default defineConfig({
	base: `/${fixture}/`,
	plugins: [
		svelte({ compilerOptions: { runes: true } }),
		{
			name: 'installed-consumer-module-evidence',
			generateBundle(_options, bundle) {
				const chunks = Object.values(bundle)
					.filter((item) => item.type === 'chunk')
					.map((item) => ({
						fileName: item.fileName,
						isEntry: item.isEntry,
						isDynamicEntry: item.isDynamicEntry,
						imports: item.imports,
						dynamicImports: item.dynamicImports,
						modules: Object.keys(item.modules)
					}));
				this.emitFile({
					type: 'asset',
					fileName: 'module-graph.json',
					source: JSON.stringify(chunks, null, 2)
				});
			}
		}
	],
	resolve: { alias: { '@fixture': resolve('src/fixtures', `${fixture}.svelte`) } },
	build: { outDir: `build/${fixture}/client`, manifest: true, sourcemap: true }
});
