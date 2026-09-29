# Complete upstream additions plan

Baseline: Motion **v13.4.4**, commit `33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343`. Audited **1,990 source test declarations across 315 files**. Parameterized declarations count once; their relevant data cases belong to the acceptance criteria below.

**628 declarations have missing or partial Astra coverage**, consolidated into **179 implementation groups**. **269 declarations are covered** by cited existing assertions; **1,093 are excluded** for explicit reasons (unchanged engine internals, unsupported/React-only APIs, or duplicate scenarios).

This is the complete add list from that pinned audit, not a sample. Every upstream declaration, existing coverage citation, exclusion reason, and source-file SHA-256 is in [the inventory](upstream-inventory.json). An implementation group can produce several parameterized tests. Related source cases share tests only when the listed assertions cover all distinct behavior.

Adapt through Astra public exports and Svelte lifecycle APIs. Preserve both [Motion](LICENSE.motion) and [Framer](LICENSE.framer-motion) MIT notices. Do not duplicate unchanged upstream internals. Any later reclassification must retain its reason and source IDs in the inventory; a failing assertion is not a reason to silently drop a scenario.

All groups below are implemented and behavior verified. The inventory lists concrete test mappings; [verification evidence](README.md#complete-expansion-verification) records the full run and affected repairs without claiming a second full-matrix pass.

Implementation runs in isolated worktrees. Independent agents review assertions and run targeted browser/type checks after integration, then the final configured browser matrix and server suite. Runtime failures get focused fixes and affected reruns. Concurrent PopResize work is outside this task and must be preserved.

## Adaptation boundaries

- React render/hook scenarios use Svelte components, public bindings/hooks, and real browser geometry. React 19's temporary effect remount during keyed snap swaps becomes a persistent keyed Svelte relocation; managed exits have separate retention assertions.
- Boundary custom data remains live during exit, but an active exit keeps its captured target, matching Motion's deliberate exit-resolution guard. Inherited callback tests require the source payloads, not an invented exact callback count.
- Scalar `x: null` is excluded because Astra's typed target API rejects it; supported target removal/re-addition remains covered. SVG uses Astra's explicit namespace API; `skewX` covers the supported transform surface.
- SSR retains Astra's server-rendering contract. Gesture-added `tabindex` and `draggable` behavior is checked after client attachment rather than required in server HTML.
- Nested size interruption uses controlled projection clocks to compare the rendered reversal origin; live phone-layout tests separately check natural continuity. Viewport-changing tests restore the browser and let its resize quiet period finish before another animation case.
- Scoped sequence playback pauses through the public control. Duration is per iteration; separate observers of `finished` must settle correctly, without requiring promise-object identity.

## Animation (27 groups)

### UP-001 — Declarative and inherited animation callback payloads

Status: **implemented; behavior verified**. Key: `animation-callbacks`.

Acceptance: Object targets emit one start and completion with the target definition. Inherited child start and completion receive the parent label and observe final child values. onUpdate exposes final x/y and does not repeat for unchanged scalar targets.

Upstream scenarios:

- [fire's a component's onAnimationComplete](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/animation/__tests__/index.test.tsx#L33)
- [fires a component's onAnimationComplete with the animation definition](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/animation/__tests__/index.test.tsx#L60)
- [variants fire a child's onAnimationComplete](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/animation/__tests__/index.test.tsx#L89)
- [fires onAnimationStart when animation begins](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L57)
- [fires onAnimationStart when animation begins](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/variant.test.tsx#L40)
- [fires onAnimationStart with the animation definition](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/variant.test.tsx#L59)
- [onUpdate](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/variant.test.tsx#L913)
- [onUpdate doesnt fire if no values have changed](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/variant.test.tsx#L943)
- [child onAnimationComplete triggers from parent animations](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/variant.test.tsx#L1297)
- [child onAnimationComplete triggers from parent animations](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/variant.test.tsx#L1326)

Adaptation: Adapt to Astra public API; assert visible states and callback payloads, not engine call counts.

### UP-002 — Controls initial state, dynamic starts and recursive set

Status: **implemented; behavior verified**. Key: `controls-initial-set-tree`.

Acceptance: Controls-bound elements render initial before any command. Function start resolves distinct subscriber custom values. set(label) immediately applies descendant variants even when the controlling ancestor has no own variants.

Upstream scenarios:

- [respects initial even if passed controls](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/animation/__tests__/index.test.tsx#L221)
- [propagates variants to children even if not variants set on controlling component](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/animation/__tests__/index.test.tsx#L237)
- [.start accepts state depending on custom attribute](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/animation/__tests__/index.test.tsx#L356)
- [.set updates variants throughout a tree](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/animation/__tests__/index.test.tsx#L409)

Adaptation: Adapt to Astra public API; assert visible states and callback payloads, not engine call counts.

### UP-003 — Transition precedence, explicit from and reactive updates

Status: **implemented; behavior verified**. Key: `transition-options`.

Acceptance: Value-specific transitions override base/default while other values use the fallback. Explicit from overrides initial; frozen custom ease samples the expected intermediate value. Subsequent target updates use new transition and transitionEnd; duration:0 wins over configured duration.

Upstream scenarios:

- [accepts custom transition prop](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L39)
- [uses transition on subsequent renders](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L74)
- [transition accepts manual from value](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L93)
- [uses transitionEnd on subsequent renders](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L112)
- [accepts default transition prop](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L646)
- [accepts base transition settings](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L672)
- [accepts custom transition](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/variant.test.tsx#L176)
- [Default duration doesn't override duration: 0](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/waapi.ts#L20)

Adaptation: Adapt to Astra public API; assert visible states and callback payloads, not engine call counts.

### UP-004 — All declarative delay entry points

Status: **implemented; behavior verified**. Key: `transition-delay`.

Acceptance: Parameterize transition.delay, per-value delay with type:false and tween, animate.transition.delay, variant.transition.delay. Each holds its initial value before its deadline and eventually reaches the target.

Upstream scenarios:

- [in transition prop](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/delay.test.tsx#L6)
- [value-specific delay on instant transition](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/delay.test.tsx#L25)
- [value-specific delay on animation](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/delay.test.tsx#L44)
- [in animate.transition](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/delay.test.tsx#L63)
- [in variant](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/delay.test.tsx#L81)

Adaptation: Adapt to Astra public API; assert visible states and callback payloads, not engine call counts.

### UP-005 — Inherited delays, stagger functions and per-value child transitions

Status: **implemented; behavior verified**. Key: `variant-delay-tree`.

Acceptance: delayChildren in transition prop and variant delays both hold children/grandchildren. Parameterize numeric staggerChildren and delayChildren:stagger with ordinary and value-specific child transitions. Earlier child finishes while delayed later child stays at initial. Unlabelled wrappers do not consume stagger indices; reverse stagger follows visible descendant order.

Upstream scenarios:

- [respects orchestration props in transition prop](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/variant.test.tsx#L205)
- [delay propagates throughout children](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/variant.test.tsx#L245)
- [Child variants correctly calculate delay based on delayChildren: stagger()](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/variant.test.tsx#L597)
- [Child variants with value-specific transitions correctly calculate delay based on delayChildren: stagger()](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/variant.test.tsx#L647)
- [Child variants correctly calculate delay based on staggerChildren (deprecated)](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/variant.test.tsx#L700)
- [Child variants with value-specific transitions correctly calculate delay based on staggerChildren (deprecated)](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/variant.test.tsx#L750)
- [components without variants are transparent to stagger order](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/variant.test.tsx#L803)
- [in variant children via delayChildren](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/delay.test.tsx#L105)
- [in variant children via staggerChildren](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/delay.test.tsx#L137)
- [in variant children via delayChildren: stagger(interval)](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/delay.test.tsx#L170)

Adaptation: Adapt to Astra public API; assert visible states and callback payloads, not engine call counts.

### UP-006 — Late variant children and asynchronous mounting

Status: **implemented; behavior verified**. Key: `variant-late-cohorts`.

Acceptance: Late cohort receives distinct stagger offsets without replaying existing children. A child inserted while its parent animation is in progress visibly starts from inherited initial then reaches target. After Activity reveal later new children enter immediately without inheriting an obsolete cohort delay.

Upstream scenarios:

- [children added after the reveal aren't staggered](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L1452)
- [staggerChildren is calculated correctly for new children](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/variant.test.tsx#L1440)
- [child inside Suspense boundary should animate from initial variant when parent is already animating](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/variant.test.tsx#L1504)
- [child inside Suspense boundary should not skip directly to animate variant values](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/variant.test.tsx#L1573)
- [child should animate from initial variant, not jump to animate values](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/variant-propagation-suspense.ts#L11)
- [child should reach final animate variant values after animation completes](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/variant-propagation-suspense.ts#L25)

Adaptation: Adapt to Astra public API; assert visible states and callback payloads, not engine call counts.

### UP-007 — Reactive variant fallback and independent descendant updates

Status: **implemented; behavior verified**. Key: `variant-reactive-fallback`.

Acceptance: Removing label/property returns to authored style; subsequent style changes apply and re-adding target takes control. Children whose props are unchanged restore removed inherited values when only parent label changes. Mutating values inside an inherited same-name variant updates child. Nested explicitly controlled children follow their own changed labels.

Upstream scenarios:

- [FRAMER BUG: When a value is removed from an element as the result of a parent variant, fallback to style](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/variant.test.tsx#L473)
- [nested controlled variants switch correctly](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/variant.test.tsx#L549)
- [style is used as fallback when a variant is removed from animate](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/variant.test.tsx#L1007)
- [style is active once value has been removed from animate](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/variant.test.tsx#L1036)
- [style is used as fallback when a variant changes to not contain that style](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/variant.test.tsx#L1148)
- [Children correctly animate to removed values even when not rendering along with parents](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/variant.test.tsx#L1178)
- [changing values within an inherited variant triggers an animation](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/variant.test.tsx#L1355)

Adaptation: Adapt to Astra public API; assert visible states and callback payloads, not engine call counts.

### UP-008 — Equivalent keyframes replay on label changes but not object identity changes

Status: **implemented; behavior verified**. Key: `variant-identical-keyframes`.

Acceptance: Switch a->b->a with shared [0,10,0] keyframes; each switch produces nonzero intermediate motion then endpoint. Inline and stable variant objects behave identically on unrelated rerenders; assert phases/completions rather than exact frame counts.

Upstream scenarios:

- [variants work the same whether defined inline or not](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/variant.test.tsx#L1097)
- [keyframes animation reruns when variants change and keyframes are the same](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/transition-keyframes.test.tsx#L88)
- [issue #2855: keyframes with shared values across variants rerun on each change](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/transition-keyframes.test.tsx#L115)

Adaptation: Adapt to Astra public API; assert visible states and callback payloads, not engine call counts.

### UP-009 — Variant label changes during hover/tap release old protected keys

Status: **implemented; behavior verified**. Key: `variant-gesture-protected`.

Acceptance: Hover applies a-hover color; tap switches base label to b while hovered; final color is b-hover, never stale a-hover.

Upstream scenarios:

- [Protected keys don't persist after setActive fires](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/variant.test.tsx#L1215)

Adaptation: Adapt to Astra public API; assert visible states and callback payloads, not engine call counts.

### UP-010 — Suppressed initial animation includes transitionEnd

Status: **implemented; behavior verified**. Key: `initial-transitionend`.

Acceptance: initial:false renders target plus transitionEnd values and emits no animation completion. An initial named variant applies its transitionEnd at initialization.

Upstream scenarios:

- [mount animation doesn't run if `initial={false}`](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L1034)
- [applies applyOnEnd if set on initial](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/variant.test.tsx#L131)

Adaptation: Adapt to Astra public API; assert visible states and callback payloads, not engine call counts.

### UP-011 — Removed targets return to the current initial or preserve value when no fallback exists

Status: **implemented; behavior verified**. Key: `target-fallback`.

Public API difference: Scalar null is outside Astra MotionOptions.animate target types. Upstream forces this case through any; Astra tests supported property removal and re-addition instead, without widening the public API.

Acceptance: Remove animate.opacity: original initial is restored. Change initial and remove animate together: current initial wins. Remove initial and animate together: keep last value without starting a fallback animation. Remove x to restore fallback, then re-add x and observe completion. Unrelated initial scale remains when animate changes x only.

Upstream scenarios:

- [animates to set prop and preserves existing initial transform props](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L153)
- [when value is removed from animate, animates back to value originally defined in initial prop](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L544)
- [when value is removed from animate, animates back to value currently defined in initial prop](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L574)
- [when value is removed from both animate and initial, perform no animation](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L616)

Adaptation: Adapt to Astra public API; assert visible states and callback payloads, not engine call counts.

### UP-012 — New target properties and keyframe option snapshots

Status: **implemented; behavior verified**. Key: `target-new-properties`.

Acceptance: Switch x-only target to y-only with type:false and duration:0; new y renders and old x clears. Keyframes in percentage units reach their final unit-based target. Explicit keyframe times and ease arrays preserve intermediate samples.

Upstream scenarios:

- [keyframes - accepts ease as an array](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L377)
- [animates previously unseen properties, instant animation](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L918)
- [animates previously unseen properties](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L937)
- [keyframes with non-pixel values](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/transition-keyframes.test.tsx#L41)
- [times works as expected](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/transition-keyframes.test.tsx#L153)

Adaptation: Adapt to Astra public API; assert visible states and callback payloads, not engine call counts.

### UP-013 — Discrete display, visibility and non-animatable targets

Status: **implemented; behavior verified**. Key: `target-discrete`.

Acceptance: Display none->block and visibility hidden->visible change at animation start. Reverse directions remain visible during opacity motion and switch only at end. Completion fires for display-only animation; zIndex and normal fontWeight targets apply valid final styles.

Upstream scenarios:

- [animating between none/block fires onAnimationComplete](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L240)
- [animate display none => block immediately switches to block](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L258)
- [animate display block => none switches to none on animation end](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L288)
- [animate visibility hidden => visible immediately switches to visible](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L317)
- [animate visibility visible => hidden switches to hidden on animation end](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L347)
- [will switch from non-animatable value to animatable value](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L399)
- [doesn't animate zIndex](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L532)

Adaptation: Adapt to Astra public API; assert visible states and callback payloads, not engine call counts.

### UP-014 — No-op target suppression and live-value subscription stability

Status: **implemented; behavior verified**. Key: `target-noop`.

Acceptance: Unchanged scalar and equal keyframes produce no intermediate updates; different keyframes do. A spring with nonzero velocity still moves when its endpoint equals current value. Rerender with same external MotionValue yields one public update per change and cleanup detaches its listener.

Upstream scenarios:

- [doesn't animate no-op values](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L414)
- [doesn't animate no-op keyframes](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L444)
- [does animate different keyframes](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L474)
- [does animate no-op values if velocity is non-zero and animation type is spring](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L504)
- [Doesn't double-add listeners to externally-provided motion values](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L1280)

Adaptation: Adapt to Astra public API; assert visible states and callback payloads, not engine call counts.

### UP-015 — Transform templates initialize, update and clear

Status: **implemented; behavior verified**. Key: `transform-template`.

Acceptance: Template receives generated transforms at initial render and throughout animation. Updating only template changes rendered transform. Template works with style transforms or no transforms. Removing template restores current transform with changed/unchanged style, or none when no transform exists.

Upstream scenarios:

- [applies custom transform](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L215)
- [applies transformTemplate on initial render](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/transformTemplate.test.tsx#L7)
- [applies updated transformTemplate](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/transformTemplate.test.tsx#L21)
- [renders transform with transformTemplate](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/transformTemplate.test.tsx#L50)
- [renders transformTemplate without any transform](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/transformTemplate.test.tsx#L64)
- [removes transformTemplate if prop is removed and transform is changed](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/transformTemplate.test.tsx#L71)
- [removes transformTemplate if prop is removed and transform is not changed](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/transformTemplate.test.tsx#L87)
- [removes transformTemplate if prop is removed](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/transformTemplate.test.tsx#L102)

Adaptation: Adapt to Astra public API; assert visible states and callback payloads, not engine call counts.

### UP-016 — CSS variable targets, unseen variables and preserved expressions

Status: **implemented; behavior verified**. Key: `css-variable-targets`.

Acceptance: Animate between CSS color variables through an intermediate color; end style retains var() expression. Previously absent custom property and whitespace-containing origin animate correctly. Numeric CSS variable targets resolve visibly; SVG variables land in style, never attributes, including sequences.

Upstream scenarios:

- [animates previously unseen CSS variables](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L976)
- [should animate css color variables](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/animation/animators/waapi/__tests__/css-variables.test.tsx#L85)
- [should correctly animate previously unencountered variables](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/animation/animators/waapi/__tests__/css-variables.test.tsx#L116)
- [should have the original target css variable on animation end](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/animation/animators/waapi/__tests__/css-variables.test.tsx#L142)
- [works correctly with CSS variables](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-style.ts#L81)
- [Numerical CSS var values are resolved and animated correctly](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/css-vars.ts#L2)
- [css vars](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L511)
- [css vars on SVG elements are written to style](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L519)
- [renders transforms, styles and CSS variables via styleEffect](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/animate/__tests__/element.test.ts#L73)
- [writes CSS variables to style rather than as attributes](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/animate/__tests__/element.test.ts#L346)
- [reads CSS variable origins from style](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/animate/__tests__/element.test.ts#L362)

Adaptation: Adapt to Astra public API; assert visible states and callback payloads, not engine call counts.

### UP-017 — DOM-measured target units retain geometry and authored transforms

Status: **implemented; behavior verified**. Key: `measured-unit-targets`.

Acceptance: Parameterize px->percent, height:auto including border-box padding, viewport units and calc CSS-variable roundtrip. Calc target is preserved at completion and reverse returns to zero, with and without external MotionValue. Measurement restores unrelated rotation; bordered width uses content/used width; none/zero keyframes measure correctly.

Upstream scenarios:

- [animates to correct target height when box-sizing is border-box with padding](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-height-border-box.ts#L2)
- [animates height: auto correctly](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-unit-types.ts#L2)
- [animates translation from px to percent](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-unit-types.ts#L11)
- [Animate x roundtrip: 0 -> calc -> 0](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/unit-conversion.ts#L7)
- [Animate x from 0 to calc](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/unit-conversion.ts#L46)
- [Animate x from 0 to calc with externally-defined motion value](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/unit-conversion.ts#L58)
- [Animate width and height to/from vh units](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/unit-conversion.ts#L70)
- [Restores unapplied transforms](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/unit-conversion.ts#L82)
- [Measures the used width, not the bounding box, on bordered elements](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/unit-conversion.ts#L94)
- [Coerces none keyframes before measuring](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/unit-conversion.ts#L108)
- [converts units by measuring the element](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/animate/__tests__/element.test.ts#L177)

Adaptation: Adapt to Astra public API; assert visible states and callback payloads, not engine call counts.

### UP-018 — Complex paint targets read origins and retarget without stale writes

Status: **implemented; behavior verified**. Key: `paint-retarget`.

Acceptance: Blur animates to target and back to zero with both completions. Box shadow animates from none and computed browser serialization. Gradient first update has intermediate values. Interrupt a long color animation with green; only replacement final color remains.

Upstream scenarios:

- [Correctly animates complex value types on first rerender](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L1252)
- [box-shadow should animate correctly, even with no initial set](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/unit-type-shadow.test.tsx#L5)
- [box-shadow should animate correctly, even when read from browser in weird format](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/unit-type-shadow.test.tsx#L32)
- [animates filter blur values correctly including re-animation](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-filter-blur.ts#L2)
- [interrupting a color animation lands on the new target](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L586)

Adaptation: Adapt to Astra public API; assert visible states and callback payloads, not engine call counts.

### UP-019 — SVG zero-duration updates override a finished native effect

Status: **implemented; behavior verified**. Key: `svg-instant-reentry`.

Acceptance: SVG opacity 1->0 then instant 1 restores computed opacity. SVG x 0->50 then instant 0 restores geometry and remains stable on later frames.

Upstream scenarios:

- [Restores SVG opacity with a zero-duration animation](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/waapi-svg-zero-duration.ts#L2)
- [Restores SVG transform with a zero-duration animation](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/waapi-svg-zero-duration.ts#L20)

Adaptation: Adapt to Astra public API; assert visible states and callback payloads, not engine call counts.

### UP-020 — Scoped/mini autoplay and pre-resolution pause/stop

Status: **implemented; behavior verified**. Key: `scoped-autoplay-pause`.

Acceptance: Full and mini autoplay:false keep origin over several frames and remain owned until completion/cleanup. Pause immediately before keyframe resolution holds origin; setting time before pause renders the chosen midpoint. Stopping before resolution prevents later writes and clears active ownership. With initial opacity 0 and animate opacity:1 autoplay:false, value remains 0 across frames. play() reaches opacity 1 without rebuilding the element.

Upstream scenarios:

- [does not start WAAPI animation when autoplay is false](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-autoplay-false.ts#L2)
- [pause() correctly pauses the animation](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-style.ts#L22)
- [autoplay correctly pauses the animation on creation](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-style.ts#L33)
- [Can stop before keyframes resolved](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/waapi.ts#L38)
- [.pause() before keyframe resolution](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L233)
- [.pause() before keyframe resolution, after set time](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L243)
- [async stop prevents animation](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L328)
- [setting autoplay to false pauses animation](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/mini.spec.ts#L51)
- [element starts at opacity 0 when using single 'to' value with autoplay: false](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/strict-mode-opacity.ts#L2)
- [element animates to opacity 1 when triggered](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/strict-mode-opacity.ts#L14)

Adaptation: Adapt to Astra public API; assert visible states and callback payloads, not engine call counts.

### UP-021 — Replay, seek and finished/then promise lifecycle

Status: **implemented; behavior verified**. Key: `scoped-replay-promises`.

Acceptance: After completion repeated finished/then reads settle immediately. Replay re-arms completion; old promise remains resolved and new one does not settle early. Seeking completed controls to zero restores origin and reacquires cleanup ownership. Replay after explicit time/speed mutation produces expected intermediate motion and eventual completion.

Upstream scenarios:

- [play correctly resumes the animation](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-style.ts#L43)
- [play after finished and setting time](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L74)
- [play after finished and setting speed](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L82)
- [play after setting speed](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L96)
- [time=0 reverts a finished animation](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L131)
- [subsequent .finished calls should fire immediately](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L180)
- [subsequent .finished calls should not fire immediately after replay](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L191)
- [subsequent .then() calls should work immediately](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L213)
- [Resolves if all promises are already resolved](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/__tests__/GroupAnimation.test.ts#L108)
- [Correctly resumes after time is set](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/__tests__/JSAnimation.test.ts#L1027)
- [.then() correctly fires when animation already finished](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/__tests__/JSAnimation.test.ts#L1149)
- [.then() returns new Promise when animation finished](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/__tests__/JSAnimation.test.ts#L1161)
- [finished resolves when first read after being notified](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/utils/__tests__/WithPromise.test.ts#L29)
- [finished returns the same promise until replayed](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/utils/__tests__/WithPromise.test.ts#L36)
- [replaying re-arms finished](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/utils/__tests__/WithPromise.test.ts#L44)
- [a promise read before replaying still resolves](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/utils/__tests__/WithPromise.test.ts#L65)

Adaptation: Adapt to Astra public API; assert visible states and callback payloads, not engine call counts.

### UP-022 — Cancel before/after pause and terminal Astra control semantics

Status: **implemented; behavior verified**. Key: `scoped-cancel`.

Acceptance: Cancel active/paused full and mini playback restores origin and does not fire natural completion. Cancel after finish preserves committed endpoint; stop midway freezes visible state and blocks restart. Pause replacement begins from its intended midpoint without cancelled-origin writeback. Document Astra terminal cancellation: complete/play after cancelled handle reject rather than upstream engine restart.

Upstream scenarios:

- [cancel()](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L104)
- [cancel() after finish is a no-op](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L115)
- [cancel() interrupt after pause()](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L147)
- [cancel() interrupt with pause()](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L159)
- [complete() after cancel()](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L372)
- [stop() halts animation midway](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L337)
- [Calls cancel on all animations](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/__tests__/GroupAnimation.test.ts#L144)
- [Correctly cancels an animation](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/__tests__/JSAnimation.test.ts#L1199)

Adaptation: Adapt to Astra public API; assert visible states and callback payloads, not engine call counts.

### UP-023 — Scoped control time, speed, duration and repeat endpoints

Status: **implemented; behavior verified**. Key: `scoped-timing`.

Acceptance: Seeking with delay holds origin before delay then renders midpoint. Per-iteration duration excludes delay and repeats. Speed getter/setter reaches grouped subjects; negative speed returns to origin and settles. Natural loop/reverse/mirror repeats end correctly for odd/even counts; forced mirror completion reaches expected endpoint.

Upstream scenarios:

- [respects repeatDelay prop](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L729)
- [Correctly applies final keyframe with repeatType reverse and odd numbered repeat](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L756)
- [Correctly applies final keyframe with repeatType mirror and odd numbered repeat](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L783)
- [Correctly applies final keyframe with repeatType loop and odd numbered repeat](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L810)
- [Correctly applies final keyframe with repeatType reverse and even numbered repeat](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L837)
- [Correctly applies final keyframe with repeatType mirror and even numbered repeat](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L864)
- [Correctly applies final keyframe with repeatType loop and even numbered repeat](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/animate-prop.test.tsx#L891)
- [time sets and gets time](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/animation/animators/waapi/__tests__/animate-style.test.ts#L29)
- [Applies final target keyframe when animation has finished, repeat: reverse](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/animation/animate/__tests__/animate.test.tsx#L221)
- [Applies final target keyframe when animation has finished, repeat: reverse even](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/animation/animate/__tests__/animate.test.tsx#L237)
- [Applies final target keyframe when animation has finished, repeat: mirror](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/animation/animate/__tests__/animate.test.tsx#L249)
- [Applies final target keyframe when animation has finished, repeat: mirror even](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/animation/animate/__tests__/animate.test.tsx#L261)
- [time sets and gets time](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/animation/animate/__tests__/animate.test.tsx#L286)
- [.time can be set to duration](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/animation/animate/__tests__/animate.test.tsx#L295)
- [play with repeat: reverse](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L35)
- [complete() with repeat and reverseType ends on final keyframe with mirror](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L407)
- [.time](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L441)
- [.time with delay](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L450)
- [.speed](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L459)
- [.speed reversed](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L468)
- [.duration](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L477)
- [.duration with delay](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L486)
- [repeat](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L496)
- [repeat reverse](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L503)
- [duration is returned correctly, as set](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/mini.spec.ts#L36)
- [correctly sets final style when reversing](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/mini.spec.ts#L46)
- [time can be set to midpoint of animation](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/mini.spec.ts#L56)
- [Gets time](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/__tests__/GroupAnimation.test.ts#L38)
- [Sets time](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/__tests__/GroupAnimation.test.ts#L48)
- [Gets speed on all animations](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/__tests__/GroupAnimation.test.ts#L176)
- [Sets speed on all animations](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/__tests__/GroupAnimation.test.ts#L189)
- [Gets max duration](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/__tests__/GroupAnimation.test.ts#L217)
- [Correctly sets and gets time](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/__tests__/JSAnimation.test.ts#L950)
- [Correctly sets time during pause](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/__tests__/JSAnimation.test.ts#L1055)
- [Updates speed to half speed](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/__tests__/JSAnimation.test.ts#L1243)
- [Updates speed to double speed](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/__tests__/JSAnimation.test.ts#L1265)
- [Updates speed to reverse playback](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/__tests__/JSAnimation.test.ts#L1287)
- [Reverse animation from the end](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/__tests__/JSAnimation.test.ts#L1309)
- [Reverse animation from the end with half speed](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/__tests__/JSAnimation.test.ts#L1329)
- [Correctly returns duration](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/__tests__/JSAnimation.test.ts#L1359)
- [Correctly returns duration when delay is defined](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/__tests__/JSAnimation.test.ts#L1368)
- [Correctly returns duration when repeat is defined](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/__tests__/JSAnimation.test.ts#L1378)

Adaptation: Adapt to Astra public API; assert visible states and callback payloads, not engine call counts.

### UP-024 — Scoped group options and completion cardinality

Status: **implemented; behavior verified**. Key: `scoped-options`.

Acceptance: Per-value duration overrides base while other property finishes first. Staggered multiple targets hold/delay independently and complete together. Top-level onComplete fires once with no-op plus animated properties and once per complete sequence. Null wildcard hydrates from current value/style.

Upstream scenarios:

- [Can override transition options per-value](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/animation/__tests__/animate-waapi.test.ts#L7)
- [Applies stagger](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/animation/__tests__/animate-waapi.test.ts#L29)
- [correctly hydrates keyframes null with current MotionValue](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/animation/animate/__tests__/animate.test.tsx#L67)
- [top-level onComplete fires once when some props are equal and others animate](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/animation/animate/__tests__/animate.test.tsx#L347)
- [onComplete fires when sequence finishes](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/animation/animate/__tests__/animate.test.tsx#L543)
- [onComplete fires once when sequence finishes](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/animation/animate/__tests__/animate.test.tsx#L564)
- [correctly reads wildcard keyframes](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-style.ts#L62)
- [works correctly with stagger](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-style.ts#L72)
- [play interrupt custom ease](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/animate/animate.spec.ts#L53)
- [reads the initial value from the DOM before the first frame](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/animate/__tests__/element.test.ts#L31)
- [animates from a supplied first keyframe without reading the DOM](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/animate/__tests__/element.test.ts#L54)
- [applies transitionEnd when the animations finish](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/animation/animate/__tests__/element.test.ts#L160)

Adaptation: Adapt to Astra public API; assert visible states and callback payloads, not engine call counts.

### UP-025 — Scoped sequence callback segments and reverse scrubbing

Status: **implemented; behavior verified**. Key: `scoped-callback-sequence`.

Acceptance: Callback segment receives bounded progress ending at 1 or custom 100. Seek across zero-duration callback marker forward/backward/forward invokes do/undo/do once each. Unmount during callback segment stops future callbacks.

Upstream scenarios:

- [Progress callback receives interpolated values](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/animation/animate/__tests__/animate.test.tsx#L429)
- [Progress callback with custom keyframes](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/animation/animate/__tests__/animate.test.tsx#L455)
- [Toggle helper for do/undo pattern](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/animation/animate/__tests__/animate.test.tsx#L481)

Adaptation: Adapt to Astra public API; assert visible states and callback payloads, not engine call counts.

### UP-026 — Imperative reverse playback on a layout-enabled component

Status: **implemented; behavior verified**. Key: `layout-reverse-playback`.

Acceptance: useAnimate drives a layout-enabled Motion node forward and reverses speed; reaches origin without layout visual fighting playback.

Upstream scenarios:

- [animate() plays as expected when layout prop is present](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-reverse.ts#L2)

Adaptation: Adapt to Astra public API; assert visible states and callback payloads, not engine call counts.

### UP-027 — Layout/keyframe arc integration and composed orientation

Status: **implemented; behavior verified**. Key: `arc-rotation`.

Acceptance: Layout arc visibly leaves straight path; without arc and below minimum distance it stays straight. Arc without rotate preserves rotation; rotate enabled produces nonzero tangent rotation. Concurrent rotate target remains composed at the midpoint instead of overwritten by arc orientation.

Upstream scenarios:

- [deviates from the straight-line path mid-animation](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/transition-arc.ts#L16)
- [stays on the straight-line path without arc config](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/transition-arc.ts#L34)
- [does not arc for movements below the 20px minimum distance](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/transition-arc.ts#L50)
- [rotate option rotates the element along the curve](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/transition-arc.ts#L100)
- [no rotate option leaves rotation untouched](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/transition-arc.ts#L126)
- [does not clobber a user rotate animation](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/transition-arc.ts#L155)

Adaptation: Adapt to Astra public API; assert visible states and callback payloads, not engine call counts.

## Presence Layout (54 groups)

### UP-028 — Imperative animation retains its duration beside a layout participant

Status: **implemented; behavior verified**. Key: `layout-imperative-clock`.

Acceptance: Start public scoped value animation while a layout component updates; sample at least one strict intermediate value and final target.

Upstream scenarios:

- [animate() plays as expected when layout prop is present](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-layout-timing.ts#L2)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-029 — Shared and nested layout exits complete each boundary once

Status: **implemented; behavior verified**. Key: `presence-layout-completion`.

Acceptance: Cycle a shared layoutId through separate AnimatePresence boundaries; each completed boundary notifies once. Remove inner then outer layout participants; all retained nodes disappear. Sibling AnimatePresence boundaries inside LayoutGroup both finish and remove their outgoing nodes.

Upstream scenarios:

- [Only fires once when layoutId child exits and re-enters](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-presence-exit-complete-multiple.ts#L7)
- [Ensures all elements are removed](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-presence-layout.ts#L2)
- [Sibling AnimatePresence wrapped in LayoutGroup remove exiting elements](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/AnimatePresence.test.tsx#L1150)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-030 — Accordion height exits remain animated under switching and interrupted entry

Status: **implemented; behavior verified**. Key: `presence-height-interruption`.

Acceptance: Close an open height:auto panel; observe intermediate nonzero height then removal. Switch A to B while A exits; both have nonzero intermediate height. Interrupt B entry by closing or switching to C; B visibly animates out and all obsolete panels disappear.

Upstream scenarios:

- [Exit animation is not instant when closing an accordion item](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-presence-exit-height.ts#L2)
- [Exit animation eventually removes the element](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-presence-exit-height.ts#L20)
- [Opening a new item while another exits animates both](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-presence-exit-height.ts#L31)
- [Interrupting enter animation does not break exit animation](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-presence-exit-height.ts#L56)
- [Switching items mid-enter animates the exit](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-presence-exit-height.ts#L78)

Adaptation: Use managed AnimatePresence and height targets, distinct from existing native projection/text accordion regressions.

### UP-031 — Already-satisfied descendant exits do not retain a removed ancestor

Status: **implemented; behavior verified**. Key: `presence-noop-descendant-exit`.

Acceptance: Settled variant descendants have exit targets equal to current opacity/scale with a long nominal duration. Removing their parent completes promptly and fires one exit completion.

Upstream scenarios:

- [Removes modal when child exit targets match current values](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-presence-exit-no-op.ts#L2)
- [Removes child when nested variant children have exit matching current values](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/AnimatePresence.test.tsx#L1748)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-032 — Pop layout preserves authored geometry across roots, anchors, and fractional sizing

Status: **implemented; behavior verified**. Key: `pop-geometry-matrix`.

Acceptance: Compare pre-exit and retained-exit rectangles for RTL, explicit relative top/left, fractional width, content-box padding/border, and shadow-root fixtures. Right/bottom anchors preserve chosen edges; reversal restores authored geometry and removes pop-owned styles.

Upstream scenarios:

- [correctly pops exiting elements in RTL direction without shifting](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-presence-pop-rtl.ts#L2)
- [correctly pops exiting elements out of the DOM](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-presence-pop-shadow-root.ts#L17)
- [correctly pops exiting elements out of the DOM when they already have an explicit top/left](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-presence-pop-shadow-root.ts#L80)
- [preserves sub-pixel width when popping layout](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-presence-pop-subpixel.ts#L2)
- [preserves width for content-box elements with padding and border](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-presence-pop-subpixel.ts#L27)
- [correctly pops exiting elements out of the DOM when they already have an explicit top/left](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-presence-pop.ts#L85)
- [correctly pops exiting elements out of the DOM when anchorX is set to right](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-presence-pop.ts#L148)
- [popLayout mode with anchorY='bottom' preserves bottom positioning](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/AnimatePresence.test.tsx#L665)

Adaptation: Do not modify concurrent PopResize fixtures; parent should reconcile any overlap with those newly added right/bottom resize cases. Shadow root and content-box remain independent.

### UP-033 — Empty and non-animated managed presence exits release immediately

Status: **implemented; behavior verified**. Key: `presence-empty-exits`.

Acceptance: Empty nested propagate boundary releases its exiting parent. Plain child without participants is removed; motion child with animate but no exit cannot block a wait replacement.

Upstream scenarios:

- [Completes exit when there are no children](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-presence-propagate-empty.ts#L2)
- [Removes a child with no animations](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/AnimatePresence.test.tsx#L300)
- [Immediately remove child if no exit animations defined](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/AnimatePresence.test.tsx#L381)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-034 — Persisting keys retain order, pose, and identity across presence list changes

Status: **implemented; behavior verified**. Key: `presence-keyed-order`.

Acceptance: Reorder keyed parent items containing independent wait boundaries; latest content appears in its new owner. Switch lists with disappearing and persisting keys; surviving keys retain relative order and native nodes. Persisting motion child never replays its initial pose when surrounding keys change.

Upstream scenarios:

- [Correct number of animations trigger](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-presence-reorder.ts#L2)
- [Never replays the enter animation for a persisting key](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-presence-strict-dataset.ts#L11)
- [Exiting children don't reorder present children (#3746)](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/AnimatePresence.test.tsx#L774)

Adaptation: Omit React StrictMode double-mount counts; assert public identity, order and animation continuity.

### UP-035 — View enter, exit, update, and share layers honor transition timing

Status: **implemented; behavior verified**. Key: `view-layer-timing`.

Acceptance: For each public AnimateView transition kind inspect live pseudo-element effects: configured duration/easing reaches browser-generated layers. Custom enter/exit keyframes replace the relevant crossfade once and report completion once.

Upstream scenarios:

- [`animates ${mode} views with Motion timing`](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/animate-view.ts#L30)
- [retimes the browser's default enter and exit animations](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/react/animate-view.spec.ts#L58)
- [replaces the browser's animations with custom keyframes](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/react/animate-view.spec.ts#L94)
- [retimes shared element transitions](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/react/animate-view.spec.ts#L132)
- [retimes update transitions](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/react/animate-view.spec.ts#L192)

Adaptation: Astra startViewTransition/AnimateView replaces React startTransition plumbing; do not assert upstream private pseudo-name strings.

### UP-036 — Identity motion styles do not create an unwanted fixed containing block

Status: **implemented; behavior verified**. Key: `layout-no-containing-block`.

Acceptance: With no transform and identity transform variants, a fixed descendant remains viewport-positioned after the parent mounts and updates. Computed parent transform/perspective/filter and will-change must not introduce a containing block.

Upstream scenarios:

- [`motion.div does not establish a containing block (variant=${variant})`](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/issue-2833-fixed-position.ts#L20)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-037 — Layout anchors preserve centered descendants during parent projection

Status: **implemented; behavior verified**. Key: `layout-anchor-centering`.

Acceptance: With layoutAnchor={x:0.5,y:0.5}, child and parent painted centers stay aligned at a controlled midpoint. Without anchor the same fixture exhibits the expected relative offset, making the assertion discriminate the option.

Upstream scenarios:

- [Child with layoutAnchor={x:0.5,y:0.5} stays centered mid-animation](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-anchor.ts#L2)
- [Child without layoutAnchor drifts from center mid-animation](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-anchor.ts#L26)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-038 — A layout participant with an exit target is removed after completion

Status: **implemented; behavior verified**. Key: `layout-exit-release`.

Acceptance: Mount a managed presence layout child, immediately hide it, and observe eventual removal plus one exit callback.

Upstream scenarios:

- [Allows the animation to be marked complete](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-exit.ts#L2)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-039 — Grouped relative children follow sibling expansion without jumping

Status: **implemented; behavior verified**. Key: `layout-relative-group`.

Acceptance: Expand sibling: a relative child has a strict intermediate position then expected final position. Repeat after child has already performed its own layout animation. Reverse expansion and assert original position is restored.

Upstream scenarios:

- [relative children should not instantly jump to new layout](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-group.ts#L2)
- [relative children should not instantly jump to new layout, after performing their own layout animation](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-group.ts#L38)
- [should return to original state when expander is clicked twice with delay](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-group.ts#L80)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-040 — A same-flush layout undo cancels obsolete projection

Status: **implemented; behavior verified**. Key: `layout-same-flush-undo`.

Acceptance: Change layout destination then restore it before paint; painted rectangle remains original and no obsolete animation survives.

Upstream scenarios:

- [Correctly cancels animation](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-instant-undo.ts#L14)

Adaptation: Use Svelte flush/effect timing rather than React useLayoutEffect; keep public geometry assertion.

### UP-041 — Shared layout respects pixel and percentage parent translations

Status: **implemented; behavior verified**. Key: `layout-parent-translations`.

Acceptance: Mount layoutId child under translated motion parent without an unsolicited projection offset. Switch shared indicator under percentage x/y parent; assert strict intermediate position and correct final rectangle.

Upstream scenarios:

- [layoutId element inside motion.div with x/y should not get a projection transform on mount](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-parent-xy-offset.ts#L2)
- [layoutId indicator animates to correct position within parent with percentage x/y](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared-percent-xy-parent.ts#L2)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-042 — Percentage transforms coexist with sibling insertion before keyframe resolution

Status: **implemented; behavior verified**. Key: `layout-percent-keyframe-race`.

Acceptance: Insert a preceding sibling while percentage x animation resolves; the layout participant still projects from prior geometry and settles correctly.

Upstream scenarios:

- [Correctly layout-animates when sibling added before keyframes resolve](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-percent-x-flex.ts#L17)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-043 — Removing an animated scale restores its authored base after a shared morph

Status: **implemented; behavior verified**. Key: `layout-transform-origin-read`.

Acceptance: Replace a 100px shared source by a 300px destination with animate scale:2, then remove scale from animate. The scaled destination measures 600px, then restores its authored 300px width and height.

Upstream scenarios:

- [Should not read a projection transform as the initial transform](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-read-transform.ts#L17)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-044 — Relative children follow delayed and dragged parent movement

Status: **implemented; behavior verified**. Key: `layout-relative-follow`.

Acceptance: With delayed child transition, parent/child final rectangles share expected translation without child double-offset. Drag a layout parent; child follows the same pointer translation while preserving its dimensions.

Upstream scenarios:

- [Child correctly follows parent](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-relative-delay.ts#L17)
- [Child correctly follows parent](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-relative-drag.ts#L88)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-045 — Viewport resize settles projection and later layout changes recover

Status: **implemented; behavior verified**. Key: `layout-resize-recovery`.

Acceptance: Resize viewport during active parent/child layout animation; geometry settles without stale transforms. Immediate post-resize change remains stable; later change produces a strict intermediate position.

Upstream scenarios:

- [Finishes the animation and blocks animation on immediate layout animations until 250ms](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-resize.ts#L17)

Adaptation: Astra automatic layout policy may intentionally differ from upstream 250ms blocking; assert observable recovery and document any intentional policy difference rather than copying private timer constants.

### UP-046 — Wrapperless shared destinations project from their actual source rectangle

Status: **implemented; behavior verified**. Key: `layout-fragment-origin`.

Acceptance: Toggle keyed/shared children through a Svelte snippet/fragment; destination midpoint uses source top=100 rather than the page origin.

Upstream scenarios:

- [Elements with layoutId inside a Fragment should animate from the correct starting position](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared-fragment.ts#L17)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-047 — Nested shared lightbox transitions settle with instant and short durations

Status: **implemented; behavior verified**. Key: `layout-lightbox-crossfade`.

Acceptance: Open and close nested shared parent/child at zero and short duration. Assert source/destination final rectangles, authored opacity and border-radius endpoints; no stale visible source remains.

Upstream scenarios:

- [Correctly animates between items and lightbox with instant transition](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared-lightbox-crossfade.ts#L115)
- [Correctly animates between items and lightbox with very fast transition](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared-lightbox-crossfade.ts#L118)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-048 — Repeated shared toggles retain outgoing nodes through crossfade

Status: **implemented; behavior verified**. Key: `layout-shared-presence-retention`.

Acceptance: Toggle shared destinations repeatedly; each transition starts from the previous painted rectangle. Outgoing AnimatePresence source stays connected at an intermediate crossfade, then disappears once complete.

Upstream scenarios:

- [Should allow multiple toggles](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L17)
- [When performing crossfade animation, removed element isn't removed until animation is complete](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L66)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-049 — Shared replacements and retained followers honor layout modes

Status: **implemented; behavior verified**. Key: `layout-shared-mode-matrix`.

Acceptance: For true/position/size modes, switch shared A to B and back; assert fixed midpoint rectangle, endpoints and start/complete callbacks. For retained A plus B topology, both painted rectangles project correctly and retain authored opacity.

Upstream scenarios:

- [Correctly fires layout={true} animations and fires onLayoutAnimationStart and onLayoutAnimationComplete](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L89)
- [It correctly fires layout="position" animations](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L141)
- [It correctly fires layout="size" animations](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L177)
- [Correctly fires layout={true} animations and fires onLayoutAnimationStart and onLayoutAnimationComplete](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L381)
- [It correctly fires layout="position" animations](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L428)
- [It correctly fires layout="size" animations](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L464)
- [Correctly fires layout={true} animations and fires onLayoutAnimationComplete](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L539)
- [It correctly fires layout="position" animations](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L597)

Adaptation: Unify duplicated upstream switch cases in one parameterized matrix; cover replacement and retained-source topologies separately.

### UP-050 — Shared identities animate across empty/source/destination cycles

Status: **implemented; behavior verified**. Key: `layout-empty-shared-cycle`.

Acceptance: Cycle none to A to B to none and reverse while active; initial A starts at its own position, replacement projects from A, obsolete nodes eventually disappear.

Upstream scenarios:

- [Correctly fires layout={true} animations](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L295)
- [Correctly fires layout={true} animations](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L338)
- [Correctly fires layout={true} animations](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L826)
- [Correctly fires layout={true} animations](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L869)

Adaptation: These four upstream declarations repeat the same source scenario; one parameterized public scenario suffices.

### UP-051 — Shared projection composes transformTemplate across reversal

Status: **implemented; behavior verified**. Key: `layout-shared-transform-template`.

Acceptance: Custom transformTemplate translation remains present in source, midpoint, and reversed destination rectangles.

Upstream scenarios:

- [It correctly fires layout={true} animations when the component has a transformTemplate](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L500)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-052 — Preserve-aspect selects position-only or full projection correctly

Status: **implemented; behavior verified**. Key: `layout-preserve-aspect-matrix`.

Acceptance: Unequal aspect ratios animate position without distorting destination size. Equal aspect ratios interpolate size and position. Changed-size/same-position and unchanged same-element cases do not introduce spurious scale or movement.

Upstream scenarios:

- [It correctly animates layout="preserve-aspect" as "position" animations if aspect ratios are different](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L631)
- [It correctly doesn't animate if layout="preserve-aspect" if size is different and position is the same](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L667)
- [It correctly doesn't animate if layout="preserve-aspect" on same element if size and position are the same](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L705)
- [It correctly animates layout="preserve-aspect" as normal layout animations if both aspect ratios are the same](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L737)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-053 — A normal shared transition still animates after an instant one

Status: **implemented; behavior verified**. Key: `layout-after-instant-shared`.

Acceptance: Perform zero-duration shared promotion then a normal reverse; reverse has expected strict intermediate rectangle and final endpoint.

Upstream scenarios:

- [Correctly fires layout={true} animations after an instant transition](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L773)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-054 — Nested shared children avoid inherited distortion through ordinary and display:contents wrappers

Status: **implemented; behavior verified**. Key: `layout-nested-shared`.

Acceptance: Replace parent and child sharing identities; parent moves/resizes while child preserves intended dimensions and tracks position. Repeat with display:contents intermediate DOM; reversal retains correct geometry.

Upstream scenarios:

- [Correctly fires layout={true} animations](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L911)
- [Correctly fires layout={true} animations when there are divs with `display: contents` in the path](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L957)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-055 — Removing a grouped sibling animates remaining relative positions

Status: **implemented; behavior verified**. Key: `layout-unmount-sibling`.

Acceptance: Unmount layout sibling and observe remaining child midpoint then endpoint. When relative parent position changes too, unchanged child remains at expected painted position without a jump.

Upstream scenarios:

- [Should trigger sibling animation when unmount](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L1005)
- [If a sibling's position relative to the parent has changed, it should remain at its position](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L1022)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-056 — A remounted layoutId does not reuse a fully removed source snapshot

Status: **implemented; behavior verified**. Key: `layout-clear-shared-snapshot`.

Acceptance: Remove shared source completely, later mount same ID at different position; it starts at its own rectangle. Repeat with a persistent projecting sibling to exercise group cleanup.

Upstream scenarios:

- [After removing an element with a layoutId, the next element with that ID should not animate from the last element](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L1041)
- [As previous, but with rendering layout projecting sibling that is not removed](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L1069)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-057 — Shared followers cannot intercept pointer interaction

Status: **implemented; behavior verified**. Key: `layout-follower-pointer-events`.

Acceptance: While duplicate shared identities exist, follower computed pointer-events is none and active lead remains interactive. After lead changes/reversal, authored pointer policy restores to the new lead.

Upstream scenarios:

- [Applies pointer-events: none to follow elements](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L1099)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-058 — Microtask-driven updates preserve layout measurement order

Status: **implemented; behavior verified**. Key: `layout-microtask-measurement`.

Acceptance: Schedule repeated geometry toggles in microtasks; assert stable final/midpoint geometry and no stale measurement error.

Upstream scenarios:

- [queueMicrotasks doesn't break layout measurements](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L1145)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-059 — Shared transitions measure rotated destinations without stale bounds

Status: **implemented; behavior verified**. Key: `layout-shared-rotation`.

Acceptance: Switch rotated shared source/destination twice; inspect expected geometry/endpoints, not just absence of thrown error.

Upstream scenarios:

- [Measures correctly](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L1168)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-060 — Shared crossfade interpolates matched border radii

Status: **implemented; behavior verified**. Key: `layout-shared-border-radius`.

Acceptance: At a controlled midpoint source and destination share the same nonzero corrected radius, and final destination restores authored radius.

Upstream scenarios:

- [Should animate border radius](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-shared.ts#L1189)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-061 — Document scroll is not replayed as layout displacement

Status: **implemented; behavior verified**. Key: `layout-document-scroll`.

Acceptance: Scroll document before a layout-affecting update; resulting painted rectangle reflects only requested layout delta, not scroll delta.

Upstream scenarios:

- [If viewport jumps, don't trigger layout animation](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout-viewport-jump.ts#L16)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-062 — Full and single-axis projection affect only configured geometry

Status: **implemented; behavior verified**. Key: `layout-axis-matrix`.

Acceptance: For true/x/y, capture initial and controlled midpoint rectangles. x interpolates x and width while y/height take target; y does the inverse; true interpolates all. Assert final endpoints and start then complete exactly once.

Upstream scenarios:

- [Correctly fires layout={true} animations and fires onLayoutAnimationStart and onLayoutAnimationComplete](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout.ts#L17)
- [It correctly fires layout="x" animations, only animating the x axis](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout.ts#L392)
- [It correctly fires layout="y" animations, only animating the y axis](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout.ts#L416)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-063 — Layout dependency gating composes with exits and shared identities

Status: **implemented; behavior verified**. Key: `layout-dependency-exits`.

Acceptance: Changed dependency retains exiting child rectangle while parent changes. Unchanged shared dependency prevents projection; changing it subsequently enables the expected animation.

Upstream scenarios:

- [Exiting children correctly animate when layoutDependency changes](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout.ts#L179)
- [Doesn't animate shared layout components when layoutDependency hasn't changed (issue #1436)](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout.ts#L202)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-064 — Repeatedly introduced layout children animate from the correct origin

Status: **implemented; behavior verified**. Key: `layout-new-entry-repeat`.

Acceptance: Add/remove/re-add list children while parent is projecting; new child starts and follows expected geometry instead of snapping to final position.

Upstream scenarios:

- [Newly-entering elements animate as expected](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout.ts#L267)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-065 — Portalled layout children do not inherit source-parent scale correction

Status: **implemented; behavior verified**. Key: `layout-portal-boundary`.

Acceptance: Move a layout child to a body portal while its logical parent resizes; child keeps expected independent screen coordinates and dimensions.

Upstream scenarios:

- [Elements within portal don't perform scale correction on parents](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout.ts#L324)

Adaptation: Use Svelte mount/attachment portal mechanics; no React createPortal dependency.

### UP-066 — Rerenders do not restart unchanged layout targets

Status: **implemented; behavior verified**. Key: `layout-unchanged-target-callbacks`.

Acceptance: During active projection issue non-geometric updates; layout start callback remains one and pose stays continuous. Repeat while parent begins a separate layout animation.

Upstream scenarios:

- [A new layout animation isn't started if the target doesn't change](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout.ts#L368)
- [A new layout animation isn't started if the target doesn't change, even if parent starts layout animation](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout.ts#L380)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-067 — Disabled crossfade keeps shared destination opacity opaque

Status: **implemented; behavior verified**. Key: `layout-crossfade-disabled`.

Acceptance: Switch shared identity with crossfade:false in both directions; at mid-transition computed destination opacity stays one.

Upstream scenarios:

- [Disabling crossfade works as expected](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/layout.ts#L440)

Adaptation: Existing test inspects projection.options only; this adds missing observable rendering assertion.

### UP-068 — Managed presence permits ordinary initial animation by default

Status: **implemented; behavior verified**. Key: `presence-default-enter`.

Acceptance: With initial entry enabled, the rendered pose and public onUpdate samples pass through a strict intermediate value before reaching the target.

Upstream scenarios:

- [Allows initial animation if no `initial` prop defined](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/AnimatePresence.test.tsx#L18)
- [Does nothing on initial render by default](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/AnimatePresence.test.tsx#L828)

Adaptation: Wrapped and direct upstream declarations share one public behavior; use component wrapper variant to preserve context path.

### UP-069 — Inherited exit variants honor afterChildren sequencing

Status: **implemented; behavior verified**. Key: `presence-exit-variant-orchestration`.

Acceptance: Parent exit variant propagates to descendants through a component wrapper. For when:afterChildren, child exits before parent begins; eventual DOM removal and callback occur once.

Upstream scenarios:

- [when: afterChildren fires correctly](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/AnimatePresence.test.tsx#L171)
- [Exit propagates through variants](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/AnimatePresence.test.tsx#L588)
- [Exit propagates through variants](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/AnimatePresence.test.tsx#L1110)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-070 — Rapid sync replacements and staggered removals leave the latest children

Status: **implemented; behavior verified**. Key: `presence-rapid-sync-sequence`.

Acceptance: Rapidly introduce three keyed sync children: intermediate retained records coexist, then only final key remains. Remove a list over successive updates; resulting DOM key sets are exact after each exit.

Upstream scenarios:

- [Can cycle through multiple components](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/AnimatePresence.test.tsx#L319)
- [Elements exit in sequence during fast renders](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/AnimatePresence.test.tsx#L487)
- [Can cycle through multiple components](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/AnimatePresence.test.tsx#L951)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-071 — Boundary custom overrides element custom throughout inherited exits

Status: **implemented; behavior verified**. Key: `presence-custom-precedence`.

Acceptance: Give parent and child conflicting element custom values; boundary custom determines both exit target values. Repeat through a wrapper/inherited variant path. During retention, updated boundary data stays observable while the active exit preserves its captured target and completes removal.

Upstream scenarios:

- [Exit variants are triggered with `AnimatePresence.custom`, not that of the element.](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/AnimatePresence.test.tsx#L541)
- [Exit variants are triggered with `AnimatePresence.custom`, not that of the element.](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/AnimatePresence.test.tsx#L988)
- [Exit variants are triggered with `AnimatePresence.custom` throughout the tree](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/AnimatePresence.test.tsx#L1033)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-072 — Changing managed presence mode preserves active children

Status: **implemented; behavior verified**. Key: `presence-mode-switch`.

Acceptance: Switch wait to popLayout and back while child remains present; same native node and final opacity persist and subsequent exit completes.

Upstream scenarios:

- [Switching mode from wait to popLayout doesn't break animations](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/AnimatePresence.test.tsx#L722)
- [Switching mode from popLayout to wait doesn't break animations](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/AnimatePresence.test.tsx#L748)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-073 — Animation controls operate inside initial=false presence

Status: **implemented; behavior verified**. Key: `presence-controls-initial-false`.

Acceptance: Mount controlled motion child under initial=false, start public controls after mount, assert target pose and clean exit without exception.

Upstream scenarios:

- [Animation controls children of initial={false} don't throw`](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/AnimatePresence.test.tsx#L888)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-074 — Rapid keyed dynamic exits clean obsolete records and notify completion

Status: **implemented; behavior verified**. Key: `presence-dynamic-custom-switches`.

Acceptance: Switch four keys with dynamic custom function variants; obsolete exits are removed and last key reaches final pose. Exit completion fires after actual obsolete removals without duplicate late notifications.

Upstream scenarios:

- [Removes exiting children during rapid key switches with dynamic custom variants](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/AnimatePresence.test.tsx#L1302)
- [Fires onExitComplete during rapid key switches with dynamic custom variants](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/AnimatePresence.test.tsx#L1372)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-075 — Completed exits restart from current custom and object initial values

Status: **implemented; behavior verified**. Key: `presence-completed-reentry-initial`.

Acceptance: While slow sibling retains group, re-enter a child whose exit completed; custom enter resolver receives current direction. For object initial opacity .5, first re-entry update resets to .5 then animates to one.

Upstream scenarios:

- [Re-entering child replays enter animation when exit was complete](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/AnimatePresence.test.tsx#L1447)
- [Re-entering child with object-form initial resets to initial values when exit was complete](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/AnimatePresence.test.tsx#L1557)

Adaptation: Existing fast/slow sibling test asserts final one only; source requires observing reset pose/custom invocation.

### UP-076 — Unmounting the last motion participant releases an exiting record

Status: **implemented; behavior verified**. Key: `presence-descendant-unregister`.

Acceptance: Start long child exit, then replace that child internally with plain content; outer retained record disappears and completion occurs once.

Upstream scenarios:

- [Removes child when motion components inside unmount during exit (#3243)](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/AnimatePresence.test.tsx#L1857)

Adaptation: Existing scope unit test covers unregister bookkeeping, but managed DOM wiring is not yet covered.

### UP-077 — Presence data outside a boundary returns undefined

Status: **implemented; behavior verified**. Key: `presence-context-default`.

Acceptance: Render public usePresenceData outside AnimatePresence; undefined fallback renders and updates without registering an exit.

Upstream scenarios:

- [returns undefined when not within AnimatePresence](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/use-presence-data.test.tsx#L36)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-078 — Manual presence release is independent, idempotent, and reusable

Status: **implemented; behavior verified**. Key: `presence-manual-multi-exit`.

Acceptance: Two participants exit; releasing one retains wrapper until the second releases, including intervening rerenders. Repeated safeToRemove calls and repeated absent inputs emit exactly one completion. After a completed removal/remount, another exit can complete and emits the second callback.

Upstream scenarios:

- [Multiple children can exit](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/use-presence.test.tsx#L45)
- [Multiple children can exit over multiple rerenders](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/use-presence.test.tsx#L104)
- [Calling safeToRemove multiple times only triggers exit once](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/use-presence.test.tsx#L167)
- [Rapid rerenders during exit only triggers exit once](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/use-presence.test.tsx#L211)
- [Component can exit again after re-entering](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimatePresence/__tests__/use-presence.test.tsx#L254)

Adaptation: Existing tests stop after first participant then destroy owner, or reverse before completion; this adds the missing successful multi-participant and full remount paths.

### UP-079 — Custom shared view keyframes preserve the browser group morph

Status: **implemented; behavior verified**. Key: `view-custom-shared-morph`.

Acceptance: On shared size change with custom clip/filter frames, retain one live group geometry effect with configured duration/easing. Replace only crossfade layers; final destination grows and completes once.

Upstream scenarios:

- [keeps the group morph running when custom values replace the crossfade](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/AnimateView/__tests__/animate-view-layers.test.ts#L62)
- [keeps the shared element morph when custom share values replace the crossfade](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/react/animate-view.spec.ts#L154)

Adaptation: Adapt source through public Astra APIs; retain MIT source attribution.

### UP-080 — Nested LayoutGroup namespaces isolate or join shared identities correctly

Status: **implemented; behavior verified**. Key: `layout-group-namespaces`.

Acceptance: Exercise first group, nested named groups, unnamed parent/child and inheritance combinations through visible shared swaps. Matching effective group namespaces animate together; distinct group scopes do not cross-pair.

Upstream scenarios:

- [if it's the first LayoutGroup it sets the group id](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/LayoutGroup/__tests__/LayoutGroup.test.tsx#L10)
- [if it's a nested LayoutGroup it appends to the group id](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/LayoutGroup/__tests__/LayoutGroup.test.tsx#L22)
- [if the value of id is undefined, it doesn't change the group id](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/LayoutGroup/__tests__/LayoutGroup.test.tsx#L36)
- [if the parent group id is undefined, child LayoutGroups still append the group id](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/LayoutGroup/__tests__/LayoutGroup.test.tsx#L50)

Adaptation: Do not copy upstream context-string unit assertions; verify the namespace contract through public geometry.

### UP-081 — View queue recovers after failed updates and browser-skipped capture

Status: **implemented; behavior verified**. Key: `view-queue-error-recovery`.

Acceptance: A rejected update rejects its handle but a queued next update still runs exactly once. Native ready rejection caused by browser skip resolves finished as skipped after update runs once. Native update exception still rejects finished even when browser finished resolves.

Upstream scenarios:

- [a failed transition still lets the next queued transition run](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/view/__tests__/queue.test.ts#L22)
- [resolves (rather than throwing) when the browser skips the transition](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/view/__tests__/queue.test.ts#L53)
- [still rejects when the update itself throws](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/motion-dom/src/view/__tests__/queue.test.ts#L78)

Adaptation: Use startViewTransition with controlled document stub as existing parity-view server tests; browser layer checks remain separate.

## Gestures Scroll (63 groups)

### UP-082 — Focus-visible fallback and variant restoration

Status: **implemented; behavior verified**. Key: `gesture-focus-variants`.

Acceptance: Force :focus-visible true/false: whileFocus changes rendered style only for the visible-focus branch. Force :focus-visible unsupported, assert focused target style activates. Apply a named focus variant with transitionEnd; blur restores authored base value.

Upstream scenarios:

- [whileFocus applied if focus-visible selector throws unsupported](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/focus.test.tsx#L65)
- [whileFocus applied as variant](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/focus.test.tsx#L101)
- [whileFocus is unapplied when blur](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/focus.test.tsx#L136)
- [whileFocus applied](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/focus.test.tsx#L7)
- [whileFocus not applied when :focus-visible is false](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/focus.test.tsx#L37)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-083 — Touch hover filters callbacks

Status: **implemented; behavior verified**. Key: `gesture-touch-hover`.

Acceptance: Touch enter and leave invoke neither hover callback and do not activate visual hover; mouse still works.

Upstream scenarios:

- [filters touch events](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/hover.test.tsx#L30)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-084 — Hover transitionEnd and authored-base restoration

Status: **implemented; behavior verified**. Key: `gesture-hover-restoration`.

Acceptance: Hover variant reaches transitionEnd, then leave restores initial/base opacity with its transition.

Upstream scenarios:

- [whileHover is unapplied when hover ends](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/hover.test.tsx#L136)
- [Correctly uses transition applied to initial](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/hover.test.tsx#L174)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-085 — Hover release inside and outside before and after drag threshold

Status: **implemented; behavior verified**. Key: `gesture-hover-release`.

Acceptance: Hover remains active when drag releases inside. Leaving during a press retains hover until release outside, both with drag disabled and below drag threshold.

Upstream scenarios:

- [whileHover remains active when pointer is over element after drag ends](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/hover.test.tsx#L249)
- [whileHover stays active during press and deactivates on release outside element](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/hover.test.tsx#L279)
- [whileHover stays active during press when pointer leaves before drag starts](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/hover.test.tsx#L312)
- [press gesture variant applies and unapplies with whileHover](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/press.test.tsx#L616)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-086 — Gesture priority protects only overlapping properties

Status: **implemented; behavior verified**. Key: `gesture-property-priority`.

Acceptance: Enter hover after tap is already active: tap controls scale while hover still controls opacity.

Upstream scenarios:

- [whileHover only animates values that aren't being controlled by a higher-priority gesture ](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/hover.test.tsx#L346)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-087 — Native disabled buttons suppress tap

Status: **implemented; behavior verified**. Key: `gesture-disabled-native`.

Acceptance: Native disabled motion.button invokes no onTapStart/onTap and shows no press feedback.

Upstream scenarios:

- [press event listeners don't fire if element is disabled](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/press.test.tsx#L35)
- [ignore press event when button is disabled](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/press.test.tsx#L894)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-088 — Keyboard tap cancellation and visual restoration

Status: **implemented; behavior verified**. Key: `gesture-keyboard-cancel`.

Acceptance: Enter keydown activates whileTap; blur before keyup cancels exactly once and restores base. Enter keyup completes exactly once; later blur does not cancel.

Upstream scenarios:

- [press cancel event listeners fire via keyboard](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/press.test.tsx#L101)
- [press cancel event listeners not fired via keyboard after keyUp](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/press.test.tsx#L132)
- [press gesture variant applies and unapplies via keyboard](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/press.test.tsx#L423)
- [press gesture variant applies and unapplies via blur cancel](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/press.test.tsx#L458)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-089 — Reactive tap handler replacement and removal

Status: **implemented; behavior verified**. Key: `gesture-live-tap-handlers`.

Acceptance: Replacing/removing callbacks on the same mounted node uses only latest handlers. Repeated rerenders do not duplicate taps; unrelated sibling presses do not invoke old cancel handlers.

Upstream scenarios:

- [press event listeners are cleaned up](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/press.test.tsx#L164)
- [onTapCancel is correctly removed from a component](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/press.test.tsx#L181)
- [press event listeners unset](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/press.test.tsx#L364)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-090 — Tap ancestry and release destinations

Status: **implemented; behavior verified**. Key: `gesture-tap-ancestry`.

Acceptance: Parent recognizes child-child, child-parent and parent-child pointer pairs. Nested parent and child both receive default tap; release outside cancels without tap.

Upstream scenarios:

- [press event listeners fire if triggered by child](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/press.test.tsx#L212)
- [press event listeners fire if triggered by child and released on bound element](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/press.test.tsx#L230)
- [press event listeners fire if triggered by bound element and released on child](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/press.test.tsx#L248)
- [press cancel fires if press released outside element](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/press.test.tsx#L267)
- [without propagate both parent and child onTap fire](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/press.test.tsx#L794)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-091 — Tap below drag threshold and after completed parent drag

Status: **implemented; behavior verified**. Key: `gesture-tap-after-drag`.

Acceptance: Crossing parent drag threshold suppresses child onTap and cancels its pressed appearance. Subthreshold parent movement permits child tap. After real parent drag ends, a fresh child tap works exactly once.

Upstream scenarios:

- [press event listeners do fire if parent is being dragged only a little bit](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/press.test.tsx#L312)
- [press event listeners do fire after drag gesture on parent element](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/press.test.tsx#L335)
- [press event listeners doesn't fire if parent is being dragged](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/press.test.tsx#L288)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-092 — Inherited press variants and reactive animation state

Status: **implemented; behavior verified**. Key: `gesture-press-variants`.

Acceptance: Parent whileTap activates and releases child variant. Child local tap restores current inherited animate variant. Tap callback updates parent animate and both sibling variants update. Changing animate/whileHover while pressed restores latest values on release, not stale initial state.

Upstream scenarios:

- [press gesture variant unapplies children](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/press.test.tsx#L493)
- [press gesture on children returns to parent-defined variant](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/press.test.tsx#L529)
- [press gesture works with animation state](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/press.test.tsx#L571)
- [press gesture variant applies and unapplies as state changes](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/press.test.tsx#L685)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-093 — Tap isolation through nested ancestors

Status: **implemented; behavior verified**. Key: `gesture-tap-isolation`.

Acceptance: propagate.tap=false suppresses parent/grandparent taps and whileTap, activates only child, preserves native bubbling.

Upstream scenarios:

- [propagate={{ tap: false }} prevents parent onTap from firing](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/press.test.tsx#L770)
- [propagate={{ tap: false }} isolates whileTap to child only](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/press.test.tsx#L817)
- [propagate={{ tap: false }} prevents all ancestor onTap handlers (three levels)](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/press.test.tsx#L866)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-094 — Pan ordering, threshold and live callbacks

Status: **implemented; behavior verified**. Key: `gesture-pan-lifecycle`.

Acceptance: onPanStart precedes onPan and onPanEnd. Subthreshold movement calls neither start nor end. Callbacks updated during a session are used for later moves and end.

Upstream scenarios:

- [pan handlers aren't frozen at pan session start](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/pan.test.tsx#L12)
- [onPanStart fires before onPan](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/pan.test.tsx#L47)
- [onPanEnd doesn't fire unless onPanStart has](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/pan.test.tsx#L81)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-095 — Drag lifecycle, current callbacks and pointer information

Status: **implemented; behavior verified**. Key: `drag-callback-lifecycle`.

Acceptance: A child stopping pointerup propagation still produces one drag-end. No initiated drag means no drag-end; externally resetting x during active drag still ends once. Replacing callbacks mid-session uses current handlers; end point equals transformed final move point. onPanSessionStart is wired on draggable elements.

Upstream scenarios:

- [dragEnd fires when a child stops pointerup propagation (#2794)](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/__tests__/index.test.tsx#L146)
- [dragEnd doesn't fire if dragging never initiated](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/__tests__/index.test.tsx#L171)
- [dragEnd does fire even if the MotionValues were physically reset](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/__tests__/index.test.tsx#L191)
- [drag handlers aren't frozen at drag session start](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/__tests__/index.test.tsx#L221)
- [dragEnd returns transformed pointer](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/__tests__/index.test.tsx#L262)
- [panSessionStart fires](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/__tests__/index.test.tsx#L292)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-096 — Drag transition completion and configured release

Status: **implemented; behavior verified**. Key: `drag-release-transition`.

Acceptance: Custom dragTransition settles at constraints and onDragTransitionEnd fires once after settlement.

Upstream scenarios:

- [dragTransitionEnd fires](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/__tests__/index.test.tsx#L311)
- [applies drag transition](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/__tests__/index.test.tsx#L888)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-097 — Both direction locks and all numeric constraint edges

Status: **implemented; behavior verified**. Key: `drag-direction-and-bounds`.

Acceptance: Initial horizontal motion locks x despite later y movement. Clamp all four numeric bounds with dragElastic=false for x/y and two-axis drag. Reactive constraint replacement is used by next drag.

Upstream scenarios:

- [limit to initial direction: x](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/__tests__/index.test.tsx#L431)
- [impose top drag constraint](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/__tests__/index.test.tsx#L730)
- [impose bottom drag constraint](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/__tests__/index.test.tsx#L760)
- [drag constraints can be updated](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/__tests__/index.test.tsx#L790)
- [Locks drag to y](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag.ts#L115)
- [Constraints as object: bottom right](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag.ts#L182)
- [Constraints as object: top left](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag.ts#L202)
- [impose left drag constraint](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/__tests__/index.test.tsx#L670)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-098 — Nested drag arbitration across releases and repeated sessions

Status: **implemented; behavior verified**. Key: `drag-nested-release`.

Acceptance: Child release does not give blocked parent momentum. After parent has dragged and stopped, child drag still leaves parent at its settled position.

Upstream scenarios:

- [block drag propagation release velocity](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/__tests__/index.test.tsx#L514)
- [block drag propagation even after parent has been dragged](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/__tests__/index.test.tsx#L539)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-099 — whileDrag renders and restores its variant

Status: **implemented; behavior verified**. Key: `drag-active-variant`.

Acceptance: Actual rendered opacity enters whileDrag after threshold and returns to base on release.

Upstream scenarios:

- [whileDrag applies animation state](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/__tests__/index.test.tsx#L573)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-100 — Dragging adopts replacement MotionValues

Status: **implemented; behavior verified**. Key: `drag-replace-value`.

Acceptance: Replace public style.x MotionValue before a new drag; only replacement value and DOM move from its current base.

Upstream scenarios:

- [accepts new motion values](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/__tests__/index.test.tsx#L944)

Adaptation: Upstream scenario is skipped TODO; Astra supports reactive MotionValue binding, so preserve the supported public binding contract without upstream private state.

### UP-101 — Native drag targets and interactive descendants

Status: **implemented; behavior verified**. Key: `drag-native-targets`.

Acceptance: Native motion.button/input/a can themselves drag. Child input, textarea, select, checkbox inside label and contenteditable do not start ancestor drag. Child button/link and ordinary draggable area do start drag.

Upstream scenarios:

- [drag gesture starts on a motion.button with drag prop](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/__tests__/index.test.tsx#L1007)
- [drag gesture starts on a motion.input with drag prop](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/__tests__/index.test.tsx#L1033)
- [drag gesture starts on a motion.a with drag prop](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/__tests__/index.test.tsx#L1059)
- [drag gesture does not start when clicking a child input](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/__tests__/index.test.tsx#L1086)
- [drag gesture does not start when clicking a child textarea](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/__tests__/index.test.tsx#L1117)
- [drag gesture does not start when clicking a child select](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/__tests__/index.test.tsx#L1148)
- [drag gesture starts when clicking a child button](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/__tests__/index.test.tsx#L1181)
- [drag gesture starts when clicking a child link](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/__tests__/index.test.tsx#L1212)
- [Should not drag when clicking and dragging on an input inside draggable](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-input-propagation.ts#L11)
- [Should not drag when clicking and dragging on a textarea inside draggable](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-input-propagation.ts#L40)
- [Should drag when clicking and dragging on a button inside draggable](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-input-propagation.ts#L68)
- [Should drag when clicking and dragging on a link inside draggable](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-input-propagation.ts#L96)
- [Should not drag when clicking and dragging on a select inside draggable](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-input-propagation.ts#L124)
- [Should not drag when clicking and dragging on a checkbox inside a label inside draggable](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-input-propagation.ts#L151)
- [Should not drag when clicking and dragging on a contenteditable element inside draggable](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-input-propagation.ts#L178)
- [Should still drag when clicking on the draggable area outside interactive elements](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-input-propagation.ts#L205)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-102 — Drag starts from animate when presence suppresses initial

Status: **implemented; behavior verified**. Key: `drag-presence-initial`.

Acceptance: AnimatePresence initial=false and initial.y differing from animate.y: first drag adds movement to animate value.

Upstream scenarios:

- [drag starts from animate value, not initial value](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/__tests__/index.test.tsx#L1247)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-103 — Parent handles and reactive DragControls replacement

Status: **implemented; behavior verified**. Key: `drag-controls-replace`.

Acceptance: Parent pointerdown can start child drag once. After controls prop switches, old controls cannot start node while new controls can.

Upstream scenarios:

- [.start triggers dragging on its parent](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/__tests__/use-drag-controls.test.tsx#L43)
- [dragControls can be updated](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/__tests__/use-drag-controls.test.tsx#L77)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-104 — snapToCursor with existing offsets is repeatable

Status: **implemented; behavior verified**. Key: `drag-snap-initial`.

Acceptance: Snap from initial x/y, release, repeat same pointer coordinates: first and second snapped positions match.

Upstream scenarios:

- [snapToCursor works correctly with initial coordinates](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/__tests__/use-drag-controls.test.tsx#L144)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-105 — Numeric elasticity applies uniformly to all edges

Status: **implemented; behavior verified**. Key: `drag-elastic-number`.

Acceptance: dragElastic numeric value gives expected overshoot on left/right/top/bottom and settles to bounds.

Upstream scenarios:

- [Resolves number as object filled with number](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/drag/utils/__tests__/constraints.test.ts#L25)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-106 — Nested draggable measurement retains sibling positions

Status: **implemented; behavior verified**. Key: `drag-nested-measurement`.

Acceptance: After dragging one nested child, pointerdown on its sibling must not move or reset the first child.

Upstream scenarios:

- [correctly positions children after dragging](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-framer-page.ts#L17)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-107 — Unrelated parent updates retain active drag and constraints

Status: **implemented; behavior verified**. Key: `drag-rerender-stability`.

Acceptance: Unrelated hover/state change while dragging changes neither viewport pose nor constraint origin, with layout on/off.

Upstream scenarios:

- [Maintains drag position on simple hover state change](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-layout-reorder-strict.ts#L59)
- [doesn't reset drag constraints (ref-based), while dragging, on unrelated parent component updates](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag.ts#L296)
- [doesn't reset drag constraints (ref-based), while dragging, on unrelated parent component updates](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag.ts#L582)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-108 — Momentum after held pointer and catch-release

Status: **implemented; behavior verified**. Key: `drag-held-flick`.

Acceptance: Hold pointer stationary before fast movement: release still travels beyond released position. Catch active inertia, release without moving: it remains stopped.

Upstream scenarios:

- [Fast flick after hold produces momentum](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-momentum.ts#L2)
- [Catch-and-release stops momentum](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-momentum.ts#L26)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-109 — Nested drag geometry with layout combinations

Status: **implemented; behavior verified**. Key: `drag-nested-layout-matrix`.

Acceptance: For parent/child layout flags (both,parent,child,neither), moving parent carries descendants once; child drag leaves parent fixed. Repeat with numeric constraints and elastic release: every descendant ends at expected geometry. Opposite-axis parent/child drag composes both movements with each layout combination.

Upstream scenarios:

- [Parent: layout, Child: layout](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-nested.ts#L162)
- [Parent: layout](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-nested.ts#L163)
- [Child: layout](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-nested.ts#L164)
- [Neither](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-nested.ts#L165)
- [Parent: layout, Child: layout](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-nested.ts#L269)
- [Parent: layout](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-nested.ts#L271)
- [Child: layout](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-nested.ts#L272)
- [Neither](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-nested.ts#L273)
- [Parent: layout, Child: layout](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-nested.ts#L433)
- [Parent: layout](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-nested.ts#L434)
- [Child: layout](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-nested.ts#L435)
- [Neither](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-nested.ts#L436)
- [Parent: layout, Child: layout](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-nested.ts#L440)
- [Parent: layout](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-nested.ts#L442)
- [Child: layout](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-nested.ts#L444)
- [Neither](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-nested.ts#L446)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-110 — Document scroll and absolute drag constraints

Status: **implemented; behavior verified**. Key: `drag-document-scroll`.

Acceptance: With document already scrolled, element-ref bounds permit reaching visible constraint bottom. During active window scroll a stationary pointer retains viewport pose; next move adds only pointer delta.

Upstream scenarios:

- [Allows dragging to the visible bottom of the viewport after scroll](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-ref-constraints-absolute-scrolled.ts#L10)
- [Element stays at same viewport position during window scroll (no pointer move)](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-scroll-while-drag.ts#L118)
- [Window scroll compensation prevents large position jumps](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-scroll-while-drag.ts#L160)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-111 — Self-resize refreshes measured drag bounds

Status: **implemented; behavior verified**. Key: `drag-resize-self`.

Acceptance: Resize draggable itself before drag and after existing drag offset; fresh bounds prevent crossing container edges. Repeat with direct DOM dimension mutation.

Upstream scenarios:

- [Updates drag constraints after draggable element is resized](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-ref-constraints-element-resize.ts#L33)
- [Updates drag constraints after draggable element is resized, with existing drag offset](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-ref-constraints-element-resize.ts#L69)
- [Updates drag constraints when element grows via direct DOM mutation](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-ref-constraints-resize-handle.ts#L17)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-112 — Dragging under scaled and rotated parents

Status: **implemented; behavior verified**. Key: `drag-transformed-parent`.

Acceptance: Using correctParentTransform, rendered node tracks cursor under scale .5, scale 2 and rotate 180deg.

Upstream scenarios:

- [Element follows cursor when parent is rotated 180deg](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-rotated-parent.ts#L2)
- [Element follows cursor when parent has scale(0.5)](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-scaled-parent.ts#L2)
- [Element follows cursor when parent has scale(2)](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-scaled-parent.ts#L33)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-113 — Container scroll compensation survives next move

Status: **implemented; behavior verified**. Key: `drag-container-scroll-resume`.

Acceptance: After ancestor scroll compensation, next pointer move introduces no doubled scroll delta or large jump.

Upstream scenarios:

- [Element scroll compensation prevents large position jumps](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-scroll-while-drag.ts#L50)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-114 — Snap release, presence exit and re-entry

Status: **implemented; behavior verified**. Key: `drag-snap-presence`.

Acceptance: Drag with snap-to-origin, remove during release, verify complete exit; remount at authored starting geometry without stranded transform.

Upstream scenarios:

- [exits cleanly after a drag and re-enters without a stranded transform](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-snap-animate-presence-exit.ts#L11)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-115 — Snap release survives shared-layout swaps

Status: **implemented; behavior verified**. Key: `drag-snap-shared-swap`.

Acceptance: Same-row keyed layoutId swap during snap release ends at destination rect; reverse swap restores origin without extra drag offset.

Upstream scenarios:

- [does not strand the drag transform after a same-row swap](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-snap-layout-id-swap.ts#L16)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-116 — SVG drag axes, constraints and viewBox scaling

Status: **implemented; behavior verified**. Key: `drag-svg-matrix`.

Acceptance: SVG rect x/y drag and all four constraints work with layout on/off. Matching viewBox and nonuniform preserveAspectRatio=none scaling convert pointer deltas correctly.

Upstream scenarios:

- [Works correctly when viewBox matches rendered size (no scaling)](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-svg-viewbox.ts#L68)
- [Handles non-uniform scaling (different x and y scale factors)](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-svg-viewbox.ts#L93)
- [Locks drag to x](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-svg.ts#L31)
- [Locks drag to y](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-svg.ts#L50)
- [Constraints as object: bottom right](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-svg.ts#L114)
- [Constraints as object: top left](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-svg.ts#L134)
- [Drags the element by the defined distance](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-svg.ts#L156)
- [Locks drag to x](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-svg.ts#L183)
- [Locks drag to y](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-svg.ts#L204)
- [Constraints as object: bottom right](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-svg.ts#L270)
- [Constraints as object: top left](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-svg.ts#L290)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-117 — Pixel and percentage drag origins

Status: **implemented; behavior verified**. Key: `drag-initial-offset`.

Acceptance: Numeric and percentage initial x/y correctly add pointer displacement without jumps; numeric offsets also repeat with layout enabled.

Upstream scenarios:

- [Drags the element by the defined distance with different initial offset](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag.ts#L49)
- [Drags the element by the defined distance with percentage initial offset](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag.ts#L72)
- [Drags the element by the defined distance with different initial offset](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag.ts#L436)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-118 — Snap-to-origin supports both or one axis

Status: **implemented; behavior verified**. Key: `drag-snap-axes`.

Acceptance: dragSnapToOrigin true returns x/y to origin; x or y returns only selected axis and retains other released coordinate.

Upstream scenarios:

- [Element returns to center with dragSnapToOrigin](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag.ts#L222)
- [Element returns to center on x axis only with dragSnapToOrigin='x'](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag.ts#L250)
- [Element returns to center on y axis only with dragSnapToOrigin='y'](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag.ts#L273)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-119 — Layout-enabled drag axes and numeric bounds

Status: **implemented; behavior verified**. Key: `drag-layout-axes`.

Acceptance: Two-axis drag from element itself and from ordinary child matches physical pointer displacement without layout. With layout enabled, two-axis/x/y drag displacement matches pointer movement; direction lock and both constraint corners remain correct.

Upstream scenarios:

- [Drags the element by the defined distance](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag.ts#L417)
- [Locks drag to x](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag.ts#L459)
- [Locks drag to y](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag.ts#L478)
- [Direction locks to y](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag.ts#L522)
- [Constraints as object: bottom right](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag.ts#L544)
- [Constraints as object: top left](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag.ts#L563)
- [Drags the element by the defined distance](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag.ts#L11)
- [Drags the element by the defined distance](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag.ts#L30)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-120 — Out-of-bounds release interrupted by click or new drag

Status: **implemented; behavior verified**. Key: `drag-release-interruption`.

Acceptance: Click during spring return still eventually settles in constraints. New drag during out-of-bounds return starts from current pose without discontinuity.

Upstream scenarios:

- [Returns to constraints when released outside and clicked during animation](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag.ts#L631)
- [Does not jump when dragged again during animation](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag.ts#L664)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-121 — Reordering preserves opacity and unscaled content

Status: **implemented; behavior verified**. Key: `reorder-visuals`.

Acceptance: Overlapping tab layout/reorder animations do not strand content opacity or distort final labels.

Upstream scenarios:

- [Layout animations don't interfere with opacity](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-tabs.ts#L2)
- [First tab doesn't distort when multiple layout animations started](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-tabs.ts#L14)
- [Opacity finishes animating on reorder](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-tabs.ts#L36)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-122 — Reorder membership during exits and insertion

Status: **implemented; behavior verified**. Key: `reorder-presence-membership`.

Acceptance: Repeated removal completes exit once; later drag does not resurrect removed items. Freshly inserted item can reorder and settle at correct slot.

Upstream scenarios:

- [Double removing item doesn't break exit animation](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-tabs.ts#L72)
- [Removed tabs don't reappear on reorder](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-tabs.ts#L87)
- [New items correctly reorderable](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-tabs.ts#L112)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-123 — Reorder repeated traversal along x and y

Status: **implemented; behavior verified**. Key: `reorder-axis-traversal`.

Acceptance: Drag across several siblings and back on each explicit axis; assert exact controlled values, rendered order and settled alignment after every release.

Upstream scenarios:

- [Y axis](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-to-reorder.ts#L26)
- [X axis](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-to-reorder.ts#L132)
- [Move around](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/drag-to-reorder.ts#L181)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-124 — Reorder upward, scrolled-container and page edge scrolling

Status: **implemented; behavior verified**. Key: `reorder-scroll-edges`.

Acceptance: Dragging near top reduces nonzero container scrollTop. Page already scrolled: local bottom-edge drag scrolls intended container. No local scroller: viewport edge drag scrolls document; release stops it.

Upstream scenarios:

- [Auto-scrolls up when dragging near top edge](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/reorder-auto-scroll.ts#L47)
- [Auto-scrolls container after page has been scrolled](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/reorder-auto-scroll.ts#L76)
- [Auto-scrolls page after dragging near the edges](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/reorder-auto-scroll.ts#L122)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-125 — Reorder automatic flex/grid axes and RTL

Status: **implemented; behavior verified**. Key: `reorder-detected-layouts`.

Acceptance: Auto flex row/column/wrapped/RTL and CSS grid each reorder to explicit expected order. Changing detected axis on resize actually reorders in new direction (not merely updates drag prop).

Upstream scenarios:

- [Reorders correctly after axis changes via resize](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/reorder-axis-change.ts#L35)
- [auto-detects a flex row](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/reorder-flex.ts#L12)
- [auto-detects a flex column](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/reorder-flex.ts#L18)
- [auto-detects wrapped flex rows](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/reorder-flex.ts#L24)
- [auto-detects wrapped RTL flex rows](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/reorder-flex.ts#L30)
- [auto-detects a grid and reorders across both axes](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/reorder-grid.ts#L2)
- [Reorders a grid across both axes with axis=%s](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/Reorder/__tests__/index.test.tsx#L111)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-126 — Reorder constraints resize preserves origin and hit targets

Status: **implemented; behavior verified**. Key: `reorder-constraint-resize`.

Acceptance: At-rest items stay at layout origins and unraised stacking after constraint/window resize. A native click at expected slot still selects correct item.

Upstream scenarios:

- [Items at their origin stay there when the window resizes](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/reorder-ref-constraints-resize.ts#L21)
- [Clicking an item after a resize selects that item](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/reorder-ref-constraints-resize.ts#L30)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-127 — Reorder under transformed parent

Status: **implemented; behavior verified**. Key: `reorder-scaled-parent`.

Acceptance: Scale .5 with correctParentTransform: dragged item tracks physical pointer and controlled reorder settles without overlap/gaps.

Upstream scenarios:

- [dragged item tracks the cursor with correctParentTransform (scale 0.5)](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/reorder-scaled-parent.ts#L28)
- [reorders correctly and settles aligned with correctParentTransform](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/reorder-scaled-parent.ts#L63)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-128 — Virtualized reorder preserves unmounted values

Status: **implemented; behavior verified**. Key: `reorder-virtualized`.

Acceptance: Render only middle subset of full controlled values; drag visible item across neighbor; full order retains all offscreen values/identity.

Upstream scenarios:

- [Preserves all items after reorder](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/reorder-virtualized.ts#L2)
- [Preserves unmeasured items during reorder (virtualized list support)](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/Reorder/__tests__/index.test.tsx#L66)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-129 — Reorder refs, native tags and TypeScript contracts

Status: **implemented; behavior verified**. Key: `reorder-contracts`.

Acceptance: Svelte bind:ref exposes native custom Group and Item elements. Union-array values and typed onReorder compile; invalid native attributes fail checks. SSR preserves selected native tags/attributes and meaningful drag policy styles.

Upstream scenarios:

- [Accepts union array types for values prop](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/Reorder/__tests__/index.test.tsx#L8)
- [Correctly hydrates ref](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/Reorder/__tests__/index.test.tsx#L31)
- [Correctly renders HTML](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/Reorder/__tests__/server.ssr.test.tsx#L6)
- [onReorder is typed correctly](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/Reorder/__tests__/server.ssr.test.tsx#L22)
- [HTML props have incorrect types - these should fail TypeScript checking](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/Reorder/__tests__/server.ssr.test.tsx#L41)

Adaptation: Svelte bind:ref replaces React ref; class replaces className. Astra intentionally accepts string styles, so do not port upstream invalid-style-string expectation. Assert semantic SSR tags/attrs and TypeScript rejection of invalid class/id/event props, not exact React serialization.

### UP-130 — Reorder large gaps and empty wrapped-row ends

Status: **implemented; behavior verified**. Key: `reorder-gaps-row-ends`.

Acceptance: With large gap, no order change before boundary, then one insertion after crossing. Move to empty end of wrapped row in LTR/RTL with stationary pointer; correct controlled order.

Upstream scenarios:

- [waits until the dragged center crosses a large gap](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/Reorder/utils/__tests__/check-reorder.test.ts#L48)
- [inserts into the empty end of a wrapped %s row](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/Reorder/utils/__tests__/check-reorder.test.ts#L74)

Adaptation: Astra reimplements reorder selection, so exercise geometry through public Reorder components rather than copying private helper tests.

### UP-131 — Document-relative target progress and transformed styles

Status: **implemented; behavior verified**. Key: `scroll-document-target`.

Acceptance: Window scroll maps target offsets to progress independently of document progress, and linked opacity responds/reverses.

Upstream scenarios:

- [Opacity updates via useTransform when scrolling](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/scroll-target-transform.ts#L11)
- [Fires onScroll on window scroll with child target.](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/render/dom/scroll/__tests__/index.test.ts#L254)
- [Fires onScroll on window scroll with child target.](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/render/dom/scroll/__tests__/index.test.ts#L691)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-132 — Native ViewTimeline and JS target parity

Status: **implemented; behavior verified**. Key: `scroll-native-target`.

Acceptance: Under transformed parent, document target uses ViewTimeline when supported. Native and forced fallback outputs agree over several target progress positions, forward and reverse.

Upstream scenarios:

- [attaches ViewTimeline (not ScrollTimeline) to inner motion components](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/scroll-view-timeline-transformed-parent.ts#L17)
- [WAAPI and JS paths agree on the same target across the scroll range](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/scroll-view-timeline-transformed-parent.ts#L32)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-133 — Target timeline presets and fallback offsets

Status: **implemented; behavior verified**. Key: `scroll-native-ranges`.

Acceptance: For default, Enter, Exit, Any and All offsets, numeric-pair and named-string equivalents attach correct ViewTimeline entry/exit/cover/contain range when available and render equivalent progress. Nonpreset string/numeric offsets and single-entry offsets take JS fallback without a native timeline; unsupported browser has matching observable output.

Upstream scenarios:

- [Accelerates target with default offset when ViewTimeline supported](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/scroll-view-timeline.ts#L2)
- [Accelerates target with Enter preset offset when ViewTimeline supported](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/scroll-view-timeline.ts#L14)
- [Does NOT accelerate target with string offset](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/scroll-view-timeline.ts#L26)
- [maps undefined (default) to contain](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/render/dom/scroll/utils/__tests__/offset-to-range.test.ts#L4)
- [maps Enter preset to entry range](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/render/dom/scroll/utils/__tests__/offset-to-range.test.ts#L11)
- [maps Exit preset to exit range](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/render/dom/scroll/utils/__tests__/offset-to-range.test.ts#L23)
- [maps Any preset to cover range](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/render/dom/scroll/utils/__tests__/offset-to-range.test.ts#L35)
- [maps All preset to contain range](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/render/dom/scroll/utils/__tests__/offset-to-range.test.ts#L47)
- [returns Enter preset for string offsets](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/render/dom/scroll/utils/__tests__/offset-to-range.test.ts#L59)
- [returns Exit preset for string offsets](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/render/dom/scroll/utils/__tests__/offset-to-range.test.ts#L68)
- [returns Any preset for string offsets](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/render/dom/scroll/utils/__tests__/offset-to-range.test.ts#L77)
- [returns All preset for string offsets](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/render/dom/scroll/utils/__tests__/offset-to-range.test.ts#L86)
- [returns undefined for other string offsets](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/render/dom/scroll/utils/__tests__/offset-to-range.test.ts#L104)
- [returns undefined for non-preset ProgressIntersection arrays](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/render/dom/scroll/utils/__tests__/offset-to-range.test.ts#L110)
- [returns undefined for single-item offset](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/render/dom/scroll/utils/__tests__/offset-to-range.test.ts#L119)

Adaptation: Astra independently implements viewRange mapping, so adapt these formerly internal source cases to observable native timeline/range and fallback output. Do not assert private accelerate presence; Astra retains reactive factory.

### UP-134 — Scroll reads initial position before any event

Status: **implemented; behavior verified**. Key: `scroll-initial-sample`.

Acceptance: Mount at nonzero scroll without dispatching scroll; progress and linked native/JS styles immediately reflect current position.

Upstream scenarios:

- [Fires callback on first frame, before scroll event](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/scroll.ts#L2)
- [Updates animation on first frame, before scroll event](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/scroll.ts#L90)
- [With useAnimateMini, updates animation on first frame, before scroll event](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/scroll.ts#L135)
- [Fires onScroll on creation.](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/render/dom/scroll/__tests__/index.test.ts#L73)
- [Fires onScroll on creation.](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/render/dom/scroll/__tests__/index.test.ts#L509)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-135 — Document scroll axes, resize and growing content

Status: **implemented; behavior verified**. Key: `scroll-document-range`.

Acceptance: Window x/y position and normalized values match document range. Resize/content growth recomputes progress at same scroll offset.

Upstream scenarios:

- [Correctly measures scroll position](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/scroll.ts#L22)
- [Correctly updates window scroll progress callback, x axis](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/scroll.ts#L43)
- [Recalculates window scrollYProgress when content is added below](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/scroll.ts#L333)
- [Fires onScroll on scroll.](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/render/dom/scroll/__tests__/index.test.ts#L89)
- [Fires onScroll on resize.](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/render/dom/scroll/__tests__/index.test.ts#L302)
- [Fires onScroll on scroll.](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/render/dom/scroll/__tests__/index.test.ts#L525)
- [Fires onScroll on resize.](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/render/dom/scroll/__tests__/index.test.ts#L739)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-136 — Scroll-linked paint, transforms and value output

Status: **implemented; behavior verified**. Key: `scroll-linked-value-types`.

Acceptance: At fixed progress verify background/color, opacity, transform and supplied MotionValue agree; reverse scroll restores earlier values.

Upstream scenarios:

- [Correctly updates window scroll progress callback](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/scroll.ts#L101)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-137 — Scroll animation easing agrees across playback paths

Status: **implemented; behavior verified**. Key: `scroll-easing-paths`.

Acceptance: Through createScroll.animate, default linear interpolation and explicit easing produce expected intermediate styles and common endpoints. Compare native container timeline to custom-offset JS fallback using the same easing and normalized progress.

Upstream scenarios:

- [Correctly applies the same easing to both useAnimate and useAnimateMini](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/scroll.ts#L146)

Adaptation: Adapt upstream default/explicit easing comparison to createScroll: Astra defaults to linear. No raw upstream scroll or artificial mini linkage; those are not public Astra contracts.

### UP-138 — Multiple parallax targets keep independent target ranges

Status: **implemented; behavior verified**. Key: `scroll-parallax`.

Acceptance: Different target positions/sizes yield expected aligned viewport positions at one document scroll offset.

Upstream scenarios:

- [correctly applies parallax animations](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/scroll.ts#L239)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-139 — SVG root and graphics element scroll targets

Status: **implemented; behavior verified**. Key: `scroll-svg-target`.

Acceptance: useScroll target accepts svg and rect, preserves their distinct start offsets, and reaches expected endpoint.

Upstream scenarios:

- [tracks SVG elements as target](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/scroll.ts#L259)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-140 — Late target binding never tracks the whole document

Status: **implemented; behavior verified**. Key: `scroll-late-target`.

Acceptance: Target initially unresolved: no unrelated window progress is reported; after binding, target range drives progress; replacing target detaches old range.

Upstream scenarios:

- [Tracks the target element, not the whole window](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/use-scroll-target-late-ref.ts#L2)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-141 — Scroll-linked delay and per-item stagger endpoints

Status: **implemented; behavior verified**. Key: `scroll-delay-stagger`.

Acceptance: Delayed link is between start and midpoint at half scroll, reaches endpoint at bottom. Several per-item delay/stagger values all reach endpoint at bottom and reverse correctly.

Upstream scenarios:

- [delay - animations with delay should be less than halfway when scrolled halfway](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/scroll/scroll.spec.ts#L30)
- [stagger - animations with stagger delay should all be at 100px at bottom](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/tests/scroll/scroll.spec.ts#L74)

Adaptation: Astra createScroll.animate binds one element; express per-item delays through that API rather than importing raw upstream scroll/sequence compiler.

### UP-142 — whileInView re-observes remounted components

Status: **implemented; behavior verified**. Key: `viewport-remount`.

Acceptance: Unmount/remount visible motion nodes; whileInView activates and onViewportEnter fires anew exactly once per new node.

Upstream scenarios:

- [Triggers whileInView after remount (soft navigation)](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/while-in-view-remount.ts#L18)
- [Fires onViewportEnter after remount](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/while-in-view-remount.ts#L54)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-143 — whileInView honors all threshold and root margin

Status: **implemented; behavior verified**. Key: `viewport-threshold-margin`.

Acceptance: Partly visible element with amount=all remains inactive until fully inside. Root margin causes early entry before unexpanded root intersection and invokes correct callback.

Upstream scenarios:

- [Animates only when all an element enters the viewport and amount='all'](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/while-in-view.ts#L38)
- [Respects margin](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/while-in-view.ts#L131)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

### UP-144 — Named hover propagates to descendant variants

Status: **implemented; behavior verified**. Key: `gesture-hover-children`.

Acceptance: Parent named whileHover reaches child rendered opacity, then returns child to its base on leave.

Upstream scenarios:

- [whileHover propagates to children](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/gestures/__tests__/hover.test.tsx#L99)

Adaptation: Adapt through exported Svelte components/hooks; retain source attribution.

## Components Values (35 groups)

### UP-145 — SVG derived styles, path drawing and transform origin render on initial mount

Status: **implemented; behavior verified**. Key: `svg-initial-derived`.

Acceptance: Derived pathLength normalizes pathLength=1 and stroke-dasharray=0.5 1. Derived opacity/fill are correct immediately at mount, not only after animation. Translated path and rotated rect render transformBox fill-box and centered transformOrigin without first-frame jump.

Upstream scenarios:

- [Applies transform, transformBox, and transformOrigin on mount](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/svg-style-on-mount.ts#L14)
- [Applies useTransform-derived pathLength attributes on mount](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/svg-style-on-mount.ts#L31)
- [Applies useTransform-derived opacity on SVG path on mount](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/svg-style-on-mount.ts#L50)
- [Applies useTransform-derived fill on SVG circle on mount](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/svg-style-on-mount.ts#L62)
- [Applies transformBox and transformOrigin on SVG rect with static transform](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/svg-style-on-mount.ts#L73)
- [Correctly measures SVG and renders on mount](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/svg.ts#L135)
- [doesn't add translateZ](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/component-svg.test.tsx#L13)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.

### UP-146 — SVG transforms animate without another animated SVG attribute

Status: **implemented; behavior verified**. Key: `svg-transform-only`.

Acceptance: Transform-only SVG target reaches expected transform and remains correct after subsequent target changes.

Upstream scenarios:

- [Applies transform animation without other SVG attributes animated](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/svg-transform-animation.ts#L2)
- [Measure SVG and renders on mount when encountering new transforms](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/svg.ts#L147)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.

### UP-147 — SVG translation, scale and rotation produce correct element bounds

Status: **implemented; behavior verified**. Key: `svg-transform-geometry`.

Acceptance: Use local fixture-relative bounding boxes to verify translation, scale and rotation around expected origin.

Upstream scenarios:

- [Correctly applies transforms](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/svg.ts#L2)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.

### UP-148 — SVG fill resolves animated CSS-variable targets

Status: **implemented; behavior verified**. Key: `svg-css-variable`.

Acceptance: A changed CSS-variable target reaches expected computed fill and actual SVG paint attribute.

Upstream scenarios:

- [Correctly animates to CSS variables](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/svg.ts#L71)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.

### UP-149 — SVG transform origins combine with transforms and explicit origins

Status: **implemented; behavior verified**. Key: `svg-origins`.

Acceptance: Default transform origin is centered with fill-box; explicit originX/originY override their respective axes. Origin-only targets do not synthesize an unrelated transform; rotation and skew retain expected origin.

Upstream scenarios:

- [Correctly animates origin](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/cypress/integration/svg.ts#L87)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.

### UP-150 — SVG attrX/attrY/attrScale coexist with CSS transforms

Status: **implemented; behavior verified**. Key: `svg-attribute-aliases`.

Acceptance: Render and update attrX/attrY/attrScale without replacing independent CSS translate/scale.

Upstream scenarios:

- [accepts attrX/attrY/attrScale in types](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/component-svg.test.tsx#L25)
- [should return correct styles for element](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/render/svg/__tests__/use-props.test.ts#L6)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.

### UP-151 — SVG attribute animation updates the borrowed value and its derived fill

Status: **implemented; behavior verified**. Key: `svg-derived-attribute-animation`.

Acceptance: Animate r through an attribute MotionValue and observe both r.get() and derived fill reach their expected endpoints.

Upstream scenarios:

- [recognises MotionValues in attributes](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/component-svg.test.tsx#L29)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.

### UP-152 — Root SVG transforms do not receive child-element origin offsets

Status: **implemented; behavior verified**. Key: `svg-root-origin`.

Acceptance: Animating root svg rotation must not inject transform-origin 0px 0px.

Upstream scenarios:

- [doesn't calculate transformOrigin for <svg /> elements](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/component-svg.test.tsx#L72)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.

### UP-153 — SVG animates previously unencountered stroke dash attributes

Status: **implemented; behavior verified**. Key: `svg-new-attributes`.

Acceptance: Keyframe strokeDasharray/strokeDashoffset on a circle under rotating svg reach endpoints without error.

Upstream scenarios:

- [doesn't throw if animating unencounterd value](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/component-svg.test.tsx#L86)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.

### UP-154 — Delayed SVG viewBox animation preserves the authored starting box

Status: **implemented; behavior verified**. Key: `svg-viewbox-delay`.

Acceptance: During delay viewBox remains authored 0 0 100 100; after animation reaches final box.

Upstream scenarios:

- [doesn't read viewBox as '0 0 0 0'](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/component-svg.test.tsx#L103)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.

### UP-155 — SVG group transform MotionValue renders and updates without object serialization

Status: **implemented; behavior verified**. Key: `svg-transform-value`.

Acceptance: g transform MotionValue never serializes [object Object]; initial and updated visual transforms apply.

Upstream scenarios:

- [MotionValue can be used for transform attribute on g element](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/component-svg.test.tsx#L123)

Adaptation: Determine and document Astra SVG attribute versus CSS style transform convention from public API; do not impose unsupported mixed-transform ownership.

### UP-156 — SVG motion-path properties render as CSS styles

Status: **implemented; behavior verified**. Key: `svg-css-motion-path`.

Acceptance: offsetPath, offsetDistance, offsetRotate and offsetAnchor are applied as styles, not misdirected SVG attributes.

Upstream scenarios:

- [should keep offsetDistance as CSS style, not SVG attribute](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/render/svg/__tests__/use-props.test.ts#L82)
- [should keep all CSS motion path properties as styles](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/render/svg/__tests__/use-props.test.ts#L103)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.

### UP-157 — Nested MotionConfig transitions replace or shallow-merge with explicit inheritance

Status: **implemented; behavior verified**. Key: `config-transition-inheritance`.

Acceptance: Nested transition without inherit replaces parent duration/ease/type. inherit:true preserves unspecified outer settings and lets inner keys win across three providers. Verify observable timing/instant-versus-animated behavior using public MotionValues, not context internals.

Upstream scenarios:

- [Nested MotionConfig without inherit fully replaces parent transition](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/MotionConfig/__tests__/MotionConfig.test.tsx#L44)
- [Nested MotionConfig with inherit shallow-merges with parent transition](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/MotionConfig/__tests__/MotionConfig.test.tsx#L61)
- [inherit inner keys win over parent keys](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/MotionConfig/__tests__/MotionConfig.test.tsx#L93)
- [inherit cascades through deeply nested MotionConfigs](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/components/MotionConfig/__tests__/MotionConfig.test.tsx#L112)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.

### UP-158 — Provider per-property transitions apply and local transitions override them

Status: **implemented; behavior verified**. Key: `config-property-transition`.

Acceptance: Provider makes x instantaneous and y animated; local transition reverses which property is instant.

Upstream scenarios:

- [Can define a default transition for an entire tree](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/motion-context.test.tsx#L6)
- [transition is overridden by component prop](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/motion-context.test.tsx#L33)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.

### UP-159 — Updating initial after mount does not reset the current value

Status: **implemented; behavior verified**. Key: `initial-update-stability`.

Acceptance: Mount initial x=100 without animate; changing initial x=200 leaves rendered x=100.

Upstream scenarios:

- [it doesn't respond to updates in `initial`](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/static-prop.test.tsx#L68)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.

### UP-160 — SVG text children update from a MotionValue and replace subscriptions

Status: **implemented; behavior verified**. Key: `svg-motionvalue-text`.

Acceptance: motion.text displays initial value and updated value without wrappers or incorrect namespace; replacing source detaches old text updates.

Upstream scenarios:

- [accepts motion values as children for motion.text inside an svg](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/child-motion-value.test.tsx#L18)
- [updates svg text when motion value changes](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/child-motion-value.test.tsx#L53)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.

### UP-161 — Custom component factory explicitly forwards Motion props when enabled

Status: **implemented; behavior verified**. Key: `factory-motion-props`.

Acceptance: Default wrapper passes custom props and filters animate; forwardMotionProps:true passes animate through to custom component while animation still runs.

Upstream scenarios:

- [forwards MotionProps if forwardMotionProps is defined](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/custom.test.tsx#L59)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.

### UP-162 — Custom SVG factory animates SVG-specific attributes

Status: **implemented; behavior verified**. Key: `factory-svg-viewbox`.

Acceptance: Wrap a custom Svelte svg component with namespace svg and animate viewBox; verify correct namespace and endpoint.

Upstream scenarios:

- [animates SVG-specific attributes like viewBox when type is 'svg'](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/custom.test.tsx#L146)

Adaptation: Astra uses namespace:'svg', not React type:'svg'.

### UP-163 — Native element binding is available to Svelte onMount

Status: **implemented; behavior verified**. Key: `ref-ready-onmount`.

Acceptance: Both ordinary and motion bind:ref point to actual connected elements during onMount.

Upstream scenarios:

- [hydrates a provided ref by the time useLayoutEffect has fired](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/component.test.tsx#L60)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.

### UP-164 — Object initial targets stay on the parent

Status: **implemented; behavior verified**. Key: `object-initial-not-inherited`.

Acceptance: Parent initial object opacity/y affects parent only; a child without inherited variant labels receives neither initial style.

Upstream scenarios:

- [doesnt propagate style for children if passed initial as object](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/component.test.tsx#L240)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.

### UP-165 — Nested size layout animation reverses without a jump

Status: **implemented; behavior verified**. Key: `nested-layout-size-interrupt`.

Acceptance: Resize nested layout=size item during a partially completed long transition; reversal preserves current width before settling at original width.

Upstream scenarios:

- [layout animations interrupt jump](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/component.test.tsx#L312)

Adaptation: Coordinate with layout worker; source assertion is weak so explicitly sample pre/post reversal continuity.

### UP-166 — Initial variant labels resolve custom data and propagate through nested children

Status: **implemented; behavior verified**. Key: `initial-variant-resolution`.

Acceptance: A dynamic initial variant resolves each child custom value independently. Static initial variant labels render expected parent and nested grandchild styles before first animation.

Upstream scenarios:

- [generates style attribute if passed initial as variant label](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/component.test.tsx#L167)
- [generates style attribute if passed initial as variant label is function](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/component.test.tsx#L187)
- [generates style attribute for children if passed initial as variant label](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/component.test.tsx#L209)
- [generates style attribute for nested children if passed initial as variant label](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/component.test.tsx#L221)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.

### UP-167 — Style binding swaps MotionValues and plain values in both directions

Status: **implemented; behavior verified**. Key: `style-value-replacement`.

Acceptance: Swap x/y/z between distinct MotionValues and scalars; current source alone drives rendered transforms. Swap color MotionValue -> scalar -> MotionValue; old sources stop writing and restored source resumes.

Upstream scenarios:

- [should update when passed new MotionValue](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/style-prop.test.tsx#L74)
- [should update when swapping between motion value and static value](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/style-prop.test.tsx#L113)
- [accepts new motion values](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/value/__tests__/use-motion-value.test.tsx#L31)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.

### UP-168 — SSR combines initial targets and borrowed style values with correct precedence

Status: **implemented; behavior verified**. Key: `ssr-initial-value-composition`.

Acceptance: HTML and custom native tag combine initial x with borrowed style y. With initial:false, animate keyframe endpoint overrides competing style x on first SSR render.

Upstream scenarios:

- [correctly renders HTML](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/ssr.test.tsx#L134)
- [correctly renders custom HTML tag](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/ssr.test.tsx#L153)
- [initial correctly overrides style with keyframes and initial={false}](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/ssr.test.tsx#L264)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.

### UP-169 — SVG SSR serializes initial transforms, drawing values and explicit transformBox

Status: **implemented; behavior verified**. Key: `svg-ssr-transforms`.

Acceptance: SSR preserves SVG geometry/path attributes, initial transforms with centered origin, and explicit transformBox:view-box override.

Upstream scenarios:

- [correctly renders SVG](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/ssr.test.tsx#L172)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.

### UP-170 — Tap-enabled component SSR supplies keyboard focusability and preserves explicit tabindex

Status: **implemented; behavior verified**. Key: `ssr-tap-focusability`.

Acceptance: SSR preserves explicit tabindex 2 with onTap/onTapStart/whileTap. Document current absence of auto-generated SSR tabindex; after client mount each tap API becomes keyboard-focusable without replacing explicit tabindex.

Upstream scenarios:

- [sets tabindex='0' if onTap is set](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/ssr.test.tsx#L240)
- [sets tabindex='0' if onTapStart is set](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/ssr.test.tsx#L246)
- [sets tabindex='0' if whileTap is set](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/ssr.test.tsx#L252)
- [doesn't override tabindex](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/ssr.test.tsx#L258)

Adaptation: Confirmed Astra currently assigns generated tabindex during client press attachment (press.ts), not SSR. Preserve and document this boundary: SSR explicit tabindex remains; client mount supplies generated focusability. Do not silently change runtime to force React SSR parity.

### UP-171 — Reorder SSR renders default/custom tags and dragListener policy

Status: **implemented; behavior verified**. Key: `ssr-reorder-elements`.

Acceptance: SSR default Reorder group/item have expected ul/li tags, custom as uses selected tags. dragListener:false does not serialize touch/selection-disabling styles.

Upstream scenarios:

- [Reorder: Renders correct element](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/ssr.test.tsx#L276)
- [Reorder: Doesn't render touch-scroll disabling styles if dragListener === false](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/ssr.test.tsx#L292)
- [Reorder: Renders provided element](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/motion/__tests__/ssr.test.tsx#L308)

Adaptation: Astra Reorder policy may intentionally differ from upstream style serialization; capture supported public behavior and document differences.

### UP-172 — Motion template switches to a replacement MotionValue

Status: **implemented; behavior verified**. Key: `template-source-replacement`.

Acceptance: Pass reactive getter selecting a or b directly into useMotionTemplate; new source updates DOM string, old source no longer changes it.

Upstream scenarios:

- [can be re-pointed to another `MotionValue`](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/value/__tests__/use-motion-template.test.tsx#L52)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.

### UP-173 — Scalar string springs initialize and animate with preserved units

Status: **implemented; behavior verified**. Key: `spring-scalar-units`.

Acceptance: useSpring("0%") starts at 0%, set("100%") emits intermediate unit strings and finishes at 100%.

Upstream scenarios:

- [can create a motion value from a string with a unit](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/value/__tests__/use-spring.test.tsx#L26)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.

### UP-174 — Spring followers emit start and complete events through useMotionValueEvent

Status: **implemented; behavior verified**. Key: `spring-events`.

Acceptance: Changing source starts follower, produces start event once, then completion at endpoint; destroy removes hook callbacks.

Upstream scenarios:

- [triggers animationStart event when spring animation begins](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/value/__tests__/use-spring.test.tsx#L277)
- [triggers animationComplete event when spring animation finishes](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/value/__tests__/use-spring.test.tsx#L303)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.

### UP-175 — Derived transforms render coherent values within one engine frame

Status: **implemented; behavior verified**. Key: `derived-same-frame`.

Acceptance: Mutate one source in frame.read and another in frame.update; postRender DOM reflects latest sum without a stale intermediate frame.

Upstream scenarios:

- [frame scheduling](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/value/__tests__/use-transform.test.tsx#L147)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.

### UP-176 — Derived numeric logical CSS properties keep px units on mount and update

Status: **implemented; behavior verified**. Key: `derived-logical-css`.

Acceptance: paddingBlock/paddingInline/marginBlock/inset/insetBlock/insetInline receive px values from derived MotionValues initially and after source update.

Upstream scenarios:

- [support numeric values with useTransform](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/value/__tests__/use-transform.test.tsx#L212)
- [updates paddingBlock when MotionValue changes](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/value/__tests__/use-transform.test.tsx#L223)
- [supports other CSS logical properties](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/value/__tests__/use-transform.test.tsx#L241)
- [supports inset shorthand with numeric values](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/value/__tests__/use-transform.test.tsx#L261)
- [updates inset when MotionValue changes](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/value/__tests__/use-transform.test.tsx#L272)
- [supports other inset logical properties](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/value/__tests__/use-transform.test.tsx#L290)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.

### UP-177 — Output-map transforms preserve mixed outputs and reactive ranges/options

Status: **implemented; behavior verified**. Key: `derived-output-map`.

Acceptance: DOM reflects exact interpolated color, filter, numeric scale/opacity from a single source. Reactive input range and clamp:false update mapped outputs while returned MotionValue identities remain stable.

Upstream scenarios:

- [works with color values](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/value/__tests__/use-transform.test.tsx#L355)
- [supports transform options](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/value/__tests__/use-transform.test.tsx#L378)
- [responds to input range changes](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/value/__tests__/use-transform.test.tsx#L427)
- [works with mixed types (string and number outputs)](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/value/__tests__/use-transform.test.tsx#L459)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.

### UP-178 — Animation-frame callbacks read current reactive inputs

Status: **implemented; behavior verified**. Key: `frame-live-callback`.

Acceptance: Change callback increment while component remains mounted; subsequent frame outputs use newest increment without duplicate frame loops.

Upstream scenarios:

- [Updates callback](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/utils/__tests__/use-animation-frame.test.tsx#L23)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.

### UP-179 — SSR preserves explicit will-change and does not invent automatic hints

Status: **implemented; behavior verified**. Key: `ssr-will-change`.

Acceptance: Animated initial targets or borrowed MotionValues do not automatically inject will-change in SSR. Explicit string and MotionValue willChange styles serialize to authored value with and without animation.

Upstream scenarios:

- [will-change not applied](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/value/use-will-change/__tests__/will-change.ssr.test.tsx#L6)
- [will-change manually set](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/value/use-will-change/__tests__/will-change.ssr.test.tsx#L46)
- [will-change manually set without animated values](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/value/use-will-change/__tests__/will-change.ssr.test.tsx#L60)
- [will-change not set without animated values](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/value/use-will-change/__tests__/will-change.ssr.test.tsx#L66)
- [Externally defined MotionValues not automatically added to will-change](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/value/use-will-change/__tests__/will-change.ssr.test.tsx#L72)
- [will-change manually set by MotionValue](https://github.com/motiondivision/motion/blob/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343/packages/framer-motion/src/value/use-will-change/__tests__/will-change.ssr.test.tsx#L79)

Adaptation: Adapt to Svelte public components/hooks; assert observable DOM/value behavior.
