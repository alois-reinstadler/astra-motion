# Independent final public-contract review — 11 October 2026

Reviewer: `final_public_review`, independent of consolidation implementation.
Reviewed candidate: `e44ccee86e7bd6bee4daa3833ffae9a3145d3be0`, against
`90a3f1bd74432f761f788ad7ad06ec2d601da65b`. The candidate adds qualification
records to tested source commit `63281005d2aa855ef4a22073f3f379b8e10d018d`.

Initial artifact:
`/workspace/releases/astra-motion/main-2026-10-11/qualified/astra-motion-0.1.0-rc.3.tgz`,
SHA-256 `a24a314c3ad5e27ad8207c53ef5fb66e642bd274177eddedbfdf5b436088259f`.

## Finding P1 — current install instructions name the superseded RC2 archive

**Classification: release-documentation blocker. Status: resolved and verified.**

`README.md:7` names the local candidate as `0.1.0-rc.2`; `README.md:55`,
`docs/authoring.md:22` and `docs/try-it.md:6` instruct users to install
`astra-motion-0.1.0-rc.2.tgz`. The actual manifest is `0.1.0-rc.3`, and inspection
of the qualified tarball confirms that its `package/README.md` includes both
incorrect RC2 references. This affects the concrete deliverable, not just a
historical report.

Reproduction: compare those instructions with `package.json` and extract
`package/README.md` from the supplied archive. Expected: the candidate label and
active install commands identify the supplied version. Observed: following the
command targets a different, superseded archive or fails when only RC3 is present.
Root cause: the site overhaul updated its package-derived installation text while
the repository/package README and older active installation guides were unchanged.

Regression check: compare the current candidate label and the archive names in
all three active guides against `package.json.version`, then verify the corrected
README inside the actual replacement archive. Preserve historical RC2 reports.
Pre-fix evidence is `P1-install-version-before.json` in the evidence directory.

Resolution: commit `d7d366e1aaf06c22d81a1754d23a4aa35a6017c6` corrects all four
active version references to RC3, removes the obsolete hardcoded preview address
and removes the stale documentation page count. Historical RC2 records remain
unchanged. Independently reviewed the focused diff and verified that the regression
finds four mismatches before the fix and zero afterward, including the packed README.

The replacement artifact is
`/workspace/releases/astra-motion/main-2026-10-11/reviewed/astra-motion-0.1.0-rc.3.tgz`,
SHA-256 `719b4424df6d4c047d20b76a9429636378f600f9e9abec665ae96e364992542e`.
Independent unpacked comparison found 1,223 files: only `package/README.md` changed;
the other 1,222 files are byte-identical to the initial artifact. The replacement
supersedes the initial artifact above for owner review.

Fresh isolated consumer qualification finished successfully on 11 October at
22:53:35 UTC. Independently inspected the raw reports and matching replacement
archive hashes: plain Svelte passed nine cases per engine (27 total), and SvelteKit
completed fifteen per engine (45 total), across Chromium, Firefox and WebKit.
The qualification command exited zero; bundle evidence also names the replacement
hash. These checks were run by the consolidator and independently inspected here.
Fix verification and raw-result hashes are preserved in
`P1-source-fix-verification.json`, `P1-package-fix-verification.json`,
`P1-independent-package-diff.json` and `P1-final-consumer-verification.json`.

**Final public-review verdict: no open confirmed release blockers.** Advisory A1
below remains a bounded editorial follow-up for the owner.

## Advisory A1 — historical timing provenance could be closer to the numbers

The unchanged paragraph in `src/lib/site/content/guides.ts`, section
`reduce-bundle-size#runtime-cost`, reports the historical 18-trial layout timings
without a date, commit or evidence link adjacent to that paragraph. It says
“recorded,” names the desktop/software-rendering environment and rejects a phone
performance guarantee, so this is not classified as a false final-qualification
claim. The final qualification record also explicitly separates historical
experiments. A future editorial pass should add the original revision/date and
link beside the numbers. Do not replace them with unmeasured final-runtime claims.

## Public contract and source review

- Reviewed the consolidation diff, public entry manifest, active onboarding and
  reference content, canonical example registry, lazy loading/server highlighting,
  source-backed examples and test-oracle changes. Motion 13.4.4 remains the engine.
  No `createLayoutState` reference appears in active source or in any packed
  JavaScript, declaration or Svelte file; the public export map adds no staged API.
- `presence-context.svelte.ts` implements the documented stable `safeToRemove`
  closure by reading the current generation when invoked. Independent derived
  selectors expose presence and custom data. The manual-removal recipe cancels its
  own WAAPI animation and guards asynchronous completion after cleanup; it does not
  make consumers clean up Astra-owned work. Initialization capture is documented.
