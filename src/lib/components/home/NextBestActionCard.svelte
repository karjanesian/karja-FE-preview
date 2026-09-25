<script lang="ts">
	import { goto } from '$app/navigation';
	import { tabRoute } from '$lib/domain/nav';
	import { findBookingForOrder, getOrderNextAction } from '$lib/domain/orderLifecycle';
	import { getVisualAsset, type VisualAsset } from '$lib/domain/visualAssets';
	import { seller } from '$lib/stores/seller.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import PlatformStateVisual from '$lib/components/common/PlatformStateVisual.svelte';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Eye from 'lucide-svelte/icons/eye';
	import Clock from 'lucide-svelte/icons/clock';
	import CheckCircle2 from 'lucide-svelte/icons/check-circle-2';
	import type { Order } from '$lib/types';

	type Props = { ordersNeedingAction: Order[] };
	let { ordersNeedingAction = [] }: Props = $props();

	const actionCount = $derived(ordersNeedingAction.length);
	const primaryOrder = $derived(ordersNeedingAction[0]);

	function navigateTab(tab: Parameters<typeof tabRoute>[0], targetId?: string) {
		void goto(tabRoute(tab, targetId));
	}

	function startCreateProduct() {
		void goto('/dashboard/products/new');
	}

	const item = $derived.by(
		(): {
			eyebrow: string;
			isAmber: boolean;
			title: string;
			highlightTitle?: string;
			subtitle: string;
			ctaText: string;
			action: () => void;
			secondaryAction?: () => void;
			secondaryText?: string;
			asset: VisualAsset;
		} => {
			if (actionCount > 0 && primaryOrder) {
				const primaryBooking = findBookingForOrder(primaryOrder, seller.bookings);
				const nextAction = getOrderNextAction(primaryOrder, primaryBooking);

				if (actionCount === 1) {
					return {
						eyebrow: nextAction.badgeText || m.home_nba_perlu_tindakan(),
						isAmber: true,
						title: nextAction.title,
						highlightTitle: primaryOrder.productTitle,
						subtitle: nextAction.description,
						ctaText: nextAction.actionLabel || m.home_nba_buka_pesanan(),
						action: () => navigateTab('pesanan', primaryOrder.id),
						asset: getVisualAsset('lifecycle.actionRequired')
					};
				}

				return {
					eyebrow: m.home_nba_eyebrow_multi({ count: actionCount }),
					isAmber: true,
					title: m.home_nba_title_multi({ count: actionCount }),
					highlightTitle: m.home_nba_highlight_multi({
						title: primaryOrder.productTitle,
						action: nextAction.badgeText || m.home_nba_perlu_tindakan().toLowerCase()
					}),
					subtitle: m.home_nba_subtitle_multi({
						buyer: primaryOrder.buyerName,
						remaining: actionCount - 1
					}),
					ctaText: nextAction.actionLabel || m.home_nba_cta_all_actions(),
					action: () => navigateTab('pesanan', primaryOrder.id),
					secondaryAction: () => navigateTab('pesanan'),
					secondaryText: m.home_nba_secondary_all_orders(),
					asset: getVisualAsset('lifecycle.actionRequired')
				};
			}

			switch (seller.lifecycleState) {
				case 'no_product':
					return {
						eyebrow: m.home_nba_no_product_eyebrow(),
						isAmber: false,
						title: m.home_nba_no_product_title(),
						subtitle: m.home_nba_no_product_desc(),
						ctaText: m.home_nba_no_product_cta(),
						action: startCreateProduct,
						asset: getVisualAsset('lifecycle.noProduct')
					};
				case 'product_draft':
					return {
						eyebrow: m.home_nba_draft_eyebrow(),
						isAmber: true,
						title: m.home_nba_draft_title(),
						subtitle: m.home_nba_draft_desc(),
						ctaText: m.home_nba_draft_cta(),
						action: startCreateProduct,
						asset: getVisualAsset('lifecycle.productDraft')
					};
				case 'product_published_not_shared':
					return {
						eyebrow: m.home_nba_published_eyebrow(),
						isAmber: false,
						title: m.home_nba_published_title(),
						subtitle: m.home_nba_published_desc(),
						ctaText: m.home_nba_published_cta(),
						action: () => navigateTab('produk'),
						secondaryText: m.home_nba_published_secondary(),
						asset: getVisualAsset('lifecycle.readyToShare')
					};
				case 'product_shared_no_views':
					return {
						eyebrow: m.home_nba_shared_eyebrow(),
						isAmber: false,
						title: m.home_nba_shared_title(),
						subtitle: m.home_nba_shared_desc(),
						ctaText: m.home_nba_shared_cta(),
						action: () => navigateTab('produk'),
						secondaryText: m.home_nba_shared_secondary(),
						asset: getVisualAsset('lifecycle.sharedNoViews')
					};
				case 'first_views_no_sale':
					return {
						eyebrow: m.home_nba_views_eyebrow(),
						isAmber: false,
						title: m.home_nba_views_title(),
						subtitle: m.home_nba_views_desc(),
						ctaText: m.home_nba_views_cta(),
						action: () => navigateTab('produk'),
						secondaryText: m.home_nba_views_secondary(),
						asset: getVisualAsset('lifecycle.viewsNoSale')
					};
				case 'first_sale_needs_action':
					return {
						eyebrow: m.home_nba_action_eyebrow(),
						isAmber: true,
						title: m.home_nba_action_title(),
						subtitle: m.home_nba_action_desc(),
						ctaText: m.home_nba_action_cta(),
						action: () => navigateTab('pesanan'),
						asset: getVisualAsset('lifecycle.actionRequired')
					};
				case 'first_sale_completed':
					return {
						eyebrow: m.home_nba_first_sale_eyebrow(),
						isAmber: false,
						title: m.home_nba_first_sale_title(),
						subtitle: m.home_nba_first_sale_desc(),
						ctaText: m.home_nba_first_sale_cta(),
						action: () => navigateTab('pesanan'),
						asset: getVisualAsset('lifecycle.firstSaleComplete')
					};
				case 'balance_available':
					return {
						eyebrow: m.home_nba_balance_eyebrow(),
						isAmber: false,
						title: m.home_nba_balance_title(),
						subtitle: m.home_nba_balance_desc(),
						ctaText: m.home_nba_balance_cta(),
						action: () => navigateTab('uangmu'),
						asset: getVisualAsset('lifecycle.balanceAvailable')
					};
				case 'repeat_seller':
				default:
					return {
						eyebrow: m.home_nba_safe_eyebrow(),
						isAmber: false,
						title: m.home_nba_safe_title(),
						subtitle: m.home_nba_safe_desc(),
						ctaText: m.home_nba_safe_cta(),
						action: () => navigateTab('produk'),
						asset: getVisualAsset('lifecycle.repeatSeller')
					};
			}
		}
	);
