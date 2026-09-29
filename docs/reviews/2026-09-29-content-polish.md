# Public content polish review

Date: 29 September 2026. Final independent editorial pass after the library polish and initial documentation update. Scope: all 34 canonical documentation pages, five marketing journeys, all 44 registered live-example detail pages, README, seven top-level Markdown guides, shared navigation/footer/article/SEO templates. Developer labs and dated research/parity evidence were treated as supporting material.

## Outcome and concrete corrections

Keep the existing information architecture. Every canonical documentation page answers a distinct technique, integration or API question; none warranted a new merge. Preserve all routes, public identifiers, aliases and complete code samples. Refocus ambiguous copy and category assignments instead of removing useful compatibility examples.

- Correct the motion reference’s unsupported `bind:group` claim using the generated input component and the existing migration/authoring contract.
- Align status and architecture with the existing static 3D/perspective ancestor contract and its excluded animated-camera/edge-on/general-scene cases. The large-grid result applies even at normal CPU speed; status now links directly to the measured workload.
- Remove a release implication from the bundle guide’s commit label and avoid presenting old benchmarks as a fresh measurement of this pass.
- Distinguish the dated upstream AnimateActivity alpha from AnimateView’s public separate entry. Remove unexplained “approved adaptation” wording while preserving the actual Svelte lifecycle differences.
- Describe the homepage’s reduced motion as configurable: the primary API defaults to `never`, so a blanket promise was too broad.
- Name the compatibility helpers used by larger examples. Give motion-value examples their own category; place scoped useAnimate with timelines and the local AnimateView example under View Transitions.
- Give the examples search field a stable name for browser identification.
- Send status troubleshooting and showcase guide links to canonical pages and correct anchors. A link to the scroll guide no longer promises multiple sequence guides.
- Clarify authoring/architecture audiences, both Kit-only entries, packed versus published archives, current versus historical scope links, and the existing unindexed GitHub Pages configuration.

## Canonical documentation dispositions

“Keep” means the page’s current purpose is justified, not that every future improvement is exhausted. Refocus identifies changes made in this pass. All documentation routes below retain their sections and incoming aliases.

