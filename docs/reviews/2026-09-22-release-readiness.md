# Release readiness — September 22, 2026

The release audit found two gaps in the earlier packed-consumer checks. Passing
SSR, hydration and interaction checks did not establish strict declaration
compatibility or prove that every adapter used the same Motion engine instance.

## Findings

- `Motion.svelte` and `motion.svelte.ts` generated declaration paths differing only
  in case. Importing the public component and state binding together produced
  TypeScript TS1149. The internal component is now named `MotionComponent.svelte`;
  the public `Motion` export is unchanged.
- The previous independent consumer resolved `motion@13.2.0` through
  `framer-motion@13.4.0` to `motion-dom@13.3.0`, while Astra also installed its exact
  `motion-dom@13.2.0` dependency. Shared engine exports had different identities.
  The repository lockfile had concealed this fresh-install difference. Disabling
  declaration checking cannot correct separate runtime engine instances.
- The consumer fixture now constrains the complete reviewed dependency graph.
  Qualification checks installed versions and shared engine identities before
  accepting a consumer. These are consumer-owned overrides; publishing Astra does
  not apply them automatically to another app. The README and installation guide
  explain this beta requirement and its impact on other dependencies in the app.
- The upstream `HTMLWebViewElement` declaration error remains an explicit failure
  with `skipLibCheck: false`. No ambient shim or dependency declaration patch was
  added. This beta is not qualified for strict dependency declaration checking.
- CI previously ran the component browser matrix without the `tests/motion` E2E
  suite. Release preparation adds explicit production-preview E2E jobs and retains
  browser failure artifacts.

The earlier archive with SHA-256
`bdf9c1cc46b51880496e76af9bd8bdec1ec49d9093a877ac4da9c2fe524dc200`
exhibits the unpinned-consumer findings above. Its passing behavioral checks remain
historical observations, not evidence of a fully qualified dependency graph.

## Shared Chrome exploratory checks

Before the internal filename change, the current development preview was exercised
through the shared headed Chrome 152 on Linux at 1280 × 1000:

- Extended lab: 20 overlapping state changes completed at 4× CPU throttling,
  reaching chapter 21 and one selected shared marker with no residual inline
  projection transforms. Two native outros were still active 1800 ms after the
  last change; a subsequent sample had none. This is eventual correctness evidence,
  not a fixed-deadline performance pass.
- Scrolling the shared marker's container by 315 px during projection left one
  marker inside the selected shelf, with no residual transform or running animation.
- Destroying the nested exit owner during an outro left zero cards and running
  animations. Remounting restored one card at the latest chapter with no running
  animations after settling.

The console had no warnings or errors. These checks used the development site,
not the Playwright runner. CPU throttling does not qualify physical low-end
hardware, and shared Chrome cannot establish Firefox, WebKit or Safari/iOS behavior.

## Packed production smoke checks

The renamed component and reviewed dependency graph were packed into archive
`30eb97b7fbabfc5dfc9736d1a094bbe63ec57f1901beecfb93758e61931050e9`.
Its independent production consumer passed these shared-Chrome checks:

- All 11 public entries rendered and hydrated.
- SSR initial state retained opacity 0.75 and translateX 40 px; retargeting reached
  120 px without changing opacity.
- At 4× CPU throttling and 1280 × 1040, a 100-cell automatic grid and 500-cell
  automatic/explicit grids each completed reverse, resize, remove, undo, rotate
  and resize operations. At the 1400 ms settlement sample, all expected cells
  were unique, ordered, visible and free of residual transforms; active projection
  and running native-animation counts were zero.
- Destroying each grid during a new reverse left zero DOM cells and zero registered
  or active participants. Remounting restored the expected grid.

These are bounded correctness and cleanup checks. They did not measure frame-rate
budgets, repeat the historical performance matrix or qualify a physical device.
The console checks were clean. The temporary consumer preview was stopped and
all owned browser tabs were closed.

## Remaining release requirements

- A public package release. MIT has been selected and added to the repository.
- Physical Safari/iOS and low-end-device qualification, including interrupted
  animation, scrolling, reduced motion and large-list behavior.
- An upstream strict-declaration resolution and a release strategy that does not
  rely on undocumented transitive compatibility.
- A chosen public site origin before enabling indexing. `PUBLIC_SITE_URL` remains
  unset; canonical URLs and sitemap generation are already configurable.

The recorded 500-participant slow-CPU performance limitation remains. No scheduler
rewrite was attempted without the full regression matrix and a comparable isolated
performance run.

## Integrated verification and review

Svelte checking and guide validation passed with zero errors or warnings. All
97 server tests and both qualification-input tests passed. Formatting, ESLint,
the dependency upgrade gate, production build and strict publint passed. The
packager retains its existing warning about `import.meta.env` usage.

An independent reviewer found no blocking correctness issues. It reproduced the
positive and negative consumer identity checks, confirmed the component rename
preserves its source and public export, checked the qualification scripts, and
verified the screenshot configuration against Vitest’s installed path resolver.
CI execution is recorded separately from that static review.

The integrated archive is
`5e2c3322b555e9b9cece19ab7186942469a20d962cbfbd0f9d6078b6a33f96f0`.
It installed, passed the consumer identity gate, type-checked and built independently.
All 62 distributed runtime/declaration files are byte-identical to the
`30eb97b7…` archive exercised in shared Chrome above; the README accounts for the
package content change. Strict dependency checking still reports only the upstream
`HTMLWebViewElement` error.

## Completed CI qualification

[CI run 35738473583](https://github.com/alois-reinstadler/astra-motion/actions/runs/35738473583)
passed all seven jobs for commit `2ce7e2c827b279a99392f45cebfef66ff4674a9a`:

- 97 server tests and two qualification-origin tests.
- 281 component tests in each of Chromium, Firefox and WebKit.
- 59 production E2E tests in Chromium; 58 in Firefox and WebKit, with one existing
  Chromium-only touch-input case skipped in each of those engines.
- Type checking, guide validation, formatting, lint, the dependency upgrade gate,
  production build, bundle measurement and an independent packed-consumer install.

The new E2E matrix exposed pointer clicks racing native scroll movement and
protocol polling missing short animation phases. Tests now establish stable click
positions and sample short motion phases inside the page. Navigation interruption
checks prove that native transitions are active before superseding them. The live
reduced-motion check pauses the native exit clock before its endpoint, verifies
that the visible pose remains without the policy change, then requires it to
settle at the unchanged clock position when the policy changes. A negative control
in shared Chrome confirmed that omitting the policy change fails this assertion.

Five full-page accordion, dialog and card integration scenarios now run against
the production document in all three engines. They retain reversal, native-node
identity, focus, centering, cleanup, ordering and text-scale assertions. Vitest's
WebKit iframe showed intermittent rendering stalls in these full-page fixtures;
viewport sizing and frame sampling did not resolve them. Moving the integration
checks does not establish that the iframe behavior is fixed. No browser engine is
excluded, no runtime workaround was added, and the entrance timing limits remain.

Independent review found and corrected three test weaknesses: natural exit
completion could masquerade as policy-driven settlement; a missing form input could
escape scale measurement; and shared readiness could relax the original entrance
time limit. Review found no remaining issues after those corrections.

These results qualify the code revision above. This evidence update changes only
documentation; strict dependency declarations, physical-device qualification,
and publication remain subject to the requirements above. The owner subsequently
selected MIT; the repository now includes the license and matching package metadata.
