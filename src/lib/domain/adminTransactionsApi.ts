import { buildPageQuery, unwrapPage, type Paged, type PageQuery } from './pagination';
import { api } from '$lib/api';
import type { LedgerEntry, LedgerEntryType } from '$lib/types/admin';

/** Baris transaksi admin dari BE (camelCase Drizzle). */
export interface ApiAdminTransactionRow {
	id: string;
	orderId?: string | null;
	type?: string | null;
	amount?: number | string | null;
	karjaFee?: number | string | null;
	paymentFee?: number | string | null;
	netAmount?: number | string | null;
	status?: string | null;
	productTitle?: string | null;
	sellerName?: string | null;
	sellerUsername?: string | null;
	occurredAt?: string | null;
}

function asNumber(value: unknown, fallback = 0): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function asLedgerType(value: unknown): LedgerEntryType {
	switch (value) {
		case 'sale':
		case 'refund':
		case 'payout':
		case 'adjustment':
		case 'platform_fee':
		case 'payment_fee':
			return value;
		default:
			return 'adjustment';
	}
}

/** BE row → FE `LedgerEntry` (dipakai buku besar admin). */
export function mapApiAdminTransaction(row: ApiAdminTransactionRow): LedgerEntry {
	return {
		id: row.id,
		orderId: row.orderId ?? undefined,
		sellerId: row.sellerUsername ? `seller_${row.sellerUsername}` : undefined,
		type: asLedgerType(row.type),
		amount: asNumber(row.amount),
		grossAmount: asNumber(row.amount),
		karjaFee: asNumber(row.karjaFee),
		paymentFee: asNumber(row.paymentFee),
		sellerNet: asNumber(row.netAmount),
		description: row.productTitle ?? undefined,
		createdAt: row.occurredAt ?? ''
	};
}

/* ------------------------------- endpoints ------------------------------- */

/** Semua transaksi platform (buku besar), berhalaman + filter/sort. */
export async function listAdminTransactions(params: PageQuery = {}): Promise<Paged<LedgerEntry>> {
	const res = await api<
		| { items?: ApiAdminTransactionRow[]; nextCursor?: string | null; total?: number }
		| ApiAdminTransactionRow[]
	>(`/admin/transactions${buildPageQuery(params)}`);
	const page = unwrapPage(res);
	return { ...page, items: page.items.map(mapApiAdminTransaction) };
}
