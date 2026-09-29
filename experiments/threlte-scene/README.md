# Littlest Tokyo — Astra Field Notes

An isolated Svelte / Threlte port of Paul Henschel’s [ScrollControls GLTF scene](https://pmndrs.github.io/examples/scrollcontrols-gltf/), using **real installed Astra Motion** for scroll, cursor springs, derived scene values, and native DOM bindings. It preserves the original model, camera equations, half-clip scroll scrub, and model transform. The editorial story, cursor parallax, and lighting are additions; this is not a pixel-identical port.

## Run

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm dev --host 0.0.0.0 --port 4097 --strictPort
```

`--frozen-lockfile` preserves the reviewed dependency graph. `--host` accepts the managed container forwarding; `--port` uses this preview’s allocated port; `--strictPort` refuses a silently substituted port. Use the managed preview command below in this workspace rather than starting a second process on its occupied port. Outside this container choose your own free local port.

The nested workspace prevents installation into the repository’s shared dependency tree. The bundled Astra archive makes this experiment installable without building the library or using a registry prerelease. SHA256: `8c001390e0406e5e628873bcd5f4f2a8a026e372aa2037f20ccc6578fe88515f`. The archive predates the subsequent core migration; this experiment intentionally evaluates that exact package.

## Preview

Managed slug: `astra-motion-release-consumer`. [Open the tailnet preview](http://100.64.0.2:4097). Browser tools inside the container use `http://127.0.0.1:4097`.

```sh
dev-preview start astra-motion-release-consumer --cwd /workspace/wt/astra-rc-vgpu/experiments/threlte-scene -- pnpm exec vite dev --host '{host}' --port '{port}' --strictPort
```

`--cwd` selects this isolated app; the manager substitutes its allocated host and port. The server remains managed and running for review; container restarts require the same start command again.

## Interaction and ownership

- Native document scroll traverses three chapters and drives the original orbit and `Take 001` GLTF animation. Chapter links also work with a keyboard or touch.
- Mouse movement adds bounded camera parallax and slight model rotation. The left, center, and right buttons provide equivalent keyboard/touch inputs.
- The OS reduced-motion preference or **Still view** fixes the camera and clip at a stable pose; text remains readable by ordinary scroll.
- Threlte renders on demand. Astra MotionValue changes apply directly to the Three camera/model/mixer and invalidate the canvas. No per-frame Svelte state or permanent animation loop is required for the scene.
- **Pause 3D** unmounts the canvas and releases the scene’s subscriptions, decoder, animation mixer, geometries, materials, and textures. The scene owns its private GLTF instance; borrowed Astra values remain owned by component setup.
- No `vgpu`, React, Drei, or extra Motion engine is installed. This is an app integration, not a new general-purpose adapter.

## Rendering qualification

The app explicitly labels **WebGL2 · live 3D** only after loading the real model into Threlte. A browser without WebGL2 instead displays **Reference image · WebGL2 unavailable** and a credited screenshot from the original R3F scene. That screenshot is not a rendered result of this port. Asset/decode failures likewise produce an explicit error state.

The shared review Chrome could create neither WebGL nor WebGL2. Verified here: CPU Draco decoding of the actual GLB (71 decoded mesh objects from 57 GLTF mesh definitions), all 96 animation tracks at clip time 2.5s, native scroll/cursor/keyboard inputs, still mode, responsive fallback layout, package types, six focused tests, and production compilation. Real WebGL lighting/composition, GPU resource disposal, pause/reload rendering, frame rate, and physical touch-device behavior remain to be checked on a GPU-capable browser. No speed or GPU acceleration claim follows from this experiment.

On a capable device: inspect all three chapters, move the pointer, use keyboard view controls, toggle Still view and the OS reduced-motion setting, pause/reload 3D repeatedly, and inspect console/network errors. Confirm the renderer badge says live 3D. The shared browser verified the Still view branch; OS media preference wiring was source-reviewed, not independently emulated.

## Sources and licenses

- Source code: [pmndrs/examples at 890246ae49f1bf238dd9247795856bda1a35890f](https://github.com/pmndrs/examples/tree/890246ae49f1bf238dd9247795856bda1a35890f/examples/scrollcontrols-gltf), MIT. Attribution retained in `licenses/pmndrs-MIT.txt`.
- Model: [Littlest Tokyo by glenatron](https://sketchfab.com/models/94b24a60dc1b48248de50bf087c0f042), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). No geometry modifications; runtime scene transforms and lighting differ. In-app credits include the model source and license.
- Static image: original pmndrs example thumbnail, credited to Paul Henschel / pmndrs, depicting that same CC BY model. CSS crops and blends it into the fallback layout.
- Three.js: MIT; Draco decoder: Apache 2.0; Manrope and DM Sans: SIL Open Font License. License texts are included.

`assets.manifest.json` records exact local bytes, SHA256, origin, and attribution. Fonts and all model/decoder assets are local; the running scene needs no third-party asset service. The font upstream links use `main`; their exact downloaded bytes are identified by hashes.

Research and verification details: `../../docs/research/threlte-scene.md`. Evidence on this workstation: `/tmp/astra-next-20260929/scene/`.
