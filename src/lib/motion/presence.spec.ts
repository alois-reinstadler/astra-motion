import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { beforeCommit, layoutBridge, queueLayoutMutation } from './commit.js';
import { popLayout } from './presence.js';

const releases: (() => void)[] = [];
let scheduled: (() => void)[] = [];
let events: string[] = [];
let depth = 0;
let parent: object;

function update(change: () => void) {
	if (depth) return change();
	depth++;
	try {
		for (const capture of beforeCommit) capture();
		change();
	} finally {
		depth--;
	}
}

function flush() {
	const pending = scheduled;
	scheduled = [];
	for (const run of pending) run();
}

function fixture(id: string, left = 20) {
	const properties = new Map<string, { value: string; priority: string }>();
	const methods = {
		getPropertyValue: (name: string) => properties.get(name)?.value ?? '',
		getPropertyPriority: (name: string) => properties.get(name)?.priority ?? '',
		setProperty: (name: string, value: string, priority = '') => {
			properties.set(name, { value, priority });
		},
		removeProperty: (name: string) => properties.delete(name)
	};
	const style = new Proxy(methods, {
		get(target, property) {
			if (property in target) return Reflect.get(target, property);
			return methods.getPropertyValue(String(property));
		},
		set(_target, property, value) {
			events.push(`write:${id}:${String(property)}`);
			methods.setProperty(String(property), value);
			return true;
		}
	}) as unknown as CSSStyleDeclaration;
	const node = Object.assign(new EventTarget(), {
		style,
		isConnected: true,
		parentElement: parent,
		offsetParent: parent,
		offsetLeft: left,
		offsetTop: 40,
		offsetWidth: 100,
		offsetHeight: 60,
		id
	}) as unknown as HTMLElement;
	const dispose = popLayout()(node)!;
	releases.push(dispose);
	return { node, style, dispose };
}

beforeEach(() => {
	events = [];
	depth = 0;
	parent = {};
	layoutBridge.update = update;
	layoutBridge.schedule = (run) => scheduled.push(run);
	vi.stubGlobal('getComputedStyle', (node: HTMLElement) => {
		events.push(`read:${node.id}`);
		return { marginLeft: '3.5px', marginTop: '5.25px' };
	});
});

afterEach(() => {
	for (const release of releases.splice(0)) release();
	flush();
	beforeCommit.clear();
	delete layoutBridge.update;
	delete layoutBridge.schedule;
	vi.unstubAllGlobals();
});

it('does no native exit measurements for 500 present elements during reorders', () => {
	for (let index = 0; index < 500; index++) fixture(String(index));
	update(() => {});
	expect(events.filter((event) => event.startsWith('read:'))).toHaveLength(0);
	expect(beforeCommit.size).toBe(0);
});

it('captures only exiting siblings and measures all of them before any flow write', () => {
	const nodes = Array.from({ length: 500 }, (_, index) => fixture(String(index), index * 100));
	const outgoing = [nodes[1], nodes[4], nodes[12]];
	for (const { node } of outgoing) node.dispatchEvent(new Event('outrostart'));
	flush();
	expect(events.filter((event) => event.startsWith('read:'))).toEqual([
		'read:1',
		'read:4',
		'read:12'
	]);
	expect(events.slice(0, 3)).toEqual(['read:1', 'read:4', 'read:12']);
	expect(outgoing.map(({ style }) => style.left)).toEqual(['96.5px', '396.5px', '1196.5px']);
	expect(outgoing.map(({ style }) => style.top)).toEqual(['34.75px', '34.75px', '34.75px']);
	expect(beforeCommit.size).toBe(0);
});

it('retains the final pre-pop box after same-update parent resize and nested removal', () => {
	const { node, style } = fixture('resized');
	update(() => {
		Object.assign(node, { offsetLeft: 220, offsetWidth: 150 });
		update(() => node.dispatchEvent(new Event('outrostart')));
	});
	// Native events can arrive after reconciliation; its flow transaction must
	// capture the latest box just as the original unconditional snapshot did.
	Object.assign(node, { offsetLeft: 320, offsetWidth: 175 });
	flush();
	expect(style.left).toBe('316.5px');
	expect(style.width).toBe('175px');
	expect(style.height).toBe('60px');
});

it('cancels an exit reversed before its flow mutation', () => {
	const { node, style } = fixture('cancelled');
	node.dispatchEvent(new Event('outrostart'));
	node.dispatchEvent(new Event('introstart'));
	flush();
	expect(style.position).toBe('');
	expect(events).toEqual([]);
	expect(beforeCommit.size).toBe(0);
});

it('restores authored CSS priority and captures a fresh box on the next exit', () => {
	const { node, style } = fixture('reversed');
	style.setProperty('position', 'relative', 'important');
	node.dispatchEvent(new Event('outrostart'));
	flush();
	expect(style.position).toBe('absolute');
	node.dispatchEvent(new Event('introstart'));
	flush();
	expect(style.position).toBe('relative');
	expect(style.getPropertyPriority('position')).toBe('important');
	Object.assign(node, { offsetLeft: 360 });
	node.dispatchEvent(new Event('outrostart'));
	flush();
	expect(style.left).toBe('356.5px');
});

it('keeps an existing pop when intro is reversed again before restoration', () => {
	const { node, style } = fixture('rapid');
	node.dispatchEvent(new Event('outrostart'));
	flush();
	const left = style.left;
	node.dispatchEvent(new Event('introstart'));
	node.dispatchEvent(new Event('outrostart'));
	flush();
	expect(style.position).toBe('absolute');
	expect(style.left).toBe(left);
	expect(beforeCommit.size).toBe(0);
});

