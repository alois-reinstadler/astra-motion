# Motion integration scope

This is the historical September 21 decision and verification record. For the
current engine pins, bundled consumer declarations and layout qualification, see
the [Motion 13.4 migration](motion-upgrade-13.4.md),
[projection boundary review](projection-boundaries.md), and
[motion system contract](../motion-system.md). The open items below describe the
rollback revision, not the latest implementation.

Decision recorded September 21, 2026: Astra Motion adapts Motion to Svelte. The
uncommitted CSS backend experiment has been removed. A second interpolation engine
would require separate lifecycle, interruption, accessibility and browser support
contracts without advancing that purpose.

The rollback removes the optional engine selector, `/css` exports, stylesheet
presets, CSS lab and consumer fixtures, guide, tests and experiment reports. The
ordinary `createMotion` API and its Motion implementation remain. Svelte's native
transition lifecycle and browser View Transitions remain intentional integrations.

## Improvements retained

- Press listeners belong to the attachment lifetime. Enter still works after a
  focused element is rebound; repeated presses do not allocate more handlers.
- Drag constraints are checked before a session and after callbacks. Invalid live
  bounds cancel safely without leaving a drag lock or starting momentum.
- Nine gesture regression tests, consumer package-manager metadata and favicon,
  and CI build, bundle and packed-consumer checks remain.
- The reviewed Motion import surface replaces `press` with `isDragActive` for the
  owned press helper. Dependency pins are unchanged; CI now checks this surface.
- Package qualification compares the entire export map. Two server tests also
  check the reviewed entry map and its typed source targets before browser tests.
- Default E2E tooling now runs the real Motion suite, requires `MOTION_LAB_URL`,
  and never starts a server or installs browsers implicitly. Unit tests run once;
  browser installation is an explicit setup command.

## Fresh verification

- Server suite: 21 files, 93 tests passed, including the package-contract tests.
- Svelte and guide checks: zero errors and warnings. Scoped ESLint passed.
- The Motion upgrade gate passed against the unchanged dependency pins.
- The Svelte analyzer reported no issues or suggestions for the restored binding
  modules, lab layout and consumer export page.
- E2E configuration discovery lists 162 tests across 14 files and three browser
  projects. Omitting `MOTION_LAB_URL` fails with an actionable message. Discovery
  launches no browsers and is not a claim that those E2E cases passed.
- Bundle measurement regenerated `bundle-sizes.json` after the rollback. State is
  40,780 bytes gzip and lite state is 26,333 bytes gzip, with host Svelte external.
  No measured entry imports React.
- The coordinating agent ran nine aftercare and 15 existing gesture regression
  test bodies in shared Chrome. All 24 passed without console warnings or errors,
  including real pointer dragging and capture. A temporary assertion/registration/
  spy shim was used; this was not the Vitest runner or the full browser matrix.
- After the independent review fixes, the production build and strict publint
  passed. A freshly packed tarball installed, type-checked and built in an
  independent SvelteKit consumer. Shared Chrome verified all 11 entry points,
  state exit/reversal/removal/remount and automatic layout at intermediate and
  settled poses, with no console warnings or errors.
- That pre-marketing archive had SHA-256
  `bdf9c1cc46b51880496e76af9bd8bdec1ec49d9093a877ac4da9c2fe524dc200`.
  Later site, metadata and documentation changes require their own integrated check.

Earlier research reports describe their own historical revisions. They do not
certify a later working tree or the full cross-browser matrix.

## Release work still open

The package remains an unpublished `0.0.1` beta. Physical Safari/iOS and low-end
device coverage remain outstanding. Existing research records limits at 500
animated layout participants under CPU throttling. Motion's projection internals
remain pinned to 13.2.0 and require upgrade qualification. The upstream
`HTMLWebViewElement` declaration issue with `skipLibCheck: false` is still a known
consumer constraint; the rollback does not claim to resolve it.
