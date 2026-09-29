<script lang="ts">
	import { onMount } from 'svelte';
	import { T, useThrelte } from '@threlte/core';
	import {
		AnimationMixer,
		Group,
		Mesh,
		PerspectiveCamera,
		PCFSoftShadowMap,
		WebGLRenderer
	} from 'three';
	import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
	import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
	import type { MotionValue } from 'astra-motion';
	import { connectScene } from './scene-bridge.mjs';
	import { scenePose } from './scene-path.mjs';
	import { disposeModel } from './resources';

	let {
		pose,
		onstatus
	}: {
		pose: MotionValue<ReturnType<typeof scenePose>>;
		onstatus: (state: 'ready' | 'error', detail?: string) => void;
	} = $props();
	const { camera, size, invalidate, renderer } = useThrelte();
	const viewpoint = new PerspectiveCamera(62, 1, 0.1, 100);
	let city = $state.raw<Group>();

	onMount(() => {
		let alive = true;
		let loaded: Group | undefined;
		let mixer: AnimationMixer | undefined;
		let stop = () => {};
		const abort = new AbortController();
		const decoder = new DRACOLoader().setDecoderPath('/draco/').setWorkerLimit(1);
		const loader = new GLTFLoader().setDRACOLoader(decoder);
		const previousCamera = camera.current;
		camera.set(viewpoint);
		if (renderer instanceof WebGLRenderer) {
			renderer.shadowMap.enabled = true;
			renderer.shadowMap.type = PCFSoftShadowMap;
			renderer.toneMappingExposure = 1.15;
		}
		const resize = size.subscribe(({ width, height }) => {
			viewpoint.aspect = width / Math.max(height, 1);
			viewpoint.fov = width < 650 ? 72 : 62;
			viewpoint.updateProjectionMatrix();
			invalidate();
		});
		const load = async () => {
			try {
				const response = await fetch('/assets/littlest-tokyo.glb', { signal: abort.signal });
				if (!response.ok) throw new Error(`Model request failed (${response.status})`);
				const gltf = await loader.parseAsync(await response.arrayBuffer(), '/assets/');
				if (!alive) {
					disposeModel(gltf.scene);
					return;
				}
				loaded = gltf.scene;
				loaded.traverse((object) => {
					if (object instanceof Mesh) {
						object.castShadow = true;
						object.receiveShadow = true;
					}
				});
				loaded.scale.setScalar(0.02);
				loaded.position.set(0, 2.5, 0);
				mixer = new AnimationMixer(loaded);
				const clip = gltf.animations.find((animation) => animation.name === 'Take 001');
				if (!clip) throw new Error('The source model is missing Take 001');
				const action = mixer.clipAction(clip);
				action.play();
				city = loaded;
				stop = connectScene(
					pose,
					(next) => {
						viewpoint.position.set(next.position[0], next.position[1], next.position[2]);
						viewpoint.lookAt(0, 0, 0);
						loaded!.rotation.y = next.rotationY;
						// Absolute mixer time scrubs the original authored model animation.
						mixer!.setTime(clip.duration * next.clipFraction);
					},
					invalidate
				);
				onstatus('ready');
			} catch (error) {
				if (alive) onstatus('error', error instanceof Error ? error.message : String(error));
			}
		};
		void load();
		return () => {
			alive = false;
			abort.abort();
			stop();
			resize();
			decoder.dispose();
			if (loaded) disposeModel(loaded, mixer);
			if (camera.current === viewpoint) camera.set(previousCamera);
		};
	});
</script>

<T.HemisphereLight args={['#fff4d1', '#768376', 2.4]} />
<T.AmbientLight intensity={0.55} />
<T.DirectionalLight
	position={[12, 18, -10]}
	color="#fff0d1"
	intensity={3.1}
	castShadow
	shadow.mapSize={[1024, 1024]}
	shadow.camera.left={-10}
	shadow.camera.right={10}
	shadow.camera.top={14}
	shadow.camera.bottom={-10}
	shadow.bias={-0.0005}
/>
<T.DirectionalLight position={[-8, 5, 9]} color="#bfd4e8" intensity={1.8} />
{#if city}<T is={city} dispose={false} />{/if}
