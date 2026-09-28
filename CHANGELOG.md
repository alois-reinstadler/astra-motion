# Changelog

## Unreleased

Astra Motion remains a working beta. These notes describe repository changes, not a public registry release.

### Motion surface

- Add direct animation props across HTML and SVG `motion.*` elements, typed custom component factories, keyframes, variants, orchestration, animation controls and SVG path animation.
- Add `AnimatePresence`, retained `AnimateActivity`, `AnimateView`, `LayoutGroup`, `MotionConfig`, `LazyMotion`, lightweight `m` elements and `Reorder.Group` / `Reorder.Item`.
- Extend drag with reactive constraints, elasticity, momentum, direction locking, external controls, propagation and coordinate correction. Preserve regression coverage for external transformed ancestors and nested sticky, scrolling and clipping boundaries.
- Add component-scoped `useMotionValue`, `useMotionTemplate`, `useMotionValueEvent`, `useScroll`, `useSpring`, `useTime`, `useTransform`, `useVelocity`, `useAnimate`, `useAnimationFrame`, `useDragControls`, `useInView`, `usePageInView` and `useReducedMotion`, with owned cleanup and reactive getter inputs.
- Add isolated mini animation, lazy feature, reorder, view and SvelteKit view-navigation entry points. Package one compatible Motion DOM identity without a React runtime dependency or consumer dependency overrides.
- Qualify the integration against Motion, framer-motion and motion-dom 13.4.4, motion-utils 13.3.0, Svelte 5.57.0 and SvelteKit 2.70.3. Exact evidence and outstanding gates live in the [parity matrix](docs/parity/MATRIX.md).

### Svelte contracts and compatibility

- Keep direct props as the primary authoring API. Existing native bindings, `motion={{ ... }}`, `Presence` and create* helpers remain available; see the [migration guide](docs/migration.md) for differences in defaults and ownership.
- Give keyed presence explicit `items` / `key` and Svelte snippets. `AnimatePresence` defaults to `sync`; the older `Presence` keeps its `wait` default.
- Retain Activity child and DOM state, coordinate exit and visibility, and pause Astra-owned work while hidden. `useActivityEffect` opts application effects into that lifecycle; ordinary Svelte effects continue running.
- Coordinate view captures through `startViewTransition(update, options)` and root attachments, with asynchronous updates, cancellation, supersession and browser fallback behavior.
- Return reactive state through `.current` getters and Motion Values through the shared engine. Preserve native attributes, event handlers, element access and supported two-way bindings.

### Fixes

- Preserve style and animation ownership when raw transforms, Motion Values, shared layouts and reactive configuration change together.
- Complete positional animation when live reduced-motion policy changes while preserving paint animation.
- Keep external-handle drags active when focus moves between elements; cancel when the browser window loses focus.
- Preserve focus intent across controlled reorder updates and stop owned work on teardown, hidden Activity and interrupted presence transitions.
- Correct stale initial-state suppression, managed helper subscriptions and late asynchronous feature adoption.

### Documentation and qualification

- Organize 34 primary pages into Animations, Gestures, Components, Motion Values, Hooks and Guides, with canonical runnable Svelte examples and API tables.
- Preserve existing documentation URLs and fragments through static aliases, with canonical metadata and consistent navigation.
- Add independent plain-Svelte and SvelteKit packed-consumer checks for strict declarations, production imports, SSR, hydration, runtime lifecycle and deferred bundle isolation. CI retains Chromium, Firefox and WebKit regression suites.
- Record source/documentation discrepancies, explicit Svelte adaptations, measured bundle results and independent review outcomes alongside the parity matrix. Unfinished verification remains marked as such until the final candidate passes.

Astra is MIT licensed. Publishing to a package registry and physical-device performance qualification are separate from this repository and documentation delivery.
