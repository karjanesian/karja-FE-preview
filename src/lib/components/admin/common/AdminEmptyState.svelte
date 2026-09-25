<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import Inbox from 'lucide-svelte/icons/inbox';

	type IconComponent = new (...args: any[]) => SvelteComponent;

	type Props = {
		icon?: IconComponent;
		title: string;
		description: string;
		actionLabel?: string;
		onAction?: () => void;
		className?: string;
	};

	let {
		icon: Icon = Inbox,
		title,
		description,
		actionLabel,
		onAction,
		className = ''
	}: Props = $props();
</script>

<div
	class="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#D0E6DC] bg-[#FAFDFB] px-4 py-10 text-center {className}"
>
	<div
		class="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#EBF5F0] text-[#0C7B58]"
	>
		<Icon class="h-5 w-5" />
	</div>
	<h4 class="mb-1 text-sm font-semibold text-[#0E2E25]">
		{title}
	</h4>
	<p class="mb-4 max-w-sm text-xs text-[#52776C]">
		{description}
	</p>
	{#if actionLabel && onAction}
		<button
			type="button"
			onclick={onAction}
			class="cursor-pointer rounded-lg bg-[#0C7B58] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#096849]"
		>
			{actionLabel}
		</button>
	{/if}
</div>
