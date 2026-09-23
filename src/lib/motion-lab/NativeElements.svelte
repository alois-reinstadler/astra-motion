<script lang="ts">
	import { motion, MotionConfig } from '$lib/motion/index.js';
	const options = [{ id: 'one' }, { id: 'two' }];
	let text = $state<string | null>('hello');
	let nativeText = $state('hello');
	let nativeInputEventValue: string | null = null;
	let amount = $state<number | null>(12);
	let checked = $state(true);
	let indeterminate = $state(true);
	let files = $state<FileList>();
	let notes = $state<string | null>('notes');
	let selected = $state.raw(options[0]);
	let multiple = $state.raw([options[0]]);
	let open = $state(false);
	let ref = $state<HTMLButtonElement | null>();
	let changingRef = $state<HTMLInputElement | null>();
	let changingSelectRef = $state<HTMLSelectElement | null>();
	let inputKind = $state<'text' | 'checkbox'>('text');
	let selectMultiple = $state(false);
	let changingSelection = $state<string | string[]>('one');
	let visible = $state(true);
	let color = $state('red');
	let clicks = 0;
	let attachmentMounts = 0;
	let attachmentCleanups = 0;
	let inputEventValue: string | null = null;

	export function snapshot() {
		return {
			text,
			nativeText,
			nativeInputEventValue,
			amount,
			checked,
			indeterminate,
			files,
			notes,
			selected,
			multiple,
			open,
			ref,
			changingRef,
			changingSelectRef,
			clicks,
			attachmentMounts,
			attachmentCleanups,
			inputEventValue
		};
	}
	export function update() {
		text = 'parent';
		amount = 24;
		checked = false;
		indeterminate = false;
		notes = 'updated';
		selected = options[1];
		multiple = [options[1]];
		open = true;
		color = 'blue';
	}
	export function switchControls() {
		inputKind = 'checkbox';
		selectMultiple = true;
		changingSelection = ['two'];
	}
	export function remove() {
		visible = false;
	}
	export function clearFiles() {
		files = new DataTransfer().files;
	}

	function observeButton(node: HTMLButtonElement) {
		attachmentMounts++;
		node.dataset.attached = 'yes';
		return () => {
			attachmentCleanups++;
		};
	}
</script>

<MotionConfig reducedMotion="never" transition={{ duration: 0.02 }}>
	<form aria-label="Motion controls">
		<input
			aria-label="Native text"
			bind:value={nativeText}
			oninput={() => {
				nativeInputEventValue = nativeText;
			}}
		/>
		<motion.input
			aria-label="Text"
			bind:value={text}
			defaultValue="reset text"
			oninput={(event) => {
				inputEventValue = text;
				event.currentTarget.checkValidity();
			}}
		/>
		<motion.input aria-label="Amount" type="number" bind:value={amount} defaultValue="7" />
		<motion.input
			aria-label="Checked"
			type="checkbox"
			bind:checked
			bind:indeterminate
			defaultChecked
		/>
		<motion.input aria-label="Files" type="file" bind:files />
		<motion.textarea aria-label="Notes" bind:value={notes} />
		<motion.select aria-label="Single" bind:value={selected}>
			{#each options as option (option.id)}
				<option value={option}>{option.id}</option>
			{/each}
		</motion.select>
		<motion.select aria-label="Multiple" multiple bind:value={multiple}>
			{#each options as option (option.id)}
				<option value={option}>{option.id}</option>
			{/each}
		</motion.select>
		<motion.details bind:open
			><summary>Details</summary>
			<p>Contents</p></motion.details
		>
		<motion.input
			aria-label="Changing type"
			type={inputKind}
			bind:ref={changingRef}
			motion={{ exit: { opacity: 0 } }}
		/>
		<motion.select
			aria-label="Changing multiple"
			multiple={selectMultiple}
			bind:value={changingSelection}
			bind:ref={changingSelectRef}
			motion={{ exit: { opacity: 0 } }}
		>
			<option>one</option><option>two</option>
		</motion.select>
		<motion.input aria-label="Unbound text" value="unbound" />
		<motion.input aria-label="Unbound checkbox" type="checkbox" checked />
		{#if visible}
			<motion.button
				bind:ref
				type="button"
				data-testid="native-motion-button"
				style={`color:${color};opacity:0.8`}
				onclick={(event) => {
					clicks++;
					event.currentTarget.focus();
				}}
				motion={{ initial: { opacity: 0.2 }, animate: { opacity: 1 }, exit: { opacity: 0 } }}
				{@attach observeButton}>Action</motion.button
			>
		{/if}
	</form>
</MotionConfig>
