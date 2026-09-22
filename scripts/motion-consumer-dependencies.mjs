import assert from 'node:assert/strict';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

function metadata(name, resolver) {
	const entry = realpathSync(resolver.resolve(name));
	let directory = dirname(entry);
	while (dirname(directory) !== directory) {
		const file = join(directory, 'package.json');
		if (existsSync(file)) {
			const value = JSON.parse(readFileSync(file, 'utf8'));
			if (value.name === name) return { version: value.version, directory, entry };
		}
		directory = dirname(directory);
	}
	throw new Error(`Could not locate ${name}`);
}

export function inspectConsumerDependencies(consumer) {
	const resolver = createRequire(
		join(realpathSync(join(consumer, 'node_modules/astra-motion')), 'package.json')
	);
	const motion = metadata('motion', resolver);
	const dom = metadata('motion-dom', resolver);
	const framer = metadata('framer-motion', createRequire(motion.entry));
	const nestedDom = metadata('motion-dom', createRequire(framer.entry));
	const utils = metadata('motion-utils', createRequire(dom.entry));
	const nestedUtils = metadata('motion-utils', createRequire(framer.entry));
	const motionAPI = resolver('motion');
	const domAPI = resolver('motion-dom');
	return {
		versions: {
			motion: motion.version,
			'motion-dom': dom.version,
			'framer-motion': framer.version,
			'motion-utils': utils.version
		},
		framerMotionDom: nestedDom.version,
		framerMotionUtils: nestedUtils.version,
		sharedDom: dom.directory === nestedDom.directory,
		sharedUtils: utils.directory === nestedUtils.directory,
		sharedExports: Object.fromEntries(
			[
				'HTMLVisualElement',
				'AsyncMotionValueAnimation',
				'NativeAnimationExtended',
				'GroupAnimation',
				'frame',
				'visualElementStore'
			].map((name) => [name, motionAPI[name] !== undefined && motionAPI[name] === domAPI[name]])
		)
	};
}

export function verifyConsumerDependencies(consumer) {
	const actual = inspectConsumerDependencies(consumer);
	const reviewed = JSON.parse(
		readFileSync(new URL('../tests/upstream-motion/reviewed-exports.json', import.meta.url), 'utf8')
	);
	assert(
		actual.sharedDom && actual.sharedUtils,
		`Packed consumer resolves different Motion engines: ${JSON.stringify(actual)}`
	);
	assert.deepEqual(
		actual.versions,
		{ ...reviewed.pins, ...reviewed.resolved },
		'Packed consumer dependency versions differ from reviewed versions'
	);
	assert(
		Object.values(actual.sharedExports).every(Boolean),
		'Packed consumer Motion exports do not share runtime identity'
	);
	return actual;
}
