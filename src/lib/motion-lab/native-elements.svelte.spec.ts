import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { flushSync } from 'svelte';
import NativeElements from './NativeElements.svelte';

it('preserves native input conversion, binding/event ordering and form reset', async () => {
	const screen = render(NativeElements);
	const text = screen
		.getByRole('textbox', { name: 'Text', exact: true })
		.element() as HTMLInputElement;
	const amount = screen.getByRole('spinbutton', { name: 'Amount' }).element() as HTMLInputElement;
	text.value = 'typed';
	text.dispatchEvent(new Event('input', { bubbles: true }));
	expect(screen.component.snapshot().text).toBe('typed');
	const native = screen
		.getByRole('textbox', { name: 'Native text', exact: true })
		.element() as HTMLInputElement;
	native.value = 'typed';
	native.dispatchEvent(new Event('input', { bubbles: true }));
	expect(screen.component.snapshot().inputEventValue).toBe(
		screen.component.snapshot().nativeInputEventValue
	);
	expect(screen.component.snapshot().nativeText).toBe('typed');
	amount.value = '19';
	amount.dispatchEvent(new Event('input', { bubbles: true }));
	expect(screen.component.snapshot().amount).toBe(19);
	amount.value = '';
	amount.dispatchEvent(new Event('input', { bubbles: true }));
	expect(screen.component.snapshot().amount).toBeNull();
	text.form!.reset();
	await expect.poll(() => screen.component.snapshot().text).toBe('reset text');
	expect(screen.component.snapshot().amount).toBe(7);
});

it('updates checkbox, textarea, object selects and details in both directions', async () => {
	const screen = render(NativeElements);
	const checkbox = screen
		.getByRole('checkbox', { name: 'Checked', exact: true })
		.element() as HTMLInputElement;
	const notes = screen.getByRole('textbox', { name: 'Notes' }).element() as HTMLTextAreaElement;
	const single = screen.getByRole('combobox', { name: 'Single' }).element() as HTMLSelectElement;
	const multiple = screen.getByRole('listbox', { name: 'Multiple' }).element() as HTMLSelectElement;
	const details = screen.container.querySelector('details')!;
	expect(checkbox.indeterminate).toBe(true);
	checkbox.click();
	expect(screen.component.snapshot().checked).toBe(false);
	expect(screen.component.snapshot().indeterminate).toBe(false);
	notes.value = 'typed notes';
	notes.dispatchEvent(new Event('input', { bubbles: true }));
	expect(screen.component.snapshot().notes).toBe('typed notes');
	single.selectedIndex = 1;
	single.dispatchEvent(new Event('change', { bubbles: true }));
	expect(screen.component.snapshot().selected.id).toBe('two');
	multiple.options[1].selected = true;
	multiple.dispatchEvent(new Event('change', { bubbles: true }));
	expect(screen.component.snapshot().multiple.map((option) => option.id)).toEqual(['one', 'two']);
	flushSync(() => screen.component.update());
	expect(notes.value).toBe('updated');
	expect(single.selectedIndex).toBe(1);
	expect(Array.from(multiple.selectedOptions).map((option) => option.textContent)).toEqual(['two']);
	expect(details.open).toBe(true);
	details.open = false;
	details.dispatchEvent(new Event('toggle'));
	expect(screen.component.snapshot().open).toBe(false);
});

it('forwards files, handlers, attachments and typed refs and cleans them up after exit', async () => {
	const screen = render(NativeElements);
	const file = screen.getByLabelText('Files').element() as HTMLInputElement;
	const transfer = new DataTransfer();
	transfer.items.add(new File(['motion'], 'motion.txt', { type: 'text/plain' }));
	file.files = transfer.files;
	file.dispatchEvent(new Event('change', { bubbles: true }));
	expect(screen.component.snapshot().files?.[0].name).toBe('motion.txt');
	flushSync(() => screen.component.clearFiles());
	expect(file.files).toHaveLength(0);
	const button = screen.getByTestId('native-motion-button').element() as HTMLButtonElement;
	expect(screen.component.snapshot().ref).toBe(button);
	expect(button.dataset.attached).toBe('yes');
	button.click();
	expect(screen.component.snapshot().clicks).toBe(1);
	await expect.poll(() => Number(getComputedStyle(button).opacity)).toBe(1);
	flushSync(() => screen.component.update());
	expect(button.style.color).toBe('blue');
	expect(Number(getComputedStyle(button).opacity)).toBe(1);
	flushSync(() => screen.component.remove());
	expect(button.isConnected).toBe(true);
	await expect.poll(() => button.isConnected).toBe(false);
	expect(screen.component.snapshot().ref).toBeNull();
	expect(screen.component.snapshot().attachmentMounts).toBe(1);
	expect(screen.component.snapshot().attachmentCleanups).toBe(1);
});

it('gives replacement input/select branches independent motion ownership and protects their refs', async () => {
	const screen = render(NativeElements);
	const input = screen.component.snapshot().changingRef!;
	const select = screen.component.snapshot().changingSelectRef!;
	flushSync(() => screen.component.switchControls());
	const replacement = screen.component.snapshot();
	expect(replacement.changingRef).not.toBe(input);
	expect(replacement.changingRef?.type).toBe('checkbox');
	expect(replacement.changingSelectRef).not.toBe(select);
	expect(replacement.changingSelectRef?.multiple).toBe(true);
	await expect.poll(() => input.isConnected || select.isConnected).toBe(false);
	expect(screen.component.snapshot().changingRef).toBe(replacement.changingRef);
	expect(screen.component.snapshot().changingSelectRef).toBe(replacement.changingSelectRef);
});