it('removes pending captures and listeners when destroyed before a flow mutation', () => {
	const { node, style, dispose } = fixture('destroyed');
	node.dispatchEvent(new Event('outrostart'));
	dispose();
	flush();
	node.dispatchEvent(new Event('outrostart'));
	expect(style.position).toBe('');
	expect(beforeCommit.size).toBe(0);
	expect(events).toEqual([]);
});

it('keeps the direct capture fallback when the projection bridge is absent', async () => {
	delete layoutBridge.update;
	delete layoutBridge.schedule;
	const { node, style } = fixture('standalone');
	node.dispatchEvent(new Event('outrostart'));
	await Promise.resolve();
	expect(style.position).toBe('absolute');
	expect(style.left).toBe('16.5px');
	expect(beforeCommit.size).toBe(0);
});

it('can advance a native capture into the managed before-paint batch', async () => {
	const { node, style } = fixture('advanced');
	node.dispatchEvent(new Event('outrostart'));
	queueLayoutMutation(() => events.push('managed-write'), true);
	await Promise.resolve();
	flush();
	expect(style.position).toBe('absolute');
	expect(events[0]).toBe('read:advanced');
	expect(events.filter((event) => event.startsWith('read:'))).toHaveLength(1);
	expect(beforeCommit.size).toBe(0);
});

it('reads sibling containing blocks before writes and validates together after writes', () => {
	const nodes = Array.from({ length: 3 }, (_, index) => fixture(String(index)));
	for (const { node } of nodes) {
		Object.defineProperty(node, 'offsetParent', {
			get() {
				events.push(`parent:${node.id}`);
				return parent;
			}
		});
		node.dispatchEvent(new Event('outrostart'));
	}
	flush();
	const firstWrite = events.findIndex((event) => event.startsWith('write:'));
	const lastWrite = events.findLastIndex((event) => event.startsWith('write:'));
	expect(events.slice(0, firstWrite).filter((event) => event.startsWith('parent:'))).toEqual([
		'parent:0',
		'parent:1',
		'parent:2'
	]);
	expect(events.slice(firstWrite, lastWrite + 1).every((event) => event.startsWith('write:'))).toBe(
		true
	);
	expect(events.slice(lastWrite + 1)).toEqual(['parent:0', 'parent:1', 'parent:2']);
});

it('batches standalone siblings without requiring the projection bridge', async () => {
	delete layoutBridge.update;
	delete layoutBridge.schedule;
	const first = fixture('first');
	const second = fixture('second', 120);
	Object.defineProperty(second.node, 'offsetLeft', {
		get: () => (first.style.position === 'absolute' ? 20 : 120)
	});
	first.node.dispatchEvent(new Event('outrostart'));
	second.node.dispatchEvent(new Event('outrostart'));
	await Promise.resolve();
	expect(second.style.left).toBe('116.5px');
	expect(events.slice(0, 2)).toEqual(['read:first', 'read:second']);
});

it('prepares fresh geometry after an intervening mutation reparents a later exit', () => {
	const first = fixture('first');
	const second = fixture('second');
	first.node.dispatchEvent(new Event('outrostart'));
	const nextParent = {};
	queueLayoutMutation(() => {
		Object.assign(second.node, {
			parentElement: nextParent,
			offsetParent: nextParent,
			offsetLeft: 320
		});
	});
	second.node.dispatchEvent(new Event('outrostart'));
	flush();
	expect(second.style.left).toBe('316.5px');
	expect(events.indexOf('read:second')).toBeGreaterThan(
		events.findLastIndex((event) => event.startsWith('write:first:'))
	);
});

it('does not pop any siblings when a containing block is invalid during preparation', () => {
	const first = fixture('first');
	const second = fixture('second');
	Object.assign(second.node, { offsetParent: {} });
	first.node.dispatchEvent(new Event('outrostart'));
	second.node.dispatchEvent(new Event('outrostart'));
	expect(flush).toThrow('direct parent must establish a positioning context');
	expect(first.style.position).toBe('');
	expect(second.style.position).toBe('');
	expect(events.some((event) => event.startsWith('write:'))).toBe(false);
});

it('rolls back the sibling batch when its writes change a containing block', () => {
	const first = fixture('first');
	const second = fixture('second');
	first.style.setProperty('left', '7px', 'important');
	Object.defineProperty(second.node, 'offsetParent', {
		get: () => (first.style.position === 'absolute' ? null : parent)
	});
	first.node.dispatchEvent(new Event('outrostart'));
	second.node.dispatchEvent(new Event('outrostart'));
	expect(flush).toThrow('direct parent must establish a positioning context');
	expect(first.style.position).toBe('');
	expect(first.style.left).toBe('7px');
	expect(first.style.getPropertyPriority('left')).toBe('important');
	expect(second.style.position).toBe('');
	expect(second.style.width).toBe('');
});

it('checks a nested child after its parent restores its original positioning', () => {
	const ancestor = fixture('ancestor');
	ancestor.node.dispatchEvent(new Event('outrostart'));
	flush();
	const child = fixture('child');
	Object.assign(child.node, { parentElement: ancestor.node });
	Object.defineProperty(child.node, 'offsetParent', {
		get: () => (ancestor.style.position === 'absolute' ? ancestor.node : parent)
	});
	ancestor.node.dispatchEvent(new Event('introstart'));
	child.node.dispatchEvent(new Event('outrostart'));
	expect(flush).toThrow('direct parent must establish a positioning context');
	expect(ancestor.style.position).toBe('');
	expect(child.style.position).toBe('');
});
