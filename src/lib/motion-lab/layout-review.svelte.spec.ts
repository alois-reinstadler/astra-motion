import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { rootProjectionNode, type IProjectionNode } from 'motion-dom';
import { createLayout, updateLayout } from '../motion/layout.js';
import Lab from '../../routes/motion-lab/+page.svelte';

const settleRegistration = async () => {
	await Promise.resolve();
	await Promise.resolve();
};

function projectionFor(element: Element): IProjectionNode {
	let found: IProjectionNode | undefined;
	rootProjectionNode.current?.nodes?.forEach((node) => {
		const projection = node as IProjectionNode;
		if (projection.instance === element) found = projection;
	});
	if (!found) throw new Error('Missing projection participant');
	return found;
}

describe('Motion architecture adversarial regressions', () => {
	it('links nested and scrolling projection nodes despite child-first Svelte attachment order', async () => {
		await render(Lab);
		await settleRegistration();
		const child = document.querySelector('[data-testid="nested-child"]')!;
		expect(projectionFor(child).parent?.instance).toBe(child.parentElement);
		const tile = document.querySelector('[data-testid="tile-0"]')!;
		expect(projectionFor(tile).parent?.options.layoutScroll).toBe(true);
	});

	it('releases empty shared stacks after repeated controller lifecycles', async () => {
		const initial = rootProjectionNode.current?.sharedNodes.size ?? 0;
		for (let index = 0; index < 20; index++) {
			const element = document.createElement('div');
			document.body.append(element);
			const dispose = createLayout()({ id: 'temporary' })(element);
			await settleRegistration();
			expect(rootProjectionNode.current?.sharedNodes.size).toBe(initial + 1);
			dispose?.();
			element.remove();
			await settleRegistration();
			expect(rootProjectionNode.current?.sharedNodes.size).toBe(initial);
		}
	});

	it('mounts a shared replacement before pruning its outgoing stack', async () => {
		const layout = createLayout();
		const old = document.createElement('div');
		const incoming = document.createElement('div');
		document.body.append(old);
		const removeOld = layout({ id: 'shared' })(old);
		await settleRegistration();
		const previous = projectionFor(old);
		let removeNew = () => {};
		layout.update(() => {
			removeOld?.();
			old.remove();
			document.body.append(incoming);
			removeNew = layout({ id: 'shared' })(incoming) ?? (() => {});
		});
		expect(projectionFor(incoming).resumeFrom).toBe(previous);
		removeNew();
		incoming.remove();
		await settleRegistration();
	});

	it('rejects asynchronous writes before a native async callback starts', () => {
		let invoked = false;
		expect(() => {
			// @ts-expect-error async functions are intentionally excluded from the public contract
			updateLayout(async () => {
				invoked = true;
			});
		}).toThrow('synchronous');
		expect(invoked).toBe(false);
	});

	it('reuses a parent projection across reactive styles, shared identity and controller changes', async () => {
		const a = createLayout();
		const b = createLayout();
		const parent = document.createElement('div');
		const child = document.createElement('div');
		parent.style.cssText = 'width:200px;height:100px;border-radius:8px';
		child.style.cssText = 'width:50px;height:30px';
		parent.append(child);
		document.body.append(parent);
		let disposeParent = a({ id: 'before', style: { rotate: 8, borderRadius: 12 } })(parent);
		const disposeChild = a()(child);
		await settleRegistration();
		const projection = projectionFor(parent);
		const previousId = projection.options.layoutId!;
		try {
			b.update(() => {
				disposeParent?.();
				disposeParent = b({ id: 'after', style: { rotate: 16, borderRadius: 24 } })(parent);
			});
			expect(projectionFor(parent)).toBe(projection);
			expect(projectionFor(child).parent).toBe(projection);
			expect(projection.root?.sharedNodes.has(previousId)).toBe(false);
			expect(projection.getStack()?.lead).toBe(projection);
			expect(a.stats().participants).toBe(1);
			expect(b.stats().participants).toBe(1);
			expect(parent.style.transform).toContain('rotate(16deg)');
			b.update(() => {
				disposeParent?.();
				disposeParent = b()(parent);
			});
			expect(projectionFor(child).parent).toBe(projection);
			expect(parent.style.transform).not.toContain('rotate(');
			expect(parent.style.borderRadius).toBe('8px');
		} finally {
			disposeChild?.();
			disposeParent?.();
			parent.remove();
			await settleRegistration();
		}
	});

	it('hands a shared lead back on native outro and promotes it again on reversal', async () => {
		const layout = createLayout();
		const wrapper = document.createElement('div');
		const source = document.createElement('div');
		const detail = document.createElement('div');
		wrapper.append(detail);
		document.body.append(source, wrapper);
		const disposeSource = layout({ id: 'shared' })(source);
		const disposeDetail = layout({ id: 'shared' })(detail);
		await settleRegistration();
		const projection = projectionFor(detail);
		try {
			expect(projection.isLead()).toBe(true);
			// Svelte dispatches non-bubbling CustomEvents; capture includes plain wrappers.
			wrapper.dispatchEvent(new CustomEvent('outrostart'));
			expect(projection.isPresent).toBe(false);
			expect(projectionFor(source).isLead()).toBe(true);
			detail.dispatchEvent(new CustomEvent('outrostart'));
			wrapper.dispatchEvent(new CustomEvent('introstart'));
			expect(projection.isPresent).toBe(false);
			detail.dispatchEvent(new CustomEvent('introstart'));
			expect(projection.isPresent).toBe(true);
			expect(projection.isLead()).toBe(true);
		} finally {
			disposeDetail?.();
			disposeSource?.();
			source.remove();
			wrapper.remove();
			await settleRegistration();
		}
	});
});
