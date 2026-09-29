// Same screen-space field in WGSL and GLSL; no meshes or particles to update on the CPU.
export const wgsl = `
struct Params { progress: f32, intensity: f32 }
@group(0) @binding(0) var<uniform> params: Params;
@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = uv * 2.0 - 1.0;
  let ripple = 0.5 + 0.5 * sin(length(p) * 18.0 - params.progress * 12.0);
  let band = smoothstep(0.2, 0.8, ripple) * params.intensity;
  let color = mix(vec3f(0.035, 0.055, 0.12), vec3f(0.25, 0.85, 0.7), band);
  return vec4f(color, 1.0);
}`;
export const vertexShader = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
export const fragmentShader = `
uniform float progress;
uniform float intensity;
varying vec2 vUv;
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float ripple = 0.5 + 0.5 * sin(length(p) * 18.0 - progress * 12.0);
  float band = smoothstep(0.2, 0.8, ripple) * intensity;
  gl_FragColor = vec4(mix(vec3(0.035, 0.055, 0.12), vec3(0.25, 0.85, 0.7), band), 1.0);
}`;
export interface DemoController {
	play(target: number, reduced: boolean): void;
	stop(): void;
	snapshot(): Record<string, unknown>;
}
