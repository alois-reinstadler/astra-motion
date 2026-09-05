# Svelte platform research and lifecycle spike

Research date: 2026-09-05. Exact installed packages: **Svelte 5.57.0**, **SvelteKit 2.70.3**, Vitest 4.1.11. Package.json ranges are older than these installed versions. Findings below distinguish source inspection, executed experiments, and recommendations. No application development server or build command was run.

## Decision affecting the architecture

Use Svelte's native transitions to retain exiting DOM. Use attachments for element registration and cleanup. **Do not treat an attachment-created `$effect.pre` as a before-commit measurement hook.** An actual Chromium test on this repository observes a partially committed DOM. Native document View Transitions are suitable route enhancements; element-scoped transitions remain an optional future capability.

Compiler syntax can remove boilerplate, but it does not create a universal before-commit hook. Start with typed attachments and explicit transitions, then assess optional syntax independently. A shared layout engine needs a deliberate update protocol or proven cached geometry integration.

## Sources and method

The Svelte MCP is available over `https://mcp.svelte.dev/mcp` using JSON-RPC `tools/call` with SSE responses. Called `list-sections` first, examined use cases, then retrieved relevant documentation together: effects, attachments, transitions, in/out, animate, motion, lifecycle, compiler, snippets/render tags, TypeScript, SSR, navigation, accessibility, link options and state management. The raw response is saved temporarily at `/tmp/astra-svelte-platform-docs.md`.

Inspected installed sources, particularly:

- `node_modules/svelte/src/internal/client/dom/elements/transitions.js`
- `node_modules/svelte/src/internal/client/dom/elements/attachments.js`
- `node_modules/svelte/src/internal/client/reactivity/effects.js`
- `node_modules/svelte/src/internal/client/reactivity/batch.js`
- `node_modules/svelte/src/transition/index.js`
- `node_modules/svelte/types/index.d.ts`
- `node_modules/@sveltejs/kit/src/runtime/client/client.js`

The official reference pages are linked beside conclusions below. Upstream issue reports identify risks; executed tests, rather than issue severity labels, determine local behavior.

## Native presence is already a strong foundation

