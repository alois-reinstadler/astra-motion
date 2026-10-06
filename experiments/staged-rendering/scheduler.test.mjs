import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scheduleLatest } from './schedule-latest.mjs';

test('same-turn requests publish only the latest version after the caller returns', async () => {
	const writes = [];
	const scheduler = scheduleLatest((value) => writes.push(value));
	scheduler.value = 'superseded';
	scheduler.value = 'latest';
	assert.deepEqual(writes, []);
	await Promise.resolve();
	assert.deepEqual(writes, ['latest']);
});

test('disposing a scope prevents queued and future commits', async () => {
	const writes = [];
	const scheduler = scheduleLatest((value) => writes.push(value));
	scheduler.value = 'pending';
	scheduler.dispose();
	scheduler.value = 'after disposal';
	await Promise.resolve();
	assert.deepEqual(writes, []);
});

test('a request made during publication receives its own subsequent commit', async () => {
	const writes = [];
	const scheduler = scheduleLatest((value) => {
		writes.push(value);
		if (value === 1) scheduler.value = 2;
	});
	scheduler.value = 1;
	await Promise.resolve();
	assert.deepEqual(writes, [1]);
	await Promise.resolve();
	assert.deepEqual(writes, [1, 2]);
});
