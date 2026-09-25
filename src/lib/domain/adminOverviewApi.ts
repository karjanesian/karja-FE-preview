import { api } from '$lib/api';

/** Ringkasan metrik platform dari `GET /admin/overview`. */
export interface AdminOverview {
	sellers: number;
	buyers: number;
	products: number;
	orders: number;
	payoutsPending: number;
	kycPending: number;
	casesOpen: number;
	gmv: number;
}

function asNumber(value: unknown, fallback = 0): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

/** BE row → `AdminOverview` (nilai tidak valid dipetakan ke 0). */
export function mapApiAdminOverview(row: unknown): AdminOverview {
	const data = (row ?? {}) as Record<string, unknown>;
	return {
		sellers: asNumber(data.sellers),
		buyers: asNumber(data.buyers),
		products: asNumber(data.products),
		orders: asNumber(data.orders),
		payoutsPending: asNumber(data.payoutsPending),
		kycPending: asNumber(data.kycPending),
		casesOpen: asNumber(data.casesOpen),
		gmv: asNumber(data.gmv)
	};
}

/* ------------------------------- endpoints ------------------------------- */

export async function getAdminOverview(): Promise<AdminOverview> {
	return mapApiAdminOverview(await api<unknown>('/admin/overview'));
}
