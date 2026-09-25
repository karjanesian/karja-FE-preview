<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';

	type SingleRootProps = Extract<SelectPrimitive.RootProps, { type: 'single' }>;

	let {
		open = $bindable(false),
		value = $bindable(),
		items,
		...restProps
	}: Omit<SingleRootProps, 'items' | 'value' | 'type'> & {
		value?: string;
		items?: Record<string, string>;
	} = $props();

	const normalizedItems = $derived(
		items ? Object.entries(items).map(([value, label]) => ({ value, label })) : undefined
	);
</script>

<SelectPrimitive.Root
	type="single"
	bind:open
	bind:value={value as never}
	items={normalizedItems}
	{...restProps}
/>
