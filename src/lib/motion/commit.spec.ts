import { expect, it } from 'vitest';
import { layoutBridge, queueLayoutMutation } from './commit.js';

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
