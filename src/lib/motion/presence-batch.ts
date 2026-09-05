import { calcChildStagger, type HTMLVisualElement, type Transition } from 'motion-dom';
import type { PresenceTimeline } from './presence-state.js';

interface Entry {
	visual: HTMLVisualElement;
	timeline: PresenceTimeline;
	transition: Transition;
	direction: 'in' | 'out';
	children: Entry[];
	offset: number;
	span: number;
}
const pending = new Map<HTMLVisualElement, Entry>();

/** Svelte invokes deferred factories together, probing duration during each factory.
 * A temporary positive probe keeps its clock alive until the batch is scheduled.
 * Only those native transitions participate: local/global semantics remain Svelte's.
 * This schedules finite Motion trajectories; it neither owns DOM retention nor runs a clock.
 */
function flush() {
	if (!pending.size) return;
	const batch = new Map(pending);
	pending.clear();
	const roots: Entry[] = [];
	for (const entry of batch.values()) {
		let parent = entry.visual.parent;
		while (parent && !batch.has(parent as HTMLVisualElement)) parent = parent.parent;
		const ancestor = parent && batch.get(parent as HTMLVisualElement);
		if (ancestor && ancestor.direction === entry.direction) ancestor.children.push(entry);
		else roots.push(entry);
	}
	function measure(entry: Entry): number {
		const { delayChildren = 0, staggerChildren, staggerDirection, when } = entry.transition;
		const children = new Set(entry.children.map((child) => child.visual));
		let childSpan = 0;
		for (const child of entry.children) {
			child.offset = Math.max(
				0,
				1000 *
					((typeof delayChildren === 'number' ? delayChildren : 0) +
						calcChildStagger(
							children,
							child.visual,
							delayChildren,
							staggerChildren,
							staggerDirection
						))
			);
			childSpan = Math.max(childSpan, child.offset + measure(child));
		}
		entry.span = when ? entry.timeline.span + childSpan : Math.max(entry.timeline.span, childSpan);
		return entry.span;
	}
	function place(entry: Entry, start: number) {
		const when = entry.transition.when;
		const childSpan = Math.max(0, ...entry.children.map((child) => child.offset + child.span));
		entry.timeline.schedule(start + (when === 'afterChildren' ? childSpan : 0), start + entry.span);
		for (const child of entry.children)
			place(child, start + child.offset + (when === 'beforeChildren' ? entry.timeline.span : 0));
	}
	for (const root of roots) {
		measure(root);
		place(root, 0);
	}
}

export function coordinatePresence(
	visual: HTMLVisualElement,
	timeline: PresenceTimeline,
	transition: Transition,
	direction: 'in' | 'out'
): PresenceTimeline {
	const entry: Entry = {
		visual,
		timeline,
		transition,
		direction,
		children: [],
		offset: 0,
		span: 0
	};
	if (!pending.size) queueMicrotask(flush);
	pending.set(visual, entry);
	return {
		get duration() {
			// Svelte probes duration synchronously while invoking each deferred factory.
			// Keep the native clock alive until all factories have supplied their tracks.
			return pending.get(visual) === entry
				? Math.max(1, timeline.duration ?? 0)
				: timeline.duration;
		},
		get progress() {
			return timeline.progress;
		},
		get span() {
			return timeline.span;
		},
		schedule: timeline.schedule,
		easing: timeline.easing,
		tick(t, u) {
			flush();
			timeline.tick?.(t, u);
		},
		finish() {
			if (pending.get(visual) === entry) pending.delete(visual);
			timeline.finish();
		},
		cancel() {
			if (pending.get(visual) === entry) pending.delete(visual);
			timeline.cancel();
		}
	};
}
