import { hover } from 'motion-dom';
import { attachPress } from './press.js';
import { resolveElement } from './coordinates.js';
import { createGestureSession } from './gesture-session.js';
import type { GestureElement, GestureOptions, GestureState } from './gestures.js';

/** Hover, press, focus and viewport; no drag, pan or projection imports. */
export function attachBaseGestures(
	node: GestureElement,
	getOptions: () => GestureOptions,
	setActive: (name: GestureState, active: boolean) => void
): () => void {
	const session = createGestureSession(node, getOptions, setActive);
	const { initial, cleanups, active, isDisposed, disabled, activate, defer, pagePoint, on } =
		session;
	if (initial.whileHover || initial.onHoverStart || initial.onHoverEnd) {
		cleanups.push(
			hover(node, (_, event) => {
				if (disabled()) return;
				activate('whileHover', true);
				defer(() => {
					if (!disabled()) getOptions().onHoverStart?.(event, { point: pagePoint(event) });
				});
				return (end) => {
					activate('whileHover', false);
					defer(() => {
						if (!disabled()) getOptions().onHoverEnd?.(end, { point: pagePoint(end) });
					});
				};
			})
		);
	}

	if (initial.whileTap || initial.onTap || initial.onTapStart || initial.onTapCancel) {
		const originalTabIndex = node.getAttribute('tabindex');
		cleanups.push(
			attachPress(
				node,
				(_, event) => {
					if (disabled()) return;
					activate('whileTap', true);
					defer(() => {
						if (!disabled()) getOptions().onTapStart?.(event, { point: pagePoint(event) });
					});
					return (end, { success }) => {
						if (!active.has('whileTap')) return;
						activate('whileTap', false);
						defer(() => {
							if (!disabled())
								(success ? getOptions().onTap : getOptions().onTapCancel)?.(end, {
									point: pagePoint(end)
								});
						});
					};
				},
				initial
			)
		);
		cleanups.push(() => {
			if (originalTabIndex === null && node.getAttribute('tabindex') === '0')
				node.removeAttribute('tabindex');
		});
		on('keydown', (event) => {
			const key = event as KeyboardEvent;
			if (key.key === ' ' && !key.repeat && !disabled()) activate('whileTap', true);
		});
		on('keyup', (event) => {
			if ((event as KeyboardEvent).key === ' ') activate('whileTap', false);
		});
		on('blur', () => activate('whileTap', false));
	}

	if (initial.whileFocus) {
		on('focus', () => {
			let visible = true;
			try {
				visible = node.matches(':focus-visible');
			} catch {
				/* Older selector implementations. */
			}
			if (!disabled() && visible) activate('whileFocus', true);
		});
		on('blur', () => activate('whileFocus', false));
	}

	if (
		(initial.whileInView || initial.onViewportEnter || initial.onViewportLeave) &&
		typeof IntersectionObserver !== 'undefined'
	) {
		const viewport = initial.viewport;
		const threshold =
			viewport?.amount === 'all' ? 1 : typeof viewport?.amount === 'number' ? viewport.amount : 0;
		const observer = new IntersectionObserver(
			(entries) => {
				if (isDisposed()) return;
				for (const entry of entries) {
					const visible = entry.isIntersecting && entry.intersectionRatio >= threshold;
					if (disabled() || active.has('whileInView') === visible) continue;
					activate('whileInView', visible);
					if (visible) getOptions().onViewportEnter?.(entry);
					else getOptions().onViewportLeave?.(entry);
					if (visible && viewport?.once) observer.disconnect();
				}
			},
			{ root: resolveElement(viewport?.root), rootMargin: viewport?.margin, threshold }
		);
		observer.observe(node);
		cleanups.push(() => observer.disconnect());
	}

	return session.dispose;
}
