// Motion v13.4.4: motion-dom/src/view/__tests__/queue.test.ts.
// Adapted to Astra startViewTransition; attribution: tests/motion-baseline/LICENSE.motion.
import { expect, it, vi } from 'vitest';
import { startViewTransition } from '../motion/index.js';

it('view-queue-error-recovery: failed fallback updates cannot strand the next queued update', async () => {
	const document = {} as Document;
	const error = new Error('upstream update failure');
	const first = startViewTransition(
		() => {
			throw error;
		},
		{ document }
	);
	const ran = vi.fn();
	const second = startViewTransition(ran, { document });
	await expect(first.finished).rejects.toBe(error);
	await expect(second.finished).resolves.toBe('unsupported');
	expect(ran).toHaveBeenCalledTimes(1);
});
function skippedDocument() {
	return {
		head: { appendChild: vi.fn() },
		createElement: () => ({ remove: vi.fn(), setAttribute: vi.fn(), textContent: '' }),
		images: [],
		fonts: { status: 'loaded' },
		getAnimations: () => [],
		startViewTransition: (update: () => Promise<void>) => {
			const updateCallbackDone = Promise.resolve().then(update);
			const ready = updateCallbackDone.then(() => {
				throw new DOMException('browser skipped', 'AbortError');
			});
			void ready.catch(() => {});
			void updateCallbackDone.catch(() => {});
			return {
				updateCallbackDone,
				ready,
				finished: updateCallbackDone.catch(() => {}),
				skipTransition: vi.fn()
			};
		}
	} as unknown as Document;
}
it('view-queue-error-recovery: browser ready rejection resolves skipped after applying update once', async () => {
	const update = vi.fn();
	const handle = startViewTransition(update, {
		document: skippedDocument(),
		reducedMotion: 'never'
	});
	await expect(handle.finished).resolves.toBe('skipped');
	expect(update).toHaveBeenCalledTimes(1);
});
it('view-queue-error-recovery: native update rejection survives a resolved browser finished promise', async () => {
	const error = new Error('native update failed');
	const handle = startViewTransition(
		() => {
			throw error;
		},
		{ document: skippedDocument(), reducedMotion: 'never' }
	);
	await expect(handle.updateCallbackDone).rejects.toBe(error);
	await expect(handle.finished).rejects.toBe(error);
});
