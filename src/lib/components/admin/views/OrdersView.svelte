<script lang="ts">
	import { onMount } from 'svelte';
	import { admin } from '$lib/stores/admin.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { formatRupiah } from '$lib/data/mockData';
	import { isOrderActive, isOrderCompleted, needsSellerAction } from '$lib/domain/orderLifecycle';
	import type { Order } from '$lib/types';
	import FileText from 'lucide-svelte/icons/file-text';
	import Video from 'lucide-svelte/icons/video';
	import Wrench from 'lucide-svelte/icons/wrench';
	import Search from 'lucide-svelte/icons/search';
	import CircleAlert from 'lucide-svelte/icons/circle-alert';
	import Copy from 'lucide-svelte/icons/copy';
	import X from 'lucide-svelte/icons/x';
	import {
		DataTable,
		type DataTableColumn,
		type DataTableCellContext
	} from '$lib/components/ui/data-table';

	type TypeTab = 'all' | 'digital' | 'session' | 'service';
	type FulfillmentFilter = 'all' | 'action_required' | 'active' | 'completed' | 'cancelled';

	let activeTypeTab = $state<TypeTab>('all');
	let activeFulfillmentFilter = $state<FulfillmentFilter>('all');
	let searchQuery = $state('');
	let peekOrder = $state<Order | null>(null);
	let copiedLink = $state(false);

	const PAGE_SIZE = 10;
	let sortBy = $state<string | undefined>(undefined);
	let sortDir = $state<'asc' | 'desc' | undefined>(undefined);
	let searchTimer: ReturnType<typeof setTimeout> | undefined;

	onMount(() => {
		void admin.syncAdminSellers();
		void admin.syncAdminCases();
		reload(1);
	});

	const orders = $derived(admin.platformOrders);
	const disputes = $derived(admin.platformDisputes);

	const serverPage = $derived(admin.ordersPage);
	const usingServer = $derived(serverPage?.server ?? false);

	/** `state` yang dikirim ke BE untuk tab kelompok aktif. */
	function apiStateFilter(): string | undefined {
		if (activeFulfillmentFilter === 'all' || activeFulfillmentFilter === 'cancelled')
			return undefined;
		return activeFulfillmentFilter;
	}

	/** `cancelled` tak punya `state`; dipetakan ke filter pemenuhan yang sudah didukung BE. */
	function apiFulfillmentFilter(): string | undefined {
		return activeFulfillmentFilter === 'cancelled' ? 'dibatalkan' : undefined;
	}

	/** Muat satu halaman pesanan dari BE; `fallback` dipakai saat offline. */
	function reload(targetPage = 1) {
		void admin.loadOrdersPage(
			{
				page: targetPage,
				limit: PAGE_SIZE,
				q: searchQuery.trim() || undefined,
				state: apiStateFilter(),
				type: activeTypeTab === 'all' ? undefined : activeTypeTab,
				fulfillmentStatus: apiFulfillmentFilter(),
				sortBy,
				sortDir
			},
			fallbackOrders
		);
	}

	function onSearchInput() {
		if (searchTimer) clearTimeout(searchTimer);
		searchTimer = setTimeout(() => reload(1), 300);
	}

	function onSortChange(nextSortBy: string, nextSortDir: 'asc' | 'desc') {
		sortBy = nextSortBy;
		sortDir = nextSortDir;
		reload(1);
	}

	function goToPage(target: number) {
		reload(target);
	}

	function setTypeTab(tab: TypeTab) {
		activeTypeTab = tab;
		reload(1);
	}

	function setFulfillmentFilter(filter: FulfillmentFilter) {
		activeFulfillmentFilter = filter;
		reload(1);
	}

	function findSeller(sellerId?: string) {
		if (!sellerId) return undefined;
		return admin.platformSellers.find(
			(s) => s.id === sellerId || s.username === sellerId || `seller_${s.username}` === sellerId
		);
	}

	const typeCounts = $derived.by(() => {
		const local = {
			all: orders.length,
			digital: orders.filter((o) => o.productType === 'digital').length,
			session: orders.filter((o) => o.productType === 'session').length,
			service: orders.filter((o) => o.productType === 'service').length
		};
		if (!usingServer || !admin.orderCounts) return local;
		return {
			all: admin.orderCounts.all,
			digital: admin.orderCounts.digital,
			session: admin.orderCounts.session,
			service: admin.orderCounts.service
		};
	});

	function isOrderActionRequired(order: Order): boolean {
		const hasDispute = disputes.some((d) => d.orderId === order.id && d.status !== 'resolved');
		if (hasDispute) return true;
		const pType = order.productType;
		const fStatus = order.fulfillmentStatus;
		if (
			fStatus === 'sedang_dikerjakan' &&
			pType === 'session' &&
			!order.meetingLink &&
			!order.scheduledAt &&
			!order.sessionStart
		) {
			return true;
		}
		if (fStatus === 'sedang_dikerjakan' && pType === 'service' && !order.serviceDelivery) {
			return true;
		}
		return false;
	}

	/** Saringan fallback offline saja; mode server sudah difilter BE via `state`/`type`. */
	function orderMatchesClientFilters(order: Order): boolean {
		if (activeTypeTab !== 'all' && order.productType !== activeTypeTab) return false;
		if (activeFulfillmentFilter === 'action_required') {
			if (!needsSellerAction(order)) return false;
		} else if (activeFulfillmentFilter === 'active') {
			if (!isOrderActive(order)) return false;
		} else if (activeFulfillmentFilter === 'completed') {
			if (!isOrderCompleted(order)) return false;
		} else if (activeFulfillmentFilter === 'cancelled') {
			if (order.fulfillmentStatus !== 'dibatalkan') return false;
		}
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			const sellerName = (findSeller(order.sellerId)?.name || '').toLowerCase();
			return (
				(order.buyerName || '').toLowerCase().includes(q) ||
				(order.buyerEmail || '').toLowerCase().includes(q) ||
				order.id.toLowerCase().includes(q) ||
				(order.productTitle || '').toLowerCase().includes(q) ||
				sellerName.includes(q)
			);
		}
		return true;
	}

	const fallbackOrders = $derived(orders.filter((order) => orderMatchesClientFilters(order)));

	// Mode server: baris dari halaman BE apa adanya; offline: hasil saringan lokal.
	const loading = $derived(!serverPage);
	const viewItems = $derived(
		serverPage ? (serverPage.server ? (serverPage.items ?? []) : fallbackOrders) : []
	);
	const viewTotal = $derived(
		serverPage ? (serverPage.server ? (serverPage.total ?? 0) : fallbackOrders.length) : 0
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

	async function copyTrackingLink(orderId: string) {
		try {
			await navigator.clipboard.writeText(`${window.location.origin}/orders/${orderId}/status`);
			copiedLink = true;
			setTimeout(() => (copiedLink = false), 2000);
		} catch {}
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && peekOrder) peekOrder = null;
	}

	const peekSeller = $derived.by(() => {
		const o = peekOrder;
		return o ? findSeller(o.sellerId) : undefined;
	});
	const peekDisputes = $derived.by(() => {
		const o = peekOrder;
		return o ? admin.platformDisputes.filter((d) => d.orderId === o.id) : [];
	});

	const columns: DataTableColumn<Order>[] = [
		{
			id: 'order',
			header: m.adx_or_col_order(),
			enableSorting: true,
			meta: { sortKey: 'createdAt' }
		},
		{ id: 'buyer', header: m.adx_or_col_buyer() },
		{ id: 'product', header: m.adx_or_col_product() },
		{ id: 'state', header: m.adx_or_col_state() },
		{
			id: 'amount',
			header: m.adx_or_col_amount(),
			enableSorting: true,
			meta: { align: 'right', sortKey: 'amount' }
		}
	];
