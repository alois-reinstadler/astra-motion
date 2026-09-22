# Motion-focused rollback review

Follow-up: the [September 22 release audit](2026-09-22-release-readiness.md) found
a declaration filename collision and a split Motion dependency graph in the earlier
independent consumer. The checks below describe their tested behavior; they do not
establish strict declarations or shared dependency identity.

An independent read-only review compared the rollback with commit `b5dc31e` and
the saved pre-rollback working tree. It found no orphaned CSS entry points,
imports, fixtures or public documentation. Full/lite bindings, ownership,
presence, layout and SSR returned to the pre-experiment implementation.

Two findings were accepted and fixed:

1. **Press cancellation on window blur.** The retained press helper could keep a
   pointer session alive when the window lost focus without receiving pointerup
   or pointercancel. The session now owns a blur listener that cancels feedback
   and releases its listeners. A regression checks cancellation, the next press,
   and cleanup after disposal.
2. **Disposal inside drag callbacks.** This pre-existing defect allowed
   `onDragStart` to destroy its binding before the handler marked the session as
   started. Projection remained blocked and movement callbacks continued after
   disposal. The session now records its started state before callbacks, checks
   whether callbacks released it, and suppresses later callbacks after disposal.
   Regressions cover projection restoration and disposal in `onPanEnd`.

All nine gesture regression test bodies passed against the real runtime in the
existing shared Chrome, with no console warnings or errors. A temporary bundle
used a minimal assertion/registration/spy shim; this is browser behavior evidence,
not a full Vitest or cross-browser suite result. The temporary bundle and browser
tab were removed afterward. The durable tests live in
`src/lib/motion-lab/gesture-aftercare.svelte.spec.ts`.

The reviewer rechecked both fixes and reported no additional findings. The
coordinating agent also exercised 15 existing gesture test bodies in shared Chrome,
including real pointer capture and dragging. Combined with the nine aftercare
regressions, 24 browser checks passed with no console warnings or errors.

After these review fixes, the production site/package build and strict publint
passed. A new tarball installed, type-checked and built in an independent consumer.
Shared Chrome verified all 11 exports, state exit/reversal/removal/remount and
intermediate/settled automatic layout behavior. The archive SHA and verification
limits are recorded in [the current scope report](../research/motion-focus.md).

## Final site and package verification

The integrated marketing pass adds About and Status pages, installation guidance,
an error page, shared metadata, a sitemap, robots policy and Astra sharing assets.
It keeps the existing visual design and Motion examples.

- Final server suite: 22 files, 96 tests passed. Svelte and guide checks reported
  zero errors and warnings. Full formatting/ESLint, the Motion upgrade gate,
  production build and strict publint passed.
- E2E discovery found 162 cases across 14 files. The configuration rejects a
  missing preview URL. Discovery is not execution of the three-browser suite.
- All 18 public routes returned 200 with one title, description, robots tag and
  main heading. The public-route anchor sweep found no missing targets.
- Shared Chrome verified client navigation from About to Status, including title
  and sharing-metadata updates. The homepage layout demo still changed layout and
  settled all three participants. Public-page console and network checks were clean.
- Desktop, 390px and 320px layouts were inspected, including screenshots. The
  tested home, status and installation views had no horizontal document overflow.
- The removed `/docs/css` URL returned a branded 404 with no canonical or stale
  Open Graph title and a nonindexable robots tag.
- The normal build has no configured origin: no canonical URLs, an empty sitemap
  and disallow-all robots. An isolated build with the reserved test origin
  `https://example.org` verified canonical URLs, sharing PNG tags and an 18-page
  sitemap excluding labs and demos. No public domain was set in the main build.
- The final package has 64 files and 11 public entries, with no CSS backend or test
  files. All 62 distributed runtime/declaration files are byte-identical to the
  post-review archive tested in the independent consumer and browser.

Final archive SHA-256:
`2c100bcfa7d92d39548fab4d694dad4cbc1cc765130ea1d7c866928bd7dc900c`.

The complete Firefox/WebKit matrix and physical-device qualification were not run
in this session. The existing upstream strict-declaration and large-layout limits
remain documented. No release, deployment, license selection or dependency upgrade
was performed.
