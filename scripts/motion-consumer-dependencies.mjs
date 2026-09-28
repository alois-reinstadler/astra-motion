import assert from 'node:assert/strict';
import { readFileSync, readdirSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { moduleSpecifiers } from './module-specifiers.mjs';

export function inspectConsumerDependencies(consumer) {
	const directory = realpathSync(join(consumer, 'node_modules/astra-motion'));
	const require = createRequire(join(directory, 'package.json'));
	const vendor = join(directory, 'dist/motion/vendor');
	const provenance = JSON.parse(readFileSync(join(vendor, 'provenance.json'), 'utf8'));
	const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
	const motionAPI = require(join(vendor, 'framer-motion/index.js'));
	const domAPI = require(join(vendor, 'motion-dom/index.js'));
	const valuesAPI = require(join(directory, 'dist/motion/values.js'));
	const leakedImports = [];
	for (const path of readdirSync(join(directory, 'dist'), { recursive: true })) {
		if (!/\.(?:js|mjs|ts|svelte)$/.test(path)) continue;
		const code = readFileSync(join(directory, 'dist', path), 'utf8');
		if (
			moduleSpecifiers(code, path).some((specifier) =>
				/^(?:motion(?:-dom|-utils)?|framer-motion|react|react-dom)(?:\/|$)/.test(specifier)
			)
		)
			leakedImports.push(path);
	}
	return {
		versions: provenance.versions,
		strategy: 'packaged-dom-esm',
		runtimeDependencies: manifest.dependencies ?? {},
		leakedImports,
		sharedExports: Object.fromEntries(
			[
				'HTMLVisualElement',
				'AsyncMotionValueAnimation',
				'NativeAnimationExtended',
				'GroupAnimation',
				'frame',
				'visualElementStore',
				'MotionValue'
			].map((name) => [name, motionAPI[name] !== undefined && motionAPI[name] === domAPI[name]])
		),
		publicMotionValueIdentity:
			valuesAPI.motionValue === domAPI.motionValue &&
			valuesAPI.motionValue(0) instanceof domAPI.MotionValue
	};
}

export function verifyConsumerDependencies(consumer) {
	const actual = inspectConsumerDependencies(consumer);
	const reviewed = JSON.parse(
		readFileSync(new URL('../tests/upstream-motion/reviewed-exports.json', import.meta.url), 'utf8')
	);
	const versions = { ...reviewed.pins, ...reviewed.resolved };
	delete versions.motion;
	assert.deepEqual(actual.versions, versions, 'Packaged engine differs from reviewed versions');
	assert.deepEqual(actual.runtimeDependencies, {}, 'Consumer must not resolve another engine');
	assert.deepEqual(actual.leakedImports, [], 'Published runtime or types leak upstream imports');
	assert(Object.values(actual.sharedExports).every(Boolean), 'Packaged engine identities differ');
	assert(actual.publicMotionValueIdentity, 'Public values use a different engine');
	return actual;
}
