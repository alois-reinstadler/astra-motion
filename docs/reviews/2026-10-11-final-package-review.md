# Independent final package and Svelte lifecycle review

Review date: 11 October 2026. Reviewer: `final_package_review`, independent of
consolidation implementation. Reviewed checkout:
`e44ccee86e7bd6bee4daa3833ffae9a3145d3be0`; qualified runtime/test commit:
`63281005d2aa855ef4a22073f3f379b8e10d018d`. Compared the consolidation changes
against `90a3f1bd74432f761f788ad7ad06ec2d601da65b` and inspected the actual package.

**No confirmed release blocker in this review's package/Svelte ownership scope.**
No implementation changes or relaxed assertions were made. This conclusion is
bounded by the checks below; it is not universal parity or leak-freedom proof.

## Artifact and public boundaries

Reviewed archive:
`/workspace/releases/astra-motion/main-2026-10-11/qualified/astra-motion-0.1.0-rc.3.tgz`

SHA-256: `a24a314c3ad5e27ad8207c53ef5fb66e642bd274177eddedbfdf5b436088259f`

Independently computed the hash and compared all **1,223 files**, byte for byte,
against both isolated installed consumers. The final archive is exactly the
archive originally installed in those consumers; the recorded earlier consumer
source commit therefore does not imply a different tested payload. Archive size
is 416,378 bytes. Installed package paths resolve inside each consumer.

Inspected all 21 export entries and 1,216 runtime/declaration files. Export targets
and relative imports resolve within the package. `createLayoutState` is absent.
No runtime or declaration import resolves a second Motion engine or React.
`$app/navigation` occurs only in the explicitly Kit-specific `routes` and
`view-navigation` modules; plain-Svelte fixture graphs exclude Kit. Node filesystem
and compiler imports belong to the separately invoked forwarding-check CLI.

Independently checked 286 upstream source hashes against the installed pinned
Motion sources. A separate AST-assisted comparison found all **283 packaged
runtime modules** unchanged except import paths and source-map comments. Three
vendor declarations differ only by import paths and the documented removal of
one unsupported Electron `webview` member. Versions remain motion-dom and
framer-motion 13.4.4, motion-utils 13.3.0. Shared engine class, frame-loop,
visual-store and public MotionValue identities compare equal at runtime.

Strict declaration compilation passed again in both installed consumers using
`pnpm check:declarations`, with `skipLibCheck=false`. The existing type fixtures
exercise public subpaths, native bindings, helper overloads, component props and
negative type assertions. This does not qualify older TypeScript/Svelte versions.

## Fresh runtime checks

Evidence directory:
`/workspace/releases/astra-motion/main-2026-10-11/reviews/package/`.

- **Plain Parity: three of three engines passed**, using the final archive path
  and existing isolated installation. The reviewed test exercises SSR/hydration,
  reactive MotionValue derivation, retained presence, Activity pause/reveal,
  hidden spring targets, owned animation/frame/subscription teardown, async View
  fallback, constrained pointer drag, Reorder and release-candidate APIs. It
  rejects console warnings/errors and failed requests. Browser versions were
  Chromium 151.0.7922.34, Firefox 153.0 and WebKit 26.5.
- **SvelteKit: 15/15 WebKit cases passed**, including all runtime export keys,
  native SSR initial styles, retargeting, unchanged input identity/focus, repeated
  presence reversal, actual intermediate production projection, MotionValue
  binding, shared-layout handoff, navigation fallback and no-JavaScript SSR.
  Served asset hashes and build identity were checked. This harness rejects
  errors and hydration mismatches; it does not reject every warning category.
- **Independent multi-root teardown: three of three engines passed.** Copied the
  verified plain consumer, kept its installed package and existing Probe Svelte
  component unchanged, and replaced only the test bootstrap to mount two
  independent component roots. Both ran infinite owned playback with at least
  three distinct natural opacity samples over 12 animation frames. Destroying
  the first root stopped its active controls, time/frame callbacks and derived
  updates, including after retained public values were mutated. A retained
  detached DOM reference received no further inline-style writes. The second
  root continued advancing and responded to its own value update. Destroying it
  then stopped its work and removed both probes. No warning/error was emitted.
- The packed bundle audit ran freshly with the consumer checks. Its assertions
  reject a second engine, React, Kit in plain consumers, eager heavy runtime in
  deferred loading, projection/drag in basic features, hybrid playback in mini,
  and unrelated optional-entry imports. Lazy full retains projection and drag.

Primary evidence: `independent-artifact-audit.json`, `provenance-audit.json`,
`engine-byte-audit.json`, `plain-parity/runtime-results-chromium-firefox-webkit-Parity.json`,
`kit-webkit/kit-results-webkit.json`, `plain-parity/bundle-results.json`,
`multiroot-results.json`, and the accompanying logs/probe scripts. The independent
multi-root probe is preserved as `multiroot-probe.mjs` with copied consumer
sources and built output. Its disposable dependency copy was removed after the
run; the original verified isolated installation remains available.

## Lifecycle analysis and limitations

The consolidation runtime diff preserves Svelte attachment ownership and existing
RC3 guards. Native pop mutations recheck live/present state before applying,
restore authored properties on rollback/destruction and remove event listeners.
Queued motion refresh and final attachment disposal use generation/disposed
checks; projection and gesture subscriptions are released by their owners.
Navigation hooks remain scoped to SvelteKit's lifecycle and cancel their current
transaction on destruction. No eager subscription or required staged-state API
was introduced.

The known `derived_inert` warnings remain an **advisory requiring an explicit
release caveat**, not a package blocker established by this review. Reproduction
is the shared-layout dependency fixture's rapid retained replacement. Expected:
owned queued work must not outlive final destruction. Observed in the source
review: Svelte can mark a retained branch INERT before attachment teardown sets
Astra's disposed flag, so the initial queued `refresh(options())` can read the
owner's derived options during retention. The warning alone does not establish
post-destruction work. The fresh packed cleanup and two-root regression checks
above found none; the independent runtime review separately probes the warning
fixture and engine registries. Do not claim a warning-free source matrix or
unbounded cleanup proof from these bounded observations.

I did not repeat the whole production/source matrix, perform a heap-retention
soak, exercise real touch hardware, or claim all possible direct/derived/async
state schedules. Kit navigation was rerun in WebKit here; the final qualification
record covers the other engines. The new two-root probe covers ownership
isolation, not every cross-root shared-layout configuration. Native View support
and fallback behavior remain browser-dependent. Existing touch-emulation skips,
unstaged-parity uncertainty and native-button glyph qualification limits remain
explicitly applicable.
