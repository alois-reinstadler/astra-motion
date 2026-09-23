# Independent React / Motion comparison

Review base: `ab801d65283e55b4cd34d509960805995cd81b0f`, Astra 0.0.1. Reviewed 2026-09-22. This reviewer made no production changes, installed no dependencies, launched no browser, and ran no UI tests. Evidence below is documentation and source inspection plus syntax parsing of the authored React fragments. The main review records the independent packed-consumer browser results.

## Version discipline and fair baseline

- Astra's `package.json:155` pins `motion` and `motion-dom` to 13.2.0. Existing installation also contains `framer-motion` 13.2.0, which supplies `motion/react`'s implementation. Those exact installed files were read.
- A read-only package registry query returned Motion / Framer Motion **13.4.1**, React / React DOM **19.3.0** as current. Published Motion and Framer Motion 13.4.1 archives were downloaded to `/tmp/astra-ergonomics-review/react-source` solely for source inspection. No repository dependency was upgraded. [Motion package metadata](https://registry.npmjs.org/motion/13.4.1), [React package metadata](https://registry.npmjs.org/react/19.3.0).
- Pin caveat: `motion@13.2.0` itself declares `framer-motion: ^13.2.0`; a fresh consumer can resolve newer transitive code than the repository lockfile. Record its actual resolved versions. The direct exact pins do not by themselves prove one fully frozen engine graph.
- The main equivalents use the ordinary `motion/react` APIs present in **13.2.0**. The route comparison additionally identifies **13.4.1**'s current `AnimateView`; do not claim React has no native View Transition integration.
- Current naming is **Motion for React**, imported from `motion/react`. The current package still delegates to `framer-motion`; historical names in installed source comments are not evidence of a different API. `AnimateSharedLayout`, `exitBeforeEnter`, and `motion(Custom)` are historical conventions, not the recommendations used here. Current custom-component wrapping is `motion.create(Custom)`; current exit sequencing is `mode="wait"`. [Upgrade guide](https://motion.dev/docs/react-upgrade-guide).
- React needs React / React DOM and the Motion package, with `reducedMotion="user"` explicitly supplied when OS respect is intended. Astra already defaults to the OS policy. Standard React examples do not need a special build plugin. SSR and React Server Component restrictions remain framework concerns; using a client component for interactive examples is assumed. [Installation](https://motion.dev/docs/react-installation).
- Accessible semantics, focus handling, keyboard alternatives to drag, labels, and reduced-motion handling count on both sides. Motion does not replace a dialog primitive or a tabs implementation.

## Ten scenario equivalents and adversarial attempts

The React fragments below are independent render or component examples, not a single application. They use React state / refs / effects and Motion 13.2.0 unless explicitly marked. They were checked against current official docs and corresponding installed source, then parsed for JSX syntax; they were **not mounted, typechecked with React types, or browser-tested**. Parent's Astra consumer tests are the runtime evidence. Each fragment assumes imports shown in the common setup when needed:

```jsx
import { useEffect, useRef, useState, useSyncExternalStore, startTransition } from 'react';
import {
	AnimatePresence,
	LayoutGroup,
	MotionConfig,
	motion,
	stagger,
	useAnimate,
	useMotionValue,
	useScroll
} from 'motion/react';
```

Application setup for equivalent initial OS policy is `<MotionConfig reducedMotion="user">...</MotionConfig>`. Live preference handling for scroll is addressed separately below. Do not wrap every fragment in invented setup that Astra does not need.

### 1. Conditional entry / exit

Astra idiom: `Motion` in a normal `{#if open}` with `motion.initial`, `motion.animate`, `motion.exit`; this is implemented by `MotionComponent.svelte:34–75`. Existing-native alternative is the complete State & presence recipe in `docs/authoring.md`, with `panel.props` and `transition:enterExit`.

```jsx
function Notice() {
	const [open, setOpen] = useState(true);
	return (
		<>
			<button onClick={() => setOpen((value) => !value)}>Toggle notice</button>
			<AnimatePresence>
				{open && (
					<motion.section
						key="notice"
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -12 }}
						transition={{ duration: 0.24 }}
					>
						Saved draft.
					</motion.section>
				)}
			</AnimatePresence>
		</>
	);
}
```

Novice Astra error: binding exit without directive. Novice React error: put `AnimatePresence` inside the conditional, removing the owner together with its child. Refactor: moving Astra's native element into a wrapper requires forwarding both attachment props and a transition; React's wrapper must remain the keyed presence child and contain the motion node. Both reversal paths need runtime checks; this reviewer did not execute them. Native Svelte `transition:fade` is the simplest solution if only opacity entry/exit is needed, with explicit reduced-motion treatment. Astra wins ordinary conditional exit scaffolding over React. React supplies custom asynchronous removal via `usePresence`; Astra intentionally supports finite native transition trajectories only.

### 2. Keyed add / remove / reorder / undo

Astra idiom: keyed `Motion as="li"` for simple retention, or per-row component with one binding, its transition, `popLayout()` and a shared layout controller for immediate sibling reflow. Existing full call site is `QueueItem.svelte:118–166` plus `PublishingQueue.svelte`. A layout attachment can be produced per row without sharing a stateful motion binding.

```jsx
function Rows({ items, remove }) {
	return (
		<ul style={{ position: 'relative' }}>
			<AnimatePresence mode="popLayout">
				{items.map((item) => (
					<motion.li
						key={item.id}
						layout
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					>
						<button onClick={() => remove(item.id)}>Remove {item.label}</button>
					</motion.li>
				))}
			</AnimatePresence>
		</ul>
	);
}
```

Both sides need stable data identity, stored deleted data for undo, and sensible focus when the active item disappears. React's retained-key algorithm recognizes keys that return before removal (`AnimatePresence/index.mjs:91–103`); post-destruction undo creates a new instance in both frameworks. Do not present index keys as equivalent. Novice Astra: reuse one binding in the loop. Novice React: index keys. Refactor: extracting React rows under `popLayout` must forward the ref; Astra extraction must own or accept a binding and preserve its global outro behavior. Ref forwarding remains required in React 19, although the ref may be an ordinary prop instead of `forwardRef`. Native Svelte `animate:flip` plus `transition:fade` is a smaller choice for simple keyed reorders; it has immediate-child restrictions and does not replace shared layout / drag. [Svelte animate](https://svelte.dev/docs/svelte/animate).

### 3. Existing headless dialog / accordion

Astra idiom is the adapted Bits UI wrapper in the main review and consumer fixture. A raw consumer must implement the child snippet / `forceMount` / merged-props / transition bridge; merely passing `motion={binding}` to an unrelated component is unsupported.

```jsx
// In addition to common imports: import * as Dialog from '@radix-ui/react-dialog';
function EditorDialog() {
	const [open, setOpen] = useState(false);
	return (
		<Dialog.Root open={open} onOpenChange={setOpen}>
			<Dialog.Trigger>Edit caption</Dialog.Trigger>
			<AnimatePresence>
				{open && (
					<Dialog.Portal key="editor" forceMount>
						<Dialog.Overlay asChild forceMount>
							<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
						</Dialog.Overlay>
						<Dialog.Content asChild forceMount>
							<motion.div
								initial={{ opacity: 0, scale: 0.98 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.98 }}
							>
								<Dialog.Title>Edit caption</Dialog.Title>
								<Dialog.Description>Update the photo description.</Dialog.Description>
								<label>
									Caption <input />
								</label>
								<Dialog.Close>Done</Dialog.Close>
							</motion.div>
						</Dialog.Content>
					</Dialog.Portal>
				)}
			</AnimatePresence>
		</Dialog.Root>
	);
}
```

The snippet's animation integration follows [Motion's Radix guide](https://motion.dev/docs/radix); dialog-specific keyboard / focus behavior still requires browser validation. Both sides must test Escape, focus restoration, opening during exit and owner teardown. Novice on either side: animate the primitive without taking control of its mounting. Refactor: add a portal or replace the DOM-owning wrapper; check ref / snippet forwarding and transform-based centering. For intrinsic-height accordion reveal, native Svelte `slide` is appropriately retained in Astra's wrapper; React can animate height but doing so is not equivalent to scale projection and still needs accessible accordion behavior. Astra should not grow general CSS utilities to hide this distinction.

### 4. Shared underline and card-to-detail

Astra idiom: `const group = createLayout()` shared between participants; attach `group({ id: 'underline' })` to the active indicator, or give Motion bindings `layoutGroup: group` plus `layout: { id: product.id }`. Unnamed controllers isolate independent widgets. A detail presentation needs independent accessible open/close behavior and stable image geometry.

```jsx
function SectionButtons({ labels, selected, select, widgetId }) {
	return (
		<LayoutGroup id={widgetId}>
			<nav aria-label="Product sections">
				{labels.map((label) => (
					<button key={label} aria-pressed={label === selected} onClick={() => select(label)}>
						{label}
						{label === selected && <motion.span layoutId="underline" />}
					</button>
				))}
			</nav>
		</LayoutGroup>
	);
}

function SharedImage({ product, detailed, toggle }) {
	return (
		<LayoutGroup id={`product-${product.id}`}>
			<button onClick={toggle}>Toggle detail view</button>
			<AnimatePresence initial={false}>
				{detailed ? (
					<motion.figure key="detail" layoutId="photo" layout>
						<motion.img layout="position" src={product.src} alt={product.alt} />
					</motion.figure>
				) : (
					<motion.figure key="card" layoutId="photo" layout>
						<motion.img layout="position" src={product.src} alt={product.alt} />
					</motion.figure>
				)}
			</AnimatePresence>
		</LayoutGroup>
	);
}
```

This is an inline detail swap, not a modal; a modal needs the headless layer from scenario 3. Both render paths require CSS sizing, indicator positioning and intrinsic image dimensions; those normal presentation concerns are deliberately not counted as a library advantage. Novice Astra: same element ID in separate unnamed controllers. Novice React: repeat a global `layoutId` in independent widgets without `LayoutGroup id`. Refactor: widen an observation root in Astra if reflow sources move outside the observed subtree; React requires grouped remeasurement when affecting siblings do not rerender. Text/image counter-projection scaffolding is partly shared engine work: React also needs layout-enabled children or position-only projection and a transformable content host. No fair comparison assumes React never distorts text. [Layout guidance](https://motion.dev/docs/react-layout-animations).

### 5. Parent / child variants, stagger, nested exits

Astra idiom: `parent.child(childOptions)` declared during setup for SSR, both bindings spread on DOM, native transitions, `|global` where removal of an enclosing block must trigger children. The full authoring recipe demonstrates exactly this. Svelte owns the retained group; Motion supplies trajectories.

```jsx
const groupStates = {
	hidden: { opacity: 0, transition: { when: 'afterChildren', delayChildren: stagger(0.06) } },
	shown: { opacity: 1, transition: { delayChildren: stagger(0.06) } }
};
const childStates = { hidden: { opacity: 0, y: 12 }, shown: { opacity: 1, y: 0 } };
function VariantPanel({ open }) {
	return (
		<AnimatePresence>
			{open && (
				<motion.section
					key="panel"
					initial="hidden"
					animate="shown"
					exit="hidden"
					variants={groupStates}
				>
					<motion.h2 variants={childStates}>Caption</motion.h2>
					<motion.p variants={childStates}>Edit the photo details.</motion.p>
				</motion.section>
			)}
		</AnimatePresence>
	);
}
```

Current documentation prefers `delayChildren: stagger(...)`; Astra's `staggerChildren` remains supported by the pinned engine and should not be called broken merely because historical tutorials favor it. [Transitions](https://motion.dev/docs/react-transitions). React's ordinary child components inherit variant labels via context; adding a nested `AnimatePresence` introduces an exit boundary and may require `propagate`. In Astra, extracting a nested conditional can introduce a local transition boundary and require `|global`. Both have refactor traps. Astra's explicit child must also remain a DOM descendant; a portal is a separate architectural restriction. Novice Astra: assume DOM nesting yields matching SSR initial styles. Novice React: give child `animate` its own target then expect inherited variant control. Test close during stagger and immediately reopen; source inspection does not establish frame-perfect parity. [Variants](https://motion.dev/docs/react-animation), [Svelte transition semantics](https://svelte.dev/docs/svelte/transition).

### 6. Hover, press, drag, reactive state and layout

Astra idiom for native binding: `createMotion(() => ({ animate: { x: offset }, whileHover: { scale: 1.03 }, whileTap: { scale: .97 }, drag: 'x', dragConstraints: { left: 0, right: 160 }, layout: true }))`. Native `onclick` changes Svelte state. The equivalent Motion component nests the same engine choices in `motion` and observes the template expression automatically.

```jsx
function AdjustableCard() {
	const [offset, setOffset] = useState(0);
	return (
		<>
			<motion.button
				layout
				drag="x"
				dragMomentum={false}
				dragConstraints={{ left: 0, right: 160 }}
				animate={{ x: offset }}
				whileHover={{ scale: 1.03 }}
				whileTap={{ scale: 0.97 }}
				style={{ touchAction: 'pan-y' }}
				onClick={() => setOffset((value) => (value === 0 ? 80 : 0))}
			>
				Move card
			</motion.button>
			<button onClick={() => setOffset(0)}>Move to start</button>
			<button onClick={() => setOffset(160)}>Move to end</button>
		</>
	);
}
```

Both examples intentionally let declarative state retarget the same coordinate drag owns; acceptance must define whether a click following drag is suppressed and where release leaves the card. Use a shared MotionValue when drag and state need one explicit position source. Separate native buttons provide keyboard alternatives; pointer drag alone is not a keyboard reorder implementation. Astra's actual queue writes its own drag-handle / keyboard logic (`QueueItem.svelte:35–117`, `:169–178`), so do not attribute all showcase behavior to `drag: true`.

Novice Astra: object-form state snapshot, `createMotion({ animate: { x: offset } })`. React's render expression naturally refreshes that target; React can still capture stale state in effects and callbacks. Refactor: add a transform to an ancestor or use a responsive constraint element. Astra only supports numeric bounds and excludes transformed coordinates, ref constraints, elastic overshoot and drag controls (`gestures.ts:63–70`); current Motion supports ref-based constraints and more controls. This is a stated capability gap, not proof Astra should implement every drag feature. [Drag documentation](https://motion.dev/docs/react-drag).

### 7. Scoped timeline, cancellation and teardown

Astra idiom: create scope during initialization, attach `scene.attach`, call `scene.sequence`, keep returned controls only while the scope is mounted. Replaying with overlapping targets automatically stops the whole previous sequence. This is stronger default interruption policy than the bare engine and deserves credit.

```jsx
function Timeline() {
	const [scope, animate] = useAnimate();
	const run = useRef(null);
	function play() {
		run.current?.stop();
		run.current = animate([
			['.tile', { y: -24, opacity: 0.5 }, { duration: 0.2 }],
			['.tile', { y: 0, opacity: 1 }, { duration: 0.3 }]
		]);
	}
	return (
		<>
			<button onClick={play}>Play / replace</button>
			<button onClick={() => run.current?.stop()}>Stop</button>
			<section ref={scope}>
				<div className="tile">Only this tile moves.</div>
			</section>
		</>
	);
}
```

`useAnimate` already cleans up when its owning component unmounts; a fair React example does not add unnecessary cleanup just to increase its size. It does explicitly stop prior playback here so the entire previous sequence is replaced, matching Astra. Novice both sides: await playback then clear a busy flag; see finding F8 in the main review. Refactor: conditionally remove only the root while retaining the scope owner. Astra ties scope cleanup to the attachment; React's hook cleanup is owner-unmount based, so explicitly stop when independently removing a scope node. Add a live-generation guard before asynchronous work starts another animation after teardown on either side. The snippet is intentionally synchronous and avoids claiming a cancelled await resumes.

### 8. Container scroll and live reduced motion

Astra idiom: `const reading = createScroll()`, attach `reading.container`, attach `reading.animate({ transform: ['scaleX(0)', 'scaleX(1)'] })` to a dedicated decorative node, keep `reading.progress` for semantic progress even when decoration settles. Its selected-axis `progress` is different from React's four values; neither naming is inherently wrong.

React's usual baseline is `useScroll({ container })` plus `style={{ scaleX: scrollYProgress }}`. For _live_ reduction matching Astra's settle-to-final decorative behavior, a separate media subscription is necessary with the inspected versions:

```jsx
const query = '(prefers-reduced-motion: reduce)';
function subscribeReduce(notify) {
	const media = window.matchMedia(query);
	media.addEventListener('change', notify);
	return () => media.removeEventListener('change', notify);
}
function reducedSnapshot() {
	return window.matchMedia(query).matches;
}
function serverReducedSnapshot() {
	return false;
}
function ReadingSurface() {
	const container = useRef(null);
	const { scrollYProgress } = useScroll({ container });
	const reduced = useSyncExternalStore(subscribeReduce, reducedSnapshot, serverReducedSnapshot);
	return (
		<section ref={container} style={{ overflow: 'auto', height: 220, position: 'relative' }}>
			<motion.div
				aria-hidden="true"
				style={{ scaleX: reduced ? 1 : scrollYProgress, transformOrigin: 'left' }}
			/>
			<article style={{ minHeight: 700 }}>Reading content.</article>
		</section>
	);
}
```

The bar also needs ordinary visible dimensions/color. For a semantic progressbar, both sides must maintain `aria-valuenow` from progress and must not announce 100% just because decorative motion settled. Novice Astra: attach a scroll animation to a node already owned by `Motion`; runtime conflict. Novice React: assume `MotionConfig` alone disables a scroll-driven MotionValue or that its documented `useReducedMotion` is live. Refactor: move the scroll container into a child; refs / attachments must bind the actual scroller and cleanup must follow replacement. Source confirms Astra waits once a declared container disappears rather than silently reverting to window; React useScroll reports pending refs and uses hook cleanup. Hardware acceleration depends on offsets/browser support; this review did not benchmark it. [useScroll](https://motion.dev/docs/react-use-scroll).

### 9. SSR / hydration, initial:false and inherited defaults

Astra idiom: `<MotionConfig>` above the component that constructs a binding; or place `Motion` inside the provider in the same template. Use `initial: false` for final first pose and `parent.child()` for explicit SSR variant ancestry. These are different paths with different required setup.

```jsx
function ServerSafeNotice() {
	return (
		<MotionConfig reducedMotion="user" transition={{ duration: 0.24 }}>
			<motion.section initial={false} animate={{ opacity: 1, x: 0 }}>
				Ready on the server.
			</motion.section>
		</MotionConfig>
	);
}
```

The server cannot infer a browser media query on either side. Avoid server markup that hides required content forever without hydration. React `motion` serializes its initial values and inherits via the component tree; Astra bindings serialize through `binding.props`. An attachment without the props spread cannot supply SSR inline motion styles.

Novice Astra: create a binding in the same component's script and wrap its DOM with `MotionConfig`, expecting descendant-DOM inheritance. It captures the component's existing context before the provider is constructed. Refactor from `Motion` to native binding can therefore change policy/defaults. This is ordinary context timing exposed by Astra's API, not a problem React universally solves: a React hook in a component also cannot consume a provider returned by that same component. Comparing React `motion.div` to an Astra setup-time binding without acknowledging the phase difference is unfair. Proposed remedy is a setup-time provider utility or provider-owned binding factory _only if_ same-component native composition is important enough; changing global context lookup at mount risks breaking SSR parity. [Motion component](https://motion.dev/docs/react-motion-component).

### 10. SvelteKit route with shared content

Astra idiom: `routeTransitions()` once in a persistent Kit layout, and `routeShared(product.id, { scope: 'products' })` on source/destination content. This is a useful narrowly scoped integration: Kit owns navigation; the browser owns snapshots; local layout IDs do not automatically become route identities (`routes.ts:120`, `:140`). Duplicate identity diagnostics and cleanup are real work the wrapper removes.

A version-matched React 13.2.0 _local render swap_ can use `LayoutGroup`, keyed `AnimatePresence` and `layoutId`. It is not equivalent to a framework route transition. Actual React routing requires a router-persistent presence owner and route/location identity or the router's native View Transition support; data fetching, focus and scroll restoration belong to that router. Do not show a fake `setPage()` and claim route parity.

Current **Motion 13.4.1 + React/React DOM 19.3.0** additionally provides the browser-snapshot path:

```jsx
// Current-version path only; not exported by Motion 13.2.0:
// import { AnimateView } from 'motion/react-animate-view';
function ProductImage({ product }) {
	return (
		<AnimateView name={`product-${product.id}`}>
			<img src={product.src} alt={product.alt} width={640} height={480} />
		</AnimateView>
	);
}
// The router or view owner must perform the relevant update in startTransition:
// startTransition(() => navigateToProduct(product.id));
// This is an integration contract, not a verified recipe for a named router.
```

`AnimateView` uses React's ViewTransition component, needs matching unique names, and animates browser snapshots; this resembles Astra routes more closely than local `layoutId`. It is explicitly separate from `motion/react`, and older React / Motion versions cannot use it. [AnimateView](https://motion.dev/docs/react-animate-view).

Novice Astra: reuse `layout.id` across pages without registering route identities, or install one coordinator per page. Novice React: unmount `AnimatePresence` with the route, or assume native snapshots have local projection's interruption semantics. Refactor: move shared image into a portal or add multiple copies of a matching name; validate identity and snapshot visibility. On both sides verify fast double navigation, back/forward, focus/scroll restoration, preference changes, transition rejection and absence of browser support. Those route integration behaviors were not executed by this reviewer.

## Validation boundary

Eleven JSX fragments were parsed without syntax errors. These are documentation/source-verified comparison examples, not mounted React tests. No React dependency was installed or upgraded. Live React behavior, StrictMode, this exact Radix focus/exit composition, and a named React router integration remain unverified.
