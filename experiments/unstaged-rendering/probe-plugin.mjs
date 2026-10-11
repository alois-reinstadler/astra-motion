import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
const require = createRequire(import.meta.url);
const svelteRoot = dirname(require.resolve('svelte/package.json'));
export const version = require('svelte/package.json').version;
export function probePlugin() {
	if (version !== '5.57.0') throw new Error(`Unqualified Svelte version: ${version}`);
	return {
		name: 'unstaged-probe-only',
		enforce: 'post',
		resolveId(id) {
			if (id === 'virtual:probe-effects')
				return resolve(svelteRoot, 'src/internal/client/reactivity/effects.js');
			if (id === 'virtual:probe-batch')
				return resolve(svelteRoot, 'src/internal/client/reactivity/batch.js');
		},
		transform(code, id) {
			if (id.endsWith('/src/lib/motion/layout.ts'))
				return (
					code +
					`
// Experiment-only access. Never emitted by the library build.
export function __probeBegin() {
 if (transactionDepth) return null;
 transactionDepth++;
 try { snapshot(); } catch(error) { transactionDepth--; throw error; }
 let closed = false;
 return () => {
  if (closed) return;
  closed = true;
  try { flushSync(flushLayoutMutations); reconcile(); }
  finally { transactionDepth--; commit(); observer?.acknowledge(); }
 };
}
`
				);
			if (!id.endsWith('/Fixture.svelte')) return;
			// Instrument only compiler-emitted runtime calls, parsed after compilation.
			// No regex callback parsing and no changes to installed Svelte source.
			const ast = this.parse(code);
			const replacements = [];
			const supported = new Set(['template_effect', 'user_pre_effect', 'if', 'each', 'await']);
			function walk(node) {
				if (!node || typeof node !== 'object') return;
				if (
					node.type === 'CallExpression' &&
					node.callee.type === 'MemberExpression' &&
					node.callee.object.name === '$' &&
					supported.has(node.callee.property.name)
				) {
					replacements.push([
						node.callee.start,
						node.callee.end,
						`__probe.${node.callee.property.name}`
					]);
				}
				for (const value of Object.values(node)) {
					if (Array.isArray(value)) value.forEach(walk);
					else if (value && typeof value === 'object') walk(value);
				}
			}
			walk(ast);
			for (const [start, end, replacement] of replacements.sort((a, b) => b[0] - a[0]))
				code = code.slice(0, start) + replacement + code.slice(end);
			return { code: `import * as __probe from './compiler-hooks.js';\n` + code, map: null };
		}
	};
}
