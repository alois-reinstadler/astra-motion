# LazyMotion and lightweight component parity

Reference read: 2026-09-27 through 2026-09-28 UTC. Official articles: [LazyMotion](https://motion.dev/docs/react-lazy-motion), [Reduce bundle size](https://motion.dev/docs/react-reduce-bundle-size), and [motion components](https://motion.dev/docs/react-motion-component). Inspected source: `framer-motion@13.4.4`, `motion-dom@13.4.4`, `motion-utils@13.3.0`. The current Astra implementation snapshot belongs to the integration branch; this worker's original baseline is b66e376.

The provider, lightweight component proxy, static `m` elements, custom component factory and DOM feature bundles are implemented on the integration candidate. The evidence below distinguishes verified behavior from remaining integration/consumer checks; this is not a full release-parity claim.

## Upstream contract and discrepancies

| Behavior                                                              | Official/upstream evidence                                                 | Proposed Astra contract                                                                                                         | Verification required                                                                      |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `LazyMotion` accepts children and required `features`; `strict=false` | LazyProps; LazyMotion/index.mjs                                            | Svelte children snippet, required FeatureBundle or async loader, strict false                                                   | Strict type errors for missing/malformed features; SSR snippet rendering                   |
| Synchronous bundle is available on initial render                     | Component loads renderer/features during render                            | Provider publishes supplied bundle synchronously; shell produces the same server/client initial markup                          | HTML/SVG/variants SSR, hydration, first animation                                          |
| Async loader called after initial render                              | `useEffect(..., [])` invokes function                                      | Component-owned effect invokes loader only in browser; native child DOM survives loading                                        | Loader call count; SSR no invocation; hydration DOM/ref/input identity                     |
| Latest animate props win when loader resolves                         | use-visual-element detects late renderer and sets manuallyAnimateOnMount   | Store original rendered initial pose; create runtime with latest props after load                                               | Update animate/custom/variants while pending; ensure animation starts from original pose   |
| `initial=false` renders final initial target                          | Same visual-state path as eager motion                                     | Use the exact extracted eager initial renderer                                                                                  | Initial false keyframes, inherited labels, presence initial false, reduced policy          |
| No features initially                                                 | m has no preloaded features or renderer                                    | Native element, attributes/events/bindings/ref, SSR style still work; no animation/gesture/projection work                      | Native input/checkbox/select binding before resolve; no loaded engine chunk                |
| Basic feature bundle                                                  | features-animation.mjs includes animations and gestureAnimations           | domAnimation supplies animation, variants, exit, hover/tap/focus, viewport                                                      | Positive behavior tests; production graph excludes pan/drag/projection                     |
| Full feature bundle                                                   | features-max.mjs adds drag and layout to domAnimation                      | domMax adds pan/drag and layout/shared-layout                                                                                   | Gesture/drag/layout/presence composition after async loading                               |
| Viewport bundle membership                                            | gestureAnimations includes InViewFeature; guide list omits viewport        | Include and document viewport in domAnimation                                                                                   | Intersection callback/whileInView after basic bundle                                       |
| Strict eager-component check                                          | Docs promise error; implementation checks NODE_ENV development and browser | Match development diagnostic, including `ignoreStrict` warning escape if retained by root motion contract                       | Dev eager descendant rejects; m succeeds; production guard omitted; inherited/nested scope |
| Failed async load                                                     | Source has no rejection handler                                            | Catch rejected/thrown load; surface through Svelte boundary; no unhandled promise or partially mounted runtime                  | Rejection, sync throw, boundary recovery, no console unhandled rejection                   |
| Loader changed before resolution                                      | Upstream effect has no dependencies or stale guard                         | Reactive features identity starts new generation; stale resolution/rejection ignored                                            | Resolve loader A after B; only B installs                                                  |
| Provider destroyed during load                                        | Upstream promise may update React state after unmount                      | Invalidate generation; no resource installation after teardown                                                                  | Resolve after removal; listener/frame/visual counts unchanged                              |
| Retry                                                                 | No explicit upstream API                                                   | Supply a new loader identity or remount boundary; no new imperative retry hook needed                                           | Recover from failure using normal Svelte state                                             |
| Nested feature providers                                              | Lazy renderer is contextual, feature registry is global/additive           | Prefer contextual bundle selection with one engine; avoid leaking domMax capabilities into basic sibling scope                  | Nested basic/full scopes, independent providers, one engine identity                       |
| Missing optional feature                                              | Upstream feature list simply lacks implementation                          | Agreed adaptation: requesting pan/drag or layout with domAnimation throws a domMax-required error after features load           | Drag/layout requested with basic bundle, after load; no false support claim                |
| Unmount during pending exit                                           | No runtime exists to register exit                                         | Complete removal immediately before features exist; ignore later loader result                                                  | Conditional/key/list removal while pending, no retained forever branch                     |
| Async bundle already mounted and replaced                             | Upstream adds globally and keeps renderer                                  | Preserve active values/DOM when compatible bundle capabilities update; cleanup removed gestures/layout if replacement supported | Full-to-basic and basic-to-full behavior, no duplicate listeners                           |
| Size claims                                                           | Official numbers describe upstream React/Rollup examples                   | Report Astra's own minified/gzip/Brotli output with exact imports and shared Svelte accounting                                  | Built packed consumers; initial/shared/dynamic chunks; no React                            |

Inspected source paths: `components/LazyMotion/index.mjs`, `context/LazyContext.mjs`, `motion/index.mjs`, `motion/features/{definitions,load-features,animations,gestures,drag,layout}.mjs`, `motion/utils/use-visual-element.mjs`, `render/dom/{features-animation,features-max,features-min,create-visual-element}.mjs`, `render/components/{create-proxy,m/proxy,motion/proxy}.mjs`, and `dist/index.d.ts` FeatureBundle/LazyProps.

The exported but undocumented `domMin` supplies animation and exits alone. The two bundles explicitly taught by the targeted documentation are domAnimation and domMax. No React source can be reused directly: even upstream createDomVisualElement imports React Fragment, and gesture/presence feature classes use React contexts/lifecycle. Astra reuses its existing DOM engine and integration adapters.

## Audited baseline dependency barriers

`component-motion.ts` imports eager `motion.svelte.ts`, and generated native components import that factory. `motion.svelte.ts` imports `motion-core.svelte.ts`, `layout.ts`, and monolithic `gestures.ts`. `motion-core.svelte.ts` directly imports `visual.ts`, `animation.ts`, `presence-state.ts`, and `motion-compat.ts`. `lite.svelte.ts` only omits layout/gestures; it still imports the animation/visual/presence engine and therefore cannot serve as the no-features initial m layer.

The component context currently contains a binding, and child creation invokes `parent.child`. That captures the parent's feature selection. A full child under a lazy parent must select its own eager features, while still inheriting variant labels and DOM ancestry. The context must describe ancestry separately from runtime selection.

The current gesture adapter contains hover/focus/tap/viewport and the complete pan/drag implementation in one retained function. Passing a base-only flag does not establish that drag leaves a production bundle. Extract base and drag implementations into separate modules; domAnimation imports base only, domMax composes both. They must share gesture arbitration, queued callback cleanup, press cancellation, value ownership, and the existing coordinate corrections. Root owns two active gesture regressions, so this split must follow a coordinated snapshot.

HTML tags are compiler-aware generated components with native bindings. SVGComponent and CustomMotion currently import the eager component factory. A lightweight HTML wrapper that leaves these two imports eager would falsely advertise SVG/custom lazy support and contaminate m's chunk graph.

## Shared type handshake

Agreed definitions, implemented jointly with the integration owner:

```ts
interface MotionTree {
	source(): VariantSource;
	element(): MotionElement | undefined;
}
interface MotionEnvironment {
	config: ConfigReader;
	layout?: LayoutScope;
	presence?: PresenceScope;
	activity(): boolean;
	parent?: MotionTree;
}
interface MotionRenderOptions {
	// Existing render metadata remains.
	environment?: MotionEnvironment;
	initialValues?: ResolvedValues;
}
interface FeatureBundle {
	readonly features: MotionFeatures;
	create(input: MotionInput, render: MotionRenderOptions, features?: MotionFeatures): MotionBinding;
}
```

MotionBinding exposes its tree and the same attachment function already supplied through its props. `captureMotionEnvironment` reads context during component setup; the deferred factory receives that captured environment, avoiding context lookup after initialization. `readMotionTree`/`provideMotionTree` use a small context module with no engine-class imports.

Root extracts the eager initial-render logic into pure functions: `resolveInitialMotionValues(options, render): ResolvedValues` and `initialMotionProps(options, render, initial?): {style:string; [attribute:string]:unknown}`. They preserve variant resolution, keyframe initial/final selection, transitionEnd, transformTemplate, SVG attributes/path behavior, raw CSS ownership, and ordinary style serialization. Type imports must stay erased.

## Deferred binding and native forwarding

The lightweight proxy is created synchronously and captures environment, variant ancestry, original initial values, stable props/attachment, and the real DOM element. It installs no VisualElement, projection node, gesture listeners, animation controls, or Motion frame work before a bundle is available.

When the contextual factory arrives, an owned effect creates the normal core binding with the captured environment, parent tree and original initial values. It calls the binding's attachment on the existing element. It delegates future transition/animate/stop/update work and style/attribute reads to that same binding. It never swaps the native component or its input state. Cleanup releases the heavy binding and ignores late loader generations. Presence removal before runtime availability uses a zero-duration transition and creates no pending registration that could block removal.

Generate eager and m HTML/SVG names from the same tag/type/binding definitions. Prefer shared SVG/custom native wrappers with a required injected binding factory and no eager import/default. Eager factories pass createComponentMotion; m factories pass createLazyComponentMotion. Root creates common wrappers while finishing custom/types, or delegates generator/wrapper ownership after its changes land. Namespace and native event/binding/ref semantics must be identical.

The provider publishes a synchronous bundle immediately. Async loaders run in owned client effects with alive/generation guards. A caught error is thrown by the provider's effect so Svelte boundary recovery is available. Supplying a new features function retriggers loading. A current working bundle may remain installed while a replacement is pending; completed replacement updates gesture/layout implementations on the existing binding. Disable props that require capabilities before replacing domMax with domAnimation; unsupported active props produce an explicit error.

## Ownership and remaining integration gates

Worker-owned new modules: lazy context/provider/proxy/component factories, m component entry/generated wrappers, DOM feature bundle entry modules, separated base/drag gesture modules after root snapshot, and focused lazy fixtures/types/server/browser tests. Root owns environment/tree/initial-render extraction, core injection and missing-feature checks, the current gestures.ts fixes, shared custom/SVG wrapper changes, public index/package exports, and packed-consumer/production graph checks. Generator ownership transfers explicitly after root's current component work.

Minimum tests: synchronous SSR, async SSR without loader calls, hydration without DOM/ref/input replacement, initial:false, SVG attributes, inherited and late-changing variants, custom forwarding, pending prop changes, pending teardown, rejection/throw/stale loaders/retry, strict dev behavior, nested lazy/eager trees, Activity hidden during resolution, presence exit before/after resolve, base viewport and gestures, full drag/layout, runtime upgrade cleanup, and original regression suites after gesture extraction.

Production measurement needs at least: eager motion.div, m.div plus deferred domAnimation, m.div plus synchronous domAnimation, deferred domMax, hybrid useAnimate, and mini useAnimate. Build an installed packed package with the consumer compiler; record initial, shared, and deferred chunks separately, including module lists. Assert initial m chunks lack VisualElement/animation/gesture/projection-node implementations; basic bundle lacks drag/pan/projection; mini lacks hybrid sequence/value/projection code; each graph has one compatible engine and zero React runtime/declarations. Network verification must demonstrate that the feature chunk is absent before loader execution and fetched only when requested. These are acceptance gates, not measurements already performed.

## Implemented behavior and verification, 2026-09-28

`LazyMotion.svelte` accepts a synchronous `FeatureBundle` or `() => Promise<FeatureBundle>` and `strict=false`. The supplied snippet always renders. Loading starts in a client effect, never on the server. Replaced, hidden-Activity and destroyed loads are invalidated; rejected or invalid loads become owned Svelte boundary errors. A working bundle stays installed while a replacement loads. Retry uses a new features identity and normal boundary reset/remount. Nested providers select independent capabilities.

`m` is a static namespace generated from the same 168 HTML/SVG tag definitions as eager `motion`; `m.create` shares the eager custom-component/element forwarding contract. The proxy captures contexts and original initial values during component setup. It attaches the loaded binding to the original DOM element; native events, inputs, attributes, custom forwarding and refs remain usable while pending. Late targets use current reactive props. The same extracted initial renderer handles HTML/SVG, variant inheritance and `initial={false}` on server and client.

`domAnimation` includes animation, variants, presence, hover, tap, focus and viewport. `domMax` adds pan/drag and layout. Basic and drag implementations are separate modules, with shared listener/frame ownership and the existing press-cancellation arbitration. The drag snapshot preserves the integration owner's constraint ResizeObserver rebinding and hard clamping of nonelastic modified inertia targets. Subsequent root gesture corrections must be kept synchronized until the monolithic implementation is consolidated.

Development strict checks register eager descendants reactively, so changed `strict` and `ignoreStrict` are observed. `ignoreStrict=true` warns; otherwise an eager descendant errors. Removal unregisters after actual component teardown, including native outros. Production and SSR omit these diagnostics. This matches upstream's source-level restriction even though the public page describes the error without emphasizing production omission.

A mixed eager/deferred fixture found that an eager child could have no visual parent when its lazy parent loaded later. The integration owner's `visual.ts` adoption correction is required: it joins the existing child VisualElement into the loaded parent's variant tree without replacing the child/value/DOM. The regression covers both parent directions and later inherited-label changes.

Evidence:

- `parity-lazy.spec.ts`: 2 passing SSR tests, covering zero server loader calls, HTML/SVG initial output, inherited initial labels and synchronous/deferred `initial=false` target rendering.
- `parity-lazy.svelte.spec.ts`: 10 passing tests in Chromium, Firefox and WebKit, plus an additional Chromium run with `NODE_ENV=development`: pending native input/events/ref preservation, latest targets, inheritance, SVG, stale generations, teardown/render subscription disposal, rejection and boundary retry, hidden Activity resolution, domMax upgrade with identical DOM/VisualElement, missing-feature diagnostic, custom components/elements, reactive strict policy and registration cleanup, and mixed variant trees.
- The same complete 10-test suite also passes with `NODE_ENV=production`. The strict test has explicit production assertions as well as development assertions; production diagnostics are not expected.
- `parity-lazy.types.ts` checks required feature source, rejection of unresolved module namespaces, precise HTML/SVG refs and native properties. Strict project checking also covers every generated component.
- Generator reproducibility: `node scripts/generate-motion-elements.mjs --check` passes for 168 eager and lightweight elements. Svelte autofixer reports no issues/suggestions for authored runtime components, fixtures and each distinct generated-template family; targeted ESLint passes.
- Full worker server run after copying the integration owner's updated native export assertions: 30 files / 129 tests passing.

Not yet established by these worker checks: packed-package import/declaration graph, native hydration identity, actual deferred network requests in a production preview, cross-feature presence/layout regression suites after consolidation, or final documentation examples. These remain integration gates, not supported completion claims.

## Source production bundle evidence

Source experiment `/tmp/astra-lazy-bundle-audit.mjs` uses Rolldown production ESM minification, compiled Svelte 5.57.0 client modules, `motion@13.4.4`, `motion-dom@13.4.4`, `motion-utils@13.3.0`. Svelte/SvelteKit are external/shared host dependencies; the standalone bundles retain the requested entry exports. The JSON report `/tmp/astra-lazy-bundle-sizes.json` records every included module and chunk. These are measured source-entry costs, not final packed consumer sizes or upstream size claims.

| Source entry                         | Minified bytes | gzip bytes | Brotli bytes |
| ------------------------------------ | -------------: | ---------: | -----------: |
| `m.div` plus LazyMotion, no features |         18,040 |      6,860 |        6,198 |
| domAnimation alone                   |         94,187 |     32,254 |       29,346 |
| domMax alone                         |        150,617 |     49,498 |       43,932 |

A real deferred Svelte component generates an initial entry of 6,856 bytes (2,834 gzip), a shared initial dependency chunk of 12,843 bytes (4,978 gzip), and a dynamic domAnimation runtime chunk of 82,398 bytes (28,483 gzip). Initial and shared chunks contain no core, animation implementation, VisualElement, drag, layout adapter or projection-node implementation. They do contain small scale-correction utilities reached by the shared initial-style classifier; domAnimation additionally includes geometry/measurement utilities used by ordinary DOM animation. These utility paths are not deferred layout capability and must not be confused with a loaded projection tree. domAnimation contains no drag module or layout runtime or projection-node implementation. domMax contains the expected extra implementations. Every inspected graph contains zero React runtime modules. Subsequent integration changes can alter byte counts; packed output must be measured again.
