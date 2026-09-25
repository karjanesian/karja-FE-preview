<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		variant?: 'standard' | 'wide' | 'narrow';
		className?: string;
	};
	let { children, variant = 'standard', className = '' }: Props = $props();

	const maxWidthClass = $derived(
		variant === 'wide'
			? 'max-w-[1440px]'
			: variant === 'narrow'
				? 'max-w-[960px]'
				: 'max-w-[1240px]'
	);
</script>

<div class="mx-auto w-full {maxWidthClass} space-y-6 sm:space-y-8 {className}">
	{@render children()}
</div>
