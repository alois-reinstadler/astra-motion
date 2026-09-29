# Remaining Motion API review — 2026-09-29

Baseline: `c2f1795`, isolated worktree `/workspace/wt/astra-rc-apis`. No original-working-tree sources changed. Sources inspected before implementation: upstream checkout `/tmp/astra-upstream-tests-13.4.4`, tag `v13.4.4`, commit `33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343`; installed `motion-dom` and `framer-motion` 13.4.4 source/export declarations; current official documentation.

## Classification and decisions

| API                     | Evidence                                                                                                                                                                                                                                                                                                                                     | Decision                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useWillChange`         | Public React entry export; `value/use-will-change/index.ts`, `WillChangeMotionValue.ts`, SSR and runtime tests                                                                                                                                                                                                                               | Implement a component-owned Svelte setup helper. Preserve pinned behavior: `auto` until an eligible transform/accelerated target is added, then `transform` for its lifetime. No invented removal/reference-count contract.                                                                                                                                                                       |
| `useFollowValue`        | Public React entry export, `value/use-follow-value.ts` and its tests; public `motion-dom` `attachFollow` and `FollowValueOptions`; official changelog                                                                                                                                                                                        | Implement over the existing managed spring follower lifecycle. `useSpring` delegates to the same implementation with spring defaults; no parallel lifecycle implementation.                                                                                                                                                                                                                       |
| `MotionConfig.isStatic` | `context/MotionConfigContext.tsx` explicitly labels this an internal Framer canvas option. `motion/index.tsx` omits dynamic visual elements/features; `motion/__tests__/static-prop.test.tsx` verifies fresh initial/style rendering and no animation. `MotionConfig/index.tsx` freezes it at initialization because of React hook ordering. | Do **not** add this internal canvas mode to Astra's public configuration. This is an intentional limitation, not a completed API. For an unanimated final pose, use `initial={false}` with `transition={{ duration: 0 }}`; for retained hidden work use Activity. Neither reproduces canvas static rendering. A future design-canvas requirement needs a separate proposal and renderer contract. |
| `animateView`           | Public `motion-dom` export and official JavaScript guide; pinned `view/index.ts`, `view/start.ts`, `view/queue.ts`, view tests                                                                                                                                                                                                               | Implement the full fluent method surface through Astra's existing document transaction owner. Do not re-export upstream `animateView`, which would introduce a second scheduler that cannot coordinate Astra boundaries/navigation.                                                                                                                                                               |

Official references: [View animations](https://motion.dev/docs/animate-view), [MotionConfig](https://motion.dev/docs/react-motion-config), [Motion changelog](https://motion.dev/changelog?lib=motion&type=minor). Pinned source: [MotionConfig context](https://github.com/motiondivision/motion/blob/v13.4.4/packages/framer-motion/src/context/MotionConfigContext.tsx), [follow helper](https://github.com/motiondivision/motion/blob/v13.4.4/packages/framer-motion/src/value/use-follow-value.ts), [will-change helper](https://github.com/motiondivision/motion/blob/v13.4.4/packages/framer-motion/src/value/use-will-change/WillChangeMotionValue.ts), [fluent builder](https://github.com/motiondivision/motion/blob/v13.4.4/packages/motion-dom/src/view/index.ts).

Source classification and executed checks are separate: source inspection establishes the pinned contract; the focused checks listed below establish only Astra's exercised implementation behavior.

## Setup helper contracts

`useFollowValue(source, options?)` accepts a number, numerical unit string, borrowed MotionValue, or getter returning any of those. The options also accept a getter. It returns one stable owned MotionValue. `.set()` animates toward the latest target; `.jump()` sets immediately; `.stop()` holds position. Transition durations are seconds at the public boundary and converted once to the follower engine's milliseconds. The pinned `FollowValueOptions` exclude repeats and animation lifecycle callbacks; MotionValue events remain the output event interface. Springs, tweens, and inertia use the same engine primitive.

A getter is required to replace a primitive input or borrowed source reactively. Options changes reconfigure the follower while retaining its latest target. Activity suspension detaches the owned clock and borrowed subscriptions without destroying the source, retains direct `.set()` intent, and reconnects to the latest source on reactivation. Destroying the owner destroys only the follower. SSR creates the initial value without an animation clock. Numerical helpers do not infer which CSS property will consume a value; as with the existing spring helper, authors choose reduced-motion behavior where the value is applied or through reactive settings.

`useWillChange()` returns a component-owned `WillChange` MotionValue, initially `auto`. Pass it directly in an animated style object, such as `style={{ willChange }}`. The engine calls `.add()` for eligible animated targets; `.add('x')` may prewarm the hint. A hint is not a guaranteed performance improvement, and it is not a request to move arbitrary layout work to a GPU.

## Fluent builder contract

```ts
const builder = animateView(
	() => {
		expanded = true;
	},
	{ duration: 0.3 }
)
	.add('.card', '.detail')
	.class('detail-morph')
	.crop(true)
	.group(false)
	.layout({ duration: 0.4 })
	.old({ opacity: [1, 0] })
	.new({ opacity: [0, 1] });
