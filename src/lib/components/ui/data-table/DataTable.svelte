<script lang="ts" generics="TData extends RowData">
	import { FlexRender, createTable, type RowData } from '@tanstack/svelte-table';
	import { untrack, type Snippet } from 'svelte';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import ChevronUp from 'lucide-svelte/icons/chevron-up';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import { cn } from '$lib/utils.js';
	import { m } from '$lib/paraglide/messages.js';
	import * as Table from '$lib/components/ui/table';
	import {
		dataTableFeatures,
		type DataTableColumn,
		type DataTableCellContext,
		type DataTableColumnMeta
	} from './features.js';

	type PaginationMode = 'client' | 'server';
	type SortDir = 'asc' | 'desc';

	interface Props {
		data: TData[];
		columns: DataTableColumn<TData>[];
		pageSize?: number;
		emptyMessage?: string;
		loading?: boolean;
		stickyHeader?: boolean;
		paginationMode?: PaginationMode;
		page?: number;
		total?: number;
		onPageChange?: (page: number) => void;
		/** Mode server: dipanggil saat header di-sort. Nonaktif bila tidak diisi. */
		onSortChange?: (sortBy: string, sortDir: SortDir) => void;
		sortBy?: string;
		sortDir?: SortDir;
		onRowClick?: (row: TData) => void;
		getRowId?: (row: TData, index: number) => string;
		class?: string;
		tableClass?: string;
		rowClass?: (row: TData) => string;
		cellSnippets?: Record<string, Snippet<[DataTableCellContext<TData>]> | undefined>;
		empty?: Snippet;
		hideEmptyRow?: boolean;
	}

	let {
		data,
		columns,
		pageSize = 10,
		emptyMessage,
		loading = false,
		stickyHeader = false,
		paginationMode = 'client',
		page: pageProp,
		total: totalProp,
		onPageChange,
		onSortChange,
		sortBy,
		sortDir,
		onRowClick,
		getRowId,
		class: className,
		tableClass,
		rowClass,
		cellSnippets,
		empty,
		hideEmptyRow = false
	}: Props = $props();

	const isServer = $derived(paginationMode === 'server');

	const table = createTable({
		features: dataTableFeatures,
		get columns() {
			return columns;
		},
		enableSorting: false,
		get data() {
			return data;
		},
		get getRowId() {
			return getRowId;
		},
		// Mode server: jangan sort/paginate lokal — `data` sudah satu halaman dari BE.
		get manualPagination() {
			return isServer;
		},
		get manualSorting() {
			return isServer;
		},
		get rowCount() {
			return isServer ? (totalProp ?? data.length) : undefined;
		},
		initialState: {
			pagination: { pageIndex: 0, pageSize: untrack(() => pageSize) }
		}
	});

	$effect(() => {
		if (table.atoms.pagination.get().pageSize !== pageSize) {
			table.setPageSize(pageSize);
		}
	});

	const pagination = $derived(table.atoms.pagination.get());
	const rowModel = $derived(table.getRowModel());
	const pageIndex = $derived(isServer ? Math.max(0, (pageProp ?? 1) - 1) : pagination.pageIndex);
	const total = $derived(isServer ? (totalProp ?? data.length) : table.getRowCount());
	const pageCount = $derived(
		isServer ? Math.max(1, Math.ceil(total / pageSize)) : table.getPageCount()
	);
	const leafColumnCount = $derived(table.getAllLeafColumns().length);
	const rangeFrom = $derived(total === 0 ? 0 : pageIndex * pageSize + 1);
	const rangeTo = $derived(Math.min((pageIndex + 1) * pageSize, total));

	function goToPage(target: number) {
		if (isServer) {
			onPageChange?.(target);
		} else {
			table.setPageIndex(target - 1);
		}
	}

	const pageItems = $derived.by<(number | 'ellipsis')[]>(() => {
		const totalPages = pageCount;
		const current = pageIndex + 1;
		if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
		const items: (number | 'ellipsis')[] = [1];
		const start = Math.max(2, current - 1);
		const end = Math.min(totalPages - 1, current + 1);
		if (start > 2) items.push('ellipsis');
		for (let i = start; i <= end; i += 1) items.push(i);
		if (end < totalPages - 1) items.push('ellipsis');
		items.push(totalPages);
		return items;
	});

	function metaOf(column: { columnDef: { meta?: DataTableColumnMeta } }): DataTableColumnMeta {
		return column.columnDef.meta ?? {};
	}

	function alignClass(meta: DataTableColumnMeta): string {
		if (meta.align === 'right') return 'text-right';
		if (meta.align === 'center') return 'text-center';
		return '';
	}

	/** Mode server: kolom sortable bila ada handler, `enableSorting`, dan `meta.sortKey`. */
	function serverSortable(column: {
		columnDef: { enableSorting?: boolean; meta?: DataTableColumnMeta };
	}): boolean {
		return (
			Boolean(onSortChange) &&
			column.columnDef.enableSorting === true &&
			Boolean(metaOf(column).sortKey)
		);
	}

	function serverSortKey(column: {
		id: string;
		columnDef: { meta?: DataTableColumnMeta };
	}): string {
		return metaOf(column).sortKey ?? column.id;
	}

	function handleServerSort(column: { id: string; columnDef: { meta?: DataTableColumnMeta } }) {
		if (!onSortChange) return;
		const key = serverSortKey(column);
		const next: SortDir = sortBy === key && sortDir === 'asc' ? 'desc' : 'asc';
		onSortChange(key, next);
	}
