<script lang="ts">
	import { getProductTypeTheme } from '$lib/domain/productTheme';
	import { m } from '$lib/paraglide/messages.js';

	type Props = {
		type: unknown;
		subtype?: string;
		size?: 'xs' | 'sm' | 'md';
		showIcon?: boolean;
		className?: string;
	};
	let { type, subtype, size = 'sm', showIcon = true, className = '' }: Props = $props();

	const theme = $derived(getProductTypeTheme(type));
	const iconSizes = { xs: 'h-3 w-3', sm: 'h-3.5 w-3.5', md: 'h-4 w-4' };
	const textSizes = { xs: 'text-[11px]', sm: 'text-xs', md: 'text-sm' };
</script>

<span class="inline-flex items-center gap-1.5 font-medium {textSizes[size]} {className}">
	<span class="inline-flex items-center gap-1 font-semibold {theme.textColor}">
		{#if showIcon}<theme.icon class="{iconSizes[size]} shrink-0" />{/if}
		<span>{m[theme.labelKey]()}</span>
	</span>
	{#if subtype}
		<span class="text-[#B0CCC1] select-none">·</span>
		<span class="font-normal text-sage">{subtype}</span>
	{/if}
</span>
