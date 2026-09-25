<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { formatRupiah } from '$lib/data/mockData';
	import { getProductPriceState } from '$lib/domain/pricing';
	import { getVisualAsset } from '$lib/domain/visualAssets';
	import { duplicateProduct as duplicateProductApi } from '$lib/domain/productsApi';
	import { isNetworkError } from '$lib/api';
	import { seller } from '$lib/stores/seller.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import * as Select from '$lib/components/ui/select';
	import {
		DataTable,
		type DataTableColumn,
		type DataTableCellContext
	} from '$lib/components/ui/data-table';
	import {
		normalizeProductType,
		type Product,
		type ProductStatus,
		type ProductType
	} from '$lib/types';
	import PageFrame from '$lib/components/common/PageFrame.svelte';
	import PageContent from '$lib/components/common/PageContent.svelte';
	import PageHeader from '$lib/components/common/PageHeader.svelte';
	import PlatformStateVisual from '$lib/components/common/PlatformStateVisual.svelte';
	import ProductTypeMeta from '$lib/components/common/ProductTypeMeta.svelte';
	import Plus from 'lucide-svelte/icons/plus';
	import Search from 'lucide-svelte/icons/search';
	import Share2 from 'lucide-svelte/icons/share-2';
	import MoreHorizontal from 'lucide-svelte/icons/more-horizontal';
	import Eye from 'lucide-svelte/icons/eye';
	import Copy from 'lucide-svelte/icons/copy';
	import PauseCircle from 'lucide-svelte/icons/pause-circle';
	import PlayCircle from 'lucide-svelte/icons/play-circle';
	import Archive from 'lucide-svelte/icons/archive';
	import Edit3 from 'lucide-svelte/icons/edit-3';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import X from 'lucide-svelte/icons/x';

	type ListFilter = 'all' | 'active' | 'draft' | 'paused';
	const PAGE_SIZE = 10;
	let filter: ListFilter = $state('all');
	let typeFilter: 'all' | ProductType = $state('all');
	let subtypeFilter = $state('all');
	let searchQuery = $state('');
	let page = $state(1);
	let menuOpenId: string | null = $state(null);
	let menuPos = $state({ top: 0, left: 0 });
	let duplicateToast: { title: string; id?: string } | null = $state(null);
	let searchTimer: ReturnType<typeof setTimeout> | undefined;
	let sortBy = $state<string | undefined>(undefined);
	let sortDir = $state<'asc' | 'desc' | undefined>(undefined);

	const safeProducts = $derived(seller.products);

	const availableSubtypes = $derived([
		...new Set(safeProducts.map((p) => p?.productSubtype).filter((s): s is string => Boolean(s)))
	]);

	$effect(() => {
		if (!menuOpenId) return;
		const close = () => (menuOpenId = null);
		window.addEventListener('click', close);
		window.addEventListener('scroll', close, true);
		window.addEventListener('resize', close);
		return () => {
			window.removeEventListener('click', close);
			window.removeEventListener('scroll', close, true);
			window.removeEventListener('resize', close);
		};
	});

	// Filter lokal: dipakai untuk fallback offline + kondisi "tidak ada hasil".
	const filteredProducts = $derived(
		safeProducts.filter((product) => {
			if (!product) return false;
			if (filter === 'active' && product.status !== 'active') return false;
			if (filter === 'draft' && product.status !== 'draft') return false;
			if (filter === 'paused' && product.status !== 'paused') return false;
			if (typeFilter !== 'all' && normalizeProductType(product.type) !== typeFilter) return false;
			if (subtypeFilter !== 'all' && product.productSubtype !== subtypeFilter) return false;
			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase();
				return (
					(product.title || '').toLowerCase().includes(q) ||
					(product.category || '').toLowerCase().includes(q) ||
					(product.productSubtype || '').toLowerCase().includes(q)
				);
			}
			return true;
		})
	);

	// --- Paginasi server ---
	const serverPage = $derived(seller.productsPage);
	const usingServer = $derived(serverPage?.server === true);
	const loading = $derived(!serverPage);

	function subtypeMatches(product: Product) {
		return subtypeFilter === 'all' || product.productSubtype === subtypeFilter;
	}

	// Subtype tidak didukung BE → saring di halaman yang sedang tampil.
	const serverItems = $derived(usingServer ? (serverPage?.items ?? []).filter(subtypeMatches) : []);

	// Paginasi client (offline / sebelum sync selesai).
	const totalItems = $derived(filteredProducts.length);
	const totalPages = $derived(Math.max(1, Math.ceil(totalItems / PAGE_SIZE)));
	const currentPage = $derived(Math.min(page, totalPages));
	const pagedProducts = $derived(
		filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
	);

	// Status paginasi gabungan (mobile & desktop).
	const viewTotal = $derived(
		serverPage ? (serverPage.server ? (serverPage.total ?? 0) : totalItems) : 0
	);
	const viewPageCount = $derived(Math.max(1, Math.ceil(viewTotal / PAGE_SIZE)));
	const viewPage = $derived(
		usingServer ? Math.min(serverPage?.page ?? 1, viewPageCount) : currentPage
	);
	const viewItems = $derived(serverPage ? (serverPage.server ? serverItems : pagedProducts) : []);
	const hasProducts = $derived(loading || safeProducts.length > 0 || viewTotal > 0);
	const noMatch = $derived(
		serverPage
			? serverPage.server
				? serverItems.length === 0
				: filteredProducts.length === 0
			: false
	);
	const rangeFrom = $derived(viewTotal === 0 ? 0 : (viewPage - 1) * PAGE_SIZE + 1);
	const rangeTo = $derived(Math.min(viewPage * PAGE_SIZE, viewTotal));

	const pageItems = $derived.by<(number | 'ellipsis')[]>(() => {
		const total = viewPageCount;
		if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
		const items: (number | 'ellipsis')[] = [1];
		const start = Math.max(2, viewPage - 1);
		const end = Math.min(total - 1, viewPage + 1);
		if (start > 2) items.push('ellipsis');
		for (let i = start; i <= end; i += 1) items.push(i);
		if (end < total - 1) items.push('ellipsis');
		items.push(total);
		return items;
	});

	/** Muat satu halaman dari BE; `fallback` dipakai saat offline. */
	function reload(targetPage = 1) {
		page = 1;
		void seller.loadProductsPage(
			{
				page: targetPage,
				limit: PAGE_SIZE,
				q: searchQuery.trim() || undefined,
				status: filter === 'all' ? undefined : filter,
				type: typeFilter === 'all' ? undefined : typeFilter,
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
		if (usingServer) reload(target);
		else page = target;
	}

	const menuProduct = $derived(safeProducts.find((p) => p?.id === menuOpenId) ?? null);

	function thumbnailOf(product: Product): string | null {
		if (Array.isArray(product.images)) {
			const valid = product.images.find((img) => typeof img === 'string' && img.trim().length > 0);
			if (valid) return valid;
		}
		if (typeof product.coverImage === 'string' && product.coverImage.trim().length > 0) {
			return product.coverImage;
		}
		return null;
	}

	function emojiFallback(product: Product) {
		return (
			product.coverEmoji ||
			(product.type === 'session' ? '💡' : product.type === 'service' ? '💼' : '📄')
		);
	}

	function subtypeFallback(product: Product) {
		return (
			product.productSubtype ||
			(product.type === 'session'
				? m.pl_subtype_session_default()
				: product.type === 'service'
					? m.pl_subtype_service_default()
					: m.pl_subtype_digital_default())
		);
	}

	async function handleDuplicate(product: Product) {
		let created: Product | null = null;
		try {
			created = await duplicateProductApi(product.id);
		} catch (e) {
			if (!isNetworkError(e)) {
				console.error('[karja] duplikat produk gagal:', e);
				return;
			}
			// BE tidak terjangkau → fallback perilaku lokal (offline).
			seller.duplicateProduct(product);
		}

		duplicateToast = {
			title: created?.title ?? `${product.title}${m.products_dup_suffix()}`,
			id: created?.id
		};
		setTimeout(() => (duplicateToast = null), 5000);

		if (created) reload(currentPage);
	}

	function handleShare(product: Product) {
		seller.shareProduct(product);
		const username = seller.sellerProfile.username;
		if (username) {
			void navigator.clipboard
				.writeText(`https://karja.id/${username}/${product.slug}`)
				.catch(() => undefined);
		}
	}

	function selectProduct(product: Product) {
		void goto(`/dashboard/products/${product.id}`);
	}

	function openMenu(event: MouseEvent, product: Product) {
		if (menuOpenId === product.id) {
			menuOpenId = null;
			return;
		}
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const width = 176;
		const margin = 8;
		const left = Math.max(margin, Math.min(rect.right - width, window.innerWidth - width - margin));
		const estimatedHeight = 280;
		let top = rect.bottom + 4;
		if (top + estimatedHeight > window.innerHeight) {
			top = Math.max(margin, rect.top - estimatedHeight - 4);
		}
		menuPos = { top, left };
		menuOpenId = product.id;
	}

	function statusOf(status: ProductStatus) {
		switch (status) {
			case 'active':
				return {
					label: m.pl_status_active(),
					dot: 'bg-[#0C7B58]',
					badge: 'bg-[#E7F5EE] text-[#0C7B58]'
				};
			case 'draft':
				return {
					label: m.pl_status_draft(),
					dot: 'bg-gray-400',
					badge: 'bg-[#F1F4F2] text-[#6B7280]'
				};
			case 'paused':
				return {
					label: m.pl_status_paused(),
					dot: 'bg-amber-500',
					badge: 'bg-amber-50 text-[#92400E]'
				};
			case 'archived':
				return {
					label: m.pl_status_archived(),
					dot: 'bg-gray-400',
					badge: 'bg-[#F1F4F2] text-[#6B7280]'
				};
		}
	}

	function resetFilters() {
		typeFilter = 'all';
		subtypeFilter = 'all';
		searchQuery = '';
		page = 1;
		reload(1);
	}

	const typeFilterItems = $derived({
		all: m.pl_filter_type_all(),
		digital: m.common_type_digital(),
		session: m.common_type_session(),
		service: m.common_type_service()
	} as Record<string, string>);

	const subtypeFilterItems = $derived(
		Object.fromEntries([
			['all', m.pl_filter_subtype_all()],
			...availableSubtypes.map((st) => [st, st])
		]) as Record<string, string>
	);

	const tabs = $derived([
		{ key: 'all' as const, label: m.pl_tab_all(), count: safeProducts.length },
		{
			key: 'active' as const,
			label: m.pl_tab_active(),
			count: safeProducts.filter((p) => p.status === 'active').length
		},
		{
			key: 'draft' as const,
			label: m.pl_tab_draft(),
			count: safeProducts.filter((p) => p.status === 'draft').length
		},
		{
			key: 'paused' as const,
			label: m.pl_tab_paused(),
			count: safeProducts.filter((p) => p.status === 'paused').length
		}
	]);

	const columns: DataTableColumn<Product>[] = [
		{
			accessorKey: 'title',
			header: m.pl_col_product(),
			enableSorting: true,
			meta: { cellClass: 'whitespace-normal!', sortKey: 'title' }
		},
		{ accessorKey: 'status', header: m.pl_col_status(), enableSorting: true },
		{
			accessorKey: 'price',
			header: m.pl_col_price(),
			enableSorting: true,
			meta: { sortKey: 'priceIdr' }
		},
		{
			id: 'transactions',
			accessorFn: (p) => p.sales ?? 0,
			header: m.pl_col_transactions(),
			enableSorting: true,
			meta: { align: 'right', sortKey: 'sales' }
		},
		{
			id: 'views',
			accessorFn: (p) => p.views ?? 0,
			header: m.pl_col_views(),
			enableSorting: true,
			meta: { align: 'right' }
		},
		{ id: 'actions', header: m.pl_col_actions(), meta: { align: 'right' } }
	];

	onMount(() => reload(1));

	onDestroy(() => {
		if (searchTimer) clearTimeout(searchTimer);
	});
</script>

{#snippet productCell(ctx: DataTableCellContext<Product>)}
	{@const product = ctx.row.original}
	<div class="flex items-center gap-3.5">
		<div
			class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#DEEAE2] bg-[#F4F9F6] shadow-2xs sm:h-14 sm:w-14"
		>
			{#if thumbnailOf(product)}
				<img
					src={thumbnailOf(product) as string}
					alt={product.title}
					class="h-full w-full object-cover"
					referrerpolicy="no-referrer"
				/>
			{:else}
				<span class="text-2xl">{emojiFallback(product)}</span>
			{/if}
		</div>
		<div class="max-w-md min-w-0 space-y-1">
			<h3
				class="line-clamp-2 text-sm leading-snug font-bold text-[#0E2E25] transition-colors group-hover:text-[#0C7B58] sm:text-[15px]"
			>
				{product.title}
			</h3>
			<div class="flex flex-wrap items-center gap-1.5 text-xs font-normal text-sage">
				<ProductTypeMeta type={product.type} subtype={subtypeFallback(product)} />
				<span class="text-[#C2D8CD] select-none">·</span>
				<span
					>{product.visibility === 'link_only'
						? m.pl_visibility_link()
						: m.pl_visibility_store()}</span
				>
			</div>
		</div>
	</div>
{/snippet}

{#snippet statusCell(ctx: DataTableCellContext<Product>)}
	{@const st = statusOf(ctx.row.original.status)}
	<span
		class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold {st.badge}"
	>
		<span class="h-1.5 w-1.5 rounded-full {st.dot}"></span>
		<span>{st.label}</span>
	</span>
{/snippet}

{#snippet priceCell(ctx: DataTableCellContext<Product>)}
	{@const product = ctx.row.original}
	{@const priceState = getProductPriceState(product)}
	{@const isFree = product.priceMode === 'free' || product.price === 0}
	<div class="space-y-0.5">
		{#if isFree}
			<span class="text-xs font-semibold text-[#0C7B58]">{m.pl_free()}</span>
		{:else}
			<div class="text-xs font-bold text-[#0E2E25] sm:text-[13px]">
				{priceState.formattedPrice}
			</div>
			{#if priceState.isPromoActive && priceState.formattedOriginalPrice}
				<div class="text-[11px] font-normal text-[#8CA399] line-through">
					{priceState.formattedOriginalPrice}
				</div>
			{/if}
		{/if}
	</div>
{/snippet}

{#snippet transactionsCell(ctx: DataTableCellContext<Product>)}
	{@const product = ctx.row.original}
	<div class="text-xs font-bold text-[#0E2E25] sm:text-[13px]">{product.sales || 0}</div>
	<div class="text-[11px] text-sage">{formatRupiah(product.revenue || 0)}</div>
{/snippet}

{#snippet viewsCell(ctx: DataTableCellContext<Product>)}
	<div class="text-xs font-bold text-[#0E2E25] sm:text-[13px]">
		{ctx.row.original.views || 0}
	</div>
{/snippet}

{#snippet actionsCell(ctx: DataTableCellContext<Product>)}
	{@const product = ctx.row.original}
	<div
		class="flex items-center justify-end gap-1"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
		role="presentation"
	>
		{#if product.status === 'active'}
			<button
				type="button"
				onclick={() => handleShare(product)}
				title={m.pl_share()}
				class="cursor-pointer rounded-lg p-1.5 text-sage opacity-0 transition-all group-hover:opacity-100 hover:bg-[#F2FAF5] hover:text-[#0C7B58]"
			>
				<Share2 class="h-4 w-4" />
			</button>
		{/if}
		<button
			type="button"
			onclick={(e) => openMenu(e, product)}
			class="cursor-pointer rounded-lg p-1.5 text-sage transition-colors hover:bg-[#F0F5F2] hover:text-[#0E2E25] {menuOpenId ===
			product.id
				? 'bg-[#F0F5F2] text-[#0E2E25]'
				: ''}"
			title={m.pl_product_options()}
		>
			<MoreHorizontal class="h-4 w-4" />
		</button>
	</div>
{/snippet}

{#snippet headerTitle()}{hasProducts ? m.pl_title() : m.pl_title_empty()}{/snippet}
{#snippet headerDesc()}{hasProducts ? m.pl_desc() : m.pl_desc_empty()}{/snippet}
{#snippet headerActions()}
	<button
		type="button"
		onclick={() => goto('/dashboard/products/new')}
		class="inline-flex cursor-pointer items-center justify-center gap-2 self-start rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#007550] sm:self-auto sm:text-sm"
	>
		<Plus class="h-4 w-4 stroke-[2.5]" />
		<span>{m.pl_create()}</span>
	</button>
{/snippet}

<PageFrame>
	<PageContent variant="standard">
		<PageHeader
			title={headerTitle}
			description={headerDesc}
			actions={hasProducts ? headerActions : undefined}
		/>

		{#if !hasProducts}
			<div class="mx-auto max-w-md space-y-6 py-12 text-center sm:py-20">
				<div class="mx-auto w-48 sm:w-56">
					<PlatformStateVisual asset={getVisualAsset('empty.products')} />
				</div>
				<div class="space-y-2">
					<h3 class="text-xl font-bold tracking-tight text-[#0E2E25] sm:text-2xl">
						{m.pl_empty_title()}
					</h3>
					<p class="mx-auto max-w-sm text-xs leading-relaxed text-sage sm:text-sm">
						{m.pl_empty_desc()}
					</p>
				</div>
				<div class="flex flex-col items-center gap-3 pt-2">
					<button
						type="button"
						onclick={() => goto('/dashboard/products/new')}
						class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#007550]"
					>
						<span>{m.pl_create()}</span>
						<ArrowRight class="h-4 w-4" />
					</button>
					<button
						type="button"
						onclick={() => goto('/dashboard/products/new/idea')}
						class="group inline-flex cursor-pointer items-center gap-1.5 py-1 text-xs font-semibold text-sage transition-colors hover:text-brand"
					>
						<span>{m.pl_guided()}</span>
						<ArrowRight class="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
					</button>
				</div>
			</div>
		{:else}
			<div
				class="overflow-hidden rounded-2xl border border-[#E5ECE7] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
			>
				<!-- Tabs -->
				<div class="border-b border-[#EFF5F1] bg-white px-5 pt-3 sm:px-6">
					<div class="-mb-[1px] no-scrollbar flex items-center gap-6 overflow-x-auto">
						{#each tabs as tab (tab.key)}
							<button
								type="button"
								onclick={() => {
									filter = tab.key;
									reload(1);
								}}
								class="relative flex cursor-pointer items-center gap-1.5 pb-3 text-xs font-semibold whitespace-nowrap transition-colors sm:text-[13px] {filter ===
								tab.key
									? 'text-[#0E2E25]'
									: 'text-sage hover:text-[#0E2E25]'}"
							>
								<span>{tab.label}</span>
								<span
									class="text-[11px] {filter === tab.key
										? 'font-medium text-brand'
										: 'font-normal text-[#8CA399]'}"
								>
									{tab.count}
								</span>
								{#if filter === tab.key}
									<span class="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-brand"></span>
								{/if}
							</button>
						{/each}
					</div>
				</div>

				<!-- Toolbar -->
				<div
					class="flex flex-col justify-between gap-2.5 border-b border-[#EFF5F1] bg-canvas px-5 py-2.5 text-xs sm:flex-row sm:items-center sm:px-6"
				>
					<div class="flex flex-wrap items-center gap-2">
						<Select.Root
							items={typeFilterItems}
							value={typeFilter}
							onValueChange={(v) => {
								if (v) {
									typeFilter = v as 'all' | ProductType;
									reload(1);
								}
							}}
						>
							<Select.Trigger
								size="sm"
								class="h-8 border-[#E5ECE7] text-xs font-semibold text-[#245344]"
							>
								<Select.Value placeholder={m.pl_filter_type_all()} />
							</Select.Trigger>
							<Select.Content>
								{#each Object.entries(typeFilterItems) as [val, label] (val)}
									<Select.Item value={val} {label}>{label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>

						{#if availableSubtypes.length > 0}
							<Select.Root
								items={subtypeFilterItems}
								value={subtypeFilter}
								onValueChange={(v) => {
									if (v) {
										subtypeFilter = v;
										reload(1);
									}
								}}
							>
								<Select.Trigger
									size="sm"
									class="h-8 border-[#E5ECE7] text-xs font-semibold text-[#245344]"
								>
									<Select.Value placeholder={m.pl_filter_subtype_all()} />
								</Select.Trigger>
								<Select.Content>
									{#each Object.entries(subtypeFilterItems) as [val, label] (val)}
										<Select.Item value={val} {label}>{label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						{/if}

						{#if typeFilter !== 'all' || subtypeFilter !== 'all' || searchQuery.trim()}
							<button
								type="button"
								onclick={resetFilters}
								class="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-sage transition-colors hover:bg-[#EDF7F1] hover:text-[#0C7B58]"
							>
								<X class="h-3 w-3" />
								<span>{m.pl_reset()}</span>
							</button>
						{/if}
					</div>

					<div class="relative w-full sm:w-60">
						<Search class="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[#8CA399]" />
						<input
							type="text"
							bind:value={searchQuery}
							oninput={onSearchInput}
							placeholder={m.pl_search()}
							class="w-full rounded-lg border border-[#E5ECE7] bg-white py-1 pr-3 pl-7.5 text-xs text-[#0E2E25] transition-all placeholder:text-[#8CA399] hover:bg-[#F6FAF8] focus:border-[#0C7B58] focus:bg-white focus:ring-1 focus:ring-[#0C7B58] focus:outline-none"
						/>
					</div>
				</div>

				{#if noMatch}
					<div class="space-y-2 p-10 text-center">
						<p class="text-sm font-bold text-[#0E2E25]">{m.pl_no_match_title()}</p>
						<p class="text-xs text-sage">{m.pl_no_match_desc()}</p>
						<button
							type="button"
							onclick={() => {
								searchQuery = '';
								filter = 'all';
								typeFilter = 'all';
								subtypeFilter = 'all';
								reload(1);
							}}
							class="cursor-pointer pt-1 text-xs font-semibold text-[#0C7B58] hover:underline"
						>
							{m.pl_reset_filter()}
						</button>
					</div>
				{:else}
					<!-- Desktop data table -->
					<div class="hidden md:block">
						<DataTable
							data={viewItems}
							{columns}
							{loading}
							pageSize={PAGE_SIZE}
							paginationMode={usingServer ? 'server' : 'client'}
							page={usingServer ? (serverPage?.page ?? 1) : undefined}
							total={usingServer ? (serverPage?.total ?? 0) : undefined}
							onPageChange={goToPage}
							{onSortChange}
							sortBy={usingServer ? sortBy : undefined}
							sortDir={usingServer ? sortDir : undefined}
							onRowClick={selectProduct}
							rowClass={() => 'group'}
							stickyHeader
							cellSnippets={{
								title: productCell,
								status: statusCell,
								price: priceCell,
								transactions: transactionsCell,
								views: viewsCell,
								actions: actionsCell
							}}
						/>
					</div>

					<!-- Mobile stacked cards -->
					<div class="md:hidden">
						<div class="divide-y divide-[#EFF5F1]">
							{#each viewItems as product (product.id)}
								{@const priceState = getProductPriceState(product)}
								{@const isFree = product.priceMode === 'free' || product.price === 0}
								{@const st = statusOf(product.status)}
								<div
									role="button"
									tabindex="0"
									onclick={() => selectProduct(product)}
									onkeydown={(e) => e.key === 'Enter' && selectProduct(product)}
									class="space-y-2.5 p-4 transition-colors hover:bg-[#F8FBF9] sm:p-5"
								>
									<div class="flex items-start gap-3">
										<div
											class="flex h-13 w-13 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#DEEAE2] bg-[#F4F9F6] shadow-2xs"
										>
											{#if thumbnailOf(product)}
												<img
													src={thumbnailOf(product) as string}
													alt={product.title}
													class="h-full w-full object-cover"
													referrerpolicy="no-referrer"
												/>
											{:else}
												<span class="text-2xl">{emojiFallback(product)}</span>
											{/if}
										</div>
										<div class="min-w-0 flex-1 space-y-0.5">
											<h3 class="line-clamp-2 text-sm leading-snug font-bold text-[#0E2E25]">
												{product.title}
											</h3>
											<div
												class="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs font-normal text-sage"
											>
												<ProductTypeMeta type={product.type} subtype={subtypeFallback(product)} />
											</div>
										</div>
									</div>

									<div class="flex flex-wrap items-center gap-1.5 text-xs text-sage">
										<span
											class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold {st.badge}"
										>
											<span class="h-1.5 w-1.5 rounded-full {st.dot}"></span>
											<span>{st.label}</span>
										</span>
										<span class="text-[#C2D8CD] select-none">·</span>
										<span
											>{product.visibility === 'link_only'
												? m.pl_visibility_link()
												: m.pl_visibility_store()}</span
										>
									</div>

									<div
										class="flex items-end justify-between border-t border-[#F2F7F4] pt-1"
										role="presentation"
										onclick={(e) => e.stopPropagation()}
										onkeydown={(e) => e.stopPropagation()}
									>
										<div class="space-y-0.5">
											<div class="text-sm font-bold text-[#0E2E25]">
												{isFree ? m.pl_free() : priceState.formattedPrice}
											</div>
											<div class="flex items-center gap-1.5 text-[11px] text-sage">
												<span>{m.pl_transactions({ count: product.sales || 0 })}</span>
												<span class="text-[#C2D8CD] select-none">·</span>
												<span>{m.pl_views_count({ count: product.views || 0 })}</span>
											</div>
										</div>
										<div class="flex items-center gap-1">
											{#if product.status === 'active'}
												<button
													type="button"
													onclick={() => handleShare(product)}
													title={m.pl_share_short()}
													class="cursor-pointer rounded-lg p-1.5 text-sage transition-all hover:bg-[#F2FAF5] hover:text-[#0C7B58]"
												>
													<Share2 class="h-4 w-4" />
												</button>
											{/if}
											<button
												type="button"
												onclick={(e) => openMenu(e, product)}
												class="cursor-pointer rounded-lg p-1.5 text-sage transition-colors hover:bg-[#F0F5F2] hover:text-[#0E2E25] {menuOpenId ===
												product.id
													? 'bg-[#F0F5F2] text-[#0E2E25]'
													: ''}"
												title={m.pl_product_options()}
											>
												<MoreHorizontal class="h-4 w-4" />
											</button>
										</div>
									</div>
								</div>
							{/each}
						</div>

						{#if viewPageCount > 1}
							<div
								class="flex flex-col items-center justify-between gap-3 border-t border-[#EFF5F1] bg-white px-5 py-3 sm:flex-row sm:px-6"
							>
								<p class="text-[11px] text-sage sm:text-xs">
									{m.pl_pagination_showing({
										from: rangeFrom,
										to: rangeTo,
										total: viewTotal
									})}
								</p>
								<nav class="flex items-center gap-1" aria-label={m.pl_pagination_label()}>
									<button
										type="button"
										onclick={() => goToPage(viewPage - 1)}
										disabled={viewPage === 1}
										aria-label={m.pl_prev_page()}
										class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#E5ECE7] text-sage transition-colors hover:bg-[#F2FAF5] hover:text-[#0C7B58] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-sage"
									>
										<ChevronLeft class="h-4 w-4" />
									</button>
									{#each pageItems as item, index (item === 'ellipsis' ? `e-${index}` : item)}
										{#if item === 'ellipsis'}
											<span class="px-1 text-xs text-[#8CA399] select-none">…</span>
										{:else}
											<button
												type="button"
												onclick={() => goToPage(item)}
												aria-current={item === viewPage ? 'page' : undefined}
												aria-label={m.pl_page_of({ page: item })}
												class="inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors {item ===
												viewPage
													? 'bg-brand text-white'
													: 'border border-[#E5ECE7] text-[#245344] hover:bg-[#F2FAF5] hover:text-[#0C7B58]'}"
											>
												{item}
											</button>
										{/if}
									{/each}
									<button
										type="button"
										onclick={() => goToPage(viewPage + 1)}
										disabled={viewPage === viewPageCount}
										aria-label={m.pl_next_page()}
										class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#E5ECE7] text-sage transition-colors hover:bg-[#F2FAF5] hover:text-[#0C7B58] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-sage"
									>
										<ChevronRight class="h-4 w-4" />
									</button>
								</nav>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</PageContent>
</PageFrame>

{#if menuProduct}
	<div
		class="fixed z-50 w-44 rounded-xl border border-[#E5ECE7] bg-white p-1 text-left text-xs shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
		style="top: {menuPos.top}px; left: {menuPos.left}px;"
	>
		<button
			type="button"
			onclick={() => {
				selectProduct(menuProduct);
				menuOpenId = null;
			}}
			class="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 font-medium text-[#0E2E25] hover:bg-[#F6FAF7]"
		>
			<Edit3 class="h-3.5 w-3.5 text-sage" />
			<span>{m.pl_edit_product()}</span>
		</button>
		<button
			type="button"
			onclick={() => {
				void goto(`/${seller.sellerProfile.username}/${menuProduct.slug}`);
				menuOpenId = null;
			}}
			class="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 font-medium text-[#0E2E25] hover:bg-[#F6FAF7]"
		>
			<Eye class="h-3.5 w-3.5 text-sage" />
			<span>{menuProduct.status === 'draft' ? m.pl_view_result() : m.pl_view_page()}</span>
		</button>
		{#if menuProduct.status === 'active'}
			<button
				type="button"
				onclick={() => {
					handleShare(menuProduct);
					menuOpenId = null;
				}}
				class="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 font-medium text-[#0E2E25] hover:bg-[#F6FAF7]"
			>
				<Share2 class="h-3.5 w-3.5 text-[#0C7B58]" />
				<span>{m.pl_share_link()}</span>
			</button>
		{/if}
		<button
			type="button"
			onclick={() => {
				handleDuplicate(menuProduct);
				menuOpenId = null;
			}}
			class="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 font-medium text-[#0E2E25] hover:bg-[#F6FAF7]"
		>
			<Copy class="h-3.5 w-3.5 text-sage" />
			<span>{m.pl_duplicate()}</span>
		</button>
		{#if menuProduct.status !== 'draft'}
			<button
				type="button"
				onclick={() => {
					seller.toggleProductStatus(menuProduct.id);
					menuOpenId = null;
				}}
				class="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 font-medium text-[#0E2E25] hover:bg-[#F6FAF7]"
			>
				{#if menuProduct.status === 'active'}
					<PauseCircle class="h-3.5 w-3.5 text-amber-600" />
					<span>{m.pl_pause()}</span>
				{:else}
					<PlayCircle class="h-3.5 w-3.5 text-[#0C7B58]" />
					<span>{m.pl_activate()}</span>
				{/if}
			</button>
		{/if}
		<div class="my-1 h-px bg-[#EFF5F1]"></div>
		<button
			type="button"
			onclick={() => {
				seller.archiveProduct(menuProduct.id);
				menuOpenId = null;
			}}
			class="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 font-medium text-rose-600 hover:bg-rose-50"
		>
			<Archive class="h-3.5 w-3.5 text-rose-500" />
			<span>{m.pl_archive()}</span>
		</button>
	</div>
{/if}

{#if duplicateToast}
	<div
		class="fixed right-6 bottom-6 z-50 flex items-center gap-3 rounded-xl border border-[#205847] bg-ink px-4 py-3 text-xs text-white shadow-xl"
	>
		<span>{m.pl_dup_toast()}</span>
		<button
			type="button"
			onclick={() => {
				const draftId =
					duplicateToast?.id ?? seller.products.find((p) => p.title === duplicateToast?.title)?.id;
				if (draftId) void goto(`/dashboard/products/${draftId}`);
				duplicateToast = null;
			}}
			class="cursor-pointer font-bold text-[#DEF766] hover:underline"
		>
			{m.pl_dup_open()}
		</button>
		<button
			type="button"
			onclick={() => (duplicateToast = null)}
			class="cursor-pointer rounded p-0.5 text-[#8CA399] hover:text-white"
			aria-label={m.pl_close_notification()}
		>
			<X class="h-3.5 w-3.5" />
		</button>
	</div>
{/if}
