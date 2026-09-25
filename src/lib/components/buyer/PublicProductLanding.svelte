<script lang="ts">
	import { goto } from '$app/navigation';
	import { seller } from '$lib/stores/seller.svelte';
	import { formatRupiah } from '$lib/data/mockData';
	import { getProductTypeTheme } from '$lib/domain/productTheme';
	import { getProductPriceState } from '$lib/domain/pricing';
	import {
		getAvailableTimeSlotsForDate,
		getBookableDates,
		type AvailableDateOption
	} from '$lib/domain/scheduling';
	import { getSellerTrustLevel } from '$lib/domain/verification';
	import { getPublicProductUrl } from '$lib/domain/url';
	import { normalizeProductType, type Product, type SellerProfile } from '$lib/types';
	import * as m from '$lib/paraglide/messages.js';
	import CheckoutModal from '$lib/components/buyer/CheckoutModal.svelte';
	import KarjaVerifiedBadge from '$lib/components/settings/KarjaVerifiedBadge.svelte';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Award from 'lucide-svelte/icons/award';
	import BadgeCheck from 'lucide-svelte/icons/badge-check';
	import BookOpen from 'lucide-svelte/icons/book-open';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Check from 'lucide-svelte/icons/check';
	import CheckCircle2 from 'lucide-svelte/icons/check-circle-2';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import ChevronUp from 'lucide-svelte/icons/chevron-up';
	import Clock from 'lucide-svelte/icons/clock';
	import Download from 'lucide-svelte/icons/download';
	import FileText from 'lucide-svelte/icons/file-text';
	import HelpCircle from 'lucide-svelte/icons/help-circle';
	import Layers from 'lucide-svelte/icons/layers';
	import Maximize2 from 'lucide-svelte/icons/maximize-2';
	import Share2 from 'lucide-svelte/icons/share-2';
	import ShieldCheck from 'lucide-svelte/icons/shield-check';
	import UserCheck from 'lucide-svelte/icons/user-check';
	import Video from 'lucide-svelte/icons/video';
	import X from 'lucide-svelte/icons/x';

	type Props = {
		product: Product;
		seller?: SellerProfile;
	};
	let { product, seller: sellerOverride }: Props = $props();

	let activeImageIndex = $state(0);
	let copiedLink = $state(false);
	let expandedFaqId = $state<string | null>(null);
	let lightboxOpen = $state(false);
	let showCheckout = $state(false);
	let buyClickRecorded = $state(false);

	const sellerProfile = $derived(sellerOverride ?? seller.sellerProfile);
	const canonicalType = $derived(normalizeProductType(product.type));
	const priceState = $derived(getProductPriceState(product));
	const theme = $derived(getProductTypeTheme(product.type));

	const imagesList = $derived.by(() => {
		const list = Array.isArray(product.images)
			? product.images.filter((img) => typeof img === 'string' && img.trim().length > 0)
			: [];
		if (
			list.length === 0 &&
			typeof product.coverImage === 'string' &&
			product.coverImage.trim().length > 0
		) {
			return [...list, product.coverImage];
		}
		return list;
	});

	const initials = $derived(
		sellerProfile?.name
			? sellerProfile.name
					.split(' ')
					.map((n) => n[0])
					.slice(0, 2)
					.join('')
					.toUpperCase()
			: 'TK'
	);

	const trustLevel = $derived(getSellerTrustLevel(sellerProfile, seller.orders));

	const availability = $derived(
		product.availabilityMode === 'custom' && product.customAvailability
			? product.customAvailability
			: sellerProfile.availability
	);

	const availabilityPreview = $derived.by(() => {
		if (canonicalType !== 'session') return [];
		const dates = getBookableDates(product.bookingWindowDays || 30, availability);
		const out: { date: AvailableDateOption; slotCount: number }[] = [];
		for (const d of dates) {
			if (!d.isAvailable) continue;
			const slots = getAvailableTimeSlotsForDate(d.date, product, availability, seller.bookings);
			if (slots.length > 0) {
				out.push({ date: d, slotCount: slots.length });
				if (out.length >= 6) break;
			}
		}
		return out;
	});

	const ctaLabel = $derived(
		priceState.isFree
			? m.bu_pdp_cta_free()
			: canonicalType === 'session'
				? m.bu_pdp_cta_session({ price: formatRupiah(priceState.effectivePrice) })
				: canonicalType === 'service'
					? m.bu_pdp_cta_service({ price: formatRupiah(priceState.effectivePrice) })
					: m.bu_pdp_cta_digital({ price: formatRupiah(priceState.effectivePrice) })
	);

	const mobileCtaLabel = $derived(
		priceState.isFree
			? m.bu_pdp_cta_free()
			: canonicalType === 'session'
				? m.bu_pdp_cta_m_session()
				: canonicalType === 'service'
					? m.bu_pdp_cta_m_service()
					: m.bu_pdp_cta_m_digital()
	);

	const whatsappUrl = $derived.by(() => {
		if (!sellerProfile?.whatsapp) return '';
		const phone = sellerProfile.whatsapp.replace(/^0/, '62').replace(/[^0-9]/g, '');
		const text = encodeURIComponent(
			m.bu_pdp_wa_message({ name: sellerProfile.name, title: product.title })
		);
		return `https://wa.me/${phone}?text=${text}`;
	});

	$effect(() => {
		if (!buyClickRecorded) {
			buyClickRecorded = true;
			seller.recordBuyClick(product);
		}
	});

	$effect(() => {
		const faqs = product.faqs;
		if (faqs && faqs.length > 0 && !expandedFaqId) {
			expandedFaqId = faqs[0].id;
		}
	});

	$effect(() => {
		const pid = product.id;
		if (pid) activeImageIndex = 0;
	});

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && lightboxOpen) lightboxOpen = false;
	}

	async function handleCopyProductLink() {
		try {
			await navigator.clipboard.writeText(
				getPublicProductUrl(sellerProfile.username, product.slug)
			);
			copiedLink = true;
			setTimeout(() => (copiedLink = false), 2000);
		} catch {
			/* noop */
		}
	}

	function handleNextImage() {
		if (imagesList.length <= 1) return;
		activeImageIndex = (activeImageIndex + 1) % imagesList.length;
	}

	function handlePrevImage() {
		if (imagesList.length <= 1) return;
		activeImageIndex = (activeImageIndex - 1 + imagesList.length) % imagesList.length;
	}

	function goBackToStore() {
		void goto(`/${sellerProfile.username}`);
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="mx-auto w-full max-w-[1240px] space-y-6 px-4 pt-6 pb-20 sm:px-8 sm:pb-8">
	<div class="flex items-center justify-between gap-2 pb-1">
		<button
			type="button"
			onclick={goBackToStore}
			class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#E4EBE7] bg-white px-3 py-1.5 text-xs font-semibold text-[#0C7B58] shadow-2xs transition-colors hover:bg-[#F4F8F6] hover:text-[#096649]"
		>
			<ArrowLeft class="h-3.5 w-3.5" />
			<span>{m.bu_pdp_back_to_store()}</span>
		</button>

		<button
			type="button"
			onclick={() => void handleCopyProductLink()}
			title={m.bu_pdp_share_title()}
			class="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-[#E4EBE7] bg-white px-3 py-1.5 text-xs font-semibold text-[#245445] shadow-2xs transition-colors hover:bg-[#F4F8F6] hover:text-[#0C7B58]"
		>
			{#if copiedLink}
				<Check class="h-3.5 w-3.5 stroke-[2.5] text-emerald-600" />
				<span class="text-emerald-700">{m.bu_pdp_share_copied()}</span>
			{:else}
				<Share2 class="h-3.5 w-3.5" />
				<span>{m.bu_pdp_share()}</span>
			{/if}
		</button>
	</div>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
		<div class="space-y-6 lg:col-span-7">
			<div class="space-y-3 rounded-3xl border border-[#E4EBE7] bg-white p-3 shadow-2xs sm:p-4">
				<div
					class="group relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-[#F4F8F6]"
				>
					{#if imagesList.length > 0 && imagesList[activeImageIndex]}
						<img
							src={imagesList[activeImageIndex]}
							alt={m.bu_pdp_image_alt({ title: product.title, index: activeImageIndex + 1 })}
							class="h-full w-full object-cover transition-all duration-300 select-none"
						/>
					{:else}
						<div class="space-y-2 p-6 text-center">
							<div class="text-5xl">{product.coverEmoji || '📦'}</div>
							<div class="text-xs font-bold text-[#0C7B58]">
								{product.category || m.bu_pdp_category_fallback()}
							</div>
						</div>
					{/if}

					<div class="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-1.5">
						<span
							class="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold {theme.badgeClass} bg-white/95 shadow-2xs backdrop-blur-xs"
						>
							<theme.icon class="h-3 w-3 shrink-0" />
							<span>{m[theme.labelKey]()}</span>
						</span>
						{#if product.productSubtype}
							<span
								class="rounded-lg bg-[#DEF766] px-2.5 py-1 text-[10px] font-semibold text-[#0A3D2E] shadow-2xs"
							>
								{product.productSubtype}
							</span>
						{/if}
						{#if product.badge}
							<span
								class="rounded-lg bg-[#0C7B58] px-2.5 py-1 text-[10px] font-semibold text-white shadow-2xs"
							>
								{product.badge}
							</span>
						{/if}
					</div>

					{#if imagesList.length > 0}
						<button
							type="button"
							onclick={() => (lightboxOpen = true)}
							title={m.bu_pdp_expand_image()}
							class="absolute top-3 right-3 cursor-pointer rounded-xl bg-black/40 p-2 text-white opacity-0 backdrop-blur-xs transition-opacity group-hover:opacity-100 hover:bg-black/60"
						>
							<Maximize2 class="h-4 w-4" />
						</button>
					{/if}

					{#if imagesList.length > 1}
						<button
							type="button"
							onclick={handlePrevImage}
							aria-label={m.bu_pdp_prev_image()}
							class="absolute top-1/2 left-2.5 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[#CCE6D6] bg-white/90 text-[#0E2E25] shadow-md transition-all hover:scale-105 hover:bg-white"
						>
							<ChevronLeft class="h-4 w-4" />
						</button>

						<button
							type="button"
							onclick={handleNextImage}
							aria-label={m.bu_pdp_next_image()}
							class="absolute top-1/2 right-2.5 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[#CCE6D6] bg-white/90 text-[#0E2E25] shadow-md transition-all hover:scale-105 hover:bg-white"
						>
							<ChevronRight class="h-4 w-4" />
						</button>

						<div
							class="absolute right-3 bottom-3 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs"
						>
							{activeImageIndex + 1} / {imagesList.length}
						</div>
					{/if}
				</div>

				{#if imagesList.length > 1}
					<div class="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
						{#each imagesList as imgUrl, idx (idx)}
							<button
								type="button"
								onclick={() => (activeImageIndex = idx)}
								class="relative aspect-video w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition-all sm:w-20 {idx ===
								activeImageIndex
									? 'border-[#0C7B58] shadow-xs ring-2 ring-[#0C7B58]/30'
									: 'border-transparent opacity-65 hover:border-[#CCE6D6] hover:opacity-100'}"
							>
								<img
									src={imgUrl}
									alt={m.bu_pdp_thumbnail_alt({ index: idx + 1 })}
									class="h-full w-full object-cover"
								/>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			{#if product.targetAudience && product.targetAudience.trim()}
				<div class="space-y-3 rounded-3xl border border-[#E4EBE7] bg-white p-5 shadow-2xs sm:p-6">
					<div class="flex items-center gap-2 text-[#0C7B58]">
						<UserCheck class="h-4 w-4 stroke-[2.5]" />
						<h3 class="text-sm font-bold tracking-wider text-[#0A3D2E] uppercase">
							{m.bu_pdp_sec_target()}
						</h3>
					</div>
					<p class="text-xs leading-relaxed whitespace-pre-line text-[#245445] sm:text-sm">
						{product.targetAudience}
					</p>
				</div>
			{/if}

			{#if product.problemSolved && product.problemSolved.trim()}
				<div class="space-y-3 rounded-3xl border border-[#E4EBE7] bg-white p-5 shadow-2xs sm:p-6">
					<div class="flex items-center gap-2 text-[#0C7B58]">
						<HelpCircle class="h-4 w-4 stroke-[2.5]" />
						<h3 class="text-sm font-bold tracking-wider text-[#0A3D2E] uppercase">
							{m.bu_pdp_sec_problem()}
						</h3>
					</div>
					<p class="text-xs leading-relaxed whitespace-pre-line text-[#245445] sm:text-sm">
						{product.problemSolved}
					</p>
				</div>
			{/if}

			{#if product.whatYouGet && product.whatYouGet.trim()}
				<div class="space-y-4 rounded-3xl border border-[#E4EBE7] bg-white p-5 shadow-2xs sm:p-6">
					<div class="flex items-center gap-2 text-[#0C7B58]">
						<Layers class="h-4 w-4 stroke-[2.5]" />
						<h3 class="text-sm font-bold tracking-wider text-[#0A3D2E] uppercase">
							{m.bu_pdp_sec_deliverables()}
						</h3>
					</div>

					<div
						class="rounded-2xl border border-[#E4EBE7] bg-[#F4F8F6] p-4 text-xs leading-relaxed whitespace-pre-line text-[#184A3B] sm:text-sm"
					>
						{product.whatYouGet}
					</div>

					<div class="grid grid-cols-1 gap-2.5 pt-1 text-xs sm:grid-cols-2">
						{#if canonicalType === 'digital'}
							<div
								class="flex items-center gap-2.5 rounded-xl border border-[#E4EBE7] bg-white p-3"
							>
								<div
									class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EAF8F0] text-[#0C7B58]"
								>
									<FileText class="h-3.5 w-3.5" />
								</div>
								<div class="truncate">
									<div class="text-[10px] text-gray-500">{m.bu_pdp_spec_filename()}</div>
									<div class="truncate font-bold text-[#0E2E25]">
										{product.fileDownloadName || m.bu_pdp_spec_filename_fallback()}
									</div>
								</div>
							</div>

							<div
								class="flex items-center gap-2.5 rounded-xl border border-[#E4EBE7] bg-white p-3"
							>
								<div
									class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EAF8F0] text-[#0C7B58]"
								>
									<Download class="h-3.5 w-3.5" />
								</div>
								<div>
									<div class="text-[10px] text-gray-500">{m.bu_pdp_spec_filesize()}</div>
									<div class="font-bold text-[#0E2E25]">
										{product.fileSize || m.bu_pdp_spec_filesize_fallback()}
									</div>
								</div>
							</div>
						{:else if canonicalType === 'session'}
							<div
								class="flex items-center gap-2.5 rounded-xl border border-[#E4EBE7] bg-white p-3"
							>
								<div
									class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#1E40AF]"
								>
									<Clock class="h-3.5 w-3.5" />
								</div>
								<div>
									<div class="text-[10px] text-gray-500">{m.bu_pdp_spec_duration()}</div>
									<div class="font-bold text-[#0E2E25]">
										{m.bu_pdp_minutes({ count: product.sessionDurationMinutes || 20 })}
									</div>
								</div>
							</div>

							<div
								class="flex items-center gap-2.5 rounded-xl border border-[#E4EBE7] bg-white p-3"
							>
								<div
									class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#1E40AF]"
								>
									<Video class="h-3.5 w-3.5" />
								</div>
								<div>
									<div class="text-[10px] text-gray-500">{m.bu_pdp_spec_platform()}</div>
									<div class="font-bold text-[#0E2E25]">{m.bu_sh_google_meet()}</div>
								</div>
							</div>
						{:else}
							<div
								class="flex items-center gap-2.5 rounded-xl border border-[#E4EBE7] bg-white p-3"
							>
								<div
									class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FAF5FF] text-[#6B21A8]"
								>
									<Clock class="h-3.5 w-3.5" />
								</div>
								<div>
									<div class="text-[10px] text-gray-500">{m.bu_pdp_spec_timeline()}</div>
									<div class="font-bold text-[#0E2E25]">
										{product.serviceTimelineDays
											? m.bu_pdp_business_days({ count: product.serviceTimelineDays })
											: m.bu_pdp_dash()}
									</div>
								</div>
							</div>

							<div
								class="flex items-center gap-2.5 rounded-xl border border-[#E4EBE7] bg-white p-3"
							>
								<div
									class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FAF5FF] text-[#6B21A8]"
								>
									<CheckCircle2 class="h-3.5 w-3.5" />
								</div>
								<div>
									<div class="text-[10px] text-gray-500">{m.bu_pdp_spec_revisions()}</div>
									<div class="font-bold text-[#0E2E25]">
										{m.bu_pdp_revisions_value({ count: product.serviceRevisions ?? 1 })}
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			{#if canonicalType === 'session' && availabilityPreview.length > 0}
				<div class="space-y-3 rounded-3xl border border-[#E4EBE7] bg-white p-5 shadow-2xs sm:p-6">
					<div class="flex items-center gap-2 text-[#0C7B58]">
						<Calendar class="h-4 w-4 stroke-[2.5]" />
						<h3 class="text-sm font-bold tracking-wider text-[#0A3D2E] uppercase">
							{m.bu_pdp_sched_preview_title()}
						</h3>
					</div>

					<div class="flex items-center gap-2 overflow-x-auto pb-1">
						{#each availabilityPreview as entry (entry.date.dateString)}
							<div
								class="flex min-w-[86px] shrink-0 flex-col items-center rounded-xl border border-[#CCE6D6] bg-[#F4FAF6] p-2 text-center"
							>
								<span class="text-[10px] font-semibold text-[#4A7264] uppercase">
									{entry.date.dayLabel.split(' ')[0]}
								</span>
								<span class="text-sm font-bold text-[#0E2E25]">
									{entry.date.dayLabel.split(' ')[1]}
								</span>
								<span class="text-[10px] font-semibold text-[#0C7B58]">
									{m.bu_pdp_sched_preview_slots({ count: entry.slotCount })}
								</span>
							</div>
						{/each}
					</div>

					<p class="text-[11px] leading-relaxed text-[#52776C]">
						{m.bu_pdp_sched_preview_hint()}
					</p>
				</div>
			{/if}

			{#if product.howItWorks && product.howItWorks.trim()}
				<div class="space-y-3 rounded-3xl border border-[#E4EBE7] bg-white p-5 shadow-2xs sm:p-6">
					<div class="flex items-center gap-2 text-[#0C7B58]">
						<BookOpen class="h-4 w-4 stroke-[2.5]" />
						<h3 class="text-sm font-bold tracking-wider text-[#0A3D2E] uppercase">
							{m.bu_pdp_sec_how()}
						</h3>
					</div>
					<p class="text-xs leading-relaxed whitespace-pre-line text-[#245445] sm:text-sm">
						{product.howItWorks}
					</p>
				</div>
			{/if}

			<div class="space-y-3 rounded-3xl border border-[#E4EBE7] bg-[#F4F8F6] p-5 sm:p-6">
				<div class="flex items-center gap-2 text-[#0C7B58]">
					<CheckCircle2 class="h-4 w-4 stroke-[2.5]" />
					<h3 class="text-sm font-bold tracking-wider text-[#0A3D2E] uppercase">
						{m.bu_pdp_sec_access()}
					</h3>
				</div>

				{#if canonicalType === 'digital'}
					<p class="text-xs leading-relaxed text-[#20493E] sm:text-sm">
						{m.bu_pdp_access_digital()}
					</p>
				{:else if canonicalType === 'session'}
					<p class="text-xs leading-relaxed text-[#20493E] sm:text-sm">
						{m.bu_pdp_access_session()}
					</p>
				{:else}
					<p class="text-xs leading-relaxed text-[#20493E] sm:text-sm">
						{m.bu_pdp_access_service()}{product.serviceTimelineDays
							? ` ${m.bu_pdp_service_eta({ days: product.serviceTimelineDays })}`
							: ''}
					</p>
				{/if}
			</div>

			<div class="space-y-4 rounded-3xl border border-[#D5EBDD] bg-white p-5 shadow-2xs sm:p-6">
				<div class="flex items-center gap-2 text-[#0C7B58]">
					<Award class="h-4 w-4 stroke-[2.5]" />
					<h3 class="text-sm font-bold tracking-wider text-[#0A3D2E] uppercase">
						{m.bu_pdp_sec_about({ name: sellerProfile.name || m.bu_pdp_seller_fallback() })}
					</h3>
				</div>

				<div class="flex items-start gap-4">
					<div
						class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#DEF766] text-lg font-extrabold text-[#0A3D2E] ring-2 ring-[#CCE6D6]"
					>
						{#if sellerProfile.avatarUrl && sellerProfile.avatarUrl.trim().length > 0}
							<img
								src={sellerProfile.avatarUrl}
								alt={sellerProfile.name}
								class="h-full w-full object-cover"
							/>
						{:else}
							<span>{initials}</span>
						{/if}
					</div>

					<div class="min-w-0 flex-1 space-y-1">
						<div class="flex flex-wrap items-center gap-2">
							<span class="text-sm font-extrabold text-[#0E2E25] sm:text-base">
								{sellerProfile.name || m.bu_pdp_seller_fallback()}
							</span>
							{#if trustLevel === 'karja_verified'}
								<KarjaVerifiedBadge size="sm" />
							{:else if trustLevel === 'identity_verified'}
								<span
									class="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0C7B58]"
								>
									<BadgeCheck class="h-3.5 w-3.5" />
									<span>{m.bu_pdp_identity_verified()}</span>
								</span>
							{/if}
						</div>

						{#if sellerProfile.tagline}
							<p class="text-xs font-semibold text-[#0C7B58]">
								{sellerProfile.tagline}
							</p>
						{/if}

						{#if product.aboutCreator && product.aboutCreator.trim()}
							<p class="pt-1 text-xs leading-relaxed text-[#436A5D]">
								{product.aboutCreator}
							</p>
						{:else if sellerProfile.bio}
							<p class="pt-1 text-xs leading-relaxed text-[#436A5D]">
								"{sellerProfile.bio}"
							</p>
						{/if}

						{#if sellerProfile.topics && sellerProfile.topics.length > 0}
							<div class="flex flex-wrap gap-1 pt-1.5">
								{#each sellerProfile.topics as t (t)}
									<span
										class="rounded-full border border-[#CCE6D6] bg-[#F4FAF6] px-2.5 py-0.5 text-[10px] font-semibold text-[#185343]"
									>
										{t}
									</span>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<div class="flex items-center justify-between border-t border-gray-100 pt-2">
					<span class="text-xs text-[#52776C]">{m.bu_pdp_view_other()}</span>
					<button
						type="button"
						onclick={goBackToStore}
						class="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-[#0C7B58] hover:underline"
					>
						<span>{m.bu_pdp_view_store()}</span>
						<ChevronRight class="h-3.5 w-3.5" />
					</button>
				</div>
			</div>

			{#if product.faqs && product.faqs.length > 0}
				<div class="space-y-4 rounded-3xl border border-[#E4EBE7] bg-white p-5 shadow-2xs sm:p-6">
					<div class="flex items-center gap-2 text-[#0C7B58]">
						<HelpCircle class="h-4 w-4 stroke-[2.5]" />
						<h3 class="text-sm font-bold tracking-wider text-[#0A3D2E] uppercase">
							{m.bu_pdp_sec_faq()}
						</h3>
					</div>

					<div class="space-y-2.5">
						{#each product.faqs as faq (faq.id)}
							{@const isExpanded = expandedFaqId === faq.id}
							<div class="overflow-hidden rounded-2xl border border-[#E4EBE7] bg-[#FAFDFB]">
								<button
									type="button"
									onclick={() => (expandedFaqId = isExpanded ? null : faq.id)}
									aria-expanded={isExpanded}
									class="flex w-full cursor-pointer items-center justify-between gap-3 p-3.5 text-left text-xs font-bold text-[#0E2E25] hover:text-[#0C7B58] sm:p-4 sm:text-sm"
								>
									<span>{faq.question}</span>
									{#if isExpanded}
										<ChevronUp class="h-4 w-4 shrink-0 text-[#0C7B58]" />
									{:else}
										<ChevronDown class="h-4 w-4 shrink-0 text-gray-400" />
									{/if}
								</button>

								{#if isExpanded}
									<div
										class="border-t border-[#F4F8F6] bg-white px-3.5 pt-1 pb-4 text-xs leading-relaxed text-[#436A5D] sm:px-4 sm:text-sm"
									>
										{faq.answer}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<div
				class="space-y-1 rounded-2xl border border-[#E4EBE7] bg-[#F4F8F6] p-4 text-center text-xs text-[#355B50]"
			>
				<div class="flex items-center justify-center gap-1.5 font-bold text-[#0E2E25]">
					<ShieldCheck class="h-4 w-4 text-[#0C7B58]" />
					<span>{m.bu_pdp_trust_title()}</span>
				</div>
				<p class="mx-auto max-w-md text-[11px] text-[#52776C]">
					{m.bu_pdp_trust_desc()}
				</p>
			</div>
		</div>

		<div class="lg:col-span-5">
			<div class="space-y-4 lg:sticky lg:top-6">
				<div class="space-y-5 rounded-3xl border border-[#E4EBE7] bg-white p-6 shadow-xs">
					<div class="flex flex-wrap items-center gap-1.5">
						<span
							class="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold {theme.badgeClass}"
						>
							<theme.icon class="h-3 w-3 shrink-0" />
							<span>{m[theme.labelKey]()}</span>
						</span>
						{#if product.productSubtype}
							<span
								class="rounded-md bg-[#DEF766] px-2.5 py-1 text-[10px] font-semibold text-[#0A3D2E]"
							>
								{product.productSubtype}
							</span>
						{/if}
					</div>

					<div class="space-y-1.5">
						<h1 class="text-lg leading-snug font-extrabold text-[#0E2E25] sm:text-xl">
							{product.title}
						</h1>

						<div class="flex items-center gap-1.5 pt-0.5 text-xs text-[#436A5D]">
							<span>{m.bu_pdp_by()}</span>
							<span class="inline-flex items-center gap-1.5 align-middle">
								<span class="font-bold text-[#0E2E25]">{sellerProfile.name}</span>
								{#if trustLevel === 'karja_verified'}
									<KarjaVerifiedBadge size="xs" />
								{:else if trustLevel === 'identity_verified'}
									<BadgeCheck class="h-3.5 w-3.5 text-[#0C7B58]" />
								{/if}
							</span>
						</div>

						{#if product.shortDescription}
							<p class="line-clamp-3 pt-1 text-xs leading-relaxed text-[#436A5D]">
								{product.shortDescription}
							</p>
						{/if}
					</div>

					<div class="space-y-1 rounded-2xl border border-[#E4EBE7] bg-[#FAFDFB] p-4">
						<div class="text-[11px] font-semibold text-[#52776C]">
							{m.bu_pdp_price_label()}
						</div>
						<div class="flex flex-wrap items-baseline gap-2">
							{#if priceState.isFree}
								<span class="text-2xl font-black text-[#0C7B58]">{m.bu_sh_free()}</span>
							{:else if priceState.isPromoActive}
								<span class="text-2xl font-black text-[#0B6651]">
									{priceState.formattedPrice}
								</span>
								<span class="text-xs text-gray-400 line-through">
									{priceState.formattedOriginalPrice}
								</span>
								<span
									class="rounded-full bg-[#FF7F7F]/20 px-2 py-0.5 text-[10px] font-semibold text-[#D32F2F]"
								>
									{m.bu_pdp_promo_tag()}
								</span>
							{:else}
								<span class="text-2xl font-black text-[#0B6651]">
									{priceState.formattedPrice}
								</span>
							{/if}
						</div>
					</div>

					<div class="space-y-2.5">
						<button
							type="button"
							onclick={() => (showCheckout = true)}
							class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#0C7B58] px-4 py-3.5 text-sm font-extrabold text-white shadow-md transition-all hover:bg-[#096649] hover:shadow-lg active:scale-[0.99]"
						>
							<span>{ctaLabel}</span>
							<ChevronRight class="h-4 w-4 stroke-[2.5]" />
						</button>

						{#if sellerProfile.showWhatsappOnStore && sellerProfile.whatsapp}
							<a
								href={whatsappUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#CCE6D6] bg-[#EAF8F0] px-4 py-2.5 text-xs font-bold text-[#0C7B58] transition-colors hover:bg-[#DDF2E5]"
							>
								<img
									src="https://file.garden/ao1B7sLFNyZKt73m/Toko/logo-whatsapp-png-pic-0.png"
									alt="WA"
									class="h-4 w-4 object-contain"
								/>
								<span>{m.bu_pdp_wa_cta()}</span>
							</a>
						{/if}
					</div>

					<div class="space-y-2 border-t border-gray-100 pt-2 text-xs text-[#2D584B]">
						<div class="flex items-center gap-2">
							<ShieldCheck class="h-4 w-4 shrink-0 text-[#0C7B58]" />
							<span>{m.bu_pdp_bullet_paid()}</span>
						</div>
						{#if canonicalType === 'digital'}
							<div class="flex items-center gap-2">
								<Download class="h-4 w-4 shrink-0 text-[#0C7B58]" />
								<span>{m.bu_pdp_bullet_digital()}</span>
							</div>
						{:else if canonicalType === 'session'}
							<div class="flex items-center gap-2">
								<Calendar class="h-4 w-4 shrink-0 text-[#0C7B58]" />
								<span>{m.bu_pdp_bullet_session()}</span>
							</div>
						{:else if product.serviceTimelineDays}
							<div class="flex items-center gap-2">
								<Clock class="h-4 w-4 shrink-0 text-[#0C7B58]" />
								<span>{m.bu_pdp_service_eta({ days: product.serviceTimelineDays })}</span>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<div
	class="fixed inset-0 right-0 bottom-0 left-0 z-20 flex items-center justify-between gap-3 border-t border-[#CCE6D6] bg-white/95 p-3 shadow-lg backdrop-blur-md sm:hidden"
>
	<div class="min-w-0 flex-1">
		<div class="truncate text-[11px] text-gray-500">{product.title}</div>
		<div class="text-sm font-black text-[#0B6651]">
			{priceState.isFree ? m.bu_sh_free() : priceState.formattedPrice}
		</div>
	</div>

	<button
		type="button"
		onclick={() => (showCheckout = true)}
		class="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-[#0C7B58] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#096649]"
	>
		<span>{mobileCtaLabel}</span>
		<ChevronRight class="h-3.5 w-3.5" />
	</button>
</div>

{#if lightboxOpen && imagesList.length > 0}
	<div
		role="presentation"
		onclick={(e) => {
			if (e.target === e.currentTarget) lightboxOpen = false;
		}}
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs"
	>
		<div
			role="dialog"
			aria-modal="true"
			aria-label={product.title}
			class="flex max-h-[85vh] w-full max-w-4xl flex-col items-center justify-center gap-3"
		>
			<button
				type="button"
				onclick={() => (lightboxOpen = false)}
				aria-label={m.bu_pdp_close_lightbox()}
				class="absolute top-4 right-4 cursor-pointer rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white"
			>
				<X class="h-6 w-6" />
			</button>

			<img
				src={imagesList[activeImageIndex]}
				alt={product.title}
				class="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
			/>
			{#if imagesList.length > 1}
				<div class="flex items-center gap-2">
					{#each imagesList as img, idx (idx)}
						<button
							type="button"
							onclick={() => (activeImageIndex = idx)}
							aria-label={m.bu_pdp_thumbnail_alt({ index: idx + 1 })}
							class="h-12 w-12 cursor-pointer overflow-hidden rounded-lg border-2 transition-all {idx ===
							activeImageIndex
								? 'scale-105 border-[#DEF766]'
								: 'border-white/30 opacity-60'}"
						>
							<img src={img} alt="" class="h-full w-full object-cover" />
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

{#if showCheckout}
	<CheckoutModal
		{product}
		sellerUsername={sellerProfile.username}
		onClose={() => (showCheckout = false)}
	/>
{/if}
