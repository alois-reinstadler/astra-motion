import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { motionValue } from 'astra-motion/values';
import { scenePose, chapterAt, pointerPosition } from './scene-path.mjs';
import { connectScene } from './scene-bridge.mjs';

test('preserves the source camera equations and half-clip scrub at representative scroll positions', () => {
	for (const p of [0, 0.2, 0.5, 0.8, 1]) {
		const result = scenePose(p);
		const offset = 1 - p;
		assert.equal(result.clipFraction, offset / 2);
		const expected = [
			-10 * Math.sin(offset),
			5 * Math.atan(offset * Math.PI * 2),
			-10 * Math.cos((offset * Math.PI) / 3)
		];
		assert.ok(
			result.position.every((value, axis) => value === expected[axis]),
			'coordinates exactly match, including equivalent signed zero'
		);
		assert.deepEqual(result.lookAt, [0, 0, 0]);
	}
});
test('reduced motion freezes the actual camera and authored animation despite scroll or cursor changes', () => {
	const still = scenePose(0, 0, 0, true);
	for (const p of [0, 0.5, 1])
		for (const x of [-1, 0, 1]) assert.deepEqual(scenePose(p, x, 1, true), still);
});
test('cursor and chapter fallbacks stay bounded across empty layouts and overscroll', () => {
	assert.deepEqual(
		pointerPosition(800, -200, { left: 0, top: 0, width: 400, height: 600 }),
		[1, -1]
	);
	assert.deepEqual(pointerPosition(2, 3, { left: 0, top: 0, width: 0, height: 0 }), [0, 0]);
	assert.deepEqual([-1, 0, 0.5, 1, 3].map(chapterAt), [0, 0, 1, 2, 2]);
	assert.deepEqual(scenePose(-1), scenePose(0));
	assert.deepEqual(scenePose(2), scenePose(1));
});
test('the bridge uses real installed Astra values, invalidates changes and detaches without taking ownership', () => {
	const value = motionValue(scenePose(0));
	const applied = [];
	let renders = 0;
	const stop = connectScene(
		value,
		(pose) => applied.push(pose),
		() => renders++
	);
	value.set(scenePose(0.5));
	assert.equal(applied.length, 2);
	assert.equal(applied[1].clipFraction, 0.25);
	assert.equal(renders, 2);
	stop();
	stop();
	const after = scenePose(1);
	value.set(after);
	assert.equal(applied.length, 2);
	assert.equal(value.get(), after);
	let borrowedStillWorks = false;
	const unsubscribe = value.on('change', () => (borrowedStillWorks = true));
	value.set(scenePose(0.3));
	assert.equal(borrowedStillWorks, true);
	unsubscribe();
	value.destroy();
});
test('bridge removes its subscription if the initial scene application throws', () => {
	const value = motionValue(0);
	let calls = 0;
	assert.throws(
		() =>
			connectScene(
				value,
				() => {
					calls++;
					throw new Error('scene unavailable');
				},
				() => {}
			),
		/scene unavailable/
	);
	value.set(1);
	assert.equal(calls, 1);
	value.destroy();
});
test('the shipped glTF is the attributed animated scene, with local embedded resources', async () => {
	const data = await readFile(new URL('../public/assets/littlest-tokyo.glb', import.meta.url));
	assert.equal(data.toString('utf8', 0, 4), 'glTF');
	const length = data.readUInt32LE(12);
	const gltf = JSON.parse(data.toString('utf8', 20, 20 + length));
	assert.equal(
		gltf.asset.extras.license,
		'CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)'
	);
	assert.equal(gltf.animations[0].name, 'Take 001');
	assert.equal(gltf.meshes.length, 57);
	assert.ok(gltf.animations[0].channels.length > 10);
	assert.ok(gltf.images.every((image) => !image.uri));
	assert.ok(gltf.buffers.every((buffer) => !buffer.uri));
});
