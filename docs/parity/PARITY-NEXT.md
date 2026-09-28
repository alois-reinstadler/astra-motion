# Activity, View contracts and difficult layout geometry

Follow-up to the independent ef77bf8 audit, starting from `b899bcb`,
2026-09-28 UTC. Motion/framer-motion/motion-dom remain pinned at 13.4.4,
motion-utils at 13.3.0, Svelte at 5.57.0 and Kit at 2.70.3. No dependency,
qualification matrix, existing assertion or tolerance was weakened.

## Activity design before verification

The public Svelte lifecycle, effect, context, snippet and boundary APIs were
reviewed before assigning the independent verification worker. Retaining a mounted
subtree is compatible with ordinary component composition:

```svelte
<AnimateActivity mode={visible ? 'visible' : 'hidden'} layoutMode="pop">
	<Tab />
</AnimateActivity>
```

`Tab` can render ordinary motion descendants or wrap them in plain HTML. It needs
no presence registration. Astra waits for descendant exits and staggered variants,
then hides the retained host and suspends its owned work. `useActivityEffect`
provides cleanup/restart for application-owned subscriptions and timers. Svelte's
public APIs do not offer transparent suspension of arbitrary mounted effects;
using private renderer internals or remounting the subtree would violate the
supported contract or retention. This is an explicit framework adaptation, not
React scheduler, hydration or arbitrary-effect lifecycle equivalence.

The [upstream Activity article](https://motion.dev/docs/react-animate-activity)
places `delayChildren` directly on a variant. The pinned
`motion-dom/dist/es/animation/interfaces/visual-element-variant.mjs` reads it from
`transition`. The canonical child example and independent regression use
`hidden: { transition: { delayChildren: stagger(0.1) } }`. The child-component
usage, state retention, sequencing and pop behavior remain the requested surface.
The private Motion+ alpha implementation is still unavailable for source comparison.

## Reproductions and corrections

| Finding                                                              | Reproduction                                                                                                                                                                                                                | Resolution and decisive evidence                                                                                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P2: nested retained boundaries bypass exits                          | Hiding an Activity containing another Activity immediately hides the outer host. Managed Presence removal also leaves the inner Activity visible until destruction.                                                         | Each Activity holds a parent-presence registration and combines parent presence with its own requested mode. It acknowledges the parent only after its descendants finish; locally hidden children stay hidden on reveal. Independent nested and Presence/Activity/View tests fail before and pass after `4b7d544`.                         |
| P2: nested pop restores a dead owner                                 | Reverse two nested pop boundaries sharing one root. Layout/focus restore but a stale `data-astra-presence-pop` remains.                                                                                                     | Live per-element owners replace captured previous IDs; either disposal order releases only live ownership. Padded plain roots and display:contents boundaries are discovered automatically. The independent reversal regression passes after `a18f722`.                                                                                     |
| P2: View declarations accept unsupported runtime definitions         | The broad Motion target type accepts `x`, SVG drawing attributes and `transitionEnd`; the native snapshot path ignores aliases or rejects the final-style target. String spring names also disagree with the generator API. | Export `ViewAnimationTarget`, `ViewValueTransition`, and `ViewTransition` from root and isolated View entries. Source and installed-consumer positive/negative assertions preserve ordinary Motion target capabilities while enforcing CSS-only snapshot definitions and generator timing. JavaScript callers receive explicit diagnostics. |
| P2: native geometry layers ignore repeat/autoplay timing             | Custom layers use NativeAnimation but existing group layers only receive duration, delay and easing.                                                                                                                        | Apply repeat/reverse and paused autoplay to group layers too; reduced motion overrides perpetual/paused work. Native CSS keyframes, timing and controls have direct browser assertions.                                                                                                                                                     |
| P2: 3D layout starts at the wrong pose                               | Resize/move a child under rotateY/rotateX, with and without perspective. The old x pose jumps by 37.3264px and 45.2659px at animation time zero.                                                                            | Normalize the layout plane during measurement, retain the full authored 4x4 transform, and counter-scale it around all three transform-origin coordinates. Tests cover start, reversal, nested individual transforms, CSS perspective and registered parent/child resize. Existing 1.5px bounds are unchanged.                              |
| P2: perspective pointer correction returns uncorrected page movement | Two rendered points 90 local pixels apart map to only 46.6049 page pixels in the original implementation.                                                                                                                   | Compose ancestor matrices and perspective, then invert the projected z=0 plane as a homography. Both flat and preserve-3d ancestor cases recover 90px/60px local movement to the original 0.05px bound. Existing 2D and SVG cases remain.                                                                                                   |

The final independent geometry probe caught two further compositions before the
release gates. A wrapper with both a 3D transform and CSS perspective retained its
measurement-time `perspective:none` while a registered parent resized (12.142px
midpoint width error). Opacity, overflow and filter grouping also forced a flat
used plane despite computed `transform-style:preserve-3d` (16.069px pointer error).
`c7e1450` restores perspective during rendering and accounts for CSS grouping
flattening. All four exact Chromium regressions pass without changing bounds;
the independent report records their complete engine qualification.

## Focused evidence and qualification

The [independent report](NEXT-FOCUSED-VERIFICATION.md) records nine new cases in
Chromium, Firefox and WebKit, including actual enforced CSP with a rejected
unauthorized stylesheet, ordinary Tab state/DOM retention, stagger timing, nested
pop/reversal/focus, Presence/Activity/named View composition and a live policy
change during gated native capture. Dedicated View tests require native API
support and cannot pass through fallback.

The initial affected geometry/pointer/View matrix passed **123/123 executions**
(41 cases in each engine). After the native repeat/autoplay change, its affected
View cases are requalified separately. Exact final source/package gates, archive
provenance and remote delivery evidence are recorded with the qualified candidate;
a focused pass alone is not a release qualification.

Local WebKit uses task-isolated launcher wrappers with the existing extracted
GTK/GStreamer libraries and Mesa EGL manifest. The dependency-catalogue preflight
cannot see that injected stack and is bypassed locally; the actual browser and all
assertions run. CI installs and validates its own dependencies. No shared browser
launcher or system package was changed.

Raw logs are retained under `/workspace/astra-motion-parity-next-evidence/`.
The independent report names the initial scratch logs. Final gates run once per
candidate; the unchanged remote workflow runs all source, E2E and installed-package
cases across Chromium, Firefox and WebKit.

## Exact remaining limits

- Ordinary Svelte effects and third-party resources require `useActivityEffect`
  or explicit active-state handling. React hidden rendering priority, selective
  hydration and private Motion+ alpha internals are not claimed.
- Geometry qualification covers static transformed planes, nested perspective,
  reversal and parent scale correction. Changing camera/orientation during layout,
  edge-on or singular planes and arbitrary 3D scene interpolation remain unqualified.
  SVG viewBox correction retains its affine screen-matrix contract.
- View targets operate on CSS snapshots. Persistent final styles belong in the
  state transaction. JavaScript animation callbacks/paths, repeatDelay and mirror
  repetition are not native snapshot capabilities; typed definitions reject them.
- Desktop engine coverage is not touch hardware or mobile-device coverage. Existing
  Chromium touch emulation and the two explicit non-Chromium skips remain unchanged.
- The earlier audit's one-dimensional Reorder limitation was incorrect. The pinned
  implementation and Astra support x/y/xy detection, wrapped rows and RTL in xy;
  that historical claim is corrected without changing the runtime or its scope.
