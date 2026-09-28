import { expect, it, vi } from 'vitest';
import { createPresenceScope } from '../motion/presence-context.svelte.js';
import { reconcilePresence } from '../motion/presence-model.js';

const input = (...keys: string[]) => keys.map((key) => ({ key, value: { label: key } }));

it('retains removed data beside stable surviving keys without remounting replacements', () => {
	const before = reconcilePresence([], input('a', 'b', 'c'), 'sync');
	const after = reconcilePresence(before, input('d', 'a', 'c'), 'sync');
	expect(after.map((entry) => entry.key)).toEqual(['d', 'a', 'b', 'c']);
	expect(after.find((entry) => entry.key === 'b')?.value).toBe(before[1].value);
	expect(after.find((entry) => entry.key === 'a')?.token).toBe(before[0].token);
	expect(after.find((entry) => entry.key === 'a')?.value).not.toBe(before[0].value);
	expect(after.find((entry) => entry.key === 'b')?.isPresent).toBe(false);
});

it('wait defers the newest selection and can revive its retained record', () => {
	const before = reconcilePresence([], input('a'), 'wait', false);
	const absent = reconcilePresence(before, input('b'), 'wait');
	expect(absent.map((entry) => entry.key)).toEqual(['a']);
	expect(absent[0].isPresent).toBe(false);
	const revived = reconcilePresence(absent, input('a'), 'wait');
	expect(revived[0].token).toBe(before[0].token);
	expect(revived[0].isPresent).toBe(true);
	expect(revived[0].initial).toBe(false);
});

it('rejects duplicate keys and multi-child wait instead of corrupting retained identity', () => {
	expect(() => reconcilePresence([], input('a', 'a'), 'sync')).toThrow('duplicate key');
	expect(() => reconcilePresence([], input('a', 'b'), 'wait')).toThrow('one present child');
});

it('only initial records inherit boundary initial suppression', () => {
	const before = reconcilePresence([], input('a'), 'sync', false);
	const next = reconcilePresence(before, input('a', 'b'), 'sync');
	expect(next.map((entry) => entry.initial)).toEqual([false, undefined]);
});

it('waits for every participant and ignores completion from earlier exit generations', async () => {
	const complete = vi.fn();
	const scope = createPresenceScope({ isPresent: true, initial: undefined, custom: 1 }, complete);
	const first = scope.register();
	const second = scope.register();
	scope.update(false, 2);
	const old = scope.snapshot.generation;
	first.complete(old);
	await Promise.resolve();
	expect(complete).not.toHaveBeenCalled();
	scope.update(true, 3);
	scope.update(false, 4);
	first.complete(old);
	second.complete(old);
	await Promise.resolve();
	expect(complete).not.toHaveBeenCalled();
	first.complete(scope.snapshot.generation);
	second.complete(scope.snapshot.generation);
	await Promise.resolve();
	expect(complete).toHaveBeenCalledExactlyOnceWith(scope.snapshot.generation);
	scope.destroy();
});

it('unregistering an exiting participant releases the record and completion only occurs once', async () => {
	const complete = vi.fn();
	const scope = createPresenceScope(
		{ isPresent: true, initial: false, custom: undefined },
		complete
	);
	const first = scope.register();
	scope.update(false, undefined);
	first.unregister();
	first.complete(scope.snapshot.generation);
	await Promise.resolve();
	expect(complete).toHaveBeenCalledTimes(1);
	scope.destroy();
});

it('allows same-flush registrations before concluding an otherwise empty exit', async () => {
	const complete = vi.fn();
	const scope = createPresenceScope({ isPresent: true, initial: undefined, custom: 0 }, complete);
	scope.update(false, 0);
	const registration = scope.register();
	await Promise.resolve();
	expect(complete).not.toHaveBeenCalled();
	registration.complete(scope.snapshot.generation);
	await Promise.resolve();
	expect(complete).toHaveBeenCalledTimes(1);
	scope.destroy();
});

it('notifies custom changes during exit without invalidating its completion generation', async () => {
	const complete = vi.fn();
	const scope = createPresenceScope({ isPresent: true, initial: undefined, custom: 0 }, complete);
	const snapshots: { custom: unknown; generation: number }[] = [];
	const unsubscribe = scope.subscribe((snapshot) => snapshots.push(snapshot));
	const registration = scope.register();
	scope.update(false, 1);
	const generation = scope.snapshot.generation;
	scope.update(false, 2);
	expect(snapshots.map(({ custom }) => custom)).toEqual([0, 1, 2]);
	expect(scope.snapshot.generation).toBe(generation);
	expect(snapshots[1].custom).toBe(1);
	registration.complete(generation);
	await Promise.resolve();
	expect(complete).toHaveBeenCalledTimes(1);
	unsubscribe();
	scope.destroy();
});

it('does not invoke queued completion after reversal or owner destruction', async () => {
	const complete = vi.fn();
	const scope = createPresenceScope({ isPresent: true, initial: undefined, custom: 0 }, complete);
	scope.update(false, 0);
	scope.update(true, 0);
	await Promise.resolve();
	expect(complete).not.toHaveBeenCalled();
	scope.update(false, 0);
	scope.destroy();
	await Promise.resolve();
	expect(complete).not.toHaveBeenCalled();
});
