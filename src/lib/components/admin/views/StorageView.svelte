<script lang="ts">
	import { goto } from '$app/navigation';
	import { admin } from '$lib/stores/admin.svelte';
	import { hasPermission } from '$lib/domain/adminDomain';
	import {
		formatBytes,
		getCategoryLabel,
		getCategoryBadgeStyle,
		getStorageOverviewMetrics,
		getStorageByCategory,
		getStorageGrowthTimeline,
		isOrphanedFile
	} from '$lib/domain/fileStorage';
	import { m } from '$lib/paraglide/messages.js';
	import { DEFAULT_STORAGE_CAPACITY_CONFIG } from '$lib/types/fileAsset';
	import type { FileAsset, FileAssetStatus } from '$lib/types/admin';
	import type { ChartConfiguration } from 'chart.js';
	import ChartCanvas from '$lib/components/charts/ChartCanvas.svelte';
	import * as Select from '$lib/components/ui/select';
	import Search from 'lucide-svelte/icons/search';
	import FileText from 'lucide-svelte/icons/file-text';
	import Image from 'lucide-svelte/icons/image';
	import FileArchive from 'lucide-svelte/icons/file-archive';
	import FileCode from 'lucide-svelte/icons/file-code';
	import FileSpreadsheet from 'lucide-svelte/icons/file-spreadsheet';

	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import CheckCircle2 from 'lucide-svelte/icons/check-circle-2';
	import ShieldAlert from 'lucide-svelte/icons/shield-alert';
	import Lock from 'lucide-svelte/icons/lock';
	import Globe from 'lucide-svelte/icons/globe';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import X from 'lucide-svelte/icons/x';
	import Ban from 'lucide-svelte/icons/ban';

	let searchQuery = $state('');
	let categoryFilter = $state<string>('all');
	let accessFilter = $state<string>('all');
	let statusFilter = $state<string>('all');
	let sellerFilter = $state<string>('all');
	let problemFilter = $state<boolean>(false);
	let timeRange = $state<'30d' | '90d' | '12m'>('30d');
	const ranges = ['30d', '90d', '12m'] as const;
	let selectedFile = $state<FileAsset | null>(null);
	let quarantineReason = $state('');
	let isQuarantineModalOpen = $state(false);
	let showRestrictedContent = $state(false);

	const canViewRestricted = $derived(hasPermission(admin.adminUser, 'storage.view_restricted'));
	const canManageStorage = $derived(hasPermission(admin.adminUser, 'storage.manage'));

	const entityContext = $derived({
		products: admin.platformProducts.map((p) => ({ id: p.id })),
		orders: admin.platformOrders.map((o) => ({ id: o.id })),
		sellers: admin.platformSellers.map((s) => ({ id: s.id, username: s.username }))
	});

	const capacityConfig = DEFAULT_STORAGE_CAPACITY_CONFIG;

	const metrics = $derived(
		getStorageOverviewMetrics(admin.platformFiles, capacityConfig, entityContext)
	);

	const categoryBreakdown = $derived(getStorageByCategory(admin.platformFiles));

	const growthTimeline = $derived(getStorageGrowthTimeline(admin.platformFiles, timeRange));

	const availableFileCount = $derived(
		admin.platformFiles.filter((f) => f.status === 'available').length
	);

	const filteredFiles = $derived(
		admin.platformFiles.filter((file) => {
			if (problemFilter) {
				const isProblem =
					file.status === 'failed' ||
					file.status === 'quarantined' ||
					isOrphanedFile(file, entityContext);
				if (!isProblem) return false;
			}

			if (statusFilter !== 'all' && file.status !== statusFilter) return false;
			if (categoryFilter !== 'all' && file.category !== categoryFilter) return false;
			if (accessFilter !== 'all' && file.accessLevel !== accessFilter) return false;

			if (sellerFilter !== 'all') {
				const match =
					file.ownerSellerId === sellerFilter ||
					file.ownerSellerId === `seller_${sellerFilter}` ||
					(file.ownerSellerId &&
						file.ownerSellerId.toLowerCase().includes(sellerFilter.toLowerCase()));
				if (!match) return false;
			}

			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase();
				const matchName = file.originalName.toLowerCase().includes(q);
				const matchId = file.id.toLowerCase().includes(q);
				const matchKey = file.objectKey.toLowerCase().includes(q);
				const matchOwner = (file.ownerSellerId || '').toLowerCase().includes(q);
				const matchEntity = (file.linkedEntityId || '').toLowerCase().includes(q);
				return matchName || matchId || matchKey || matchOwner || matchEntity;
			}

			return true;
		})
	);

	const hasActiveFilters = $derived(
		categoryFilter !== 'all' ||
			accessFilter !== 'all' ||
			statusFilter !== 'all' ||
			sellerFilter !== 'all' ||
			problemFilter ||
			searchQuery !== ''
	);

	const categoryFilterItems = $derived<Record<string, string>>({
		all: m.ady_st_cat_all(),
		product_file: m.ady_st_cat_product_file(),
		service_delivery: m.ady_st_cat_service_delivery(),
		service_buyer_input: m.ady_st_cat_service_buyer_input(),
		verification_document: m.ady_st_cat_verification_document(),
		product_image: m.ady_st_cat_product_image(),
		store_asset: m.ady_st_cat_store_asset(),
		blog_asset: m.ady_st_cat_blog_asset()
	});

	const accessFilterItems = $derived<Record<string, string>>({
		all: m.ady_st_access_all(),
		public: m.ady_st_access_public(),
		private: m.ady_st_access_private(),
		restricted: m.ady_st_access_restricted()
	});

	const statusFilterItems = $derived<Record<string, string>>({
		all: m.ady_st_status_all(),
		available: m.ady_st_status_available(),
		quarantined: m.ady_st_status_quarantined(),
		failed: m.ady_st_status_failed(),
		deleted: m.ady_st_status_deleted()
	});

	const sellerFilterItems = $derived<Record<string, string>>({
		all: m.ady_st_seller_all(),
		...Object.fromEntries(
			admin.platformSellers.map((s) => [String(s.id || s.username), `${s.name} (@${s.username})`])
		)
	});

	function fileIconClass(mimeType: string, extension?: string): string {
		const ext = (extension || '').toLowerCase();
		if (mimeType.startsWith('image/')) return 'text-emerald-600';
		if (ext === 'zip' || ext === 'rar' || ext === '7z' || ext === 'tar') return 'text-amber-600';
		if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') return 'text-teal-600';
		if (ext === 'pdf') return 'text-rose-600';
		if (ext === 'js' || ext === 'ts' || ext === 'json' || ext === 'html') return 'text-indigo-600';
		return 'text-[#52776C]';
	}

	const modalIconCls = $derived(
		selectedFile ? fileIconClass(selectedFile.mimeType, selectedFile.extension) : 'text-[#52776C]'
	);
	const modalExt = $derived(selectedFile ? (selectedFile.extension || '').toLowerCase() : '');

	function sellerNameFor(ownerSellerId?: string): string {
		if (!ownerSellerId) return '';
		const found = admin.platformSellers.find(
			(s) => s.id === ownerSellerId || s.username === ownerSellerId
		);
		return found?.name || ownerSellerId;
	}

	function gotoSellerStore(ownerSellerId: string) {
		const found = admin.platformSellers.find(
			(s) => s.id === ownerSellerId || s.username === ownerSellerId
		);
		const username = found?.username || ownerSellerId.replace(/^seller_/, '').replace(/^@/, '');
		void goto(`/${username}`);
	}

	function gotoLinkedEntity(file: FileAsset) {
		if (file.linkedEntityType === 'product') void goto('/admin/products');
		else if (file.linkedEntityType === 'order') void goto('/admin/orders');
		else if (file.linkedEntityType === 'seller' && file.linkedEntityId) {
			gotoSellerStore(file.linkedEntityId);
		}
	}

	function openInspection(file: FileAsset) {
		selectedFile = file;
		showRestrictedContent = false;
		isQuarantineModalOpen = false;
		quarantineReason = '';
	}

	function handleApplyStatus(newStatus: FileAssetStatus, reason?: string) {
		if (!selectedFile) return;
		admin.updateFileStatus(selectedFile.id, newStatus, reason);
		selectedFile = { ...selectedFile, status: newStatus };
		isQuarantineModalOpen = false;
		quarantineReason = '';
	}

	function clearAllFilters() {
		categoryFilter = 'all';
		accessFilter = 'all';
		statusFilter = 'all';
		sellerFilter = 'all';
		problemFilter = false;
		searchQuery = '';
	}

	const growthChart = $derived<ChartConfiguration<'line'>>({
		type: 'line',
		data: {
			labels: growthTimeline.map((p) => p.label),
			datasets: [
				{
					label: m.ady_st_growth_title(),
					data: growthTimeline.map((p) => p.cumulativeBytes),
					borderColor: '#0C7B58',
					backgroundColor: 'rgba(12, 123, 88, 0.18)',
					borderWidth: 2,
					fill: true,
					pointRadius: 0,
					pointHoverRadius: 4
				}
			]
		},
		options: {
			interaction: { mode: 'index', intersect: false },
			plugins: {
				tooltip: {
					backgroundColor: '#0E2922',
					padding: 10,
					cornerRadius: 10,
					titleFont: { weight: 700 },
					displayColors: false,
					callbacks: {
						title: (items) => (items[0] ? (growthTimeline[items[0].dataIndex]?.date ?? '') : ''),
						label: (ctx) => formatBytes(Number(ctx.parsed.y)),
						footer: (items) => {
							const p = items[0] ? growthTimeline[items[0].dataIndex] : undefined;
							return p ? m.ady_st_tooltip_files({ count: p.fileCount }) : '';
						}
					}
				}
			},
			scales: {
				x: {
					grid: { display: false },
					border: { display: false },
					ticks: { autoSkip: true, maxTicksLimit: 8 }
				},
				y: {
					beginAtZero: true,
					grid: { color: '#F0F4F2', drawTicks: false },
					border: { display: false },
					ticks: { callback: (v) => formatBytes(Number(v)) }
				}
			}
		}
	});

	function onEscape(e: KeyboardEvent) {
		if (e.key === 'Escape') selectedFile = null;
	}