- Ordinary Svelte assignments remain primary. The layout guide identifies
  `updateLayout` as an optional synchronous transaction and explicitly describes
  the unobserved-intermediate-layout limit. Activity distinguishes Astra-owned
  suspension from ordinary Svelte effects; View names its explicit transaction.
- Canonical examples use public imports and scoped shared identities. The note
  remains separately available as `layout-note`; the session comparison deliberately
  contrasts unprotected text with position-only correction. Their contracts are not
  conflated. Native bindings retain their explicit outro directive and SSR props.
- Historical matrix/experiment qualification is labeled historical. The final
  record identifies exact input applicability, package identity, warning/touch
  limits and the absence of universal unstaged-parity or physical-iPhone claims.

## Test-oracle review

The delayed-outro test samples the actual flow transaction before another frame,
retains the 20px continuity limit, and separately requires natural settlement,
exact flow extraction and node removal. Its boolean cleanup predicate is necessary:
installed Vitest 4.1.11 executes `await fn()` in `expect.poll`, and Motion playback
controls implement `then` through `finished`. The previous object-returning poll
could hang after stop or falsely pass on a retained completed animation. Reviewed
the deterministic stopped-playback and retained-reference negative-control logs;
the corrected predicate rejects retained playback in all three engines. No runtime
rewrite or weaker timeout is involved.

The WebKit zoom correction compares the animated element exactly with the
unanimated sibling in the same coordinate system, also requires exact final
MotionValue `-160` and retained node identity, and preserves intermediate bounds.
The new scene intentionally travels 160px rather than the old scene's 100px.
The native-intro check waits for the real 350ms WAAPI intro before its original
250ms opacity deadline. The single 15-second Shiki test is cold CPU tokenization,
not an animation deadline.

The native-button glyph test retains 150 frames and 0.5px tolerance. Reviewed the
deliberate `scaleX(1.15)` WebKit failures at both widths: the oracle detects the
distortion. The two production touch skips are the existing Chromium-CDP-only
input-emulation case, not new exclusions. The release config includes every source
browser suite and the informational benchmark.

## Independent verification performed

Evidence directory:
`/workspace/releases/astra-motion/main-2026-10-11/reviews/public/`.

- Reran four site server suites covering documentation, compiled standalone
  snippets, lazy component resolution, selective payloads and highlighting:
  **18/18 passed**. Command: `pnpm --config.verify-deps-before-run=false exec vitest
run --project server src/lib/site/docs.spec.ts src/lib/site/snippet-previews.spec.ts
src/lib/site/loading.spec.ts src/lib/site/highlight.spec.ts`. The dependency flag
  permits the review checkout's existing linked modules; it does not skip tests.
- Independently hashed the actual archive and parsed the raw complete source
  results: each engine has 141 files, 1,193 passed, zero failed/pending. Inspected
  source commits, clean-state metadata and the record-only changes after the tested
  commit. Reviewed production/server gate records and packed case inventories;
  those complete matrices were not rerun by this reviewer.
- Used only owned T3 collaborative tab `tab_18` against the existing production
  preview. Desktop search for `safeToRemove` fetched the search index successfully
  and found the relevant guides. Client navigation reset focus to BODY, cleared
  the filter and updated `aria-current`, with no duplicate IDs.
- At 393px, opened mobile contents, filtered for layout and navigated to the guide.
  The menu closed, query cleared, current-page marker changed, focus reset and
  horizontal overflow remained absent. The catalog exposed 41 examples; filtering
  by “note,” focusing the result and pressing Enter reached the canonical note.
  A visible focus outline remained available.
- Desktop natural close/reopen captured 80 frames, including 15 intermediate
  opacity samples, with the same card/detail nodes and a final fully visible note.
  The mobile open/close/reopen/close sequence captured 116 frames, including 32
  intermediate opacity samples; it ended at 230px width, no detail, no remaining
  animations, retained button focus and no horizontal overflow. Probes, JSON,
  recordings and a screenshot are retained. Timers trigger real DOM interactions;
  animations are neither sought nor paused.
- Opened complete source through its native details control. The displayed source
  matches the candidate component byte-for-byte after its public-import rewrite,
  with 745 styled tokens. No failed resource response was observed. The only
  console errors were two initial Electron sandbox/preload startup errors from
  `node:electron`, preserved separately; no site-code error appeared.

Initial background-tab sampling was throttled and is not counted as continuity
evidence. Recording kept the compositor active for the recorded natural runs.
Some early locator attempts failed or clicked before stable targeting; corrected
specific locators and observed state were required before accepting results.
All review test jobs finished; both recordings stopped. The owned tab was
navigated to `about:blank` and its blank status verified. No preview server was
started, rebuilt, restarted or stopped.

This review does not independently establish physical touch/device performance,
all arbitrary reactive interleavings or leak freedom across every runtime path.
The two known `derived_inert` warnings belong to the separate runtime ownership
review; this report does not infer harmlessness from passing geometry alone.