</script>

<div class={cn('relative w-full', className)}>
	<div
		class={cn(
			stickyHeader && 'max-h-[70vh] overflow-auto [&_[data-slot=table-container]]:overflow-visible'
		)}
	>
		<Table.Root class={cn('text-xs!', tableClass)}>
			<Table.Header
				class={cn(
					'border-b border-[#E4EBE7] text-[11px] font-semibold tracking-wider text-[#52776C] uppercase',
					stickyHeader && 'sticky top-0 z-10 bg-[#F8FAF9]'
				)}
			>
				{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
					<Table.Row class="border-b border-[#E4EBE7] hover:bg-transparent">
						{#each headerGroup.headers as header (header.id)}
							{#if !header.isPlaceholder}
								{@const meta = metaOf(header.column)}
								<Table.Head class={cn('px-4 py-3.5', alignClass(meta), meta.headerClass)}>
									{#if serverSortable(header.column)}
										{@const activeDir =
											sortBy === serverSortKey(header.column) ? (sortDir ?? null) : null}
										<button
											type="button"
											class={cn(
												'inline-flex cursor-pointer items-center gap-1 transition-colors hover:text-[#0C7B58]',
												meta.align === 'right' && 'flex-row-reverse',
												meta.align === 'center' && 'justify-center'
											)}
											onclick={() => handleServerSort(header.column)}
										>
											<FlexRender {header} />
											{#if activeDir === 'asc'}
												<ChevronUp class="h-3.5 w-3.5 text-[#0C7B58]" />
											{:else if activeDir === 'desc'}
												<ChevronDown class="h-3.5 w-3.5 text-[#0C7B58]" />
											{:else}
												<ChevronsUpDown class="h-3.5 w-3.5 opacity-40" />
											{/if}
										</button>
									{:else if header.column.getCanSort() && !isServer}
										<button
											type="button"
											class={cn(
												'inline-flex cursor-pointer items-center gap-1 transition-colors hover:text-[#0C7B58]',
												meta.align === 'right' && 'flex-row-reverse',
												meta.align === 'center' && 'justify-center'
											)}
											onclick={(event) => header.column.getToggleSortingHandler()?.(event)}
										>
											<FlexRender {header} />
											{#if header.column.getIsSorted() === 'asc'}
												<ChevronUp class="h-3.5 w-3.5 text-[#0C7B58]" />
											{:else if header.column.getIsSorted() === 'desc'}
												<ChevronDown class="h-3.5 w-3.5 text-[#0C7B58]" />
											{:else}
												<ChevronsUpDown class="h-3.5 w-3.5 opacity-40" />
											{/if}
										</button>
									{:else}
										<FlexRender {header} />
									{/if}
								</Table.Head>
							{/if}
						{/each}
					</Table.Row>
				{/each}
			</Table.Header>

			<Table.Body class="divide-y divide-[#EFF5F1]">
				{#if loading}
					{#each Array.from({ length: Math.min(pageSize, 8) }) as _, rowIndex (rowIndex)}
						<Table.Row class="hover:bg-transparent">
							{#each Array.from({ length: leafColumnCount }) as __, colIndex (colIndex)}
								<Table.Cell class="px-4 py-3.5">
									<div class="h-4 w-full max-w-[120px] animate-pulse rounded bg-[#EEF3F0]"></div>
								</Table.Cell>
							{/each}
						</Table.Row>
					{/each}
				{:else if total === 0}
					{#if !hideEmptyRow}
						<Table.Row class="hover:bg-transparent">
							<Table.Cell
								colspan={leafColumnCount}
								class="px-4 py-12 text-center text-xs text-[#52776C]"
							>
								{#if empty}
									{@render empty()}
								{:else}
									{emptyMessage ?? m.dt_empty()}
								{/if}
							</Table.Cell>
						</Table.Row>
					{/if}
				{:else}
					{#each rowModel.rows as row (row.id)}
						<Table.Row
							class={cn(
								'transition-colors hover:bg-[#F8FBF9]',
								onRowClick && 'cursor-pointer',
								rowClass?.(row.original)
							)}
							role={onRowClick ? 'button' : undefined}
							tabindex={onRowClick ? 0 : undefined}
							onclick={onRowClick ? () => onRowClick(row.original) : undefined}
							onkeydown={onRowClick
								? (event) => {
										if (event.key === 'Enter') onRowClick(row.original);
									}
								: undefined}
						>
							{#each row.getAllCells() as cell (cell.id)}
								{@const meta = metaOf(cell.column)}
								{@const snippet = cellSnippets?.[cell.column.id]}
								<Table.Cell class={cn('px-4 py-3.5', alignClass(meta), meta.cellClass)}>
									{#if snippet}
										{@render snippet(cell.getContext())}
									{:else}
										<FlexRender {cell} />
									{/if}
								</Table.Cell>
							{/each}
						</Table.Row>
					{/each}
				{/if}
			</Table.Body>
		</Table.Root>
	</div>

	{#if !loading && pageCount > 1}
		<div
			class="flex flex-col items-center justify-between gap-3 border-t border-[#EFF5F1] bg-white px-5 py-3 sm:flex-row sm:px-6"
		>
			<p class="text-[11px] text-[#52776C] sm:text-xs">
				{m.dt_showing({ from: rangeFrom, to: rangeTo, total })}
			</p>
			<nav class="flex items-center gap-1" aria-label={m.dt_pagination_label()}>
				<button
					type="button"
					onclick={() => goToPage(pageIndex)}
					disabled={pageIndex <= 0}
					aria-label={m.dt_prev_page()}
					class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#E5ECE7] text-[#52776C] transition-colors hover:bg-[#F2FAF5] hover:text-[#0C7B58] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#52776C]"
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
							aria-current={item === pageIndex + 1 ? 'page' : undefined}
							aria-label={m.dt_page_of({ page: item })}
							class="inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors {item ===
							pageIndex + 1
								? 'bg-[#0C7B58] text-white'
								: 'border border-[#E5ECE7] text-[#245344] hover:bg-[#F2FAF5] hover:text-[#0C7B58]'}"
						>
							{item}
						</button>
					{/if}
				{/each}
				<button
					type="button"
					onclick={() => goToPage(pageIndex + 2)}
					disabled={pageIndex + 1 >= pageCount}
					aria-label={m.dt_next_page()}
					class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#E5ECE7] text-[#52776C] transition-colors hover:bg-[#F2FAF5] hover:text-[#0C7B58] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#52776C]"
				>
					<ChevronRight class="h-4 w-4" />
				</button>
			</nav>
		</div>
	{/if}
</div>
