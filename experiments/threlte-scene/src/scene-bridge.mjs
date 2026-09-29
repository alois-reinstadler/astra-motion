/**
 * Borrow a MotionValue; subscribe once, apply its current value, and explicitly
 * invalidate Threlte after imperative Three mutations. Cleanup never destroys
 * the borrowed value and is idempotent, including after an apply failure.
 * @template T
 * @param {{get():T,on(event:'change', callback:(value:T)=>void):()=>void}} value
 * @param {(value:T)=>void} apply
 * @param {()=>void} invalidate
 */
export function connectScene(value, apply, invalidate) {
	let active = true;
	const update = (/** @type {T} */ pose) => {
		if (active) {
			apply(pose);
			invalidate();
		}
	};
	const stop = value.on('change', update);
	try {
		update(value.get());
	} catch (error) {
		active = false;
		stop();
		throw error;
	}
	return () => {
		if (active) {
			active = false;
			stop();
		}
	};
}
