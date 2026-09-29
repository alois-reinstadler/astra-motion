import { afterEach, expect, it } from 'vitest';
import { observeLayout } from '../motion/observe.js';

const cleanups: Array<() => void> = [];
afterEach(() => {
	for (const cleanup of cleanups.splice(0)) cleanup();
});

function fixture(style = '', ancestorStyle = '') {
	const root = document.createElement('div');
	root.style.cssText = ancestorStyle;
	const node = document.createElement('div');
	node.style.cssText = style;
	root.append(node);
	document.body.append(root);
	const batches: Set<HTMLElement>[] = [];
	const observer = observeLayout(document, (nodes) => batches.push(nodes));
	observer.add(node, () => node.parentElement);
	cleanups.push(() => {
		observer.disconnect();
		root.remove();
	});
	return { root, node, observer, batches };
}

// MutationObserver delivery is a microtask; these cases deliberately do not
// advance a frame, keeping ResizeObserver delivery out of style invalidation.
const delivered = () => Promise.resolve();

it('ignores declaration order and owned writes while retaining custom property values', async () => {
	const { node, batches } = fixture('width: 10px; --label: "a;b:c!"; opacity: 0.2');
	node.style.cssText = 'opacity: 0.8; --label: "a;b:c!"; width: 10px';
	node.style.transform = 'translateX(20px)';
	await delivered();
	expect(batches).toEqual([]);

	node.style.setProperty('--label', '"a;b:d!"');
	await delivered();
	expect(batches).toEqual([new Set([node])]);
});

it('invalidates priority-only changes and property removal', async () => {
	const { node, batches } = fixture('width: 10px; --gap: 2px');
	node.style.setProperty('width', '10px', 'important');
	await delivered();
	expect(batches).toEqual([new Set([node])]);

	node.style.setProperty('--gap', '2px', 'important');
	await delivered();
	expect(batches).toHaveLength(2);

	node.style.removeProperty('--gap');
	await delivered();
	expect(batches).toHaveLength(3);
});

it('handles empty and owned-only styles without invalidating layout', async () => {
	const { node, batches } = fixture();
	node.style.cssText = 'transform: translateX(10px); opacity: 0.5; color: red';
	await delivered();
	node.removeAttribute('style');
	await delivered();
	expect(batches).toEqual([]);

	node.style.width = '10px';
	await delivered();
	expect(batches).toEqual([new Set([node])]);
	node.style.width = '';
	await delivered();
	expect(batches).toHaveLength(2);
});

it('parses the first ancestor oldValue and coalesces style records by their final value', async () => {
	const { root, node, batches } = fixture('', 'width: 10px; --gap: 2px !important');
	root.style.cssText = '--gap: 2px !important; width: 10px; opacity: 0.5';
	await delivered();
	expect(batches).toEqual([]);

	root.style.width = '20px';
	root.style.width = '10px';
	await delivered();
	expect(batches).toEqual([]);

	root.style.width = '20px';
	root.style.width = '30px';
	await delivered();
	expect(batches).toEqual([new Set([node])]);
});

it('keeps acknowledged signatures current without replaying explicit commits', async () => {
	const { node, observer, batches } = fixture('width: 10px');
	node.style.width = '20px';
	observer.acknowledge();
	await delivered();
	node.style.opacity = '0.5';
	await delivered();
	expect(batches).toEqual([]);

	node.style.width = '10px';
	await delivered();
	expect(batches).toEqual([new Set([node])]);
});

it('refreshes reparented roots and stops invalidating removed participants', async () => {
	const { root, node, observer, batches } = fixture('width: 10px');
	const sibling = document.createElement('div');
	document.body.append(sibling);
	cleanups.push(() => sibling.remove());
	sibling.append(node);
	await delivered();
	expect(batches).toEqual([new Set([node])]);
	batches.length = 0;

	root.style.width = '30px';
	await delivered();
	expect(batches).toEqual([]);
	sibling.style.width = '30px';
	await delivered();
	expect(batches).toEqual([new Set([node])]);

	observer.remove(node);
	batches.length = 0;
	node.style.width = '20px';
	sibling.style.width = '40px';
	await delivered();
	expect(batches).toEqual([]);
});
