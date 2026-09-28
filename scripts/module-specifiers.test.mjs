import assert from 'node:assert/strict';
import { test } from 'node:test';
import { moduleSpecifiers } from './module-specifiers.mjs';
test('dependency checks inspect all supported module references, not prop strings', () => {
	const code = `import { x } from 'motion'; export * from 'motion-dom'; export type { Y } from 'motion-utils'; type Z = import('framer-motion').Z; const next = import('motion/mini'); const required = require('react'); const prop = 'motion';`;
	assert.deepEqual(moduleSpecifiers(code, 'entry.ts'), [
		'motion',
		'motion-dom',
		'motion-utils',
		'framer-motion',
		'motion/mini',
		'react'
	]);
});
test('both Svelte scripts are checked without treating markup or keys as imports', () => {
	const code = `<script module lang="ts">import type { X } from 'motion-dom';</script><script lang="ts">import { x } from 'motion'; const key = 'motion';</script><p>motion-dom</p>`;
	assert.deepEqual(moduleSpecifiers(code, 'Custom.svelte'), ['motion-dom', 'motion']);
});