| Route                          | Decision | Purpose and reason                                                                                                                                                                            |
| ------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/docs/animations`             | Keep     | New users need targets, variants, priority and interruption before looking up individual props. Its overview role differs from the motion API table.                                          |
| `/docs/layout`                 | Keep     | Builders need CSS-driven geometry, shared identity, scale correction and measurement tradeoffs together. LayoutGroup remains the narrower coordination reference.                             |
| `/docs/scroll`                 | Keep     | Choose triggered versus linked motion here; useScroll owns exact offsets and return values. Combining them would obscure the initial technique choice.                                        |
| `/docs/svg`                    | Keep     | Attribute channels, SVG coordinate correction, namespaces and path compatibility are a distinct rendering task.                                                                               |
| `/docs/transitions`            | Keep     | One timing vocabulary is reusable across components, gestures and sequences; references link here instead of reproducing all defaults.                                                        |
| `/docs/gestures`               | Keep     | Interaction authors need priority, native semantics and callback timing across hover/press/focus/drag. Detailed drag and hover remain separate tasks.                                         |
| `/docs/drag`                   | Keep     | Constraints, inertia, cancellation and corrected coordinates justify a focused reference beyond the gesture overview.                                                                         |
| `/docs/hover`                  | Keep     | Touch filtering, inherited variants and the standalone recognizer are useful distinctions from the general gestures guide.                                                                    |
| `/docs/motion`                 | Refocus  | Keep the canonical element API. Correct the false bind:group claim: native inputs with createMotion own that Svelte directive; generated tags expose their listed value bindings.             |
| `/docs/animate-activity`       | Refocus  | Retaining hidden state is different from removing exiting DOM. Keep its explicit effect-lifecycle adaptation; remove unexplained internal approval language.                                  |
| `/docs/animate-presence`       | Keep     | Removal retention, keyed sequencing and manual completion deserve their own lifecycle contract; Activity cannot replace them.                                                                 |
| `/docs/animate-view`           | Keep     | Browser snapshots and explicit state transactions differ from continuous layout projection. Keep native CSS target restrictions and optional Kit integration explicit.                        |
| `/docs/layout-group`           | Keep     | Component authors need namespacing and coordination inheritance independently of the broader layout tutorial.                                                                                 |
| `/docs/lazy-motion`            | Keep     | Feature loading, strict diagnostics and recovery form an API contract; the bundle guide handles deciding and measuring.                                                                       |
| `/docs/motion-config`          | Keep     | Inherited transition, policy, coordinates and CSP defaults belong in a provider reference, separate from accessibility design advice.                                                         |
| `/docs/reorder`                | Keep     | Controlled identity, measurement, wrapped grids, scroll and keyboard alternatives make sorting a complete task rather than a drag footnote.                                                   |
| `/docs/motion-values`          | Refocus  | Retain the ownership/composition entry point and clarify sentence-case conceptual title. Individual use* pages are lookup references rather than duplicates.                                  |
| `/docs/use-motion-template`    | Keep     | Tagged CSS string composition and reactive literal inputs are distinct from numeric range mapping.                                                                                            |
| `/docs/use-motion-value-event` | Keep     | Managed event subscriptions, cancellation semantics and replaceable sources need a callable reference.                                                                                        |
| `/docs/use-scroll`             | Keep     | Offsets, container/target geometry and stable return values are exact API concerns beyond choosing a scroll technique.                                                                        |
| `/docs/use-spring`             | Keep     | Owned/following values, units, retargeting and initial jumps differ from component transition tuning.                                                                                         |
| `/docs/use-time`               | Keep     | A continuously elapsed value differs from an enabled frame callback and a clock accumulated only while running.                                                                               |
| `/docs/use-transform`          | Keep     | Computed dependencies, range mappings, output maps and acceleration constraints justify their own derivation reference.                                                                       |
| `/docs/use-velocity`           | Keep     | Direction, magnitude and acceleration require units and continuity rules beyond reading a source value.                                                                                       |
| `/docs/use-animate`            | Keep     | Scope, mixed subjects, sequences, playback and mini differences make this the canonical imperative workflow.                                                                                  |
| `/docs/use-animation-frame`    | Keep     | User-owned frame work needs enablement, delta/elapsed distinctions and cleanup; useTime does not expose this scheduling control.                                                              |
| `/docs/use-drag-controls`      | Keep     | An external handle and start/stop/cancel methods are a separate integration task from direct draggable-element options.                                                                       |
| `/docs/use-in-view`            | Keep     | Reactive element intersection is useful to application logic even without a motion element; it differs from document visibility.                                                              |
| `/docs/use-page-in-view`       | Keep     | Background-tab work needs Page Visibility semantics rather than scroll intersection. The API name alone is ambiguous, so retain the clear opening explanation.                                |
| `/docs/use-reduced-motion`     | Keep     | Reading the device preference differs from configuring policy; media and manual values need an application decision.                                                                          |
| `/docs/getting-started`        | Keep     | Install the local beta, satisfy peers and build one notification. Keep migration/troubleshooting sections as short entry points with topic links.                                             |
| `/docs/accessibility`          | Keep     | Semantics, focus, keyboard alternatives and pause controls cross API boundaries and deserve one task-oriented guide.                                                                          |
| `/docs/reduce-bundle-size`     | Refocus  | Keep capability choice and whole-application measurements. Describe commit 93f06a3 as a commit, and the production benchmark as recorded evidence rather than a fresh current-package result. |
| `/docs/text-animation`         | Keep     | Segmentation, semantic duplicates, live value text and label replacement form a practical composition guide absent from any single API page.                                                  |

## Marketing journeys and route decisions

| Page                            | Decision                          | Audience, purpose and next action                                                                                                                                                                                                                                         |
| ------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                             | Refocus                           | New visitors need one representative interaction and an honest capability promise. Keep the layout playground and paths to Getting started, Examples and Fieldwork; qualify reduced-motion wording.                                                                       |
| `/about`                        | Keep                              | Evaluators need why the adapter exists, when native Svelte transitions suffice, and project independence. This differs from the homepage’s quick introduction and status’s readiness assessment.                                                                          |
| `/status`                       | Refocus                           | Adopters need beta/install status, tested scope and limits. Align performance/3D wording with existing records, link the relevant benchmark and troubleshooting section, and request Astra/Svelte versions in reports.                                                    |
| `/examples`                     | Refocus through registry          | Builders browse by behavior, then inspect a runnable source. Keep search, filters and empty-state recovery; correct misleading categories and compatibility descriptions.                                                                                                 |
| `/showcase`                     | Refocus                           | Fieldwork proves composition across collection, editing, queue and reading tasks. Keep all four scenes and fictional-workspace disclosure. Canonicalize guide links and give the scroll link an accurate single-guide label.                                              |
| `/docs`                         | Keep existing alias               | Direct onboarding entry; a separate documentation landing page would repeat Getting started.                                                                                                                                                                              |
| Historical documentation routes | Keep existing merged destinations | Introduction/troubleshooting → Getting started; state → Animations; presence → AnimatePresence; shared-layout → Layout; timelines → useAnimate; routes → AnimateView; components/api → motion. Do not reintroduce duplicate pages. Incoming section aliases remain valid. |
| `/motion-lab/*`, `/demo/*`      | Keep developer role               | Labs reproduce edge cases and deliberate failures, including route-navigation behavior not shown by the local AnimateView example. They remain excluded from public SEO discovery; they are not marketing evidence of universal support.                                  |

## Registered example dispositions

All 44 registered examples are accounted for below. Each description/title was compared with its stated interaction and guide mapping. These are distinct runnable compositions or reference demonstrations; closely related examples remain when they teach different ownership contracts. No demo runtime or complete source was changed. Guide targets are canonical and their anchors are checked by the existing documentation suite.

| ID / detail route suffix    | Guide and anchor                  | Decision and purpose                                                                                                               |
| --------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `state`                     | `getting-started#first-component` | Keep: smallest native conditional entrance/exit for onboarding.                                                                    |
| `layout`                    | `layout#automatic`                | Refocus: explicitly identify the createLayout controller; useful player composition beyond the focused size demo.                  |
| `shared`                    | `layout#shared-elements`          | Refocus: explicitly identify the controller-based shared highlight; retain for existing integrations.                              |
| `list-composition`          | `animate-presence#pop-layout`     | Refocus: identify compatibility popLayout plus native exits; preserve the task-list composition alongside primary AnimatePresence. |
| `wait`                      | `animate-presence#sequencing`     | Refocus: identify compatibility Presence so users do not confuse its wait default with AnimatePresence.                            |
| `variants`                  | `animations#variants`             | Keep: descendant staggering has a distinct coordination lesson from one-element targets.                                           |
| `timeline`                  | `use-animate#usage`               | Refocus: name createAnimate; retain its multi-element graphic composition and explicit ownership contract.                         |
| `scroll-composition`        | `scroll#choices`                  | Refocus: name createScroll; pinned multi-stage scene is more involved than a progress meter.                                       |
| `in-view`                   | `use-in-view#usage`               | Refocus: name createInView/createMotion bindings; retain the low-level composition without presenting it as useInView source.      |
| `gestures`                  | `gestures#feedback`               | Refocus: identify createMotion bindings; combines native keyboard and pointer paths beyond the focused callback demo.              |
| `motion-component`          | `motion#usage`                    | Keep: isolate reactive position, rotation and shape targets.                                                                       |
| `svg-drawing`               | `svg#usage`                       | Keep: demonstrates attributes and viewBox as well as line drawing.                                                                 |
| `transition-picker`         | `transitions#usage`               | Keep: compare timing with the destination held constant.                                                                           |
| `motion-config`             | `motion-config#usage`             | Keep: make inherited timing and reduced-motion policy observable.                                                                  |
| `lazy-motion`               | `lazy-motion#usage`               | Keep: native draft and node identity survive deferred features.                                                                    |
| `text-animation`            | `text-animation#words`            | Keep: finite word reveal demonstrates the semantic duplicate and replay pattern.                                                   |
| `gesture-feedback`          | `gestures#feedback`               | Keep: focused native-button gesture targets and callbacks.                                                                         |
| `drag-playground`           | `drag#constraints`                | Keep: adjust bounds, elasticity and release behavior in one experiment.                                                            |
| `hover-feedback`            | `hover#variants`                  | Keep: compare inherited hover and keyboard focus treatment.                                                                        |
| `drag-controls-handle`      | `use-drag-controls#handle`        | Keep: external handle with keyboard range alternative.                                                                             |
| `reorder-list-grid`         | `reorder#list`                    | Keep: controlled list/grid sorting, scrolling and move buttons.                                                                    |
| `layout-expand`             | `layout#automatic`                | Keep: focused real size changes and readable inner content.                                                                        |
| `layout-curved-path`        | `layout#curved-paths`             | Keep: a curved path and interruption are distinct from straight projection.                                                        |
| `layout-group-coordination` | `layout-group#coordination`       | Keep: independent native details states demonstrate coordinated measurement.                                                       |
| `layout-group-namespaces`   | `layout-group#namespaces`         | Keep: repeated local IDs demonstrate isolation rather than coordination.                                                           |
| `animate-presence`          | `animate-presence#usage`          | Keep: minimal conditional retention with rapid re-entry.                                                                           |
| `animate-presence-sequence` | `animate-presence#sequencing`     | Keep: direct sync/wait comparison separates sequencing from simple retention.                                                      |
| `animate-presence-list`     | `animate-presence#pop-layout`     | Keep: primary popLayout reference shows flow removal; compatibility list remains explicitly labeled.                               |
| `animate-activity`          | `animate-activity#usage`          | Keep: retained input identity is the observable difference from removal.                                                           |
| `animate-view`              | `animate-view#usage`              | Refocus: categorize as View Transitions; this local view swap does not perform route navigation.                                   |
| `motion-values`             | `motion-values#usage`             | Refocus: Motion values category; one input shared by multiple renderers.                                                           |
| `use-motion-template`       | `use-motion-template#usage`       | Refocus: Motion values category; compose CSS units and a live filter.                                                              |
| `use-motion-value-event`    | `use-motion-value-event#usage`    | Refocus: Motion values category; inspect events and cancellation.                                                                  |
| `use-scroll`                | `use-scroll#usage`                | Keep: both pixel axes and normalized progress are the return contract.                                                             |
| `use-spring`                | `use-spring#usage`                | Refocus: Motion values category; compare retargeting/settings with jump.                                                           |
| `use-time`                  | `use-time#usage`                  | Refocus: Motion values category; elapsed-time composition plus explicit rotation control.                                          |
| `use-transform`             | `use-transform#usage`             | Refocus: Motion values category; named scale/color outputs share one source.                                                       |
| `use-velocity`              | `use-velocity#usage`              | Refocus: Motion values category; speed affects scale and settles at rest.                                                          |
| `use-animate`               | `use-animate#usage`               | Refocus: Scroll & timelines category; scoped sequence controls belong with timeline examples.                                      |
| `use-animation-frame`       | `use-animation-frame#usage`       | Keep: explicit enablement and delta accumulation contrast with elapsed useTime.                                                    |
| `use-in-view`               | `use-in-view#usage`               | Keep: threshold and once controls explain element intersection.                                                                    |
| `use-page-in-view`          | `use-page-in-view#usage`          | Keep: document visibility gates a counter; explain browser automation may force visibility.                                        |
| `use-reduced-motion`        | `use-reduced-motion#usage`        | Keep: change technique from travel to fade using the actual preference.                                                            |
| `scroll`                    | `scroll#usage`                    | Keep: compare a triggered reveal with continuously linked progress.                                                                |

## Current Markdown guide decisions

| Document                    | Decision | Responsibility                                                                                                                                                                                                                                         |
| --------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `README.md`                 | Refocus  | Repository/package entry point: install, scope, primary syntax, compatibility and verification. Correct dated upstream status; keep detailed API options on the website.                                                                               |
| `docs/authoring.md`         | Refocus  | Supported native-binding and compatibility recipes for existing integrations. Explain that the choice table includes compatibility controllers and send adoption decisions to current status. Preserve its runnable recipes.                           |
| `docs/migration.md`         | Refocus  | Differences that matter when moving from compatibility helpers to the primary API. Keep defaults, identity and cleanup rules; remove unexplained approval language.                                                                                    |
| `docs/motion-system.md`     | Refocus  | Maintainer architecture and design reasoning, including explicitly historical experiments. Correct packed/published wording, entry list, policy defaults and stale 3D scope; preserve original evidence rather than recasting it as new qualification. |
| `docs/release-checklist.md` | Keep     | Candidate-specific release gates and explicit publication authority. The initial docs update already corrected the two Kit adapters. No editorial changes required here.                                                                               |
| `docs/site-content.md`      | Refocus  | Maintainer ownership map and content conventions. Clarify focused reference examples versus larger catalogue compositions and remove task-history wording.                                                                                             |
| `docs/site-deployment.md`   | Refocus  | Hosting and indexing configuration. Describe the existing Pages base path and missing explicit public origin accurately; distinguish hosting from crawler indexing.                                                                                    |
| `docs/try-it.md`            | Refocus  | Hands-on scenario checklist for testers, not another API tutorial. Keep concrete interruption/focus steps and direct current scope questions to status/parity instead of an old aftercare record.                                                      |

Dated `docs/research/*`, `docs/parity/*` and earlier `docs/reviews/*` are provenance and evidence. Their old scope statements must retain their dates. Current pages can link to them with an explicit historical label; this pass does not rewrite them or announce fresh package/device qualification.

## Cross-page terminology and shared templates

- **Astra Motion** is the project; **Astra** is acceptable in prose. **Motion** is the upstream engine. Ask users for Astra and Svelte versions rather than implying they install a separate Motion dependency.
- **motion values** names the concept; `MotionValue<T>` names the engine type. `MotionValues` in existing technical prose denotes instances of that type, not a separate API. The existing sidebar group label **Motion Values** remains intact; the overview title uses sentence case.
- **View Transitions** means browser snapshots and a transaction. **Layout animation/shared layout** means projected live elements and `layoutId`. A local snapshot example is not a route-navigation example.
- **Primary API** means direct `motion.*` props and managed `use*` helpers. **Compatibility** means supported bindings/controllers such as `createMotion`, `createLayout`, `createAnimate` and `Presence`; it does not mean removed or deprecated.
- **Hooks** remains the established navigation group. Explain Svelte initialization/getters/cleanup, never imply React render-time hook behavior.
- **Working beta/local package** is the current distribution state. A Git commit is not a published release; a dated measurement is not a new benchmark. Automated WebKit coverage is not physical Safari/iOS performance evidence.
- **Svelte adaptation** describes explicit `present`/`items` identity, retained Activity effects and coordinated View updates. Internal approval history is not reader-facing guidance.

Shared header/footer labels already agree on Documentation, Examples, Showcase, Why Astra and Project status. “Fieldwork” is the showcase’s proper name. Keep the article’s on-page contents, related references and previous/next navigation: they support lookup and exploration. The generated detail template already exposes category, title, summary, runnable source and the precise guide anchor. SEO is derived from the same registries, preventing a second copy of titles/descriptions; aliases retain canonical metadata and labs stay nonindexable.

## Verification

- Existing documentation, SEO and highlighting suites: **3 files, 12 tests passed**. These check all reference links/aliases, canonical example ownership, metadata and complete sample compilation for client/server.
- `check:guide`: **zero errors and zero warnings** in the source-consumer Svelte/TypeScript check. This is not a new installed-package qualification.
- Svelte MCP documentation consulted; autofixer returned **zero issues and suggestions** for each modified Svelte page.
- Targeted ESLint and Prettier checks passed; no runtime or dependency changes.
- Shared headed Chrome at the managed local preview fetched all **83 canonical public routes**: HTTP 200, one h1, matching registry title/description, and the expected guide link on all 44 detail pages. This is server-content validation, not hydration/interaction coverage of all 83 pages.
- Hydrated checks exercised status → troubleshooting anchor, the seven-item Motion values filter, the one-item View Transitions filter, search/no-results/reset and the homepage Stack control. Checked the canonical showcase guide targets and followed its shared-layout link. Reviewed narrow-viewport screenshots and document overflow. Fonts loaded after the parent fixed the isolated preview’s shared-node_modules serving allowance.
- No JavaScript console warnings/errors or failed application requests in the final inspected pages. The examples search field now has a stable name, resolving Chrome’s autofill identification issue without changing its label or behavior.

The parent owns the final combined build, broader runtime verification and integration. This editorial pass does not claim a new cross-browser campaign, device qualification or updated benchmark. Temporary inventory, route results and screenshots are under `/tmp/astra-polish-20260929/`; they are session evidence rather than a new release record. All editorial browser tabs are closed before handoff.

## Exact editorial changed-file manifest

This manifest is relative to the supplied `editorial-base-hashes.json`, not the git base or concurrent coverage work. It excludes earlier agents’ edits and the initial documentation update.

- `README.md`
- `docs/authoring.md`
- `docs/migration.md`
- `docs/motion-system.md`
- `docs/reviews/2026-09-29-content-polish.md`
- `docs/site-content.md`
- `docs/site-deployment.md`
- `docs/try-it.md`
- `src/lib/site/content/core.ts`
- `src/lib/site/content/guides.ts`
- `src/lib/site/content/presence-view.ts`
- `src/lib/site/content/values-helpers.ts`
- `src/lib/site/examples/legacy-examples.ts`
- `src/lib/site/examples/presence-view-examples.ts`
- `src/lib/site/examples/values-helpers-examples.ts`
- `src/routes/+page.svelte`
- `src/routes/examples/+page.svelte`
- `src/routes/showcase/+page.svelte`
- `src/routes/status/+page.svelte`
