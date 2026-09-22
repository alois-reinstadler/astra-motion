# Bits UI / shadcn integration

Inspected installed Bits UI 2.19.0 and Svelte 5.57.0, the project's nova shadcn wrappers, and current official component documentation. No replacement accessibility primitives or Svelte Motion dependency is needed.

## Integration contract

Bits UI explicitly supports `forceMount` with a delegated `child({ props, open })` snippet. The adapter renders the real DOM node inside `{#if open}`, spreads **all** Bits props (including symbol-keyed ref attachments), then adds the native transition and Motion attachment. Bits owns logical open state, focus, dismissal and semantics; Svelte owns outro DOM retention; Motion owns animated values and projection. [Bits transitions](https://www.bits-ui.com/docs/transitions)

```svelte
<DialogPrimitive.Content {...restProps} bind:ref forceMount>
	{#snippet child({ props, open })}
		{#if open}
			<div {...props} transition:presence>
				{@render children()}
			</div>
		{/if}
	{/snippet}
</DialogPrimitive.Content>
```

This is the existing opacity transition as a lifecycle proof. The typed state attachment and transform-aware presence contract will replace only the animation binding. Keep the same public shadcn compound structure and prop forwarding. [shadcn dialog](https://shadcn-svelte.com/docs/components/dialog), [shadcn accordion](https://shadcn-svelte.com/docs/components/accordion)

## Minimal opt-in wrapper changes

- Dialog Content: add an explicit opt-in motion prop; its enabled branch uses `forceMount`/child and native transition. Preserve `bind:ref`, portalProps, close button, rest props and supplied snippets. Forward the same opt-in to the existing overlay wrapper. Keep today's non-motion branch behavior.
- Dialog Overlay: same native child branch with opacity only. Content and overlay exit independently under Svelte retention.
- Accordion Content: opt-in `forceMount`/child; remove default CSS keyframe classes in this branch. Animate intrinsic reveal through a deliberate content-size primitive or projection surface with a position-corrected text child; scaling a content box alone distorts text.
- Card list: compose existing Card primitives with native/forwarded Motion attachment props. No accessibility owner or Motion component hierarchy is needed.

Do not leave Tailwind `animate-in`, `animate-out`, zoom or accordion height keyframes active on Motion-controlled properties. Keep the original visual classes and spacing. Prefer shared snippets for duplicated children rather than mounting both branches.

## Important source findings

`node_modules/bits-ui/dist/bits/dialog/components/dialog-content.svelte` keeps FocusScope, EscapeLayer, DismissibleLayer and TextSelectionLayer enabled according to **logical open**, independent of `forceMount`. In the child path, ScrollLock is also conditional on logical open. `focus-scope.svelte.js` unmounts its focus scope and restores focus when enabled becomes false. Therefore do not delay `open = false` until visual exit: that would delay focus restoration and continue trapping users in a logically dismissed dialog. Native Svelte outro retention is compatible with immediate focus restoration. [Bits dialog](https://www.bits-ui.com/docs/components/dialog)

Svelte marks outro nodes inert. Keep that behavior, including restoration during reversal; do not implement separate focus logic in the adapter. Test keyboard focus and pointer semantics while the visual exit is still alive, not just after final removal. `onCloseAutoFocus` remains cancelable for application-provided restoration.

`DialogContentState.props` includes `contain: layout style`, pointer events, role, aria-modal, ID links, nesting data and a symbol attachment. Spread it intact. `ref` must still identify the actual motion element. Portal siblings should retain existing stacking styles; do not create a second overlay owner.

The existing dialog centers with Tailwind individual translate (`-translate-x-1/2 -translate-y-1/2`). The current projection adapter rejects individual transforms. For the motion-enabled branch, use fixed inset positioning and auto margins with intrinsic/fit-content height, preserving current max width, instead of introducing a centering wrapper or silently losing the translate. Verify centering while size and scale animate and at narrow viewport widths.

`AccordionContentState.props` normally sets `hidden` based on Bits animation completion. `forceMount` suppresses it so Bits cannot prematurely hide an element while its native outro is running. `hiddenUntilFound` deliberately retains browser-searchable hidden DOM and conflicts with `{#if open}` removal. Preserve that feature in its existing branch or explicitly reject the incompatible combination; never silently remove find-in-page behavior.

Bits measures accordion dimensions by temporarily setting animationName/transitionDuration, then reading `getBoundingClientRect()`. Its CSS custom properties update through snippet props. This may invalidate layout observation; confirm it settles and does not create repeated measurement or target feedback during projection. Do not use those measured transformed values as a new per-frame animation target.

## Verification

Independent `BitsLifecycle.svelte` fixture and `bits-lifecycle.svelte.spec.ts` cover logical-close focus restoration with retained content and overlay, rapid reversal of the same node, Escape dismissal, retained accordion close without `hidden`, and owner destruction. This isolates the accessibility lifecycle bridge from the new Motion state implementation; the real wrappers still need their own geometry and interaction tests after integration.

Warm rerun: **15/15 passed across Chromium, Firefox and WebKit**. Svelte autofixer reports no issues or suggestions.

The first cold Vitest run optimized `bits-ui` during execution and reloaded tests, causing mixed Svelte runtime `effect_orphan` errors in two engines. This is an optimizer setup issue: preinclude Bits in browser-test optimized dependencies before treating cold failures as lifecycle evidence.

## Implemented opt-in authoring

```svelte
<script lang="ts">
	import { createMotion } from 'astra-motion/state';
	const card = createMotion({
		initial: { opacity: 0, scale: 0.96 },
		animate: { opacity: 1, scale: 1 },
		exit: { opacity: 0, scale: 0.96 },
		layout: true
	});
</script>

<Card.Root motion={card}>...</Card.Root>
```

The component accepts an existing `MotionBinding`; its type-only import adds no motion runtime dependency. This intentionally replaces the initial boolean/options convenience API. Create one binding per simultaneously mounted element in its owning component. Sharing option objects is fine; sharing one live binding across nodes is diagnosed by the runtime. Omit `motion` to use the original component behavior.

Use `<Accordion.Content motion={content} revealDuration={200}>` with opacity/y targets. `revealDuration` is the native height reveal's duration in **milliseconds**, distinct from Motion target transition seconds. It respects `content.reducedMotion`. The caller owns target/configuration choices; widgets do not inspect Motion state internals.

Use `<Dialog.Content motion={dialog} overlayMotion={overlay}>` with separate bindings. The overlay can have independent opacity targets/duration. Omit `overlayMotion` to keep the ordinary overlay CSS animation. Both nodes retain their own native lifecycle; a binding cannot represent both.

The accordion uses its **existing two DOM elements** deliberately: native Svelte `slide` reveals intrinsic height on the outer Content element; Motion animates opacity/y on the existing inner content element. Neither text nor images are scaled. `hiddenUntilFound` retains the existing searchable-DOM path. This choice favors a small integration over a new custom height engine.

The opt-in Card transition is global so a keyed parent list can remove the Card component while Svelte retains its actual root div. Symbol-keyed attachments forwarded through rest props allow `popLayout` without adding a list-item wrapper. Dialog/overlay merge Motion props with Bits props using the public Bits `mergeProps`, retaining all style metadata and ref attachments.

Try `/motion-lab/components`: live accordion content, interruptible dialog with focus/owner cleanup, and six filterable/reorderable/removable cards. `tests/motion/components.spec.ts` exercises the actual wrappers in the production document across all three browser engines; the lifecycle-only component fixture remains a separate control.

Final wrapper qualification: **12/12 actual-component cases pass across Chromium, Firefox and WebKit**, alongside the **15/15 lifecycle control cases**. Tests synchronize on a visible first frame/focus before reversal; headless WebKit can defer an initial frame beyond a fixed short sleep. Assertions retain intermediate flow geometry, node identity, centering and final focus requirements.

Chrome MCP verification exercised expanded dialog geometry (340.84px in this viewport), close/reopen, focus restoration and eight rapid filter/reorder cycles, ending with six cards and no new page errors. Accordion, dialog, expanded-dialog and settled-page screenshots were visually inspected. Initial browser evaluation must wait for hydration before dispatching clicks against server-rendered elements.

Motion bindings inherit configuration at the caller's creation site. Explicit binding options remain highest priority. Accordion's height transition reads `binding.reducedMotion`. Create the dialog and overlay bindings under the same configuration provider when they should share policy/defaults.

Observed development caveat: replacing runtime modules via HMR during an open dialog produced a transform-ownership rejection against a Motion-generated initial scale. Full-load stable flows pass. Live runtime HMR needs separate coordinator qualification; this document does not claim it is proven by component tests.

## Configuration and custom-component regression control

`ConfigLifecycle`, `ConfigParticipant` and `ForwardedMotion` independently exercise inherited configuration and prop forwarding: **12/12 browser cases pass across the three engines**, plus **one server test** comparing independent SSR render requests and a nested policy override. Changing reduced motion to `always` stops an already running plain layout participant and Motion state animation; a nested `never` provider continues. Switching back reenables movement. Toggling layout off and on, or changing shared identity/mode, preserves the same forwarded native element and its state VisualElement.

This additional control reproduced no core defect. It uses an 0.8-second animation; completion polling allows deferred headless WebKit frames while requiring exact final Motion values.

## Static integration cost

The four project-local adapters now import `MotionBinding` only as a TypeScript type. They neither statically import nor construct the state engine. The caller opts into that import through `createMotion`. This keeps deterministic SSR styles without an async load boundary, a global registration requirement, or an initial animation flash.

Five server/compiler regressions verify that all four wrappers emit no Motion imports in **both client and server compiler output**, and that a real Card preserves caller styles alongside Motion initial opacity/transform while an open Accordion renders its own initial styles. This is import-graph evidence, not a new whole-application byte benchmark. The motion package does not export the project-local shadcn widgets.

The migration adds one explicit binding variable where the previous prototype accepted a boolean. It avoids maintaining a second family of Motion widgets and gives the caller access to the same imperative controls and configuration used with native elements.

## Resize distortion regression

The previous dialog example left its form label/input branch outside projection correction. Its text inherited up to **19.9% vertical scale error** during a height change, despite tests of the text node's own transform passing. The corrected example registers the existing label and button hosts with `layout({ mode: 'position' })`; no wrapper was added.

The new test multiplies transforms through the ancestor chain on every sampled frame during three interrupted resizes. It requires less than 2.5% composed vertical scale error, alongside the existing focus, reversal, owner destruction, accordion and popLayout tests. This illustrates a real authoring requirement: register content hosts for position correction when animating a scaling surface. A local identity transform does not prove that text is undistorted.

## Final lifecycle/API review

The binding's two pieces have distinct jobs: spreading `props` provides deterministic server styles plus native attachment registration, while the Svelte transition directive gives Svelte control of DOM retention. Combining them into one attachment would lose native outro ownership; optional compiler sugar can eventually remove the authoring repetition without another engine.

Adversarial review reproduced an `initial: false` keyframe bug: server output correctly started at the final keyframe, but the native first intro replayed intermediate keyframes. The runtime was corrected to make that first intro immediate while preserving subsequent state changes and reversal. A regression samples the actual composed DOM transform, including the no-animation case where no MotionValue needs to be materialized.

Imperative methods also need a precise lifecycle contract: `animate()` must not replace a retained exit, must respect reduced motion, and must cancel an incoming native sampler before taking control; `stop()` must cancel that sampler too. These guardrails were added after review. The independent regression exercises these cases.

Automatic DOM-parent inheritance cannot determine initial styles on the server. Use explicit initial definitions or the new `parent.child(options)` binding: the declared parent supplies SSR labels and remains authoritative for client state through intervening Motion nodes. The projection tree still follows the real DOM ancestry. No extra wrapper or context provider is required.

## Binding migration and composition qualification

Current focused qualification: **15/15 actual-widget browser cases** (five each in Chromium, Firefox and WebKit), **5/5 server/compiler cases**, and **6/6 additional coordinated-composition browser cases** (two per engine). The independent composition fixture combines native wait, parent/child sequencing, shared layout identity and popLayout, checks immediate sibling reflow and latest-value selection, then destroys the owner while exiting and requires all scoped participants to unregister. Visible-retention tests wait for an initial painted frame; deleting an `initial: false` branch before its first frame does not establish an existing visible pose.

WebKit's actual dialog exit was still at opacity 0.012 after a fixed 350ms wall-clock sleep under concurrent development load. Final-removal assertions now poll for actual destruction, while immediate focus restoration and intermediate geometry remain strict. This does not relax the configured trajectory or hide a stuck exit.

Chrome MCP opened the migrated dialog, verified focus containment and centered bounds, and produced a visually inspected screenshot at `/tmp/astra-integration-bindings-final.png`. Page errors and error-level console messages were empty. Concurrent runtime edits and SvelteKit sync generated full page reloads during longer manual interactions; these resets are development HMR behavior, so interruption evidence comes from the isolated browser tests above. The shared dev server remains on port 5187.

The declared-parent review adds **6/6 browser cases**, **one server case** and **3/3 real SvelteKit hydration cases** across Chromium, Firefox and WebKit. It samples the first 40 painted hydration frames and requires the final initial-false keyframe in every sample. It also verifies that state follows the declared outer parent while projection follows the intervening DOM parent, and that changing the intervening node's variant does not affect the explicitly declared child. Try `/motion-lab/inheritance`. Chrome MCP confirmed that changing the declared parent moves x from 80 to 120 while changing the intervening binding keeps x at 120; no page/console errors.
