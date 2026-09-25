<script lang="ts">
	import { onMount } from 'svelte';
	import { admin } from '$lib/stores/admin.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { formatRupiah } from '$lib/data/mockData';
	import type { LedgerEntry, LedgerEntryType } from '$lib/types/admin';
	import Search from 'lucide-svelte/icons/search';
	import X from 'lucide-svelte/icons/x';
	import {
		DataTable,
		type DataTableColumn,
		type DataTableCellContext
	} from '$lib/components/ui/data-table';

	type TxFilter = 'all' | 'sale' | 'payout' | 'refund' | 'adjustment';

	let searchQuery = $state('');
	let filterType = $state<TxFilter>('all');
	let peekEntry = $state<LedgerEntry | null>(null);

	const PAGE_SIZE = 10;
	let sortBy = $state<string | undefined>(undefined);
	let sortDir = $state<'asc' | 'desc' | undefined>(undefined);
	let searchTimer: ReturnType<typeof setTimeout> | undefined;

	onMount(() => {
		void admin.syncAdminSellers();
		reload(1);
	});

	// Tabel transaksi memakai endpoint buku besar `/admin/transactions`.
	const serverPage = $derived(admin.transactionsPage);
	const usingServer = $derived(serverPage?.server ?? false);

	/** Muat satu halaman dari BE; `fallback` dipakai saat offline. */
	function reload(targetPage = 1) {
		void admin.loadTransactionsPage(
			{
				page: targetPage,
				limit: PAGE_SIZE,
				q: searchQuery.trim() || undefined,
				type: filterType === 'all' ? undefined : filterType,
				sortBy,
				sortDir
			},
			fallbackEntries
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

	function setFilterType(next: TxFilter) {
		filterType = next;
		reload(1);
	}

	function matchesSearch(entry: LedgerEntry): boolean {
		if (!searchQuery.trim()) return true;
		const q = searchQuery.toLowerCase();
		return (
			entry.id.toLowerCase().includes(q) ||
			(entry.orderId || '').toLowerCase().includes(q) ||
			(entry.sellerId || '').toLowerCase().includes(q) ||
			(entry.description || '').toLowerCase().includes(q)
		);
	}

	/** Fallback offline: seluruh buku besar lokal, disaring tipe + pencarian. */
	const fallbackEntries = $derived(
		admin.platformLedger.filter(
			(e) => (filterType === 'all' || e.type === filterType) && matchesSearch(e)
		)
	);

	const loading = $derived(!serverPage);
	const viewItems = $derived(
		serverPage ? (serverPage.server ? (serverPage.items ?? []) : fallbackEntries) : []
	);
	const viewTotal = $derived(
		serverPage ? (serverPage.server ? (serverPage.total ?? 0) : fallbackEntries.length) : 0
	);

	function findSeller(sellerId?: string) {
		if (!sellerId) return undefined;
		return admin.platformSellers.find(
			(s) => s.id === sellerId || s.username === sellerId || `seller_${s.username}` === sellerId
		);
	}

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
		if (e.key === 'Escape' && peekEntry) peekEntry = null;
	}

	function typeLabel(type: LedgerEntryType): string {
		switch (type) {
			case 'sale':
				return m.ady_fin_type_sale();
			case 'payout':
				return m.ady_fin_type_payout();
			case 'refund':
				return m.ady_fin_type_refund();
			case 'platform_fee':
				return m.ady_fin_type_platform_fee();
			case 'payment_fee':
				return m.ady_fin_type_payment_fee();
			case 'adjustment':
				return m.ady_fin_type_adjustment();
			default:
				return type;
		}
	}

	function typeBadgeClass(type: LedgerEntryType): string {
		switch (type) {
			case 'sale':
				return 'bg-emerald-100 text-emerald-800';
			case 'payout':
				return 'bg-blue-100 text-blue-800';
			case 'refund':
				return 'bg-rose-100 text-rose-800';
			case 'platform_fee':
				return 'bg-teal-100 text-teal-800';
			case 'payment_fee':
				return 'bg-slate-100 text-slate-700';
			case 'adjustment':
				return 'bg-amber-100 text-amber-800';
			default:
				return 'bg-slate-100 text-slate-700';
		}
	}

	const tabs = $derived<{ key: TxFilter; label: string }[]>([
		{ key: 'all', label: m.ady_fin_tab_all() },
		{ key: 'sale', label: m.ady_fin_tab_sale() },
		{ key: 'payout', label: m.ady_fin_tab_payout() },
		{ key: 'refund', label: m.ady_fin_tab_refund() },
		{ key: 'adjustment', label: m.ady_fin_tab_adjustment() }
	]);

	const peekSeller = $derived(peekEntry ? findSeller(peekEntry.sellerId) : undefined);

	const columns: DataTableColumn<LedgerEntry>[] = [
		{ id: 'tx', header: m.adx_tx_col_tx(), enableSorting: true, meta: { sortKey: 'occurredAt' } },
		{ id: 'order', header: m.adx_tx_col_order() },
		{ id: 'seller', header: m.adx_tx_seller_id() },
		{
			id: 'amount',
			header: m.adx_tx_col_amount(),
			enableSorting: true,
			meta: { align: 'right', sortKey: 'amount' }
		},
		{ id: 'type', header: m.ady_fin_th_type(), meta: { align: 'right' } }
	];
</script>

<svelte:window onkeydown={onKeydown} />

{#snippet txCell(ctx: DataTableCellContext<LedgerEntry>)}
	{@const entry = ctx.row.original}
	<div class="truncate font-mono font-bold text-gray-900">{entry.id.slice(0, 12)}</div>
	<div class="text-[10px] text-gray-400">{formatDate(entry.createdAt)}</div>
{/snippet}

{#snippet orderCell(ctx: DataTableCellContext<LedgerEntry>)}
	{@const entry = ctx.row.original}
	<div class="font-mono font-semibold text-gray-900">
		{entry.orderId ? `#${entry.orderId.slice(0, 8)}` : '-'}
	</div>
	<div class="max-w-xs truncate text-[11px] text-gray-500">{entry.description || '-'}</div>
{/snippet}

{#snippet sellerCell(ctx: DataTableCellContext<LedgerEntry>)}
	{@const entry = ctx.row.original}
	{@const seller = findSeller(entry.sellerId)}
	<div class="truncate font-semibold text-gray-900">{seller?.name || entry.sellerId || '-'}</div>
	<div class="truncate font-mono text-[10px] text-gray-400">
		{seller ? `@${seller.username}` : entry.sellerId || '-'}
	</div>
{/snippet}

{#snippet amountCell(ctx: DataTableCellContext<LedgerEntry>)}
	{@const entry = ctx.row.original}
	<div class="font-mono font-bold text-gray-900">{formatRupiah(entry.amount)}</div>
	<div class="text-[10px] text-emerald-700">
		{m.adx_tx_net({ amount: formatRupiah(entry.sellerNet ?? entry.amount) })}
	</div>
{/snippet}

{#snippet typeCell(ctx: DataTableCellContext<LedgerEntry>)}
	{@const entry = ctx.row.original}
	<span
		class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize {typeBadgeClass(
			entry.type
		)}"
	>
		{typeLabel(entry.type)}
	</span>
	<div
		class="text-[10px] font-medium text-emerald-700 opacity-0 transition-opacity group-hover:opacity-100"
	>
		{m.adx_c_peek()}
	</div>
{/snippet}

<div class="mx-auto max-w-7xl space-y-6 pb-16">
	<div
		class="flex flex-col justify-between gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center"
	>
		<div>
			<h1 class="text-xl font-bold tracking-tight text-gray-900">{m.adx_tx_title()}</h1>
			<p class="mt-0.5 text-xs text-gray-500">{m.adx_tx_subtitle()}</p>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<div
				class="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1 text-xs"
			>
				{#each tabs as tab (tab.key)}
					<button
						type="button"
						onclick={() => setFilterType(tab.key)}
						class="rounded-lg px-3 py-1.5 font-medium transition-all {filterType === tab.key
							? 'bg-white font-semibold text-gray-900 shadow-xs'
							: 'text-gray-500 hover:text-gray-900'}"
					>
						{tab.label}
					</button>
				{/each}
			</div>

			<div class="relative w-full sm:w-64">
				<Search class="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
				<input
					type="text"
					bind:value={searchQuery}
					oninput={onSearchInput}
					placeholder={m.adx_tx_search_ph()}
					class="w-full rounded-xl border border-gray-200 bg-white py-2 pr-3 pl-8 text-xs text-gray-900 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
				/>
			</div>
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
			onRowClick={(entry) => (peekEntry = entry)}
			rowClass={() => 'group'}
			emptyMessage={m.adx_tx_empty()}
			cellSnippets={{
				tx: txCell,
				order: orderCell,
				seller: sellerCell,
				amount: amountCell,
				type: typeCell
			}}
		/>
	</div>
</div>

{#if peekEntry}
	<div
		class="fixed inset-0 z-50 overflow-hidden"
		role="dialog"
		aria-modal="true"
		aria-label={m.adx_tx_drawer_title({ txId: peekEntry.id.slice(0, 12) })}
	>
		<div
			class="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px]"
			aria-hidden="true"
			onclick={() => (peekEntry = null)}
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
								{m.adx_tx_drawer_title({ txId: peekEntry.id.slice(0, 12) })}
							</h3>
							<span
								class="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize {typeBadgeClass(
									peekEntry.type
								)}"
							>
								{typeLabel(peekEntry.type)}
							</span>
						</div>
						<div class="mt-0.5 truncate text-xs text-gray-500">
							{formatDateTime(peekEntry.createdAt)}
						</div>
					</div>
					<button
						type="button"
						onclick={() => (peekEntry = null)}
						class="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200/60 hover:text-gray-700"
						aria-label={m.adx_c_close()}
					>
						<X class="h-5 w-5" />
					</button>
				</div>

				<div class="flex-1 space-y-6 overflow-y-auto p-6 text-xs">
					<div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
						<span class="block text-[11px] text-gray-500">{m.adx_tx_gross()}</span>
						<span class="mt-0.5 block font-mono text-2xl font-bold text-gray-900">
							{formatRupiah(peekEntry.amount)}
						</span>
						<span class="mt-1 block text-[11px] text-gray-500">
							{m.ady_fin_th_type()}
							<strong class="text-gray-700 capitalize">{typeLabel(peekEntry.type)}</strong>
						</span>
					</div>

					<div class="space-y-2.5 rounded-xl border border-gray-200 bg-white p-4">
						<h4 class="text-xs font-bold tracking-wider text-gray-500 uppercase">
							{m.adx_tx_split()}
						</h4>
						<div class="flex items-center justify-between border-b border-gray-100 py-1">
							<span class="text-gray-600">{m.adx_tx_gross_pay()}</span>
							<span class="font-mono font-semibold text-gray-900">
								{formatRupiah(peekEntry.grossAmount ?? peekEntry.amount)}
							</span>
						</div>
						<div class="flex items-center justify-between border-b border-gray-100 py-1">
							<span class="font-medium text-blue-700">{m.ady_fin_karja_fee()}</span>
							<span class="font-mono font-bold text-blue-700">
								-{formatRupiah(peekEntry.karjaFee ?? 0)}
							</span>
						</div>
						<div class="flex items-center justify-between border-b border-gray-100 py-1">
							<span class="text-gray-500">{m.ady_fin_payment_fee()}</span>
							<span class="font-mono text-gray-600">
								-{formatRupiah(peekEntry.paymentFee ?? 0)}
							</span>
						</div>
						<div class="flex items-center justify-between rounded-lg bg-emerald-50/60 p-2">
							<span class="font-bold text-emerald-900">{m.ady_fin_net_seller()}</span>
							<span class="font-mono text-sm font-bold text-emerald-800">
								{formatRupiah(peekEntry.sellerNet ?? peekEntry.amount)}
							</span>
						</div>
					</div>

					<div class="space-y-2 rounded-xl border border-gray-200 bg-white p-4 text-xs">
						<h4 class="text-xs font-bold tracking-wider text-gray-500 uppercase">
							{m.adx_tx_parties()}
						</h4>
						<div class="flex items-center justify-between border-b border-gray-100 py-1">
							<span class="text-gray-500">{m.adx_tx_seller_id()}</span>
							<span class="font-medium text-gray-900">
								{peekSeller?.name || peekEntry.sellerId || '-'}
							</span>
						</div>
						<div class="flex items-center justify-between border-b border-gray-100 py-1">
							<span class="text-gray-500">{m.adx_tx_col_order()}</span>
							<span class="font-mono text-gray-900">{peekEntry.orderId || '-'}</span>
						</div>
						<div class="flex items-center justify-between border-b border-gray-100 py-1">
							<span class="text-gray-500">{m.adx_tx_product()}</span>
							<span class="max-w-xs truncate font-medium text-gray-900">
								{peekEntry.description || '-'}
							</span>
						</div>
						<div class="flex items-center justify-between border-b border-gray-100 py-1">
							<span class="text-gray-500">{m.adx_tx_gw_ref()}</span>
							<span class="font-mono text-gray-900">{peekEntry.payoutId || '-'}</span>
						</div>
						<div class="flex items-center justify-between py-1">
							<span class="text-gray-500">{m.adx_tx_paid_at()}</span>
							<span class="text-gray-900">{formatDateTime(peekEntry.createdAt)}</span>
						</div>
					</div>
				</div>

				<div
					class="flex shrink-0 items-center justify-between border-t border-gray-100 bg-gray-50/80 px-6 py-3.5"
				>
					<button
						type="button"
						onclick={() => (peekEntry = null)}
						class="w-full rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700"
					>
						{m.adx_c_done()}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