</script>

<svelte:window onkeydown={onEscape} />

<div class="max-w-7xl space-y-6">
	<div
		class="flex flex-col justify-between gap-3 border-b border-[#E4EBE7] pb-4 sm:flex-row sm:items-center"
	>
		<div>
			<div class="flex items-center gap-2">
				<h1 class="text-xl font-bold tracking-tight text-[#0E2E25]">{m.ady_st_title()}</h1>
				<span
					class="rounded-full border border-[#CCE6D6] bg-[#EBF5F0] px-2 py-0.5 text-[11px] font-semibold text-[#0C7B58]"
				>
					{m.ady_st_version_badge()}
				</span>
			</div>
			<p class="mt-0.5 text-xs text-[#52776C]">{m.ady_st_subtitle()}</p>
		</div>

		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={() => (problemFilter = !problemFilter)}
				aria-pressed={problemFilter}
				class="flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all {problemFilter
					? 'border-amber-600 bg-amber-600 text-white shadow-xs'
					: 'border-[#E4EBE7] bg-white text-[#52776C] hover:bg-[#F8FAF9]'}"
			>
				<AlertTriangle class="h-3.5 w-3.5" />
				<span>{m.ady_st_problem_toggle({ count: metrics.problematicFilesCount })}</span>
			</button>
		</div>
	</div>

	<div class="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
		<div
			class="rounded-xl border border-[#E4EBE7] bg-white p-4 transition-shadow hover:shadow-sm sm:p-5"
		>
			<div class="mb-2 flex items-center justify-between gap-2">
				<span class="truncate text-xs font-medium tracking-tight text-[#52776C]">
					{m.ady_st_metric_storage()}
				</span>
				<span
					class="rounded-full border border-[#D0E6DC] bg-[#EBF5F0] px-2 py-0.5 text-[10px] font-semibold text-[#0C7B58]"
				>
					{metrics.alertLevel === 'normal'
						? m.ady_st_alert_healthy()
						: metrics.alertLevel.toUpperCase()}
				</span>
			</div>
			<div class="flex items-baseline justify-between gap-2">
				<div class="font-sans text-xl font-bold tracking-tight text-[#0E2E25] sm:text-2xl">
					{formatBytes(metrics.usedBytes)}
				</div>
			</div>
			<div class="mt-2 flex items-center gap-2 text-xs">
				<span class="truncate text-[11px] text-[#698E82]">
					{m.ady_st_metric_storage_sub({
						percent: metrics.usagePercent,
						capacity: formatBytes(metrics.capacityBytes)
					})}
				</span>
			</div>
		</div>

		<div
			class="rounded-xl border border-[#E4EBE7] bg-white p-4 transition-shadow hover:shadow-sm sm:p-5"
		>
			<div class="mb-2 flex items-center justify-between gap-2">
				<span class="truncate text-xs font-medium tracking-tight text-[#52776C]">
					{m.ady_st_metric_files()}
				</span>
				<span
					class="rounded-full border border-[#D0E6DC] bg-[#EBF5F0] px-2 py-0.5 text-[10px] font-semibold text-[#0C7B58]"
				>
					{m.ady_st_metric_files_badge()}
				</span>
			</div>
			<div class="flex items-baseline justify-between gap-2">
				<div class="font-sans text-xl font-bold tracking-tight text-[#0E2E25] sm:text-2xl">
					{metrics.totalFilesCount.toLocaleString('id-ID')}
				</div>
			</div>
			<div class="mt-2 flex items-center gap-2 text-xs">
				<span class="truncate text-[11px] text-[#698E82]">
					{m.ady_st_metric_files_sub({ count: availableFileCount })}
				</span>
			</div>
		</div>

		<div
			class="rounded-xl border border-[#E4EBE7] bg-white p-4 transition-shadow hover:shadow-sm sm:p-5"
		>
			<div class="mb-2 flex items-center justify-between gap-2">
				<span class="truncate text-xs font-medium tracking-tight text-[#52776C]">
					{m.ady_st_metric_uploads()}
				</span>
				<div
					class="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F0F7F3] text-[#0C7B58]"
				>
					<CheckCircle2 class="h-4 w-4" />
				</div>
			</div>
			<div class="flex items-baseline justify-between gap-2">
				<div class="font-sans text-xl font-bold tracking-tight text-[#0E2E25] sm:text-2xl">
					{metrics.monthlyUploadsCount.toLocaleString('id-ID')}
				</div>
			</div>
			<div class="mt-2 flex items-center gap-2 text-xs">
				<span class="truncate text-[11px] text-[#698E82]">
					{formatBytes(metrics.monthlyUploadsBytes)}
				</span>
			</div>
		</div>

		<div
			class="rounded-xl border border-[#E4EBE7] bg-white p-4 transition-shadow hover:shadow-sm sm:p-5"
		>
			<div class="mb-2 flex items-center justify-between gap-2">
				<span class="truncate text-xs font-medium tracking-tight text-[#52776C]">
					{m.ady_st_metric_problems()}
				</span>
				<span
					class="rounded-full border border-[#D0E6DC] bg-[#EBF5F0] px-2 py-0.5 text-[10px] font-semibold text-[#0C7B58]"
				>
					{metrics.problematicFilesCount === 0
						? m.ady_st_metric_problems_badge_zero()
						: m.ady_st_metric_problems_badge_issues()}
				</span>
			</div>
			<div class="flex items-baseline justify-between gap-2">
				<div class="font-sans text-xl font-bold tracking-tight text-[#0E2E25] sm:text-2xl">
					{metrics.problematicFilesCount}
				</div>
			</div>
			<div class="mt-2 flex items-center gap-2 text-xs">
				<span class="truncate text-[11px] text-[#698E82]">
					{m.ady_st_metric_problems_sub({
						quarantined: metrics.quarantinedFilesCount,
						failed: metrics.failedUploadsCount
					})}
				</span>
			</div>
		</div>
	</div>

	<div class="space-y-3.5 rounded-2xl border border-[#E4EBE7] bg-white p-5 shadow-xs">
		<div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
			<div>
				<h2 class="flex items-center gap-2 text-sm font-bold text-[#0E2E25]">
					<span>{m.ady_st_capacity_title()}</span>
					<span
						class="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-normal text-slate-600"
					>
						{m.ady_st_capacity_badge()}
					</span>
				</h2>
				<p class="mt-0.5 text-xs text-[#52776C]">{m.ady_st_capacity_desc()}</p>
			</div>

			<div class="text-right">
				<span class="font-mono text-xs font-bold text-[#0E2E25]">
					{formatBytes(metrics.usedBytes)}
				</span>
				<span class="text-xs text-[#52776C]">
					/ {formatBytes(metrics.capacityBytes)} ({metrics.usagePercent}%)
				</span>
				<p class="text-[11px] font-medium text-[#0C7B58]">
					{m.ady_st_available_line({ bytes: formatBytes(metrics.availableBytes) })}
				</p>
			</div>
		</div>

		<div
			class="flex h-3 w-full overflow-hidden rounded-full border border-[#D0E6DC] bg-[#EBF5F0]"
			role="progressbar"
			aria-valuenow={metrics.usagePercent}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-label={m.ady_st_capacity_title()}
		>
			<div
				class="h-full transition-all duration-500 {metrics.alertLevel === 'critical'
					? 'bg-rose-600'
					: metrics.alertLevel === 'high'
						? 'bg-amber-500'
						: 'bg-[#0C7B58]'}"
				style="width: {Math.max(1, metrics.usagePercent)}%"
			></div>
		</div>

		<div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-[11px] text-[#52776C]">
			{#each categoryBreakdown.slice(0, 5) as cat (cat.category)}
				<div class="flex items-center gap-1.5">
					<span class="h-2 w-2 rounded-full bg-[#0C7B58]"></span>
					<span>
						{cat.label}:
						<strong class="font-mono text-[#0E2E25]">{formatBytes(cat.totalBytes)}</strong>
						({cat.percentage}%)
					</span>
				</div>
			{/each}
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<div class="space-y-4 rounded-2xl border border-[#E4EBE7] bg-white p-5 shadow-xs">
			<div class="flex items-center justify-between border-b border-[#E4EBE7] pb-3">
				<div>
					<h3 class="text-sm font-bold text-[#0E2E25]">{m.ady_st_dist_title()}</h3>
					<p class="text-xs text-[#52776C]">{m.ady_st_dist_desc()}</p>
				</div>
				{#if categoryFilter !== 'all'}
					<button
						type="button"
						onclick={() => (categoryFilter = 'all')}
						class="cursor-pointer text-[11px] font-semibold text-[#0C7B58] hover:underline"
					>
						{m.ady_st_reset_filter()}
					</button>
				{/if}
			</div>

			<div class="space-y-2.5">
				{#each categoryBreakdown as cat (cat.category)}
					{@const isSelected = categoryFilter === cat.category}
					<button
						type="button"
						onclick={() => (categoryFilter = isSelected ? 'all' : cat.category)}
						aria-pressed={isSelected}
						class="flex w-full cursor-pointer items-center justify-between rounded-xl border p-2.5 text-left transition-all {isSelected
							? 'border-[#0C7B58] bg-[#EBF5F0] shadow-xs ring-1 ring-[#0C7B58]'
							: 'border-[#E4EBE7] hover:bg-[#F8FAF9]'}"
					>
						<div class="min-w-0">
							<p class="truncate text-xs font-semibold text-[#0E2E25]">{cat.label}</p>
							<p class="text-[11px] text-[#52776C]">{cat.fileCount} file</p>
						</div>
						<div class="shrink-0 text-right">
							<p class="font-mono text-xs font-bold text-[#0E2E25]">
								{formatBytes(cat.totalBytes)}
							</p>
							<p class="text-[11px] text-[#698E82]">{cat.percentage}%</p>
						</div>
					</button>
				{/each}
			</div>
		</div>

		<div class="space-y-4 rounded-2xl border border-[#E4EBE7] bg-white p-5 shadow-xs lg:col-span-2">
			<div
				class="flex flex-col justify-between gap-2 border-b border-[#E4EBE7] pb-3 sm:flex-row sm:items-center"
			>
				<div>
					<h3 class="text-sm font-bold text-[#0E2E25]">{m.ady_st_growth_title()}</h3>
					<p class="text-xs text-[#52776C]">{m.ady_st_growth_desc()}</p>
				</div>
				<div
					class="flex items-center gap-1 rounded-xl border border-[#D0E6DC] bg-[#EBF5F0] p-1 text-xs"
					role="group"
					aria-label={m.ady_st_growth_title()}
				>
					{#each ranges as t (t)}
						<button
							type="button"
							onclick={() => (timeRange = t)}
							aria-pressed={timeRange === t}
							class="cursor-pointer rounded-lg px-3 py-1 text-xs font-semibold transition-colors {timeRange ===
							t
								? 'bg-white text-[#0E2E25] shadow-xs'
								: 'text-[#52776C] hover:text-[#0E2E25]'}"
						>
							{t === '30d'
								? m.ady_st_range_30d()
								: t === '90d'
									? m.ady_st_range_90d()
									: m.ady_st_range_12m()}
						</button>
					{/each}
				</div>
			</div>

			<ChartCanvas config={growthChart} height={240} />
		</div>
	</div>

	<div class="space-y-3 rounded-2xl border border-[#E4EBE7] bg-white p-4 shadow-xs">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div class="relative min-w-[240px] flex-1">
				<Search class="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[#52776C]" />
				<label for="storage-search" class="sr-only">{m.ady_st_search_ph()}</label>
				<input
					id="storage-search"
					type="text"
					bind:value={searchQuery}
					placeholder={m.ady_st_search_ph()}
					class="w-full rounded-xl border border-[#E4EBE7] bg-[#F8FAF9] py-2 pr-3 pl-9 text-xs text-[#0E2E25] focus:ring-1 focus:ring-[#0C7B58] focus:outline-none"
				/>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<label for="storage-cat-filter" class="sr-only">{m.ady_st_cat_all()}</label>
				<Select.Root
					items={categoryFilterItems}
					value={categoryFilter}
					onValueChange={(v) => v && (categoryFilter = v)}
				>
					<Select.Trigger
						id="storage-cat-filter"
						size="sm"
						class="h-8 rounded-xl border-[#E4EBE7] bg-[#F8FAF9] text-xs text-[#0E2E25]"
					>
						<Select.Value placeholder={m.ady_st_cat_all()} />
					</Select.Trigger>
					<Select.Content>
						{#each Object.entries(categoryFilterItems) as [val, label] (val)}
							<Select.Item value={val} {label}>{label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>

				<label for="storage-access-filter" class="sr-only">{m.ady_st_access_all()}</label>
				<Select.Root
					items={accessFilterItems}
					value={accessFilter}
					onValueChange={(v) => v && (accessFilter = v)}
				>
					<Select.Trigger
						id="storage-access-filter"
						size="sm"
						class="h-8 rounded-xl border-[#E4EBE7] bg-[#F8FAF9] text-xs text-[#0E2E25]"
					>
						<Select.Value placeholder={m.ady_st_access_all()} />
					</Select.Trigger>
					<Select.Content>
						{#each Object.entries(accessFilterItems) as [val, label] (val)}
							<Select.Item value={val} {label}>{label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>

				<label for="storage-status-filter" class="sr-only">{m.ady_st_status_all()}</label>
				<Select.Root
					items={statusFilterItems}
					value={statusFilter}
					onValueChange={(v) => v && (statusFilter = v)}
				>
					<Select.Trigger
						id="storage-status-filter"
						size="sm"
						class="h-8 rounded-xl border-[#E4EBE7] bg-[#F8FAF9] text-xs text-[#0E2E25]"
					>
						<Select.Value placeholder={m.ady_st_status_all()} />
					</Select.Trigger>
					<Select.Content>
						{#each Object.entries(statusFilterItems) as [val, label] (val)}
							<Select.Item value={val} {label}>{label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>

				<label for="storage-seller-filter" class="sr-only">{m.ady_st_seller_all()}</label>
				<Select.Root
					items={sellerFilterItems}
					value={sellerFilter}
					onValueChange={(v) => v && (sellerFilter = v)}
				>
					<Select.Trigger
						id="storage-seller-filter"
						size="sm"
						class="h-8 rounded-xl border-[#E4EBE7] bg-[#F8FAF9] text-xs text-[#0E2E25]"
					>
						<Select.Value placeholder={m.ady_st_seller_all()} />
					</Select.Trigger>
					<Select.Content>
						{#each Object.entries(sellerFilterItems) as [val, label] (val)}
							<Select.Item value={val} {label}>{label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		</div>

		<div class="flex items-center justify-between pt-1 text-[11px] text-[#52776C]">
			<span>
				{m.ady_st_showing({ shown: filteredFiles.length, total: admin.platformFiles.length })}
			</span>
			{#if hasActiveFilters}
				<button
					type="button"
					onclick={clearAllFilters}
					class="cursor-pointer font-semibold text-[#0C7B58] hover:underline"
				>
					{m.ady_st_clear_filters()}
				</button>
			{/if}
		</div>
	</div>

	<div class="overflow-hidden rounded-2xl border border-[#E4EBE7] bg-white shadow-xs">
		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs">
				<thead
					class="border-b border-[#E4EBE7] bg-[#F8FAF9] text-[11px] font-semibold tracking-wider text-[#52776C] uppercase"
				>
					<tr>
						<th class="px-4 py-3.5">{m.ady_st_th_name()}</th>
						<th class="px-4 py-3.5">{m.ady_st_th_category()}</th>
						<th class="px-4 py-3.5">{m.ady_st_th_size()}</th>
						<th class="px-4 py-3.5">{m.ady_st_th_owner()}</th>
						<th class="px-4 py-3.5">{m.ady_st_th_entity()}</th>
						<th class="px-4 py-3.5">{m.ady_st_th_status()}</th>
						<th class="px-4 py-3.5 text-right">{m.ady_st_th_action()}</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-[#E4EBE7] text-[#0E2E25]">
					{#if filteredFiles.length === 0}
						<tr>
							<td colspan={7} class="px-4 py-12 text-center text-xs text-[#52776C]">
								<p class="font-semibold text-[#0E2E25]">{m.ady_st_empty_title()}</p>
								<p class="mt-0.5 text-[11px]">{m.ady_st_empty_desc()}</p>
							</td>
						</tr>
					{:else}
						{#each filteredFiles as file (file.id)}
							{@const badgeStyle = getCategoryBadgeStyle(file.category)}
							{@const isOrphan = isOrphanedFile(file, entityContext)}
							{@const iconCls = fileIconClass(file.mimeType, file.extension)}
							{@const ext = (file.extension || '').toLowerCase()}
							<tr class="transition-colors hover:bg-[#F8FAF9]">
								<td class="max-w-xs px-4 py-3.5">
									<div class="flex items-start gap-2.5">
										<div
											class="mt-0.5 shrink-0 rounded-xl border border-[#E4EBE7] bg-[#F8FAF9] p-2 {iconCls}"
										>
											{#if file.mimeType.startsWith('image/')}
												<Image class="h-4 w-4" />
											{:else if ext === 'zip' || ext === 'rar' || ext === '7z' || ext === 'tar'}
												<FileArchive class="h-4 w-4" />
											{:else if ext === 'xlsx' || ext === 'xls' || ext === 'csv'}
												<FileSpreadsheet class="h-4 w-4" />
											{:else if ext === 'pdf'}
												<FileText class="h-4 w-4" />
											{:else if ext === 'js' || ext === 'ts' || ext === 'json' || ext === 'html'}
												<FileCode class="h-4 w-4" />
											{:else}
												<FileText class="h-4 w-4" />
											{/if}
										</div>
										<div class="min-w-0">
											<p
												class="truncate text-xs font-semibold text-[#0E2E25]"
												title={file.originalName}
											>
												{file.originalName}
											</p>
											<p
												class="truncate font-mono text-[11px] text-[#698E82]"
												title={file.objectKey}
											>
												{file.id}
											</p>
											{#if file.extension}
												<span class="font-mono text-[10px] font-semibold text-[#52776C] uppercase">
													{file.extension} • {file.mimeType}
												</span>
											{/if}
										</div>
									</div>
								</td>

								<td class="px-4 py-3.5">
									<div class="space-y-1">
										<span
											class="inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold {badgeStyle.bg} {badgeStyle.text} {badgeStyle.border}"
										>
											{getCategoryLabel(file.category)}
										</span>
										<div class="flex items-center gap-1 text-[11px]">
											{#if file.accessLevel === 'public'}
												<span class="inline-flex items-center gap-1 text-slate-600">
													<Globe class="h-3 w-3 text-slate-500" /> Public
												</span>
											{:else if file.accessLevel === 'private'}
												<span class="inline-flex items-center gap-1 text-indigo-700">
													<Lock class="h-3 w-3 text-indigo-600" /> Private
												</span>
											{:else if file.accessLevel === 'restricted'}
												<span class="inline-flex items-center gap-1 font-semibold text-amber-800">
													<ShieldAlert class="h-3 w-3 text-amber-700" /> Restricted
												</span>
											{/if}
										</div>
									</div>
								</td>

								<td class="px-4 py-3.5 font-mono font-semibold text-[#0E2E25]">
									{formatBytes(file.sizeBytes)}
								</td>

								<td class="px-4 py-3.5">
									{#if file.ownerSellerId}
										<button
											type="button"
											onclick={() => gotoSellerStore(file.ownerSellerId ?? '')}
											class="group block cursor-pointer text-left"
										>
											<span
												class="block font-semibold text-[#0E2E25] group-hover:text-[#0C7B58] group-hover:underline"
											>
												{sellerNameFor(file.ownerSellerId)}
											</span>
											<span class="font-mono text-[10px] text-[#698E82]">
												{file.ownerSellerId}
											</span>
										</button>
									{:else}
										<span class="font-mono text-[11px] text-[#698E82] capitalize">
											{file.ownerType}
										</span>
									{/if}
								</td>

								<td class="px-4 py-3.5">
									{#if file.linkedEntityType !== 'none' && file.linkedEntityId}
										<div class="text-xs">
											<span class="block text-[10px] font-semibold text-[#52776C] capitalize">
												{file.linkedEntityType}
											</span>
											{#if file.linkedEntityType === 'product' || file.linkedEntityType === 'order' || file.linkedEntityType === 'seller'}
												<button
													type="button"
													onclick={() => gotoLinkedEntity(file)}
													class="cursor-pointer font-mono text-[11px] text-[#0E2E25] hover:text-[#0C7B58] hover:underline"
												>
													{file.linkedEntityId}
												</button>
											{:else}
												<span class="font-mono text-[11px] text-[#0E2E25]">
													{file.linkedEntityId}
												</span>
											{/if}
											{#if isOrphan}
												<span class="mt-0.5 block text-[10px] font-semibold text-amber-700">
													{m.ady_st_orphaned()}
												</span>
											{/if}
										</div>
									{:else}
										<span class="text-[11px] font-semibold text-amber-700">
											{m.ady_st_unlinked()}
										</span>
									{/if}
								</td>

								<td class="px-4 py-3.5">
									<span
										class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold {file.status ===
										'available'
											? 'border border-[#CCE6D6] bg-[#EBF5F0] text-[#0C7B58]'
											: file.status === 'quarantined'
												? 'border border-red-200 bg-red-50 text-red-700'
												: file.status === 'failed'
													? 'border border-amber-200 bg-amber-50 text-amber-800'
													: 'border border-slate-200 bg-slate-100 text-slate-600'}"
									>
										{#if file.status === 'available'}
											<CheckCircle2 class="h-3.5 w-3.5 text-[#0C7B58]" />
										{:else if file.status === 'quarantined'}
											<Ban class="h-3.5 w-3.5 text-red-600" />
										{:else if file.status === 'failed'}
											<AlertCircle class="h-3.5 w-3.5 text-amber-700" />
										{:else if file.status === 'deleted'}
											<Trash2 class="h-3.5 w-3.5 text-slate-500" />
										{/if}
										{file.status === 'available'
											? m.ady_st_badge_available()
											: file.status === 'quarantined'
												? m.ady_st_badge_quarantine()
												: file.status === 'failed'
													? m.ady_st_badge_failed()
													: m.ady_st_badge_deleted()}
									</span>
								</td>

								<td class="px-4 py-3.5 text-right">
									<button
										type="button"
										onclick={() => openInspection(file)}
										class="cursor-pointer rounded-lg border border-[#D0E6DC] bg-[#EBF5F0] px-3 py-1.5 text-xs font-semibold text-[#0C7B58] transition-all hover:bg-[#0C7B58] hover:text-white"
									>
										{m.ady_st_inspect()}
									</button>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>

	{#if selectedFile}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#0E2E25]/60 p-3 backdrop-blur-xs sm:p-6"
			role="presentation"
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-label={selectedFile.originalName}
				class="my-auto w-full max-w-2xl space-y-5 rounded-2xl border border-[#E4EBE7] bg-white p-6 text-left shadow-2xl"
			>
				<div class="flex items-start justify-between border-b border-[#E4EBE7] pb-3">
					<div class="flex items-center gap-2.5">
						<div class="rounded-xl border border-[#E4EBE7] bg-[#F8FAF9] p-2 {modalIconCls}">
							{#if selectedFile.mimeType.startsWith('image/')}
								<Image class="h-4 w-4" />
							{:else if modalExt === 'zip' || modalExt === 'rar' || modalExt === '7z' || modalExt === 'tar'}
								<FileArchive class="h-4 w-4" />
							{:else if modalExt === 'xlsx' || modalExt === 'xls' || modalExt === 'csv'}
								<FileSpreadsheet class="h-4 w-4" />
							{:else if modalExt === 'pdf'}
								<FileText class="h-4 w-4" />
							{:else if modalExt === 'js' || modalExt === 'ts' || modalExt === 'json' || modalExt === 'html'}
								<FileCode class="h-4 w-4" />
							{:else}
								<FileText class="h-4 w-4" />
							{/if}
						</div>
						<div>
							<h3 class="max-w-md truncate text-sm font-bold text-[#0E2E25]">
								{selectedFile.originalName}
							</h3>
							<p class="font-mono text-xs text-[#52776C]">{selectedFile.id}</p>
						</div>
					</div>
					<button
						type="button"
						onclick={() => (selectedFile = null)}
						aria-label={m.ady_st_close()}
						class="cursor-pointer rounded-lg p-1.5 text-[#52776C] hover:bg-slate-100 hover:text-[#0E2E25]"
					>
						<X class="h-4 w-4" />
					</button>
				</div>

				{#if selectedFile.accessLevel === 'restricted'}
					<div class="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
						<div class="flex items-start gap-2">
							<ShieldAlert class="mt-0.5 h-4 w-4 shrink-0 text-amber-800" />
							<div>
								<h4 class="text-xs font-bold text-amber-900">{m.ady_st_restricted_title()}</h4>
								<p class="mt-0.5 text-[11px] text-amber-800">{m.ady_st_restricted_desc()}</p>
							</div>
						</div>

						{#if !canViewRestricted}
							<div class="rounded-lg bg-amber-100/70 p-2.5 text-xs font-medium text-amber-900">
								🔒 {m.ady_st_restricted_denied_a()}
								<code class="rounded bg-amber-200/80 px-1 py-0.5 font-mono text-[10px]">
									storage.view_restricted
								</code>
								{m.ady_st_restricted_denied_b()}
							</div>
						{:else if !showRestrictedContent}
							<button
								type="button"
								onclick={() => (showRestrictedContent = true)}
								class="cursor-pointer rounded-lg bg-amber-800 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-amber-900"
							>
								{m.ady_st_restricted_open_btn()}
							</button>
						{:else}
							<div class="rounded-lg border border-amber-200 bg-white p-3 text-xs text-slate-700">
								<p class="font-semibold text-[#0E2E25]">{m.ady_st_restricted_preview_label()}</p>
								<p class="mt-0.5 text-[11px] text-[#52776C]">
									{m.ady_st_restricted_preview_seller()}
									<strong>{selectedFile.ownerSellerId}</strong>
								</p>
								<div
									class="mt-2 flex h-36 items-center justify-center rounded-lg bg-slate-100 text-xs text-[#52776C]"
								>
									{m.ady_st_restricted_preview_placeholder()}
								</div>
							</div>
						{/if}
					</div>
				{/if}

				<div
					class="grid grid-cols-2 gap-3 rounded-xl border border-[#E4EBE7] bg-[#F8FAF9] p-4 text-xs"
				>
					<div>
						<span class="block text-[11px] text-[#698E82]">{m.ady_st_meta_category()}</span>
						<span class="font-semibold text-[#0E2E25]">
							{getCategoryLabel(selectedFile.category)}
						</span>
					</div>

					<div>
						<span class="block text-[11px] text-[#698E82]">{m.ady_st_meta_access()}</span>
						<span class="font-mono font-semibold text-[#0E2E25] uppercase">
							{selectedFile.accessLevel}
						</span>
					</div>

					<div>
						<span class="block text-[11px] text-[#698E82]">{m.ady_st_meta_size()}</span>
						<span class="font-mono font-bold text-[#0E2E25]">
							{formatBytes(selectedFile.sizeBytes)}
							({selectedFile.sizeBytes.toLocaleString('id-ID')} bytes)
						</span>
					</div>

					<div>
						<span class="block text-[11px] text-[#698E82]">{m.ady_st_meta_mime()}</span>
						<span class="font-mono text-[#0E2E25]">
							{selectedFile.mimeType} (.{selectedFile.extension || '-'})
						</span>
					</div>

					<div>
						<span class="block text-[11px] text-[#698E82]">{m.ady_st_meta_provider()}</span>
						<span class="font-mono text-[#0E2E25]">
							{selectedFile.storageProvider} / {selectedFile.bucket || 'default'}
						</span>
					</div>

					<div>
						<span class="block text-[11px] text-[#698E82]">{m.ady_st_meta_status()}</span>
						<span class="font-semibold text-[#0E2E25] capitalize">{selectedFile.status}</span>
					</div>

					<div class="col-span-2">
						<span class="block text-[11px] text-[#698E82]">{m.ady_st_meta_key()}</span>
						<span
							class="mt-0.5 block rounded border border-[#E4EBE7] bg-white p-1.5 font-mono text-[11px] break-all text-[#0E2E25]"
						>
							{selectedFile.objectKey}
						</span>
					</div>

					{#if selectedFile.checksum}
						<div class="col-span-2">
							<span class="block text-[11px] text-[#698E82]">{m.ady_st_meta_checksum()}</span>
							<span class="font-mono text-[10px] break-all text-[#52776C]">
								{selectedFile.checksum}
							</span>
						</div>
					{/if}

					{#if selectedFile.metadata && Object.keys(selectedFile.metadata).length > 0}
						<div class="col-span-2 border-t border-[#E4EBE7] pt-2">
							<span class="mb-1 block text-[11px] font-bold text-[#698E82]">
								{m.ady_st_meta_extra()}
							</span>
							<pre
								class="overflow-x-auto rounded border border-[#E4EBE7] bg-white p-2 font-mono text-[10px] text-slate-700">{JSON.stringify(
									selectedFile.metadata,
									null,
									2
								)}</pre>
						</div>
					{/if}
				</div>

				{#if isQuarantineModalOpen}
					<div class="space-y-2 rounded-xl border border-red-200 bg-red-50 p-3.5">
						<label for="quarantine-reason" class="block text-xs font-bold text-red-900">
							{m.ady_st_q_label()}
						</label>
						<textarea
							id="quarantine-reason"
							rows="2"
							bind:value={quarantineReason}
							placeholder={m.ady_st_q_ph()}
							class="w-full rounded-xl border border-red-300 bg-white p-2.5 text-xs focus:ring-1 focus:ring-red-600 focus:outline-none"
						></textarea>
						<div class="flex justify-end gap-2 pt-1">
							<button
								type="button"
								onclick={() => (isQuarantineModalOpen = false)}
								class="cursor-pointer rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-white"
							>
								{m.ady_st_q_cancel()}
							</button>
							<button
								type="button"
								disabled={!quarantineReason.trim()}
								onclick={() => handleApplyStatus('quarantined', quarantineReason.trim())}
								class="cursor-pointer rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
							>
								{m.ady_st_q_confirm()}
							</button>
						</div>
					</div>
				{/if}

				<div
					class="flex flex-wrap items-center justify-between gap-3 border-t border-[#E4EBE7] pt-3"
				>
					<div class="flex items-center gap-2">
						{#if canManageStorage && selectedFile.status === 'available' && !isQuarantineModalOpen}
							<button
								type="button"
								onclick={() => (isQuarantineModalOpen = true)}
								class="flex cursor-pointer items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-600 hover:text-white"
							>
								<Ban class="h-3.5 w-3.5" />
								<span>{m.ady_st_act_quarantine()}</span>
							</button>
						{/if}

						{#if canManageStorage && selectedFile.status === 'quarantined'}
							<button
								type="button"
								onclick={() => handleApplyStatus('available', m.ady_st_restore_reason())}
								class="flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#D0E6DC] bg-[#EBF5F0] px-3 py-1.5 text-xs font-semibold text-[#0C7B58] transition-colors hover:bg-[#0C7B58] hover:text-white"
							>
								<CheckCircle2 class="h-3.5 w-3.5" />
								<span>{m.ady_st_act_restore()}</span>
							</button>
						{/if}

						{#if canManageStorage && selectedFile.status !== 'deleted'}
							<button
								type="button"
								onclick={() => handleApplyStatus('deleted', m.ady_st_delete_reason())}
								class="flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-red-700"
							>
								<Trash2 class="h-3.5 w-3.5" />
								<span>{m.ady_st_act_delete()}</span>
							</button>
						{/if}
					</div>

					<button
						type="button"
						onclick={() => (selectedFile = null)}
						class="cursor-pointer rounded-xl bg-[#0C7B58] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#096649]"
					>
						{m.ady_st_close()}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
