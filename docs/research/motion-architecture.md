# Motion architecture: integration decision

Research date: 2026-09-05. This is a source audit, not a claim that the Svelte adapter has passed browser tests.

## Evidence and exact versions

The npm registry returned `motion@13.2.0`, `framer-motion@13.2.0`, `motion-dom@13.2.0`, `motion-utils@13.0.0`, and `motion-v@2.4.1`. The published `motion-dom` tarball's root ESM exports and declarations were inspected without installing it. Its registry `gitHead` matches the inspected Motion checkout: [`e871ba7f175d0609cef84f416f984e8e84be8333`](https://github.com/motiondivision/motion/tree/e871ba7f175d0609cef84f416f984e8e84be8333). The inspected Vue checkout is [`67f1770e4e7a7d2c4c93ab060965c257ddd18903`](https://github.com/motiondivision/motion-vue/tree/67f1770e4e7a7d2c4c93ab060965c257ddd18903), whose package version is 2.4.1; the registry supplies no Vue `gitHead`, so that checkout is not asserted to be byte-identical to the published Vue package. Neither Vue nor a Svelte Motion clone was installed.

## The decisive result

**A React-free Svelte projection adapter is technically possible using root imports from `motion-dom`. But Motion does not promise semver stability for these undocumented APIs.** Its changelog explicitly states: “Undocumented APIs should be considered internal and may change without warning.” Projection moved to `motion-dom` in 12.26.2, followed by additional internal exports in 12.27.0. Publicly exported is not synonymous with a stable public contract. [Pinned changelog](https://github.com/motiondivision/motion/blob/e871ba7f175d0609cef84f416f984e8e84be8333/CHANGELOG.md)

The correct tradeoff is an exact version pin, one isolated adapter, and meaningful upgrade tests. If stable documented APIs are an absolute requirement, there is currently no free documented imperative Motion local-layout API satisfying the whole brief. That does **not** justify immediately writing another projection engine.

## Package boundaries

| Package/entry   | Current role                                                                                            | React required by our runtime?                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `motion`        | Distribution facade; root reexports `framer-motion/dom`                                                 | Vanilla entry is framework independent, but package dependency graph includes `framer-motion` |
| `motion/react`  | Reexports the React integration                                                                         | Yes; excluded                                                                                 |
| `framer-motion` | React integration plus implementations of some vanilla animation orchestration                          | Root is excluded; do not assume every file in this package is React-specific                  |
| `motion-dom`    | DOM rendering, values, animation engines, frame scheduling, projection, shared stacks, view transitions | No React dependency or peer                                                                   |
| `motion-utils`  | Shared math, easing, geometry types, assertions and utility infrastructure                              | No dependencies                                                                               |
| `motion-v`      | Official Vue lifecycle/state/component adapter                                                          | Vue only; prior art, excluded as dependency                                                   |

`motion-dom@13.2.0` depends only on `motion-utils ^13.0.0` and declares `sideEffects: false`. Prefer a direct exact `motion-dom` dependency for the layout prototype; add `motion-utils` directly only if importing it. Do not add `motion` just to access projection. [Motion entry](https://github.com/motiondivision/motion/blob/e871ba7f175d0609cef84f416f984e8e84be8333/packages/motion/src/index.ts), [DOM package manifest](https://github.com/motiondivision/motion/blob/e871ba7f175d0609cef84f416f984e8e84be8333/packages/motion-dom/package.json), [vanilla facade](https://github.com/motiondivision/motion/blob/e871ba7f175d0609cef84f416f984e8e84be8333/packages/framer-motion/src/dom.ts).

## What is reusable now?

Root exports verified in the published ESM package include:

- `HTMLVisualElement`, `SVGVisualElement`, `VisualElement`, `createAnimationState`, `animateVisualElement`, `animateTarget` and `animateMotionValue`.
- `HTMLProjectionNode`, `DocumentProjectionNode`, `nodeGroup`, `NodeStack`, `IProjectionNode`, `Measurements`, and projection configuration types.
- `addScaleCorrector`, `correctBorderRadius`, `correctBoxShadow`, transform-building/rendering helpers, MotionValues, springs and the shared frame/microtask scheduler.
- `LayoutAnimationBuilder` and `parseAnimateLayoutArgs`, backing imperative layout work.

These are framework-independent implementation primitives. Projection nodes, VisualElements, node groups and the layout builder are undocumented integration contracts, not documented stable application APIs. No deep import is needed. Documented vanilla APIs such as `animate`, `frame`, `motionValue`, `spring` and `animateView` have a stronger application-facing contract; their low-level counterparts should still be encapsulated when accessed through `motion-dom`. [Pinned root exports](https://github.com/motiondivision/motion/blob/e871ba7f175d0609cef84f416f984e8e84be8333/packages/motion-dom/src/index.ts)

## Concrete integration recipe

1. During browser attachment registration, find the closest registered projecting DOM ancestor. Create one `HTMLVisualElement` with `presenceContext: null`, typed props, `latestValues`, and the HTML render-state maps. Do not construct a projection node during SSR: its default parent lazily mounts a document root using `window`.
2. Construct `new HTMLProjectionNode(visualElement.latestValues, parentProjection)`, assign `visualElement.projection`, and call `setOptions` with `visualElement`, `layout`, scoped `layoutId`, `animationType`, `layoutScroll`, `layoutRoot`, `crossfade`, and transition settings. Mount the VisualElement; its mount lifecycle mounts its assigned projection.
3. Register border-radius and box-shadow scale correctors once. Supply those authored values to Motion: the engine does not discover every arbitrary stylesheet value automatically.
4. Before a controlled DOM update, call `willUpdate()` for affected participants. A `nodeGroup()` links a participant's `willUpdate` event to sibling snapshots. After Svelte commits, call `root.didUpdate()` once; duplicate scheduling is coalesced.
5. Let Motion reset projection transforms, measure all nodes, resolve shared/nested targets and write projection styles. Do not write a second independent FLIP transform or per-element RAF loop.
6. On shared-element exit/re-entry, coordinate `isPresent`, `relegate()` and `promote()` with native Svelte outro retention. An outgoing shared node may need to remain alive through both its opacity exit and the projection handoff. On cleanup remove group membership, listeners and observers, then unmount the VisualElement; it unmounts the projection.

The recipe is evidenced by both the official Vue adapter and Motion's own vanilla builder. It is not yet proof of Svelte lifecycle ordering. [Projection feature](https://github.com/motiondivision/motion-vue/blob/67f1770e4e7a7d2c4c93ab060965c257ddd18903/packages/motion/src/features/layout/projection.ts), [VisualElement lifecycle](https://github.com/motiondivision/motion/blob/e871ba7f175d0609cef84f416f984e8e84be8333/packages/motion-dom/src/render/VisualElement.ts), [HTML node](https://github.com/motiondivision/motion/blob/e871ba7f175d0609cef84f416f984e8e84be8333/packages/motion-dom/src/projection/node/HTMLProjectionNode.ts).

### Scheduler, cached geometry and interruption

The projection root already batches transform resets, layout reads, update notifications, and immediate frame-step flushing to avoid an inverse-transform flash. Projection calculation is depth ordered; normal frame scheduling is shared. `startAnimation` stops current/resuming animations and cancels pending animation callbacks before starting the replacement. Shared handoffs can share an animation between lead and outgoing nodes, so stopping every node's animation indiscriminately during cleanup is unsafe. [Projection engine](https://github.com/motiondivision/motion/blob/e871ba7f175d0609cef84f416f984e8e84be8333/packages/motion-dom/src/projection/node/create-projection-node.ts)

A post-commit cache approach is plausible: `IProjectionNode` exposes `layout`, `snapshot` and dirty flags, and Motion itself uses `snapshot = layout` for a special skipped-update case. But applying that generally would be additional reliance on mutable internals. It must be tested against interrupted projections and scrolling, not described as a solved before-update substitute. Prefer a proven Svelte precommit hook or an explicit group update transaction first; retain the cached approach as a measured experiment. [Node types](https://github.com/motiondivision/motion/blob/e871ba7f175d0609cef84f416f984e8e84be8333/packages/motion-dom/src/projection/node/types.ts)

Motion intentionally suppresses layout animation during window resize, settles active projection, and refreshes measurements. Responsive layout can remain correct without animating continuously during resize. A requirement to animate every resize step needs separate evidence and should not be met by casually disabling that protection.

### Transform ownership remains an adapter problem

Motion composes projection with transforms represented in its `latestValues` and supports `transformTemplate`. It writes the element's `style.transform`. Therefore simply wrapping a DOM node with a VisualElement does **not** guarantee preservation of arbitrary pre-existing stylesheet/inline transform strings, individual CSS transforms, or transformed unregistered ancestors. These must have an explicit policy, tests, and diagnostics. Prefer passing typed transform values through Motion's existing pipeline. Do not claim that app-authored CSS `rotate(...) scale(...)` is automatically solved.

Also preserve Motion's actual layout constraints: participating descendants enable scale correction; scroll containers need `layoutScroll`, and fixed roots need `layoutRoot`. Border-radius/shadow correction needs known style values, and position-only projection avoids aspect-ratio distortion for appropriate content. [HTML renderer](https://github.com/motiondivision/motion/blob/e871ba7f175d0609cef84f416f984e8e84be8333/packages/motion-dom/src/render/html/utils/render.ts), [official layout guidance](https://motion.dev/docs/react-layout-animations).

## What official Motion for Vue teaches us

Vue now constructs VisualElements and projection nodes directly from `motion-dom`. Its `MotionState` owns options, parent linkage, feature lifecycle and the VisualElement. `onBeforeUpdate` updates options and captures snapshots; `nextTick` leads to `root.didUpdate`; mount/unmount hooks coordinate actual DOM retention. Layout groups use Motion's `nodeGroup` and namespace IDs. Vue's published dependency graph still includes `framer-motion`; the inspected source retains `framer-motion/dom` imports for some utilities. This is a migration toward shared primitives, not proof that every Vue layer is already minimal. [MotionState](https://github.com/motiondivision/motion-vue/blob/67f1770e4e7a7d2c4c93ab060965c257ddd18903/packages/motion/src/state/motion-state.ts), [layout lifecycle](https://github.com/motiondivision/motion-vue/blob/67f1770e4e7a7d2c4c93ab060965c257ddd18903/packages/motion/src/features/layout/layout.ts), [group provider](https://github.com/motiondivision/motion-vue/blob/67f1770e4e7a7d2c4c93ab060965c257ddd18903/packages/motion/src/components/use-layout-group.ts).

Vue does **not** reproduce React reconciliation for presence: it builds on Vue `Transition`/`TransitionGroup`; wait maps to native `out-in`. A scoped registry discovers relevant motion states by containment, exit sessions fan in completion, and popLayout captures offset geometry and applies temporary absolute-position rules. Exit generations invalidate stale async completion on re-entry. Shared handoff completion is deferred to `frame.postRender` because the projection animation is created asynchronously; checking `currentAnimation` immediately after an exit promise resolves can remove DOM too early. These are highly relevant failure cases for Svelte. [Presence component](https://github.com/motiondivision/motion-vue/blob/67f1770e4e7a7d2c4c93ab060965c257ddd18903/packages/motion/src/components/animate-presence/AnimatePresence.vue), [exit protocol](https://github.com/motiondivision/motion-vue/blob/67f1770e4e7a7d2c4c93ab060965c257ddd18903/packages/motion/src/features/exit/exit.ts), [exit sessions](https://github.com/motiondivision/motion-vue/blob/67f1770e4e7a7d2c4c93ab060965c257ddd18903/packages/motion/src/components/animate-presence/exit-session.ts).

The new native-element `v-motion` directive supports lifecycle hooks plus SSR style generation. Its complexity includes Vue VNode/context traversal and undoing DOM property patching, including accidental shadowing of `Element.animate`. Svelte attachments and a narrowly scoped AST transform could avoid this class of runtime cleanup. However, Vue also copies an animation-state implementation to accommodate renamed `whilePress` and variant context. Our narrower feature scope should avoid that duplication and use Motion's state machinery only where needed. [Directive](https://github.com/motiondivision/motion-vue/blob/67f1770e4e7a7d2c4c93ab060965c257ddd18903/packages/motion/src/directive/index.ts), [copied state implementation](https://github.com/motiondivision/motion-vue/blob/67f1770e4e7a7d2c4c93ab060965c257ddd18903/packages/motion/src/state/animation-state.ts).

## `animateLayout` versus `animateView`

`animateLayout` remains documented as Motion+ early-access alpha, imported as `unstable_animateLayout` from `motion-plus/animate-layout`; it recognizes `data-layout` and `data-layout-id`. The docs say it will move to `motion` after alpha. Do not make it foundational. [Current official documentation](https://motion.dev/docs/layout-animations)

Its open-source `LayoutAnimationBuilder` is useful evidence: persistent element/node registration, DOM-order mounting, batch snapshots across concurrent builders, additions before removals, root commit scheduling, and interrupted-animation flushing. But it scans its scope for attributes, may reinsert removed DOM to finish handoffs, and explicitly clears an existing inline transform if Motion has no tracked transform values. Those behaviors conflict with Svelte's ownership and the user-transform requirement. Use its lessons, not the builder as a shortcut. [Pinned builder](https://github.com/motiondivision/motion/blob/e871ba7f175d0609cef84f416f984e8e84be8333/packages/motion-dom/src/layout/LayoutAnimationBuilder.ts)

`animateView` is different: it graduated to the main library in 12.41.0 and is a documented free API over native View Transitions. It handles temporary names, selectors, matching, springs, and transition queuing/interruption policy. It operates on snapshots and one transition at a time; it is not a substitute for local live-element projection. Consider it as route prior art or a reusable backend, but a small SvelteKit coordinator may be simpler when only named CSS view transitions are needed. [Official animateView API](https://motion.dev/docs/animate-view)

## Recommendation

Adopt a **hybrid prototype with explicit upgrade caveats**: Svelte owns DOM retention and authoring; a version-pinned `motion-dom` adapter owns live projection and animation; native View Transitions own route snapshots. Start with typed attachments and native transition directives. Compiler attributes must earn adoption through lifecycle and tooling tests; they are not needed to establish that Motion projection works outside React.

Do not build springs, interpolation, a second frame scheduler, projection math, shared-node stacks, scale correction, or a React-style presence owner. Custom work should be limited to Svelte lifecycle coordination, scoped registration/IDs, popLayout flow removal, central motion policy, diagnostics and navigation integration.

## Compiler spike result

The isolated `src/lib/motion-lab/compiler.ts` experiment uses installed Svelte 5.57.0 `parse(..., { modern: true })`, then MagicString edits anchored exclusively to parsed node ranges. It does not run in Vite, export a production preprocessor, or transform state mutations. For example:

```svelte
<!-- Author source --><div layout layoutId="card">Card</div>
```

Conceptually becomes:

```svelte
<script>
	import { createLayout as __astraCreateLayout } from 'astra-motion';
	const __astraLayout = __astraCreateLayout();
</script>

<div {@attach __astraLayout({ id: 'card' })}>Card</div>
```

Generated names avoid identifiers in instance/module scripts and snippet scopes. Unchanged source remains byte-for-byte intact. The source map includes the original filename and content. Input without motion metadata is unchanged, and applying the transform twice does not duplicate plumbing. The 26 server tests cover no script, instance scripts, TypeScript, module scripts, existing imports, snippets, render tags, multiple attachments, escaped IDs, comments and whitespace, deterministic output, and successful client/server/HMR **compilation**. This is not an HMR disposal, browser hydration or editor-language-server test.

Unsupported cases fail explicitly: component/dynamic/SVG/MathML elements, spreads, transition or animation directives on the same layout node, reactive layout modes and mixed quoted ID interpolation. The runtime's explicit attachments remain the escape hatch. Parse errors propagate instead of producing partially transformed output.

`print` is present and can reprint a modern AST including TypeScript with a source map. It also reformats unrelated source, and its current map lacks source filename/content by default. The spike therefore uses source-preserving AST-guided edits rather than adopting whole-component reprinting. The requested Svelte MCP discovery/autofixer tools were unavailable in this session; installed compiler APIs and official documentation were used. [Official compiler API](https://svelte.dev/docs/svelte/svelte-compiler)

**The compiler has not earned adoption.** The runtime prototype requires `layout.update(() => stateChange())` to guarantee old-geometry capture. Generating an inaccessible controller and an attachment does not establish that mutation boundary. Automatically rewriting arbitrary event handlers, stores, async continuations and cross-component state would be a much larger semantic transform. The spike proves that attribute syntax can be lowered safely within a narrow scope, not that `<div layout>` provides automatic layout animation yet.
