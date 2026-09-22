# Changelog

## Unreleased

Astra Motion remains a working beta. These notes describe repository changes, not a published release.

### Scope

- Keep animation on Motion's engine. Remove the experimental CSS backend, its entry point, engine selector and examples.
- Retain the full and lite state bindings, native Svelte transitions, presence coordination, layout projection, values, scroll and route helpers.

### Fixes

- Cancel owned press sessions when the window loses focus.
- Stop drag work when a start callback disposes its owner, and release projection blocking.
- Validate changing drag bounds before using them.
- Give the optional Motion component an internal filename distinct from the state module, avoiding a generated declaration collision on case-insensitive paths. The public `Motion` export is unchanged.

### Documentation and qualification

- Add project scope and status pages, clearer installation guidance and mobile reading improvements.
- Configure site metadata through `PUBLIC_SITE_URL`; previews stay out of search indexes until an origin is provided.
- Add production E2E jobs for Chromium, Firefox and WebKit, with preview readiness checks, teardown and failure artifacts. Execution on the final candidate is still required.
- Save component-test screenshots inside the checkout instead of a developer-specific absolute path.
- Require explicit qualification origins and externally managed servers.
- Check the installed consumer's Motion versions and shared engine identity. Exact direct pins do not constrain upstream transitive ranges; the beta consumer fixture uses explicit overrides for the reviewed graph.

### Before release

The license and publication decision are pending. Strict dependency declarations still need qualification, and physical Safari/iOS plus slower-device checks remain outstanding. Follow the [release checklist](docs/release-checklist.md); older reports are not evidence for a new candidate.
