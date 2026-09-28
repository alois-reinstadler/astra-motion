export type PresenceKey = string | number | symbol;
export type PresenceMode = 'sync' | 'wait' | 'popLayout';
export interface PresenceInput<T> {
	key: PresenceKey;
	value: T;
}
export interface PresenceEntry<T> extends PresenceInput<T> {
	token: symbol;
	isPresent: boolean;
	initial: false | undefined;
}

/** Pure keyed diff: surviving records retain identity and outgoing records retain their data. */
export function reconcilePresence<T>(
	previous: readonly PresenceEntry<T>[],
	input: readonly PresenceInput<T>[],
	mode: PresenceMode,
	initial: false | undefined = undefined
): PresenceEntry<T>[] {
	if (mode === 'wait' && input.length > 1)
		throw new Error('Astra AnimatePresence: mode="wait" supports one present child at a time.');
	const keys = new Set<PresenceKey>();
	for (const { key } of input) {
		if (keys.has(key)) throw new Error(`Astra AnimatePresence: duplicate key ${String(key)}.`);
		keys.add(key);
	}
	const existing = new Map(previous.map((entry) => [entry.key, entry]));
	const next = input.map(({ key, value }) => {
		const entry = existing.get(key);
		return entry
			? { ...entry, value, isPresent: true }
			: { key, value, token: Symbol(), isPresent: true, initial };
	});
	const outgoing: PresenceEntry<T>[] = [];
	let insertion = 0;
	for (const entry of previous) {
		const presentIndex = input.findIndex(
			({ key }) => Object.is(key, entry.key) || key === entry.key
		);
		if (presentIndex === -1) {
			const retained = entry.isPresent ? { ...entry, isPresent: false } : entry;
			next.splice(insertion++, 0, retained);
			outgoing.push(retained);
		} else {
			insertion = presentIndex + outgoing.length + 1;
		}
	}
	return mode === 'wait' && outgoing.length ? outgoing : next;
}
