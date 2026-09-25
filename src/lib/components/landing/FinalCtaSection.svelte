<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';

	type Props = {
		onstart: () => void;
	};
	let { onstart }: Props = $props();

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
			{ threshold: 0.3 }
		);
		io.observe(el);
		return () => io.disconnect();
	});
</script>

<section
	bind:this={sectionEl}
	aria-label={`${m.ld_cta_head_a()} ${m.ld_cta_head_b()}`}
	class="border-t border-[#E8ECE9] bg-[#FAFDFB] px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8 lg:py-40"
>
	<div class="mx-auto max-w-3xl space-y-8 sm:space-y-10">
		<h2
			class="landing-final-cta text-[#0A261D] transition-all duration-500 ease-out {shown
				? 'translate-y-0 opacity-100'
				: 'translate-y-4 opacity-0'}"
		>
			{m.ld_cta_head_a()}<br />
			{m.ld_cta_head_b()}
		</h2>

		<div class="space-y-4 pt-2 sm:pt-4">
			<div
				class="flex justify-center transition-all delay-300 duration-500 ease-out {shown
					? 'translate-y-0 opacity-100'
					: 'translate-y-3 opacity-0'}"
			>
				<button
					type="button"
					onclick={onstart}
					class="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-[#0C7B58] px-8 py-4 text-base font-semibold text-white shadow-xs transition-all hover:bg-[#096649] focus:ring-2 focus:ring-[#0C7B58] focus:ring-offset-2 focus:outline-none active:scale-98 sm:text-lg"
				>
					{m.ld_cta_first_product()}
				</button>
			</div>

			<p
				class="text-sm text-[#6E7873] transition-opacity delay-[450ms] duration-[400ms] ease-out {shown
					? 'opacity-100'
					: 'opacity-0'}"
			>
				{m.ld_cta_note()}
			</p>
		</div>
	</div>
</section>
