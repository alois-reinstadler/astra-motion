import { afterEach, expect, it, vi } from 'vitest';
import { HTMLProjectionNode, type IProjectionNode } from 'motion-dom';
import { ProjectionBoundary, observeProjectionScroll } from './projection-boundaries.js';

afterEach(() => vi.unstubAllGlobals());

function fixture(position = 'sticky') {
	const properties = new Map([['top', { value: '12.5px', priority: 'important' }]]);
	const style = {
		getPropertyValue: (key: string) => properties.get(key)?.value ?? '',
		getPropertyPriority: (key: string) => properties.get(key)?.priority ?? '',
		setProperty: vi.fn((key: string, value: string, priority = '') => {
			properties.set(key, { value, priority });
		}),
		removeProperty: (key: string) => properties.delete(key)
	};
	const element = {
		style,
		scrollLeft: 0,
		scrollTop: 40,
		offsetLeft: 0,
		get offsetTop() {
			return style.getPropertyValue('top') === 'auto' ? 10 : 22.5;
		}
	} as unknown as HTMLElement;
	const css = { position };
	const readStyle = vi.fn(() => css);
	vi.stubGlobal('getComputedStyle', readStyle);
	vi.stubGlobal('window', { getComputedStyle: readStyle });
	const root = { animationId: 1 };
	const node = Object.assign(Object.create(ProjectionBoundary.prototype), {
		element,
		instance: element,
		root,
		options: { layoutScroll: true }
	}) as ProjectionBoundary;
	return { node, element, root, css, readStyle, style };
}

it('corrects a shared sticky boundary once per Motion scroll record, retaining fractional offsets', () => {
	const { node, root, element, readStyle, style } = fixture();
	node.updateScroll('snapshot');
	expect(node.scroll?.offset.y).toBe(27.5);
	expect(style.getPropertyValue('top')).toBe('12.5px');
	expect(style.getPropertyPriority('top')).toBe('important');
	const reads = readStyle.mock.calls.length;
	const writes = style.setProperty.mock.calls.length;
	for (let index = 0; index < 500; index++) node.updateScroll('snapshot');
	expect(readStyle).toHaveBeenCalledTimes(reads);
	expect(style.setProperty).toHaveBeenCalledTimes(writes);
	expect(node.scroll?.offset.y).toBe(27.5);

	// A post-mutation measurement must refresh, even within the same animation.
	element.scrollTop = 60;
	node.updateScroll('measure');
	expect(node.scroll?.offset.y).toBe(47.5);
	expect(readStyle.mock.calls.length).toBeGreaterThan(reads);
	// A later transaction must also refresh the snapshot phase.
	root.animationId++;
	element.scrollTop = 80;
	node.updateScroll('snapshot');
	expect(node.scroll?.offset.y).toBe(67.5);
});

it('rechecks CSS positioning on the next phase and after Motion clears scroll records', () => {
	const { node, css, readStyle } = fixture('static');
	node.updateScroll('snapshot');
	expect(node.scroll?.offset.y).toBe(40);
	css.position = 'sticky';
	node.updateScroll('measure');
	expect(node.scroll?.offset.y).toBe(27.5);
	const reads = readStyle.mock.calls.length;
	node.scroll = undefined;
	node.updateScroll('measure');
	expect((node as IProjectionNode).scroll?.offset.y).toBe(27.5);
	expect(readStyle.mock.calls.length).toBeGreaterThan(reads);
});

it('reuses participant positioning read while retaining sticky self-scroll correction', () => {
	const { node, element, readStyle } = fixture();
	// Install the participant wrapper around Motion's original implementation.
	node.updateScroll = HTMLProjectionNode.prototype.updateScroll;
	observeProjectionScroll(node, element);
	node.updateScroll('measure');
	// One wrapper read and Motion's own fixed-root read; no second sticky read.
	expect(readStyle).toHaveBeenCalledTimes(2);
	expect((node as IProjectionNode).scroll?.offset.y).toBe(27.5);
});
