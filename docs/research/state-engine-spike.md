# Motion state and native Svelte retention spike

Tested against installed `motion-dom@13.2.0` and `svelte@5.57.0`.

## Findings

One HTMLVisualElement can animate opacity and scale through `animateTarget` while its existing projection node moves through a layout animation. Retargeting preserves the current scale instead of resetting to an earlier state. The state engine must share the layout VisualElement; two render owners for one element would compete over `transform`.

The isolated browser spike passes nine assertions-based cases (three scenarios in Chromium, Firefox and WebKit). It verifies state retargeting during paused projection, native retained DOM and reversal with a finite Motion spring, and initial style generation. `node --input-type=module` separately verified that `buildHTMLStyles` runs without browser globals. This is architecture evidence, not a complete general state adapter.

## Available root exports

```ts
animateTarget(
  visualElement: VisualElement,
  target: TargetAndTransition,
  options?: VisualElementAnimationOptions
): AnimationPlaybackControlsWithThen[];

animateVisualElement(
  visualElement: VisualElement,
  definition: AnimationDefinition,
  options?: VisualElementAnimationOptions
): Promise<void>;

buildHTMLStyles(
  state: HTMLRenderState,
  latestValues: ResolvedValues,
  transformTemplate?: MotionNodeOptions['transformTemplate']
): void;

calcGeneratorDuration<T>(
  generator: KeyframeGenerator<T>,
  timeStep?: number,
  maxDuration?: number,
  keyframes?: T[]
): number;
```

Playback controls expose `time`, `duration`, `iterationDuration` in seconds, `finished`, `stop`, `pause`, `play`, `complete`, and `cancel`. `animateVisualElement` also emits Motion's animation lifecycle notifications. `animateTarget` provides direct controls and does not emit those notifications itself.

`createAnimationState(visual)` is also exported and handles state priority, variants and `setActive`. Its upstream argument types contain `any`; the adapter need not mirror that weak typing. Use it when inherited variants or gesture priorities justify it, rather than duplicating its priority model.

These APIs are package-root exports, but the VisualElement integration remains undocumented and tied to the pinned Motion version.

## Svelte owns retention

The public transition contract accepts numeric duration, delay, easing, CSS generation and/or tick; it has no Promise-based completion hook. A separate free-running Motion animation plus an arbitrary retention timeout would have two clocks and unreliable teardown.

The prototype instead uses Svelte's existing timeline to sample a Motion spring generator and feed the shared VisualElement's values. Native Svelte still owns outro groups, reversal, inertness and DOM removal. Spring duration comes from Motion's `calcGeneratorDuration`; infinite generators must be rejected for exits. Svelte's tick callbacks share its global RAF scheduler.

A transition can return a deferred function. The installed Svelte runtime invokes that factory with the actual `in` or `out` direction on every transition, including reversals. That permits distinct initial/exit targets and a fresh current-value snapshot. However, native reversal scales its duration by the remaining counterpart progress, so a direction-specific generator requires explicit progress normalization. The current isolated prototype proves a symmetric reversible trajectory only; it does not claim asymmetric initial/exit or velocity-preserving spring reversal.

Before tick takes over a property, stop the property's running animation. `setTarget` alone does not stop it. At zero duration, apply the final target explicitly because Svelte skips tick for an immediate transition. Avoid a CSS `transform` transition alongside Motion projection; both would own the same DOM property.

Svelte documents its retention, bidirectional transitions, custom tick and deferred setup at [transition:](https://svelte.dev/docs/svelte/transition). The exact deferred-factory reversal behavior was checked in the installed runtime's `transitions.js`.

## SSR

`buildHTMLStyles` builds units, transform ordering, origins and CSS variables without DOM reads. Use this to serialize initial values into ordinary element style attributes. Do not derive SSR initial styles from an attachment, because attachments run only on the client. The API must expose a spreadable props/style helper or compiler output that includes these initial attributes. The client must register matching values before starting animation.

The prototype files are `src/lib/motion-lab/state-engine-spike.ts`, `state-engine-spike.svelte.spec.ts` and `StateEngineSpike.svelte`. They are research fixtures and are not package exports.

## Implemented native timeline follow-up

`src/lib/motion/presence-state.ts` now samples Motion `JSAnimation` instances with an inert driver; Svelte is the only running clock. It supports distinct initial/exit destinations, keyframes, color interpolation, per-property delays, finite springs, transition-end values, cancellation and explicit completion. Unchanged scalar targets with no velocity complete immediately, matching `animateTarget` behavior. Repeating/infinite presence and unresolved intrinsic/CSS-variable values produce diagnostics.

The sampler suite has 18 passing browser cases across Chromium, Firefox and WebKit. It includes repeated asymmetric native reversal during layout, exact lazy counterpart timing, and finishing an interrupted spring without accepting later stale ticks.

For exact reversal duration, pass the previous timeline's progress lazily. Svelte invokes the previous identity easing when reading `counterpart.t()` and subsequently reads the new duration getter. The helper therefore receives the actual native start position rather than the previous rendered frame. The new timeline also reconstructs its initial native progress when its first tick has already advanced. This is lifecycle glue around Svelte and Motion; no additional timer or projection math is introduced.

```ts
const previous = timeline;
previous?.cancel();
timeline = createPresenceTimeline(
	visual,
	{ ...visual.latestValues },
	destination,
	transition,
	direction,
	callbacks,
	previous ? () => previous.progress : undefined
);
```

The real `createMotion` fixture additionally exposed important integration failures: inherited child state needed to be refreshed before parent orchestration, effects created in an attachment pause during a retained outro, and gestures must be able to take over an incoming animation. Tests now exercise those boundaries, shared external-value ownership, style restoration and 100 simultaneous paint-only animations. The paint test verifies zero participant bounding-box reads during opacity/color animation; it is not a general frame-rate benchmark.
