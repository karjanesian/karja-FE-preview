<script lang="ts">
	import type { SvelteComponent } from 'svelte';

	type IconComponent = new (...args: any[]) => SvelteComponent;

	type Trend = {
		value: string;
		isPositive: boolean;
		label?: string;
	};

	type Props = {
		id?: string;
		title: string;
		value: string | number;
		subtitle?: string;
		icon?: IconComponent;
		trend?: Trend;
		tooltip?: string;
		badge?: string;
	};

	let { id, title, value, subtitle, icon: Icon, trend, tooltip, badge }: Props = $props();
</script>

<div
	{id}
	title={tooltip}
	class="rounded-xl border border-[#E4EBE7] bg-white p-4 transition-shadow hover:shadow-sm sm:p-5"
>
	<div class="mb-2 flex items-center justify-between gap-2">
		<span class="truncate text-xs font-medium tracking-tight text-[#52776C]">
			{title}
		</span>
		{#if badge}
			<span
				class="rounded-full border border-[#D0E6DC] bg-[#EBF5F0] px-2 py-0.5 text-[10px] font-semibold text-[#0C7B58]"
			>
				{badge}
			</span>
		{:else if Icon}
			<div class="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F0F7F3] text-[#0C7B58]">
				<Icon class="h-4 w-4" />
			</div>
		{/if}
	</div>

	<div class="flex items-baseline justify-between gap-2">
		<div class="font-sans text-xl font-bold tracking-tight text-[#0E2E25] sm:text-2xl">
			{value}
		</div>
	</div>

	{#if subtitle || trend}
		<div class="mt-2 flex items-center gap-2 text-xs">
			{#if trend}
				<span
					class="py-0.2 rounded px-1.5 text-[11px] font-semibold {trend.isPositive
						? 'bg-emerald-50 text-emerald-700'
						: 'bg-rose-50 text-rose-700'}"
					title={trend.label}
				>
					{trend.value}
				</span>
			{/if}
			{#if subtitle}
				<span class="truncate text-[11px] text-[#698E82]">
					{subtitle}
				</span>
			{/if}
		</div>
	{/if}
</div>
