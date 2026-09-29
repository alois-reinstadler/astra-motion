# vgpu / Threlte investigation

Date: 2026-09-29. Baseline: Astra `c2f1795`; isolated branch `agent/astra-rc-vgpu`.

Recommendation: keep this as an experiment and publish a recipe before adding a core adapter. For an existing Threlte scene, use Svelte's Tween/Spring for simple state animation or Motion's existing `threeEffect` for MotionValues and mixed timelines. Direct vgpu is useful when the application already needs WGSL effects or compute. A new renderer is not justified by animation alone.

## Evidence and actual public surface

| Finding                                                             | Classification                  | Evidence                                                                                                                                                       |
| ------------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `motion/vgpu` and `motion/three` are public in pinned Motion 13.4.4 | Confirmed source                | Installed `motion/package.json` exports and shipped ESM/type declarations; hashes retained                                                                     |
| vgpu integration is inaccessible Motion+ functionality              | Outdated claim                  | Current [official vgpu documentation](https://motion.dev/docs/vgpu) includes installation and public imports; older search excerpts still mention early access |
| vgpu means NVIDIA virtual GPU                                       | Incorrect identity              | This is [Vercel Labs' WebGPU library](https://github.com/vercel-labs/vgpu), published as `vgpu`                                                                |
| Motion integration makes Svelte updates run on the GPU              | Unsupported claim               | The inspected effect samples MotionValues in JavaScript and batches `set()` in Motion's `preRender` phase                                                      |
| A separate Astra adapter is needed to animate Threlte objects       | Unsupported for tested uniforms | Public `motion/three` already updates Three-style uniform objects; direct test passes                                                                          |
| GPU rendering works on this test machine                            | Not established                 | Headed Chrome exposes `navigator.gpu`, but adapter request returns null; WebGL2 context creation also fails                                                    |

The installed Motion effect maps nested binding paths, scene transforms, vector axes and colors into vgpu setters. It batches fields for each subject before rendering. Its shadow values help recover unreadable uniform starting values; the first animation of such a uniform needs explicit keyframes. Tests confirm two simultaneous shared-uniform changes produce exactly one setter call and effect detachment prevents subsequent writes. These are integration results, not GPU performance measurements.

Benefits beyond 3D include fullscreen image effects, gradients, postprocessing and shader-controlled visualization. vgpu also exposes compute/storage facilities, but this experiment does not measure them. Its [effect reference](https://vgpu.sh/docs/reference/vgpu/effect.md) describes fullscreen fragment passes without application-authored mesh geometry. Its [published repository](https://github.com/vercel-labs/vgpu) covers additional compute and visualization domains. No undocumented premium API was copied.

## Existing overlap and options

| Route                                  | Useful when                                                       | Work and maintenance                                                                                                               | Limits                                                                             |
| -------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Direct vgpu + `vgpuEffect`             | The application already uses WGSL effects, compute or vgpu scenes | Own GPU/surface lifetime, render scheduling, capability fallback, uniform starting values and shader compatibility                 | WebGPU availability and secure context; no Threlte component/lifecycle abstraction |
| Existing Threlte + Svelte Tween/Spring | Small reactive transform/uniform changes                          | Existing declarative ownership; ordinary `.current` props and on-demand invalidation                                               | Cross-DOM timeline coordination requires application code                          |
| Existing Threlte + `threeEffect`       | Reuse MotionValues, transitions and timelines across DOM/Three    | Bind real Three objects; render after Motion writes; detach owned effects and stop only owned playback                             | Two schedulers need an explicit ordering/invalidation bridge                       |
| New Astra Threlte adapter              | Repeated integration demands a reusable lifecycle bridge          | Peer-version matrix, SSR/client boundaries, context lookup, pause/Activity policy, teardown, invalidation and renderer differences | Mostly wraps existing effects; no measured unique capability yet                   |

Threlte already supplies [task ordering and on-demand invalidation](https://threlte.xyz/docs/reference/core/use-task/). Its [first-scene guide](https://github.com/threlte/threlte/blob/main/apps/docs/src/content/learn/getting-started/your-first-scene.mdx) uses Svelte Spring directly on scene props. [Threlte's ecosystem](https://threlte.xyz/) includes Theatre.js, physics and asset tooling. Motion's [Three.js integration](https://motion.dev/docs/three) includes material properties, uniforms and TSL nodes, alongside DOM sequences. Three's [WebGPURenderer](https://threejs.org/docs/pages/WebGPURenderer.html) can fall back to WebGL2; that does not make arbitrary vgpu WGSL code portable to the same fallback. The installed Threlte package also exports `@threlte/core/webgpu`; current docs and installed declarations must be consulted together because the ecosystem is moving.

## Proof of concept

[Source and run instructions](../../experiments/vgpu-threlte/README.md). [Managed preview](http://100.64.0.2:4099).

The same radial 2D field is expressed in WGSL and GLSL. vgpu has two uniforms animated through Motion; the Threlte scene lets the reviewer switch between native Svelte Tween and the public `threeEffect`. Rendering is invalidated on changes, not kept alive by an unconditional demo animation loop. A labeled Canvas2D reference appears only when WebGL2 is unavailable; it uses the same field equation and drivers. It is never presented as vgpu or Threlte rendering.

The primary practical result is reuse: scalar shader animation already works with Svelte, and Motion's existing effects provide a shared animation contract plus vgpu setter batching. This example does not demonstrate a reason to add an Astra-specific renderer API.

The package is isolated with an exact manifest and its own lockfile. Production output includes Three, Svelte and Motion plus a lazy vgpu chunk; build logs retain actual sizes. These sizes describe this complete experiment, not incremental Astra overhead. It intentionally does not import Astra's unpublished source or duplicate its bundled animation engine.

## Executed verification and limits

- Strict Svelte/TypeScript check: zero errors and warnings.
- Node integration tests: 2/2; real published vgpu mock subject and public Motion effect; Three uniform writes and detachment.
- Production build: passed; exact output and hashes retained in `experiments/vgpu-threlte/evidence/`.
- Shared headed Chrome 152: completed/reversed both CPU-reference drivers, stop stability after defined pending-write flush, unmount/remount, reduced-motion endpoint, desktop/mobile layout screenshots and no horizontal overflow.
- Final browser console: no application errors; browser warning `No available adapters` retained. Network requests completed with 200/304 responses.
- GPU rendering, GPU timing, physical devices, Safari/Firefox, device loss/recovery, Activity suspension and SSR/hydration were **not verified**. This is a client-only experimental Vite app, not a supported Astra package entry point.

A browser with real backend support must verify both shader paths before promoting the recipe beyond experimental status. A fair performance study would require equal render resolution, device, color/output pipeline and workload, plus separate CPU scheduling, GPU timing and power measurements. The current evidence supports no speed claim.

## Ownership and future integration

The vgpu attachment owns its GPU and surface. It handles delayed initialization after detachment, cancels its draw callback, stops its own playback and disposes the GPU. Threlte owns scene disposal; the animation bridge only owns its controller and scheduled invalidation. The demo never receives externally owned playback, so it makes no claim about safely adopting it. The reduced-motion control resolves instantly; application-level Activity behavior needs a policy bridge before any production adapter.

For release preparation, keep this directory outside package `files` and core exports. Do not add `vgpu`, Three or Threlte to Astra dependencies. If a future feature adds an adapter, avoid importing a second Motion engine beside Astra's bundled engine, define scheduler and ownership contracts first, and qualify a supported version matrix with real devices.
