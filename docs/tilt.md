# Tilt

`import { Tilt } from 'astra-motion/tilt'` renders an unstyled block wrapper around
an ordinary `children` snippet. Content is complete and neutral during SSR and
without JavaScript. Buttons, links, inputs, focus and native scrolling remain native.

| Prop                       | Default                                    | Contract                                                                                                            |
| -------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `perspective`              | `800`                                      | Positive finite CSS perspective distance in pixels; invalid values use 800.                                         |
| `maxRotateX`, `maxRotateY` | `12`                                       | Maximum target angle in degrees, clamped to 0–45; invalid values use 12. A spring may briefly overshoot its target. |
| `axis`                     | `'both'`                                   | `'x'` rotates around X from vertical pointer position; `'y'` around Y from horizontal position.                     |
| `spring`                   | `{ stiffness: 260, damping: 26, mass: 1 }` | Shared engine spring options for tracking and return.                                                               |
| `disabled`                 | `false`                                    | Immediately neutralizes and releases pointer tracking.                                                              |
| native div attributes      | —                                          | Forwarded to the outer measurement host, including class, style and event handlers.                                 |

Pointer leave/cancel springs back to neutral. Touch pointers and coarse or non-hover
primary inputs stay neutral; Tilt never prevents default events or captures pointers.
Disabling and hidden Activity settle immediately, cancel playback and release
event/resize/preference subscriptions. Reduced motion also settles immediately and
releases pointer/resize tracking, while retaining preference observation for live
recovery. Revealing Activity starts neutral and tracks the next pointer movement.
Inherited `MotionConfig` applies:
`always` disables tilt, `never` explicitly overrides OS preference, and `user` (the
default) follows live OS changes. Local options and config updates are reactive.

The outer host measures fresh client-space bounds on pointer movement. Resize
recomputes the current pointer target. A separate middle host owns perspective and
a separate inner host owns rotation. No perpetual loop or per-frame Svelte state
updates are used. Layout/entrance transforms belong on an ancestor:

```svelte
<script lang="ts">
	import { motion } from 'astra-motion';
	import { Tilt } from 'astra-motion/tilt';
</script>

<motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
	<Tilt maxRotateX={8} maxRotateY={10} perspective={900}>
		<article>
			<h2>Native content</h2>
			<button>Open details</button>
		</article>
	</Tilt>
</motion.div>
```

This is also the migration from a consumer-owned pointer/MotionValue tilt wrapper:
keep the existing outer entrance/layout component and replace only its pointer
tracking and rotated inner container with `Tilt`. Existing visual styling remains
on your content or the outer `class`/`style` props.

Translation and axis-aligned scale on ancestors are supported through client-space
measurement. Pointer mapping for externally rotated/skewed ancestors, arbitrary
external 3D transforms, nested perspective or layout projection inside the tilted
content is not guaranteed. Put projection on the outer ancestor. Do not overwrite
Tilt’s internal perspective or transform styles. No device-performance guarantee is
implied, and no persistent `will-change` layer is allocated.
