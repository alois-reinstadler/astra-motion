# Strict consumer declaration check

Recorded on 2026-09-22. This check runs TypeScript with `skipLibCheck: false` in an independently installed tarball consumer. It is separate from the application check, which currently skips dependency declaration checking.

## Findings

The earlier consumer installed `motion@13.2.0` and Astra's direct `motion-dom@13.2.0`, but Motion's `framer-motion` range resolved to `13.4.0`. That package brought `motion-dom@13.3.0`; `motion-utils` resolved to `13.3.0`. Exact direct pins did not freeze the transitive graph.

Three diagnostics appeared:

- TS1149: Astra generated both `Motion.svelte.d.ts` and `motion.svelte.d.ts`. Renaming the internal component to `MotionComponent.svelte` removes this collision without changing its public `Motion` export. A package-contract regression checks generated declaration names for case collisions.
- TS2717: the two Motion DOM versions declared incompatible `Window.MotionCheckAppearSync` members. The duplicate engines also had different shared exports at runtime, so skipping type checks would not resolve the underlying problem.
- TS2552: upstream `framer-motion/dist/dom.d.ts` refers to `HTMLWebViewElement`, which the tested TypeScript DOM declarations do not define.

The freshly packed archive `30eb97b7fbabfc5dfc9736d1a094bbe63ec57f1901beecfb93758e61931050e9` was installed twice. The unqualified install failed the new dependency identity gate. With the fixture's reviewed overrides, the same archive passed engine identity, application type checking and production build. Strict checking then reported only the upstream `HTMLWebViewElement` diagnostic: the filename and duplicate-engine errors were gone.

The qualification fixture uses the following root `pnpm-workspace.yaml` settings:

```yaml
overrides:
  motion: 13.2.0
  motion-dom: 13.2.0
  framer-motion: 13.2.0
  motion-utils: 13.0.0
```

pnpm 11.24.0 explicitly ignored an attempted `package.json` `pnpm.overrides` field during reproduction; these settings must live in `pnpm-workspace.yaml`. See the [pnpm settings reference](https://pnpm.io/settings). The fixture's overrides do not propagate to consumers of Astra's package.

## Reproduce

```sh
pnpm run build
node scripts/prepare-motion-consumer.mjs
node scripts/check-motion-consumer-types.mjs /tmp/astra-motion-production-current.json /tmp/astra-strict-types.json
```

The diagnostic command does not install packages, start servers or launch browsers. It records the installed graph and full compiler output, preserving TypeScript's nonzero exit status. Keep the resulting report, the qualification file and the consumer lockfile with release evidence.

The local negative case was `/tmp/astra-motion-production-BO5ZfG/consumer`; the corrected fixture was `/tmp/astra-motion-production-gRS2TQ/consumer`. These temporary paths identify the run, not durable public artifacts. The parent release review should record the final candidate separately after integration.

## Remaining decision

Do not add a fabricated global `HTMLWebViewElement`, disable casing checks or claim strict declaration support based on `skipLibCheck: true`. TypeScript's [skipLibCheck documentation](https://www.typescriptlang.org/tsconfig/skipLibCheck.html) explains that this setting skips declaration checking; it does not repair the declarations.

A future upstream version or scoped dependency change must be reviewed against the adapter's imported APIs, shared runtime identities and consumer browser contracts before adoption. No dependency upgrade or upstream patch is included here. The beta currently needs the reviewed consumer overrides, and strict declaration compatibility remains a release blocker.
