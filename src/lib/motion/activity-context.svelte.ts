import { getContext, setContext } from 'svelte';
import { readActivityState } from './activity-scope.js';

export type ActivityMode = 'visible' | 'hidden';
export type ActivityPhase = 'visible' | 'exiting' | 'hidden';
export interface ActivityState {
	readonly mode: ActivityMode;
	readonly phase: ActivityPhase;
	readonly active: boolean;
}

const key = Symbol('astra-activity');
const alwaysActive: ActivityState = { mode: 'visible', phase: 'visible', active: true };

export function useActivity(): ActivityState {
	try {
		return getContext<ActivityState>(key) ?? alwaysActive;
	} catch (error) {
		if (error instanceof Error && error.message.includes('lifecycle_outside_component'))
			return alwaysActive;
		throw error;
	}
}

export function provideActivityContext(state: ActivityState): void {
	setContext(key, state);
}

/** Effects registered here clean up on hiding and restart on reveal; ordinary $effects do not. */
export function useActivityEffect(effect: () => void | (() => void)): void {
	const isActive = readActivityState();
	function run() {
		if (isActive()) return effect();
	}
	$effect(run);
}
