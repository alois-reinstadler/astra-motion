<!-- Motion 13.4.4 @ 33f6e72; source mapping and MIT attribution: tests/motion-baseline. -->
<script lang="ts">
	import { untrack } from 'svelte';
	import {
		motion,
		AnimatePresence,
		useDragControls,
		useMotionValue,
		type GestureOptions,
		type PanInfo
	} from '../motion/index.js';
	let {
		options = {},
		tag = 'div',
		mode = '',
		initialX = 0,
		initialY = 0,
		report = () => {}
	}: {
		options?: GestureOptions;
		tag?: 'div' | 'button' | 'input' | 'a';
		mode?: string;
		initialX?: number;
		initialY?: number;
		report?: (name: string, info?: Pick<PanInfo, 'point'>) => void;
	} = $props();
	let settings = $state.raw<GestureOptions>(untrack(() => options));
	let revision = $state('old');
	let replacement = $state(false);
	let second = $state(false);
	const firstControls = useDragControls(),
		secondControls = useDragControls();
	const x = useMotionValue(untrack(() => initialX)),
		y = useMotionValue(untrack(() => initialY)),
		nextX = useMotionValue(25),
		parentX = useMotionValue(0);
	const controls = $derived(second ? secondControls : firstControls);
	const currentX = $derived(replacement ? nextX : x);
	export function configure(next: GestureOptions) {
		settings = { ...settings, ...next };
	}
	export function updateCallbacks() {
		revision = 'new';
	}
	export function replaceValue() {
		replacement = true;
	}
	export function replaceControls() {
		second = true;
	}
	export function start(event: PointerEvent, which: 'old' | 'new' = 'old', snap = false) {
		(which === 'old' ? firstControls : secondControls).start(event, { snapToCursor: snap });
	}
	export function read() {
		return { x: currentX.get(), oldX: x.get(), y: y.get(), parentX: parentX.get() };
	}

	const dragProps = $derived({
		'data-testid': 'target',
		initial: { x: initialX, y: mode === 'presence-initial' ? 200 : initialY, opacity: 0.2 },
		animate: mode === 'presence-initial' ? { y: 0 } : undefined,
		transition: { type: false as const },
		style: { x: currentX, y, width: 80, height: 80, display: 'block', backgroundColor: 'teal' },
		drag: true,
		dragMomentum: false,
		...settings,
		dragControls: controls,
		onDragStart: (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) =>
			report(`${revision}:start`, info),
		onDrag: (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
			if (mode === 'reset-value') (replacement ? nextX : x).set(0);
			report(`${revision}:move`, info);
		},
		onDragEnd: (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) =>
			report(`${revision}:end`, info),
		onPanSessionStart: (
			_event: MouseEvent | TouchEvent | PointerEvent,
			info: Pick<PanInfo, 'point'>
		) => report(`${revision}:session`, info),
		onDragTransitionEnd: () => report('settled')
	});
</script>

{#snippet content()}
	<span data-testid="plain">Plain</span>
	<button
		data-testid="child"
		type="button"
		onpointerup={mode === 'stop-up' ? (event) => event.stopPropagation() : undefined}>Child</button
	>
	{#if mode === 'inputs'}
		<input data-testid="input" aria-label="Input" />
		<textarea data-testid="textarea" aria-label="Textarea"></textarea>
		<select data-testid="select" aria-label="Select"><option>One</option></select>
		<label><input data-testid="checkbox" type="checkbox" />Check</label>
		<div
			data-testid="editable"
			contenteditable="true"
			role="textbox"
			tabindex="0"
			aria-label="Editable"
		>
			Edit
		</div>
		<a data-testid="link" href="#drag-test">Link</a>
	{/if}
{/snippet}

<motion.div
	data-testid="parent"
	drag={mode === 'nested' ? 'x' : false}
	dragMomentum={mode === 'nested'}
	style={{ x: parentX, width: 400, height: 300 }}
	onpointerdown={mode === 'parent-handle' ? (event) => controls.start(event) : undefined}
>
	<AnimatePresence initial={mode === 'presence-initial' ? false : true}>
		{#if tag === 'input'}<motion.input {...dragProps} />
		{:else if tag === 'button'}<motion.button {...dragProps}>{@render content()}</motion.button>
		{:else if tag === 'a'}<motion.a {...dragProps}>{@render content()}</motion.a>
		{:else}<motion.div {...dragProps}>{@render content()}</motion.div>{/if}
	</AnimatePresence>
</motion.div>
<button data-testid="handle" type="button" onpointerdown={(event) => controls.start(event)}
	>Handle</button
>