Svelte retains the complete outgoing block until its participating outros finish. This includes descendants without their own transition. A bidirectional `transition:` reverses in flight; separate `in:` and `out:` transitions have different semantics and are not interchangeable with a reversible transition. Local transitions follow their own block; `|global` also participates when an ancestor block changes. There are intro/outro start/end events. These are enough for ordinary concurrent presence without another ownership/reconciliation layer. [Transition reference](https://svelte.dev/docs/svelte/transition), [in/out reference](https://svelte.dev/docs/svelte/in-and-out).

Installed implementation details strengthen that conclusion:

- Transition managers belong to Svelte effects; effect pause/resume supplies outro/intro coordination.
- Outgoing elements become inert and restore their prior inert state when intro resumes.
- A reversal reuses transition options, samples the counterpart's current progress, suppresses its old completion callback, cancels it and scales remaining duration by remaining progress.
- CSS transition callbacks are sampled into WAAPI keyframes. Tick callbacks use Svelte's shared animation loop.
- Initial styles/WAAPI setup are deferred to a microtask so multiple nested transitions measure before initial writes (source references upstream issue #18421).
- Cancellation clears the animation effect and replaces the completion handler, including a Chromium leak workaround.

Do not run a second competing transform animation on the same element. If Motion projection owns `transform`, opacity-only Svelte exits are the easiest safe composition. A more capable motion transition must join Motion's transform pipeline or use a separately owned property; merely appending a string captured at transition start is inadequate when projection changes during the exit.

`wait` needs a small state coordinator to retain the displayed key while an outro completes, then commit only the most recently requested key. Svelte still owns DOM retention. Canceled exits must invalidate stale completion callbacks. Nested wait semantics need explicit tests; adding React-style child enumeration is unnecessary.

### popLayout

Normal outro retention leaves elements in normal flow. Svelte already implements an absolute-position fix/unfix path for animated keyed each items, but it is internal, constrained to `animate:` participation, and skips fixing when `element.getAnimations().length` is nonzero to avoid crossfade transform conflicts. This is evidence for the technique, not a public API to import.

A public implementation should capture geometry, freeze dimensions and positioning in the same containing block, remove the outgoing node from flow, then invalidate sibling layout together. Capture and restore only owned inline declarations, including priority. Reversal must restore flow immediately and retarget sibling layout from current visual positions. Account for borders, margins, scroll offsets, transformed containing blocks and grid placement; a viewport rectangle cannot simply become local `left/top`. Detached clones lose live component behavior and are a fallback with explicit tradeoffs.

The transition's deferred callback is useful for coordinating multiple nodes before writes, but popLayout timing must be tested alongside the layout engine. `outrostart` follows transition delay and is therefore too late to guarantee immediate flow removal when exits have a delay.

## Why animate:flip and crossfade do not solve general layout

`animate:` is tied to direct children of keyed each blocks and reordering. It does not observe arbitrary CSS, intrinsic size, flex alignment, grid columns, responsive changes or cross-component mutations. The FLIP math can resize as well as translate, but the registration/trigger lifecycle is the limitation. [Animation directive](https://svelte.dev/docs/svelte/animate).

Installed `crossfade` uses two maps keyed by user IDs and resolves send/receive counterparts in a deferred transition callback. It captures bounding rectangles, dimensions, computed transform and opacity, then returns translate/scale/opacity CSS. Independent factory instances provide scoping, but duplicate same-side keys overwrite their map entry. Geometry is captured once; there is no persistent projection tree, scale correction, scroll tracking or general retargeting to new layout destinations. It is useful for isolated view swaps under its existing API. It is **not** a foundation for nested interruptible layout projection, and combining it with an independent transform owner is unsafe. [Crossfade reference](https://svelte.dev/docs/svelte/svelte-transition#crossfade).

## Executed lifecycle experiment

Files: `src/lib/motion-lab/LifecycleSpike.svelte` and `src/lib/motion-lab/lifecycle.svelte.spec.ts`.

Command: `pnpm exec vitest run --project client src/lib/motion-lab/lifecycle.svelte.spec.ts`.

Result: **2 tests passed in Chromium**, 21 ms test time in the final recorded run. The fixture changes one element's width from 100 to 200 px and reverses keyed children from `ab` to `ba` in one update:

| Measurement phase                          |                     Width | Children |
| ------------------------------------------ | ------------------------: | -------- |
| Component top-level `$effect.pre`          |                       100 | ab       |
| `$effect.pre` created inside attachment    |                       100 | ba       |
| Attachment child `$effect`                 |                       200 | ba       |
| Cached previous geometry read after update | previous 100, current 200 | ba       |

The attachment pre-effect sees a **mixed old/new DOM**, not a coherent snapshot. Changing effect nesting or generated directive order could alter these observations; the absence of a global before-commit guarantee is the architectural result.

The second test performs four synchronous commits and verifies cached previous/current widths: `100→200`, `200→120`, `120→320`, `320→100`. This proves that previous committed geometry can survive without an attachment pre-hook. It does **not** yet prove projection retargeting: in-flight transforms, scroll coordinates, nested correction and shared-node handoff still need the Motion spike.

The current documentation explicitly limits pre-effects to updates scheduled after them and warns that parent DOM may already be updated. Async block updates introduce further ordering differences. [Effect reference](https://svelte.dev/docs/svelte/$effect#effect.pre). Related reports remain open: [attachment/mount timing #16556](https://github.com/sveltejs/svelte/issues/16556), [layout snapshot timing #16648](https://github.com/sveltejs/svelte/issues/16648).

### Consequences for automatic layout

An attachment with no reactive inputs cannot discover arbitrary application state changes through Svelte dependency tracking. A getter makes declared dependencies observable, but arbitrary ancestor CSS changes remain outside it. ResizeObserver observes size, not every position change; a flex justification change can move fixed-size nodes without resizing them. Choose and document a mechanism:

1. A group transaction snapshots before a synchronous state update and measures after `tick`/`flushSync`: strongest and simplest correctness contract, explicit authoring cost.
2. A cached geometry scheduler plus bounded invalidation from group updates, element size changes and relevant container mutations: more automatic, but coordinate normalization and missed position changes must be proven.
3. Compiler-generated component-level invalidation: useful ergonomic glue, still cannot intercept all changes in ancestors or external stylesheets.

Do not scan the document with a MutationObserver or poll every participant continuously merely to make the API appear automatic. Batch reads across participants before inverse-transform writes. `tick` provides post-flush timing; `flushSync` provides a synchronous transaction, neither is automatically a pre-commit measurement hook.

## Attachments, custom components, SSR and HMR

Attachments are available since Svelte 5.29. They run within effects in the browser and clean up when removed or recreated. A factory with reactive arguments recreates the attachment as those arguments change. Use a stable getter and an inner effect to update existing Motion state without discarding its node, values or animation. Capture group context during component initialization if needed; do not assume `getContext` is legal from a later attachment effect. [Attachments](https://svelte.dev/docs/svelte/@attach).

Custom components already accept `{@attach ...}` through symbol-keyed props. A component that spreads remaining props onto its DOM root forwards those attachments. This supports `<Card {@attach layout(...)}/>` without a custom directive syntax or wrapper. Multi-root components must explicitly choose the target. Attachment cleanup cannot delay destruction, so presence still needs native transitions or an explicit component contract.

The existing package peer range `svelte: ^5.0.0` is too broad for an attachment-based public feature; its export/documentation must require at least 5.29 or provide an action fallback. Compiler `print` has a newer minimum than attachments and should be independently version-gated.

SSR has no DOM to measure. Runtime setup must occur inside attachments/effects or guarded lifecycle callbacks, with no browser globals evaluated at import time. Render deterministic IDs and initial styles on server and client; an attachment-only initial style cannot guarantee no first-paint flash from SSR HTML. HMR tears down registrations: remove observers, frame callbacks, shared-ID membership, animations and owned styles. HMR correctness is not proved by successful compiler round-tripping.

Reduced-motion policy belongs in JavaScript too: native Svelte transitions use WAAPI, so a CSS media query zeroing animation-duration does not cancel their timing. Route transitions should skip snapshot animation under reduced motion. Local policy may permit opacity while disabling spatial movement. [Svelte motion reference](https://svelte.dev/docs/svelte/svelte-motion#prefersReducedMotion).

## Compiler feasibility

Installed Svelte exposes public `parse(source, { modern: true })`, `print(ast)` and `preprocess`. `print` returns generated Svelte source and a source map and preserves TypeScript syntax. Markup preprocessors run on whole component source; they can return code and mappings. [Compiler API](https://svelte.dev/docs/svelte/svelte-compiler).

Executed a nine-case parse→print→compile(client and server) experiment on: no script, JS script, TS script, module script, both scripts with an existing import/transition, multiple attachments, custom component, snippet/render tag, and comments. **All nine cases compiled for client and server and produced maps.** This is a round-trip feasibility check, not verification of an attribute transform.

Safe transform requirements:

- Select structured regular-element AST nodes; leave component props alone unless explicitly supported.
- Preserve existing attachments and scripts, choose collision-free import aliases, and distinguish module from instance imports.
- Diagnose competing `transition:`/`in:`/`out:` ownership rather than silently replacing directives.
- Preserve mappings, throw useful filename/location errors and test preprocessing order with other markup tools.
- Parse TypeScript using the modern compiler parser; do not regex-search scripts or interpolate opaque expression strings.
- Keep generated identifiers deterministic. Shared IDs must come from semantic IDs, not source locations that change under HMR.
- Test transformed code with svelte-check and editor tooling. A runtime-correct preprocessor does not automatically teach the language server new DOM attributes or custom-component props.

The native attachment API preserves HTML nodes and already works with prop-forwarding custom components. A compiler is justified only if it adds demonstrably valuable attribute ergonomics and usable diagnostics; it should remain optional and compile to the same documented runtime API.

## SvelteKit route coordination

`onNavigate` is registered during component initialization and applies to client-side navigation, not full-document unloads. Its returned promise delays commit; it may return post-navigation cleanup. Kit invokes these callbacks after route loading and before committing the new tree. Keep one coordinator in the persistent root layout. [Navigation API](https://svelte.dev/docs/kit/$app-navigation#onNavigate), [official View Transition recipe](https://svelte.dev/docs/kit/faq#How-do-I-use-the-View-Transitions-API).

The correct handshake is: capture old view by starting a native transition; resolve the `onNavigate` promise **inside** its update callback to let Kit commit; then await `navigation.complete` before finishing the update callback. Awaiting `navigation.complete` before releasing navigation deadlocks. Never make Kit wait for the full visual animation duration.

Robust coordinator requirements:

- Skip the previous transition when navigation supersedes it; retain generation identity so its finalizer cannot clear a newer transition's names.
- Catch `ready`, update and finished rejections, including duplicate names and skipped/hidden documents. Releasing the navigation latch must also happen if starting a transition throws.
- Keep links, `goto`, history back/forward, redirects and loading under Kit's ownership. Do not manually replace history or scroll/focus restoration.
- Await navigation completion, not arbitrary image or streaming-data promises; delayed data can produce a subsequent layout update and needs explicit policy.
- Clean up temporary names on finish, failure, disposal and pageshow/pagehide as appropriate. BFCache restoration is a different lifecycle from ordinary client navigation.
- A transition should enhance successful navigation; failures to animate must not prevent route completion.

### Shared route elements

Map a stable scoped semantic ID to a deterministic CSS identifier, e.g. an injective encoding of `[groupId, layoutId]`. The same semantic identity must produce the same name in both routes. A small hash needs collision handling; concatenating group and ID with an unescaped delimiter is ambiguous. Generated DOM-instance IDs and `match-element` do not pair distinct old/new route nodes.

Only one rendered element per name may exist in each captured state. Shared Motion layout stacks can intentionally contain overlapping nodes; native View Transitions cannot receive duplicate rendered names. Maintain a registration map and assign the chosen lead element a temporary route name. Duplicate ambiguity should disable that pairing with an actionable diagnostic, not abort every route transition. Cross-component groups scope IDs, but CSS names remain document-global unless optional scope support is available. [view-transition-name](https://developer.mozilla.org/en-US/docs/Web/CSS/view-transition-name).

## Browser capabilities and backend boundary

Current MDN browser compatibility data, fetched directly from its primary GitHub repository:

| Capability                     | Chromium | Firefox       | Safari        |
| ------------------------------ | -------- | ------------- | ------------- |
| Document `startViewTransition` | 111+     | 144+          | 18+           |
| `view-transition-class`        | 125+     | 144+          | 18.2+         |
| Element `startViewTransition`  | 147+     | not supported | not supported |
| `view-transition-scope`        | 147+     | not supported | not supported |

Sources: [Document data](https://github.com/mdn/browser-compat-data/blob/main/api/Document.json), [Element data](https://github.com/mdn/browser-compat-data/blob/main/api/Element.json), [class data](https://github.com/mdn/browser-compat-data/blob/main/css/properties/view-transition-class.json), [scope data](https://github.com/mdn/browser-compat-data/blob/main/css/properties/view-transition-scope.json). Feature-detect each optional capability instead of inferring it from document transitions. These are support-data results, not cross-browser execution results from this project.

Document transitions use old-view raster snapshots and a separate pseudo-element overlay. They do not preserve interactive live outgoing elements or spring velocity. Starting a new transition skips an active transition rather than smoothly retargeting a live projection tree. Snapshot capture has memory cost proportional to area and named layers. Default document overlays can escape ancestor clipping and alter stacking relationships; aspect-ratio changes require authored image-fitting/animation styles. Scrolling/focus should settle under Kit before the new snapshot. [View Transition model](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using), [CSS View Transitions specification](https://www.w3.org/TR/css-view-transitions-2/).

Element-scoped transitions improve concurrent interactions, clipping and stacking within their scope, but they remain experimental and are not a portable foundation. [Element API](https://developer.mozilla.org/en-US/docs/Web/API/Element/startViewTransition).

Therefore use live projection for continuously interactive local layout and shared tabs/cards; use native snapshots for route tree replacement. Unsupported route transitions should navigate immediately. This hybrid separates two distinct browser models instead of forcing one to impersonate the other.

## Evidence still required

The route adapter is implemented separately in `src/lib/motion/routes.ts`. Ten Node tests in `routes.spec.ts` verify capture/commit release order, temporary name restoration (including CSS priority), duplicate scoping, stale navigation cancellation, throwing browser start, rejected promises, reduced motion, missing browser support, SSR, singleton coordinator ownership, disposal and element identity ownership. These use lifecycle and browser mocks, not real SvelteKit navigation. They do not establish actual history, scroll/focus, native snapshot or BFCache behavior.

At the initial platform research stage, executed evidence was two Chromium lifecycle tests, ten mocked route unit tests and nine compiler round-trip cases. Subsequent presence review and the crossfade follow-up below add targeted evidence. None of these alone establish complete popLayout geometry, route history/abort behavior, hydration flashes, HMR, Safari/WebKit, Firefox or Motion interruption coverage; consult the runtime lab and adversarial review for those results.

## Follow-up: executed native crossfade spike

Added isolated `CrossfadeSpike.svelte` and `crossfade.svelte.spec.ts`. They use only Svelte's `crossfade`/`fade`, with 240 ms duration and two simultaneous identities (`image`, `title`). Their small/large widths are 60→180 and 100→220 px, with differing heights too. No Motion projection writes to those elements.

Command: `pnpm exec vitest run --project client src/lib/motion-lab/crossfade.svelte.spec.ts --reporter=verbose --silent=false`. Result: **4 Chromium tests passed**, approximately 2.70 seconds test execution in the recorded run.

Measured observations:

| Scenario                                                               | Observation in the recorded run                                                                                                                                                  |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Two shared pairs, sampled 65 ms after switch                           | Four DOM nodes retained: old and incoming image/title. Each had one active WAAPI animation and a computed transform matrix.                                                      |
| Differing image dimensions                                             | Old 60 px and incoming 180 px layout boxes both presented a visual width of about 103.30 px at the sample.                                                                       |
| Differing title dimensions                                             | Old 100 px and incoming 220 px boxes both presented about 143.30 px visual width.                                                                                                |
| Settled large view                                                     | Two nodes remained, widths 180/220 px, no active animations.                                                                                                                     |
| Nine switches spaced 35 ms apart                                       | Four pair nodes during every sample; after settling only the latest two large-view nodes remained. All sampled widths were finite and positive; no animation remained.           |
| Reverse a progressing shared morph                                     | Original image visual width was 134.66 px before reversal, 134.66 px immediately after the Svelte flush and 120.25 px after 35 ms. It settled at 60 px on the original DOM node. |
| Change CSS margin on an existing node carrying send/receive directives | Its left position changed by the full 120 px at the next flush, with zero animations and no computed transform.                                                                  |

This evidence supports crossfade as a useful isolated shared-view transition helper. It would be incorrect to claim that simple interruption is inherently broken: the tested reversal retained the original node and its immediate visual geometry. Repeated switching also cleaned up correctly in this bounded fixture. These measurements do not establish smoothness for all intermediate frames, nested projection correction, scrolling, reordering, duplicate identities or responsive destination changes.

The first fixture attempt put local send/receive transitions inside a keyed each whose enclosing if-block was replaced. Svelte correctly did not run those inner local transitions. Marking them `|global` made them participate in the enclosing swap, consistent with native local/global semantics. That distinction must remain explicit when recommending crossfade.

The general-layout result is unambiguous: registration with crossfade does not animate a CSS reflow of a persistent node. Crossfade also owns `transform` during its WAAPI animation, so pairing it with a separately owned Motion projection transform is not supported by this design. Keep it as an independent native helper rather than using it as the projection substrate.

Also extended `review-presence.spec.ts` with a real `svelte/server` render of the complete default laboratory. All **3 SSR tests pass**; the lab renders its initial presence, wait content and ten grid participants without browser globals. This is server-render evidence, not hydration/HMR verification.
