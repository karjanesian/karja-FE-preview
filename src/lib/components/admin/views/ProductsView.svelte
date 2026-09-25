<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import { admin } from '$lib/stores/admin.svelte';
	import { m } from '$lib/paraglide/messages.js';

	function modStatusLabel(status: ProductModerationStatus): string {
		switch (status) {
			case 'pending_review':
				return m.adx_pd_mod_pending_review();
			case 'approved':
				return m.adx_pd_mod_approved();
			case 'rejected':
				return m.adx_pd_mod_rejected();
			case 'suspended':
				return m.adx_pd_mod_suspended();
			case 'not_required':
			default:
				return m.adx_pd_mod_not_required();
		}
	}
	import { formatRupiah } from '$lib/data/mockData';
	import { ApiError } from '$lib/api';
	import { hasPermission } from '$lib/domain/adminDomain';
	import { isPaidSale } from '$lib/domain/orderLifecycle';
	import { formatBytes } from '$lib/domain/fileStorage';
	import type { Product } from '$lib/types';
	import type { FileAsset } from '$lib/types/admin';
	import type { ProductModerationStatus } from '$lib/types/admin';
	import FileText from 'lucide-svelte/icons/file-text';
	import Video from 'lucide-svelte/icons/video';
	import Wrench from 'lucide-svelte/icons/wrench';
	import Search from 'lucide-svelte/icons/search';
	import TriangleAlert from 'lucide-svelte/icons/triangle-alert';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import X from 'lucide-svelte/icons/x';
	import {
		DataTable,
		type DataTableColumn,
		type DataTableCellContext
	} from '$lib/components/ui/data-table';

	type TypeTab = 'all' | 'digital' | 'session' | 'service';
	type ModerationFilter = 'all' | 'pending_review' | 'approved' | 'suspended' | 'rejected';

	let activeTypeTab = $state<TypeTab>('all');
	let activeModerationFilter = $state<ModerationFilter>('all');
	let searchQuery = $state('');
	let peekProduct = $state<Product | null>(null);
	let moderationReason = $state('');
	let isSubmitting = $state(false);
	let actionError = $state<string | null>(null);

	const PAGE_SIZE = 10;
	let sortBy = $state<string | undefined>(undefined);
	let sortDir = $state<'asc' | 'desc' | undefined>(undefined);
	let searchTimer: ReturnType<typeof setTimeout> | undefined;

	onMount(() => {
		void admin.syncAdminSellers();
		void admin.syncAdminOrders();
		reload(1);
	});

	const canModerate = $derived(hasPermission(admin.adminUser, 'products.moderate'));
	const products = $derived(admin.platformProducts);
	const files = $derived(admin.platformFiles);

	const serverPage = $derived(admin.productsPage);
	const usingServer = $derived(serverPage?.server ?? false);

	/** Filter moderation FE → nilai yang dikenali BE (suspended dipetakan ke rejected). */
	function apiModerationFilter(): string | undefined {
		if (activeModerationFilter === 'all') return undefined;
		if (activeModerationFilter === 'suspended') return 'rejected';
		return activeModerationFilter;
	}

	/** Muat satu halaman produk dari BE; `fallback` dipakai saat offline. */
	function reload(targetPage = 1) {
		void admin.loadProductsPage(
			{
				page: targetPage,
				limit: PAGE_SIZE,
				q: searchQuery.trim() || undefined,
				type: activeTypeTab === 'all' ? undefined : activeTypeTab,
				moderationStatus: apiModerationFilter(),
				sortBy,
				sortDir
			},
			filteredProducts
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

	function setModerationFilter(filter: ModerationFilter) {
		activeModerationFilter = filter;
		reload(1);
	}

	const typeCounts = $derived({
		all: products.length,
		digital: products.filter((p) => p.type === 'digital').length,
		session: products.filter((p) => p.type === 'session').length,
		service: products.filter((p) => p.type === 'service').length
	});

	const filteredProducts = $derived(
		products.filter((p) => {
			if (activeTypeTab !== 'all' && p.type !== activeTypeTab) return false;
			const modStatus = p.moderationStatus || 'approved';
			if (activeModerationFilter !== 'all' && modStatus !== activeModerationFilter) return false;
			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase();
				const sellerName =
					admin.platformSellers.find((s) => s.id === p.sellerId || s.username === p.sellerId)
						?.name || '';
				return (
					p.title.toLowerCase().includes(q) ||
					p.category.toLowerCase().includes(q) ||
					(p.sellerId && p.sellerId.toLowerCase().includes(q)) ||
					sellerName.toLowerCase().includes(q) ||
					(p.slug && p.slug.toLowerCase().includes(q))
				);
			}
			return true;
		})
	);

	// Mode server: baris dari halaman BE; mode client (offline): hasil filter lokal.
	const loading = $derived(!serverPage);
	const viewItems = $derived(
		serverPage ? (serverPage.server ? (serverPage.items ?? []) : filteredProducts) : []
	);
	const viewTotal = $derived(
		serverPage ? (serverPage.server ? (serverPage.total ?? 0) : filteredProducts.length) : 0
	);

	function getSellerInfo(sellerId?: string) {
		if (!sellerId) return null;
		return (
			admin.platformSellers.find(
				(s) => s.id === sellerId || s.username === sellerId || `seller_${s.username}` === sellerId
			) || null
		);
	}

	function getProductStats(product: Product) {
		const prodOrders = admin.platformOrders.filter((o) => o.productId === product.id);
		const paidOrders = prodOrders.filter((o) => isPaidSale(o));
		const totalGmv = paidOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
		const activeOrders = prodOrders.filter(
			(o) => o.fulfillmentStatus !== 'selesai' && o.fulfillmentStatus !== 'dibatalkan'
		);
		const lateOrders = activeOrders.filter((o) => {
			if (o.serviceDueAt) return new Date(o.serviceDueAt) < new Date();
			return false;
		});
		const prodFiles = files.filter(
			(f) =>
				f.linkedEntityId === product.id ||
				(f as FileAsset & { associatedProductId?: string }).associatedProductId === product.id
		);
		const totalBytes = prodFiles.reduce((sum, f) => sum + (f.sizeBytes || 0), 0);
		return {
			totalOrders: prodOrders.length,
			paidOrdersCount: paidOrders.length,
			gmv: totalGmv,
			activeOrdersCount: activeOrders.length,
			lateOrdersCount: lateOrders.length,
			files: prodFiles,
			formattedStorage: formatBytes(totalBytes),
			mainFileName: product.fileDownloadName || prodFiles[0]?.originalName || m.adx_pd_no_file(),
			durationMinutes: product.sessionDurationMinutes || 60,
			upcomingSessionsCount: prodOrders.filter(
				(o) =>
					(o.scheduledDate || o.scheduledAt) &&
					new Date(o.scheduledDate || o.scheduledAt || '') >= new Date()
			).length
		};
	}

	async function handleApplyModeration(productId: string, nextStatus: ProductModerationStatus) {
		if (isSubmitting) return;
		if ((nextStatus === 'suspended' || nextStatus === 'rejected') && !moderationReason.trim()) {
			alert(m.adx_pd_reason_required_alert());
			return;
		}
		isSubmitting = true;
		actionError = null;
		try {
			await admin.updateProductModeration(productId, nextStatus, moderationReason.trim());
			peekProduct = null;
			moderationReason = '';
		} catch (e) {
			actionError = e instanceof ApiError ? e.message : m.admin_action_failed();
		} finally {
			isSubmitting = false;
		}
	}

	async function suspendWithPrompt(productId: string) {
		if (isSubmitting) return;
		const reason = prompt(m.adx_pd_suspend_prompt()) || '';
		if (!reason) return;
		isSubmitting = true;
		actionError = null;
		try {
			await admin.updateProductModeration(productId, 'suspended', reason);
		} catch (e) {
			actionError = e instanceof ApiError ? e.message : m.admin_action_failed();
		} finally {
			isSubmitting = false;
		}
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && peekProduct) peekProduct = null;
	}

	const peekSeller = $derived(peekProduct ? getSellerInfo(peekProduct.sellerId) : null);
	const peekStats = $derived(peekProduct ? getProductStats(peekProduct) : null);
	const peekModStatus = $derived<ProductModerationStatus>(
		(peekProduct?.moderationStatus as ProductModerationStatus) || 'approved'
	);

	const columns = $derived.by<DataTableColumn<Product>[]>(() => {
		if (activeTypeTab === 'digital') {
			return [
				{
					id: 'product',
					header: m.adx_pd_col_product(),
					enableSorting: true,
					meta: { sortKey: 'title' }
				},
				{ id: 'seller', header: m.adx_pd_col_seller() },
				{ id: 'file', header: m.adx_pd_col_file() },
				{
					id: 'sales',
					header: m.adx_pd_col_sales(),
					enableSorting: true,
					meta: { sortKey: 'sales' }
				},
				{ id: 'status', header: m.adx_pd_col_status(), meta: { align: 'right' } }
			];
		}
		if (activeTypeTab === 'session') {
			return [
				{
					id: 'product',
					header: m.adx_pd_col_product(),
					enableSorting: true,
					meta: { sortKey: 'title' }
				},
				{ id: 'seller', header: m.adx_pd_col_seller() },
				{ id: 'next', header: m.adx_pd_col_next() },
				{ id: 'booking', header: m.adx_pd_col_booking() },
				{ id: 'status', header: m.adx_pd_col_status(), meta: { align: 'right' } }
			];
		}
		if (activeTypeTab === 'service') {
			return [
				{
					id: 'product',
					header: m.adx_pd_col_product(),
					enableSorting: true,
					meta: { sortKey: 'title' }
				},
				{ id: 'seller', header: m.adx_pd_col_seller() },
				{ id: 'active', header: m.adx_pd_col_active() },
				{ id: 'risk', header: m.adx_pd_col_risk() },
				{ id: 'status', header: m.adx_pd_col_status(), meta: { align: 'right' } }
			];
		}
		return [
			{
				id: 'product',
				header: m.adx_pd_col_product(),
				enableSorting: true,
				meta: { sortKey: 'title' }
			},
			{ id: 'seller', header: m.adx_pd_col_seller() },
			{ id: 'type', header: m.adx_pd_col_type() },
			{ id: 'status', header: m.adx_pd_col_status() },
			{
				id: 'sales',
				header: m.adx_pd_col_sales(),
				enableSorting: true,
				meta: { align: 'right', sortKey: 'sales' }
			}
		];
	});

	const cellSnippets = $derived.by<
		Record<string, Snippet<[DataTableCellContext<Product>]> | undefined>
	>(() => {
		if (activeTypeTab === 'digital') {
			return {
				product: pProductCell,
				seller: pSellerCell,
				file: pFileCell,
				sales: pDigitalSalesCell,
				status: pStatusCell
			};
		}
		if (activeTypeTab === 'session') {
			return {
				product: pProductCell,
				seller: pSellerCell,
				next: pNextCell,
				booking: pBookingCell,
				status: pStatusCell
			};
		}
		if (activeTypeTab === 'service') {
			return {
				product: pProductCell,
				seller: pSellerCell,
				active: pActiveCell,
				risk: pRiskCell,
				status: pStatusCell
			};
		}
		return {
			product: pProductCell,
			seller: pSellerCell,
			type: pTypeCell,
			status: pModStatusCell,
			sales: pSalesCell
		};
	});
