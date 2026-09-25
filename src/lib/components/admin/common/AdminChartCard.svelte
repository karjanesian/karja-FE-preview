<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		id?: string;
		title: string;
		subtitle?: string;
		action?: Snippet;
		children: Snippet;
		className?: string;
	};

	let { id, title, subtitle, action, children, className = '' }: Props = $props();
</script>

<div
	{id}
	class="flex flex-col justify-between rounded-xl border border-[#E4EBE7] bg-white p-4 sm:p-6 {className}"
>
	<div class="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
		<div>
			<h3 class="text-sm font-bold tracking-tight text-[#0E2E25] sm:text-base">
				{title}
			</h3>
			{#if subtitle}
				<p class="mt-0.5 text-xs text-[#52776C]">
					{subtitle}
				</p>
			{/if}
		</div>
		{#if action}
			<div class="flex items-center gap-2 self-start sm:self-auto">
				{@render action()}
			</div>
		{/if}
	</div>

	<div class="min-h-[220px] w-full flex-1">
		{@render children()}
	</div>
</div>
