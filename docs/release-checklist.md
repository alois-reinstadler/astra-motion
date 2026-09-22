# Release checklist

There is no publication step in CI. Treat a release as a specific commit, archive hash and dependency graph, with the results below attached to that candidate.

## Decisions

- [ ] Choose a license and add matching `LICENSE` and package metadata. Do not publish without this decision.
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

`--frozen-lockfile` prevents dependency resolution changes during repository installation. Preparing the consumer packs this checkout, installs it independently, verifies its dependency graph, checks its application types, builds it and stamps its identity. Keep its `qualification.json`, archive SHA-256 and install lockfile with the evidence.

- [ ] All checks above pass on the release commit.
- [ ] Run `node scripts/check-motion-consumer-types.mjs /path/to/qualification.json /path/to/strict-types.json`. This checks declarations with `skipLibCheck: false`, writes the complete diagnostics and exits nonzero on failure. An ordinary app check with `skipLibCheck: true` does not satisfy this gate.
- [ ] Execute CI's browser unit matrix and production E2E matrix for Chromium, Firefox and WebKit. Retain the run links and failure artifacts. Config discovery is not execution.
- [ ] Qualify the same packed consumer's exports, SSR, lifecycle and layout aftercare. Use explicit running server origins; see [package reproduction](research/production-package.md) and [lifecycle reproduction](research/production-lifecycle.md).
- [ ] Compare production bundles and review changes against the previous candidate.

CI owns its production preview process explicitly. Local configs use an existing preview and never start a server. The qualification scripts launch Playwright engines when explicitly executed; they cannot be run in an environment that permits only its shared Chrome. In that environment, record bounded shared-Chrome checks and leave the full matrix pending.

## Dependency boundary

The direct dependencies are `motion@13.2.0` and `motion-dom@13.2.0`. Their upstream ranges are broader. The reviewed qualification graph also requires `framer-motion@13.2.0` and `motion-utils@13.0.0`; the isolated test fixture records all four as pnpm overrides. Those fixture settings are not shipped to consumers. Beta consumers must apply the reviewed overrides themselves, as described in the README, until the distributable dependency strategy is resolved.

The installed-consumer gate checks versions, shared `motion-dom`/`motion-utils` installation paths and Motion export identity. A working demo is not sufficient evidence when this gate fails. Upgrades need a dependency review and a new browser qualification; do not silence duplicate-engine failures with TypeScript settings.

See [strict consumer typing](research/strict-consumer-types.md) for the reproduced failure and the scoped filename fix.

## Device qualification

- [ ] Test physical Safari and iOS, including interruption, navigation, focus, reduced motion and owner destruction. Playwright WebKit is useful coverage but does not replace these devices.
- [ ] Test slower hardware with realistic participant counts. Record device/browser, operation, frame timings and settling behavior.
- [ ] Exercise transformed ancestors, clipping, sticky containers, scroll during projection, rapid reversals and removal during exit.
- [ ] Keep the documented 500-participant limitation unless new measurements justify changing it.

## Publish the candidate

Only after the owner approves publication and the release gates above are resolved: pack the final commit, compare its contents with the qualified archive, publish that exact artifact and verify a fresh registry installation. Record the published version and hash in the release notes. Do not substitute an untested repack after qualification.
