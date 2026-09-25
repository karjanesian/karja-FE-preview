import { buildPageQuery, unwrapPage, type Paged, type PageQuery } from './pagination';
import { api } from '$lib/api';
import type { ExtendedPayout, PayoutWorkflowStatus } from '$lib/types/admin';

/** Baris payout admin dari BE (camelCase Drizzle). */
export interface ApiAdminPayoutRow {
	id: string;
	referenceId?: string | null;
	sellerId?: string | null;
	sellerName?: string | null;
	sellerUsername?: string | null;
	sellerEmail?: string | null;
	amount?: number | string | null;
	bankName?: string | null;
	accountNumber?: string | null;
	accountHolder?: string | null;
	status?: string | null;
	holdReason?: string | null;
	providerReference?: string | null;
	requestedAt?: string | null;
	processedAt?: string | null;
	paidAt?: string | null;
}

/** Status yang diterima `POST /admin/payouts/:id/status`. */
export type AdminPayoutReviewStatus = 'approved' | 'processing' | 'paid' | 'held' | 'rejected';

/** Body `POST /admin/payouts/:id/status` (hanya field yang dikenali BE). */
export interface ReviewPayoutDto {
	status: AdminPayoutReviewStatus;
	reason?: string;
	providerRef?: string;
}

const PAYOUT_STATUSES: readonly PayoutWorkflowStatus[] = [
	'requested',
	'approved',
	'processing',
	'paid',
	'failed',
	'held',
	'rejected'
];

function asPayoutStatus(value: unknown): PayoutWorkflowStatus {
	return PAYOUT_STATUSES.includes(value as PayoutWorkflowStatus)
		? (value as PayoutWorkflowStatus)
		: 'requested';
}

function asNumber(value: unknown, fallback = 0): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function asOptionalString(value: unknown): string | undefined {
	return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** BE row → FE `ExtendedPayout`. Field khusus FE diabaikan (default aman). */
export function mapApiAdminPayout(row: ApiAdminPayoutRow): ExtendedPayout {
	return {
		id: row.id,
		referenceId: row.referenceId ?? '',
		sellerId: row.sellerId ?? '',
		amount: asNumber(row.amount),
		bankName: row.bankName ?? '',
		accountNumber: row.accountNumber ?? '',
		accountHolder: row.accountHolder ?? '',
		status: asPayoutStatus(row.status),
		requestedAt: row.requestedAt ?? '',
		holdReason: asOptionalString(row.holdReason),
		providerReference: asOptionalString(row.providerReference),
		processedAt: asOptionalString(row.processedAt),
		paidAt: asOptionalString(row.paidAt)
	};
}

/* ------------------------------- endpoints ------------------------------- */

/** Semua payout platform (berhalaman; filter status/q + sort). */
export async function listAdminPayouts(params: PageQuery = {}): Promise<Paged<ExtendedPayout>> {
	const res = await api<
		| { items?: ApiAdminPayoutRow[]; nextCursor?: string | null; total?: number }
		| ApiAdminPayoutRow[]
	>(`/admin/payouts${buildPageQuery(params)}`);
	const page = unwrapPage(res);
	return { ...page, items: page.items.map(mapApiAdminPayout) };
}

/** Review satu payout; mengembalikan payout terbaru dari BE. */
export async function reviewPayout(id: string, dto: ReviewPayoutDto): Promise<ExtendedPayout> {
	return mapApiAdminPayout(
		await api<ApiAdminPayoutRow>(`/admin/payouts/${encodeURIComponent(id)}/status`, {
			method: 'POST',
			body: dto
		})
	);
}
