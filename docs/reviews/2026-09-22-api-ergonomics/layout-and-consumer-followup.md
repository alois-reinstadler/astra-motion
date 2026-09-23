# Layout investigation and packed-consumer automation

2026-09-23, continuing the complete working state on `agent/astra-ergonomics`, whose HEAD is `ab801d65283e55b4cd34d509960805995cd81b0f`. This is incremental to the [implementation follow-up](implementation.md). Its earlier 96 browser tests are a historical baseline, not tests rerun here.

## Answers

1. **Neither the reported blur nor an abnormal final 1–2 px snap was conclusively reproduced.** In-flight PNGs were inspected, including text and photographs. The intentionally uncorrected control visibly stretches text; this is a different animation and is not evidence that the corrected showcase has the reported defect. These bounded observations do not establish universal sharpness.
2. **A stale starting measurement was observed, but it has not been connected to blur or a final snap.** On initial diagnostic-page loads, the cached surface y was `322.375`, while its visible, untransformed y was `325.375`. Automatic observation used that old y on the first resize. Explicit measurement used the actual y. Warm comparisons agreed. The initiating startup reflow was not captured, so attributing it to fonts would be speculation. Fixed-scrollbar evidence retains the same startup discrepancy, ruling out a scrollbar-width change as its sole explanation.
3. **Changes:** a repeatable layout probe and comparison fixture; six automated packed-consumer cases connected to the existing package qualification runner; native Svelte transition recommendations in the authoring guide, README and site guidance. **No production animation algorithm changed.** Cached snapshots, explicit transactions, scale correction and transform ownership remain intact.
4. **Verified:** 110 server tests; six automated cases in the shared Chrome against a freshly packed production consumer; strict consumer declarations, package provenance, application/guide checks, builds, lint and in-flight manual image inspection. Details below separate these categories.
5. **Unresolved:** the user's intermittent visual issue, the source of the initial 3 px cache discrepancy, temporal rasterization on other devices and the full browser matrix. No blur fix is claimed.

## Versions and source review

| Subject                             | Examined version                                               |
| ----------------------------------- | -------------------------------------------------------------- |
| Astra                               | 0.0.1, existing uncommitted implementation plus this follow-up |
| Motion / motion-dom / framer-motion | 13.2.0                                                         |
| motion-utils                        | 13.0.0                                                         |
| Svelte / SvelteKit                  | 5.57.0 / 2.70.3                                                |
| Vite / TypeScript / Vitest          | 8.2.2 / 6.0.3 / 4.1.11                                         |
| pnpm / Node                         | 11.24.0 / 24.20.0                                              |
| Browser                             | Shared headed Chrome 152.0.7977.82 on Linux                    |
| Viewport / DPR                      | 1440 × 1000 CSS px; DPR 1, 1.25 and 2 through Chrome emulation |

Read `layout.ts`, `observe.ts`, `commit.ts`, `visual.ts`, EditingDesk, ContactSheet, the intrinsic accordion and the installed Motion projection implementation. Automatic observation seeds snapshots from `node.target ?? node.layout.layoutBox`; explicit `updateLayout` calls `willUpdate` before `flushSync(change)`. Mutation/resize observers can trigger a new measurement, but cannot recover an uncached earlier rectangle. The observer filters Motion's own paint/transform writes and coordinates nested participants. The visual owner and commit bridge do not supply a separate universal pre-mutation hook.

Motion's `projection/styles/transform.mjs` divides translation by ancestor scale and emits reciprocal ancestor scale before element scale. `projection/geometry/delta-calc.mjs` normalizes scale within `0.0001` of 1 and translation within `0.01` px of 0. `create-projection-node.mjs` leaves Chrome layout boxes fractional; its user-agent-specific rounding applies to Safari. None of those algorithms or thresholds were changed.

