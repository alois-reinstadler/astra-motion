# Unstaged interception probes — 2026-10-06

Both approaches improve outgoing first-pop geometry in the same real managed-component
control. The compiler probe also suppresses an existing reorder animation and produces large
survivor displacement during combined updates. Its low outgoing-exit errors are
**not whole-scene or interrupted-animation parity**. Neither qualifies as a general React-style lifecycle or a default runtime feature. Keep them
as opt-in research fixtures until the remaining coverage and integration failures
are addressed. No production source, public export, installed dependency, or library
configuration is modified.

## Reproduce

From the repository root, after the normal pnpm dependency install:

```sh
node experiments/unstaged-rendering/run.mjs
```

The runner uses the already installed SvelteKit, Vite, Vitest, and Playwright packages.
It generates SvelteKit types, builds the isolated production-mode bundle, runs the
Chromium tests, and writes `experiments/unstaged-rendering/results.json`. It defaults
to this container's `/usr/bin/google-chrome`; set `BROWSER_EXECUTABLE_PATH` to another
installed Chromium executable when needed. `--no-sandbox` is the existing container
browser launch setting. No new package installation or preview service is required.
Set `PROBE_RESULTS` to an absolute output path for a comparison run that preserves the
committed evidence. Generated bundles are ignored. Results include exact package versions, source and
bundle SHA-256 hashes, Chromium version, and the source commit. The experiment's
source hash excludes generated files and results. This is an instrumented geometry
check, not a timing benchmark.

## Compared contracts

All three modes mount the same `Fixture.svelte`, using actual `AnimatePresence`,
`motion.div`, and `MotionConfig`. A 30-cell, 600px grid changes from 10 to 5 columns,
reverses its keys, and removes keys 0 and 5. MutationObserver samples each outgoing
node when it first becomes absolute. Every test also checks final DOM order. Passing
geometry means a maximum x/y/width/height deviation of 0.75px. The staged-parent
control intentionally publishes the ancestor columns immediately and the item list
through `createLayoutState` afterward. Ordinary mode uses one ordinary `$state.raw`
publication. Interrupted mode reverses, waits 90ms, then performs the combined update.

| Probe                                    |         Control | Batch interception |                    Compiler instrumentation |
| ---------------------------------------- | --------------: | -----------------: | ------------------------------------------: |
| Ordinary outgoing first-pop error        |        60.391px |            0.016px |                                     0.016px |
| Nested `flushSync` outgoing error        |        60.391px |            0.016px |                                     0.016px |
| Interrupted first-pop error              | about 422.797px |      below 0.407px | **Unqualified: prior animation suppressed** |
| Reorder animation present at 90ms        |             yes |                yes |                                      **no** |
| Mixed staged/unstaged parent             |           302px |          **302px** |                                     0.016px |
| Unrelated text update rectangle reads    |               0 |                 64 |                                          30 |
| Await branch insertion captured          |              no |             **no** |                    yes, instrumented branch |
| Native outro completion removal captured |              no |             **no** |                                      **no** |

The mixed-publication failure and compiler reorder suppression are deliberately
asserted as negative controls. The interruption prerequisite checks an active cell
transform after 90ms, before requesting exits. `interruptionQualified: false` records
why the compiler exit error cannot count as an interrupted-animation success. It is
not reported as an animation success just because the test command passes. Similarly,
async/native tests assert the exact uncovered mutation trace. These traces establish
missing interception boundaries; they are not claims of matching motion curves for
async or native transitions. The read counts measure synchronous work and its first
microtask only; they do not include later frame cache maintenance.

Survivor diagnostics expose another blind spot in the original exit-only acceptance.
At the first MutationObserver callback, batch and compiler ordinary updates can both
show about 543.6px displacement for a surviving cell. This alone is not a displayed
jump: by the first sampled requestAnimationFrame callback, batch ordinary/nested cells
have their projection transforms and return to 0px displacement in the recorded run.
The compiler survivors still show roughly 477–484px displacement at that frame. Its
late snapshot can therefore preserve outgoing exit boxes while starting survivor
projection from the wrong reordered positions. The report records both sampling
phases; rAF displacement is diagnostic because animation time advances, not an asserted
per-frame React parity metric. **The compiler combined update is not a whole-scene
success.**

## Approach 1: private batch interception

