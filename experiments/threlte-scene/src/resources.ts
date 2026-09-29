import { AnimationMixer, Material, Mesh, Object3D, Texture } from 'three';
/** This app loads a private GLTF instance, not a shared loader cache. */
export function disposeModel(root: Object3D, mixer?: AnimationMixer) {
	mixer?.stopAllAction();
	mixer?.uncacheRoot(root);
	const geometries = new Set<Mesh['geometry']>();
	const materials = new Set<Material>();
	const textures = new Set<Texture>();
	root.traverse((object) => {
		if (!(object instanceof Mesh)) return;
		geometries.add(object.geometry);
		for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
			materials.add(material);
			for (const value of Object.values(material))
				if (value instanceof Texture) textures.add(value);
		}
	});
	for (const texture of textures) {
		texture.dispose();
		const image = texture.source?.data;
		if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) image.close();
	}
	for (const material of materials) material.dispose();
	for (const geometry of geometries) geometry.dispose();
}
