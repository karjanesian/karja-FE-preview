<script lang="ts">
	import { goto } from '$app/navigation';
	import { PRODUCT_THEMES } from '$lib/domain/productTheme';
	import * as m from '$lib/paraglide/messages.js';
	import type { ProductType } from '$lib/types';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Compass from 'lucide-svelte/icons/compass';
	import X from 'lucide-svelte/icons/x';

	type Props = {
		onClose: () => void;
	};
	let { onClose }: Props = $props();

	const choices: ProductType[] = ['digital', 'session', 'service'];

	const lauContent: Record<ProductType, { title: () => string; tag: () => string }> = {
		digital: { title: () => m.pc_lau_digital_title(), tag: () => m.pc_lau_digital_tag() },
		session: { title: () => m.pc_lau_session_title(), tag: () => m.pc_lau_session_tag() },
		service: { title: () => m.pc_lau_service_title(), tag: () => m.pc_lau_service_tag() }
	};

	function selectDirectType(type: ProductType) {
		void goto(`/dashboard/products/new/draft?type=${type}`);
	}

	function startGuidedDiscovery() {
		void goto('/dashboard/products/new/idea');
	}
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-[#092B21]/50 p-4 backdrop-blur-xs"
	onclick={onClose}
	role="presentation"
>
	<div
		class="relative w-full max-w-xl space-y-6 overflow-hidden rounded-2xl border border-[#E5ECE7] bg-white p-6 shadow-lg sm:p-8"
		onclick={(e) => e.stopPropagation()}
		role="presentation"
	>
		<div class="flex items-start justify-between gap-4 pb-1">
			<div class="max-w-md space-y-1.5">
				<h2 class="text-xl font-bold tracking-tight text-[#0E2E25] sm:text-2xl">
					{m.pc_launcher_title()}
				</h2>
				<p class="text-xs leading-relaxed text-[#52776C] sm:text-sm">{m.pc_launcher_desc()}</p>
			</div>
			<button
				type="button"
				onclick={onClose}
				class="flex-shrink-0 cursor-pointer rounded-xl p-2 text-[#52776C] transition-colors hover:bg-[#F0F6F3] hover:text-[#0E2E25]"
				title={m.common_close()}
			>
				<X class="h-5 w-5" />
			</button>
		</div>

		<div class="space-y-3 pt-1">
			{#each choices as type (type)}
				{@const theme = PRODUCT_THEMES[type]}
				<div
					role="button"
					tabindex="0"
					onclick={() => selectDirectType(type)}
					onkeydown={(e) => e.key === 'Enter' && selectDirectType(type)}
					class="group relative flex cursor-pointer items-center gap-4 rounded-xl border border-[#E5ECE7] bg-white p-4 transition-all hover:border-[#A6D7BB] hover:bg-[#F8FBF9] sm:p-5"
				>
					<div
						class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105 {theme.iconBgColor}"
					>
						<theme.icon class="h-5 w-5 stroke-[1.8]" />
					</div>

					<div class="min-w-0 flex-1 space-y-0.5">
						<div class="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
							<h3
								class="truncate text-sm font-semibold text-[#0E2E25] transition-colors group-hover:text-[#008A5E] sm:text-base"
							>
								{lauContent[type].title()}
							</h3>
							<span class="text-[11px] font-medium {theme.textColor}">
								• {m[theme.labelKey]()}
							</span>
						</div>
						<p class="line-clamp-2 text-xs leading-relaxed text-[#52776C]">
							{lauContent[type].tag()}
						</p>
					</div>

					<div
						class="flex-shrink-0 pl-1 text-[#8DA69B] transition-all group-hover:translate-x-1 group-hover:text-[#008A5E]"
					>
						<ArrowRight class="h-4 w-4 stroke-[2]" />
					</div>
				</div>
			{/each}
		</div>

		<div class="border-t border-[#EFF5F1] pt-2">
			<div
				role="button"
				tabindex="0"
				onclick={startGuidedDiscovery}
				onkeydown={(e) => e.key === 'Enter' && startGuidedDiscovery()}
				class="group flex cursor-pointer flex-col justify-between gap-3 rounded-xl border border-[#E5ECE7] bg-[#F8FBF9] p-4 transition-all hover:border-[#A6D7BB] sm:flex-row sm:items-center sm:p-4.5"
			>
				<div class="space-y-0.5">
					<div class="flex items-center gap-1.5 text-xs font-semibold text-[#0E2E25]">
						<Compass class="h-3.5 w-3.5 text-[#008A5E]" />
						<span>{m.pc_guided_title()}</span>
					</div>
					<p class="text-xs leading-relaxed text-[#52776C]">{m.pc_launcher_guided_desc()}</p>
				</div>

				<div
					class="inline-flex items-center gap-1 pt-1 text-xs font-semibold whitespace-nowrap text-[#008A5E] transition-all group-hover:translate-x-0.5 group-hover:text-[#007550] sm:pt-0"
				>
					<span>{m.pc_guided_cta()}</span>
					<ArrowRight class="h-3.5 w-3.5 stroke-[2]" />
				</div>
			</div>
		</div>
	</div>
</div>
