import type { Attachment } from 'svelte/attachments';
import { cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';
import { beforeCommit, queueLayoutMutation } from './commit.js';
import { shouldReduceMotion, type MotionPolicy } from './policy.js';

export interface PresenceOptions extends MotionPolicy {
	/** Milliseconds, matching Svelte transitions. */
	duration?: number;
	opacity?: number;
}

/** Svelte owns retention, nested outro groups and interruption/reversal. */
export function presence(node: Element, options: PresenceOptions = {}): TransitionConfig {
	const opacity = Number(getComputedStyle(node).opacity);
	const from = options.opacity ?? 0;
	return {
		duration: shouldReduceMotion(options) ? 0 : (options.duration ?? 180),
		easing: cubicOut,
		css: (t) => `opacity: ${opacity * (from + (1 - from) * t)}`
	};
}

/**
 * Remove an outgoing native element from flow while Svelte retains it.
 * Use on a direct child of a positioned container, with transition:presence.
 * layout.update() captures every outgoing box before any flow write.
 */
export function popLayout(): Attachment<HTMLElement> {
	return (node) => {
		const properties = [
			'position',
			'left',
			'top',
			'width',
			'height',
			'box-sizing',
			'pointer-events',
			'right',
			'bottom'
		] as const;
		let restore: Map<string, { value: string; priority: string }> | undefined;
		let alive = true;
		let present = true;
		let geometry: { left: number; top: number; width: number; height: number };
		const capture = () => {
			if (restore || !node.isConnected) return;
			const computed = getComputedStyle(node);
			geometry = {
				left: node.offsetLeft - parseFloat(computed.marginLeft),
				top: node.offsetTop - parseFloat(computed.marginTop),
				width: node.offsetWidth,
				height: node.offsetHeight
			};
		};
		const reset = () => {
			if (!restore) return;
			for (const [property, { value, priority }] of restore) {
				if (value) node.style.setProperty(property, value, priority);
				else node.style.removeProperty(property);
			}
			restore = undefined;
		};
		const pop = (event: Event) => {
			if (event.target !== node) return;
			present = false;
			queueLayoutMutation(() => {
				if (!alive || present || restore) return;
				if (!geometry) capture();
				if (node.offsetParent !== node.parentElement)
					throw new Error(
						'Astra popLayout: the direct parent must establish a positioning context (position: relative).'
					);
				restore = new Map(
					properties.map((property) => [
						property,
						{
							value: node.style.getPropertyValue(property),
							priority: node.style.getPropertyPriority(property)
						}
					])
				);
				Object.assign(node.style, {
					position: 'absolute',
					left: `${geometry.left}px`,
					top: `${geometry.top}px`,
					width: `${geometry.width}px`,
					height: `${geometry.height}px`,
					boxSizing: 'border-box',
					pointerEvents: 'none',
					right: 'auto',
					bottom: 'auto'
				});
			});
		};
		const intro = (event: Event) => {
			if (event.target !== node) return;
			present = true;
			queueLayoutMutation(() => {
				if (alive && present) reset();
			});
		};
		beforeCommit.add(capture);
		node.addEventListener('outrostart', pop);
		node.addEventListener('introstart', intro);
		return () => {
			alive = false;
			beforeCommit.delete(capture);
			node.removeEventListener('outrostart', pop);
			node.removeEventListener('introstart', intro);
			reset();
		};
	};
}
