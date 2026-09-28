# Final focused polish

Date: 2026-09-28 UTC. Base: `a349d50`. This bounded pass follows the five
resolved findings in [the adversarial review](ADVERSARIAL-REVIEW.md).

## Changes and manifest

- `README.md`: use the approved Activity adaptation terminology and link to its
  primary lifecycle reference instead of describing it as React equivalence.
- `docs/migration.md`: repair version spacing and explain that reading a borrowed
  MotionValue does not transfer external playback ownership; link to Activity.
- `docs/parity/CONTRACTS.md`: reference the matrix for the canonical baseline,
  record playback-instance ownership, and replace temporary worker assignments
  with enduring configuration, gesture-adapter and motion-core responsibilities.
- `src/lib/site/content/presence-view.ts`: shorten repeated Activity explanations.
  Keep effect cleanup/restart details in the existing activity-effects section;
  keep the lifecycle section focused on the Svelte adaptation and its limits.
- `docs/parity/POLISH-RESULTS.md`: this report.

All changes are prose. Public APIs, examples, page identities, routes, navigation,
design and qualification status are unchanged. The bundle guide remains owned by
the measurement worker; its original source-fixture figures need reconciliation
with that worker's final installed-package evidence.

## Runtime boundary review

Inspected `animation-ownership.ts`, its core and controls call sites,
`animation.ts` path ownership, and `sequence-path.ts`.

The small ownership module already centralizes playback identity without taking
over MotionValue ownership. The similar core/controls pause-capability predicates
could be extracted, but their storage and resume sequencing differ. A cosmetic
extraction would touch both newly corrected lifecycle paths without simplifying
those responsibilities. No runtime refactor is recommended for this pass.

The sequence adapter separates timing resolution, engine-backed position samples,
arc sampling, and per-element playback controls. Its clocks intentionally remain
independent under one upstream group so interrupting one subject preserves its
peers. Collapsing them would reintroduce the reviewed ownership defect. The generic
local `Options` alias could receive a more specific internal name in a future
maintenance change, but it does not justify runtime churn during qualification.

## Actual verification and limits

- Read the shared matrix, contracts and adversarial review; compared documentation
  wording with the current ownership implementation.
- Consulted official Svelte `$effect` and lifecycle documentation through the
  Svelte MCP server. No Svelte code or executable snippets were changed.
- Direct Prettier formatting/checking passed for the five manifest files.
- Direct ESLint passed for `src/lib/site/content/presence-view.ts`.
- `git diff --check` passed; manually reviewed the complete prose diff.

No broad tests, builds, package measurements, browsers, servers, dependency
installs, commits or delegated jobs were started. Final combined runtime, package,
production documentation and browser verification belong to the integration owner.
This report qualifies only the focused prose and boundary-review pass.
