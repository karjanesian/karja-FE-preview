<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { scroll } from 'motion';

	type StoryItem = {
		number: string;
		image: string;
		alt: () => string;
		title: () => string;
		description: () => string;
	};

	const stories: StoryItem[] = [
		{
			number: '01',
			image: 'https://file.garden/ao1B7sLFNyZKt73m/kania/step1.png',
			alt: () => m.ld_hvs1_alt(),
			title: () => m.ld_hvs1_t(),
			description: () => m.ld_hvs1_d()
		},
		{
			number: '02',
			image:
				'https://file.garden/ao1B7sLFNyZKt73m/kania/ChatGPT%20Image%20Sep%2018%2C%202026%2C%2009_58_08%20AM.png',
			alt: () => m.ld_hvs2_alt(),
			title: () => m.ld_hvs2_t(),
			description: () => m.ld_hvs2_d()
		},
		{
			number: '03',
			image: 'https://file.garden/ao1B7sLFNyZKt73m/kania/step3.png',
			alt: () => m.ld_hvs3_alt(),
			title: () => m.ld_hvs3_t(),
			description: () => m.ld_hvs3_d()
		},
		{
			number: '04',
			image: 'https://file.garden/ao1B7sLFNyZKt73m/kania/step4.png',
			alt: () => m.ld_hvs4_alt(),
			title: () => m.ld_hvs4_t(),
			description: () => m.ld_hvs4_d()
		}
	];

	let rootEl = $state<HTMLElement | null>(null);
	let introEl = $state<HTMLElement | null>(null);
	let introShown = $state(false);

	function mix(p: number, a: number, b: number, v0: number, v1: number): number {
		if (p <= a) return v0;
		if (p >= b) return v1;
		const t = (p - a) / (b - a);
		return v0 + (v1 - v0) * t;
	}

	$effect(() => {
		const el = introEl;
		if (!el) return;
		const io = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) {
					introShown = true;
					io.disconnect();
				}
			},
			{ threshold: 0.3 }
		);
		io.observe(el);
		return () => io.disconnect();
	});

	$effect(() => {
		const root = rootEl;
		if (!root) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const stops: VoidFunction[] = [];
		root.querySelectorAll<HTMLElement>('[data-beat]').forEach((beat, i) => {
			const isLast = i === stories.length - 1;
			const isImageLeft = i % 2 !== 0;
			const stage = beat.querySelector<HTMLElement>('[data-beat-stage]');
			const text = beat.querySelector<HTMLElement>('[data-beat-text]');
			const img = beat.querySelector<HTMLElement>('[data-beat-img]');
			stops.push(
				scroll(
					(p: number) => {
						if (img) {
							img.style.opacity = String(mix(p, 0.16, 0.3, 0.45, 1));
							img.style.transform = `translateX(${mix(p, 0.16, 0.32, isImageLeft ? -16 : 16, 0)}px) scale(${mix(p, 0.16, 0.32, 0.97, 1)})`;
						}
						if (text) {
							text.style.opacity = String(mix(p, 0.22, 0.36, 0.2, 1));
							text.style.transform = `translate(${mix(p, 0.22, 0.36, isImageLeft ? 12 : -12, 0)}px, ${mix(p, 0.22, 0.36, 18, 0)}px)`;
						}
						if (stage) {
							stage.style.opacity = String(mix(p, 0.72, 0.9, 1, isLast ? 1 : 0.76));
							stage.style.transform = `translateY(${mix(p, 0.74, 0.9, 0, isLast ? 0 : -14)}px) scale(${mix(p, 0.72, 0.9, 1, isLast ? 1 : 0.98)})`;
						}
					},
					{ target: beat, offset: ['start end', 'end start'] }
				)
			);
		});
		return () => stops.forEach((stop) => stop());
	});
</script>

<div bind:this={rootEl} class="w-full">
	<div
		bind:this={introEl}
		class="mx-auto max-w-4xl px-4 pb-20 text-center transition-all duration-700 ease-out sm:px-6 sm:pb-28 lg:px-8 lg:pb-32 {introShown
			? 'translate-y-0 opacity-100'
			: 'translate-y-5 opacity-0'}"
	>
		<h2 class="landing-heading mx-auto max-w-[860px] text-[#0A261D]">{m.ld_hvs_h2()}</h2>
		<p class="landing-lead mx-auto max-w-[720px] text-[#4A5852]">{m.ld_hvs_lead()}</p>
	</div>

	<div class="relative w-full">
		{#each stories as story, i (story.number)}
			{@const isImageLeft = i % 2 !== 0}
			<div
				data-beat
				class="relative w-full bg-[#FAFDFB] py-12 lg:h-[110vh] lg:py-0"
				style="z-index: {10 + i};"
			>
				<div
					class="w-full bg-[#FAFDFB] lg:sticky lg:top-[96px] lg:flex lg:h-[calc(100svh-116px)] lg:items-center lg:justify-center"
				>
					<div
						data-beat-stage
						class="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8"
						style="transform-origin: center center;"
					>
						<div
							class="grid grid-cols-1 items-center gap-8 sm:gap-10 lg:grid-cols-12 lg:gap-14 xl:gap-16"
						>
							<div
								class="order-1 space-y-3.5 text-left sm:space-y-4 lg:col-span-6 lg:space-y-6 {isImageLeft
									? 'lg:order-2 lg:pl-4 xl:pl-6'
									: 'lg:order-1 lg:pr-4 xl:pr-6'}"
							>
								<div data-beat-text class="space-y-3.5 sm:space-y-4 lg:space-y-6">
									<span
										class="block font-mono text-xs font-semibold tracking-wider text-[#008A5E] uppercase sm:text-sm"
									>
										{story.number}
									</span>
									<h3 class="landing-subheading text-[#0A261D]">{story.title()}</h3>
									<p
										class="max-w-[480px] text-sm leading-relaxed text-[#4A5852] sm:text-base lg:text-lg xl:text-xl"
									>
										{story.description()}
									</p>
								</div>
							</div>

							<div
								class="order-2 flex justify-center lg:col-span-6 xl:col-span-6 {isImageLeft
									? 'lg:order-1 lg:justify-start'
									: 'lg:order-2 lg:justify-end'}"
							>
								<div class="flex w-full justify-center lg:block">
									<div
										data-beat-img
										class="lg:max-none max-w-[380px] overflow-hidden rounded-2xl border border-[#E3E8E5] bg-[#F0F4F2] shadow-[0_8px_30px_rgba(10,38,29,0.06)] sm:max-w-[420px] sm:rounded-3xl sm:shadow-[0_12px_36px_rgba(10,38,29,0.08)]"
										style="width: min(460px, 36vw, calc((100svh - 160px) * 0.8)); aspect-ratio: 4 / 5; transform-origin: {isImageLeft
											? 'left center'
											: 'right center'};"
									>
										<img
											src={story.image}
											alt={story.alt()}
											referrerpolicy="no-referrer"
											loading={i === 0 ? 'eager' : 'lazy'}
											class="h-full w-full object-cover select-none"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
