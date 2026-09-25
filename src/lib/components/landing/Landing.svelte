<script lang="ts">
	import { goto } from '$app/navigation';
	import * as m from '$lib/paraglide/messages.js';
	import { seller } from '$lib/stores/seller.svelte';
	import { scroll } from 'motion';
	import PublicNavbar from '$lib/components/public/PublicNavbar.svelte';
	import PublicFooter from '$lib/components/public/PublicFooter.svelte';
	import MobileHero from './MobileHero.svelte';
	import HiddenValueStory from './HiddenValueStory.svelte';
	import ProductFormsSection from './ProductFormsSection.svelte';
	import EndToEndFlow from './EndToEndFlow.svelte';
	import StorefrontSection from './StorefrontSection.svelte';
	import BlogSection from './BlogSection.svelte';
	import FinalCtaSection from './FinalCtaSection.svelte';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import { resolve } from '$app/paths';

	function start() {
		void goto(resolve(seller.isAuthenticated ? '/dashboard' : '/login'));
	}

	type HeroCard = {
		src: string;
		price: string;
		title: () => string;
		cat: () => string;
		sx: number;
		sy: number;
		srot: number;
		x: number;
		y: number;
		w: number;
		h: number;
		sc: number;
		z: number;
	};

	const heroCards: HeroCard[] = [
		{
			src: 'https://file.garden/ao1B7sLFNyZKt73m/landing%20page/1.png',
			price: 'Rp29.000',
			title: () => m.ld_card_qris_t(),
			cat: () => m.ld_card_qris_c(),
			sx: -8,
			sy: -10,
			srot: -18,
			x: -20,
			y: -34,
			w: 17,
			h: 22,
			sc: 0.7,
			z: 2
		},
		{
			src: 'https://file.garden/ao1B7sLFNyZKt73m/landing%20page/2.png',
			price: 'Rp49.000',
			title: () => m.ld_card_photo_t(),
			cat: () => m.ld_card_photo_c(),
			sx: 14,
			sy: -10,
			srot: 20,
			x: 32,
			y: -30,
			w: 18,
			h: 32,
			sc: 0.8,
			z: 3
		},
		{
			src: 'https://file.garden/ao1B7sLFNyZKt73m/landing%20page/3.png',
			price: 'Rp59.000',
			title: () => m.ld_card_interview_t(),
			cat: () => m.ld_card_interview_c(),
			sx: -16,
			sy: 0,
			srot: -4,
			x: -36,
			y: -2,
			w: 15,
			h: 32,
			sc: 0.9,
			z: 4
		},
		{
			src: 'https://file.garden/ao1B7sLFNyZKt73m/landing%20page/4.png',
			price: 'Rp29.000',
			title: () => m.ld_card_ai_t(),
			cat: () => m.ld_card_ai_c(),
			sx: 1,
			sy: -10,
			srot: -2,
			x: 6,
			y: -32,
			w: 25,
			h: 30,
			sc: 0.8,
			z: 5
		},
		{
			src: 'https://file.garden/ao1B7sLFNyZKt73m/landing%20page/5.png',
			price: 'Rp39.000',
			title: () => m.ld_card_affiliate_t(),
			cat: () => m.ld_card_affiliate_c(),
			sx: 18,
			sy: 1,
			srot: 6,
			x: 37,
			y: 6,
			w: 18,
			h: 32,
			sc: 0.8,
			z: 6
		},
		{
			src: 'https://file.garden/ao1B7sLFNyZKt73m/landing%20page/6.png',
			price: 'Rp75.000',
			title: () => m.ld_card_reels_t(),
			cat: () => m.ld_card_reels_c(),
			sx: -6,
			sy: 10,
			srot: 6,
			x: -24,
			y: 34,
			w: 22,
			h: 25,
			sc: 0.9,
			z: 7
		},
		{
			src: 'https://file.garden/ao1B7sLFNyZKt73m/landing%20page/7.png',
			price: 'Rp25.000',
			title: () => m.ld_card_lpdp_t(),
			cat: () => m.ld_card_lpdp_c(),
			sx: 8,
			sy: 7,
			srot: 3,
			x: 2,
			y: 36,
			w: 20,
			h: 26,
			sc: 0.8,
			z: 8
		},
		{
			src: 'https://file.garden/ao1B7sLFNyZKt73m/landing%20page/8.png',
			price: 'Rp35.000',
			title: () => m.ld_card_salary_t(),
			cat: () => m.ld_card_qris_c(),
			sx: 20,
			sy: 12,
			srot: -7,
			x: 30,
			y: 34,
			w: 16,
			h: 20,
			sc: 0.9,
			z: 9
		}
	];

	const ANIM_END = 240 / 340;
	const SCATTER_START = 0.12;
	const SCATTER_END = 0.9;
	const TEXT_FADE_START = 0.2;
	const STACK_SCALE = 0.82;

	let heroWrap = $state<HTMLElement | null>(null);

	let pointerTarget = { x: 0, y: 0 };
	let pointerCur = { x: 0, y: 0 };
	let curScatter = 0;
	let rafId: number | undefined;

	function springLoop() {
		const k = 0.06;
		pointerCur.x += (pointerTarget.x - pointerCur.x) * k;
		pointerCur.y += (pointerTarget.y - pointerCur.y) * k;
		renderHero(curScatter);
		const settled =
			Math.abs(pointerTarget.x - pointerCur.x) < 0.002 &&
			Math.abs(pointerTarget.y - pointerCur.y) < 0.002;
		if (settled && pointerTarget.x === 0 && pointerTarget.y === 0) {
			pointerCur = { x: 0, y: 0 };
			renderHero(curScatter);
			rafId = undefined;
			return;
		}
		rafId = requestAnimationFrame(springLoop);
	}

	function wakeSpring() {
		if (rafId === undefined) rafId = requestAnimationFrame(springLoop);
	}

	function onHeroPointerMove(e: PointerEvent) {
		if (!heroWrap) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const r = heroWrap.getBoundingClientRect();
		pointerTarget = {
			x: ((e.clientX - r.left) / r.width) * 2 - 1,
			y: ((e.clientY - r.top) / r.height) * 2 - 1
		};
		wakeSpring();
	}

	function onHeroPointerLeave() {
		pointerTarget = { x: 0, y: 0 };
		wakeSpring();
	}

	function mix(p: number, a: number, b: number, v0: number, v1: number): number {
		if (p <= a) return v0;
		if (p >= b) return v1;
		const t = (p - a) / (b - a);
		return v0 + (v1 - v0) * t;
	}

	function scatter(raw: number): number {
		const ap = Math.min(Math.max(raw / ANIM_END, 0), 1);
		return mix(ap, SCATTER_START, SCATTER_END, 0, 1);
	}

	function renderHero(progress: number) {
		const wrap = heroWrap;
		if (!wrap) return;
		curScatter = progress;
		const mul = window.innerWidth < 1024 ? 0.78 : 1;
		const spread = mix(progress, 0.5, 1, 0, 1);
		wrap.querySelectorAll<HTMLElement>('[data-hero-card]').forEach((el, i) => {
			const card = heroCards[i];
			if (!card) return;
			const x = card.sx + (card.x - card.sx) * progress;
			const y = card.sy + (card.y - card.sy) * progress;
			const rot = card.srot + (0 - card.srot) * progress;
			const sc = STACK_SCALE + (card.sc * mul - STACK_SCALE) * progress;
			const depth = 6 + ((i * 37) % 13);
			const px = pointerCur.x * depth * spread;
			const py = pointerCur.y * depth * 0.7 * spread;
			const tilt = pointerCur.x * (i % 2 === 0 ? 1.1 : -1.1) * spread;
			el.style.transform = `translate(calc(-50% + ${x}vw + ${px.toFixed(2)}px), calc(-50% + ${y}vh + ${py.toFixed(2)}px)) rotate(${(rot + tilt).toFixed(2)}deg) scale(${sc})`;
		});
		const copy = wrap.querySelector<HTMLElement>('[data-hero-copy]');
		if (copy) {
			copy.style.opacity = String(mix(progress, TEXT_FADE_START, TEXT_FADE_START + 0.35, 0, 1));
			copy.style.transform = `scale(${mix(progress, TEXT_FADE_START, 0.9, 0.85, 1)}) translate(${(-pointerCur.x * 7 * spread).toFixed(2)}px, ${(-pointerCur.y * 5 * spread).toFixed(2)}px)`;
		}
		const hint = wrap.querySelector<HTMLElement>('[data-hero-hint]');
		if (hint) {
			hint.style.opacity = String(mix(progress, 0, SCATTER_START, 1, 0));
		}
	}

	$effect(() => {
		const wrap = heroWrap;
		if (!wrap) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			renderHero(1);
			return;
		}
		renderHero(0);
		return scroll((p: number) => renderHero(scatter(p)), {
			target: wrap,
			offset: ['start start', 'end end']
		});
	});
