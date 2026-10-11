export { default as Fixture } from './Fixture.svelte';
export { install, stats, inCapture, compilerCallback } from './hooks.js';
export { Batch } from 'virtual:probe-batch';
export { mount, unmount, flushSync } from 'svelte';
export { beforeCommit, queueLayoutMutation } from '../../src/lib/motion/commit.ts';

export { default as WriteFixture } from './WriteFixture.svelte';
export { installWriteProbe, writeStats } from './write-hooks.js';
export { captureDeferred } from './hooks.js';
export { start as startReactReference } from '../staged-rendering/react.jsx';
