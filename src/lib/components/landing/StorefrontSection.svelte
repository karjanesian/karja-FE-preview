<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { getProductTypeTheme } from '$lib/domain/productTheme';
	import { formatRupiah } from '$lib/data/mockData';
	import type { ProductType } from '$lib/types';
	import Logo from '$lib/components/common/Logo.svelte';
	import ShieldCheck from 'lucide-svelte/icons/shield-check';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Clock from 'lucide-svelte/icons/clock';
	import FileText from 'lucide-svelte/icons/file-text';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Briefcase from 'lucide-svelte/icons/briefcase';

	type StorefrontProduct = {
		id: string;
		type: ProductType;
		title: () => string;
		price: number;
		description: () => string;
		image?: string;
		durationMinutes?: number;
		subtype?: () => string;
	};

	const products: StorefrontProduct[] = [
		{
			id: 'prod_digital',
			type: 'digital',
			title: () => m.ld_pf_digital_t(),
			price: 39000,
			description: () => m.ld_sf_p1_desc(),
			image:
				'https://file.garden/ao1B7sLFNyZKt73m/kania/ChatGPT%20Image%20Sep%2017%2C%202026%2C%2005_18_52%20PM.png',
			subtype: () => 'Spreadsheet'
		},
		{
			id: 'prod_session',
			type: 'session',
			title: () => m.ld_pf_session_t(),
			price: 75000,
			description: () => m.ld_sf_p2_desc(),
			image:
				'https://file.garden/ao1B7sLFNyZKt73m/kania/ChatGPT%20Image%20Sep%2017%2C%202026%2C%2005_18_49%20PM.png',
			durationMinutes: 30,
			subtype: () => '1-on-1'
		},
		{
			id: 'prod_service',
			type: 'service',
			title: () => m.ld_pf_service_t(),
			price: 149000,
			description: () => m.ld_sf_p3_desc(),
			image:
				'https://file.garden/ao1B7sLFNyZKt73m/kania/ChatGPT%20Image%20Sep%2017%2C%202026%2C%2005_18_46%20PM.png',
			subtype: () => m.ld_sf_p3_subtype()
		}
	];

	type Filter = 'all' | 'digital' | 'session' | 'service';
	let activeFilter = $state<Filter>('all');
	let sectionEl = $state<HTMLElement | null>(null);
	let shown = $state(false);

	const filteredProducts = $derived(
		activeFilter === 'all' ? products : products.filter((p) => p.type === activeFilter)
	);

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
</script>

<section
	bind:this={sectionEl}
	class="overflow-hidden border-t border-[#E8ECE9] bg-[#FAFDFB] py-24 sm:py-32"
