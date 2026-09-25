<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';

	type Props = {
		onstart: () => void;
	};
	let { onstart }: Props = $props();

	type MobileCard = {
		id: string;
		title: () => string;
		category: () => string;
		price: string;
		showPrice: boolean;
		src: string;
		placement: string;
		rotate: string;
		width: string;
		dy: string;
	};

	const cards: MobileCard[] = [
		{
			id: 'qris',
			title: () => m.ld_card_qris_t(),
			category: () => m.ld_mc_qris_c(),
			price: 'Rp29.000',
			showPrice: false,
			src: 'https://file.garden/ao1B7sLFNyZKt73m/landing%20page/1.png',
			placement: 'left: -12px; top: clamp(10px, 2.4vh, 22px);',
			rotate: '-6deg',
			width: 'clamp(86px, 25vw, 112px)',
			dy: '-14px'
		},
		{
			id: 'aiWork',
			title: () => m.ld_mc_ai_t(),
			category: () => m.ld_mc_ai_c(),
			price: 'Rp29.000',
			showPrice: false,
			src: 'https://file.garden/ao1B7sLFNyZKt73m/landing%20page/4.png',
			placement: 'left: clamp(26%, 30vw, 35%); top: clamp(4px, 1.2vh, 12px);',
			rotate: '-2deg',
			width: 'clamp(80px, 23vw, 104px)',
			dy: '-14px'
		},
		{
			id: 'photoProduct',
			title: () => m.ld_card_photo_t(),
			category: () => m.ld_mc_photo_c(),
			price: 'Rp49.000',
			showPrice: true,
			src: 'https://file.garden/ao1B7sLFNyZKt73m/landing%20page/2.png',
			placement: 'right: clamp(8px, 2.8vw, 16px); top: clamp(12px, 2.6vh, 26px);',
			rotate: '4deg',
			width: 'clamp(116px, 32vw, 142px)',
			dy: '-14px'
		},
		{
			id: 'reelsUmkm',
			title: () => m.ld_mc_reels_t(),
			category: () => m.ld_mc_reels_c(),
			price: 'Rp75.000',
			showPrice: true,
			src: 'https://file.garden/ao1B7sLFNyZKt73m/landing%20page/6.png',
			placement: 'left: clamp(8px, 2.8vw, 16px); bottom: clamp(14px, 2.8vh, 26px);',
			rotate: '2.5deg',
			width: 'clamp(116px, 32vw, 144px)',
			dy: '14px'
		},
		{
			id: 'lpdp',
			title: () => m.ld_card_lpdp_t(),
			category: () => m.ld_mc_lpdp_c(),
			price: 'Rp25.000',
			showPrice: false,
			src: 'https://file.garden/ao1B7sLFNyZKt73m/landing%20page/7.png',
			placement: 'right: clamp(27%, 31vw, 36%); bottom: clamp(6px, 1.2vh, 14px);',
			rotate: '3deg',
			width: 'clamp(80px, 23vw, 104px)',
			dy: '14px'
		},
		{
			id: 'firstSalaryBudget',
			title: () => m.ld_card_salary_t(),
			category: () => m.ld_mc_salary_c(),
			price: 'Rp35.000',
			showPrice: false,
			src: 'https://file.garden/ao1B7sLFNyZKt73m/landing%20page/8.png',
			placement: 'right: -12px; bottom: clamp(12px, 2.4vh, 24px);',
			rotate: '-5deg',
			width: 'clamp(86px, 25vw, 112px)',
			dy: '14px'
		}
	];
</script>

<section
	class="relative flex h-[calc(100svh-74px)] max-h-[820px] min-h-[580px] w-full items-center justify-center overflow-hidden bg-[#FAFDFB] select-none"
	aria-label={m.ld_mhero_aria()}
>
	<div class="pointer-events-none absolute inset-0 z-10 overflow-hidden">
		{#each cards as card, i (card.id)}
			<div
				class="mc-card absolute will-change-transform"
				style="{card.placement} width: {card.width}; rotate: {card.rotate}; --dy: {card.dy}; animation-delay: {0.1 +
					i * 0.07}s;"
			>
				<div
					class="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-[#E1E6E2]/90 bg-[#F5F8F6] shadow-md"
				>
					<img
						src={card.src}
						alt={card.title()}
						class="absolute inset-0 h-full w-full object-cover"
						loading="eager"
						draggable="false"
					/>
					<div
						class="pointer-events-none absolute inset-x-1.5 bottom-1.5 flex items-center justify-between rounded-xl border border-[#E1E6E2] bg-white/95 px-2 py-1.5 text-left shadow-2xs backdrop-blur-xs"
					>
						<div class="min-w-0 truncate pr-1">
							<div class="truncate text-[10px] leading-tight font-bold text-[#0A261D]">
								{card.title()}
							</div>
							<div class="truncate text-[8px] leading-tight text-[#6E7873]">
								{card.category()}
							</div>
						</div>
						{#if card.showPrice && card.price}
							<div
								class="shrink-0 rounded-md bg-[#E8F5F0] px-1.5 py-0.5 text-[9px] font-bold whitespace-nowrap text-[#008A5E]"
							>
								{card.price}
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>

	<div
		class="mc-center pointer-events-auto relative z-20 mx-auto flex w-full max-w-[380px] flex-col items-center justify-center px-4 text-center"
	>
		<h1
			class="mx-auto max-w-[340px] text-center font-bold tracking-tight text-[#0A261D]"
			style="font-size: clamp(2.05rem, 8.6vw, 2.5rem); line-height: 1.08;"
		>
			{m.ld_hero_heading()}
		</h1>

		<p
			class="mx-auto mt-3 max-w-[320px] text-center text-[14px] leading-relaxed font-normal text-[#4A5852]"
		>
			{m.ld_mhero_sub()}
		</p>

		<div class="mt-6 flex w-full max-w-[300px] justify-center sm:mt-7">
			<button
				type="button"
				onclick={onstart}
				class="group inline-flex h-14 min-h-[56px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-[#008A5E] px-6 py-3.5 text-base font-semibold whitespace-nowrap text-white shadow-xs transition-all select-none hover:bg-[#007550] active:scale-[0.98]"
			>
				<span>{m.ld_cta_first_product()}</span>
				<ArrowRight class="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
			</button>
		</div>
	</div>
</section>

<style>
	.mc-card {
		animation: mc-card-in 0.65s cubic-bezier(0.21, 0.47, 0.32, 0.98) both;
	}
	@keyframes mc-card-in {
		from {
			opacity: 0;
			translate: 0 var(--dy, -14px);
			scale: 0.94;
		}
		to {
			opacity: 1;
			translate: 0 0;
			scale: 1;
		}
	}
	.mc-center {
		animation: mc-center-in 0.55s ease-out both;
	}
	@keyframes mc-center-in {
		from {
			opacity: 0;
			translate: 0 8px;
		}
		to {
			opacity: 1;
			translate: 0 0;
		}
	}
</style>
