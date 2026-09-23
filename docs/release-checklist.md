# Release checklist

There is no publication step in CI. Treat a release as a specific commit, archive hash and dependency graph, with the results below attached to that candidate.

## Decisions

- [x] MIT selected; matching `LICENSE` and package metadata are included.
- [ ] Confirm the package name, version and registry access with the owner; registry availability is not established by a local tarball.
- [ ] Review the unreleased notes and commit the intended changes.
- [ ] Choose a public site origin when ready. This is separate from package qualification; without `PUBLIC_SITE_URL`, the site intentionally remains unindexed.

## Automated checks

Run from a clean checkout with pnpm and the committed lockfile:

```sh
pnpm install --frozen-lockfile
pnpm run check
pnpm run check:guide
pnpm run lint
pnpm run test:server
node --test scripts/qualification-origin.test.mjs
node scripts/check-motion-upgrade.mjs
pnpm run build
node scripts/prepare-motion-consumer.mjs
```

`--frozen-lockfile` prevents dependency resolution changes during repository installation. Preparing the consumer packs this checkout, installs it independently, verifies its dependency graph, checks application types and strict dependency declarations, builds it and stamps its identity. Keep its `qualification.json`, archive SHA-256 and install lockfile with the evidence.

- [ ] All checks above pass on the release commit.
- [ ] Run `node scripts/check-motion-consumer-types.mjs /path/to/qualification.json /path/to/strict-types.json`. This checks declarations with `skipLibCheck: false`, writes the complete diagnostics and exits nonzero on failure. An ordinary app check with `skipLibCheck: true` does not satisfy this gate.
- [ ] Execute CI's browser unit matrix and production E2E matrix for Chromium, Firefox and WebKit. Retain the run links and failure artifacts. Config discovery is not execution.
- [ ] Qualify the same packed consumer's exports, SSR, lifecycle and layout aftercare. Use explicit running server origins; see [package reproduction](research/production-package.md) and [lifecycle reproduction](research/production-lifecycle.md).
- [ ] Compare production bundles and review changes against the previous candidate.

CI owns its production preview process explicitly. Local configs use an existing preview and never start a server. The qualification scripts launch Playwright engines when explicitly executed; they cannot be run in an environment that permits only its shared Chrome. In that environment, record bounded shared-Chrome checks and leave the full matrix pending.

## Dependency boundary

The distributable includes one DOM-only engine: motion-dom and framer-motion DOM
13.2.0 plus motion-utils 13.0.0. These are exact build dependencies, not ranges for
consumer package managers to resolve. The qualification app has no Motion overrides
or direct Motion dependencies. Svelte is the required peer; Kit is optional unless
the routes entry is used.

`package-motion-engine.mjs` preserves the upstream ESM boundaries and licenses,
rewrites imports to one packaged engine and records version/source-hash provenance.
Its only upstream declaration correction removes the unsupported Electron `webview`
member; no replacement global DOM type is introduced. Runtime algorithms are
unchanged. Review this transformation whenever the upstream pins change.

The installed-consumer gate checks exact versions, absence of unresolved upstream
imports, and shared engine identity including public MotionValues. Import values
from Astra; a separately installed engine is outside this identity contract.
Compare the tarball size and the downstream feature bundles independently: the
archive now contains dependencies that were previously downloaded separately.

The [historical strict typing report](research/strict-consumer-types.md) records the
original upstream failure. The current candidate must pass strict checking without
that workaround, then pass browser qualification using the same packed archive.

## Device qualification

- [ ] Test physical Safari and iOS, including interruption, navigation, focus, reduced motion and owner destruction. Playwright WebKit is useful coverage but does not replace these devices.
- [ ] Test slower hardware with realistic participant counts. Record device/browser, operation, frame timings and settling behavior.
- [ ] Exercise transformed ancestors, clipping, sticky containers, scroll during projection, rapid reversals and removal during exit.
- [ ] Keep the documented 500-participant limitation unless new measurements justify changing it.

## Publish the candidate

Only after the owner approves publication and the release gates above are resolved: pack the final commit, compare its contents with the qualified archive, publish that exact artifact and verify a fresh registry installation. Record the published version and hash in the release notes. Do not substitute an untested repack after qualification.
