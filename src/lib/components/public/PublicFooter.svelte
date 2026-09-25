<script lang="ts">
	import Logo from '$lib/components/common/Logo.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import X from 'lucide-svelte/icons/x';

	type FooterModal = 'terms' | 'privacy' | 'faq' | 'contact' | null;

	let footerModal: FooterModal = $state(null);

	const SOCIAL_LINKS = {
		instagram: 'https://instagram.com/karja.id',
		tiktok: '',
		x: ''
	};
</script>

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape') footerModal = null;
	}}
/>

<footer class="bg-[#0E2E25] py-14 text-[#C5D8CE] sm:py-16 lg:py-20">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex flex-col justify-between gap-10 sm:gap-12 md:flex-row md:items-start">
			<div class="max-w-sm">
				<a
					href="/"
					class="rounded-lg p-0.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008A5E]"
					aria-label={m.pu_footer_home_aria()}
				>
					<Logo size="md" monochromeWhite />
				</a>
				<p class="mt-4 text-sm leading-snug font-medium text-white/90">{m.pu_footer_tagline()}</p>
				<p class="mt-1.5 text-xs leading-relaxed text-white/65 sm:text-sm">
					{m.pu_footer_made_in()}
				</p>

				<div class="mt-5 -ml-2 flex items-center gap-1.5">
					{#if SOCIAL_LINKS.instagram}
						<a
							href={SOCIAL_LINKS.instagram}
							target="_blank"
							rel="noopener noreferrer"
							aria-label="Instagram Karja"
							class="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008A5E]"
						>
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="h-[18px] w-[18px]"
								aria-hidden="true"
							>
								<rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
								<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
								<line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
							</svg>
						</a>
					{/if}
					<span
						aria-label="TikTok Karja {m.pu_footer_social_soon()}"
						title="TikTok {m.pu_footer_social_soon()}"
						class="pointer-events-none flex h-9 w-9 items-center justify-center rounded-lg text-white/30 select-none"
					>
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="h-[18px] w-[18px]"
							aria-hidden="true"
						>
							<path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
						</svg>
					</span>
					<span
						aria-label="X Karja {m.pu_footer_social_soon()}"
						title="X {m.pu_footer_social_soon()}"
						class="pointer-events-none flex h-9 w-9 items-center justify-center rounded-lg text-white/30 select-none"
					>
						<svg
							viewBox="0 0 24 24"
							fill="currentColor"
							class="h-[17px] w-[17px]"
							aria-hidden="true"
						>
							<path
								d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
							/>
						</svg>
					</span>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-10 sm:gap-16 lg:gap-24">
				<div>
					<h4 class="mb-3.5 text-[13px] font-semibold tracking-wider text-white/90 uppercase">
						Karja
					</h4>
					<ul class="space-y-2.5">
						<li>
							<a
								href="/blog"
								class="text-left text-sm text-white/70 transition-colors hover:text-white focus:outline-none focus-visible:underline"
							>
								{m.pu_nav_blog()}
							</a>
						</li>
						<li>
							<button
								type="button"
								onclick={() => (footerModal = 'faq')}
								class="cursor-pointer text-left text-sm text-white/70 transition-colors hover:text-white focus:outline-none focus-visible:underline"
							>
								{m.pu_footer_faq()}
							</button>
						</li>
						<li>
							<button
								type="button"
								onclick={() => (footerModal = 'contact')}
								class="cursor-pointer text-left text-sm text-white/70 transition-colors hover:text-white focus:outline-none focus-visible:underline"
							>
								{m.pu_footer_contact()}
							</button>
						</li>
					</ul>
				</div>

				<div>
					<h4 class="mb-3.5 text-[13px] font-semibold tracking-wider text-white/90 uppercase">
						{m.pu_footer_heading_legal()}
					</h4>
					<ul class="space-y-2.5">
						<li>
							<button
								type="button"
								onclick={() => (footerModal = 'terms')}
								class="cursor-pointer text-left text-sm text-white/70 transition-colors hover:text-white focus:outline-none focus-visible:underline"
							>
								{m.pu_footer_terms()}
							</button>
						</li>
						<li>
							<button
								type="button"
								onclick={() => (footerModal = 'privacy')}
								class="cursor-pointer text-left text-sm text-white/70 transition-colors hover:text-white focus:outline-none focus-visible:underline"
							>
								{m.pu_footer_privacy()}
							</button>
						</li>
					</ul>
				</div>
			</div>
		</div>

		<div class="mt-12 flex items-center justify-between border-t border-white/10 pt-8 sm:mt-16">
			<p class="text-xs text-white/50 sm:text-[13px]">{m.pu_footer_copyright()}</p>
		</div>
	</div>
</footer>

{#if footerModal}
	<div
		role="presentation"
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
	>
		<div
			class="w-full max-w-md space-y-4 rounded-2xl border border-[#D0EADB] bg-white p-6 text-left shadow-2xl sm:p-7"
			role="dialog"
			aria-modal="true"
			aria-label={footerModal === 'terms'
				? m.pu_footer_terms_title()
				: footerModal === 'privacy'
					? m.pu_footer_privacy_title()
					: footerModal === 'faq'
						? m.pu_footer_faq_title()
						: m.pu_footer_contact_title()}
		>
			<div class="flex items-start justify-between gap-3">
				<h3 class="text-base font-bold text-[#0E2E25] sm:text-lg">
					{#if footerModal === 'terms'}
						{m.pu_footer_terms_title()}
					{:else if footerModal === 'privacy'}
						{m.pu_footer_privacy_title()}
					{:else if footerModal === 'faq'}
						{m.pu_footer_faq_title()}
					{:else if footerModal === 'contact'}
						{m.pu_footer_contact_title()}
					{/if}
				</h3>
				<button
					type="button"
					onclick={() => (footerModal = null)}
					aria-label={m.common_close()}
					class="-mt-1 -mr-1.5 cursor-pointer rounded-lg p-1.5 text-[#52776C] transition-colors hover:bg-[#F0F6F3] hover:text-[#0E2E25] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008A5E]"
				>
					<X class="h-4 w-4" aria-hidden="true" />
				</button>
			</div>

			{#if footerModal === 'faq'}
				<div
					class="max-h-[60vh] space-y-3.5 overflow-y-auto pr-1 text-xs leading-relaxed text-[#52776C] sm:text-sm"
				>
					<div>
						<p class="font-bold text-[#0E2E25]">{m.pu_footer_faq_q1()}</p>
						<p>{m.pu_footer_faq_a1()}</p>
					</div>
					<div>
						<p class="font-bold text-[#0E2E25]">{m.pu_footer_faq_q2()}</p>
						<p>{m.pu_footer_faq_a2()}</p>
					</div>
					<div>
						<p class="font-bold text-[#0E2E25]">{m.pu_footer_faq_q3()}</p>
						<p>{m.pu_footer_faq_a3()}</p>
					</div>
				</div>
			{:else if footerModal === 'contact'}
				<div class="space-y-3 text-xs leading-relaxed text-[#52776C] sm:text-sm">
					<p>{m.pu_footer_contact_p1()}</p>
					<p>{m.pu_footer_contact_p2()}</p>
				</div>
			{:else}
				<p class="text-xs leading-relaxed text-[#52776C] sm:text-sm">
					{footerModal === 'terms' ? m.pu_footer_terms_body() : m.pu_footer_privacy_body()}
				</p>
			{/if}

			<div class="flex justify-end pt-2">
				<button
					type="button"
					onclick={() => (footerModal = null)}
					class="cursor-pointer rounded-xl bg-[#0C7B58] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#096649] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008A5E] sm:text-sm"
				>
					{m.pu_footer_modal_ok()}
				</button>
			</div>
		</div>
	</div>
{/if}
