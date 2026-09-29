import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import Fixture from './RCNativeContract.svelte';
it('serializes equivalent native/component initial state and explicit native ancestry', () => {
	const { body } = render(Fixture);
	expect(body.match(/opacity:0.2/g)).toHaveLength(2);
	expect(body.match(/translateX\(35px\)/g)).toHaveLength(2);
	expect(body.match(/opacity:0.7/g)).toHaveLength(2);
});
