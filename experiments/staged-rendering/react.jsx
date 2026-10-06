import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { initial, change } from './model.mjs';
export function start(target, { count }) {
	let mutate;
	let expected;
	let request;
	function App() {
		const [state, setState] = useState(() => initial(count));
		request = (next) => flushSync(() => setState(next));
		expected = () => [...state.items];
		mutate = (workload) => flushSync(() => setState((state) => change(state, workload)));
		return (
			<MotionConfig reducedMotion="never">
				<div
					className="grid"
					style={{ gridTemplateColumns: `repeat(${state.columns},minmax(0,1fr))` }}
				>
					<AnimatePresence initial={false} mode="popLayout">
						{state.items.map((id) => (
							<motion.div
								className="cell"
								data-cell={id}
								key={id}
								layout="position"
								initial={false}
								exit={{ opacity: 0 }}
								transition={{
									layout: { duration: 0.35, ease: 'linear' },
									opacity: { duration: 0.18, ease: (t) => 1 - (1 - t) ** 3 }
								}}
							>
								{id}
							</motion.div>
						))}
					</AnimatePresence>
				</div>
			</MotionConfig>
		);
	}
	const root = createRoot(target);
	flushSync(() => root.render(<App />));
	return {
		mutate: (workload) => mutate(workload),
		expected: () => expected(),
		request: (next) => request(next),
		destroy: () => root.unmount()
	};
}