>
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
			<div
				class="space-y-6 text-left transition-all duration-700 ease-out lg:sticky lg:top-28 lg:col-span-5 {shown
					? 'translate-y-0 opacity-100'
					: 'translate-y-4 opacity-0'}"
			>
				<div class="space-y-4">
					<h2 class="landing-heading text-[#0A261D]">{m.ld_sf_h2()}</h2>
					<p class="landing-lead text-[#4A5852]">{m.ld_sf_lead()}</p>
				</div>

				<div class="space-y-2 pt-2">
					<div
						class="inline-flex items-center gap-2.5 rounded-full border border-[#D5E0DA] bg-white px-4 py-2 shadow-2xs"
					>
						<span class="h-2 w-2 rounded-full bg-[#0C7B58]"></span>
						<span class="text-sm font-semibold text-[#0C7B58] sm:text-base">karja.id/kania</span>
					</div>
					<p class="text-xs text-[#52776C]">{m.ld_sf_url_note()}</p>
				</div>
			</div>

			<div
				class="w-full min-w-0 transition-all delay-100 duration-700 ease-out lg:col-span-7 {shown
					? 'scale-100 opacity-100'
					: 'scale-[0.98] opacity-0'}"
			>
				<div
					class="storefront-container overflow-hidden rounded-3xl border border-[#E5ECE7] bg-white shadow-sm"
				>
					<div class="relative border-b border-[#E5ECE7]">
						<div class="relative aspect-[3/1] w-full overflow-hidden bg-[#E8ECE9]">
							<img
								src="https://file.garden/ao1B7sLFNyZKt73m/kania/JENNY%E2%80%99S%20CORNER%20(1).png"
								alt={m.ld_sf_cover_alt()}
								class="h-full w-full object-cover"
								referrerpolicy="no-referrer"
							/>
						</div>

						<div class="relative -mt-10 space-y-3.5 p-5 text-center sm:-mt-12 sm:p-7 md:-mt-14">
							<div class="relative mx-auto inline-block">
								<div
									class="mx-auto h-20 w-20 overflow-hidden rounded-full bg-white shadow-md ring-4 ring-white sm:h-24 sm:w-24"
								>
									<img
										src="https://file.garden/ao1B7sLFNyZKt73m/kania/ChatGPT%20Image%20Sep%2017%2C%202026%2C%2005_10_21%20PM.png"
										alt={m.ld_sf_avatar_alt()}
										class="h-full w-full object-cover"
										referrerpolicy="no-referrer"
									/>
								</div>
							</div>

							<div class="mx-auto max-w-md space-y-1">
								<div class="flex items-center justify-center gap-1.5">
									<h3 class="text-xl font-extrabold text-[#0E2E25] sm:text-2xl">
										{m.ld_sf_name()}
									</h3>
									<ShieldCheck class="h-4 w-4 text-[#0C7B58]" />
								</div>
								<p class="text-xs font-semibold text-[#0C7B58] sm:text-sm">{m.ld_sf_role()}</p>
								<p class="pt-0.5 text-xs leading-relaxed text-[#52776C] sm:text-sm">
									{m.ld_sf_bio()}
								</p>
							</div>

							<div class="flex flex-wrap justify-center gap-1.5 pt-1">
								<span
									class="rounded-lg border border-[#E0ECE5] bg-[#F4F8F6] px-2.5 py-1 text-xs font-medium text-[#2D5347]"
								>
									{m.ld_sf_chip1()}
								</span>
								<span
									class="rounded-lg border border-[#E0ECE5] bg-[#F4F8F6] px-2.5 py-1 text-xs font-medium text-[#2D5347]"
								>
									{m.ld_sf_chip2()}
								</span>
							</div>
						</div>
					</div>

					<div class="space-y-5 bg-[#FAFDFB] p-5 sm:p-7">
						<div
							class="flex flex-col justify-between gap-3 border-b border-[#E5ECE7] pb-1 sm:flex-row sm:items-center"
						>
							<h4 class="text-sm font-bold text-[#0E2E25] sm:text-base">
								{m.ld_sf_count({ count: filteredProducts.length })}
							</h4>

							<div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
								<button
									type="button"
									onclick={() => (activeFilter = 'all')}
									class="flex-shrink-0 cursor-pointer rounded-lg px-3 py-1 text-xs font-medium transition-colors {activeFilter ===
									'all'
										? 'bg-[#0E2E25] text-white'
										: 'border border-[#E4EBE7] bg-white text-[#52776C] hover:bg-[#F4F8F6] hover:text-[#0E2E25]'}"
								>
									{m.ld_sf_filter_all()} ({products.length})
								</button>

								<button
									type="button"
									onclick={() => (activeFilter = 'digital')}
									class="inline-flex flex-shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-colors {activeFilter ===
									'digital'
										? 'border border-[#BFDBFE] bg-[#EFF6FF] font-bold text-[#1D4ED8] shadow-2xs'
										: 'border border-[#E4EBE7] bg-white text-[#52776C] hover:bg-[#F4F8F6] hover:text-[#1D4ED8]'}"
								>
									<FileText class="h-3.5 w-3.5 text-[#2563EB]" />
									<span>{m.common_type_digital()}</span>
								</button>

								<button
									type="button"
									onclick={() => (activeFilter = 'session')}
									class="inline-flex flex-shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-colors {activeFilter ===
									'session'
										? 'border border-[#DDD6FE] bg-[#F5F3FF] font-bold text-[#6D28D9] shadow-2xs'
										: 'border border-[#E4EBE7] bg-white text-[#52776C] hover:bg-[#F4F8F6] hover:text-[#6D28D9]'}"
								>
									<Calendar class="h-3.5 w-3.5 text-[#7C3AED]" />
									<span>{m.common_type_session()}</span>
								</button>

								<button
									type="button"
									onclick={() => (activeFilter = 'service')}
									class="inline-flex flex-shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-colors {activeFilter ===
									'service'
										? 'border border-[#FED7AA] bg-[#FFF7ED] font-bold text-[#C2410C] shadow-2xs'
										: 'border border-[#E4EBE7] bg-white text-[#52776C] hover:bg-[#F4F8F6] hover:text-[#C2410C]'}"
								>
									<Briefcase class="h-3.5 w-3.5 text-[#EA580C]" />
									<span>{m.common_type_service()}</span>
								</button>
							</div>
						</div>

						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{#each filteredProducts as product, i (product.id)}
								{@const theme = getProductTypeTheme(product.type)}
								<div
									class="group flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#E5ECE7] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-500 ease-out hover:border-[#0C7B58] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] {shown
										? 'translate-y-0 opacity-100'
										: 'translate-y-3 opacity-0'}"
									style="transition-delay: {shown ? 250 + i * 100 : 0}ms;"
								>
									<div
										class="relative flex aspect-video w-full items-center justify-center overflow-hidden border-b border-[#F0F5F2] bg-[#F4F9F6]"
									>
										{#if product.image && product.image.trim().length > 0}
											<img
												src={product.image}
												alt={product.title()}
												loading="lazy"
												class="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
												referrerpolicy="no-referrer"
											/>
										{:else if product.type === 'session'}
											<div class="flex h-full w-full items-center justify-center bg-[#F5F3FF]">
												<div
													class="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#EDE9FE] bg-white/80 shadow-2xs transition-transform duration-300 group-hover:scale-110"
												>
													<Calendar class="h-5 w-5 text-[#7C3AED]" />
												</div>
											</div>
										{:else}
											<div class="flex h-full w-full items-center justify-center bg-[#FFF7ED]">
												<div
													class="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#FED7AA] bg-white/80 shadow-2xs transition-transform duration-300 group-hover:scale-110"
												>
													<Briefcase class="h-5 w-5 text-[#EA580C]" />
												</div>
											</div>
										{/if}

										<div
											class="pointer-events-none absolute top-2.5 right-2.5 left-2.5 flex items-start justify-between gap-1.5"
										>
											<div class="flex min-w-0 flex-wrap items-center gap-1.5">
												<span
													class="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold shadow-2xs backdrop-blur-xs {theme.badgeClass}"
												>
													<theme.icon class="h-3 w-3 shrink-0" />
													<span>{m[theme.labelKey]()}</span>
												</span>

												{#if product.type === 'session' && product.durationMinutes}
													<span
														class="inline-flex items-center gap-1 rounded-md border border-[#DDD6FE] bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-[#6D28D9] shadow-2xs backdrop-blur-xs"
													>
														<Clock class="h-2.5 w-2.5 text-[#7C3AED]" />
														<span>{product.durationMinutes}m</span>
													</span>
												{/if}
											</div>

											{#if product.subtype}
												<div class="flex-shrink-0">
													<span
														class="rounded-md border border-[#E5ECE7] bg-white/95 px-2 py-0.5 text-[10px] font-medium text-[#52776C]"
													>
														{product.subtype()}
													</span>
												</div>
											{/if}
										</div>
									</div>

									<div class="flex min-w-0 flex-1 flex-col justify-between space-y-3 p-4">
										<div class="min-w-0 space-y-1 text-left">
											<h5
												class="line-clamp-2 text-sm leading-snug font-bold text-[#0E2E25] transition-colors group-hover:text-[#0C7B58] sm:text-base"
											>
												{product.title()}
											</h5>
											<p class="line-clamp-2 text-xs leading-relaxed text-[#52776C]">
												{product.description()}
											</p>
										</div>

										<div
											class="flex items-center justify-between gap-2 border-t border-[#F0F5F2] pt-3"
										>
											<span class="text-sm font-bold text-[#0E2E25] sm:text-base">
												{formatRupiah(product.price)}
											</span>

											<span
												class="inline-flex flex-shrink-0 items-center gap-0.5 text-xs font-semibold text-[#0C7B58] transition-transform group-hover:translate-x-0.5"
											>
												<span>{m.ld_sf_view_detail()}</span>
												<ChevronRight class="h-3.5 w-3.5 stroke-[2.5]" />
											</span>
										</div>
									</div>
								</div>
							{/each}
						</div>

						<div class="pt-1">
							<div
								class="flex items-center justify-between rounded-xl border border-[#E5ECE7] bg-white px-4 py-3 text-xs text-[#52776C] shadow-2xs"
							>
								<div class="flex items-center gap-2">
									<ShieldCheck class="h-4 w-4 text-[#0C7B58]" />
									<span>{m.ld_sf_trust()}</span>
								</div>
								<Logo size="xs" />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
