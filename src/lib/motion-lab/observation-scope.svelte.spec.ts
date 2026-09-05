import { expect, it, vi } from 'vitest';
import { visualElementStore } from 'motion-dom';
import { createLayout } from '../motion/layout.js';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
async function settle() {
	for (let i = 0; i < 12; i++) await Promise.resolve();
	await frame();
	await frame();
}
function box(css = '') {
	const element = document.createElement('div');
	element.style.cssText = `width:20px;height:20px;${css}`;
	return element;
}

it('does not measure 20 participants when text changes in an unrelated subtree', async () => {
	const host = box('width:400px;height:100px;display:flex');
	const unrelated = box('position:fixed;top:0;right:0');
	const text = document.createTextNode('0');
	unrelated.append(text);
	document.body.append(host, unrelated);
	const layout = createLayout();
	const nodes = Array.from({ length: 20 }, () => box());
	host.append(...nodes);
	const disposers = nodes.map((node) => layout()(node));
	await settle();
	const reads = nodes.map((node) => vi.spyOn(node, 'getBoundingClientRect'));
	try {
		text.data = '1';
		await settle();
		expect(reads.reduce((sum, read) => sum + read.mock.calls.length, 0)).toBe(0);
	} finally {
		for (const read of reads) read.mockRestore();
		for (const dispose of disposers) dispose?.();
		host.remove();
		unrelated.remove();
		await settle();
	}
});

it('measures the changed scope without measuring an independent controller', async () => {
	const host = box('display:flex;width:400px;height:40px');
	const otherHost = box('position:fixed;top:100px;width:400px;height:40px');
	const sibling = box('width:50px;flex-shrink:0');
	const node = box('flex-shrink:0');
	const other = box();
	host.append(sibling, node);
	otherHost.append(other);
	document.body.append(host, otherHost);
	const layout = createLayout({ transition: { duration: 1, ease: 'linear' } });
	const otherLayout = createLayout();
	const dispose = layout()(node);
	const disposeOther = otherLayout()(other);
	await settle();
	const reads = vi.spyOn(node, 'getBoundingClientRect');
	const unrelatedReads = vi.spyOn(other, 'getBoundingClientRect');
	try {
		sibling.style.width = '150px';
		await settle();
		expect(reads).toHaveBeenCalled();
		expect(unrelatedReads).not.toHaveBeenCalled();
		expect(visualElementStore.get(node)!.projection!.currentAnimation).toBeDefined();
	} finally {
		reads.mockRestore();
		unrelatedReads.mockRestore();
		dispose?.();
		disposeOther?.();
		host.remove();
		otherHost.remove();
		await settle();
	}
});

it('a wider observation root captures position-only reflow from an ancestor sibling', async () => {
	const root = box('display:flex;width:400px;height:40px');
	const sibling = box('width:50px;flex-shrink:0');
	const parent = box('width:50px;flex-shrink:0');
	const node = box();
	parent.append(node);
	root.append(sibling, parent);
	document.body.append(root);
	const layout = createLayout({
		observationRoot: () => root,
		transition: { duration: 1, ease: 'linear' }
	});
	const dispose = layout()(node);
	await settle();
	try {
		const before = node.getBoundingClientRect().x;
		sibling.style.width = '150px';
		for (let i = 0; i < 12; i++) await Promise.resolve();
		expect(Math.abs(node.getBoundingClientRect().x - before)).toBeLessThan(1);
		expect(visualElementStore.get(node)!.projection!.currentAnimation).toBeDefined();
	} finally {
		dispose?.();
		root.remove();
		await settle();
	}
});

it('keeps direct ancestor mutations observable outside the inferred parent root', async () => {
	const ancestor = box('width:400px;height:40px;display:flex');
	const parent = box('width:50px');
	const node = box();
	parent.append(node);
	ancestor.append(parent);
	document.body.append(ancestor);
	const layout = createLayout({ transition: { duration: 1, ease: 'linear' } });
	const dispose = layout()(node);
	await settle();
	try {
		const before = node.getBoundingClientRect().x;
		ancestor.style.justifyContent = 'flex-end';
		for (let i = 0; i < 12; i++) await Promise.resolve();
		expect(Math.abs(node.getBoundingClientRect().x - before)).toBeLessThan(1);
		expect(visualElementStore.get(node)!.projection!.currentAnimation).toBeDefined();
	} finally {
		dispose?.();
		ancestor.remove();
		await settle();
	}
});

it('refreshes inferred observation roots when a participant is reparented', async () => {
	const oldParent = box('width:400px;height:40px;position:fixed;top:200px');
	const newParent = box('width:400px;height:40px;position:fixed;top:300px');
	const oldSibling = box();
	const newSibling = box();
	const node = box();
	oldParent.append(oldSibling, node);
	newParent.append(newSibling);
	document.body.append(oldParent, newParent);
	const layout = createLayout({ transition: { duration: 0 } });
	const dispose = layout()(node);
	await settle();
	newParent.append(node);
	await settle();
	const reads = vi.spyOn(node, 'getBoundingClientRect');
	try {
		oldSibling.textContent = 'old';
		await settle();
		expect(reads).not.toHaveBeenCalled();
		newSibling.textContent = 'new';
		await settle();
		expect(reads).toHaveBeenCalled();
	} finally {
		reads.mockRestore();
		dispose?.();
		oldParent.remove();
		newParent.remove();
		await settle();
	}
});

it('ignores unrelated and redundant native presence events without measuring layout', async () => {
	const host = box('width:400px;height:40px');
	const unrelated = box('position:fixed;top:200px');
	const node = box();
	host.append(node);
	document.body.append(host, unrelated);
	const layout = createLayout({ transition: { duration: 0 } });
	const dispose = layout()(node);
	await settle();
	const reads = vi.spyOn(node, 'getBoundingClientRect');
	try {
		unrelated.dispatchEvent(new Event('outrostart'));
		unrelated.dispatchEvent(new Event('introstart'));
		node.dispatchEvent(new Event('introstart'));
		await settle();
		expect(reads).not.toHaveBeenCalled();
		node.dispatchEvent(new Event('outrostart'));
		await settle();
		expect(reads).toHaveBeenCalled();
		expect(visualElementStore.get(node)!.projection!.isPresent).toBe(false);
		reads.mockClear();
		node.dispatchEvent(new Event('outrostart'));
		await settle();
		expect(reads).not.toHaveBeenCalled();
		node.dispatchEvent(new Event('introstart'));
		await settle();
		expect(reads).toHaveBeenCalled();
		expect(visualElementStore.get(node)!.projection!.isPresent).toBe(true);
	} finally {
		reads.mockRestore();
		dispose?.();
		host.remove();
		unrelated.remove();
		await settle();
	}
});