`probe-plugin.mjs` resolves Svelte's actual private batch module. `hooks.js` temporarily
replaces `Batch.prototype.flush`, captures before calling the original, drains managed
pop mutations, then commits projection. An experiment-only transform appends access to
Astra's existing private `snapshot`, `reconcile`, and `commit` functions during this
build. The library source on disk stays unchanged. The bridge deliberately does not
call `updateLayout(() => originalFlush())`, whose leading flush would recurse.

The reentry guard precedes snapshot callbacks. Explicit Astra transactions retain
ownership, and the guard remains active through the pop drain. Tests cover nested
`flushSync`, reentry from a snapshot callback, restoration of the exact original method,
version rejection, duplicate installation, and continued use after disposal.

The first dev-server attempt exposed a concrete integration failure: Vitest/Vite
prebundled public Svelte imports into a different module instance while the private
absolute import loaded another Batch class. Hook call count was zero. Dedupe alone and
top-level dependency exclusions were insufficient. The retained test uses one production
bundle and asserts nonzero batch interception. **This does not qualify dev-server,
HMR, SSR, multiple Svelte copies, or arbitrary application bundler integration.**

Batch interception improves ordinary synchronous commits. The 302px case spans two
publications: the hook closes after the immediate ancestor update, before the explicit
staged update. The later transaction therefore sees the changed parent. Extending the
transaction to a microtask might change that result, but would also change ownership
and error/async semantics; it is not silently folded into this prototype.

The await test observes `before` insertion while no capture is active. Svelte's promise
resolution renders a branch before its final flush. Native outro completion similarly
removes a node without passing through a new Batch flush. More private runtime hooks
would be needed for those paths.

## Approach 2: generated callback instrumentation

The post-compile Vite transform parses generated JavaScript, replacing selected
`$.template_effect`, `$.user_pre_effect`, `$.if`, `$.each`, and `$.await` calls with
wrappers. It targets **only Fixture.svelte**; Astra and all third-party components are
uninstrumented. The wrappers preserve arguments, return values, and callback `this`.
Snapshots run untracked so geometry policy reads cannot add reactive dependencies.

A stronger review falsified the initial compiler interruption claim. Snapshot-time DOM
order proves the hook is too late for reorder-only work: batch interception sees
`[0, 1, 2, ...]`, but the compiler hook sees `[29, 28, 27, ...]`. AnimatePresence's
uninstrumented child effects have already reordered the nodes before the instrumented
parent grid-style effect runs. The new snapshot measures those new positions, and the
transaction's observer acknowledgement suppresses the automatic cache-based fallback.
The unchanged control also snapshots after reordering, but its automatic path seeds
previous cached geometry first and still animates. At 90ms control and batch have
active transforms; the compiler has none. The previous small exit error was measured
after a snap, not during an animation. This failure is retained, not patched by quietly
expanding instrumentation to more cooperating components.

The first instrumented callback captures once, and an identity-checked microtask closes
the transaction after the remaining synchronous callbacks. That wider boundary is why
it also captures the mixed staged-parent update. Wrapping the await branch callback
captures its direct insertion. This is scoped cooperation, not evidence that every
Svelte mutation is instrumentable by these five wrappers.

Native transition completion happens inside runtime-relative calls and still escapes.
Uninstrumented ancestors, precompiled dependencies, bindings, custom DOM actions,
experimental async expressions, hydration and other compiler call shapes remain
unqualified. The transform has no usable composed sourcemap; it is a research build
transform, not a distributable plugin. Callback exception, cleanup exception, stale
microtask, and dispose/reinstall checks protect the experiment from contaminating the
next test.

## Decision and next stable baseline

Accept the isolated experiment and its executable negative controls as research
progress. The compiler probe is currently behavior-breaking even for this simple
reorder fixture, not merely incomplete for exotic updates. Do not enable either mechanism in the shipping runtime. The supported
production baseline remains explicit `updateLayout` / `createLayoutState` plus the
existing automatic caches.

A useful next qualification step is an uninstrumented-parent and precompiled-component
matrix plus a proper dev/HMR module-identity adapter. Async promise races, fork discard,
mount/hydration and native removal need explicit before/after/abort semantics. Both
approaches also snapshot all registered participants on unrelated updates, which is a
concrete O(n) cost in this fixture. A selective snapshot optimization must preserve the
current failures as controls rather than hide them with narrower workloads.
