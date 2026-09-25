import { api } from '$lib/api';
import { normalizeBuyerEmail } from '$lib/domain/buyerDomain';
import type { DerivedBuyerSummary } from '$lib/types/buyer';

/** Baris buyer admin dari BE (agregat per email). */
export interface ApiAdminBuyerRow {
	email?: string | null;
	name?: string | null;
	phone?: string | null;
	orders?: number | string | null;
	spent?: number | string | null;
	lastOrderAt?: string | null;
}

function asNumber(value: unknown, fallback = 0): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function asOptionalString(value: unknown): string | undefined {
	return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/**
 * BE row → `DerivedBuyerSummary`. BE hanya mengirim agregat, jadi daftar
 * pesanan/ulasan/sengketa dikosongkan dan bisa dilengkapi dari data pesanan.
 */
export function mapApiAdminBuyer(row: ApiAdminBuyerRow): DerivedBuyerSummary {
	const email = row.email ?? '';
	const orders = asNumber(row.orders);
	const lastOrderAt = row.lastOrderAt ?? '';
	return {
		buyerKey: normalizeBuyerEmail(email),
		name: row.name ?? email,
		email,
		phone: asOptionalString(row.phone),
		paidOrdersCount: orders,
		completedOrdersCount: 0,
		totalSpend: asNumber(row.spent),
		firstPurchaseAt: lastOrderAt,
		lastPurchaseAt: lastOrderAt,
		repeatBuyer: orders >= 2,
		reviewCount: 0,
		disputeCount: 0,
		activeOrdersCount: 0,
		orders: [],
		reviews: [],
		disputes: []
	};
}

/* ------------------------------- endpoints ------------------------------- */

/** Semua buyer platform (agregat per email). */
export async function listAdminBuyers(): Promise<DerivedBuyerSummary[]> {
	const rows = await api<ApiAdminBuyerRow[]>('/admin/buyers');
	return (rows ?? []).map(mapApiAdminBuyer);
}
