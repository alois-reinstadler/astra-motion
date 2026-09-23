import { expect, it } from 'vitest';
import { JSAnimation } from 'motion-dom';
import { completeMotionPlayback } from './motion-compat.js';

it.each([
	{ repeat: Infinity, repeatType: 'loop' as const, speed: 1, expected: 100 },
	{ repeat: 1, repeatType: 'reverse' as const, speed: 1, expected: 0 },
	{ repeat: 1, repeatType: 'mirror' as const, speed: 1, expected: 0 },
	{ repeat: 2, repeatType: 'reverse' as const, speed: 1, expected: 100 },
	{ repeat: 0, repeatType: 'loop' as const, speed: -1, expected: 0 },
	{ repeat: Infinity, repeatType: 'loop' as const, speed: 0, expected: 100 }
])(
	'completes the original JS promise with repeat=$repeat, $repeatType, speed=$speed',
	async ({ repeat, repeatType, speed, expected }) => {
		let value: unknown;
		let completed = 0;
		const options = {
			keyframes: [0, 100],
			duration: 1000,
			repeat,
			repeatType,
			autoplay: false,
			onUpdate: (latest: unknown) => {
				value = latest;
			},
			onComplete: () => {
				completed++;
			}
		};
		const animation = new JSAnimation(options);
		try {
			animation.speed = speed;
			const original = animation.finished;
			completeMotionPlayback(animation);
			animation.sample(0);
			await original;
			expect(value).toBe(expected);
			expect(completed).toBe(1);
			expect(options.repeat).toBe(repeat);
			expect(options.repeatType).toBe(repeatType);
		} finally {
			animation.stop();
		}
	}
);