const controls = await builder;
await controls.finished;
```

- Build the chain synchronously. The implicit first subject is `root`; `.add(selector | Element, optionalDestination)` selects a new subject and enables geometry animation. Selectors are resolved before and after the update; paired targets match by order, and additional destinations enter independently.
- `.enter()` and `.exit()` apply only to one-sided snapshots. `.new()` and `.old()` apply whenever that side exists, including survivors; direct-side values override presence-gated values. A scalar entering value mirrors an explicit exit value where present. Opacity otherwise uses fade defaults.
- `.layout()` overrides geometry timing. Each animation method accepts local timing, including stagger delays per target. `.crop()` controls clipping and corner interpolation; default clipping applies to aspect-ratio-changing morphs. `.group()` controls native snapshot nesting, with flat browser fallback. `.class()` sets the snapshot class used by CSS pseudo-element rules.
- `await builder` resolves when playback controls are available; repeated awaits return the same controls. `controls.finished` resolves when owned animations complete or are stopped/cancelled. Controls support pause/play, time/speed, complete, stop and cancel. Unlike upstream's documented controls subset, Astra retains the existing engine control shape with cancellation settlement. `builder.finished` is an additive document outcome channel (`finished`, `skipped`, `unsupported`). `builder.cancel()` skips capture while preserving the application update exactly once. Errors from application updates and invalid capture targets reject observers.
- `interrupt: 'wait'` is default FIFO behavior. `interrupt: 'immediate'` releases an active capture through the existing coordinator. Declarative `startViewTransition` requests retain their existing coalescing behavior; fluent transactions are exclusive queue entries. Both use the same WeakMap document owner, resource wait, Svelte settlement, page-hide release and cleanup.
- This imperative API accepts ordinary invocation-time options without reactive getter subscriptions and does not read component context. The default reduced-motion policy is `user`; a reduced-motion skip and unsupported browser still apply the update once and return safe empty controls. SSR also uses this path. An initiating component's disappearance does not cancel a document-wide animation; explicit cancellation remains with the caller. Activity does not implicitly own imperative transactions.
- Authored names/classes/groups and priorities are restored, including paired sources that remain connected. A fluent target cannot also belong to `AnimateView`; the actionable error directs the caller to animate the boundary using `startViewTransition` or remove the boundary. Other registered boundaries still participate in the same transaction.
- Pseudo-elements animate native CSS properties. Browser support controls nested groups, custom-property interpolation and view-transition availability. No physical-device or compositor-speed claims are made.

## Files and integration

Modified: `src/lib/motion/value-hooks.svelte.ts`, `src/lib/motion/view-transitions.ts`, `src/lib/motion/view-registry.ts`, `src/lib/motion/view-animation.ts`.

Added: `src/lib/motion/will-change.svelte.ts`, `src/lib/motion/animate-view.ts`, `src/lib/motion-lab/remaining-apis-harness.svelte`, `src/lib/motion-lab/remaining-apis.spec.ts`, `src/lib/motion-lab/remaining-apis.svelte.spec.ts`, this report.

Parent owns public entry integration. Desired root/values exports: `useFollowValue`, `FollowValueOptions`, `useWillChange`, `WillChangeMotionValue`. Desired root/view exports: `animateView`, `AnimateViewBuilder`, `AnimateViewOptions`, `AnimateViewTarget`. No dependency or lockfile changes. Internal participant/coordinator functions and `ViewAnimationGroup` are module internals, not entry exports.

## Verification

Executed against the final worker source, without entrypoint integration:

| Check                                                                                             | Result                   | Evidence                            |
| ------------------------------------------------------------------------------------------------- | ------------------------ | ----------------------------------- |
| Focused Chromium suite (`remaining-apis`, existing `parity-values`, existing `parity-view`)       | 34/34 passed             | `/tmp/astra-apis-final-browser.log` |
| Focused server suite (`remaining-apis`, existing `parity-view`, existing `view-animation-polish`) | 15/15 passed             | `/tmp/astra-apis-server.log`        |
| `pnpm check`                                                                                      | 0 errors, 0 warnings     | `/tmp/astra-apis-final-check.log`   |
| ESLint for all changed source/spec files                                                          | Passed                   | `/tmp/astra-apis-final-eslint.log`  |
| Svelte MCP autofixer on modified helper, new will-change helper and Svelte fixture                | No issues or suggestions | Tool results in worker conversation |
| `git diff --check`                                                                                | Passed                   | Worker command result               |

The initial focused browser run found an undefined per-layer timing fallback; repaired and the full focused suite rerun successfully. Additional final coverage verifies paired sources remaining connected, restoration of authored `!important` names, reduced-motion fallback, stable empty playback controls, Activity suspension and source ownership.

The three-browser attempt failed to launch WebKit because system libraries were unavailable in the default environment (`/tmp/astra-apis-matrix.log`). Parent subsequently supplied the established dependency wrapper and will run the complete matrix on the integrated candidate; no cross-browser success is claimed here. The managed headed preview attempt was blocked by `No free preview ports; review stale allocations`. No existing allocation was stopped. Parent will perform final-candidate headed checks, package and full-suite qualification after integration. No physical-device checks were performed.
