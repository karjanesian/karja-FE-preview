<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { getProductTypeTheme } from '$lib/domain/productTheme';
	import type { ProductType } from '$lib/types';

	type ProductFormItem = {
		type: ProductType;
		title: () => string;
		primaryExplanation: () => string;
		supportingExamples: () => string;
	};

	const forms: ProductFormItem[] = [
		{
			type: 'digital',
			title: () => m.ld_pf_digital_t(),
			primaryExplanation: () => m.ld_pf_digital_p(),
			supportingExamples: () => m.ld_pf_digital_s()
		},
		{
			type: 'session',
			title: () => m.ld_pf_session_t(),
			primaryExplanation: () => m.ld_pf_session_p(),
			supportingExamples: () => m.ld_pf_session_s()
		},
		{
			type: 'service',
			title: () => m.ld_pf_service_t(),
			primaryExplanation: () => m.ld_pf_service_p(),
			supportingExamples: () => m.ld_pf_service_s()
		}
	];

	let sectionEl = $state<HTMLElement | null>(null);
	let shown = $state(false);

	$effect(() => {
		const el = sectionEl;
		if (!el) return;
		const io = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) {
					shown = true;
					io.disconnect();
				}
			},
			{ threshold: 0.2 }
		);
		io.observe(el);
		return () => io.disconnect();
	});

	const reveal = $derived(shown ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0');
</script>

<section
	id="bentuk-produk"
	bind:this={sectionEl}
	class="border-t border-[#E8ECE9] bg-[#F2F7F4] py-24 sm:py-32 lg:py-36"
>
	<div class="mx-auto max-w-6xl space-y-16 px-4 sm:space-y-20 sm:px-6 lg:px-8">
		<div
			class="mx-auto max-w-3xl space-y-4 text-center transition-all duration-700 ease-out sm:space-y-5 {reveal}"
		>
			<h2 class="landing-heading text-[#0A261D]">{m.ld_pf_h2()}</h2>
			<p class="landing-lead mx-auto max-w-2xl text-[#4A5852]">{m.ld_pf_lead()}</p>
		</div>

		<div class="flex flex-col items-center">
			<div
				class="inline-flex flex-col items-center transition-all delay-100 duration-700 ease-out {reveal}"
			>
				<div
					class="rounded-2xl border border-[#D5E0DA] bg-white px-5 py-3.5 text-center shadow-[0_4px_20px_rgba(10,38,29,0.04)] sm:px-7 sm:py-4"
				>
					<span
						class="mb-1 block font-mono text-xs font-medium tracking-wider text-[#6E7873] uppercase"
					>
						{m.ld_pf_source()}
					</span>
					<p class="text-lg font-bold tracking-tight text-[#0A261D] sm:text-xl md:text-2xl">
						“{m.ld_pf_quote()}”
					</p>
				</div>
			</div>

			<div
				class="my-3 flex flex-col items-center transition-all delay-200 duration-700 ease-out sm:my-4 {reveal}"
			>
				<div class="h-8 w-px bg-[#CBD7D0] sm:h-10"></div>
				<div class="-mt-1 h-2 w-2 rounded-full bg-[#008A5E]"></div>
			</div>

			<div class="relative hidden h-6 w-full max-w-4xl lg:block">
				<svg
					class="h-full w-full overflow-visible"
					preserveAspectRatio="none"
					viewBox="0 0 800 24"
					aria-hidden="true"
				>
					<path
						d="M 133 24 L 133 12 Q 133 0 145 0 L 655 0 Q 667 0 667 12 L 667 24 M 400 0 L 400 24"
						fill="none"
						stroke="#D5E0DA"
						stroke-width="1.5"
						stroke-dasharray="4 4"
					/>
				</svg>
			</div>
		</div>

		<div
			class="grid grid-cols-1 items-stretch gap-6 pt-2 sm:grid-cols-2 sm:gap-8 sm:pt-4 lg:grid-cols-3"
		>
			{#each forms as form, i (form.type)}
				{@const theme = getProductTypeTheme(form.type)}
				<div
					class="flex h-full flex-col rounded-2xl border border-[#E1E6E2] bg-white p-6 text-left transition-all duration-700 ease-out hover:border-[#CBD7D0] hover:shadow-[0_12px_36px_rgba(10,38,29,0.06)] sm:rounded-3xl sm:p-8 {reveal}"
					style="transition-delay: {300 + i * 120}ms;"
				>
					<div class="mb-6 flex items-center gap-2.5">
						<div
							class="flex h-9 w-9 items-center justify-center rounded-xl border sm:h-10 sm:w-10 {theme.iconBgColor} {theme.borderColor}"
						>
							<theme.icon class="h-5 w-5 shrink-0" />
						</div>
						<span class="text-xs font-bold tracking-wide uppercase sm:text-sm {theme.textColor}">
							{m[theme.labelKey]()}
						</span>
					</div>

					<h3
						class="mb-3.5 text-xl leading-snug font-bold tracking-tight text-[#0A261D] sm:text-2xl"
					>
						{form.title()}
					</h3>

					<p class="mb-6 text-base leading-relaxed font-medium text-[#2C3E35] sm:text-[17px]">
						{form.primaryExplanation()}
					</p>

					<div class="mt-auto border-t border-[#EEF3F0] pt-4">
						<span class="mb-1 block font-mono text-xs tracking-wider text-[#6E7873] uppercase">
							{m.ld_pf_examples()}
						</span>
						<p class="text-xs leading-relaxed text-[#4A5852] sm:text-sm">
							{form.supportingExamples()}
						</p>
					</div>
				</div>
			{/each}
		</div>

		<div
			class="mx-auto max-w-5xl pt-6 text-center transition-all delay-700 duration-700 ease-out sm:pt-8 {reveal}"
		>
			<p
				class="text-base leading-relaxed font-medium text-[#4A5852] sm:text-lg md:text-xl lg:whitespace-nowrap"
			>
				“{m.ld_pf_principle()}”
			</p>
		</div>
	</div>
</section>
