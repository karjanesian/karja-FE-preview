import {
	createPaginatedRowModel,
	createSortedRowModel,
	rowPaginationFeature,
	rowSortingFeature,
	sortFn_alphanumeric,
	sortFn_basic,
	sortFn_datetime,
	sortFn_text,
	tableFeatures,
	type CellContext,
	type ColumnDef,
	type RowData
} from '@tanstack/svelte-table';

export type DataTableColumnMeta = {
	align?: 'left' | 'center' | 'right';
	headerClass?: string;
	cellClass?: string;
	/** Nama kolom sort yang dikirim ke BE (mode server). Default: id kolom. */
	sortKey?: string;
};

export const dataTableFeatures = tableFeatures({
	rowSortingFeature,
	sortedRowModel: createSortedRowModel(),
	rowPaginationFeature,
	paginatedRowModel: createPaginatedRowModel(),
	sortFns: {
		alphanumeric: sortFn_alphanumeric,
		text: sortFn_text,
		datetime: sortFn_datetime,
		basic: sortFn_basic
	},
	columnMeta: {} as DataTableColumnMeta
});

export type DataTableFeatures = typeof dataTableFeatures;
export type DataTableColumn<TData extends RowData> = ColumnDef<DataTableFeatures, TData, any>;
export type DataTableCellContext<TData extends RowData> = CellContext<
	DataTableFeatures,
	TData,
	any
>;
