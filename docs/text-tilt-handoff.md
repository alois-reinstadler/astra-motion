# Text and Tilt integration handoff

This change belongs to Astra only. Bedrock's dependency, vendored runtime and
presentation components were not changed. Nothing was published.

## Imports and ownership

```svelte
<script lang="ts">
	import { TextReveal, TextSwap } from 'astra-motion/text';
	import { Tilt } from 'astra-motion/tilt';
	import { MotionConfig, motion } from 'astra-motion';
	let label = $state('Continue');
</script>

<MotionConfig reducedMotion="user">
	<TextReveal as="h2" text="A complete heading" effect="blur" split="words" stagger={0.035} />
	<button
		onclick={() => {
			label = label === 'Continue' ? 'Saved' : 'Continue';
		}}
	>
		<TextSwap text={label} size="reserve" alternatives={['Continue', 'Saved']} mode="wait" />
	</button>
	<motion.div layout initial={{ opacity: 1, y: 12 }} animate={{ opacity: 1, y: 0 }}>
		<Tilt maxRotateX={8} maxRotateY={10}><article>Keep native controls here.</article></Tilt>
	</motion.div>
</MotionConfig>
```

`/text` exports `TextReveal`, `TextSwap` and the `TextRevealProps`, `TextSwapProps`,
`TextMotionOptions`, `TextEffect`, `TextSplit`, `TextDirection`, `TextHost` types.
`/tilt` exports `Tilt`, `TiltProps` and `TiltOptions`. Root exports are unchanged.
The complete contracts are [Text motion](text-motion.md) and [Tilt](tilt.md).

Replace Bedrock's temporary pointer/MotionValue tilt wrapper with `Tilt`, keeping
its outer entrance/layout motion and its existing styled content. The inner
rotation and outer motion must own separate elements. New native bindings should
use `motion.bind`; this change adds no `createMotion` usage. The independently
coordinated legacy removal and Threlte experiment are outside this source candidate.

For signatures, retain `motion.path`/`pathLength` and the existing SVG example;
Bedrock owns presentation. No new drawing helper is needed.

## Qualification record

The intermediate candidate is based on `cc59b8f4759f2be86d3a0b3b90a44d83781f337d`
plus the text/Tilt source and consumer-check changes, packed before their commit
with `source.dirty: true`. The base commit alone does not contain these changes.
This is an internal qualification artifact, not the combined release archive.

- Archive: `/tmp/astra-motion-production-2hFWwM/astra-motion-0.1.0-rc.1.tgz`
- SHA-256: `28fd97e90060b30a2ec00518f86ec1c432ecefca3f1382fcc8ee0291158b2025`
- Size: 414902 bytes
- Retained provenance: `/tmp/astra-text-tilt-qualified.json`
- Packed runtime and production module graphs: `/tmp/astra-text-tilt-packed/`

Verification passed:

- Type checks, guide checks, lint, production build and package checks.
- 253 server tests across 58 files.
- 17 focused source tests per browser in Chromium, Firefox and WebKit (51 total).
- The canonical documentation text replay test in Chromium.
- Six packed runtime cases: Text and Tilt in each of Chromium, Firefox and WebKit,
  all against the exact archive hash above. Assertions cover Unicode SSR/hydration,
  accessible labels, host identity and focus, reserved/fixed sizing, live reduced
  motion, native controls, pointer springs and disabled-state neutralization.
- Independently installed plain Svelte and SvelteKit consumers passed strict
  declarations (`skipLibCheck: false`), Svelte checks and production builds.
  Production module graphs passed optional-entry isolation checks.

The build reports declaration naming warnings in non-shipped fixture/site files
and a svelte-package `import.meta.env` warning; publint and installed consumers pass.
The complete existing packed browser matrix is reserved for combined rc.2 release
qualification; the six focused cases above do not replace that matrix.

The local preview is `/motion-lab/text-tilt`; the text documentation's live example
now uses both text components. Shared Chrome evidence includes desktop and 390 px
mobile screenshots, native interactions, policy changes and no console errors.
Screenshots are local diagnostic artifacts, not a physical-device performance claim.

## Release and Bedrock qualification

The coordinated release must preserve the earlier RC1 artifact and use **rc.2** for
the combined archive. Do not install this intermediate archive into Bedrock.

1. Integrate text/Tilt alongside the release thread's legacy removal and separate
   Threlte experiment. Review overlaps in `package.json`, public export inventories,
   consumer fixtures/scripts, README and guide source. Keep `/text` and `/tilt` as
   optional entries while applying the release thread's `/state` migration.
2. Set the combined candidate version to `0.1.0-rc.2`. Run `pnpm check`,
   `pnpm check:guide`, `pnpm lint`, server and browser suites, `pnpm build` and
   `pnpm check:package`. The package check produces independently installed plain
   Svelte and SvelteKit consumers with strict `skipLibCheck: false` declarations.
3. Read the new provenance file from `/tmp/astra-motion-production-current.json`.
   Retain its exact archive path/SHA-256, source revision and dirty-state record;
   use those bytes for every subsequent check. The production graph checks prove
   neither optional entry imports the other, the root factory barrel, Kit/React
   or a second Motion engine. Tilt also excludes drag and projection-node runtime.
4. Run packed runtime qualification for Text and Tilt in each available browser:
   `MOTION_BROWSER=chromium node scripts/qualify-packed-motion-ci.mjs /path/to/setup.json /path/to/results --consumer=plain --fixture=Text`,
   then `--fixture=Tilt`; repeat for Firefox and WebKit. `MOTION_BROWSER` chooses
   the engine, `--consumer=plain` selects the plain Svelte consumer, and `--fixture`
   selects the named fixture. The full candidate still needs the complete consumer
   matrix, not only these focused additions.
5. In an isolated Bedrock integration checkout, the Bedrock owner can then update
   the dependency to that exact rc.2 archive, update the lockfile/vendor according
   to Bedrock's own workflow, and rerun type/lint/build/browser checks. Exercise
   rapid text replacement, multiline sizing, SSR without JavaScript, focus,
   reduced-motion toggles, Activity cleanup and tilt within existing layout motion.
   Installing, vendoring and publishing remain actions for that integration phase.

No automatic measured line splitting, rich interactive text animation, guaranteed
font shaping across fragments, arbitrary external 3D pointer mapping, or mobile
GPU/performance qualification is claimed. Sync interruption deliberately snaps the
third request; known alternatives or explicit dimensions are required to reserve
stationary layout. For this environment, source `/tmp/astra-rc-20260929/browser-env.sh` before
WebKit checks; it selects retained browser binaries and extracted host libraries
without changing machine packages.
