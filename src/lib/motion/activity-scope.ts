import { getContext, setContext } from 'svelte';

export type ActivityReader = () => boolean;
const activityKey = Symbol('astra-motion-activity');
const active: ActivityReader = () => true;

/** A tree-local reader; hidden activity never shares state across SSR requests. */
export function readActivityState(): ActivityReader {
	try {
		return getContext<ActivityReader>(activityKey) ?? active;
	} catch (error) {
		if (error instanceof Error && error.message.includes('lifecycle_outside_component'))
			return active;
		throw error;
	}
}

export function provideActivityState(reader: ActivityReader): void {
	const parent = readActivityState();
	setContext<ActivityReader>(activityKey, () => parent() && reader());
}
