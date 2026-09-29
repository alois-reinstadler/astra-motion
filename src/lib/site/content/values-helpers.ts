import type { DocPage, DocSection } from '../doc-types.js';

const api = (rows: string[][], text: string[] = []): DocSection => ({
	id: 'api',
	title: 'Arguments, options, and returns',
	text,
	table: { columns: ['Name', 'Default or type', 'Behavior'], rows }
});
const section = (id: string, title: string, ...text: string[]): DocSection => ({ id, title, text });
const example = (id: string, ...text: string[]): DocSection => ({
	id: 'usage',
	title: 'Usage',
	text,
	example: id
});
const related = (...slugs: string[]): DocSection => ({
	id: 'related',
	title: 'Related topics',
	text: [],
	related: slugs
});

export const valuesHelpersDocs: DocPage[] = [
	{
		slug: 'motion-values',
		title: 'Motion values overview',
		group: 'Motion Values',
		summary:
			'Share animation state, derive new values, and update visual properties without routing every frame through component state.',
		sections: [
			example(
				'motion-values',
				'useMotionValue(initial) creates an owned MotionValue with a stable identity. Pass it directly to a motion element’s style, share it between elements, or use it as the input to another value helper. The example shares x between two markers and maps x into opacity for one of them.',
				'Call useMotionValue during component initialization. Its initial argument is a starting value, not a reactive binding. Change the value with set or jump after creation. Motion renders subscribed visual properties on its frame loop.'
			),
			section(
				'svelte',
				'Read values in Svelte',
				'A MotionValue is an engine object, not a Svelte rune or store. get() reads its current value, but calling get() directly in ordinary markup does not subscribe the markup. Use motionStore(value) when Svelte text or controls should follow the value, then read the resulting store with $store.',
				'motionStore is a writable view of the same value: set and update write back to it, and its subscriptions are released when the last subscriber leaves. Creating this bridge does not transfer ownership or destroy a borrowed MotionValue.',
				'Boolean helpers such as useInView have a different return shape: their .current getter is already reactive Svelte state. Read .current inside markup or a reactive computation. Do not replace a live getter with a destructured primitive snapshot.'
			),
			{
				id: 'follow-value',
				title: 'Follow a changing target',
				text: [
					'useFollowValue(source, options?) creates an owned MotionValue following a scalar, unit string or borrowed MotionValue. Source and options accept static values or reactive getters. The default is a spring; choose { type: "tween", duration } for timed interpolation, or supported inertia options. Public durations use seconds and repeated playback is excluded.',
					'The stable returned value supports get, set, jump and stop. set animates toward a target, jump updates immediately, and stop holds the current position. Replacing source/options through getters preserves output identity. Setup is SSR-safe; hidden Activity holds the latest direct target and reconnects to the latest borrowed source on reveal. Cleanup never destroys the borrowed source.',
					'Use useSpring for a spring-specific relationship; useFollowValue exposes additional following transition types. Following values own their playback separately: reducedMotion on a consuming element does not stop that borrowed animation. Read useReducedMotion().current and render a fixed transform when reduced motion is requested, as below; a value calculation itself does not infer visual accessibility intent.'
				],
				code: {
					label: 'Complete Svelte example',
					source:
						"<script lang=\"ts\">\n  import { motion, motionStore, useFollowValue, useWillChange, useReducedMotion } from 'astra-motion';\n  let target = $state(0);\n  const x = useFollowValue(() => target, { type: 'tween', duration: 0.3 });\n  const position = motionStore(x);\n  const willChange = useWillChange();\n  const reduced = useReducedMotion();\n</script>\n\n<button onclick={() => target = target ? 0 : 120}>Move</button>\n<motion.div style={{ x: reduced.current ? 0 : x, willChange }}>Following target</motion.div>\n<p>Position: {$position.toFixed(0)}</p>"
				}
			},
			{
				id: 'will-change',
				title: 'Opt into a persistent will-change hint',
				text: [
					'useWillChange() creates a component-owned MotionValue initially set to "auto". Pass it directly as style={{ willChange }} on motion.* or in motion.bind options to opt in. Eligible animated targets register with the value; willChange.add("x") explicitly prewarms the hint.',
					'The pinned Motion 13.4.4 contract maps eligible independent transforms and accelerated targets to the "transform" hint. The hint remains for the value’s lifetime. Cleanup disposes the owned value; hidden Activity does not discard the persistent hint. This is a rendering hint, not a claim of GPU acceleration or a performance improvement. Avoid applying it indiscriminately.'
				]
			},
			section(
				'composition',
				'Build relationships between values',
				'useTransform computes or maps a new value, useSpring follows a value with a spring, useVelocity derives its rate of change, and useMotionTemplate combines values into a string. Each returned MotionValue can feed another helper or multiple motion elements.',
				'Helpers preserve the output object when reactive options or source getters change. Use a getter when an input’s identity can change: useTransform(() => selectedValue, value => value * 2). A raw argument is the object captured during initialization.',
				'Pass a MotionValue directly to supported SVG attributes such as cx, or use it in a motion element’s style. Keep the value itself in the binding; replacing it with value.get() creates a snapshot and loses engine-driven updates.'
			),
			api([
				[
					'useMotionValue<T>(initial)',
					'MotionValue<T>',
					'Creates a value owned by the component. The initial value is available synchronously, including SSR.'
				],
				[
					'get() / getPrevious()',
					'T / T | undefined',
					'Read the latest and previously recorded value. Previous may be absent before a meaningful update.'
				],
				[
					'set(next)',
					'void',
					'Set a target. Attached springs can animate toward it; DOM rendering is batched to a frame.'
				],
				[
					'jump(next)',
					'void',
					'Apply immediately, stop the active animation, reset velocity, and bypass attached effects for this update.'
				],
				[
					'getVelocity()',
					'number, units per second',
					'Read numerical velocity. Numeric unit strings such as 20px work; nonnumeric strings and colors return zero.'
				],
				['isAnimating() / stop()', 'boolean / void', 'Inspect or stop the active animation.'],
				[
					'on(event, callback)',
					'() => void',
					'Subscribe to change, animationStart, animationComplete, animationCancel, or destroy; call the returned unsubscribe function.'
				],
				[
					'destroy()',
					'void',
					'Stop and remove subscriptions. Managed values are destroyed by their owner automatically.'
				],
				[
					'motionStore(value)',
					'Writable<T>',
					'Svelte store bridge; subscribe, set, and update operate on the same borrowed value.'
				],
				[
					'motionValue(initial)',
					'MotionValue<T>',
					'Raw factory for explicit ownership outside a component. Call destroy when its owner is finished.'
				]
			]),
			section(
				'lifecycle',
				'Ownership, SSR, and activity',
				'Managed helpers dispose their outputs, subscriptions, and scheduled frame work when their component is destroyed. They never destroy a caller-owned source. Keep a shared source in an owner that lives at least as long as every consumer.',
				'Initial values and initial derivations are synchronous during SSR. Browser listeners and frame updates begin only on the client. Keep initial data consistent across server rendering and hydration.',
				'Inside a hidden AnimateActivity, managed subscriptions and frame work pause while value identity is retained. They reconnect on reveal. A raw motionValue or an arbitrary external subscription retains its explicit owner’s lifecycle.'
			),
			section(
				'troubleshooting',
				'Troubleshooting',
				'If text stays unchanged while an element moves, use motionStore for the text. If replacing an input has no effect, pass an input getter. If a shared value stops updating after a child unmounts, move its managed owner above the consumers.',
				'Velocity is measured per second and is sensitive to time between frames, not the number of calls to set in one frame. Use jump for a discontinuity that should not create momentum. Respect reduced motion when manually composing movement; a value calculation alone does not infer accessibility intent.'
			),
			related(
				'motion',
				'svg',
				'use-transform',
				'use-spring',
				'use-motion-value-event',
				'animate-activity'
			)
		]
	},
	{
		slug: 'use-motion-template',
		title: 'useMotionTemplate',
		group: 'Motion Values',
		summary:
			'Compose a reactive string from MotionValues, literal text, and reactive getter inputs.',
		sections: [
			example(
				'use-motion-template',
				'useMotionTemplate is a tagged template: put the template literal immediately after the function name. Every embedded MotionValue contributes its latest value, while ordinary text supplies units and CSS syntax. The returned value can be used directly as a motion style.',
				'The filter example keeps blur numerical and adds px only in the template. A literal zero remains part of the string; empty strings and repeated inputs are also preserved.'
			),
			section(
				'composition',
				'Combine effects and changing inputs',
				'A template can combine a spring-driven shadow offset, a transformed opacity, and a color literal into one drop-shadow or box-shadow value. Keep each source independently reusable instead of parsing a finished CSS string.',
				'For a Svelte literal that can change, interpolate a getter rather than its initial value. A getter can also return a different MotionValue. The helper re-evaluates its dependencies and removes subscriptions to sources it no longer reads.',
				'Use motionStore on the returned MotionValue when displaying the assembled string as text. The value itself belongs in style={{ filter }}; filter.get() is only a snapshot.'
			),
			api([
				[
					'fragments',
					'TemplateStringsArray',
					'Literal string segments supplied by tagged-template syntax.'
				],
				[
					'interpolations',
					'string | number | MotionValue<string | number> | getter',
					'Each interpolation contributes its latest value. A getter makes Svelte state and source identity reactive.'
				],
				[
					'return',
					'MotionValue<string>',
					'Stable owned output containing the complete string; synchronous initial value, subsequent source changes batched with the frame loop.'
				]
			]),
			{
				...section(
					'getters',
					'Reactive literal example',
					'This focused excerpt changes the literal unit without replacing the derived output.'
				),
				code: {
					label: 'Focused reactive interpolation',
					source:
						"let unit = $state('px');\nconst offset = useMotionValue(0);\nconst transform = useMotionTemplate`translateX(${offset}${() => unit})`;"
				}
			},
			section(
				'lifecycle',
				'Lifecycle and troubleshooting',
				'The initial string is available during SSR. Managed subscriptions pause in hidden Activity and are disposed with the component; source values remain owned by their creators.',
				'If a unit is repeated, keep it in either the source string or the template, not both. If ordinary Svelte state becomes stale, interpolate a getter. If the CSS has no effect, inspect the assembled string: the helper concatenates values and does not validate CSS grammar.'
			),
			related('motion-values', 'use-transform', 'use-spring', 'svg')
		]
	},
	{
		slug: 'use-motion-value-event',
		title: 'useMotionValueEvent',
		group: 'Motion Values',
		summary:
			'Subscribe to a MotionValue with automatic cleanup and reactive source or event selection.',
		sections: [
			example(
				'use-motion-value-event',
				'Call useMotionValueEvent(value, event, callback) during initialization. The helper subscribes before mounted effects and removes the listener when its owner is destroyed. The example listens to changes and animation lifecycle events on the same value.',
				'Use change for application logic such as detecting scroll direction. Prefer direct MotionValue style bindings for frame-by-frame visual rendering; copying every frame into Svelte state is unnecessary when only a style needs to move.'
			),
			section(
				'reactivity',
				'Change the source without stale listeners',
				'Pass a getter for a replaceable value or event name. The old subscription is released before the new one is attached. The callback can read current Svelte state normally; it is an event callback, not an options getter.',
				'Hidden Activity disconnects managed listeners and reconnects them on reveal. Events that occurred while disconnected are not replayed. A change listener receives future changes rather than an initial value; call get once if your UI needs an immediate starting read.'
			),
			api([
				[
					'value',
					'MotionValue<T> | (() => MotionValue<T>)',
					'Required source, directly or through a reactive getter.'
				],
				[
					'event',
					'Event name | getter',
					'Required change, animationStart, animationComplete, animationCancel, or destroy event.'
				],
				['callback for change', '(latest: T) => void', 'Receives the latest changed value.'],
				[
					'animation callbacks',
					'() => void',
					'Report the value animation starting, completing, or being cancelled.'
				],
				[
					'destroy callback',
					'() => void',
					'Advanced engine event when the source is destroyed while this listener is still subscribed. Owner teardown may unsubscribe first; use normal lifecycle cleanup for owner disposal.'
				],
				[
					'return',
					'void',
					'The helper owns subscription cleanup. Use value.on directly if an event handler needs an explicit unsubscribe function.'
				]
			]),
			section(
				'direction',
				'Use previous values for direction',
				'Inside a change callback, compare latest with value.getPrevious() to infer direction. Guard the previous value when it may be absent, and ignore a difference of zero. This is useful for a header that responds to scrolling without storing every scroll position in application state.',
				'Subscribe separately when different events need different callback types. Stopping or replacing an animation is cancellation, so completion should not be treated as a guaranteed application cleanup signal.'
			),
			section(
				'lifecycle',
				'SSR and troubleshooting',
				'No event subscription is installed during SSR. Repeated mounting creates a new owned subscription and teardown releases it. A borrowed source is never destroyed by this helper.',
				'If events appear duplicated, look for an additional manual value.on subscription or multiple mounted owners. If the callback keeps following an old value, pass a getter for the source identity. If an animation event never fires, confirm that the MotionValue itself is being animated rather than an unrelated DOM property.'
			),
			related('motion-values', 'use-scroll', 'use-animate')
		]
	},
	{
		slug: 'use-scroll',
		title: 'useScroll',
		group: 'Motion Values',
		summary:
			'Read scroll positions and normalized progress as four stable, composable MotionValues.',
		sections: [
			example(
				'use-scroll',
				'useScroll() observes page scrolling. Pass options with a container to observe an element instead. The returned scrollX and scrollY measure pixels; scrollXProgress and scrollYProgress measure normalized progress.',
				'The example passes an options getter because its attachment supplies the container after initialization. An element populated by bind:this works through the same getter pattern. All four values retain their identity when a container or option changes. The broad Scroll guide explains how to choose triggered and linked animation techniques.'
			),
			section(
				'target',
				'Distinguish container and target',
				'container is the scrolling viewport. target is an element whose layout position is measured within that viewport. Omit target to measure the container’s complete scrollable area. A target’s CSS transform, and transforms on its ancestors, do not change the layout coordinates used for progress.',
				'Pass an element, a getter returning an element, or an object with a reactive current property. Omitting a ref uses the default; supplying a getter that is temporarily unresolved waits for the element rather than observing the wrong page. A replaced element disconnects the previous observation.'
			),
			section(
				'offsets',
				'Define intersections with offset',
				'Each offset pairs a point on the target with a point on the container. start end means the target’s leading edge reaches the container’s trailing edge. The first intersection maps to progress 0 and the final intersection to 1.',
				'For entry, use ["start end", "end end"]. For travel across the viewport, use ["start end", "end start"]. For exit, use ["start start", "end start"]. The selected axis determines whether these refer to horizontal or vertical edges.',
				'A single numeric offset applies the same fraction to target and container. A single named edge also applies to both. A single unit or numeric string describes the target point against container start; write both points explicitly when that shorthand would be ambiguous.'
			),
			{
				id: 'offset-units',
				title: 'Accepted offset points',
				text: [],
				table: {
					columns: ['Point', 'Meaning', 'Example'],
					rows: [
						['start / center / end', '0 / 0.5 / 1 of the relevant length', 'start center'],
						[
							'Number or percentage',
							'Proportion of target or container length; values outside 0–1 are permitted',
							'0.25 1, 25% 100%'
						],
						['px', 'Distance from the start of the target or container', '100px -50px'],
						['vh / vw', 'Distance relative to the browser viewport height or width', '0 80vh'],
						[
							'Numeric pair',
							'Explicit target and container proportions',
							'[0, 1] is the same intersection as start end'
						]
					]
				}
			},
			api([
				[
					'options',
					'{} or getter',
					'Re-evaluates reactive container, target, axis, offset, and content-size options.'
				],
				[
					'container',
					'Page viewport',
					'Element, getter, or current object describing the scrollable element.'
				],
				[
					'target',
					'Container scrollable area',
					'Optional element, getter, or current object measured inside the container.'
				],
				[
					'axis',
					'y',
					'x or y; selects the axis to which target offsets apply. Both pixel axes are returned.'
				],
				[
					'offset',
					'[start start, end end]',
					'Array of named/unit intersections, numeric pairs, or supported single edge definitions.'
				],
				[
					'trackContentSize',
					'false',
					'Checks changing scrollWidth/scrollHeight each frame so progress can update before the next scroll event.'
				],
				[
					'scrollX / scrollY',
					'MotionValue<number>, initially 0',
					'Absolute scroll position in CSS pixels.'
				],
				[
					'scrollXProgress / scrollYProgress',
					'MotionValue<number>, initially 0',
					'Normalized scroll progress; pass directly to styles or derive other values.'
				]
			]),
			section(
				'performance',
				'Native timelines and changing content',
				'Eligible direct progress bindings and simple clamped useTransform mappings can use native ScrollTimeline or ViewTimeline support. More complex offsets, custom mixers, springs, or unsupported browser features use JavaScript measurement and updates. Treat acceleration as an optimization; the returned values remain usable on the fallback path.',
				'Animate compositable properties such as opacity and transform where practical. Adding a spring deliberately introduces time-based smoothing and changes the relationship from exact scroll position to a following animation.',
				'Enable trackContentSize for content whose scrollable dimensions change without scrolling. It adds frame work and is shared with other observations of that container. Leave it disabled for stable content and provide image dimensions to reduce layout changes.'
			),
			section(
				'lifecycle',
				'SSR, cleanup, and troubleshooting',
				'SSR returns four zero-valued MotionValues without browser listeners. Initial client measurement updates them after mounting. Use skipInitialAnimation on a following spring if the first measured position should be applied immediately.',
				'Observation and owned timelines disconnect on teardown, ref replacement, or hidden Activity; retained values reconnect on reveal. Browser scroll positions can be fractional CSS pixels, so keep numerical precision when composing values.',
				'If progress never changes, check that the chosen container actually scrolls and that its overflow/content dimensions create a range. If the first render tracks the page accidentally, pass an unresolved getter instead of evaluating the ref once. If progress only updates after scrolling, consider trackContentSize.'
			),
			related('scroll', 'use-transform', 'use-spring', 'use-motion-value-event', 'accessibility')
		]
	},
	{
		slug: 'use-spring',
		title: 'useSpring',
		group: 'Motion Values',
		summary:
			'Create a spring-driven MotionValue or smoothly follow another value while preserving velocity during retargeting.',
		sections: [
			example(
				'use-spring',
				'useSpring(initial, options) returns a MotionValue whose set method animates toward a new target. Supply another MotionValue instead of an initial scalar to follow it automatically. The example sets a scalar spring target and changes physical settings through a reactive options getter without resetting that target.',
				'Numbers and numeric unit strings such as 20px or 50% are supported. Keep units compatible throughout a spring. jump applies a value immediately, bypasses the spring for that update, and resets its velocity.'
			),
			section(
				'reactive',
				'Retarget and replace sources',
				'A new set steers an active physical spring from its current value and velocity. A source getter can select a different MotionValue without replacing the returned object, and an options getter can update stiffness or damping reactively. Previous source subscriptions are removed. Scalar springs retain their latest set target when options change; a changed scalar getter explicitly supplies a new target.',
				'skipInitialAnimation applies the first observed source update immediately. It is useful when useScroll first measures a restored page position. Later updates spring normally. Reconnecting a changed source or settings starts a new following subscription.'
			),
			api([
				[
					'source',
					'number | unit string | MotionValue | getter',
					'Required initial scalar or followed source. The output has the same scalar type.'
				],
				[
					'options',
					'{} or getter',
					'Reactive UseSpringOptions. Durations on this managed helper are seconds.'
				],
				[
					'stiffness / damping / mass',
					'100 / 10 / 1',
					'Physical spring settings; any supplied physical setting takes precedence over duration/bounce resolution.'
				],
				[
					'velocity',
					'Current velocity',
					'Optional starting/retargeting velocity in units per second. Duration-based spring resolution starts at zero velocity.'
				],
				[
					'duration',
					'Unset for physical springs',
					'Desired seconds for a duration/bounce spring; the underlying duration-style default is 0.8 seconds when only bounce is supplied.'
				],
				[
					'bounce',
					'0.3 in duration-style resolution',
					'Bounciness of a duration-based spring. 0 has no overshoot.'
				],
				[
					'visualDuration',
					'Not supplied',
					'Seconds for most visible movement, with the settling tail afterward. Supply with duration or bounce; physical settings override this path.'
				],
				[
					'restSpeed / restDelta',
					'0.01 / 0.001',
					'Completion requires both speed and distance to fall below their thresholds.'
				],
				[
					'skipInitialAnimation',
					'false',
					'Jump the first source update instead of springing to it.'
				],
				[
					'return',
					'MotionValue<number> or MotionValue<string>',
					'Stable owned spring value supporting get, set, jump, stop, events, and style bindings.'
				]
			]),
			section(
				'timing',
				'Choose physics or duration',
				'Use stiffness and damping when the spring should respond naturally to interruption. Use duration plus bounce to coordinate a spring with another timed effect. For visualDuration, include bounce or duration so the current engine selects its duration-style resolution.',
				'These defaults follow the inspected Motion 13.4 engine. Its generic transition prose and declarations contain different stiffness, bounce, and rest defaults; the managed follower’s actual rest thresholds are the values in the table. Raw springValue keeps its existing engine-level contract, including duration units; useSpring converts its public seconds to milliseconds internally.'
			),
			section(
				'lifecycle',
				'Lifecycle, SSR, and accessibility',
				'The initial value is available during SSR. Browser following starts after mount and disconnects on owner destruction. Hidden Activity stops the spring clock and retains its target; set calls while hidden update that target without starting work. Reveal follows the latest target or borrowed source. jump remains immediate, and stop cancels pending movement. The borrowed source is not destroyed.',
				'A raw spring represents numbers rather than an accessibility policy. For movement driven by manual values, use useReducedMotion to jump to targets or replace movement with another effect. If a unit appears twice, keep it in the value or a template only once; managed following preserves unit strings on its initial jump.'
			),
			related('motion-values', 'use-scroll', 'use-reduced-motion', 'transitions')
		]
	},
	{
		slug: 'use-time',
		title: 'useTime',
		group: 'Motion Values',
		summary:
			'Derive continuous animation from a managed elapsed-time MotionValue measured in milliseconds.',
		sections: [
			example(
				'use-time',
				'useTime() returns a MotionValue that starts at zero and updates on each animation frame. Compose it with useTransform for rotations, oscillations, or other time-based values. The dial example derives both rotation and whole seconds from one clock.',
				'Start or stop rotation with the explicit control. The reset button changes a separate origin value, leaving the same time source and subscriptions in place. MotionValues can be composed without recreating a helper on each interaction.'
			),
			section(
				'composition',
				'Map time into motion',
				'A range mapping such as useTransform(time, [0, 4000], [0, 360], { clamp: false }) turns each four seconds into a full turn. A computed transform can use Math.sin(time.get() / 1000) for an oscillating value.',
				'This clock measures elapsed time from its first frame. After Activity suspension or browser throttling, the next value reflects the elapsed interval rather than pretending no time passed. Accumulate delta yourself with useAnimationFrame when a simulation needs a clock that excludes pauses.'
			),
			api([
				['arguments', 'None', 'Create once during component initialization.'],
				[
					'return',
					'MotionValue<number>',
					'Milliseconds elapsed since the first callback; initial and first-frame value 0.'
				],
				[
					'events',
					'MotionValue events',
					'Subscribe to change with useMotionValueEvent, or derive another value directly.'
				]
			]),
			section(
				'lifecycle',
				'Cleanup and motion preferences',
				'No frame work runs during SSR. Client frame work and the owned value are released on teardown. A hidden Activity pauses frame work while preserving the same time value and origin.',
				'useTime has no enabled option. Use useAnimationFrame with an enabled getter when work should be conditionally scheduled, or place the animation in an Activity boundary. Disable perpetual decorative movement when reduced motion is requested; the example keeps its readable clock while suppressing rotation.'
			),
			section(
				'troubleshooting',
				'Troubleshooting',
				'If a derived rotation stops after one turn, use clamp: false. If displayed text does not update, bridge the value with motionStore. If the clock jumps after a pause, that follows its elapsed-time contract; integrate frame delta for a pause-excluding clock.'
			),
			related('use-transform', 'use-animation-frame', 'use-reduced-motion', 'animate-activity')
		]
	},
	{
		slug: 'use-transform',
		title: 'useTransform',
		group: 'Motion Values',
		summary:
			'Derive a stable MotionValue from live inputs, range mappings, or a named collection of output ranges.',
		sections: [
			example(
				'use-transform',
				'useTransform can compute a result or map an input range to an output range. The example maps one source to two named outputs: scale and backgroundColor. Each output is an independent MotionValue with a shared input relationship.',
				'For computed values, useTransform(() => x.get() + y.get()) automatically subscribes to the MotionValues read by the function. Current Svelte state read by that computation also participates in reactivity.'
			),
			section(
				'ranges',
				'Define a mapping',
				'Input ranges must contain increasing or decreasing numbers. An output range has the same number of entries and a consistently mixable value type, such as numbers, colors, unit strings, or complex CSS strings.',
				'Outputs clamp to the supplied range by default. clamp: false extrapolates beyond it, which is useful for perpetual rotation. A named output map shares one input range across several output ranges; the returned object retains its named keys and each value’s inferred type.'
			),
			api([
				[
					'useTransform(compute)',
					'() => Output',
					'Automatically collect .get() dependencies and return MotionValue<Output>.'
				],
				[
					'useTransform(source, compute)',
					'MotionValue or getter, (value) => Output',
					'Map one source’s latest value.'
				],
				[
					'useTransform(sources, compute)',
					'Readonly tuple/array or getter, (values) => Output',
					'Compute from several values with tuple-aware inference.'
				],
				[
					'useTransform(source, input, output, options?)',
					'Numeric source; input/output arrays or getters',
					'Interpolate a range and return one MotionValue.'
				],
				[
					'useTransform(source, input, outputMap, options?)',
					'Object of output arrays',
					'Return an object of named MotionValues. Keep the output-map keys stable.'
				],
				['clamp', 'true', 'Clamp mapped output to the endpoints; false extrapolates.'],
				[
					'ease',
					'Linear interpolation',
					'JavaScript easing function or array of segment easing functions.'
				],
				[
					'mixer',
					'Engine value mixer',
					'(from, to) => (progress) => mixedValue, for custom value interpolation.'
				],
				[
					'return',
					'MotionValue<Output> or named map',
					'Owned, stable outputs; initial results are available synchronously.'
				]
			]),
			section(
				'dynamic',
				'Dynamic dependencies and custom mixing',
				'Conditional computations are supported: a function can choose which source to read from current Svelte state. The helper recollects dependencies, unsubscribes sources that are no longer read, and schedules recalculation with the frame loop.',
				'Pass getters for changing ranges, options, or input identities. Keep computations free of writes to their own inputs to avoid feedback loops. A mixer is created for each pair of output values and returns a function that accepts normalized progress; use it when a specialized value needs interpolation beyond the engine’s built-in mixers.',
				'Eligible simple clamped mappings from useScroll can preserve native timeline acceleration. A custom mixer, extrapolation, or more complex derivation falls back to normal value updates.'
			),
			section(
				'lifecycle',
				'Lifecycle and troubleshooting',
				'Derived values dispose their own subscriptions and scheduled work. They never destroy their inputs. Hidden Activity pauses derivation work and reconnects it on reveal. SSR evaluates the initial computation without browser subscriptions.',
				'If a mapping throws or behaves unexpectedly, check range lengths, numerical ordering, and output type compatibility. If a new source or option is ignored, pass a getter. For ordinary markup, bridge the returned MotionValue with motionStore.'
			),
			related('motion-values', 'use-motion-template', 'use-scroll', 'svg')
		]
	},
	{
		slug: 'use-velocity',
		title: 'useVelocity',
		group: 'Motion Values',
		summary: 'Derive the rate of change of a MotionValue and compose speed-sensitive animation.',
		sections: [
			example(
				'use-velocity',
				'useVelocity(source) returns a numerical MotionValue representing the source’s velocity. The example maps positive and negative spring velocity to scale, so the marker grows while moving in either direction and returns to normal at rest.',
				'Velocity is measured in source units per second. Numeric unit strings are supported by the engine’s numerical parsing; a source expressed in pixels produces pixels per second. Colors and other nonnumeric strings have no useful numerical velocity.'
			),
			section(
				'composition',
				'Direction, magnitude, and acceleration',
				'The sign identifies direction. Use Math.abs in a computed useTransform when an effect should respond only to speed. Clamp a mapped response to avoid extreme values from sudden changes.',
				'Passing a velocity value into another useVelocity derives acceleration, measured in source units per second squared. Differentiation amplifies abrupt changes; smooth or clamp the result when using it for decorative motion.',
				'jump resets continuity and velocity. Multiple set calls within the same frame are not a substitute for movement over time. At rest, the derived velocity returns to zero rather than retaining the last nonzero sample.'
			),
			api([
				[
					'source',
					'MotionValue<number | string> or getter',
					'Required numerical source; a getter supports replacing its identity.'
				],
				[
					'return',
					'MotionValue<number>',
					'Stable owned velocity output; initially reads the source’s current velocity.'
				],
				['options', 'None', 'Transform, clamp, or smooth the returned value with other helpers.']
			]),
			section(
				'lifecycle',
				'Lifecycle and troubleshooting',
				'The helper owns its source subscription and the frame work needed to settle at zero. It stops those resources on teardown or hidden Activity and reconnects to the latest source on reveal. The source itself remains alive.',
				'SSR reports the source’s initial velocity, normally zero. If the result stays zero, check that the source contains a number or numeric unit string and changes across frames. If a source is replaced, pass a getter. For users requesting reduced motion, suppress velocity-driven movement or scale changes in your composed effect.'
			),
			related('use-spring', 'use-transform', 'motion-values', 'use-reduced-motion')
		]
	},
	{
		slug: 'use-animate',
		title: 'useAnimate',
		group: 'Hooks',
		summary:
			'Run scoped animations and timelines with playback controls and automatic owner cleanup.',
		sections: [
			example(
				'use-animate',
				'useAnimate() returns [scope, animate]. Attach scope.attach to one HTML or SVG element, then call animate from an event handler or mounted effect. String selectors resolve among descendants of that root. The example runs a sequence and exposes pause, resume, and completion controls.',
				'Use animate(scope.current, keyframes) to animate the root itself. The scope also exposes a reactive current reference and an active run count. Detaching the root or destroying the owner stops its owned animations.'
			),
			section(
				'subjects',
				'Animate elements, values, and objects',
				'The main-package helper uses the hybrid animation engine. It accepts DOM selectors and elements, collections of elements, MotionValues, scalar values, and plain objects. A selector is scoped; an explicit element can intentionally be outside the scope.',
				'For a DOM element, pass a keyframe object such as { opacity: [0, 1], x: 40 }. For a MotionValue or scalar, pass the destination or keyframes directly. A scalar animation can report its latest value with onUpdate. Plain objects animate their named numerical properties.',
				'SVG geometry can be animated through supported CSS properties or explicit attr-prefixed keys when the attribute path is required. Keep one deliberate owner per property when combining imperative animations with motion props; a later animation of the same property can interrupt the previous one.'
			),
			section(
				'sequence',
				'Compose a timeline',
				'Pass an array of segments to animate(sequence, options). A segment contains [subject, keyframes, transition?]. Subjects can mix DOM selectors, MotionValues, and objects. Segments run in sequence unless their at option changes their start time.',
				'at accepts absolute seconds, a relative offset such as +0.2 or -0.1, < for the previous segment’s start, or a named label. Put a string label or { name, at } label object in the sequence to define an anchor. A defaultTransition supplies shared timing; individual segments and properties can override it.',
				'Use stagger(delay) for per-element delays. Sequence composition and per-value transitions share the main animation transition vocabulary; the Transitions reference documents easing, keyframes, repeats, and spring settings.'
			),
			api([
				[
					'useAnimate<T>(policy?)',
					'Policy object or getter',
					'Returns [UseAnimateScope<T>, animate]. Local reducedMotion overrides inherited MotionConfig policy.'
				],
				[
					'scope.attach',
					'Attachment<T>',
					'Attach to one HTML/SVG root. Simultaneous attachment to multiple roots throws.'
				],
				[
					'scope.current / scope.active',
					'T | undefined / number',
					'Reactive mounted root and number of owned active or paused runs.'
				],
				['scope.stop()', 'void', 'Stop all owned playback; released controls cannot restart.'],
				[
					'animate(subject, keyframes, options?)',
					'Playback controls',
					'Run DOM/value/object animation using public engine overloads.'
				],
				[
					'animate(sequence, options?)',
					'Playback controls',
					'Run a mixed sequence; options include defaultTransition, duration, delay, repeat, repeatType, and repeatDelay.'
				],
				[
					'keyframes',
					'Scalar/array or property-keyframe object',
					'Choose the form for the subject. A leading null keyframe resolves the current value. Named properties can have independent transition overrides.'
				],
				[
					'type / ease / times',
					'Inherited or engine-selected transition',
					'Select keyframes, spring, or inertia behavior; configure easing and normalized keyframe times. See Transitions for each type’s complete settings and defaults.'
				],
				[
					'repeat / repeatType / repeatDelay',
					'0 / loop / 0',
					'Repeat a finite count or Infinity; loop, reverse, and mirror choose repetition behavior. repeatDelay uses seconds.'
				],
				[
					'per-call reduceMotion',
					'Inherited policy result',
					'Boolean engine option overriding positional reduction for that animation, including later policy changes. false preserves that run’s playback. The helper’s initialization policy instead uses the reducedMotion string setting.'
				],
				['sequence skipAnimations', 'false', 'Immediately apply sequence targets when true.'],
				[
					'duration / delay / repeatDelay',
					'Seconds',
					'Per-animation or sequence timing; transition settings can be per property.'
				],
				[
					'onUpdate / onComplete',
					'Optional callbacks',
					'Animation callbacks follow the selected subject/transition contract. Scalar onUpdate receives its latest animated value.'
				],
				[
					'onPlay / onStop / onRepeat',
					'Optional () => void callbacks',
					'Value-transition lifecycle callbacks. Put per-property callbacks on the relevant transition; top-level onComplete belongs to the completed group.'
				],
				[
					'return from animate',
					'Thenable playback controls',
					'Await successful completion directly or read finished. Observe settled when application cleanup must also handle interruption or owner detachment.'
				]
			]),
			{
				id: 'controls',
				title: 'Playback controls',
				text: [
					'A completed run can replay while its owner and scope generation still exist; replay creates a fresh settled promise. Repeated observers of one playback share its result. Pause leaves settlement pending, and play resumes that cycle. Explicitly stopped/cancelled controls cannot restart. Partial sequence replacement settles replaced immediately while unaffected channels keep running under the original owner; the replaced group cannot replay or mutate playback, but stop/cancel can still clean up its remaining channels. Seeking completed controls reacquires cleanup ownership without changing their completed settlement; play starts the next settlement cycle.'
				],
				table: {
					columns: ['Control', 'Contract'],
					rows: [
						[
							'play() / pause()',
							'Resume or pause the run. Explicit pauses remain paused when an Activity is revealed.'
						],
						['complete()', 'Finish at the target, including repeating or zero-speed playback.'],
						[
							'stop() / cancel()',
							'Stop commits the current result; cancel reverts according to the engine subject. Both release managed ownership.'
						],
						[
							'time / speed',
							'Readable and writable playback time in seconds, and playback-rate multiplier.'
						],
						[
							'duration / state / startTime',
							'Inspect duration, current playback state, and the engine start timestamp.'
						],
						[
							'settled',
							'Promise of { status: "finished" } or { status: "cancelled", reason }. Reasons: stopped, cancelled, replaced, detached. Applies to sequences as one owned run. Detaching a scope or destroying its owner settles owned playback; borrowed external MotionValue playback is not cancelled merely because this consumer disappears.'
						],
						[
							'finished / then()',
							'Completion-only upstream semantics are unchanged and may remain pending on stop/cancel. Use settled for cancellation-aware application cleanup.'
						],
						[
							'attachTimeline({ timeline?, observe })',
							'Attach an external timeline or fallback observer. The returned cleanup stops the run; only one external timeline can be attached at once.'
						]
					]
				}
			},
			section(
				'composition',
				'Compose with visibility and presence',
				'useInView(scope) can trigger an imperative sequence when the root enters the viewport. Start the sequence inside an effect that reads visible.current and cancel or stop work when that effect is replaced.',
				'For a manual presence exit, use usePresence in the retained child, capture safeToRemove for the current exit, await controls.settled, and call that captured callback only for the outcome your application accepts. Use result.status === "finished" for a successful exit. Cancel superseded work when isPresent becomes true again. The AnimatePresence reference shows the generation-safe removal pattern.'
			),
			section(
				'mini',
				'Choose the mini entry when appropriate',
				'Import useAnimate from astra-motion/mini for a separate native DOM-style animation helper. It uses the same [scope, animate] authoring pattern but does not include hybrid subjects or sequences. Use complete CSS transforms in mini animations; independent transform aliases and general object/MotionValue animation belong to the hybrid helper.',
				'The mini helper owns playback and Activity suspension, but it does not inherit the hybrid helper’s MotionConfig transition or reduced-motion policy. Read useReducedMotion when choosing its keyframes or timing. Actual Astra production bundle measurements are published in Reduce bundle size; upstream package size claims are not Astra measurements.',
				'Existing createAnimate remains available with its stricter scope and style-ownership contract. Its object API and restrictions are preserved for current users. useAnimate is the general engine surface and only scopes selector lookup.'
			),
			section(
				'lifecycle',
				'Lifecycle, SSR, and errors',
				'Initializing the helper during SSR is safe, but starting playback before a browser owner mounts throws. Selector animation before the scope attaches also throws. Calling controls after their scope detaches, after owner destruction, or after terminal stop/cancel produces a clear lifecycle error.',
				'Hybrid playback inherits default transitions and live reduced-motion policy from MotionConfig. Reducing motion finishes owned positional animation while allowing suitable opacity and color animation to continue. An explicit per-call reduceMotion: false keeps its precedence during live policy changes.',
				'Hidden Activity pauses running owned playback and disconnects external timeline observers. Reveal resumes runs that were playing, while preserving explicit pauses. A new animate call while hidden throws; play on existing owned controls can defer until reveal.'
			),
			section(
				'troubleshooting',
				'Troubleshooting',
				'If a selector finds no root, attach the scope before starting playback. To target the scope element itself, pass scope.current directly rather than expecting descendant selection to include it. If a later declarative update replaces an imperative result, make ownership of that property explicit.',
				'If a stopped run refuses to replay, create a new run. If an animation promise is being used to release application state, handle cancellation separately instead of assuming every interrupted engine animation completes normally.'
			),
			related(
				'transitions',
				'animate-presence',
				'use-in-view',
				'motion-config',
				'reduce-bundle-size'
			)
		]
	},
	{
		slug: 'use-animation-frame',
		title: 'useAnimationFrame',
		group: 'Hooks',
		summary:
			'Schedule a lifecycle-managed frame callback with elapsed time, frame delta, and reactive enablement.',
		sections: [
			example(
				'use-animation-frame',
				'useAnimationFrame(callback, options?) calls the callback on Motion’s frame loop. It receives elapsed time and frame delta in milliseconds. The example advances a MotionValue using delta, so movement is based on time rather than a fixed number of pixels per frame.',
				'Pass an enabled getter to stop scheduling work when it is unnecessary. Svelte components initialize once, so replacing a callback expression later is not how a running helper is disabled; reactive options are the explicit control.'
			),
			section(
				'clocks',
				'Choose elapsed time or delta',
				'Elapsed time starts at zero on the first callback and measures time since that frame. It includes the interval while scheduling is disabled. Use it for a clock or a function that should remain aligned with real elapsed time.',
				'Delta reports the engine’s frame interval and can be accumulated for a simulation that should pause. The engine may clamp large frame deltas after a stalled frame. Keep units explicit: multiply delta by pixels per millisecond, or divide by 1000 before using a per-second speed.',
				'Keep work short. Prefer direct MotionValue writes, canvas drawing, or a narrowly owned DOM update to rebuilding large Svelte state trees every frame. Do not write the same style from both your callback and a motion element’s animation owner.'
			),
			api([
				[
					'callback',
					'(time: number, delta: number) => void | undefined',
					'Required callback argument; undefined schedules no work. Both callback values use milliseconds.'
				],
				['options', '{} or getter', 'Reactive AnimationFrameOptions.'],
				[
					'enabled',
					'true',
					'false cancels scheduled frame work; true reconnects the same elapsed clock.'
				],
				['return', 'void', 'The component owns cancellation automatically.']
			]),
			section(
				'lifecycle',
				'Lifecycle and accessibility',
				'No callback runs during SSR. The effect starts after mounting, stops on destruction, and pauses while its Activity is hidden. The first callback after a later enablement uses the retained elapsed-time origin.',
				'usePageInView can disable background-tab work explicitly. useReducedMotion can disable decorative motion or switch the callback to a less animated representation. A frame callback does not automatically know which of its writes represents motion.'
			),
			section(
				'troubleshooting',
				'Troubleshooting',
				'If speed differs with refresh rate, use delta rather than adding a fixed distance each frame. If a pause causes a large elapsed-time jump, accumulate delta for the desired pause-excluding clock. If the loop ignores a boolean change, pass () => ({ enabled }) instead of a captured object.'
			),
			related('use-time', 'use-page-in-view', 'use-reduced-motion', 'animate-activity')
		]
	},
	{
		slug: 'use-in-view',
		title: 'useInView',
		group: 'Hooks',
		summary:
			'Read an element’s viewport visibility as reactive Svelte state with configurable thresholds and observer cleanup.',
		sections: [
			example(
				'use-in-view',
				'useInView(target, options?) returns an object with a reactive current boolean. Pass a getter for an element populated by bind:this, then read visible.current in markup or an effect. The target can be any suitable element; it does not need to be a motion component.',
				'The example measures visibility inside a scrollable container and requires 75 percent of the target to be visible. Toggle Once to retain true after the first real entry. Use whileInView when visibility should only select an animation target; useInView is useful when application logic also needs the state.'
			),
			section(
				'area',
				'Choose a root, margin, and amount',
				'By default the root is the browser viewport. A root element uses that element’s viewport instead. A margin expands or contracts the detection rectangle: use pixel or percentage values in normal one-to-four-value CSS margin order.',
				'amount is some, all, or a number from 0 to 1. A numeric value requires both intersection and that visible ratio. An element larger than its viewport might never satisfy all, so choose a suitable threshold.',
				'For cross-origin iframes, browser security can prevent viewport margins from taking effect unless an explicit root is supplied. This helper follows IntersectionObserver geometry rather than element focus or document visibility.'
			),
			api([
				[
					'target',
					'Element, getter, or readonly current object',
					'Required observed element; unresolved getters wait for an element. A useAnimate scope can be supplied directly.'
				],
				[
					'options',
					'{} or getter',
					'Reactive UseInViewOptions; changing options replaces the previous observer.'
				],
				['root', 'Viewport', 'Element, Document, null, or a getter returning one.'],
				['margin', '0px', 'IntersectionObserver root margin in pixels or percentages.'],
				[
					'amount',
					'some',
					'some, all, or a number from 0 to 1. Nonfinite or out-of-range numbers throw.'
				],
				[
					'once',
					'false',
					'Disconnect after the target first actually enters. Replacing the target starts a fresh once state.'
				],
				[
					'initial',
					'false',
					'Value until the first observation; an outside measurement can change initial:true back to false.'
				],
				[
					'return',
					'{ readonly current: boolean }',
					'Live Svelte-readable visibility, not a primitive snapshot or MotionValue.'
				]
			]),
			section(
				'lifecycle',
				'Reactivity, SSR, and cleanup',
				'Read .current where Svelte tracks reads. A one-time destructure of current does not stay live. A target getter and options getter let bound elements or thresholds change without recreating the helper.',
				'SSR returns the configured initial value. If IntersectionObserver is unavailable, that fallback remains. Observation is disconnected on ref replacement, owner destruction, and hidden Activity; stale observer deliveries are ignored.',
				'Astra deliberately resolves initial:true on the first real measurement, including an outside result. once only latches after actual entry, and replacing an element starts fresh. This preserves the documented meaning even where the audited upstream hook has different initial-observation behavior.'
			),
			section(
				'troubleshooting',
				'Troubleshooting',
				'If an element is always outside, check its root, clipping ancestors, and whether the requested amount is physically possible. If a target change is ignored, pass a getter rather than its initial undefined value. If a once result stays true, replace the target or choose once:false when repeated observation is required.',
				'Do not make essential content available only after an observer fires. Keep readable content in SSR, and provide a suitable initial visual state or reduced-motion alternative for reveal effects.'
			),
			related('scroll', 'motion', 'use-animate', 'use-page-in-view', 'accessibility')
		]
	},
	{
		slug: 'use-page-in-view',
		title: 'usePageInView',
		group: 'Hooks',
		summary:
			'Read document visibility and suspend work while the user is on another tab or the page is hidden.',
		sections: [
			example(
				'use-page-in-view',
				'usePageInView() returns a reactive current boolean backed by the Page Visibility API. Read it when deciding whether to run animation, media, polling, or another optional task. The counter example enables frame work only while the page is visible and the user has started it.',
				'Switch to another tab to exercise actual visibility. Scrolling an element out of view is a different question, handled by useInView. A page can also be visible without having keyboard focus.'
			),
			section(
				'composition',
				'Pause and resume application work',
				'For useAnimationFrame, pass () => ({ enabled: page.current && running }). This cancels scheduled frame work when disabled. For media or another resource, use a Svelte effect that reads page.current and performs the appropriate play/pause or subscribe/unsubscribe operation.',
				'Keep autoplay policy and rejected media play promises in the media component. Document visibility is a scheduling signal rather than permission to start audio or video. When work resumes, decide whether its time should include the hidden interval.'
			),
			api([
				['arguments', 'None', 'Call during component initialization.'],
				['return', '{ readonly current: boolean }', 'true when document.hidden is false.'],
				[
					'SSR / initial hydration',
					'true',
					'Deterministic starting value until the client measures the current document state.'
				],
				[
					'updates',
					'visibilitychange',
					'Live changes update .current; no callback argument or manual unsubscribe is required.'
				]
			]),
			section(
				'lifecycle',
				'Lifecycle and troubleshooting',
				'The client measures visibility when its effect starts and subscribes to visibilitychange. Destruction removes that listener. Hidden Activity suspends the subscription; reveal re-reads the current document state before listening again.',
				'If a value remains stuck, read page.current reactively instead of destructuring it. If scrolling has no effect, useInView is the element-visibility helper. Some browser automation environments intentionally force pages visible; real tab visibility and an emulated test signal serve different verification purposes.'
			),
			related('use-animation-frame', 'use-time', 'use-in-view', 'animate-activity')
		]
	},
	{
		slug: 'use-reduced-motion',
		title: 'useReducedMotion',
		group: 'Hooks',
		summary:
			'Read the device’s live motion preference and choose an appropriate animation or media behavior.',
		sections: [
			example(
				'use-reduced-motion',
				'useReducedMotion() returns an object whose current value is true when the device requests reduced motion. The example keeps its fade but removes travel when that preference is enabled. Change the operating system or browser preference to see it update live.',
				'Choose an alternative that preserves the information the animation communicates: a fade, immediate state change, static illustration, or user-controlled playback. A shorter version of the same large movement is not always the right alternative.'
			),
			section(
				'policy',
				'Device preference and application policy',
				'This helper reads prefers-reduced-motion. It does not report whether a MotionConfig provider has forced always or never. Use MotionConfig to apply a shared animation policy, and use this helper when the application must choose different targets, media behavior, or content.',
				'Astra subscribes to live preference changes. If your target is computed from preference.current, Svelte updates it when the setting changes. For manual MotionValues, explicitly jump, stop, or choose another effect when movement should be reduced.'
			),
			api([
				['arguments', 'None', 'Call during component initialization.'],
				[
					'return',
					'{ readonly current: boolean | null }',
					'true means reduced motion; false means no reduction requested; null means not yet measured.'
				],
				[
					'SSR / initial hydration',
					'null',
					'Preference is unknown on the server. Choose a deterministic initial representation.'
				],
				[
					'missing matchMedia',
					'false after client measurement',
					'The browser cannot report the preference, so the measured fallback is no reduction requested.'
				],
				[
					'updates',
					'Live media-query changes',
					'A shared native listener is released when no managed subscribers remain.'
				]
			]),
			section(
				'lifecycle',
				'Lifecycle and SSR',
				'No device query runs during SSR. Avoid branching server markup on an assumed client preference; the initial null makes that uncertainty explicit. Treat null conservatively when deciding whether decorative movement should start.',
				'Owner destruction releases the subscription. Hidden Activity pauses it and reveal re-measures the preference. Ordinary application $effects remain normal Svelte effects; the helper supplies a reactive preference, not a replacement effect lifecycle.'
			),
			section(
				'troubleshooting',
				'Troubleshooting',
				'If the result does not react, read preference.current in the reactive computation or template instead of storing its initial primitive value. If MotionConfig says always but this helper is false, that is expected: policy and device preference are separate.',
				'Remember keyboard focus, reading order, and essential state announcements when replacing an animation. Turning off motion should not remove access to the underlying control or information.'
			),
			related('accessibility', 'motion-config', 'use-animation-frame', 'use-spring')
		]
	},
	{
		slug: 'scroll',
		title: 'Scroll animations',
		group: 'Animations',
		summary:
			'Choose scroll-triggered or scroll-linked techniques, then compose reveals, progress indicators, and spatial effects with Svelte state.',
		sections: [
			example(
				'scroll',
				'Scroll-triggered animation starts a time-based transition when an element enters or leaves a region. Scroll-linked animation continuously maps scroll position to a visual value. The example shows both: the note responds to entry, while the bar follows every scroll position.',
				'Use whileInView for a declarative reveal, useInView for visibility state used by application logic, and useScroll for continuous progress. These tools can share the same scroll container.'
			),
			section(
				'triggered',
				'Reveal content on entry',
				'Add whileInView to a motion element and choose its initial or animate target for the outside state. viewport.once:true keeps the entered state after its first real entry; without once, the outside state returns as the element leaves.',
				'viewport.root chooses a scrollable parent, viewport.margin adjusts the detection region, and viewport.amount selects the visible fraction. Use a getter for a root populated by bind:this. For a non-motion element or effects beyond animation targets, useInView exposes a reactive boolean.',
				'Keep the reveal modest and the content usable. Large initial translations, hidden essential text, or strict all thresholds can make content inaccessible or impossible to reveal in a small viewport.'
			),
			section(
				'linked',
				'Link a style to scroll progress',
				'useScroll provides pixel positions and progress MotionValues. Bind scrollYProgress to scaleX with originX:0 for a progress bar. Compose useTransform to map the same progress into color, opacity, clipPath, or a complete transform.',
				'Use a container for an element’s own scrolling and a target for that element’s journey through a viewport. Offsets describe where that journey starts and ends. The exact argument, return, and offset contracts belong to the useScroll reference.'
			),
			section(
				'smooth',
				'Smooth movement and detect direction',
				'Passing progress through useSpring makes it follow the scroll target over time. This can soften abrupt input, but the result will intentionally lag the scroll position. Use skipInitialAnimation when a restored scroll position should not spring in from zero.',
				'To determine direction, subscribe to scrollY with useMotionValueEvent and compare the new position with getPrevious(). Ignore unchanged values. Update a small directional state only when direction changes, then let a motion header animate between visible and tucked-away targets.'
			),
			section(
				'parallax',
				'Build depth and reveal effects',
				'Parallax maps one scroll progress value into different translation ranges for foreground and background layers. Keep ranges small and disable depth movement when reduced motion is requested. A clipped reveal maps progress into compatible clipPath strings while the underlying content remains semantically available.',
				'For a horizontal story driven by vertical scrolling, use a tall outer target, a sticky viewport, and a wide flex track. Map progress to the negative difference between track width and viewport width. Keep the translated track’s measurement separate from the target whose layout position drives progress.',
				'Scrolling text can use the same transform mappings on ordinary text elements. Repeated decorative text should be hidden from assistive technology while one readable label remains. Astra’s supported text techniques are documented in Text animation; a separate ticker product is not required.'
			),
			{
				id: 'choices',
				title: 'Choose a technique',
				text: [],
				table: {
					columns: ['Goal', 'API', 'What controls progress'],
					rows: [
						[
							'Reveal once or on each entry',
							'whileInView + viewport',
							'A time-based transition after an intersection change'
						],
						['Start application work on visibility', 'useInView', 'Reactive element visibility'],
						['Reading or carousel progress', 'useScroll', 'Exact scroll position between offsets'],
						[
							'Color, clip, or parallax mapping',
							'useScroll + useTransform',
							'A derived relationship to scroll progress'
						],
						[
							'A softened following effect',
							'useScroll + useSpring',
							'A spring following scroll progress'
						],
						[
							'Pause work in a background tab',
							'usePageInView',
							'Document visibility rather than element intersection'
						]
					]
				}
			},
			section(
				'performance',
				'Performance and lifecycle',
				'Use native timeline acceleration where the browser and value mapping support it, with JavaScript fallback for other cases. Opacity and transforms are generally preferable to layout-changing properties for continuous movement. Adding many scroll subscriptions or frame-based content-size checks has a cost even when the resulting animation looks simple.',
				'Managed helpers own their subscriptions and release them on teardown or hidden Activity. trackContentSize is opt-in because it checks changing content dimensions each frame. Set image dimensions and keep the measured target separate from transformed artwork to make progress predictable.',
				'SSR has no scroll measurement. Progress starts at zero and updates on the client; reveal helpers have explicit initial behavior. Keep server content readable and let enhancement add motion after hydration.'
			),
			section(
				'accessibility',
				'Accessibility and troubleshooting',
				'Keep native scrolling available to touch, wheel, and keyboard users. A custom scroll region should be focusable when users need keyboard access and have an accessible name. Do not trap scrolling just to preserve an animation scene.',
				'Use reduced-motion policy for triggered movement and choose reduced mappings for manually linked parallax or scale. A useful progress indicator can remain while decorative spatial effects are removed.',
				'If a target never enters, check clipping and the chosen root. If linked progress stays at zero, verify overflow and scroll range. If it changes after a later scroll but not a content resize, enable content-size tracking where needed. If transformed artwork distorts your expectations, remember target progress uses layout coordinates.'
			),
			related(
				'use-scroll',
				'use-in-view',
				'use-transform',
				'use-spring',
				'accessibility',
				'text-animation'
			)
		]
	}
];
