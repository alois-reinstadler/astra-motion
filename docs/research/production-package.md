# Production build and packed consumer qualification

2026-09-05. The library was built, packed, independently installed, typechecked,
compiled for production, and exercised through the resulting Node server.

## Build failures corrected

The first application build failed because adapter-static had no prerendered
routes. The documentation/demo site now declares its finite routes as prerendered
at the root layout. Its product navigation fixture only reads the optional delay
query in the browser: that delay tests client navigation and does not change the
static page contents. The next complete site build succeeded.

Package scripts now use pnpm consistently. The published file allowlist includes
only the root entry and `dist/motion`, excluding tests. It no longer includes
unexported design-system components, laboratory fixtures, documentation components
or showcase source. Existing source components remain in the repository.

This follows Svelte's [packaging model](https://svelte.dev/docs/kit/packaging):
preprocess components and emit declarations with `svelte-package`, then verify the
export map and the actual packed files. `publint --pack false --strict` passes.
The package compiler reports a Vite-specific `import.meta.env` warning from an
excluded lab test; that test is absent from the archive and consumer.

## Independent consumer

`scripts/prepare-motion-consumer.mjs` performs the repeatable setup:

1. `pnpm pack` runs the actual package lifecycle.
2. Copy `tests/production/consumer` to a fresh temporary directory.
3. Install the tarball as `file:./astra-motion.tgz` with independent `node_modules`.
4. Run SvelteKit sync and `svelte-check --fail-on-warnings`.
5. Build with adapter-node for actual production SSR and streaming.

There are no aliases or links back to repository source. The app exercises all ten
package exports, complete authoring examples, native custom-component forwarding,
SSR, local motion, lifecycle fixtures and large participant workloads. React and
React DOM are absent from the installed dependency tree.

The qualified archive is **41,671 bytes**, with **58 files**. Its SHA-256 is
`10db85792911a9a5b49af9b0eee0ff797c806351dd730a66d6ba3f95c3e12745`.
The installed copy is `/tmp/astra-motion-production-a2BJGU/consumer`.

The final runner recomputes the archive hash, compares the copied tarball and all
58 installed files byte-for-byte, and checks exact runtime namespace members
against `tests/production/reviewed-exports.json`. A generated build identity hashes
65 client assets and 93 server files; the served identity and each requested
asset's response bytes must match the local production output. This closes the
independent review's original provenance and export-coverage gaps. Namespace
coverage verifies symbols exist; behavior is covered by the relevant fixtures.

The packed checks pass **21/21 cases** across Chromium, Firefox and WebKit:
all export namespaces render and hydrate; initial=false renders opacity/position
on the server; retargeting works; optional bindings preserve the actual edited and
focused input; full/lite native presence reverses and destroys correctly; automatic
projection survives production optimization; MotionValues update Svelte; and the
SSR component remains correctly styled with JavaScript disabled. No browser errors
or hydration mismatch was recorded. Svelte consumer checking reports zero errors
and warnings with the usual `skipLibCheck: true` configuration.

### Strict declaration gate: upstream failure

An additional TypeScript source imports every public entry, and
`pnpm run check:declarations` checks the dependency declarations with
`skipLibCheck: false`. After supplying the consumer's missing Node type dependency,
this produces exactly one error: `framer-motion@13.2.0/dist/dom.d.ts:314` references
the undefined global `HTMLWebViewElement` in its exported HTML element map.
The path is reached through the official vanilla `motion` types; no React import
is involved. This is a real strict-consumer compatibility limitation. No ambient
shim, dependency patch or suppressed diagnostic was added to hide it. Normal
Svelte checking and runtime qualification pass; the stricter release gate remains
failing until the upstream declaration is corrected. See the minimal reproduction
in the [dependency report](dependency-hardening.md).

## Actual cold production assets

These are the JS and CSS immutable assets requested by a fresh browser context for
each consumer route. They include SvelteKit and the example. Gzip is calculated per
file, maps and HTML are excluded, and no CDN compression settings are assumed.
The increment over the baseline includes additional Svelte helpers, example code,
styles and chunk/compression boundaries; it is not an exact isolated library cost.

| Route / feature       | Total gzip bytes | Above plain Kit page |
| --------------------- | ---------------: | -------------------: |
| Plain SvelteKit       |           39,375 |                    — |
| Policy                |           39,674 |                  299 |
| Wait + fade presence  |           41,440 |                2,065 |
| Layout                |           77,736 |               38,361 |
| Lite state            |           70,064 |               30,689 |
| Full state            |           85,807 |               46,432 |
| MotionValue bindings  |           48,957 |                9,582 |
| Scoped animation      |           67,182 |               27,807 |
| Scroll                |           69,505 |               30,130 |
| Routes                |           41,623 |                2,248 |
| Every export retained |          100,249 |               60,874 |

Route totals are not additive. The source-only, host-externalized feature experiment
remains useful for library comparison, but these numbers describe a real production
consumer. Complete assets, raw/gzip/Brotli sizes, package audit and browser cases:
[production-package-validation.json](production-package-validation.json).

## Reproduce

```sh
pnpm run build
node scripts/prepare-motion-consumer.mjs
# Read /tmp/astra-motion-production-current.json for the copied consumer path.
# In that directory, start the built Node server:
HOST=127.0.0.1 PORT=5290 ORIGIN=http://127.0.0.1:5290 node build
# From the library repository:
node scripts/qualify-motion-package.mjs
```

Run root sync/check/server tests before browser qualification, not alongside it:
Kit generation can reload an active development page. Production consumers have
separate outputs. The [lifecycle report](production-lifecycle.md) covers real BFCache,
HMR and deferred route content; the [dependency report](dependency-hardening.md)
covers the pinned upstream integration contracts.

This is local release qualification, not registry publication. The package version
and licensing/distribution decisions have not been changed.
