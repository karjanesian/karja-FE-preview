<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = { children: Snippet; className?: string };
	let { children, className = '' }: Props = $props();
</script>

<div class="w-full px-4 pt-6 pb-16 sm:px-8 sm:pt-8 lg:px-12 {className}">
	{@render children()}
</div>
