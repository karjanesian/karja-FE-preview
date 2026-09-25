<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import CheckCircle2 from 'lucide-svelte/icons/check-circle-2';
	import { m } from '$lib/paraglide/messages.js';

	type IconComponent = new (...args: any[]) => SvelteComponent;

	type Props = {
		id?: string;
		title: string;
		count: number;
		statusLabel: string;
		actionLabel: string;
		onAction: () => void;
		icon: IconComponent;
		emptyLabel?: string;
	};

	let {
		id,
		title,
		count,
		statusLabel,
		actionLabel,
		onAction,
		icon: Icon,
		emptyLabel = m.ad_attention_empty()
	}: Props = $props();

	const hasItems = $derived(count > 0);
</script>

<div
	{id}
	class="flex flex-col justify-between rounded-xl border p-4 transition-all sm:p-5 {hasItems
		? 'border-[#E4EBE7] bg-white shadow-xs hover:border-[#0C7B58]/30'
		: 'border-[#E8EFEA] bg-[#FAFDFB]'}"
>
	<div>
		<div class="mb-3 flex items-center justify-between gap-2">
			<div class="flex items-center gap-2">
				<div
					class="flex h-7 w-7 items-center justify-center rounded-lg {hasItems
						? 'bg-[#EBF5F0] text-[#0C7B58]'
						: 'bg-slate-100 text-slate-400'}"
				>
					<Icon class="h-4 w-4" />
				</div>
				<span class="text-xs font-semibold tracking-tight text-[#0E2E25]">
					{title}
				</span>
			</div>

			{#if hasItems}
				<span
					class="inline-flex items-center rounded-full border border-[#FDE68A] bg-[#FEF3C7] px-2 py-0.5 text-xs font-bold text-[#92400E]"
				>
					{count}
				</span>
			{:else}
				<span class="inline-flex items-center gap-1 text-[11px] font-medium text-[#0C7B58]">
					<CheckCircle2 class="h-3.5 w-3.5 text-[#0C7B58]" />
					{m.ad_attention_ok()}
				</span>
			{/if}
		</div>

		<div class="mb-4">
			{#if hasItems}
				<p class="text-sm font-semibold text-[#0E2E25]">
					{statusLabel}
				</p>
			{:else}
				<p class="text-xs text-[#698E82]">
					{emptyLabel}
				</p>
			{/if}
		</div>
	</div>

	<div>
		<button
			type="button"
			onclick={onAction}
			class="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors {hasItems
				? 'border border-[#D0E6DC] bg-[#F0F7F3] text-[#0C7B58] hover:bg-[#E2F0E8]'
				: 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}"
		>
			<span>{actionLabel}</span>
			<ArrowRight class="h-3.5 w-3.5" />
		</button>
	</div>
</div>