</script>

<svelte:window onkeydown={onKeydown} />

{#snippet orderCell(ctx: DataTableCellContext<Order>)}
	{@const order = ctx.row.original}
	{@const hasDispute = disputes.some((d) => d.orderId === order.id && d.status !== 'resolved')}
	<div class="flex items-center gap-1.5 font-mono font-bold text-gray-900">
		#{order.id.slice(0, 8)}
		{#if hasDispute}
			<CircleAlert class="h-3.5 w-3.5 shrink-0 text-rose-600" />
		{/if}
	</div>
	<div class="text-[10px] text-gray-400">{formatDate(order.createdAt)}</div>
{/snippet}

{#snippet buyerCell(ctx: DataTableCellContext<Order>)}
	{@const order = ctx.row.original}
	<div class="truncate font-semibold text-gray-900">
		{order.buyerName || m.adx_or_buyer_default()}
	</div>
	<div class="truncate font-mono text-[11px] text-gray-500">{order.buyerEmail || '-'}</div>
{/snippet}

{#snippet productCell(ctx: DataTableCellContext<Order>)}
	{@const order = ctx.row.original}
	{@const seller = findSeller(order.sellerId)}
	<div class="truncate font-semibold text-gray-900" title={order.productTitle}>
		{order.productTitle}
	</div>
	<div class="truncate text-[11px] text-gray-500">
		{m.adx_or_by({ name: seller?.name || order.sellerId || '-' })}
	</div>
{/snippet}

{#snippet stateCell(ctx: DataTableCellContext<Order>)}
	{@const order = ctx.row.original}
	{@const needsAttention = isOrderActionRequired(order)}
	<span
		class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize {order.fulfillmentStatus ===
			'selesai' || order.fulfillmentStatus === 'akses_diberikan'
			? 'bg-emerald-100 text-emerald-800'
			: order.fulfillmentStatus === 'dibatalkan'
				? 'bg-gray-100 text-gray-600'
				: needsAttention
					? 'bg-rose-100 text-rose-800'
					: 'bg-amber-100 text-amber-800'}"
	>
		{order.fulfillmentStatus}
	</span>
	<div class="mt-0.5 text-[10px] text-gray-400 capitalize">
		{order.paymentStatus === 'lunas' ? m.adx_or_paid() : order.paymentStatus || m.adx_or_unpaid()}
	</div>
{/snippet}

{#snippet amountCell(ctx: DataTableCellContext<Order>)}
	<div class="font-mono font-bold text-gray-900">{formatRupiah(ctx.row.original.amount)}</div>
	<div class="text-[10px] text-emerald-700 opacity-0 transition-opacity group-hover:opacity-100">
		{m.adx_c_peek()}
	</div>
{/snippet}

<div class="mx-auto max-w-7xl space-y-6 pb-16">
	<div
		class="flex flex-col justify-between gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center"
	>
		<div>
			<h1 class="text-xl font-bold tracking-tight text-gray-900">{m.adx_or_title()}</h1>
			<p class="mt-0.5 text-xs text-gray-500">{m.adx_or_subtitle()}</p>
		</div>

		<div class="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1 text-xs">
			<button
				type="button"
				onclick={() => setTypeTab('all')}
				class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all {activeTypeTab === 'all'
					? 'bg-white text-gray-900 shadow-xs'
					: 'text-gray-500 hover:text-gray-900'}"
			>
				{m.adx_or_tab_all({ count: typeCounts.all })}
			</button>
			<button
				type="button"
				onclick={() => setTypeTab('digital')}
				class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all {activeTypeTab ===
				'digital'
					? 'bg-white text-emerald-700 shadow-xs'
					: 'text-gray-500 hover:text-gray-900'}"
			>
				<FileText class="h-3.5 w-3.5" />
				{m.adx_or_tab_digital({ count: typeCounts.digital })}
			</button>
			<button
				type="button"
				onclick={() => setTypeTab('session')}
				class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all {activeTypeTab ===
				'session'
					? 'bg-white text-blue-700 shadow-xs'
					: 'text-gray-500 hover:text-gray-900'}"
			>
				<Video class="h-3.5 w-3.5" />
				{m.adx_or_tab_session({ count: typeCounts.session })}
			</button>
			<button
				type="button"
				onclick={() => setTypeTab('service')}
				class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all {activeTypeTab ===
				'service'
					? 'bg-white text-purple-700 shadow-xs'
					: 'text-gray-500 hover:text-gray-900'}"
			>
				<Wrench class="h-3.5 w-3.5" />
				{m.adx_or_tab_service({ count: typeCounts.service })}
			</button>
		</div>
	</div>

	<div class="flex flex-col items-center justify-between gap-3 sm:flex-row">
		<div class="flex w-full items-center gap-1.5 overflow-x-auto sm:w-auto">
			{#each [['all', m.adx_or_f_all()], ['action_required', m.adx_or_f_action()], ['active', m.adx_or_f_active()], ['completed', m.adx_or_f_completed()], ['cancelled', m.adx_or_f_cancelled()]] as [key, label] (key)}
				<button
					type="button"
					onclick={() => setFulfillmentFilter(key as FulfillmentFilter)}
					class="rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors {activeFulfillmentFilter ===
					key
						? 'bg-emerald-700 font-semibold text-white'
						: 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}"
				>
					{label}
				</button>
			{/each}
		</div>

		<div class="relative w-full sm:w-72">
			<Search class="absolute top-1/2 left-3.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
			<input
				type="text"
				bind:value={searchQuery}
				oninput={onSearchInput}
				placeholder={m.adx_or_search_ph()}
				class="w-full rounded-xl border border-gray-200 bg-white py-2 pr-3 pl-9 text-xs text-gray-900 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
			/>
		</div>
	</div>

	<div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
		<DataTable
			data={viewItems}
			{columns}
			{loading}
			paginationMode={usingServer ? 'server' : 'client'}
			page={usingServer ? (serverPage?.page ?? 1) : undefined}
			total={usingServer ? viewTotal : undefined}
			onPageChange={goToPage}
			{onSortChange}
			sortBy={usingServer ? sortBy : undefined}
			sortDir={usingServer ? sortDir : undefined}
			onRowClick={(order) => (peekOrder = order)}
			rowClass={() => 'group'}
			emptyMessage={m.adx_or_empty()}
			cellSnippets={{
				order: orderCell,
				buyer: buyerCell,
				product: productCell,
				state: stateCell,
				amount: amountCell
			}}
		/>
	</div>
</div>

{#if peekOrder}
	<div
		class="fixed inset-0 z-50 overflow-hidden"
		role="dialog"
		aria-modal="true"
		aria-label={m.adx_or_drawer_title({ id: peekOrder.id.slice(0, 8) })}
	>
		<div
			class="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px]"
			aria-hidden="true"
			onclick={() => (peekOrder = null)}
		></div>
		<div class="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
			<div
				class="flex w-screen flex-col justify-between border-l border-gray-200 bg-white shadow-2xl sm:max-w-[620px]"
			>
				<div
					class="flex shrink-0 items-start justify-between border-b border-gray-100 bg-gray-50/70 px-6 py-4"
				>
					<div class="min-w-0 pr-4">
						<div class="flex flex-wrap items-center gap-2">
							<h3 class="truncate text-base font-bold text-gray-900">
								{m.adx_or_drawer_title({ id: peekOrder.id.slice(0, 8) })}
							</h3>
							<span
								class="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize {peekOrder.fulfillmentStatus ===
								'selesai'
									? 'bg-emerald-100 text-emerald-800'
									: 'bg-amber-100 text-amber-800'}"
							>
								{peekOrder.fulfillmentStatus}
							</span>
						</div>
						<div class="mt-0.5 truncate text-xs text-gray-500">
							{m.adx_or_created_at({ time: formatDateTime(peekOrder.createdAt) })}
						</div>
					</div>
					<button
						type="button"
						onclick={() => (peekOrder = null)}
						class="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200/60 hover:text-gray-700"
						aria-label={m.adx_c_close()}
					>
						<X class="h-5 w-5" />
					</button>
				</div>

				<div class="flex-1 space-y-5 overflow-y-auto p-6 text-xs">
					<div class="grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
						<div>
							<span class="block text-[11px] text-gray-500">{m.adx_or_buyer_lbl()}</span>
							<span class="mt-0.5 block font-bold text-gray-900">
								{peekOrder.buyerName || m.adx_or_buyer_default()}
							</span>
							<span class="block font-mono text-[11px] text-gray-500">
								{peekOrder.buyerEmail || '-'}
							</span>
							<span class="block text-[11px] text-gray-500">{peekOrder.buyerPhone || '-'}</span>
						</div>
						<div>
							<span class="block text-[11px] text-gray-500">{m.adx_or_seller_lbl()}</span>
							<span class="mt-0.5 block font-bold text-gray-900">
								{peekSeller?.name || peekOrder.sellerId}
							</span>
							<span class="block font-mono text-[11px] text-gray-500">
								@{peekSeller?.username || '-'}
							</span>
							<span class="block text-[11px] text-gray-500">{peekSeller?.email || '-'}</span>
						</div>
					</div>

					<div class="space-y-2.5 rounded-xl border border-gray-200 bg-white p-4">
						<h4 class="text-xs font-bold tracking-wider text-gray-500 uppercase">
							{m.adx_or_pay_head()}
						</h4>
						<div class="flex items-center justify-between border-b border-gray-100 py-1">
							<span class="text-gray-600">{m.adx_or_prod_lbl()}</span>
							<span class="max-w-xs truncate font-semibold text-gray-900">
								{peekOrder.productTitle}
							</span>
						</div>
						<div class="flex items-center justify-between border-b border-gray-100 py-1">
							<span class="text-gray-600">{m.adx_or_type_lbl()}</span>
							<span class="font-medium text-gray-900 capitalize">{peekOrder.productType}</span>
						</div>
						<div class="flex items-center justify-between border-b border-gray-100 py-1">
							<span class="text-gray-600">{m.adx_or_total_lbl()}</span>
							<span class="font-mono text-sm font-bold text-gray-900">
								{formatRupiah(peekOrder.amount)}
							</span>
						</div>
						<div class="flex items-center justify-between py-1">
							<span class="text-gray-600">{m.adx_or_paystatus_lbl()}</span>
							<span class="font-semibold text-emerald-700 capitalize">
								{peekOrder.paymentStatus || 'lunas'}
							</span>
						</div>
					</div>

					<div class="space-y-2.5 rounded-xl border border-gray-200 bg-white p-4">
						<h4 class="text-xs font-bold tracking-wider text-gray-500 uppercase">
							{m.adx_or_fulfill_head({ type: peekOrder.productType })}
						</h4>
						{#if peekOrder.productType === 'digital'}
							<div class="space-y-1.5">
								<div class="flex items-center justify-between">
									<span class="text-gray-600">{m.adx_or_dl_status()}</span>
									<span class="font-medium text-emerald-700">{m.adx_or_dl_ready()}</span>
								</div>
								<div class="text-[11px] text-gray-500">{m.adx_or_dl_note()}</div>
							</div>
						{:else if peekOrder.productType === 'session'}
							<div class="space-y-1.5">
								<div class="flex items-center justify-between">
									<span class="text-gray-600">{m.adx_or_session_sched()}</span>
									<span class="font-medium text-gray-900">
										{peekOrder.scheduledAt || peekOrder.scheduledDate
											? formatDateTime(peekOrder.scheduledAt || peekOrder.scheduledDate || '')
											: peekOrder.bookingDateFormatted || m.adx_or_not_sched()}
									</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-gray-600">Google Meet</span>
									<span class="font-mono text-blue-700">
										{peekOrder.meetingLink || m.adx_or_not_avail()}
									</span>
								</div>
							</div>
						{:else if peekOrder.productType === 'service'}
							<div class="space-y-1.5">
								<div class="flex items-center justify-between">
									<span class="text-gray-600">{m.adx_or_service_stage()}</span>
									<span class="font-semibold text-gray-900 capitalize">
										{peekOrder.fulfillmentStatus}
									</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-gray-600">{m.adx_or_deadline()}</span>
									<span class="font-medium text-gray-900">
										{peekOrder.serviceDueAt
											? formatDate(peekOrder.serviceDueAt)
											: peekOrder.deliveryNotes || m.adx_or_deadline_none()}
									</span>
								</div>
							</div>
						{/if}
					</div>

					{#if peekDisputes.length > 0}
						<div class="space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-4">
							<h4 class="flex items-center gap-1.5 text-xs font-bold text-rose-800">
								<CircleAlert class="h-4 w-4 text-rose-600" />
								{m.adx_or_dispute_head()}
							</h4>
							{#each peekDisputes as d (d.id)}
								<div class="text-xs text-rose-700">
									<div>{m.adx_or_reason()} <strong>{d.reason}</strong></div>
									<div>{m.adx_or_status_lbl()} <strong>{d.status}</strong></div>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<div
					class="flex shrink-0 items-center justify-between border-t border-gray-100 bg-gray-50/80 px-6 py-3.5"
				>
					<button
						type="button"
						onclick={() => copyTrackingLink(peekOrder?.id ?? '')}
						class="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
					>
						<Copy class="h-3.5 w-3.5" />
						{copiedLink ? m.adx_or_copied() : m.adx_or_copy_link()}
					</button>
					<button
						type="button"
						onclick={() => (peekOrder = null)}
						class="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
					>
						{m.adx_c_close()}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
