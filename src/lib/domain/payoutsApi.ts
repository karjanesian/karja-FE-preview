import { api } from '$lib/api';
import { m } from '$lib/paraglide/messages.js';
import { buildPageQuery, unwrapPage, type Paged } from './pagination';
import type { Payout } from '$lib/types';

/** Ringkasan saldo seller dari BE. */
export interface PayoutBalance {
	available: number;
	pending: number;
	total: number;
	minimumWithdrawal: number;
}

/** Baris payout dari BE (camelCase Drizzle). */
export interface ApiPayoutRow {
	id: string;
	referenceId?: string | null;
	amount?: number | null;
	status?: string | null;
	bankName?: string | null;
	accountNumber?: string | null;
	accountHolder?: string | null;
	holdReason?: string | null;
	requestedAt?: string | null;
	processedAt?: string | null;
	paidAt?: string | null;
}

const PAYOUT_STATUSES: readonly Payout['status'][] = [
	'requested',
	'approved',
	'processing',
	'paid',
	'failed',
	'held',
	'rejected'
];

function asPayoutStatus(value: unknown): Payout['status'] {
	return PAYOUT_STATUSES.includes(value as Payout['status'])
		? (value as Payout['status'])
		: 'requested';
}

function asNumber(value: unknown, fallback = 0): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

/** ISO timestamp → tanggal tampilan (mis. "22 Sep 2026"). */
function formatPayoutDate(iso?: string | null): string {
	if (!iso) return m.money_requested_today();
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return m.money_requested_today();
	return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** BE row → FE Payout. Status final (`paid`) → estimasi selesai, lainnya diproses. */
export function mapApiPayout(row: ApiPayoutRow): Payout {
	const status = asPayoutStatus(row.status);
	return {
		id: row.id,
		referenceId: row.referenceId ?? '',
		amount: asNumber(row.amount),
		status,
		bankName: row.bankName ?? '',
		accountNumber: row.accountNumber ?? '',
		accountHolder: row.accountHolder ?? '',
		requestedAt: formatPayoutDate(row.requestedAt),
		arrivalEstimate: status === 'paid' ? m.money_transfer_done() : m.money_processing(),
		holdReason: row.holdReason ?? undefined,
		processedAt: row.processedAt ?? undefined,
		paidAt: row.paidAt ?? undefined
	};
}

/* ------------------------------- endpoints ------------------------------- */

export async function getPayoutBalance(): Promise<PayoutBalance> {
	const res = await api<Partial<PayoutBalance>>('/seller/payouts/balance');
	return {
		available: asNumber(res?.available),
		pending: asNumber(res?.pending),
		total: asNumber(res?.total),
		minimumWithdrawal: asNumber(res?.minimumWithdrawal)
	};
}

export interface ListSellerPayoutsParams {
	limit?: number;
	cursor?: string | null;
	status?: string;
	sortBy?: string;
	sortDir?: 'asc' | 'desc';
}

export async function listSellerPayouts(
	params: ListSellerPayoutsParams = {}
): Promise<Paged<Payout>> {
	const res = await api<
		{ items?: ApiPayoutRow[]; nextCursor?: string | null; total?: number } | ApiPayoutRow[]
	>(`/seller/payouts${buildPageQuery(params)}`);
	const page = unwrapPage(res);
	return { ...page, items: page.items.map(mapApiPayout) };
}

export async function requestPayout(amount: number): Promise<Payout> {
	return mapApiPayout(
		await api<ApiPayoutRow>('/seller/payouts', { method: 'POST', body: { amount } })
	);
}
