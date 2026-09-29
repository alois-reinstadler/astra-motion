/** Clamp document progress and input to finite normalized coordinates. */
export function clamp01(/** @type {number} */ value) {
	return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}
/**
 * Port of Paul Henschel's ScrollControls GLTF camera/clip mapping (MIT).
 * Original offset is 1 - scroll.offset; camera equations and half-clip scrub
 * are preserved. Cursor parallax, framing margin and quiet view are additions.
 * @param {number} progress
 * @param {number} cursorX
 * @param {number} cursorY
 * @param {boolean} reduced
 */
export function scenePose(progress, cursorX = 0, cursorY = 0, reduced = false) {
	const offset = reduced ? 0.85 : 1 - clamp01(progress);
	const px = reduced ? 0 : Math.max(-1, Math.min(1, cursorX || 0));
	const py = reduced ? 0 : Math.max(-1, Math.min(1, cursorY || 0));
	return {
		position: [
			Math.sin(offset) * -10 + px * 0.65,
			Math.atan(offset * Math.PI * 2) * 5 - py * 0.4,
			Math.cos((offset * Math.PI) / 3) * -10
		],
		lookAt: [0, 0, 0],
		clipFraction: offset / 2,
		rotationY: px * 0.035,
		reduced
	};
}
/** @param {number} progress */
export function chapterAt(progress) {
	return Math.min(2, Math.floor(clamp01(progress) * 3));
}
/** @param {number} clientX @param {number} clientY @param {{left:number,top:number,width:number,height:number}} rect */
export function pointerPosition(clientX, clientY, rect) {
	if (rect.width <= 0 || rect.height <= 0) return [0, 0];
	return [
		clamp01((clientX - rect.left) / rect.width) * 2 - 1,
		clamp01((clientY - rect.top) / rect.height) * 2 - 1
	];
}
