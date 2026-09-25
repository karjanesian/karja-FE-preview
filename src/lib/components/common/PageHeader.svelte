<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		title: Snippet | string;
		description?: Snippet | string;
		actions?: Snippet;
		badge?: Snippet;
		className?: string;
	};
	let { title, description, actions, badge, className = '' }: Props = $props();
</script>

<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between {className}">
	<div class="space-y-1 sm:space-y-1.5">
		<div class="flex flex-wrap items-center gap-3">
			<h1
				class="text-2xl font-bold tracking-tight text-ink sm:text-[30px] sm:leading-[38px] lg:text-[34px] lg:leading-[42px]"
			>
				{#if typeof title === 'string'}{title}{:else}{@render title()}{/if}
			</h1>
			{#if badge}<div>{@render badge()}</div>{/if}
		</div>
		{#if description}
			<p
				class="text-sm font-normal text-sage sm:text-[15px] sm:leading-[24px] lg:text-[16px] lg:leading-[26px]"
			>
				{#if typeof description === 'string'}{description}{:else}{@render description()}{/if}
			</p>
		{/if}
	</div>
	{#if actions}
		<div class="flex shrink-0 items-center gap-2.5 self-start sm:self-center">
			{@render actions()}
		</div>
	{/if}
</div>
