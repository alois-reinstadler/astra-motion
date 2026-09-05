import { expect, it } from 'vitest';
import { observeLayout } from '../motion/observe.js';

const microtasks = async () => {
	for (let i = 0; i < 6; i++) await Promise.resolve();
};

function fixture(count: number) {
	const parent = document.createElement('div');
	parent.style.cssText = 'position:fixed;width:400px;height:100px';
	const nodes = Array.from({ length: count }, () => {
		const node = document.createElement('div');
		node.style.cssText = 'width:20px;height:20px';
		return node;
	});
	parent.append(...nodes);
	document.body.append(parent);
	const batches: Set<HTMLElement>[] = [];
	const observer = observeLayout(document, (dirty) => batches.push(dirty));
	for (const node of nodes) observer.add(node, () => parent);
	return {
		nodes,
		batches,
		observer,
		dispose() {
			observer.disconnect();
			parent.remove();
		}
	};
}

// Count actual participant work instead of wall time, which is noisy in CI.
// This catches quadratic affected-set construction even when no layout is measured.
async function participantInsertions(nodes: HTMLElement[], change: () => void) {
	const tracked = new Set(nodes);
	const original = Set.prototype.add;
	let insertions = 0;
	Set.prototype.add = function <T>(this: Set<T>, value: T) {
		if (value instanceof HTMLElement && tracked.has(value)) insertions++;
		return original.call(this, value) as Set<T>;
	};
	try {
		change();
		await microtasks();
		return insertions;
	} finally {
		Set.prototype.add = original;
	}
}

it.each([20, 100])(
	'processes owned animation writes on %i participants with linear work and no invalidation',
	async (count) => {
		const f = fixture(count);
		try {
			const insertions = await participantInsertions(f.nodes, () => {
				for (const node of f.nodes) {
					node.style.transform = 'translateX(10px)';
					node.style.opacity = '0.5';
					node.style.transform = 'translateX(20px)';
				}
			});
			expect(f.batches).toHaveLength(0);
			expect(insertions).toBeLessThanOrEqual(count * 4);
		} finally {
			f.dispose();
		}
	}
);

it('coalesces changed siblings into one affected root without quadratic participant work', async () => {
	const f = fixture(100);
	try {
		const insertions = await participantInsertions(f.nodes, () => {
			for (const node of f.nodes) {
				node.style.width = '30px';
				node.className = 'changed';
			}
		});
		expect(f.batches).toHaveLength(1);
		expect(f.batches[0]).toEqual(new Set(f.nodes));
		expect(insertions).toBeLessThanOrEqual(f.nodes.length * 6);
	} finally {
		f.dispose();
	}
});

it('acknowledges explicit style changes before filtering later owned animation writes', async () => {
	const f = fixture(2);
	try {
		f.nodes[0].style.width = '30px';
		f.observer.acknowledge();
		f.nodes[0].style.transform = 'translateX(10px)';
		await microtasks();
		expect(f.batches).toHaveLength(0);
		f.nodes[0].style.width = '20px';
		await microtasks();
		expect(f.batches).toHaveLength(1);
		expect(f.batches[0]).toEqual(new Set(f.nodes));
	} finally {
		f.dispose();
	}
});
