import { bind } from './native-motion.js';
/** Native state, presence, projection and interaction using the primary motion contract. */
export const motion = { bind };
export type { MotionOptions, MotionBinding, MotionTarget } from './motion-core.svelte.js';
export type { NativeMotionOptions } from './native-motion.js';
if (import.meta.hot) import.meta.hot.accept(() => window.location.reload());
