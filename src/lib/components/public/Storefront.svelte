<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import KarjaVerifiedBadge from '$lib/components/settings/KarjaVerifiedBadge.svelte';
	import Logo from '$lib/components/common/Logo.svelte';
	import { formatRupiah } from '$lib/data/mockData';
	import { getProductTypeTheme } from '$lib/domain/productTheme';
	import { formatBuyerDisplayName } from '$lib/domain/url';
	import * as m from '$lib/paraglide/messages.js';
	import {
		normalizeProductType,
		type Product,
		type ProductType,
		type Review,
		type SellerProfile
	} from '$lib/types';
	import Clock from 'lucide-svelte/icons/clock';
	import ShieldCheck from 'lucide-svelte/icons/shield-check';
	import Store from 'lucide-svelte/icons/store';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Star from 'lucide-svelte/icons/star';

	type Props = {
		seller: SellerProfile;
		products: Product[];
		reviews?: Review[];
		notFound?: boolean;
		serverMode?: boolean;
		embedded?: boolean;
		productTotal?: number;
		hasMore?: boolean;
		loadingMore?: boolean;
		typeFilter?: TypeFilter;
		onTypeFilterChange?: (type: TypeFilter) => void;
		onLoadMore?: () => void;
	};
	let {
		seller,
		products,
		reviews = [],
		notFound = false,
		serverMode = false,
		embedded = false,
		productTotal,
		hasMore = false,
		loadingMore = false,
		typeFilter,
		onTypeFilterChange,
		onLoadMore
	}: Props = $props();

	type TypeFilter = 'all' | ProductType;

	let selectedTypeFilter = $state<TypeFilter>('all');
	const activeTypeFilter = $derived(serverMode ? (typeFilter ?? 'all') : selectedTypeFilter);

	const visibleProducts = $derived(
		products.filter((p) => p.status === 'active' && p.visibility !== 'link_only')
	);

	const productTypesPresent = $derived(
		(() => {
			const types = new SvelteSet<ProductType>();
			visibleProducts.forEach((p) => types.add(normalizeProductType(p.type)));
			return Array.from(types);
		})()
	);

	const filteredProducts = $derived(
		serverMode || activeTypeFilter === 'all'
			? visibleProducts
			: visibleProducts.filter((p) => normalizeProductType(p.type) === activeTypeFilter)
	);

	const displayCount = $derived(productTotal ?? filteredProducts.length);

	function selectType(type: TypeFilter) {
		if (serverMode) onTypeFilterChange?.(type);
		else selectedTypeFilter = type;
	}

	const initials = $derived(
		seller?.name
			? seller.name
					.split(' ')
					.map((n) => n[0])
					.slice(0, 2)
					.join('')
					.toUpperCase()
			: 'TK'
	);

	const isKarjaVerified = $derived(seller?.verification?.karjaVerifiedStatus === 'verified');

	const hasContactChannels = $derived(
		(seller.showWhatsappOnStore && seller.whatsapp) ||
			seller.instagram ||
			seller.tiktok ||
			seller.threads ||
			seller.linkedin
	);

	const STOREFRONT_SOCIAL_ICONS = {
		whatsapp: 'https://file.garden/ao1B7sLFNyZKt73m/Toko/logo-whatsapp-png-pic-0.png',
		instagram: 'https://file.garden/ao1B7sLFNyZKt73m/Toko/Instagram_logo_2022.svg',
		linkedin: 'https://file.garden/ao1B7sLFNyZKt73m/Toko/LinkedIn_icon.svg.webp',
		threads: 'https://file.garden/ao1B7sLFNyZKt73m/Toko/Threads_(app).png',
		tiktok: 'https://file.garden/ao1B7sLFNyZKt73m/Toko/tik-tok-android-application-logos-3.png'
	};

	const TYPE_FILTER_ORDER: ProductType[] = ['digital', 'session', 'service'];

	function waHref(phone: string): string {
		return `https://wa.me/${phone.replace(/^0/, '62')}`;
	}
