# Final parity qualification

Date: **2026-09-28 UTC**. Runtime candidate:
`8ea3543979870e0ede58797875b30b468e1fba06`; subsequent changes are documentation,
qualification tooling and test typing/selector corrections. Motion/framer-motion/
motion-dom **13.4.4**, motion-utils **13.3.0**, Svelte **5.57.0**, Kit **2.70.3**.

## Local evidence

| Gate                                           | Result and scope                                                                                                                                                                                                                                                                                    |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Strict source                                  | svelte-check: **0 errors, 0 warnings**                                                                                                                                                                                                                                                              |
| Canonical examples and complete guide snippets | Public-source compilation: **0 errors, 0 warnings**                                                                                                                                                                                                                                                 |
| Server/SSR/model tests                         | **203 passed**, 44 files                                                                                                                                                                                                                                                                            |
| Source browser matrix                          | **1,563 cases**, Chromium/Firefox/WebKit. Initial run: 1,562 passed, one real WebKit hidden-clock failure; all **18 affected checks** passed across the three engines after correction. No second broad local run.                                                                                  |
| Formatting/lint                                | Whole-tree format check passed. Whole-tree lint identified three errors; removed the unused import and used weak node-owner reference counts, then all affected files passed lint. No rule or assertion disabled.                                                                                   |
| Qualification tooling                          | **4/4 passed**; generated elements reproducible                                                                                                                                                                                                                                                     |
| Engine boundary                                | **71 Motion DOM + 7 Motion runtime symbols**, one compatible engine; exact private compatibility contracts recorded in reviewed-exports.json                                                                                                                                                        |
| Packed applications                            | Both plain Svelte and SvelteKit install the archive without source aliases; strict declarations (`skipLibCheck: false`), SSR/client builds and 19 public entries pass. Exact two-archive browser evidence is in [package results](PACKAGE-RESULTS.md).                                              |
| Bundle graphs                                  | No React or duplicate engine; basic/lazy/mini isolation assertions pass. [Measured bytes and hashes](packed-bundle-results.json) include Svelte and application bootstrap.                                                                                                                          |
| Production documentation                       | **33 Chromium cases qualified**: 32 passed initially; one catalogue test confused the demo's own disclosures with its source disclosure. The locator now targets the frame's direct source disclosure; its focused rerun passed all 45 destinations. All 34 reference pages hydrate without errors. |
| Manual production preview                      | Shared Chrome: Activity retains exact input identity/value through hide/reveal; native View swap works; document responses 200, no console errors, no horizontal overflow. Activity screenshot captured and inspected.                                                                              |
| Independent review                             | [Five findings resolved](ADVERSARIAL-REVIEW.md), followed by independent acceptance of the hidden-clock correction. No substantiated open defect; qualified to proceed to release gates.                                                                                                            |
| Final polish                                   | [Small prose-only pass](POLISH-RESULTS.md) reviewed and integrated; no unnecessary runtime refactor.                                                                                                                                                                                                |

The hidden-clock correction preserves the exact held-value assertion and adds a
no-hidden-onUpdate assertion. It synchronously samples the paused JS trajectory
and releases its driver without making playback terminal. Borrowed external
MotionValues remain outside the hidden consumer's playback ownership.

A stale local preview process initially served references to assets from its
previous build. The interrupted diagnostic run is not counted as a source failure
or a pass. Restarting the managed preview restored the exact asset URLs to200;
the production checks above then ran against the stable build.

## Remote delivery gates

The existing [CI workflow](https://github.com/alois-reinstadler/astra-motion/actions/workflows/ci.yml)
runs all required checks, the complete source-browser matrix, the complete production
E2E matrix and both complete packed consumers in Chromium, Firefox and WebKit on
main. Focused local reruns never change those default CI commands. The exact merged
revision must pass these gates before delivery is reported complete.

The [Pages workflow](https://github.com/alois-reinstadler/astra-motion/actions/workflows/pages.yml)
builds with the repository base path and deploys
[the documentation](https://alois-reinstadler.github.io/astra-motion/). Delivery also
requires checking its deployed pages and representative interactions, then closing
owned browser tabs and cleaning completed worktrees. Exact run IDs, merged SHA and
deployed observations belong to the final delivery report; local success alone is
not a claim that these remote gates already ran.

## Boundaries

The [matrix](MATRIX.md) and its option-level audits retain exact Svelte adaptations
and upstream limitations. Activity's private Motion+ alpha source is unavailable;
Astra qualifies its published behavior and the user-approved retained-state/effect
contract. Ordinary Svelte effects stay active without useActivityEffect. Explicit
Presence identity and View transactions replace unavailable renderer interception.
Layout geometry evidence covers 2D affine, sticky, scroll and clip boundaries;
perspective/3D geometry is not advertised as qualified. These boundaries are not
silent omissions or claims of React's private lifecycle behavior.
