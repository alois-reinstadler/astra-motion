# Documentation website end-to-end verification

Reference date: 2026-09-28 UTC. This record covers website integration;
whole-package parity, consumer checks, production bundles and deployment have
separate delivery gates.

## Coverage and ownership

The six E2E files contain **33 cases**. They preserve existing homepage,
catalogue, copy/highlighting, reduced-motion, mobile overflow, keyboard focus,
no-JavaScript source, reset, and client navigation cleanup assertions.

Larger examples now run at `/examples/[id]`. Their tests retain list removal and
reflow, notification exits, expanding-player geometry, shared selection, variant
staggering, button/drag feedback, pinned-scroll assembly/reversal, visibility and
timeline playback. Existing transform tolerances, the homepage scale-error bound
(<0.002), font-size equality, and source-copy layout bounds are unchanged.

Additional coverage establishes:

- Six ordered documentation groups and all 34 requested pages.
- Hydration without page, console or HTTP errors; unique DOM IDs; mounted
  reference demonstrations; accessible reference-table structure.
- Keyboard scrolling of reference tables and complete source on a narrow screen.
- All 45 catalogue destinations and their primary-guide anchors.
- All 63 historical section/alias IDs in server-rendered content, with selected
  old fragment navigation checked both with JavaScript and without it.
- Exact canonical source display/copy for motion, Activity and LazyMotion.
- Activity input identity/value retention through repeated hidden states and
  reset; LazyMotion input identity and latest target while features are pending.
- Reversible view swaps with the available native capability and an explicitly
  unavailable-API fallback.

Owned deliverables:

- `tests/motion/docs-site.spec.ts`
- `tests/motion/site.spec.ts`
- `tests/motion/code-polish.spec.ts` (two legacy route migrations only)
- `tests/motion/parity-docs.spec.ts`
- `tests/motion/layout-player.spec.ts` (three cases moved to `/examples/layout`)
- `tests/motion/showcase-refinements.spec.ts` (four existing cases unchanged; its
  `/docs/layout` visit checks documentation scroll policy, not the old demo)
- This result record.

Runtime and website source changes belong to the root maintainer. Source copies
in the worker worktree are verification prerequisites and must not be integrated
as worker changes.

## Findings and resolution

1. Reorganization initially removed historical anchors and the link to the
   existing two-page route composition. Root restored the 63 published anchors
   and the route-demo link. The new uniqueness check also caught duplicate
   `component-props` and `sequence` IDs; root removed redundant aliases.
2. SvelteKit's prerendered redirect HTML assigns `location.href` without copying
   the incoming fragment. HTTP redirects in development hide that production
   problem. Root replaced old-route redirects with static alias pages that render
   the canonical article at the original URL. The old pathname and fragment are
   retained, canonical sidebar selection is used, and configured SEO points at
   the primary page. This supports old links even with JavaScript disabled.
3. The existing homepage proportions test could programmatically click its
   enabled SSR button before hydration. Its failure snapshot still showed Grid
   pressed and no animated frames. The test now waits for the same completed
   entrance already used by the other homepage test. Its animation, scale and
   font assertions remain unchanged.
4. The initial Firefox sweep observed console errors during concurrent Vite HMR,
   including a failed reload of `src/routes/layout.css`. These errors are not
   filtered. Final verification needs stable source or a built preview; console
   capture now serializes object errors for useful failure diagnostics.

## Execution and current results

The initial runs use the root managed development preview at
`http://127.0.0.1:4097`, one Playwright worker, and the existing
`playwright.motion.config.ts`. The configuration starts no server. This worker
has opened no manual Chrome pages or preview servers.

- Initial Chromium: **23/25**, before the alias contract/readiness corrections.
  All 34 page loads and all 45 catalogue destinations passed.
- Chromium focused follow-up: homepage timing/scale/font regression passes.
  Static-alias/browser and no-JavaScript checks pass after root's alias correction.
- Initial Firefox: **22/25**. Interaction, copy, accessibility, focused demos and
  corrected homepage assertions pass. Remaining failures concern the in-progress
  alias change and concurrent HMR in the page/catalogue sweeps.
- Static-alias/browser and no-JavaScript follow-up: **4/4** across Chromium and
  Firefox, including all 63 SSR anchor IDs.
- Final production website run: **pending**. Root owns one combined integrated
  three-browser qualification; no extra full sweeps will run before the candidate
  is frozen.

The final matrix and production-alias verification will be recorded here before
this bounded assignment is reported complete.

## Final production qualification

The stable production preview qualified all33 Chromium cases:32 passed in the
combined run; the catalogue case required a more precise source-disclosure selector
because the LayoutGroup demo contains its own native summaries. Its focused rerun
passed all45 destinations and guide anchors. Assertions and tolerances are unchanged.
All34 documentation pages hydrate without console/network errors. Manual shared-Chrome
Activity retains the exact input and draft across hidden/reveal, and native View swaps
work. The Activity desktop screenshot was captured and inspected with no overflow.
The full three-engine production matrix remains the default CI gate, avoiding a
redundant local sweep at the user's request. See [final verification](VERIFICATION.md).
