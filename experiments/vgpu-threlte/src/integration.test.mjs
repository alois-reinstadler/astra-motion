import { test } from 'node:test';
import assert from 'node:assert/strict';
// The Motion scheduler requires a frame source in Node; this is not a GPU benchmark.
globalThis.requestAnimationFrame = (callback) => setTimeout(() => callback(performance.now()), 0);
globalThis.cancelAnimationFrame = clearTimeout;
const { motionValue, frame } = await import('motion');
const { vgpuEffect } = await import('motion/vgpu');
const { threeEffect } = await import('motion/three');
const { init, uniforms } = await import('vgpu/mock');
const flush = () => new Promise((resolve) => frame.postRender(resolve));

test('real vgpu mock uniforms batch two changing values and detach without later writes', async () => {
	const gpu = await init();
	const subject = uniforms(gpu, { progress: 0, intensity: 0.25 });
	const writes = [];
	const set = subject.set.bind(subject);
	subject.set = (bag) => {
		writes.push(bag);
		return set(bag);
	};
	const progress = motionValue(0);
	const intensity = motionValue(0.25);
	const detach = vgpuEffect(subject, { progress, intensity });
	await flush();
	writes.length = 0;
	progress.set(0.6);
	intensity.set(0.8);
	await flush();
	assert.equal(writes.length, 1);
	assert.deepEqual(writes[0], { progress: 0.6, intensity: 0.8 });
	detach();
	writes.length = 0;
	progress.set(1);
	await flush();
	assert.equal(writes.length, 0);
	gpu.dispose();
});

test('existing threeEffect updates shader uniforms and preserves detached ownership', async () => {
	const uniforms = { progress: { value: 0 }, intensity: { value: 0.25 } };
	const progress = motionValue(0);
	const intensity = motionValue(0.25);
	const detach = threeEffect(uniforms, { progress, intensity });
	progress.set(0.6);
	intensity.set(0.8);
	await flush();
	assert.equal(uniforms.progress.value, 0.6);
	assert.equal(uniforms.intensity.value, 0.8);
	detach();
	progress.set(1);
	await flush();
	assert.equal(uniforms.progress.value, 0.6);
});
