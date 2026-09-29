import { untrack } from 'svelte';
import { readActivityState } from './activity-scope.js';
import { observeMotionConfig, observeMotionPreference, readMotionConfig } from './config.js';
import { shouldReduceMotion } from './policy.js';

/** Application policy wins over the device preference; subscriptions follow Activity. */
export function useTextPolicy() {
	const config = readMotionConfig();
	const active = readActivityState();
	const read = () => shouldReduceMotion({ reducedMotion: 'user', ...config() });
	let reduced = $state(untrack(read));
	function observe() {
		if (!active()) return;
		const update = () => {
			reduced = read();
		};
		update();
		const cleanups = [observeMotionConfig(config, update), observeMotionPreference(update)];
		return () => cleanups.forEach((cleanup) => cleanup());
	}
	$effect(observe);
	return {
		get reduced() {
			return reduced;
		},
		active,
		config
	};
}
