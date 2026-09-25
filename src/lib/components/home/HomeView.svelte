<script lang="ts">
	import { getOnboardingProgress } from '$lib/domain/onboarding';
	import { seller } from '$lib/stores/seller.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import PageFrame from '$lib/components/common/PageFrame.svelte';
	import PageContent from '$lib/components/common/PageContent.svelte';
	import PageHeader from '$lib/components/common/PageHeader.svelte';
	import StartHereCard from '$lib/components/home/StartHereCard.svelte';
	import NextBestActionCard from '$lib/components/home/NextBestActionCard.svelte';
	import ActivityMetricsCards from '$lib/components/home/ActivityMetricsCards.svelte';
	import RecentActivityTimeline from '$lib/components/home/RecentActivityTimeline.svelte';
	import { findBookingForOrder, isPaidSale, needsSellerAction } from '$lib/domain/orderLifecycle';

	const displayName = $derived(seller.sellerProfile?.name || m.header_greeting_fallback());
	const isOnboarding = $derived(
		!getOnboardingProgress(seller.sellerProfile, seller.products, seller.journeySignals)
			.onboardingComplete
	);

	const totalViews = $derived(seller.products.reduce((sum, p) => sum + (p?.views || 0), 0));
	const totalSales = $derived(seller.orders.filter((o) => o && isPaidSale(o)).length);
	const totalRevenue = $derived(
		seller.orders.filter((o) => o && isPaidSale(o)).reduce((sum, o) => sum + (o?.amount || 0), 0)
	);
	const ordersNeedingAction = $derived(
		seller.orders.filter((o) => o && needsSellerAction(o, findBookingForOrder(o, seller.bookings)))
	);

	const supportingText = $derived.by(() => {
		if (isOnboarding) return m.home_intro();
		if (ordersNeedingAction.length === 1) return m.home_orders_needing_action({ count: 1 });
		if (ordersNeedingAction.length > 1) return m.home_support_some_actions();
		if (seller.products.length > 0) return m.home_recent_activity();
		return m.home_intro();
	});
</script>

<PageFrame>
	<PageContent variant="standard">
		<PageHeader>
			{#snippet title()}
				{m.home_greeting_prefix()} <span class="text-brand">{displayName}!</span>
			{/snippet}
			{#snippet description()}{supportingText}{/snippet}
		</PageHeader>

		{#if isOnboarding}
			<div class="space-y-6 sm:space-y-7">
				<StartHereCard />
				<RecentActivityTimeline />
			</div>
		{:else}
			<div class="space-y-6 sm:space-y-7">
				<NextBestActionCard {ordersNeedingAction} />
				<ActivityMetricsCards
					totalProducts={seller.products.length}
					{totalViews}
					{totalSales}
					{totalRevenue}
				/>
				<RecentActivityTimeline />
			</div>
		{/if}
	</PageContent>
</PageFrame>
