<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { admin } from '$lib/stores/admin.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { formatRupiah } from '$lib/data/mockData';
	import { deriveBuyersFromOrders, computeBuyerAnalytics } from '$lib/domain/buyerDomain';
	import type { Review } from '$lib/types';
	import User from 'lucide-svelte/icons/user';
	import Search from 'lucide-svelte/icons/search';
	import Clock from 'lucide-svelte/icons/clock';
	import Star from 'lucide-svelte/icons/star';
	import TriangleAlert from 'lucide-svelte/icons/triangle-alert';
	import X from 'lucide-svelte/icons/x';

	type BuyerFilterTab = 'all' | 'repeat' | 'active' | 'dispute';
	type BuyerDrawerTab = 'ringkasan' | 'pesanan' | 'review' | 'kasus' | 'timeline';

	let searchQuery = $state('');
	let activeFilterTab = $state<BuyerFilterTab>('all');
	let selectedBuyerKey = $state<string | null>(null);
	let drawerTab = $state<BuyerDrawerTab>('ringkasan');

	onMount(() => {
		void admin.syncAdminBuyers();
		void admin.syncAdminOrders();
		void admin.syncAdminCases();
	});

	const reviews = $derived<Review[]>(
		admin.platformOrders.map((o) => o.buyerReview).filter((r): r is Review => Boolean(r))
	);

	const buyers = $derived.by(() => {
		const derived = deriveBuyersFromOrders(admin.platformOrders, reviews, admin.platformDisputes);
		if (admin.platformBuyers.length === 0) return derived;
		const byKey = new Map(derived.map((b) => [b.buyerKey, b]));
		return admin.platformBuyers.map((b) => {
			const match = byKey.get(b.buyerKey);
			return match
				? { ...b, orders: match.orders, reviews: match.reviews, disputes: match.disputes }
				: b;
		});
	});
	const analytics = $derived(computeBuyerAnalytics(buyers));

	const filteredBuyers = $derived(
		buyers.filter((buyer) => {
			if (activeFilterTab === 'repeat' && !buyer.repeatBuyer) return false;
			if (activeFilterTab === 'active' && buyer.activeOrdersCount === 0) return false;
			if (activeFilterTab === 'dispute' && buyer.disputeCount === 0) return false;
			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase().trim();
				const matchName = buyer.name.toLowerCase().includes(q);
				const matchEmail = buyer.email.toLowerCase().includes(q);
				const matchPhone = buyer.phone && buyer.phone.toLowerCase().includes(q);
				const matchOrder = buyer.orders.some(
					(o) => o.orderNumber.toLowerCase().includes(q) || o.productTitle.toLowerCase().includes(q)
				);
				return matchName || matchEmail || matchPhone || matchOrder;
			}
			return true;
		})
	);

	const selectedBuyer = $derived(
		selectedBuyerKey ? buyers.find((b) => b.buyerKey === selectedBuyerKey) || null : null
	);

	const selectedBuyerEvents = $derived(
		selectedBuyer
			? admin.platformJourneyEvents
					.filter(
						(e) =>
							e.buyerKey === selectedBuyer.buyerKey ||
							(e.buyerEmail && e.buyerEmail.toLowerCase() === selectedBuyer.email.toLowerCase())
					)
					.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
			: []
	);

	function formatDate(isoStr?: string): string {
		if (!isoStr) return '-';
		try {
			return new Date(isoStr).toLocaleDateString('id-ID', {
				day: 'numeric',
				month: 'short',
				year: 'numeric'
			});
		} catch {
			return isoStr;
		}
	}

	function formatDateTime(isoStr?: string): string {
		if (!isoStr) return '-';
		try {
			return new Date(isoStr).toLocaleDateString('id-ID', {
				day: 'numeric',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return isoStr;
		}
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && selectedBuyerKey) selectedBuyerKey = null;
	}
</script>

<svelte:window onkeydown={onKeydown} />

<div class="mx-auto max-w-7xl space-y-6 pb-16">
	<div
		class="flex flex-col justify-between gap-4 border-b border-gray-200 pb-5 md:flex-row md:items-center"
	>
		<div>
			<h1 class="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-gray-900">
				<User class="h-6 w-6 text-emerald-600" />
				{m.adx_by_title()}
			</h1>
			<p class="mt-1 text-sm text-gray-500">{m.adx_by_subtitle()}</p>
		</div>
	</div>

	<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
			<div class="text-xs font-medium text-gray-500">{m.adx_by_m_unique()}</div>
			<div class="mt-1 text-2xl font-bold text-gray-900">{analytics.totalUniqueBuyers}</div>
			<div class="mt-0.5 text-[11px] text-gray-400">{m.adx_by_m_unique_sub()}</div>
		</div>
		<div class="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-xs">
			<div class="text-xs font-medium text-emerald-700">{m.adx_by_m_repeat()}</div>
			<div class="mt-1 text-2xl font-bold text-emerald-900">{analytics.repeatBuyersCount}</div>
			<div class="mt-0.5 text-[11px] text-emerald-600">
				{m.adx_by_m_repeat_sub({ percent: analytics.repeatPurchaseRate })}
			</div>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
			<div class="text-xs font-medium text-gray-500">{m.adx_by_m_gross()}</div>
			<div class="mt-1 text-2xl font-bold text-gray-900">
				{formatRupiah(analytics.totalGrossSpend)}
			</div>
			<div class="mt-0.5 text-[11px] text-gray-400">
				{m.adx_by_m_avg({ amount: formatRupiah(analytics.averageSpendPerBuyer) })}
			</div>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
			<div class="text-xs font-medium text-gray-500">{m.adx_by_m_reviews()}</div>
			<div class="mt-1 text-2xl font-bold text-gray-900">{reviews.length}</div>
			<div class="mt-0.5 text-[11px] text-gray-400">{m.adx_by_m_rating()}</div>
		</div>
	</div>

	<div class="flex flex-col items-center justify-between gap-3 sm:flex-row">
		<div class="relative w-full sm:w-80">
			<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
			<input
				type="text"
				placeholder={m.adx_by_search_ph()}
				bind:value={searchQuery}
				class="w-full rounded-lg border border-gray-200 bg-white py-2 pr-4 pl-9 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
			/>
			{#if searchQuery}
				<button
					type="button"
					onclick={() => (searchQuery = '')}
					class="absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
				>
					{m.adx_by_clear()}
				</button>
			{/if}
		</div>

		<div
			class="flex w-full items-center gap-1 self-start overflow-x-auto rounded-lg bg-gray-100 p-1 sm:w-auto sm:self-auto"
		>
			<button
				type="button"
				onclick={() => (activeFilterTab = 'all')}
				class="rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all {activeFilterTab ===
				'all'
					? 'bg-white text-gray-900 shadow-xs'
					: 'text-gray-600 hover:text-gray-900'}"
			>
				{m.adx_by_tab_all({ count: buyers.length })}
			</button>
			<button
				type="button"
				onclick={() => (activeFilterTab = 'repeat')}
				class="rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all {activeFilterTab ===
				'repeat'
					? 'bg-white text-emerald-800 shadow-xs'
					: 'text-gray-600 hover:text-gray-900'}"
			>
				{m.adx_by_tab_repeat({ count: buyers.filter((b) => b.repeatBuyer).length })}
			</button>
			<button
				type="button"
				onclick={() => (activeFilterTab = 'active')}
				class="rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all {activeFilterTab ===
				'active'
					? 'bg-white text-gray-900 shadow-xs'
					: 'text-gray-600 hover:text-gray-900'}"
			>
				{m.adx_by_tab_active({ count: buyers.filter((b) => b.activeOrdersCount > 0).length })}
			</button>
			<button
				type="button"
				onclick={() => (activeFilterTab = 'dispute')}
				class="rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all {activeFilterTab ===
				'dispute'
					? 'bg-white text-rose-800 shadow-xs'
					: 'text-gray-600 hover:text-gray-900'}"
			>
				{m.adx_by_tab_dispute({ count: buyers.filter((b) => b.disputeCount > 0).length })}
			</button>
		</div>
	</div>

	<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead
					class="border-b border-gray-200 bg-gray-50 text-xs font-semibold tracking-wider text-gray-600 uppercase"
				>
					<tr>
						<th class="px-4 py-3">{m.adx_by_col_buyer()}</th>
						<th class="px-4 py-3 text-center">{m.adx_by_col_orders()}</th>
						<th class="px-4 py-3">{m.adx_by_col_spend()}</th>
						<th class="px-4 py-3">{m.adx_by_col_last()}</th>
						<th class="px-4 py-3">{m.adx_by_col_status()}</th>
						<th class="px-4 py-3 text-right">{m.adx_by_col_action()}</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#if filteredBuyers.length === 0}
						<tr>
							<td colspan="6" class="py-12 text-center text-gray-400">{m.adx_by_empty()}</td>
						</tr>
					{:else}
						{#each filteredBuyers as buyer (buyer.buyerKey)}
							<tr
								role="button"
								tabindex="0"
								onclick={() => {
									selectedBuyerKey = buyer.buyerKey;
									drawerTab = 'ringkasan';
								}}
								onkeydown={(e) => {
									if (e.key === 'Enter') {
										selectedBuyerKey = buyer.buyerKey;
										drawerTab = 'ringkasan';
									}
								}}
								class="group cursor-pointer transition-colors hover:bg-gray-50/70"
							>
								<td class="px-4 py-3.5">
									<div class="flex items-center gap-3">
										<div
											class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800"
										>
											{buyer.name.slice(0, 2).toUpperCase()}
										</div>
										<div>
											<div class="flex items-center gap-1.5 font-semibold text-gray-900">
												{buyer.name}
												{#if buyer.repeatBuyer}
													<span
														class="inline-flex items-center rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800"
													>
														{m.adx_by_repeat_badge()}
													</span>
												{/if}
											</div>
											<div class="font-mono text-xs text-gray-500">{buyer.email}</div>
										</div>
									</div>
								</td>
								<td class="px-4 py-3.5 text-center">
									<span class="font-bold text-gray-900">{buyer.paidOrdersCount}</span>
									<span class="ml-1 text-xs text-gray-400">
										{m.adx_by_completed({ count: buyer.completedOrdersCount })}
									</span>
								</td>
								<td class="px-4 py-3.5 font-bold text-gray-900">
									{formatRupiah(buyer.totalSpend)}
								</td>
								<td class="px-4 py-3.5 text-xs text-gray-600">
									<div>{formatDate(buyer.lastPurchaseAt)}</div>
									<div class="text-[11px] text-gray-400">
										{m.adx_by_first({ date: formatDate(buyer.firstPurchaseAt) })}
									</div>
								</td>
								<td class="px-4 py-3.5">
									<div class="flex flex-wrap items-center gap-1.5">
										{#if buyer.activeOrdersCount > 0}
											<span
												class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-800"
											>
												<Clock class="h-3 w-3" />
												{m.adx_by_active({ count: buyer.activeOrdersCount })}
											</span>
										{/if}
										{#if buyer.reviewCount > 0}
											<span
												class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800"
											>
												<Star class="h-3 w-3 fill-amber-500 text-amber-500" />
												{m.adx_by_reviews({ count: buyer.reviewCount })}
											</span>
										{/if}
										{#if buyer.disputeCount > 0}
											<span
												class="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-800"
											>
												<TriangleAlert class="h-3 w-3" />
												{m.adx_by_disputes({ count: buyer.disputeCount })}
											</span>
										{/if}
										{#if buyer.activeOrdersCount === 0 && buyer.reviewCount === 0 && buyer.disputeCount === 0}
											<span class="text-xs text-gray-400">{m.adx_by_normal()}</span>
										{/if}
									</div>
								</td>
								<td class="px-4 py-3.5 text-right">
									<button
										type="button"
										onclick={(e) => {
											e.stopPropagation();
											selectedBuyerKey = buyer.buyerKey;
											drawerTab = 'ringkasan';
										}}
										class="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 hover:text-emerald-800"
									>
										{m.adx_by_detail()}
									</button>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>

{#if selectedBuyer}
	<div
		class="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px]"
		role="dialog"
		aria-modal="true"
		aria-label={selectedBuyer.name}
	>
		<div class="flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl">
			<div class="flex items-center justify-between border-b border-gray-200 bg-gray-50 p-5">
				<div class="flex items-center gap-3">
					<div
						class="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white shadow-xs"
					>
						{selectedBuyer.name.slice(0, 2).toUpperCase()}
					</div>
					<div>
						<h2 class="flex items-center gap-2 text-lg font-bold text-gray-900">
							{selectedBuyer.name}
							{#if selectedBuyer.repeatBuyer}
								<span
									class="inline-flex items-center rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800"
								>
									{m.adx_by_repeat_full()}
								</span>
							{/if}
						</h2>
						<div class="mt-0.5 flex items-center gap-2 font-mono text-xs text-gray-500">
							<span>{selectedBuyer.email}</span>
							{#if selectedBuyer.phone}
								<span>•</span>
								<span>{selectedBuyer.phone}</span>
							{/if}
						</div>
					</div>
				</div>
				<button
					type="button"
					onclick={() => (selectedBuyerKey = null)}
					class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
					aria-label={m.adx_c_close()}
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<div
				class="flex items-center gap-4 border-b border-gray-200 bg-white px-5 text-xs font-semibold"
			>
				<button
					type="button"
					onclick={() => (drawerTab = 'ringkasan')}
					class="border-b-2 py-3 transition-colors {drawerTab === 'ringkasan'
						? 'border-emerald-600 text-emerald-800'
						: 'border-transparent text-gray-500 hover:text-gray-900'}"
				>
					{m.adx_by_tab_ringkasan()}
				</button>
				<button
					type="button"
					onclick={() => (drawerTab = 'pesanan')}
					class="flex items-center gap-1.5 border-b-2 py-3 transition-colors {drawerTab ===
					'pesanan'
						? 'border-emerald-600 text-emerald-800'
						: 'border-transparent text-gray-500 hover:text-gray-900'}"
				>
					{m.adx_by_tab_pesanan()}
					<span class="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-700">
						{selectedBuyer.orders.length}
					</span>
				</button>
				<button
					type="button"
					onclick={() => (drawerTab = 'review')}
					class="flex items-center gap-1.5 border-b-2 py-3 transition-colors {drawerTab === 'review'
						? 'border-emerald-600 text-emerald-800'
						: 'border-transparent text-gray-500 hover:text-gray-900'}"
				>
					{m.adx_by_tab_ulasan()}
					<span class="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-700">
						{selectedBuyer.reviews.length}
					</span>
				</button>
				<button
					type="button"
					onclick={() => (drawerTab = 'kasus')}
					class="flex items-center gap-1.5 border-b-2 py-3 transition-colors {drawerTab === 'kasus'
						? 'border-emerald-600 text-emerald-800'
						: 'border-transparent text-gray-500 hover:text-gray-900'}"
				>
					{m.adx_by_tab_kasus()}
					{#if selectedBuyer.disputes.length > 0}
						<span
							class="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-800"
						>
							{selectedBuyer.disputes.length}
						</span>
					{/if}
				</button>
				<button
					type="button"
					onclick={() => (drawerTab = 'timeline')}
					class="border-b-2 py-3 transition-colors {drawerTab === 'timeline'
						? 'border-emerald-600 text-emerald-800'
						: 'border-transparent text-gray-500 hover:text-gray-900'}"
				>
					{m.adx_by_tab_timeline()}
				</button>
			</div>

			<div class="flex-1 space-y-5 overflow-y-auto bg-gray-50/50 p-5">
				{#if drawerTab === 'ringkasan'}
					<div class="space-y-4">
						<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
							<div class="rounded-xl border border-gray-200 bg-white p-3.5">
								<div class="text-xs text-gray-500">{m.adx_by_s_spend()}</div>
								<div class="mt-0.5 text-lg font-bold text-gray-900">
									{formatRupiah(selectedBuyer.totalSpend)}
								</div>
							</div>
							<div class="rounded-xl border border-gray-200 bg-white p-3.5">
								<div class="text-xs text-gray-500">{m.adx_by_s_paid()}</div>
								<div class="mt-0.5 text-lg font-bold text-emerald-700">
									{m.adx_by_orders_count({ count: selectedBuyer.paidOrdersCount })}
								</div>
							</div>
							<div class="rounded-xl border border-gray-200 bg-white p-3.5">
								<div class="text-xs text-gray-500">{m.adx_by_s_completed()}</div>
								<div class="mt-0.5 text-lg font-bold text-gray-900">
									{m.adx_by_orders_count({ count: selectedBuyer.completedOrdersCount })}
								</div>
							</div>
						</div>
						<div class="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
							<h3 class="text-xs font-bold tracking-wider text-gray-900 uppercase">
								{m.adx_by_s_head()}
							</h3>
							<div class="space-y-2 divide-y divide-gray-100 text-xs text-gray-600">
								<div class="flex justify-between py-1.5">
									<span class="text-gray-400">{m.adx_by_s_email()}</span>
									<span class="font-mono font-medium text-gray-900">{selectedBuyer.email}</span>
								</div>
								<div class="flex justify-between py-1.5">
									<span class="text-gray-400">{m.adx_by_s_phone()}</span>
									<span class="font-mono font-medium text-gray-900">
										{selectedBuyer.phone || '-'}
									</span>
								</div>
								<div class="flex justify-between py-1.5">
									<span class="text-gray-400">{m.adx_by_s_first()}</span>
									<span class="font-medium text-gray-900">
										{formatDateTime(selectedBuyer.firstPurchaseAt)}
									</span>
								</div>
								<div class="flex justify-between py-1.5">
									<span class="text-gray-400">{m.adx_by_s_last()}</span>
									<span class="font-medium text-gray-900">
										{formatDateTime(selectedBuyer.lastPurchaseAt)}
									</span>
								</div>
							</div>
						</div>
					</div>
				{:else if drawerTab === 'pesanan'}
					<div class="space-y-3">
						{#each selectedBuyer.orders as order (order.id)}
							<div class="space-y-2.5 rounded-xl border border-gray-200 bg-white p-4">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<span class="font-mono text-xs font-bold text-gray-900">
											#{order.orderNumber}
										</span>
										<span
											class="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700 uppercase"
										>
											{order.productType}
										</span>
									</div>
									<span class="text-xs font-bold text-emerald-800">
										{formatRupiah(order.amount)}
									</span>
								</div>
								<div class="text-sm font-semibold text-gray-900">{order.productTitle}</div>
								<div
									class="flex items-center justify-between border-t border-gray-100 pt-2 text-xs text-gray-500"
								>
									<span>{formatDateTime(order.createdAt)}</span>
									<div class="flex items-center gap-2">
										<span class="font-medium text-gray-700 capitalize">
											{order.fulfillmentStatus.replace('_', ' ')}
										</span>
										<button
											type="button"
											onclick={() => {
												selectedBuyerKey = null;
												goto('/admin/orders');
											}}
											class="font-semibold text-emerald-700 hover:text-emerald-800"
										>
											{m.adx_by_open_order()}
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else if drawerTab === 'review'}
					<div class="space-y-3">
						{#if selectedBuyer.reviews.length === 0}
							<div
								class="rounded-xl border border-gray-200 bg-white p-8 text-center text-xs text-gray-400"
							>
								{m.adx_by_no_reviews()}
							</div>
						{:else}
							{#each selectedBuyer.reviews as rev (rev.id)}
								<div class="space-y-2 rounded-xl border border-gray-200 bg-white p-4">
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-1">
											{#each [1, 2, 3, 4, 5] as s (s)}
												<Star
													class="h-3.5 w-3.5 {s <= rev.rating
														? 'fill-amber-400 text-amber-400'
														: 'text-gray-200'}"
												/>
											{/each}
											<span class="ml-1 text-xs font-bold text-gray-900">{rev.rating}.0</span>
										</div>
										<span class="text-xs text-gray-400">{formatDate(rev.createdAt)}</span>
									</div>
									<p class="text-xs text-gray-700 italic">"{rev.comment}"</p>
								</div>
							{/each}
						{/if}
					</div>
				{:else if drawerTab === 'kasus'}
					<div class="space-y-3">
						{#if selectedBuyer.disputes.length === 0}
							<div
								class="rounded-xl border border-gray-200 bg-white p-8 text-center text-xs text-gray-400"
							>
								{m.adx_by_no_disputes()}
							</div>
						{:else}
							{#each selectedBuyer.disputes as d (d.id)}
								<div class="space-y-2 rounded-xl border border-rose-200 bg-white p-4">
									<div class="flex items-center justify-between">
										<span class="font-mono text-xs font-bold text-rose-800">
											{m.adx_by_dispute_id({ id: d.id })}
										</span>
										<span
											class="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 uppercase"
										>
											{d.status}
										</span>
									</div>
									<div class="text-xs font-medium text-gray-700">{d.reason}</div>
									<div
										class="flex items-center justify-between border-t border-gray-100 pt-2 text-xs text-gray-500"
									>
										<span>{formatDateTime(d.createdAt)}</span>
										<button
											type="button"
											onclick={() => {
												selectedBuyerKey = null;
												goto('/admin/cases');
											}}
											class="font-semibold text-rose-700 hover:text-rose-800"
										>
											{m.adx_by_open_case()}
										</button>
									</div>
								</div>
							{/each}
						{/if}
					</div>
				{:else if drawerTab === 'timeline'}
					<div class="space-y-3">
						{#if selectedBuyerEvents.length === 0}
							<div
								class="rounded-xl border border-gray-200 bg-white p-8 text-center text-xs text-gray-400"
							>
								{m.adx_by_no_events()}
							</div>
						{:else}
							<div class="relative space-y-4 border-l-2 border-emerald-200 pl-4">
								{#each selectedBuyerEvents as evt (evt.id)}
									<div class="relative">
										<div
											class="absolute top-1 -left-[21px] h-2.5 w-2.5 rounded-full bg-emerald-600 ring-4 ring-white"
										></div>
										<div class="space-y-1 rounded-lg border border-gray-200 bg-white p-3 text-xs">
											<div class="flex items-center justify-between">
												<span class="font-mono font-semibold text-gray-900">{evt.type}</span>
												<span class="text-[11px] text-gray-400">
													{formatDateTime(evt.occurredAt)}
												</span>
											</div>
											{#if evt.metadata}
												<div class="rounded bg-gray-50 p-1.5 font-mono text-[11px] text-gray-500">
													{JSON.stringify(evt.metadata)}
												</div>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
