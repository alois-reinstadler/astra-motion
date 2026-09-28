import { getContext, setContext } from 'svelte';
import { readMotionConfig } from './config.js';
import { readLayoutScope } from './layout-context.js';
import { readPresenceScope } from './presence-context.svelte.js';
import { readActivityState } from './activity-scope.js';
import type { MotionTree, MotionEnvironment } from './motion-types.js';
const key = Symbol('astra-motion-component');
export function readMotionTree(): MotionTree | undefined {
	return getContext<MotionTree>(key);
}
export function provideMotionTree(tree: MotionTree) {
	setContext(key, tree);
}
export function captureMotionEnvironment(): MotionEnvironment {
	return {
		config: readMotionConfig(),
		layout: readLayoutScope(),
		presence: readPresenceScope(),
		activity: readActivityState(),
		parent: readMotionTree()
	};
}
