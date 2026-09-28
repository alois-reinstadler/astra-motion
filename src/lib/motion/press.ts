import { isDragActive, isPrimaryPointer } from 'motion-dom';

type PressEnd = (event: PointerEvent, info: { success: boolean }) => void;
type PressStart = (node: HTMLElement | SVGElement, event: PointerEvent) => PressEnd | void;
const nativeKeyboardElements = new Set(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']);
const claimedEvents = new WeakSet<Event>();
const activePresses = new Set<(event: PointerEvent) => void>();

/** A drag claims a pointer after the threshold, and cancels its nested tap feedback. */
export function cancelPointerPresses(event: PointerEvent): void {
	for (const cancel of [...activePresses]) cancel(event);
}

/** Lifetime-owned equivalent of Motion's pointer/Enter press helper. Click stays native. */
export function attachPress(
	node: HTMLElement | SVGElement,
	onStart: PressStart,
	config: { globalTapTarget?: boolean; propagate?: { tap?: boolean } } = {}
): () => void {
	const view = node.ownerDocument.defaultView!;
	const lifetime = new AbortController();
	const options = { signal: lifetime.signal };
	let session: AbortController | undefined;
	let keyboardDown = false;
	let disposed = false;
	let cancelPress: ((event: PointerEvent) => void) | undefined;

	const dispatchKeyboardPointer = (type: 'down' | 'up' | 'cancel') => {
		node.dispatchEvent(new PointerEvent(`pointer${type}`, { isPrimary: true, bubbles: true }));
	};
	const cancelSession = () => {
		if (cancelPress) activePresses.delete(cancelPress);
		cancelPress = undefined;
		session?.abort();
		session = undefined;
		keyboardDown = false;
	};

	(config.globalTapTarget ? view : node).addEventListener(
		'pointerdown',
		(event) => {
			const pointerEvent = event as PointerEvent;
			if (
				disposed ||
				session ||
				!isPrimaryPointer(pointerEvent) ||
				isDragActive() ||
				claimedEvents.has(event)
			)
				return;
			if (config.propagate?.tap === false) claimedEvents.add(event);
			const active = new AbortController();
			session = active;
			let onEnd: PressEnd | void;
			try {
				onEnd = onStart(node, pointerEvent);
			} catch (error) {
				cancelSession();
				throw error;
			}
			if (disposed || session !== active) return;
			const finish = (end: PointerEvent, success: boolean) => {
				if (end.pointerId !== pointerEvent.pointerId) return;
				cancelSession();
				if (isPrimaryPointer(end)) onEnd?.(end, { success: success && !isDragActive() });
			};
			cancelPress = (end) => finish(end, false);
			activePresses.add(cancelPress);
			const endOptions = { signal: active.signal, capture: true };
			view.addEventListener(
				'pointerup',
				(end) =>
					finish(
						end,
						!!config.globalTapTarget || (end.target instanceof Node && node.contains(end.target))
					),
				endOptions
			);
			view.addEventListener('pointercancel', (end) => finish(end, false), endOptions);
			view.addEventListener(
				'blur',
				() => finish(new PointerEvent('pointercancel', pointerEvent), false),
				{ signal: active.signal }
			);
		},
		options
	);

	// Install once, including when the element was already focused before reattachment.
	// One keyup/blur handler also avoids allocating listeners on every Enter press.
	node.addEventListener(
		'keydown',
		(event) => {
			const keyboard = event as KeyboardEvent;
			if (event.target !== node || keyboard.key !== 'Enter' || keyboard.repeat || session) return;
			keyboardDown = true;
			dispatchKeyboardPointer('down');
		},
		options
	);
	node.addEventListener(
		'keyup',
		(event) => {
			if (event.target === node && (event as KeyboardEvent).key === 'Enter' && keyboardDown)
				dispatchKeyboardPointer('up');
		},
		options
	);
	node.addEventListener(
		'blur',
		() => {
			if (keyboardDown) dispatchKeyboardPointer('cancel');
		},
		options
	);
	if (
		!nativeKeyboardElements.has(node.tagName) &&
		!(node.tagName.toLowerCase() === 'a' && node.hasAttribute('href')) &&
		!('isContentEditable' in node && node.isContentEditable) &&
		!node.hasAttribute('tabindex')
	)
		node.tabIndex = 0;

	return () => {
		if (disposed) return;
		disposed = true;
		lifetime.abort();
		cancelSession();
	};
}
