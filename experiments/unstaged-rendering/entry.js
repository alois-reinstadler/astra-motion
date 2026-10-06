export { default as Fixture } from './Fixture.svelte';
export { install, stats, inCapture, compilerCallback } from './hooks.js';
export { Batch } from 'virtual:probe-batch';
export { mount, unmount, flushSync } from 'svelte';
export { beforeCommit, queueLayoutMutation } from '../../src/lib/motion/commit.ts';
