import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { JSAnimation, motionValue } from 'motion-dom';

// Execute the actual production function body with a minimal visual owner.
// This isolates ownership policy; it is not a mounted Svelte/browser test.
const source = fs.readFileSync('src/lib/motion/motion-core.svelte.ts', 'utf8');
const start = source.indexOf('\tfunction syncActivity(active: boolean)');
const end = source.indexOf('\n\tlet preferenceVersion', start);
const body = ts.transpileModule(source.slice(start, end), {
	compilerOptions: { target: ts.ScriptTarget.ES2022 }
}).outputText;
const shared = motionValue(0);
const external = new JSAnimation({
	keyframes: [0, 100],
	duration: 1000,
	driver: () => ({ now: () => 1, start() {}, stop() {} }),
	onUpdate: (value) => shared.set(value)
});
void shared.start(() => external);
const visibleConsumer = shared;
const hiddenConsumer = shared;
const visual = {
	values: new Map([['x', hiddenConsumer]]),
	update() {},
	render() {},
	notifyUpdate() {}
};
const hide = new Function(
	'visual',
	`
  let activityActive = true;
  let pausedAnimations = [];
  const pauseGestures = () => {};
  const props = () => ({});
  const presenceContext = () => null;
  const cancelFrame = () => {};
  ${body}
  return () => syncActivity(false);
`
)(visual);
assert.equal(external.state, 'running');
assert.equal(visibleConsumer, hiddenConsumer);
hide();
assert.equal(external.state, 'paused');
console.log(
	'Confirmed: hiding a consumer pauses externally-owned playback shared with a visible consumer.'
);
external.stop();
shared.destroy();