</script>

<div
	class="min-h-screen overflow-x-clip bg-[#FAFDFB] font-sans text-[#0A261D] antialiased selection:bg-[#008A5E]/15 selection:text-[#008A5E]"
>
	<PublicNavbar activePage="home" />

	<main>
		<section class="relative z-30">
			<div class="block md:hidden">
				<MobileHero onstart={start} />
			</div>

			<div class="hidden md:block">
				<section
					bind:this={heroWrap}
					onpointermove={onHeroPointerMove}
					onpointerleave={onHeroPointerLeave}
					aria-label={m.ld_hero_heading()}
					class="relative w-full"
					style="height: 340vh; background-color: transparent;"
				>
					<div
						class="sticky top-16 h-[calc(100svh-64px)] w-full overflow-visible sm:top-20 sm:h-[calc(100svh-80px)]"
					>
						<div
							data-hero-copy
							class="pointer-events-auto absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center"
							style="opacity: 0;"
						>
							<h1
								class="landing-hero-heading mx-auto max-w-[560px] px-2 text-[#0A261D] lg:max-w-[620px]"
							>
								{m.ld_hero_heading()}
							</h1>
							<p
								class="mx-auto mt-3 max-w-[500px] px-2 text-sm leading-relaxed text-[#4A5852] sm:mt-3.5 sm:text-base lg:max-w-[540px]"
							>
								{m.ld_hero_sub()}
							</p>
							<div class="flex justify-center pt-2">
								<button
									type="button"
									onclick={start}
									class="group pointer-events-auto relative z-30 inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#008A5E] px-6 py-3.5 text-sm font-semibold whitespace-nowrap text-white shadow-xs transition-all hover:bg-[#007550] active:scale-98 sm:text-base"
								>
									<span>{m.ld_cta_first_product()}</span>
									<ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-1" />
								</button>
							</div>
						</div>

						<div class="pointer-events-none absolute inset-0 z-20">
							{#each heroCards as card, i (i)}
								<div
									data-hero-card
									class="absolute top-1/2 left-1/2 will-change-transform"
									style="width: {card.w}vw; height: {card.h}vh; z-index: {card.z}; transform: translate(calc(-50% + {card.sx}vw), calc(-50% + {card.sy}vh)) rotate({card.srot}deg) scale({STACK_SCALE});"
								>
									<div
										class="relative h-full w-full overflow-hidden rounded-xl border border-[#E1E6E2]/80 bg-[#F5F8F6] shadow-md"
									>
										<img
											src={card.src}
											alt={card.title()}
											referrerpolicy="no-referrer"
											draggable="false"
											class="absolute inset-0 h-full w-full object-cover"
										/>
										<div
											class="pointer-events-none absolute inset-x-2 bottom-2 flex items-center justify-between rounded-xl border border-[#E1E6E2] bg-white/95 p-2 text-left shadow-xs backdrop-blur-xs"
										>
											<div class="min-w-0 truncate pr-2">
												<div class="truncate text-[11px] leading-tight font-bold text-[#0A261D]">
													{card.title()}
												</div>
												<div class="truncate text-[9px] text-[#6E7873]">
													{card.cat()}
												</div>
											</div>
											<div
												class="shrink-0 rounded-md bg-[#E8F5F0] px-2 py-0.5 text-[10px] font-bold text-[#008A5E]"
											>
												{card.price}
											</div>
										</div>
									</div>
								</div>
							{/each}
						</div>

						<div
							data-hero-hint
							class="pointer-events-none absolute inset-x-0 bottom-[3vh] z-20 flex flex-col items-center gap-[0.6vh] text-[0.8vw] font-medium tracking-[0.2em] text-[#0A261D] uppercase"
						>
							<span>{m.ld_hero_scroll_hint()}</span>
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="animate-bounce"
								aria-hidden="true"
							>
								<path d="m6 9 6 6 6-6" />
							</svg>
						</div>
					</div>
				</section>
			</div>
		</section>

		<section
			id="cara-kerja"
			class="relative z-10 mt-0 bg-[#FAFDFB] pt-12 pb-16 sm:-mt-10 sm:pt-36 sm:pb-24 md:-mt-28 md:pt-44 lg:pt-48"
		>
			<HiddenValueStory />
		</section>

		<ProductFormsSection />

		<EndToEndFlow />

		<StorefrontSection />

		<BlogSection />

		<FinalCtaSection onstart={start} />
	</main>

	<PublicFooter />
</div>
