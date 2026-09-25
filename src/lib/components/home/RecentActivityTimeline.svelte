<script lang="ts">
	import { goto } from '$app/navigation';
	import { tabRoute } from '$lib/domain/nav';
	import { formatRupiah } from '$lib/data/mockData';
	import { seller } from '$lib/stores/seller.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import type { MainNavTab } from '$lib/types';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import ShoppingBag from 'lucide-svelte/icons/shopping-bag';
	import Eye from 'lucide-svelte/icons/eye';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Wallet from 'lucide-svelte/icons/wallet';
	import Bell from 'lucide-svelte/icons/bell';

	interface FeedItem {
		id: string;
		title: string;
		subtitle: string;
		time: string;
		type: 'sale' | 'view' | 'session' | 'payout' | 'general';
		targetTab?: MainNavTab;
		targetId?: string;
	}

	const displayItems = $derived.by((): FeedItem[] => {
		const feedItems: FeedItem[] = [];

		seller.orders.slice(0, 4).forEach((order) => {
			const isFree = order.isFreeClaim || order.amount === 0;
			let title = isFree
				? m.home_feed_claim({ buyer: order.buyerName, title: order.productTitle })
				: m.home_feed_purchase({ buyer: order.buyerName, title: order.productTitle });
			let subtitle = isFree
				? `${m.home_feed_claim_label()} · ${order.createdAt}`
				: `${formatRupiah(order.amount)} · ${order.createdAt}`;
			let type: FeedItem['type'] = 'sale';

			if (order.fulfillmentStatus === 'perlu_dijadwalkan' && order.productType === 'session') {
				title = m.home_feed_session_booked({ buyer: order.buyerName, title: order.productTitle });
				subtitle = `${isFree ? m.home_feed_claim_label() : formatRupiah(order.amount)} · ${m.home_feed_needs_schedule()} · ${order.createdAt}`;
				type = 'session';
			} else if (order.fulfillmentStatus === 'selesai' && order.productType === 'session') {
				title = m.home_feed_session_done({ title: order.productTitle });
				subtitle = `${order.buyerName} · ${order.createdAt}`;
				type = 'session';
			}

			feedItems.push({
				id: `ord_feed_${order.id}`,
				title,
				subtitle,
				time: order.createdAt,
				type,
				targetTab: 'pesanan',
				targetId: order.id
			});
		});

		seller.notifications.forEach((notif) => {
			if (notif.type === 'view') {
				feedItems.push({
					id: notif.id,
					title: notif.title === m.products_first_view_title() ? notif.description : notif.title,
					subtitle: notif.time ?? '',
					time: notif.time ?? '',
					type: 'view',
					targetTab: notif.targetTab as MainNavTab,
					targetId: notif.targetId
				});
			} else if (notif.type === 'money') {
				feedItems.push({
					id: notif.id,
					title: notif.description,
					subtitle: notif.time ?? '',
					time: notif.time ?? '',
					type: 'payout',
					targetTab: 'uangmu'
				});
			}
		});

		return feedItems.slice(0, 5);
	});

	function open(item: FeedItem) {
		if (item.targetTab) void goto(tabRoute(item.targetTab, item.targetId));
	}
</script>

{#if displayItems.length > 0}
	<section class="space-y-3">
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-bold text-[#0E2E25]">{m.home_activity_recent()}</h2>
			<button
				type="button"
				onclick={() => goto(tabRoute('pesanan'))}
				class="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-brand transition-colors hover:text-[#007550] sm:text-sm"
			>
				<span>{m.common_see_all()}</span>
				<ArrowRight class="h-3.5 w-3.5" />
			</button>
		</div>

		<div class="rounded-2xl border border-[#E5ECE7] bg-white p-4 shadow-2xs sm:p-5">
			<div class="divide-y divide-[#F0F4F1]">
				{#each displayItems as item (item.id)}
					<button
						type="button"
						onclick={() => open(item)}
						class="group flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl px-2.5 py-3.5 text-left transition-colors first:pt-0 last:pb-0 hover:bg-[#F9FCFA]"
					>
						<span class="flex min-w-0 items-center gap-3">
							<span
								class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E5ECE7] bg-[#F4F8F5] text-brand"
							>
								{#if item.type === 'sale'}
									<ShoppingBag class="h-4 w-4 text-brand" />
								{:else if item.type === 'session'}
									<Calendar class="h-4 w-4 text-brand" />
								{:else if item.type === 'payout'}
									<Wallet class="h-4 w-4 text-brand" />
								{:else if item.type === 'view'}
									<Eye class="h-4 w-4 text-sage" />
								{:else}
									<Bell class="h-4 w-4 text-sage" />
								{/if}
							</span>
							<span class="min-w-0">
								<span
									class="block truncate text-xs leading-snug font-semibold text-[#0E2E25] transition-colors group-hover:text-brand sm:text-sm"
								>
									{item.title}
								</span>
								<span class="mt-0.5 line-clamp-1 block text-xs text-sage">
									{item.subtitle}
								</span>
							</span>
						</span>
						<span class="shrink-0 text-xs font-medium whitespace-nowrap text-[#7B998F]">
							{item.time}
						</span>
					</button>
				{/each}
			</div>
		</div>
	</section>
{/if}
