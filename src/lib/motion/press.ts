import { isDragActive, isPrimaryPointer } from 'motion-dom';

type PressEnd = (event: PointerEvent, info: { success: boolean }) => void;
type PressStart = (node: HTMLElement, event: PointerEvent) => PressEnd | void;
const nativeKeyboardElements = new Set(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A']);

/** Lifetime-owned equivalent of Motion's pointer/Enter press helper. Click stays native. */
export function attachPress(node: HTMLElement, onStart: PressStart): () => void {
	const lifetime = new AbortController();
	const options = { signal: lifetime.signal };
	let session: AbortController | undefined;
	let keyboardDown = false;
	let disposed = false;

	const dispatchKeyboardPointer = (type: 'down' | 'up' | 'cancel') => {
		node.dispatchEvent(new PointerEvent(`pointer${type}`, { isPrimary: true, bubbles: true }));
	};
	const cancelSession = () => {
		session?.abort();
		session = undefined;
		keyboardDown = false;
	};

	node.addEventListener(
		'pointerdown',
		(event) => {
			if (disposed || session || !isPrimaryPointer(event) || isDragActive()) return;
			const active = new AbortController();
			session = active;
			let onEnd: PressEnd | void;
			try {
				onEnd = onStart(node, event);
			} catch (error) {
				cancelSession();
				throw error;
			}
			if (disposed || session !== active) return;
			const finish = (end: PointerEvent, success: boolean) => {
				if (end.pointerId !== event.pointerId) return;
				cancelSession();
				if (isPrimaryPointer(end) && !isDragActive()) onEnd?.(end, { success });
			};
			const endOptions = { signal: active.signal, capture: true };
			window.addEventListener(
				'pointerup',
				(end) => finish(end, end.target instanceof Node && node.contains(end.target)),
				endOptions
			);
			window.addEventListener('pointercancel', (end) => finish(end, false), endOptions);
			window.addEventListener(
				'blur',
				() => finish(new PointerEvent('pointercancel', event), false),
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
			if (event.target !== node || event.key !== 'Enter' || event.repeat || session) return;
			keyboardDown = true;
			dispatchKeyboardPointer('down');
		},
		options
	);
	node.addEventListener(
		'keyup',
		(event) => {
			if (event.target === node && event.key === 'Enter' && keyboardDown)
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
		!node.isContentEditable &&
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
