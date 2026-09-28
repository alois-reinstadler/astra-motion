# Installed package qualification

The consumers in this directory install the tarball produced by `pnpm pack`. They never resolve Astra through a repository source alias. Their dependency versions are pinned independently of the documentation app.

`consumer/` is the existing SvelteKit application, including legacy state/layout/presence/route regressions. Its export page checks the reviewed runtime inventory for all 19 public entries. The `native-view` subtree uses the isolated `view-navigation` integration; it is deliberately absent from the plain application.

`plain-consumer/` has no SvelteKit, React, or upstream Motion dependency. It checks strict declarations with `skipLibCheck: false`, then builds seven independent client/server applications. `Parity` exercises component composition and teardown. The other six fixtures measure eager components, deferred basic/full features, synchronous basic features, hybrid animation, and mini animation. `@fixture` selects a local test component only; Astra resolves through the installed package export map.

Run from the repository root:

```sh
node scripts/prepare-motion-consumer.mjs --output=/tmp/astra-consumer.json
MOTION_BROWSER=chromium node scripts/qualify-packed-motion-ci.mjs /tmp/astra-consumer.json artifacts/packed-consumer
```

The `--output` option writes the archive and consumer provenance to a chosen file so concurrent qualification runs do not share a mutable pointer. Omit `MOTION_BROWSER` to run all three browsers; set it to `chromium`, `firefox`, or `webkit` to use a CI matrix allocation. The runtime command owns temporary loopback test servers and closes them and its browsers before returning. It does not allocate a persistent development preview.

For a focused packaging iteration, `--consumer=plain` or `--consumer=kit` prepares just that application. The same option on `qualify-packed-motion-ci.mjs` selects the corresponding runtime check. Both commands default to checking both applications. `qualify-packed-motion-runtime.mjs` is the underlying plain-consumer runner.

The bundle report includes minified bytes and per-file gzip/Brotli sizes, exact versions, tarball SHA-256, chunk imports, and emitted module lists. These are complete test application assets, including Svelte and bootstrap code. Initial shared chunks are counted once in their own application; totals from separate fixtures are not additive and are not library-only sizes. The basic feature graph retains Motion's small shared drag-active flag for hover/press arbitration; it excludes the drag/pan implementation and projection nodes.

`reviewed-exports.json` records intentional public runtime exports, not an automatically accepted build snapshot. The parity expansion adds the requested components, managed helpers, animation controls, supporting primitives, and isolated feature/helper entries. The `m` inventory mirrors the reviewed 168 HTML/SVG tag list plus `create`; type-only exports are checked separately by both consumers. Update this inventory only after reviewing an intentional API change.

The browser gate checks SSR output, hydration errors, typed input and DOM/ref retention across deferred loading, actual network deferral, latest targets, owned frame/subscription cleanup, Activity pause/reveal, presence completion, trusted external drag with focus transfer, controlled Reorder, asynchronous view fallback, and scoped playback settlement. It also compares served JavaScript bytes with the built files and installed package bytes with the archive. CI preserves the existing source browser suites and adds a packed-consumer matrix.
