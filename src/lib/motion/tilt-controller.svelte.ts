import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { cancelFrame, frame } from 'motion-dom';
import { readActivityState } from './activity-scope.js';
import { observeMotionConfig, observeMotionPreference, readMotionConfig } from './config.js';
import { shouldReduceMotion } from './policy.js';
import { useSpring, type UseSpringOptions } from './value-hooks.svelte.js';

export interface TiltOptions {
	perspective?: number;
	maxRotateX?: number;
	maxRotateY?: number;
	axis?: 'both' | 'x' | 'y';
	spring?: UseSpringOptions;
	disabled?: boolean;
}

export function tiltPerspective(value: number): number {
	return Number.isFinite(value) && value > 0 ? value : 800;
}

function angle(value: number | undefined): number {
	return value === undefined || !Number.isFinite(value) ? 12 : Math.min(45, Math.max(0, value));
}

/** Internal attachment: the component supplies separate measure/perspective/rotation hosts. */
export function createTilt(read: () => TiltOptions): Attachment<HTMLDivElement> {
	const active = readActivityState();
	const config = readMotionConfig();
	const spring = () => ({ stiffness: 260, damping: 26, mass: 1, ...read().spring });
	const rotateX = useSpring(0, spring);
	const rotateY = useSpring(0, spring);

	return (node) => {
		const host = node.parentElement!.parentElement!;
		function connect() {
			// Read options and inherited policy in the effect so Svelte changes reconnect.
			const options = read();
			const policy = config();
			const disabled = options.disabled;
			const maxX = angle(options.maxRotateX);
			const maxY = angle(options.maxRotateY);
			const axis = options.axis ?? 'both';
			const neutral = () => {
				rotateX.jump(0);
				rotateY.jump(0);
				cancelFrame(render);
				node.style.transform = 'none';
			};
			const render = () => {
				const x = rotateX.get();
				const y = rotateY.get();
				node.style.transform = x === 0 && y === 0 ? 'none' : `rotateX(${x}deg) rotateY(${y}deg)`;
			};
			if (!active() || disabled) {
				untrack(neutral);
				return;
			}
			const schedule = () => frame.render(render);
			const stopX = rotateX.on('change', schedule);
			const stopY = rotateY.on('change', schedule);
			const fine = matchMedia('(hover: hover) and (pointer: fine)');
			let stopTracking: (() => void) | undefined;
			let live = true;
			function refresh() {
				stopTracking?.();
				stopTracking = undefined;
				neutral();
				if (!live || !fine.matches || shouldReduceMotion(policy)) return;
				let tracking = true;
				let pointer: { x: number; y: number } | undefined;
				const measure = () => {
					if (!tracking || !pointer) return;
					const rect = host.getBoundingClientRect();
					if (!rect.width || !rect.height) {
						neutral();
						return;
					}
					const normalize = (position: number, start: number, size: number) =>
						Math.max(-1, Math.min(1, ((position - start) / size - 0.5) * 2));
					rotateX.set(axis === 'y' ? 0 : -normalize(pointer.y, rect.top, rect.height) * maxX);
					rotateY.set(axis === 'x' ? 0 : normalize(pointer.x, rect.left, rect.width) * maxY);
				};
				const move = (event: PointerEvent) => {
					if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') {
						pointer = undefined;
						neutral();
						return;
					}
					pointer = { x: event.clientX, y: event.clientY };
					measure();
				};
				const leave = () => {
					pointer = undefined;
					rotateX.set(0);
					rotateY.set(0);
				};
				const observer = new ResizeObserver(measure);
				observer.observe(host);
				host.addEventListener('pointermove', move, { passive: true });
				host.addEventListener('pointerleave', leave, { passive: true });
				host.addEventListener('pointercancel', leave, { passive: true });
				stopTracking = () => {
					tracking = false;
					observer.disconnect();
					host.removeEventListener('pointermove', move);
					host.removeEventListener('pointerleave', leave);
					host.removeEventListener('pointercancel', leave);
				};
			}
			const stopPreference = observeMotionPreference(refresh);
			const stopConfig = observeMotionConfig(config, refresh);
			fine.addEventListener('change', refresh);
			untrack(refresh);
			return () => {
				live = false;
				stopTracking?.();
				stopPreference();
				stopConfig();
				fine.removeEventListener('change', refresh);
				stopX();
				stopY();
				neutral();
			};
		}
		$effect(connect);
	};
}
