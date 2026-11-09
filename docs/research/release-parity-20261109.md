# Astra Motion parity and release decision

Assessment: 2026-11-09. Candidate baseline: `e7e9799` (local main), not the older detached checkout `2acb6b2`. Recommendation: prepare the PR, retain Motion 14.5.0 for qualification, and let Alois decide whether the maintenance burden justifies release. Do not claim complete current Motion parity or a bundle-size advantage.

## Feature and authoring matrix

“Documented” means the upstream offers the surface, not that we executed its tests. Astra evidence is its source, README, `docs/parity/MATRIX.md`, and the Motion 14.5 upgrade report. September parity records are older than the selected engine.

| Capability                   | Astra candidate                                                                               | Official Motion JS / React / Vue                                                               | Svelte built-ins                                                        | Other Svelte libraries                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Animation / springs / values | Shared Motion engine; component props and managed reactive getters                            | JS imperative APIs; React/Vue declarative wrappers                                             | Spring/Tween and transition directives                                  | Humanspeak and motion-sv document Motion-style components                          |
| Gestures / drag / scroll     | Integrated gestures, drag controls, scroll helpers                                            | JS APIs now directly usable in Svelte attachments; React/Vue wrappers                          | Application composition needed for higher-level gestures                | Humanspeak documents hover, press, drag, viewport and scroll                       |
| Layout / shared layout       | Upstream projection adapter, LayoutGroup; internal integration risks                          | Current JS docs expose layout/view animation; React/Vue have layout APIs                       | `animate:flip` for keyed list changes; not equivalent shared projection | Humanspeak documents FLIP/shared layout; motion-sv is a separate port              |
| Presence / exits             | `present`, keyed items/value and snippets; explicit retention                                 | AnimatePresence in React/Vue; imperative JS requires lifecycle composition                     | Native in/out transitions cover simpler cases                           | Humanspeak offers AnimatePresence; no claim of identical interrupted-exit behavior |
| Svelte ownership             | Cleanup, retained Activity owners, managed values; ordinary application effects remain active | JS attachment cleanup is available; no official Svelte `motion.*` component package identified | Compiler-owned reactivity/transitions                                   | Competing Svelte wrappers already cover much of this value                         |
| Route snapshots              | Separate Kit adapter, browser fallback                                                        | JS view animations and framework integrations                                                  | Compose navigation and browser APIs                                     | Not exhaustively compared; absence not asserted                                    |
| Text / tilt / Activity       | Local text and tilt contracts; Activity is an explicit Svelte adaptation                      | Motion UI / Motion+ surfaces have their own distribution and licensing                         | Compose primitives                                                      | No broad parity claim against paid or alpha APIs                                   |
| Small entry points           | mini, m/lazy, feature subpaths                                                                | JS mini/hybrid, React LazyMotion                                                               | Native primitives avoid another package                                 | Needs identical-fixture measurement for each alternative                           |

API ergonomics: Astra lets applications keep native markup through `motion.bind` or use typed `motion.*` elements. Native bindings and attachment-forwarding requirements are explicit. Presence snippets cannot be treated like React child arrays. The benefit is coordinated ownership and a consistent Svelte interface, not mechanical source compatibility. For a few effects, official Motion attachments or Svelte's built-ins have less adapter maintenance. A substantial Motion-style component application should evaluate Astra against Humanspeak rather than assuming an empty ecosystem.

## Versions and upgrade evaluation

- Platform catalog inspected at `ar2k-platform/pnpm-workspace.yaml`: `motion: 14.0.0`.
- Astra selected main: Motion / Motion DOM / Framer Motion **14.5.0**, Motion Utils **14.1.1**, with a single DOM engine bundled into the distributable. The detached main checkout still has 13.4.4 and is not the candidate.
- Registry snapshot: Motion **14.10.1**, motion-v **2.11.1**, `@humanspeak/svelte-motion` **2.9.1** (Motion 14.9.1 dependencies), `motion-sv` **0.2.2** (14.1.0 engine dependencies), legacy `svelte-motion` **0.12.2**. `motion-svelte` is a different name; do not conflate it with `motion-sv`.
- Thus “upgrade to Motion 14” is already implemented on the selected branch. An exact downgrade to 14.0.0 would discard the existing 14.5 compatibility qualification. Upgrading further to 14.10.1 is a separate adapter requalification, not metadata cleanup.
- Existing 14.5 changes address removed base-target methods, path hooks, native scroll ranges, compositor delays and timing oracles. The historical report explicitly retains immediate paused-seek and Firefox pending-time caveats. It is not fresh exact-commit browser certification.

## Bundle size

Do not compare npm unpacked size, gzip transfer size, whole-app fixture size and a library-only microbenchmark as if they measured the same thing.

The committed 2026-10-21 Motion 14.5 measurement (`docs/research/bundle-sizes.json`) uses minified Rolldown ESM, all exports of each feature retained, Svelte/Kit external. Historical gzip bytes: presence **1,228**, values **9,393**, animate **29,330**, layout **39,526**, state **56,032**, full **109,589**. These entries overlap and must not be summed. `presenceFromRoot` matches presence, evidence that unused projection tree-shakes under that fixture. Full contains no React runtime in that report.

The September packed-consumer report instead includes the Svelte runtime and application bootstrap and uses Motion 13; it cannot certify today's 14.5 candidate. A fresh 2026-11-09 run of `node scripts/measure-motion-bundles.mjs` reproduced these exact gzip byte counts on the selected 14.5 candidate; only the timestamp changed. The final report records the remaining gates.

Official Motion's bundle guide advertises mini/hybrid `useAnimate` at roughly 2.3/17 kB and lazy React loading around 5 kB. Those are narrower APIs and different accounting, not proof Astra is slower or heavier for identical behavior. Registry unpacked package sizes for Humanspeak 2.9.1 (1,630,831 bytes) and motion-sv 0.2.2 (290,116 bytes) exclude transitive engine cost and are not browser bundles. A matched-feature production consumer comparison remains needed before a comparative size claim. Prefer narrow Astra entries if selected; do not advertise the all-exports figure as a typical application's cost.

## Release recommendation and blockers

Prepare the existing feature work as a reviewable PR. Keep the selected engine and retain MIT plus bundled upstream notices. Require passing local gates, exact archive/consumer/browser evidence, a selected docs origin, and explicit owner approval after this assessment. Physical Safari/device performance and high participant counts are separate limitations. No new parity implementation, engine replacement or version chase is justified solely by this release-preparation brief.

## Sources

- [Official Motion Svelte integration](https://motion.dev/docs/svelte)
- [Official Motion packages and platforms](https://motion.dev/docs)
- [Official bundle guidance](https://motion.dev/docs/react-reduce-bundle-size)
- [Svelte motion primitives](https://svelte.dev/docs/svelte/svelte-motion)
- [Humanspeak Svelte Motion](https://github.com/humanspeak/svelte-motion)
- [motion-sv source](https://github.com/hanielu/motion-svelte)
- [Legacy svelte-motion](https://github.com/micha-lmxt/svelte-motion)
- Live registry responses: `network-evidence.json`, `motion-alternatives.json` in this job directory.
