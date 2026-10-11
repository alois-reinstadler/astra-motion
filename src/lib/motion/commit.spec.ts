import { expect, it } from 'vitest';
import { flushLayoutMutations, layoutBridge, queueLayoutMutation } from './commit.js';

it('advances pending flow mutations before paint without replaying a stale frame batch', async () => {
	const previous = { schedule: layoutBridge.schedule, update: layoutBridge.update };
	const frames: (() => void)[] = [];
	const changes: string[] = [];
	let transactions = 0;
	layoutBridge.schedule = (flush) => frames.push(flush);
	layoutBridge.update = (change) => {
		transactions++;
		change();
	};
	try {
		queueLayoutMutation(() => changes.push('native'));
		queueLayoutMutation(() => changes.push('managed'), true);
		await Promise.resolve();
		expect(changes).toEqual(['native', 'managed']);
		expect(transactions).toBe(1);
		queueLayoutMutation(() => changes.push('next'));
		frames[0]();
		expect(changes).toEqual(['native', 'managed']);
		expect(transactions).toBe(1);
		frames[1]();
		expect(changes).toEqual(['native', 'managed', 'next']);
		expect(transactions).toBe(2);
	} finally {
		for (const flush of frames) flush();
		Object.assign(layoutBridge, previous);
	}
});

it('drains pop writes inside a transaction without replaying the queued microtask', async () => {
	const previous = layoutBridge.updateAfterRender;
	let transactions = 0;
	let writes = 0;
	layoutBridge.updateAfterRender = (change) => {
		transactions++;
		change();
	};
	try {
		queueLayoutMutation(() => writes++, true);
		flushLayoutMutations();
		expect(writes).toBe(1);
		await Promise.resolve();
		expect(writes).toBe(1);
		expect(transactions).toBe(1);
		queueLayoutMutation(() => writes++, true);
		await Promise.resolve();
		expect(writes).toBe(2);
	} finally {
		layoutBridge.updateAfterRender = previous;
	}
});

it('finishes other queued removals when one completion callback throws', () => {
	const previous = { schedule: layoutBridge.schedule, update: layoutBridge.update };
	let flush: (() => void) | undefined;
	let removed = false;
	const error = new Error('Consumer completion failed');
	layoutBridge.schedule = (callback) => (flush = callback);
	layoutBridge.update = (change) => change();
	try {
		queueLayoutMutation(() => {
			throw error;
		});
		queueLayoutMutation(() => (removed = true));
		expect(() => flush!()).toThrow(error);
		expect(removed).toBe(true);
	} finally {
		Object.assign(layoutBridge, previous);
	}
});
