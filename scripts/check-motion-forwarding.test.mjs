import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkMotionForwarding } from './check-motion-forwarding.mjs';
test('detects demonstrably dropped attachment symbols without mount timers', () => {
	assert.equal(checkMotionForwarding('<button>Missing</button>').length, 1);
	assert.deepEqual(
		checkMotionForwarding(
			'<script>let { children, ...props } = $props()</script><button {...props}>{@render children?.()}</button>'
		),
		[]
	);
	assert.deepEqual(
		checkMotionForwarding(
			'<script>let { visible, ...props } = $props()</script>{#if visible}<button {...props}>Delayed root</button>{/if}'
		),
		[]
	);
	assert.deepEqual(checkMotionForwarding('<LazyRoot />'), []);
	assert.deepEqual(
		checkMotionForwarding('<button {@attach forwarded}>Explicit attachment</button>'),
		[]
	);
});