</script>

{#if notFound || !seller?.username}
	<main class="flex flex-1 items-center justify-center p-4">
		<div
			class="w-full max-w-md space-y-4 rounded-3xl border border-[#E5ECE7] bg-white p-8 text-center shadow-xs"
		>
			<div
				class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF8F0] text-[#0C7B58]"
			>
				<Store class="h-7 w-7" aria-hidden="true" />
			</div>
			<h1 class="text-lg font-bold text-[#0E2E25]">{m.pu_store_notfound_title()}</h1>
			<p class="text-xs leading-relaxed text-[#52776C]">{m.pu_store_notfound_desc()}</p>
			<div class="pt-2">
				<a
					href="/"
					class="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0C7B58] py-2.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-[#096649] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008A5E]"
				>
					<ArrowLeft class="h-3.5 w-3.5" aria-hidden="true" />
					<span>{m.pu_store_notfound_cta()}</span>
				</a>
			</div>
		</div>
	</main>
{:else}
	<div
		class={embedded
			? 'storefront-container space-y-5'
			: 'storefront-container mx-auto w-full max-w-[1240px] space-y-6 px-4 py-8 sm:px-8'}
	>
		<div class="overflow-hidden rounded-2xl border border-[#E5ECE7] bg-white shadow-2xs">
			{#if seller.bannerUrl && seller.bannerUrl.trim().length > 0}
				<div class="relative h-32 w-full overflow-hidden bg-[#F4F8F6] sm:h-44">
					<img
						src={seller.bannerUrl}
						alt={m.pu_store_banner_alt()}
						class="h-full w-full object-cover"
					/>
					<div
						class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 to-transparent"
					></div>
				</div>
			{:else}
				<div class="h-20 w-full border-b border-[#E5ECE7] bg-[#F2F7F4] sm:h-28"></div>
			{/if}

			<div class="relative -mt-12 space-y-4 p-6 text-center sm:-mt-14 sm:p-8">
				<div class="relative mx-auto inline-block">
					<div
						class="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#EAF8F0] text-2xl font-bold text-[#008A5E] shadow-xs ring-4 ring-white sm:h-24 sm:w-24"
					>
						{#if seller.avatarUrl && seller.avatarUrl.trim().length > 0}
							<img src={seller.avatarUrl} alt={seller.name} class="h-full w-full object-cover" />
						{:else}
							<span>{initials}</span>
						{/if}
					</div>
				</div>

				<div class="mx-auto max-w-lg space-y-1.5">
					<div class="flex flex-wrap items-center justify-center gap-2">
						<span class="text-xl font-bold text-[#0E2E25] sm:text-2xl">{seller.name}</span>
						{#if isKarjaVerified}
							<KarjaVerifiedBadge size="md" />
						{/if}
					</div>
					{#if seller.tagline}
						<p class="text-xs font-medium text-[#008A5E] sm:text-sm">
							{seller.tagline}
						</p>
					{/if}
					{#if seller.bio}
						<p class="pt-1 text-xs leading-relaxed text-[#52776C] sm:text-sm">
							{seller.bio}
						</p>
					{/if}
				</div>

				{#if seller.topics && seller.topics.length > 0}
					<div class="flex flex-wrap justify-center gap-1.5 pt-1">
						{#each seller.topics as topic (topic)}
							<span
								class="rounded-lg border border-[#E0ECE5] bg-[#F4F8F6] px-2.5 py-1 text-xs font-medium text-[#2D5347]"
							>
								{topic}
							</span>
						{/each}
					</div>
				{/if}

				{#if hasContactChannels}
					<div class="flex flex-wrap items-center justify-center gap-2 pt-2">
						{#if seller.showWhatsappOnStore && seller.whatsapp}
							<a
								href={waHref(seller.whatsapp)}
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex items-center gap-1.5 rounded-lg border border-[#CCE6D6] bg-[#F2FAF6] px-3.5 py-1.5 text-xs font-semibold text-[#0C7B58] transition-colors hover:bg-[#E8F5EE]"
							>
								<img
									src={STOREFRONT_SOCIAL_ICONS.whatsapp}
									alt="WA"
									class="h-4 w-4 object-contain"
								/>
								<span>{m.pu_store_chat_whatsapp()}</span>
							</a>
						{/if}

						{#if seller.instagram}
							<a
								href={`https://instagram.com/${seller.instagram.replace(/^@/, '')}`}
								target="_blank"
								rel="noopener noreferrer"
								class="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E4EBE7] bg-white shadow-2xs transition-all hover:border-[#CCE6D6] hover:bg-[#F9FCFA]"
							>
								<img
									src={STOREFRONT_SOCIAL_ICONS.instagram}
									alt="Instagram"
									class="h-4 w-4 object-contain"
								/>
							</a>
						{/if}

						{#if seller.tiktok}
							<a
								href={`https://tiktok.com/@${seller.tiktok.replace(/^@/, '')}`}
								target="_blank"
								rel="noopener noreferrer"
								class="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E4EBE7] bg-white shadow-2xs transition-all hover:border-[#CCE6D6] hover:bg-[#F9FCFA]"
							>
								<img
									src={STOREFRONT_SOCIAL_ICONS.tiktok}
									alt="TikTok"
									class="h-4 w-4 object-contain"
								/>
							</a>
						{/if}

						{#if seller.threads}
							<a
								href={`https://threads.net/@${seller.threads.replace(/^@/, '')}`}
								target="_blank"
								rel="noopener noreferrer"
								class="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E4EBE7] bg-white shadow-2xs transition-all hover:border-[#CCE6D6] hover:bg-[#F9FCFA]"
							>
								<img
									src={STOREFRONT_SOCIAL_ICONS.threads}
									alt="Threads"
									class="h-4 w-4 object-contain"
								/>
							</a>
						{/if}

						{#if seller.linkedin}
							<a
								href={`https://linkedin.com/in/${seller.linkedin.replace(/^@/, '')}`}
								target="_blank"
								rel="noopener noreferrer"
								class="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E4EBE7] bg-white shadow-2xs transition-all hover:border-[#CCE6D6] hover:bg-[#F9FCFA]"
							>
								<img
									src={STOREFRONT_SOCIAL_ICONS.linkedin}
									alt="LinkedIn"
									class="h-4 w-4 object-contain"
								/>
							</a>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<div class="space-y-4">
			<div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
				<h2 class="text-base font-bold text-[#0E2E25]">
					{m.pu_store_products_title({ count: displayCount })}
				</h2>

				{#if productTypesPresent.length > 1}
					<div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
						<button
							type="button"
							onclick={() => selectType('all')}
							aria-pressed={activeTypeFilter === 'all'}
							class="flex-shrink-0 rounded-lg px-3 py-1 text-xs font-medium transition-colors {activeTypeFilter ===
							'all'
								? 'bg-[#0E2E25] text-white'
								: 'border border-[#E4EBE7] bg-white text-[#52776C] hover:bg-[#F4F8F6] hover:text-[#0E2E25]'}"
						>
							{m.pu_store_filter_all({ count: displayCount })}
						</button>
						{#each TYPE_FILTER_ORDER as filterType (filterType)}
							{#if productTypesPresent.includes(filterType)}
								{@const theme = getProductTypeTheme(filterType)}
								<button
									type="button"
									onclick={() => selectType(filterType)}
									aria-pressed={activeTypeFilter === filterType}
									class="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-colors {activeTypeFilter ===
									filterType
										? `border ${theme.borderColor} ${theme.bgColor} ${theme.textColor} font-bold shadow-2xs`
										: 'border border-[#E4EBE7] bg-white text-[#52776C] hover:bg-[#F4F8F6]'}"
								>
									<theme.icon class="h-3.5 w-3.5 {theme.iconColor}" aria-hidden="true" />
									<span>{m[theme.labelKey]()}</span>
								</button>
							{/if}
						{/each}
					</div>
				{/if}
			</div>

			{#if filteredProducts.length === 0}
				<div class="space-y-2 rounded-2xl border border-[#E5ECE7] bg-white p-8 text-center">
					<div
						class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F8F6] text-xl text-[#0C7B58]"
						aria-hidden="true"
					>
						📦
					</div>
					<h3 class="text-sm font-bold text-[#0E2E25]">{m.pu_store_empty_title()}</h3>
					<p class="text-xs text-[#52776C]">{m.pu_store_empty_desc()}</p>
				</div>
			{:else}
				<div
					class={embedded
						? `grid gap-4 sm:gap-5 ${filteredProducts.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`
						: 'storefront-product-grid gap-4 sm:gap-5'}
				>
					{#each filteredProducts as p (p.id)}
						{@const pType = normalizeProductType(p.type)}
						{@const isFree = p.priceMode === 'free' || p.price === 0}
						{@const isPromo = p.priceMode === 'promo' && p.regularPrice && p.promoPrice}
						{@const displayImg =
							(Array.isArray(p.images) &&
								p.images.find((img) => typeof img === 'string' && img.trim().length > 0)) ||
							(typeof p.coverImage === 'string' && p.coverImage.trim().length > 0
								? p.coverImage
								: null)}
						{@const theme = getProductTypeTheme(p.type)}
						<a
							href={`/${seller.username}/${p.slug}`}
							class="group flex w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#E5ECE7] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all hover:border-[#0C7B58] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008A5E]"
						>
							<div
								class="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden border-b border-[#F0F5F2] bg-[#F4F9F6]"
							>
								{#if displayImg}
									<img
										src={displayImg}
										alt={p.title}
										class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
									/>
								{:else}
									<span class="text-4xl" aria-hidden="true"
										>{p.coverEmoji ||
											(pType === 'session' ? '📅' : pType === 'service' ? '💼' : '📄')}</span
									>
								{/if}

								<div
									class="pointer-events-none absolute top-2.5 right-2.5 left-2.5 flex items-start justify-between gap-1.5"
								>
									<div class="flex min-w-0 flex-wrap items-center gap-1.5">
										<span
											class="inline-flex items-center gap-1 rounded-md border {theme.borderColor} bg-white/95 px-2 py-0.5 text-[11px] font-semibold {theme.textColor} shadow-2xs backdrop-blur-xs"
										>
											<theme.icon class="h-3 w-3 flex-shrink-0" aria-hidden="true" />
											<span>{m[theme.labelKey]()}</span>
										</span>
										{#if pType === 'session'}
											<span
												class="inline-flex items-center gap-1 rounded-md border border-[#DDD6FE] bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-[#6D28D9] shadow-2xs backdrop-blur-xs"
											>
												<Clock class="h-2.5 w-2.5 text-[#7C3AED]" aria-hidden="true" />
												<span>{p.sessionDurationMinutes || 60}m</span>
											</span>
										{/if}
									</div>

									{#if p.productSubtype}
										<div class="flex-shrink-0">
											<span
												class="rounded-md border border-[#E5ECE7] bg-white/95 px-2 py-0.5 text-[10px] font-medium text-[#52776C]"
											>
												{p.productSubtype}
											</span>
										</div>
									{/if}
								</div>
							</div>

							<div class="flex min-w-0 flex-1 flex-col justify-between space-y-3 p-4 sm:p-5">
								<div class="min-w-0 space-y-1">
									<h3
										class="line-clamp-2 text-sm leading-snug font-bold break-words text-[#0E2E25] transition-colors group-hover:text-[#0C7B58] sm:text-base"
									>
										{p.title}
									</h3>
									{#if p.whatYouGet || p.shortDescription}
										<p class="line-clamp-2 text-xs leading-relaxed break-words text-[#52776C]">
											{p.whatYouGet || p.shortDescription}
										</p>
									{/if}
								</div>

								<div
									class="flex flex-wrap items-center justify-between gap-2 border-t border-[#F0F5F2] pt-3"
								>
									<div class="min-w-0">
										{#if isFree}
											<span class="text-sm font-bold text-[#0C7B58] sm:text-base"
												>{m.pu_store_free()}</span
											>
										{:else if isPromo}
											<div class="flex flex-wrap items-baseline gap-1.5">
												<span class="text-sm font-bold text-[#0E2E25] sm:text-base"
													>{formatRupiah(p.promoPrice || p.price)}</span
												>
												<span class="text-xs text-gray-400 line-through"
													>{formatRupiah(p.regularPrice || 0)}</span
												>
											</div>
										{:else}
											<span class="text-sm font-bold text-[#0E2E25] sm:text-base"
												>{formatRupiah(p.price)}</span
											>
										{/if}
									</div>

									<div
										class="inline-flex flex-shrink-0 items-center gap-0.5 text-xs font-semibold text-[#0C7B58] transition-transform group-hover:translate-x-0.5"
									>
										<span>{m.pu_store_view_detail()}</span>
										<ChevronRight class="h-3.5 w-3.5 stroke-[2.5]" aria-hidden="true" />
									</div>
								</div>
							</div>
						</a>
					{/each}
				</div>

				{#if serverMode && hasMore}
					<div class="flex justify-center pt-1">
						<button
							type="button"
							onclick={() => onLoadMore?.()}
							disabled={loadingMore}
							class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#CCE6D6] bg-white px-5 py-2.5 text-xs font-semibold text-[#0C7B58] shadow-2xs transition-colors hover:bg-[#F2FAF6] disabled:cursor-not-allowed disabled:opacity-50"
						>
							<span>{loadingMore ? m.common_loading() : m.pu_store_load_more()}</span>
						</button>
					</div>
				{/if}
			{/if}
		</div>

		{#if reviews.length > 0}
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<h2 class="text-base font-bold text-[#0E2E25]">{m.pu_store_reviews_title()}</h2>
					<span class="text-xs font-semibold text-[#52776C]">
						{m.pu_store_reviews_count({ count: reviews.length })}
					</span>
				</div>

				<div class="space-y-3">
					{#each reviews as rev (rev.id)}
						<div
							class="space-y-2 rounded-2xl border border-[#E5ECE7] bg-white p-4 text-xs shadow-2xs"
						>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<div
										class="flex h-7 w-7 items-center justify-center rounded-full bg-[#EAF8F0] text-[10px] font-bold text-[#008A5E]"
									>
										{rev.buyerName.slice(0, 2).toUpperCase()}
									</div>
									<div>
										<div class="font-bold text-[#0E2E25]">
											{formatBuyerDisplayName(rev.buyerName)}
										</div>
										<div class="text-[10px] text-[#52776C]">{rev.productTitle}</div>
									</div>
								</div>
								<div class="flex items-center gap-0.5">
									{#each Array(rev.rating).keys() as idx (idx)}
										<Star class="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
									{/each}
								</div>
							</div>

							<p class="leading-relaxed text-[#20493E] italic">&ldquo;{rev.comment}&rdquo;</p>

							{#if rev.sellerReply}
								<div
									class="space-y-0.5 rounded-xl border border-[#E5ECE7] bg-[#FAFDFB] p-2.5 text-[11px] text-[#0A3D2E]"
								>
									<span class="font-bold text-[#0C7B58]"
										>{m.pu_store_review_reply({ name: seller.name })}</span
									>
									<p class="text-[#355B50]">{rev.sellerReply.comment}</p>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<div
			class="flex items-center justify-between rounded-xl border border-[#E5ECE7] bg-white px-4 py-3 text-xs text-[#52776C]"
		>
			<div class="flex items-center gap-2">
				<ShieldCheck class="h-4 w-4 text-[#0C7B58]" aria-hidden="true" />
				<span>{m.pu_store_trust_payment()}</span>
			</div>
			<Logo size="xs" />
		</div>
	</div>
{/if}
