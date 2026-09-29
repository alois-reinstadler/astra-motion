import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifyPackedFiles } from './motion-consumer-provenance.mjs';

test('accepts the forwarding CLI alongside existing package entrypoints', () => {
	assert.doesNotThrow(() =>
		verifyPackedFiles([
			'package/package.json',
			'package/LICENSE',
			'package/README.md',
			'package/dist/index.js',
			'package/dist/index.d.ts',
			'package/dist/check-motion-forwarding.mjs',
			'package/dist/motion/vendor/motion-dom/index.js'
		])
	);
});

test('does not widen the distribution whitelist for other executable paths', () => {
	for (const path of [
		'package/dist/another-cli.mjs',
		'package/dist/check-motion-forwarding.js',
		'package/dist/check-motion-forwarding.mjs.map',
		'package/dist/check-motion-forwarding.mjs/extra',
		'package/scripts/check-motion-forwarding.mjs',
		'package/dist/motion/../check-motion-forwarding.mjs'
	]) {
		assert.throws(() => verifyPackedFiles([path]), /Unexpected packed files/, path);
	}
});

test('continues rejecting tests under otherwise permitted runtime paths', () => {
	for (const path of ['package/dist/motion/value.test.js', 'package/dist/motion/value.spec.js']) {
		assert.throws(() => verifyPackedFiles([path]), /Tests leaked into tarball/, path);
	}
});