</script>

<div
	class="relative overflow-hidden rounded-2xl border p-6 shadow-2xs transition-all sm:p-7 {item.isAmber
		? 'border-[#F2E6CA] bg-[#FFFDF9]'
		: 'border-[#E5ECE7] bg-white'}"
>
	<div
		class="relative z-10 flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-start sm:gap-8"
	>
		<div class="max-w-xl flex-1 space-y-3 text-center sm:text-left">
			<div class="flex items-center justify-center sm:justify-start">
				{#if item.isAmber}
					<span
						class="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-amber-800 uppercase"
					>
						<Clock class="h-3.5 w-3.5 text-amber-700" />
						<span>{item.eyebrow}</span>
					</span>
				{:else}
					<span
						class="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-brand uppercase"
					>
						<CheckCircle2 class="h-3.5 w-3.5 text-brand" />
						<span>{item.eyebrow}</span>
					</span>
				{/if}
			</div>

			<h2 class="text-xl leading-snug font-bold tracking-tight text-[#0E2E25] sm:text-2xl">
				{item.title}
			</h2>

			{#if item.highlightTitle}
				<p class="text-sm font-semibold text-brand-dark sm:text-base">{item.highlightTitle}</p>
			{/if}

			<p class="text-xs leading-relaxed text-sage sm:text-sm">{item.subtitle}</p>

			<div class="flex flex-wrap items-center justify-center gap-3 pt-2 sm:justify-start">
				<button
					type="button"
					onclick={item.action}
					class="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#007550]"
				>
					<span>{item.ctaText}</span>
					<ArrowRight class="h-4 w-4" />
				</button>

				{#if item.secondaryAction && item.secondaryText}
					<button
						type="button"
						onclick={item.secondaryAction}
						class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#E5ECE7] bg-white px-4 py-2.5 text-xs font-semibold text-brand-dark transition-colors hover:bg-[#F4F8F5]"
					>
						<Eye class="h-3.5 w-3.5 text-brand" />
						<span>{item.secondaryText}</span>
					</button>
				{/if}
			</div>
		</div>

		<div
			class="mx-auto flex w-full max-w-[200px] shrink-0 items-center justify-center sm:w-[220px] sm:max-w-none md:w-[250px] lg:w-[280px]"
		>
			<PlatformStateVisual asset={item.asset} aspectRatio="4:3" />
		</div>
	</div>
</div>
