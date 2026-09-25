import { api } from '$lib/api';

/** Ringkasan akun buku besar dari `GET /admin/finance`. */
export interface AdminFinanceSummary {
	merchantFunds: number;
	escrowLiability: number;
	karjaFee: number;
	gatewayFee: number;
	payoutSettlement: number;
}

function asNumber(value: unknown, fallback = 0): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

/** BE row → `AdminFinanceSummary` (nilai tidak valid dipetakan ke 0). */
export function mapApiAdminFinance(row: unknown): AdminFinanceSummary {
	const data = (row ?? {}) as Record<string, unknown>;
	return {
		merchantFunds: asNumber(data.merchantFunds),
		escrowLiability: asNumber(data.escrowLiability),
		karjaFee: asNumber(data.karjaFee),
		gatewayFee: asNumber(data.gatewayFee),
		payoutSettlement: asNumber(data.payoutSettlement)
	};
}

/* ------------------------------- endpoints ------------------------------- */

export async function getAdminFinance(): Promise<AdminFinanceSummary> {
	return mapApiAdminFinance(await api<unknown>('/admin/finance'));
}
