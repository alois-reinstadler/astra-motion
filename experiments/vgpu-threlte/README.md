# GPU motion integration study

Experimental, private package. No dependency or export is added to Astra core.

The managed preview is [GPU motion study](http://100.64.0.2:4099). Its allocation slug is `astra-review-consumer`, reused with coordination after the previous review stopped. The local browser URL is `http://127.0.0.1:4099`.

Install from this directory with `pnpm install --frozen-lockfile`; `--frozen-lockfile` requires the recorded dependency graph. Run `pnpm check`, `pnpm test`, and `pnpm build`. The Node-only optional GPU adapter build scripts are deliberately disabled; this experiment uses browser vgpu and its mock in Node tests.

Start a managed preview from this directory:

```sh
dev-preview start astra-review-consumer -- pnpm exec vite dev --host '{host}' --port '{port}' --strictPort
```

The manager substitutes its allocated host and port; `--strictPort` rejects an occupied port instead of selecting another. The allocation must first be stopped if its command or directory changes.

Try Animate / reverse, Stop, the two animation drivers, Instant / reduced motion, and Unmount / Mount. Inspect reports actual uniforms and writes/draws, not estimated FPS. vgpu uses a fixed 640 × 360 surface; the CPU reference uses 320 × 180. These are not benchmark workloads. Threlte uses its normal responsive WebGL2 canvas at DPR 1. GPU backends must not be compared using these counters as a speed measurement.

The shared headed Chrome could not create a WebGPU adapter or a WebGL2 context. The preview explicitly shows that fact and renders a labeled Canvas2D reference. GPU rendering is implemented and type-checked but **not device-verified**. WebGPU also requires a secure context: the tailnet HTTP URL cannot establish WebGPU support on another device. Run on localhost or an already approved secure preview for that check; no network change was made.

Evidence lives in `evidence/`: browser results, console/network capture, desktop/mobile screenshots, checks/build/tests, source/dependency hashes and a reproducible browser check. `verifyExperiment()` is evaluated through the headed Chrome MCP on the local dev URL. It waits for Motion's `postRender` phase and endpoint predicates, never timed sleeps. A stopped animation can queue one final sampled value; the renderer flushes it once before going idle.

The `vgpu/mock` test checks actual published vgpu shared uniforms and actual `motion/vgpu` batching; it is not a GPU renderer test. The `motion/three` test establishes that existing Three uniforms already work without an Astra adapter.

The Svelte autofixer reports no compiler issues. It suggests reviewing imperative calls in the two effects that synchronize Tween values with external renderers. This is intentional: `frame.render()` schedules a render, and Threlte's inspected `invalidate()` sets a plain frame-invalidated boolean; neither derives or writes reactive Svelte state. The checks remain strict with zero diagnostics.

See [Research and recommendation](../../docs/research/vgpu-threlte.md).