Read both issue bodies and **all later comments** through GitHub's issue API: five comments on [#8547](https://github.com/sveltejs/svelte/issues/8547), including the renderless-tree workaround and its cost discussion; four on [#16648](https://github.com/sveltejs/svelte/issues/16648), including the [maintainer's ordering explanation](https://github.com/sveltejs/svelte/issues/16648#issuecomment-3201964832) and the [later experimental-async caveat](https://github.com/sveltejs/svelte/issues/16648#issuecomment-3270323033). Setup/effect order cannot stand in for current DOM order. A child's pre-effect can run after its parent has mutated the DOM. Current official [$effect documentation](https://svelte.dev/docs/svelte/$effect#%24effect.pre), retrieved through Svelte MCP, explicitly includes this limitation and the async-block ordering caveat. [untrack](https://svelte.dev/docs/svelte/svelte#untrack) changes dependency tracking, not execution order. There is no evidence here supporting a switch to `$effect.pre` snapshots. Experimental async was not enabled or tested.

## Visual and measurement methods

The [fixture](../../../src/lib/motion-lab/LayoutDiagnosticSurface.svelte) uses the same markup, fractional dimensions and 800 ms linear transition for automatic and explicit updates. The [parent page](../../../src/routes/motion-lab/layout-diagnostics/+page.svelte) controls surface size, intrinsic accordion content and an external parent width. Settings remount the fixture; ordinary test actions preserve the elements. One method runs at a time, preventing an explicit transaction in a second group from taking snapshots for the automatic group.

The [probe](../../../src/lib/motion-lab/layout-diagnostics.ts) has two distinct operations:

- `record` observes real RAF frames without seeking or pausing. It saves bounding boxes, CSS and inline transforms, effective ancestor scale products, projection layout/target boxes, old snapshots at `willUpdate`, and `didUpdate` data. Its temporary listener wrapper is restored in `finally`. Environment records include scroll, viewport, client width, font readiness and image decode state. This is an instrumented diagnostic, not a performance benchmark.
- `freeze` pauses and seeks the existing projection controls, then waits two frames before taking a PNG with Chrome MCP. It leaves generated transforms intact; `play` resumes the controls. Paused frames make the actual in-flight raster inspectable, but do not establish temporal smoothness during uninterrupted playback.

The main comparisons cover normal completion, reversal after 14 frames, intrinsic expansion and parent width reflow at all three DPRs: **24 recorded runs**. A further **eight warm runs** retain a scrollbar throughout. The real showcase recordings cover Story → Cover, reversal, inspector-driven reflow, ContactSheet open and reversal at DPR 1. Separate in-flight PNGs cover EditingDesk, ContactSheet and the laboratory's intrinsic accordion. Image decode and `document.fonts.ready` were awaited before recording; this does not prove the cached box was captured after font loading.

Position-only projection, static rendering and disabled child correction are diagnostic controls. Position-only jumps to final dimensions here; static rendering skips projection; disabled correction stretches descendant text. None is proposed as a replacement animation or production fix.

## Results and evidence

Raw frame/event logs are losslessly compressed JSON; read with `gzip -dc <file>`, where `-d` decompresses and `-c` writes to standard output. [Geometry summary](implementation-evidence/followup/layout-summary.json) contains measurements, **not a sharpness score**.

| Comparison                         | Evidence / observation                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Automatic vs explicit at DPR 1     | [Raw runs](implementation-evidence/followup/comparison-dpr1.json.gz); [automatic midpoint](implementation-evidence/followup/fixture-automatic-flight-dpr1.png), [explicit midpoint](implementation-evidence/followup/fixture-explicit-flight-dpr1.png). Both paused surfaces are 767.375 × 535.515625 px. Their corrected text appearance is alike on inspection.                                        |
| Fractional DPR                     | [DPR 1.25 runs](implementation-evidence/followup/comparison-dpr1.25.json.gz), [DPR 2 runs](implementation-evidence/followup/comparison-dpr2.json.gz); [1.25 midpoint](implementation-evidence/followup/fixture-flight-dpr1.25.png), [2 midpoint](implementation-evidence/followup/fixture-flight-dpr2.png). Inspect original PNGs, since an image viewer may rescale them.                               |
| Scale compensation                 | Across the 24 runs, maximum recorded text scale deviation from 1 was below `0.00001`, including newly mounted accordion text. [Disabled-correction image](implementation-evidence/followup/fixture-uncorrected-flight-dpr1.png) visibly stretches text. Correct net scale rules out a large compensation error in these cases; it does not prove raster sharpness.                                       |
| Static / position controls         | [Static image](implementation-evidence/followup/fixture-static-dpr1.png), [position image](implementation-evidence/followup/fixture-position-dpr1.png), [position frame log](implementation-evidence/followup/fixture-position-dpr1.json.gz). These change size-animation behavior and are not equivalent animations.                                                                                    |
| Showcase completion / interruption | [Real frame log](implementation-evidence/followup/showcase-dpr1.json.gz), [EditingDesk in flight](implementation-evidence/followup/desk-flight-dpr1.png), [ContactSheet in flight](implementation-evidence/followup/contact-flight-dpr1.png), [accordion in flight](implementation-evidence/followup/accordion-flight-dpr1.png). No unambiguous transient blur was identified in these inspected frames. |
| Startup cache mismatch             | The first DPR-1 run and [fixed-scrollbar initial run](implementation-evidence/followup/cold-cache-fixed-scrollbar.json.gz) contain an old y 3 px above the pre-click box. This is a starting-pose problem, not a measured final 1–2 px snap. Its source remains undetermined.                                                                                                                            |
| Stable warm comparison             | [Eight fixed-scrollbar warm runs](implementation-evidence/followup/comparison-stable-scrollbar.json.gz): both methods' first old surface boxes match the pre-click boxes, including parent-driven reflow.                                                                                                                                                                                                |
| Independent reflow / interruption  | [External navigation-padding experiment](implementation-evidence/followup/external-reflow.json.gz): a 2 px change above the fixture was observed and animated. Interrupting that motion used its current projected target, rather than the earlier settled box. This experiment does not identify the startup discrepancy's cause.                                                                       |

EditingDesk's spring-driven last transformed surface differs from its settled surface by about **0.0104 px vertically** in the normal run and **0.0121 px** after reversal. ContactSheet's tracked frame/image/title changes at transform removal stay below **0.08 px** in the recorded dimensions. These geometry findings are separate from the PNG observations.

The **linear diagnostic** sometimes moves 1–4 px in its final sampled frame. A 272.25 px width change over 800 ms moves about 5.67 px per 60 Hz frame. Counting that last ordinary interpolation step as a rounding snap would be incorrect. Its endpoints agree across methods; the actual spring showcase does not show a 1–2 px removal step in these recordings.

The initial runs also include scrollbar appearance/removal (`clientWidth` 1440 ↔ 1425). Fixed-width fixture geometry and a fixed-scrollbar rerun separate that from projection. Fonts and photographs were ready during the recorded transitions, but delayed font/image loading, user zoom, viewport resize during motion, GPU differences, Safari/iOS and the user's original intermittent sequence remain unqualified. Fractional transforms can change glyph edge coverage and image sampling even with correct geometry; the captured images do not isolate a browser rasterization defect. No blanket rounding, layer promotion or disabled size animation was introduced.

## Repeatable packed-consumer regressions

[Browser cases](../../../tests/production/consumer/static/ergonomics-regressions.js) are imported by the existing [package qualification runner](../../../scripts/qualify-motion-package.mjs). The same functions were executed through Chrome MCP against the built consumer, without launching another browser. They assert:

1. Inherited opacity and transform in fetched raw SSR HTML and hydrated DOM.
2. Nested target mutation **and replacement** in tag, direct-options and getter bindings, preserving native nodes.
3. Parent-to-DOM and DOM-to-parent text/number/checkbox bindings, numeric-empty handling, event `currentTarget`, one callback per event, native ref cleanup and replacement.
4. Timeline cancellation result/reason and a stopped pose.
5. Replay with a fresh settlement followed by live local reduced-policy completion to the original final target.
6. A real Kit route handoff while an unrelated native exit is paused: source remains connected and non-inert, its shared name clears, the destination receives the outgoing name, no diagnostic fires, and retained nodes later disappear.

The route test initially inspected retention immediately after `ViewTransition.ready`; Svelte had not yet started its deferred outro. The corrected test waits for that event, pauses the actual native animation and asserts retained source/destination identities. This was a test timing correction, not a product fix.

Prepare with `node scripts/prepare-motion-consumer.mjs`. It freshly packs this working tree, installs in an isolated directory, verifies the engine graph, runs Svelte checking and `tsc --noEmit --skipLibCheck false`, builds, and stamps provenance. The strict flags mean check without emitting files and include dependency declarations. Existing negative assertions in `src/native-elements.types.ts` remain active. No aliases or Motion overrides were added.

In an environment permitting Playwright launches, the existing full runner remains:

```sh
node scripts/qualify-motion-package.mjs /path/to/qualification.json http://127.0.0.1:<allocated-port>
```

It uses an already running built consumer and checks its served identity before the browser cases. **That launcher and its multi-browser matrix were not run here.** Under this repository's shared-Chrome restriction, open `/ergonomics` through Chrome MCP, then evaluate:

```js
async () => (await import('/ergonomics-regressions.js')).checkErgonomics();
```

Navigate the same owned tab to `/handoff`, then evaluate `checkHandoff()` from the same module. These are automated assertions with failures and timeouts, not manual observations. Start on a fresh page for each run. The handoff case requires browser View Transition support and fails explicitly if unavailable. Record console/network checks and close the tab afterward.

The final [packed provenance](implementation-evidence/followup/packed-provenance.json) records archive SHA-256 `6003a70b91ff00a396269040c22b7135b07f53b41d2c042a57bf2e90496dd8ad`, **584 installed files compared against the tarball**, served build identity verification, and verification that the served test module equals the repository test source. [Browser results](implementation-evidence/followup/packed-browser-tests.json): **six cases passed**. Consumer paths are temporary evidence, not guaranteed persistent installations.

## Validation boundary

**Automated execution in this follow-up:**

- Repository Svelte check and guide check: zero errors/warnings.
- Server suite: 26 files, **110 tests passed**.
- Qualification-origin tests: **2 passed**; upstream export/version gate passed.
- Fresh packed consumer: no overrides, graph/identity verification, app check, strict dependency declarations, production build and served provenance passed.
- The six new browser cases above passed in shared Chrome; no console errors/warnings or failed network requests were observed for them.
- Site production build, 101 generated-element drift check and strict publint passed. Build output retains the existing large-chunk and Vite-only `import.meta.env` packaging advisories; it was not warning-free.
- Full repository `pnpm lint` (Prettier and ESLint) passed; new Svelte files and changed consumer fixtures passed Svelte MCP autofixer without issues or suggestions. Diff whitespace check passed.

**Manual/browser diagnostic work:** inspected the PNGs above; captured geometry/transforms and controlled reflow/interruption; loaded the built documentation and verified the native-transition recommendation and presence distinctions. Console checks were clear. Owned pages were closed and both diagnostic previews were stopped.

**Not executed:** the earlier 96-test browser-unit selection, the full Playwright Chromium/Firefox/WebKit package/site matrix, physical devices, IME/autofill, experimental async, or a production-browser performance qualification. Paused image inspection and DPR emulation are not substitutes for those checks.

## Files changed by this continuation

The pre-existing working tree was retained. Relative to that starting state, this continuation changes only:

- `README.md`, `docs/authoring.md`, `src/lib/site/docs.ts`: authoring decision guidance and the three presence entry points.
- `scripts/qualify-motion-package.mjs`, `tests/production/consumer/static/ergonomics-regressions.js`: shared automated assertions and qualification integration.
- `tests/production/consumer/src/routes/ergonomics/+page.svelte`, `tests/production/consumer/src/routes/handoff/+page.svelte`: focused test controls/markers.
- `src/lib/motion-lab/LayoutDiagnosticSurface.svelte`, `src/lib/motion-lab/layout-diagnostics.ts`, `src/routes/motion-lab/layout-diagnostics/+page.svelte`: comparison fixture and measurement probe; these are not public package exports.
- This report, the link in `implementation.md`, and `implementation-evidence/followup/`.

No engine files, dependencies or lockfiles were changed by this continuation. No commits, publication or merge were performed.
