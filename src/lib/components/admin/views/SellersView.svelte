<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { admin } from '$lib/stores/admin.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { formatRupiah } from '$lib/data/mockData';
	import { isIdentityVerified } from '$lib/domain/verification';
	import { isBankConfigured } from '$lib/domain/payout';
	import { isPaidSale, isOrderCompleted } from '$lib/domain/orderLifecycle';
	import { isStoreSetupComplete } from '$lib/domain/onboarding';
	import { formatBytes } from '$lib/domain/fileStorage';
	import type { SellerProfile, LifecycleState } from '$lib/types';
	import type { ExtendedPayout } from '$lib/types/admin';
	import Search from 'lucide-svelte/icons/search';
	import ShieldCheck from 'lucide-svelte/icons/shield-check';
	import UserCheck from 'lucide-svelte/icons/user-check';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import CircleCheck from 'lucide-svelte/icons/circle-check';
	import X from 'lucide-svelte/icons/x';
	import {
		DataTable,
		type DataTableColumn,
		type DataTableCellContext
	} from '$lib/components/ui/data-table';

	type SellerDrawerTab =
		'ringkasan' | 'journey' | 'produk' | 'pesanan' | 'keuangan' | 'kasus' | 'storage' | 'riwayat';

	let searchQuery = $state('');
	let peekSeller = $state<SellerProfile | null>(null);
	let full360Seller = $state<SellerProfile | null>(null);
	let activeTab = $state<SellerDrawerTab>('ringkasan');

	const PAGE_SIZE = 10;
	let sortBy = $state<string | undefined>(undefined);
	let sortDir = $state<'asc' | 'desc' | undefined>(undefined);
	let searchTimer: ReturnType<typeof setTimeout> | undefined;

	onMount(() => {
		void admin.syncAdminProducts();
		void admin.syncAdminOrders();
		void admin.syncAdminPayouts();
		void admin.syncAdminCases();
		reload(1);
	});

	const sellers = $derived(admin.platformSellers);
	const serverPage = $derived(admin.sellersPage);
	const usingServer = $derived(serverPage?.server ?? false);

	const filteredSellers = $derived(
		sellers.filter((s) => {
			const q = searchQuery.toLowerCase();
			return (
				s.name.toLowerCase().includes(q) ||
				s.username.toLowerCase().includes(q) ||
				(s.email && s.email.toLowerCase().includes(q))
			);
		})
	);

	/** Muat satu halaman seller dari BE; `fallback` dipakai saat offline. */
	function reload(targetPage = 1) {
		void admin.loadSellersPage(
			{
				page: targetPage,
				limit: PAGE_SIZE,
				q: searchQuery.trim() || undefined,
				sortBy,
				sortDir
			},
			filteredSellers
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

	// Mode server: baris dari halaman BE; mode client (offline): hasil filter lokal.
	const loading = $derived(!serverPage);
	const viewItems = $derived(
		serverPage ? (serverPage.server ? (serverPage.items ?? []) : filteredSellers) : []
	);
	const viewTotal = $derived(
		serverPage ? (serverPage.server ? (serverPage.total ?? 0) : filteredSellers.length) : 0
	);

	function deriveSellerLifecycle(seller: SellerProfile) {
		const sProds = admin.platformProducts.filter(
			(p) => p.sellerId === seller.id || p.sellerId === `seller_${seller.username}`
		);
		const sOrds = admin.platformOrders.filter(
			(o) => o.sellerId === seller.id || o.sellerId === `seller_${seller.username}`
		);
		const paidOrders = sOrds.filter((o) => isPaidSale(o));
		const completedPaid = paidOrders.filter((o) => isOrderCompleted(o));

		let state: LifecycleState = 'no_product';
		let labelId: keyof typeof m = 'adx_sl_life_no_product';
		let descId: keyof typeof m = 'adx_sl_life_no_product_desc';
		let badgeColor = 'bg-slate-100 text-slate-700';

		if (completedPaid.length >= 2) {
			state = 'repeat_seller';
			labelId = 'adx_sl_life_repeat';
			descId = 'adx_sl_life_repeat_desc';
			badgeColor = 'bg-emerald-100 text-emerald-800';
		} else if (completedPaid.length === 1 && paidOrders.length === 1) {
			state = 'first_sale_completed';
			labelId = 'adx_sl_life_first_completed';
			descId = 'adx_sl_life_first_completed_desc';
			badgeColor = 'bg-teal-100 text-teal-800';
		} else if (paidOrders.length >= 1 && completedPaid.length === 0) {
			state = 'first_sale_needs_action';
			labelId = 'adx_sl_life_first_action';
			descId = 'adx_sl_life_first_action_desc';
			badgeColor = 'bg-amber-100 text-amber-800';
		} else if (sProds.length === 0) {
			state = 'no_product';
			labelId = 'adx_sl_life_no_product';
			descId = 'adx_sl_life_no_product_desc';
			badgeColor = 'bg-slate-100 text-slate-700';
		} else {
			const hasActive = sProds.some((p) => p.status === 'active');
			const totalViews = sProds.reduce((sum, p) => sum + (p.views || 0), 0);
			if (!hasActive) {
				state = 'product_draft';
				labelId = 'adx_sl_life_draft';
				descId = 'adx_sl_life_draft_desc';
				badgeColor = 'bg-blue-50 text-blue-700';
			} else if (totalViews > 0) {
				state = 'first_views_no_sale';
				labelId = 'adx_sl_life_views';
				descId = 'adx_sl_life_views_desc';
				badgeColor = 'bg-cyan-100 text-cyan-800';
			} else {
				state = 'product_published_not_shared';
				labelId = 'adx_sl_life_published';
				descId = 'adx_sl_life_published_desc';
				badgeColor = 'bg-indigo-50 text-indigo-700';
			}
		}

		const storeReady = isStoreSetupComplete(seller, {
			hasSharedProduct: false,
			hasVisitedPublicStore: true
		});
		const hasProduct = sProds.length > 0;
		const hasShared = sProds.some((p) => (p.views || 0) > 0 || p.status === 'active');

		return { state, labelId, descId, badgeColor, storeReady, hasProduct, hasShared };
	}

	function getSellerStats(seller: SellerProfile) {
		const sId = seller.id;
		const sUsername = seller.username;
		const match = (key?: string) =>
			key === sId || key === sUsername || key === `seller_${sUsername}`;
		const sellerProds = admin.platformProducts.filter((p) => match(p.sellerId));
		const sellerOrds = admin.platformOrders.filter((o) => match(o.sellerId));
		const paidOrders = sellerOrds.filter((o) => isPaidSale(o));
		const completedOrders = paidOrders.filter((o) => isOrderCompleted(o));
		const totalGmv = paidOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
		const sellerPayouts = admin.platformPayouts.filter((p) => match(p.sellerId));
		const paidPayoutsTotal = sellerPayouts
			.filter((p) => p.status === 'paid')
			.reduce((sum, p) => sum + p.amount, 0);
		const sellerReports = admin.platformReports.filter(
			(r) => r.sellerId === sId || r.targetId === sId
		);
		const sellerDisputes = admin.platformDisputes.filter((d) => d.sellerId === sId);
		const sellerFiles = admin.platformFiles.filter(
			(f) => f.ownerSellerId === sId || f.ownerSellerId === sUsername
		);
		const totalStorageBytes = sellerFiles.reduce((sum, f) => sum + (f.sizeBytes || 0), 0);
		return {
			productCount: sellerProds.length,
			orderCount: sellerOrds.length,
			paidOrderCount: paidOrders.length,
			completedOrderCount: completedOrders.length,
			gmv: totalGmv,
			paidPayouts: paidPayoutsTotal,
			balance: Math.max(0, Math.round(totalGmv * 0.91) - paidPayoutsTotal),
			openCasesCount:
				sellerReports.filter((r) => r.status !== 'resolved' && r.status !== 'dismissed').length +
				sellerDisputes.filter((d) => d.status !== 'resolved').length,
			formattedStorage: formatBytes(totalStorageBytes),
			products: sellerProds,
			orders: sellerOrds,
			payouts: sellerPayouts as ExtendedPayout[],
			files: sellerFiles
		};
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

	function onKeydown(e: KeyboardEvent) {
		if (e.key !== 'Escape') return;
		if (full360Seller) full360Seller = null;
		else if (peekSeller) peekSeller = null;
	}

	const drawerTabs: [SellerDrawerTab, () => string][] = [
		['ringkasan', () => m.adx_sl_tab_ringkasan()],
		['journey', () => m.adx_sl_tab_journey()],
		['produk', () => m.adx_sl_tab_produk()],
		['pesanan', () => m.adx_sl_tab_pesanan()],
		['keuangan', () => m.adx_sl_tab_keuangan()],
		['kasus', () => m.adx_sl_tab_kasus()],
		['storage', () => m.adx_sl_tab_storage()],
		['riwayat', () => m.adx_sl_tab_riwayat()]
	];

	const columns: DataTableColumn<SellerProfile>[] = [
		{ id: 'seller', header: m.adx_sl_col_seller(), enableSorting: true, meta: { sortKey: 'name' } },
		{ id: 'stage', header: m.adx_sl_col_stage() },
		{ id: 'verif', header: m.adx_sl_col_verif() },
		{ id: 'sales', header: m.adx_sl_col_sales() },
		{ id: 'activity', header: m.adx_sl_col_activity(), meta: { align: 'right' } }
	];
</script>

<svelte:window onkeydown={onKeydown} />

{#snippet sellerCell(ctx: DataTableCellContext<SellerProfile>)}
	{@const seller = ctx.row.original}
	<div class="flex items-center gap-3">
		{#if seller.avatarUrl && seller.avatarUrl.trim().length > 0}
			<img
				src={seller.avatarUrl}
				alt={seller.name}
				class="h-9 w-9 shrink-0 rounded-full border border-gray-200 object-cover"
			/>
		{:else}
			<div
				class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800"
			>
				{seller.name.slice(0, 2).toUpperCase()}
			</div>
		{/if}
		<div class="min-w-0">
			<div class="truncate font-semibold text-gray-900">{seller.name}</div>
			<div class="truncate font-mono text-[11px] text-gray-500">@{seller.username}</div>
		</div>
	</div>
{/snippet}

{#snippet stageCell(ctx: DataTableCellContext<SellerProfile>)}
	{@const seller = ctx.row.original}
	{@const stats = getSellerStats(seller)}
	{@const lifecycle = deriveSellerLifecycle(seller)}
	<span
		class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold {lifecycle.badgeColor}"
	>
		{m[lifecycle.labelId]()}
	</span>
	<div class="mt-0.5 truncate text-[10px] text-gray-400">
		{m.adx_sl_stage_meta({ products: stats.productCount, orders: stats.paidOrderCount })}
	</div>
{/snippet}

{#snippet verifCell(ctx: DataTableCellContext<SellerProfile>)}
	{@const seller = ctx.row.original}
	{@const verified = isIdentityVerified(seller)}
	{@const bankReady = isBankConfigured(seller)}
	<div class="flex items-center gap-1.5">
		{#if verified}
			<span class="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
				<ShieldCheck class="h-3.5 w-3.5 text-emerald-600" />
				{m.adx_sl_ktp_valid()}
			</span>
		{:else}
			<span class="inline-flex items-center gap-1 text-[11px] text-gray-400">
				<UserCheck class="h-3.5 w-3.5 text-gray-300" />
				{m.adx_sl_ktp_none()}
			</span>
		{/if}
	</div>
	<div class="mt-0.5 truncate text-[10px] text-gray-400">
		{bankReady
			? m.adx_sl_bank_ready({ bank: seller.bankInfo?.bank || 'Bank' })
			: m.adx_sl_bank_none()}
	</div>
{/snippet}

{#snippet salesCell(ctx: DataTableCellContext<SellerProfile>)}
	{@const stats = getSellerStats(ctx.row.original)}
	<div class="font-mono font-semibold text-gray-900">{formatRupiah(stats.gmv)}</div>
	<div class="mt-0.5 text-[10px] text-gray-400">
		{m.adx_sl_orders_paid({ count: stats.paidOrderCount })}
	</div>
{/snippet}

{#snippet activityCell(ctx: DataTableCellContext<SellerProfile>)}
	{@const seller = ctx.row.original}
	<div class="text-[11px] text-gray-600">
		{formatDate((seller as { createdAt?: string }).createdAt || '')}
	</div>
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
			<h1 class="text-xl font-bold tracking-tight text-gray-900">{m.adx_sl_title()}</h1>
			<p class="mt-0.5 text-xs text-gray-500">{m.adx_sl_subtitle()}</p>
		</div>
		<div class="relative w-full sm:w-72">
			<Search class="absolute top-1/2 left-3.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
			<input
				type="text"
				bind:value={searchQuery}
				oninput={onSearchInput}
				placeholder={m.adx_sl_search_ph()}
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
			onRowClick={(seller) => (peekSeller = seller)}
			getRowId={(seller) => seller.id || seller.username}
			rowClass={() => 'group'}
			emptyMessage={m.adx_sl_empty()}
			cellSnippets={{
				seller: sellerCell,
				stage: stageCell,
				verif: verifCell,
				sales: salesCell,
				activity: activityCell
			}}
		/>
	</div>
</div>

{#if peekSeller}
	{@const stats = getSellerStats(peekSeller)}
	{@const lifecycle = deriveSellerLifecycle(peekSeller)}
	{@const verified = isIdentityVerified(peekSeller)}
	{@const bankReady = isBankConfigured(peekSeller)}
	<div
		class="fixed inset-0 z-50 overflow-hidden"
		role="dialog"
		aria-modal="true"
		aria-label={peekSeller.name}
	>
		<div
			class="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px]"
			aria-hidden="true"
			onclick={() => (peekSeller = null)}
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
							<h3 class="truncate text-base font-bold text-gray-900">{peekSeller.name}</h3>
							<span
								class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold {lifecycle.badgeColor}"
							>
								{m[lifecycle.labelId]()}
							</span>
						</div>
						<div class="mt-0.5 truncate text-xs text-gray-500">
							@{peekSeller.username} • {peekSeller.email || m.adx_sl_no_email()}
						</div>
					</div>
					<button
						type="button"
						onclick={() => (peekSeller = null)}
						class="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200/60 hover:text-gray-700"
						aria-label={m.adx_c_close()}
					>
						<X class="h-5 w-5" />
					</button>
				</div>

				<div class="flex-1 space-y-5 overflow-y-auto p-6">
					<div class="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
						{#if peekSeller.avatarUrl && peekSeller.avatarUrl.trim().length > 0}
							<img
								src={peekSeller.avatarUrl}
								alt={peekSeller.name}
								class="h-14 w-14 rounded-full border-2 border-white object-cover shadow-xs"
							/>
						{:else}
							<div
								class="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-800"
							>
								{peekSeller.name.slice(0, 2).toUpperCase()}
							</div>
						{/if}
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-1.5 text-base font-bold text-gray-900">
								{peekSeller.name}
								{#if verified}
									<ShieldCheck class="h-4 w-4 text-emerald-600" />
								{/if}
							</div>
							<div class="font-mono text-xs text-gray-500">@{peekSeller.username}</div>
							<div class="mt-1 text-xs text-gray-600">
								{peekSeller.bio || m.adx_sl_no_bio()}
							</div>
						</div>
					</div>

					<div class="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
						<div class="flex items-center justify-between">
							<h4 class="text-xs font-bold tracking-wider text-gray-500 uppercase">
								{m.adx_sl_lifecycle_head()}
							</h4>
							<span class="text-xs font-semibold text-emerald-800">{m[lifecycle.labelId]()}</span>
						</div>
						<p class="text-xs text-gray-600">{m[lifecycle.descId]()}</p>
						<div class="grid grid-cols-3 gap-2 border-t border-gray-100 pt-2 text-[11px]">
							<div class="flex items-center gap-1.5">
								<CircleCheck
									class="h-3.5 w-3.5 {lifecycle.storeReady ? 'text-emerald-600' : 'text-gray-300'}"
								/>
								<span>{m.adx_sl_ms_store()}</span>
							</div>
							<div class="flex items-center gap-1.5">
								<CircleCheck
									class="h-3.5 w-3.5 {lifecycle.hasProduct ? 'text-emerald-600' : 'text-gray-300'}"
								/>
								<span>{m.adx_sl_ms_product()}</span>
							</div>
							<div class="flex items-center gap-1.5">
								<CircleCheck
									class="h-3.5 w-3.5 {lifecycle.hasShared ? 'text-emerald-600' : 'text-gray-300'}"
								/>
								<span>{m.adx_sl_ms_share()}</span>
							</div>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div class="rounded-xl border border-gray-200 bg-gray-50 p-3.5">
							<div class="text-[11px] font-medium text-gray-500">{m.adx_sl_stat_gmv()}</div>
							<div class="mt-0.5 font-mono text-base font-bold text-gray-900">
								{formatRupiah(stats.gmv)}
							</div>
							<div class="mt-0.5 text-[10px] text-gray-400">
								{m.adx_sl_orders_paid({ count: stats.paidOrderCount })}
							</div>
						</div>
						<div class="rounded-xl border border-gray-200 bg-gray-50 p-3.5">
							<div class="text-[11px] font-medium text-gray-500">{m.adx_sl_stat_balance()}</div>
							<div class="mt-0.5 font-mono text-base font-bold text-emerald-700">
								{formatRupiah(stats.balance)}
							</div>
							<div class="mt-0.5 text-[10px] text-gray-400">{m.adx_sl_stat_balance_sub()}</div>
						</div>
						<div class="rounded-xl border border-gray-200 bg-gray-50 p-3.5">
							<div class="text-[11px] font-medium text-gray-500">{m.adx_sl_stat_catalog()}</div>
							<div class="mt-0.5 text-base font-bold text-gray-900">
								{m.adx_sl_stat_catalog_val({ count: stats.productCount })}
							</div>
							<div class="mt-0.5 text-[10px] text-gray-400">
								{m.adx_sl_active_products({
									count: stats.products.filter((p) => p.status === 'active').length
								})}
							</div>
						</div>
						<div class="rounded-xl border border-gray-200 bg-gray-50 p-3.5">
							<div class="text-[11px] font-medium text-gray-500">{m.adx_sl_stat_storage()}</div>
							<div class="mt-0.5 text-base font-bold text-gray-900">{stats.formattedStorage}</div>
							<div class="mt-0.5 text-[10px] text-gray-400">
								{m.adx_sl_file_count({ count: stats.files.length })}
							</div>
						</div>
					</div>

					<div class="space-y-2.5 rounded-xl border border-gray-200 bg-white p-4 text-xs">
						<h4 class="text-xs font-bold tracking-wider text-gray-500 uppercase">
							{m.adx_sl_verif_head()}
						</h4>
						<div class="flex items-center justify-between border-b border-gray-100 py-1">
							<span class="text-gray-600">{m.adx_sl_ktp_status()}</span>
							<span class="font-semibold {verified ? 'text-emerald-700' : 'text-amber-700'}">
								{verified ? m.adx_sl_verified() : m.adx_sl_unverified()}
							</span>
						</div>
						<div class="flex items-center justify-between border-b border-gray-100 py-1">
							<span class="text-gray-600">{m.adx_sl_bank()}</span>
							<span class="font-medium text-gray-900">
								{bankReady
									? `${peekSeller.bankInfo?.bank} • ${peekSeller.bankInfo?.accountNumber}`
									: m.adx_sl_bank_unset()}
							</span>
						</div>
						<div class="flex items-center justify-between py-1">
							<span class="text-gray-600">{m.adx_sl_open_cases()}</span>
							<span
								class="font-semibold {stats.openCasesCount > 0 ? 'text-rose-700' : 'text-gray-900'}"
								>{m.adx_sl_cases_count({ count: stats.openCasesCount })}</span
							>
						</div>
					</div>

					<div class="space-y-2">
						<h4 class="text-xs font-bold tracking-wider text-gray-500 uppercase">
							{m.adx_sl_product_list({ count: stats.productCount })}
						</h4>
						<div class="max-h-40 space-y-1.5 overflow-y-auto">
							{#each stats.products as p (p.id)}
								<div
									class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-xs"
								>
									<div class="min-w-0 pr-2">
										<div class="truncate font-semibold text-gray-900">{p.title}</div>
										<div class="text-[10px] text-gray-400 capitalize">
											{p.type} • {formatRupiah(p.price)}
										</div>
									</div>
									<span
										class="shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold {p.status ===
										'active'
											? 'bg-emerald-100 text-emerald-800'
											: 'bg-gray-200 text-gray-700'}">{p.status}</span
									>
								</div>
							{/each}
							{#if stats.products.length === 0}
								<div class="rounded-lg bg-gray-50 py-4 text-center text-xs text-gray-400">
									{m.adx_sl_no_products()}
								</div>
							{/if}
						</div>
					</div>
				</div>

				<div
					class="flex shrink-0 items-center justify-between border-t border-gray-100 bg-gray-50/80 px-6 py-3.5"
				>
					<button
						type="button"
						onclick={() => peekSeller && goto(`/${peekSeller.username}`)}
						class="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
					>
						<ExternalLink class="h-3.5 w-3.5" />
						{m.adx_sl_view_store()}
					</button>
					<button
						type="button"
						onclick={() => {
							const s = peekSeller;
							peekSeller = null;
							full360Seller = s;
						}}
						class="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-700"
					>
						{m.adx_sl_open360()}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if full360Seller}
	{@const stats = getSellerStats(full360Seller)}
	{@const lifecycle = deriveSellerLifecycle(full360Seller)}
	{@const verified = isIdentityVerified(full360Seller)}
	<div
		class="fixed inset-0 z-50 overflow-hidden"
		role="dialog"
		aria-modal="true"
		aria-label={full360Seller.name}
	>
		<div
			class="fixed inset-0 bg-gray-900/60 backdrop-blur-[2px]"
			aria-hidden="true"
			onclick={() => (full360Seller = null)}
		></div>
		<div class="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
			<div
				class="flex w-screen max-w-3xl flex-col justify-between border-l border-gray-200 bg-white shadow-2xl"
			>
				<div class="flex items-start justify-between border-b border-gray-200 bg-gray-50 px-6 py-5">
					<div class="flex items-center gap-4">
						{#if full360Seller.avatarUrl && full360Seller.avatarUrl.trim().length > 0}
							<img
								src={full360Seller.avatarUrl}
								alt={full360Seller.name}
								class="h-12 w-12 rounded-full border border-gray-200 object-cover"
							/>
						{:else}
							<div
								class="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800"
							>
								{full360Seller.name.slice(0, 2).toUpperCase()}
							</div>
						{/if}
						<div>
							<div class="flex items-center gap-2">
								<h2 class="text-lg font-bold text-gray-900">{full360Seller.name}</h2>
								{#if verified}
									<ShieldCheck class="h-4 w-4 text-emerald-600" />
								{/if}
								<span
									class="rounded-full px-2 py-0.5 text-[10px] font-semibold {lifecycle.badgeColor}"
								>
									{m[lifecycle.labelId]()}
								</span>
							</div>
							<div class="mt-0.5 font-mono text-xs text-gray-500">
								@{full360Seller.username} • {m.adx_sl_registered({
									date: formatDate((full360Seller as { createdAt?: string }).createdAt || '')
								})}
							</div>
						</div>
					</div>
					<button
						type="button"
						onclick={() => (full360Seller = null)}
						class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
						aria-label={m.adx_c_close()}
					>
						<X class="h-5 w-5" />
					</button>
				</div>

				<div
					class="flex space-x-6 overflow-x-auto border-b border-gray-200 px-6 text-xs font-semibold"
				>
					{#each drawerTabs as [tab, labelFn] (tab)}
						<button
							type="button"
							onclick={() => (activeTab = tab)}
							class="border-b-2 py-3 whitespace-nowrap capitalize transition-colors {activeTab ===
							tab
								? 'border-emerald-600 text-emerald-700'
								: 'border-transparent text-gray-500 hover:text-gray-900'}"
						>
							{labelFn()}
						</button>
					{/each}
				</div>

				<div class="flex-1 space-y-6 overflow-y-auto p-6">
					{#if activeTab === 'ringkasan'}
						<div class="space-y-6">
							<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
								<div class="rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-center">
									<div class="text-[11px] text-gray-500">{m.adx_sl_c_gross_gmv()}</div>
									<div class="mt-1 font-mono text-base font-bold text-gray-900">
										{formatRupiah(stats.gmv)}
									</div>
								</div>
								<div class="rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-center">
									<div class="text-[11px] text-gray-500">{m.adx_sl_c_net()}</div>
									<div class="mt-1 font-mono text-base font-bold text-emerald-700">
										{formatRupiah(stats.balance)}
									</div>
								</div>
								<div class="rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-center">
									<div class="text-[11px] text-gray-500">{m.adx_sl_c_orders()}</div>
									<div class="mt-1 text-base font-bold text-gray-900">{stats.orderCount}</div>
								</div>
								<div class="rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-center">
									<div class="text-[11px] text-gray-500">{m.adx_sl_c_storage()}</div>
									<div class="mt-1 text-base font-bold text-gray-900">{stats.formattedStorage}</div>
								</div>
							</div>
							<div class="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
								<h4 class="text-xs font-bold text-gray-700">{m.adx_sl_contact_head()}</h4>
								<div class="text-xs text-gray-600">
									{m.adx_sl_email_lbl()}
									{full360Seller.email || '-'}
								</div>
								<div class="text-xs text-gray-600">
									{m.adx_sl_phone_lbl()}
									{full360Seller.whatsapp || '-'}
								</div>
								<div class="text-xs text-gray-600">
									{m.adx_sl_bio_lbl()}
									{full360Seller.bio || '-'}
								</div>
							</div>
						</div>
					{:else if activeTab === 'produk'}
						<div class="space-y-3">
							<h4 class="text-xs font-bold text-gray-700">
								{m.adx_sl_all_products({ count: stats.productCount })}
							</h4>
							{#each stats.products as p (p.id)}
								<div
									class="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs"
								>
									<div>
										<div class="font-semibold text-gray-900">{p.title}</div>
										<div class="text-[11px] text-gray-500 capitalize">
											{p.type} • {formatRupiah(p.price)}
										</div>
									</div>
									<span
										class="rounded px-2 py-0.5 text-[10px] font-semibold {p.status === 'active'
											? 'bg-emerald-100 text-emerald-800'
											: 'bg-gray-200 text-gray-700'}">{p.status}</span
									>
								</div>
							{/each}
						</div>
					{:else if activeTab === 'pesanan'}
						<div class="space-y-3">
							<h4 class="text-xs font-bold text-gray-700">
								{m.adx_sl_all_orders({ count: stats.orderCount })}
							</h4>
							{#each stats.orders as o (o.id)}
								<div
									class="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs"
								>
									<div>
										<div class="font-mono font-semibold text-gray-900">#{o.id.slice(0, 8)}</div>
										<div class="text-[11px] text-gray-500">
											{o.productTitle} • {formatRupiah(o.amount)}
										</div>
									</div>
									<span
										class="rounded bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-700 capitalize"
									>
										{o.fulfillmentStatus}
									</span>
								</div>
							{/each}
						</div>
					{:else}
						<div class="py-12 text-center text-xs text-gray-400">
							{m.adx_sl_tab_fallback({
								tab: drawerTabs.find(([t]) => t === activeTab)?.[1]() ?? activeTab,
								name: full360Seller.name
							})}
						</div>
					{/if}
				</div>

				<div
					class="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4"
				>
					<button
						type="button"
						onclick={() => full360Seller && goto(`/${full360Seller.username}`)}
						class="flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-gray-900"
					>
						<ExternalLink class="h-3.5 w-3.5" />
						{m.adx_sl_visit_store()}
					</button>
					<button
						type="button"
						onclick={() => (full360Seller = null)}
						class="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
					>
						{m.adx_c_done()}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
