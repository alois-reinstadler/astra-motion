import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { qualificationOrigin } from './qualification-origin.mjs';

test('normalizes explicit root origins and rejects ambiguous qualification targets', () => {
	assert.equal(qualificationOrigin('http://127.0.0.1:4080/', '--url'), 'http://127.0.0.1:4080');
	assert.equal(qualificationOrigin('https://example.org', '--url'), 'https://example.org');
	for (const value of [
		undefined,
		'',
		'not-a-url',
		'file:///tmp/app',
		'https://user:pass@example.org',
		'https://example.org/app',
		'https://example.org/?build=1',
		'https://example.org/#app'
	]) {
		assert.throws(() => qualificationOrigin(value, '--url'), /explicit HTTP\(S\) origin/);
	}
});

test('qualification scripts reject missing origins before reading fixtures or launching browsers', () => {
	for (const script of [
		'qualify-motion-package.mjs',
		'qualify-motion-lifecycle.mjs',
		'qualify-motion-performance.mjs'
	]) {
		const result = spawnSync(process.execPath, [new URL(script, import.meta.url).pathname], {
			encoding: 'utf8'
		});
		assert.equal(result.status, 1, script);
		assert.match(result.stderr, /explicit HTTP\(S\) origin/, script);
	}
});
