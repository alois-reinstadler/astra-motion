import { build } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'node:path';
import { probePlugin } from './probe-plugin.mjs';
await build({
	configFile: false,
	root: import.meta.dirname,
	plugins: [svelte({ configFile: false, compilerOptions: { dev: false } }), probePlugin()],
	resolve: {
		alias: {
			react: resolve(import.meta.dirname, '../staged-rendering/node_modules/react'),
			'react-dom': resolve(import.meta.dirname, '../staged-rendering/node_modules/react-dom')
		},
		dedupe: ['svelte', 'motion-dom', 'motion-utils']
	},
	build: {
		outDir: '.generated',
		emptyOutDir: true,
		minify: false,
		lib: {
			entry: resolve(import.meta.dirname, 'entry.js'),
			formats: ['es'],
			fileName: () => 'probe.js'
		}
	}
});