</script>

<svelte:window onkeydown={onKeydown} />

{#snippet pProductCell(ctx: DataTableCellContext<Product>)}
	{@const p = ctx.row.original}
	<div class="max-w-xs truncate font-semibold text-gray-900">{p.title}</div>
	<div class="font-mono text-[11px] text-gray-500">{formatRupiah(p.price)}</div>
{/snippet}

{#snippet pSellerCell(ctx: DataTableCellContext<Product>)}
	{@const p = ctx.row.original}
	{@const s = getSellerInfo(p.sellerId)}
	<div class="truncate font-medium text-gray-900">{s?.name || p.sellerId || '-'}</div>
	<div class="font-mono text-[10px] text-gray-400">@{s?.username || p.sellerId || '-'}</div>
{/snippet}

{#snippet pTypeCell(ctx: DataTableCellContext<Product>)}
	<span
		class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700 capitalize"
	>
		{ctx.row.original.type}
	</span>
{/snippet}

{#snippet pModStatusCell(ctx: DataTableCellContext<Product>)}
	{@const modStatus = (ctx.row.original.moderationStatus as ProductModerationStatus) || 'approved'}
	<span
		class="rounded-full px-2 py-0.5 text-[10px] font-semibold {modStatus === 'approved'
			? 'bg-emerald-100 text-emerald-800'
			: modStatus === 'pending_review'
				? 'bg-amber-100 text-amber-800'
				: modStatus === 'rejected' || modStatus === 'suspended'
					? 'bg-rose-100 text-rose-800'
					: 'bg-gray-100 text-gray-600'}"
	>
		{modStatusLabel(modStatus)}
	</span>
{/snippet}

{#snippet pSalesCell(ctx: DataTableCellContext<Product>)}
	{@const stats = getProductStats(ctx.row.original)}
	<div class="font-mono font-semibold text-gray-900">{formatRupiah(stats.gmv)}</div>
	<div class="text-[10px] text-gray-400">
		{m.adx_pd_order_count({ count: stats.paidOrdersCount })}
	</div>
{/snippet}

{#snippet pFileCell(ctx: DataTableCellContext<Product>)}
	{@const stats = getProductStats(ctx.row.original)}
	<div class="max-w-xs truncate font-medium text-gray-900">{stats.mainFileName}</div>
	<div class="text-[10px] text-gray-400">{stats.formattedStorage}</div>
{/snippet}

{#snippet pDigitalSalesCell(ctx: DataTableCellContext<Product>)}
	{@const stats = getProductStats(ctx.row.original)}
	<div class="font-mono font-semibold text-gray-900">{formatRupiah(stats.gmv)}</div>
	<div class="text-[10px] text-gray-400">{m.adx_pd_sold({ count: stats.paidOrdersCount })}</div>
{/snippet}

{#snippet pStatusCell(ctx: DataTableCellContext<Product>)}
	<span
		class="rounded-full px-2 py-0.5 text-[10px] font-semibold {ctx.row.original.status === 'active'
			? 'bg-emerald-100 text-emerald-800'
			: 'bg-gray-100 text-gray-700'}">{ctx.row.original.status}</span
	>
{/snippet}

{#snippet pNextCell(ctx: DataTableCellContext<Product>)}
	{@const stats = getProductStats(ctx.row.original)}
	<div class="font-medium text-gray-900">{m.adx_pd_minutes({ count: stats.durationMinutes })}</div>
	<div class="text-[10px] text-gray-400">Google Meet</div>
{/snippet}

{#snippet pBookingCell(ctx: DataTableCellContext<Product>)}
	{@const stats = getProductStats(ctx.row.original)}
	<div class="font-semibold text-gray-900">
		{m.adx_pd_bookings({ count: stats.paidOrdersCount })}
	</div>
	<div class="text-[10px] text-gray-400">
		{m.adx_pd_upcoming({ count: stats.upcomingSessionsCount })}
	</div>
{/snippet}

{#snippet pActiveCell(ctx: DataTableCellContext<Product>)}
	{@const stats = getProductStats(ctx.row.original)}
	<div class="font-semibold text-gray-900">
		{m.adx_pd_active({ count: stats.activeOrdersCount })}
	</div>
	<div class="text-[10px] text-gray-400">
		{m.adx_pd_total_order({ count: stats.paidOrdersCount })}
	</div>
{/snippet}

{#snippet pRiskCell(ctx: DataTableCellContext<Product>)}
	{@const stats = getProductStats(ctx.row.original)}
	{#if stats.lateOrdersCount > 0}
		<span class="flex items-center gap-1 text-[11px] font-medium text-rose-600">
			<TriangleAlert class="h-3 w-3" />
			{m.adx_pd_late({ count: stats.lateOrdersCount })}
		</span>
	{:else}
		<span class="text-[11px] text-emerald-700">{m.adx_pd_normal()}</span>
	{/if}
{/snippet}

<div class="mx-auto max-w-7xl space-y-6 pb-16">
	<div
		class="flex flex-col justify-between gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center"
	>
		<div>
			<h1 class="text-xl font-bold tracking-tight text-gray-900">{m.adx_pd_title()}</h1>
			<p class="mt-0.5 text-xs text-gray-500">{m.adx_pd_subtitle()}</p>
		</div>

		<div class="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-100 p-1">
			<button
				type="button"
				onclick={() => setTypeTab('all')}
				class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all {activeTypeTab === 'all'
					? 'bg-white text-gray-900 shadow-xs'
					: 'text-gray-500 hover:text-gray-900'}"
			>
				{m.adx_pd_tab_all({ count: typeCounts.all })}
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
				{m.adx_pd_tab_digital({ count: typeCounts.digital })}
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
				{m.adx_pd_tab_session({ count: typeCounts.session })}
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
				{m.adx_pd_tab_service({ count: typeCounts.service })}
			</button>
		</div>
	</div>

	<div class="flex flex-col items-center justify-between gap-3 sm:flex-row">
		<div class="flex w-full items-center gap-2 overflow-x-auto sm:w-auto">
			{#each [['all', m.adx_pd_mf_all()], ['pending_review', m.adx_pd_mf_pending()], ['approved', m.adx_pd_mf_approved()], ['suspended', m.adx_pd_mf_suspended()], ['rejected', m.adx_pd_mf_rejected()]] as [key, label] (key)}
				<button
					type="button"
					onclick={() => setModerationFilter(key as ModerationFilter)}
					class="rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors {activeModerationFilter ===
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
				placeholder={m.adx_pd_search_ph()}
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
			onRowClick={(p) => (peekProduct = p)}
			rowClass={() => 'group'}
			emptyMessage={m.adx_pd_empty()}
			{cellSnippets}
		/>
	</div>
</div>

{#if peekProduct && peekStats}
	<div
		class="fixed inset-0 z-50 overflow-hidden"
		role="dialog"
		aria-modal="true"
		aria-label={peekProduct.title}
	>
		<div
			class="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px]"
			aria-hidden="true"
			onclick={() => (peekProduct = null)}
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
							<h3 class="truncate text-base font-bold text-gray-900">{peekProduct.title}</h3>
							<span
								class="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize {peekProduct.type ===
								'digital'
									? 'bg-emerald-100 text-emerald-800'
									: peekProduct.type === 'session'
										? 'bg-blue-100 text-blue-800'
										: 'bg-purple-100 text-purple-800'}"
							>
								{peekProduct.type}
							</span>
						</div>
						<div class="mt-0.5 truncate text-xs text-gray-500">
							{peekSeller?.name || peekProduct.sellerId} (@{peekSeller?.username || '-'})
						</div>
					</div>
					<button
						type="button"
						onclick={() => (peekProduct = null)}
						class="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200/60 hover:text-gray-700"
						aria-label={m.adx_c_close()}
					>
						<X class="h-5 w-5" />
					</button>
				</div>

				<div class="flex-1 space-y-5 overflow-y-auto p-6 text-xs">
					<div class="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
						<div class="flex items-center justify-between">
							<span class="text-gray-500">{m.adx_pd_price()}</span>
							<span class="font-mono text-base font-bold text-gray-900">
								{formatRupiah(peekProduct.price)}
							</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-gray-500">{m.adx_pd_gmv()}</span>
							<span class="font-mono font-bold text-emerald-700">
								{formatRupiah(peekStats.gmv)}
							</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-gray-500">{m.adx_pd_paid()}</span>
							<span class="font-bold text-gray-900">
								{m.adx_pd_paid_count({ count: peekStats.paidOrdersCount })}
							</span>
						</div>
					</div>

					{#if peekProduct.type === 'digital'}
						<div class="space-y-2.5 rounded-xl border border-gray-200 bg-white p-4">
							<h4
								class="flex items-center gap-1.5 text-xs font-bold tracking-wider text-gray-700 uppercase"
							>
								<FileText class="h-3.5 w-3.5 text-emerald-600" />
								{m.adx_pd_digital_head()}
							</h4>
							<div class="flex items-center justify-between border-b border-gray-100 py-1">
								<span class="text-gray-500">{m.adx_pd_filename()}</span>
								<span class="max-w-xs truncate font-medium text-gray-900">
									{peekStats.mainFileName}
								</span>
							</div>
							<div class="flex items-center justify-between border-b border-gray-100 py-1">
								<span class="text-gray-500">{m.adx_pd_storage_size()}</span>
								<span class="font-mono text-gray-900">{peekStats.formattedStorage}</span>
							</div>
							<div class="flex items-center justify-between py-1">
								<span class="text-gray-500">{m.adx_pd_mod_status()}</span>
								<span
									class="rounded px-2 py-0.5 text-[10px] font-semibold {peekModStatus === 'approved'
										? 'bg-emerald-100 text-emerald-800'
										: 'bg-amber-100 text-amber-800'}">{peekModStatus}</span
								>
							</div>
						</div>
					{:else if peekProduct.type === 'session'}
						<div class="space-y-2.5 rounded-xl border border-gray-200 bg-white p-4">
							<h4
								class="flex items-center gap-1.5 text-xs font-bold tracking-wider text-gray-700 uppercase"
							>
								<Video class="h-3.5 w-3.5 text-blue-600" />
								{m.adx_pd_session_head()}
							</h4>
							<div class="flex items-center justify-between border-b border-gray-100 py-1">
								<span class="text-gray-500">{m.adx_pd_duration()}</span>
								<span class="font-medium text-gray-900">
									{m.adx_pd_minutes_cap({ count: peekStats.durationMinutes })}
								</span>
							</div>
							<div class="flex items-center justify-between border-b border-gray-100 py-1">
								<span class="text-gray-500">{m.adx_pd_sched_upcoming()}</span>
								<span class="font-medium text-gray-900">
									{m.adx_pd_sessions({ count: peekStats.upcomingSessionsCount })}
								</span>
							</div>
							<div class="flex items-center justify-between py-1">
								<span class="text-gray-500">{m.adx_pd_video_int()}</span>
								<span class="font-medium text-emerald-700">{m.adx_pd_google_meet_auto()}</span>
							</div>
						</div>
					{:else if peekProduct.type === 'service'}
						<div class="space-y-2.5 rounded-xl border border-gray-200 bg-white p-4">
							<h4
								class="flex items-center gap-1.5 text-xs font-bold tracking-wider text-gray-700 uppercase"
							>
								<Wrench class="h-3.5 w-3.5 text-purple-600" />
								{m.adx_pd_service_head()}
							</h4>
							<div class="flex items-center justify-between border-b border-gray-100 py-1">
								<span class="text-gray-500">{m.adx_pd_in_progress()}</span>
								<span class="font-bold text-gray-900">
									{m.adx_pd_active_orders({ count: peekStats.activeOrdersCount })}
								</span>
							</div>
							<div class="flex items-center justify-between border-b border-gray-100 py-1">
								<span class="text-gray-500">{m.adx_pd_late_risk()}</span>
								<span
									class="font-semibold {peekStats.lateOrdersCount > 0
										? 'text-rose-700'
										: 'text-gray-900'}"
									>{m.adx_pd_late_count({ count: peekStats.lateOrdersCount })}</span
								>
							</div>
							<div class="flex items-center justify-between py-1">
								<span class="text-gray-500">{m.adx_pd_estimate()}</span>
								<span class="font-medium text-gray-900">
									{m.adx_pd_workdays({ count: peekProduct.serviceTimelineDays || 3 })}
								</span>
							</div>
						</div>
					{/if}

					<div class="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
						<h4 class="text-xs font-bold tracking-wider text-gray-700 uppercase">
							{m.adx_pd_moderation_head()}
						</h4>
						{#if canModerate}
							<div class="flex items-center gap-2">
								<button
									type="button"
									disabled={isSubmitting}
									onclick={() => peekProduct && handleApplyModeration(peekProduct.id, 'approved')}
									class="flex-1 rounded-lg bg-emerald-600 py-2 text-center font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
								>
									{m.adx_pd_approve()}
								</button>
								<button
									type="button"
									disabled={isSubmitting}
									onclick={() => peekProduct && suspendWithPrompt(peekProduct.id)}
									class="flex-1 rounded-lg bg-rose-600 py-2 text-center font-bold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
								>
									{m.adx_pd_suspend()}
								</button>
							</div>
							{#if actionError}
								<p
									class="rounded-lg border border-red-200 bg-red-50 p-2 text-[11px] font-semibold text-red-700"
								>
									{actionError}
								</p>
							{/if}
						{:else}
							<p class="text-[11px] leading-relaxed text-gray-500">{m.adx_pd_readonly()}</p>
						{/if}
					</div>
				</div>

				<div
					class="flex shrink-0 items-center justify-between border-t border-gray-100 bg-gray-50/80 px-6 py-3.5"
				>
					<button
						type="button"
						onclick={() => {
							if (peekSeller?.username && peekProduct?.slug)
								goto(`/${peekSeller.username}/${peekProduct.slug}`);
						}}
						class="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
					>
						<ExternalLink class="h-3.5 w-3.5" />
						{m.adx_pd_view_public()}
					</button>
					<button
						type="button"
						onclick={() => (peekProduct = null)}
						class="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-700"
					>
						{m.adx_pd_open_full()}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
