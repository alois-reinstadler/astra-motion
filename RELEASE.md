# Release preparation

This candidate targets Svelte 5 with Motion-style components, coordinated presence, shared layout, gestures and lifecycle-owned reactive values. It does not promise complete parity with every current Motion API or Motion+ product.

The selected committed baseline already uses Motion/Framer Motion/Motion DOM 14.5.0 and Motion Utils 14.1.1. The platform catalog currently pins Motion 14.0.0: the major version aligns, the exact version does not. Keep the existing 14.5 integration and its compatibility fixes for qualification; do not downgrade just to match that catalog. The September parity and bundle records describe Motion 13 and are historical, not measurements of this candidate. See `docs/research/motion-14.5-upgrade-20261021.md` for the existing upgrade and its limitations.

MIT applies to Astra; bundled Motion notices are retained by `scripts/package-motion-engine.mjs`. Publication remains subject to owner review of the parity assessment, exact archive qualification, browser evidence and package identity. No publication is implied by version 0.1.0-rc.3.

## Owner checklist

- [ ] Select the exact source commit, version, package identity and archive hash.
- [ ] Resolve the limitations and inclusion decisions above.
- [ ] Run the repository gate on the final candidate and retain logs.
- [ ] Inspect packed exports, files, dependency closure and third-party notices.
- [ ] Verify public documentation and assets independently of local tests.
- [ ] Obtain separate publication approval; this preparation does not publish, tag or merge.
