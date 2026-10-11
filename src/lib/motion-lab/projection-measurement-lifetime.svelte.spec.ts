import { expect, it } from 'vitest';
import { DocumentProjectionNode, frame, type IProjectionNode } from 'motion-dom';
import { ProjectionBoundary } from '../motion/projection-boundaries.js';

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

function fixture() {
	const host = document.createElement('div');
	host.style.cssText = 'position:fixed;left:100px;top:80px;width:700px;height:100px';
	const element = document.createElement('div');
	element.style.cssText = 'width:600px;height:60px;transform:translateX(25%)';
	host.append(element);
	document.body.append(host);
	// An isolated engine root needs no window mount or persistent resize listener.
	const root = new DocumentProjectionNode({});
	const boundary = new ProjectionBoundary(element, root as IProjectionNode);
	const authored = element.style.cssText;
	return {
		element,
		root,
		boundary,
		authored,
		dispose() {
			boundary.unmount();
			host.remove();
		}
	};
}

it('retains normalization through a render preceding the scheduled root measurement', async () => {
	const f = fixture();
	let pendingTransform = '';
	let normalizedTransform = '';
	let measurementTransform: string | undefined;
	let pending = false;
	f.boundary.addEventListener('measure', () => {
		measurementTransform = f.element.style.transform;
	});
	try {
		await new Promise<void>((resolve) => {
			frame.read(() => {
				f.root.startUpdate();
				normalizedTransform = f.element.style.transform;
				f.root.didUpdate();
				frame.render(
					() => {
						pending = f.root.updateScheduled;
						pendingTransform = f.element.style.transform;
						resolve();
					},
					false,
					true
				);
			});
		});
		expect(pending).toBe(true);
		expect(pendingTransform).toBe(normalizedTransform);
		expect(measurementTransform).toBe('none');
		expect(f.boundary.layout?.layoutBox.x.min).toBe(100);
		await nextFrame();
		expect(f.element.style.cssText).toBe(f.authored);
	} finally {
		f.dispose();
	}
});

for (const blocked of ['manual', 'resize'] as const)
	it(`restores normalization after a scheduled ${blocked}-blocked update skips measurement`, async () => {
		const f = fixture();
		try {
			await new Promise<void>((resolve) => {
				frame.read(() => {
					f.root.startUpdate();
					if (blocked === 'manual') f.root.blockUpdate();
					else f.root.updateBlockedByResize = true;
					f.root.didUpdate();
					frame.render(() => resolve(), false, true);
				});
			});
			await nextFrame();
			expect(f.root.updateScheduled).toBe(false);
			// Motion can leave isUpdating set after a blocked commit. It must not
			// keep the boundary normalized or schedule indefinite render retries.
			expect(f.root.isUpdating).toBe(true);
			expect(f.element.style.cssText).toBe(f.authored);
		} finally {
			f.dispose();
		}
	});

it('restores an abandoned capture when no root measurement was scheduled', async () => {
	const f = fixture();
	try {
		await new Promise<void>((resolve) => {
			frame.read(() => {
				f.root.startUpdate();
				frame.render(() => resolve(), false, true);
			});
		});
		expect(f.root.isUpdating).toBe(true);
		expect(f.root.updateScheduled).toBe(false);
		expect(f.element.style.cssText).toBe(f.authored);
	} finally {
		f.dispose();
	}
});

it('restores immediately on unmount during a pending root measurement', async () => {
	const f = fixture();
	try {
		await new Promise<void>((resolve) => {
			frame.read(() => {
				f.root.startUpdate();
				f.root.didUpdate();
				f.boundary.unmount();
				frame.render(() => resolve(), false, true);
			});
		});
		expect(f.element.style.cssText).toBe(f.authored);
		await nextFrame();
		expect(f.element.style.cssText).toBe(f.authored);
	} finally {
		f.dispose();
	}
});

it('preserves a new authored declaration written while normalization is pending', async () => {
	const f = fixture();
	try {
		await new Promise<void>((resolve) => {
			frame.read(() => {
				f.root.startUpdate();
				f.root.didUpdate();
				frame.render(
					() => {
						f.element.style.setProperty('transform', 'translateX(70px)', 'important');
						resolve();
					},
					false,
					true
				);
			});
		});
		await nextFrame();
		expect(f.element.style.transform).toBe('translateX(70px)');
		expect(f.element.style.getPropertyPriority('transform')).toBe('important');
	} finally {
		f.dispose();
	}
});
