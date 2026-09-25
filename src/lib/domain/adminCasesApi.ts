import { buildPageQuery, type PageQuery } from './pagination';
import { api } from '$lib/api';
import type {
	Dispute,
	DisputeStatus,
	Report,
	ReportReason,
	ReportStatus,
	ReportTargetType
} from '$lib/types/admin';

/** Baris laporan dari BE (`GET /admin/cases`). */
export interface ApiAdminReportRow {
	id: string;
	kind?: string | null;
	targetType?: string | null;
	targetId?: string | null;
	reporterEmail?: string | null;
	reason?: string | null;
	details?: string | null;
	status?: string | null;
	resolution?: string | null;
	createdAt?: string | null;
	resolvedAt?: string | null;
}

/** Baris sengketa dari BE (`GET /admin/cases`). */
export interface ApiAdminDisputeRow {
	id: string;
	kind?: string | null;
	orderId?: string | null;
	sellerId?: string | null;
	buyerName?: string | null;
	claimAmountIdr?: number | string | null;
	buyerStatement?: string | null;
	sellerResponse?: string | null;
	status?: string | null;
	resolution?: string | null;
	adminNote?: string | null;
	createdAt?: string | null;
	resolvedAt?: string | null;
}

export interface AdminCases {
	reports: Report[];
	disputes: Dispute[];
}

/** Halaman kasus: daftar + cursor/total per daftar untuk paginasi server. */
export interface AdminCasesPage extends AdminCases {
	nextCursor: string | null;
	reportsNextCursor: string | null;
	disputesNextCursor: string | null;
	reportsTotal: number;
	disputesTotal: number;
}

const REPORT_STATUSES: readonly ReportStatus[] = [
	'open',
	'reviewing',
	'action_taken',
	'dismissed',
	'resolved'
];

const DISPUTE_STATUSES: readonly DisputeStatus[] = [
	'open',
	'waiting_seller',
	'waiting_buyer',
	'admin_review',
	'refund_approved',
	'refund_partial',
	'refund_rejected',
	'resolved'
];

const REPORT_REASONS: readonly ReportReason[] = [
	'scam',
	'misleading_claim',
	'copyright',
	'harmful_content',
	'academic_cheating',
	'other'
];

function asNumber(value: unknown, fallback = 0): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function asOptionalString(value: unknown): string | undefined {
	return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function asReportStatus(value: unknown): ReportStatus {
	return REPORT_STATUSES.includes(value as ReportStatus) ? (value as ReportStatus) : 'open';
}

function asDisputeStatus(value: unknown): DisputeStatus {
	return DISPUTE_STATUSES.includes(value as DisputeStatus) ? (value as DisputeStatus) : 'open';
}

function asReportReason(value: unknown): ReportReason {
	return REPORT_REASONS.includes(value as ReportReason) ? (value as ReportReason) : 'other';
}

function asTargetType(value: unknown): ReportTargetType {
	return value === 'user' || value === 'seller' ? 'seller' : 'product';
}

/** BE row → FE `Report`. */
export function mapApiAdminReport(row: ApiAdminReportRow): Report {
	return {
		id: row.id,
		reporterType: 'system',
		reporterEmail: asOptionalString(row.reporterEmail),
		targetType: asTargetType(row.targetType),
		targetId: row.targetId ?? '',
		reason: asReportReason(row.reason),
		message: asOptionalString(row.details),
		status: asReportStatus(row.status),
		createdAt: row.createdAt ?? '',
		reviewedAt: asOptionalString(row.resolvedAt),
		resolution: asOptionalString(row.resolution)
	};
}

/** BE row → FE `Dispute`. */
export function mapApiAdminDispute(row: ApiAdminDisputeRow): Dispute {
	const statement = row.buyerStatement ?? '';
	return {
		id: row.id,
		orderId: row.orderId ?? '',
		sellerId: row.sellerId ?? '',
		productId: '',
		buyerName: asOptionalString(row.buyerName),
		buyerEmail: '',
		reason: statement,
		buyerStatement: statement,
		sellerResponse: asOptionalString(row.sellerResponse),
		status: asDisputeStatus(row.status),
		adminNote: asOptionalString(row.adminNote),
		resolution: asOptionalString(row.resolution),
		refundAmount: asNumber(row.claimAmountIdr),
		createdAt: row.createdAt ?? '',
		resolvedAt: asOptionalString(row.resolvedAt)
	};
}

/** Outcome FE → status yang diterima BE (`refund_*` dianggap `resolved`). */
export function toApiDisputeStatus(_outcome: DisputeStatus | 'resolved'): 'resolved' {
	return 'resolved';
}

/* ------------------------------- endpoints ------------------------------- */

export interface ApiAdminCaseStatusResult {
	id: string;
	status: string;
}

/** Semua laporan & sengketa platform (berhalaman; filter status opsional). */
export async function listAdminCases(params: PageQuery = {}): Promise<AdminCasesPage> {
	const data = await api<{
		reports?: ApiAdminReportRow[];
		disputes?: ApiAdminDisputeRow[];
		nextCursor?: string | null;
		reportsNextCursor?: string | null;
		disputesNextCursor?: string | null;
		reportsTotal?: number;
		disputesTotal?: number;
	}>(`/admin/cases${buildPageQuery(params)}`);
	const reports = (data?.reports ?? []).map(mapApiAdminReport);
	const disputes = (data?.disputes ?? []).map(mapApiAdminDispute);
	return {
		reports,
		disputes,
		nextCursor: data?.nextCursor ?? null,
		reportsNextCursor: data?.reportsNextCursor ?? null,
		disputesNextCursor: data?.disputesNextCursor ?? null,
		reportsTotal: typeof data?.reportsTotal === 'number' ? data.reportsTotal : reports.length,
		disputesTotal: typeof data?.disputesTotal === 'number' ? data.disputesTotal : disputes.length
	};
}

/** Perbarui status laporan kasus. */
export async function setAdminReportStatus(
	id: string,
	status: ReportStatus,
	note?: string
): Promise<ApiAdminCaseStatusResult> {
	return api<ApiAdminCaseStatusResult>(`/admin/cases/reports/${encodeURIComponent(id)}/status`, {
		method: 'POST',
		body: { status, note }
	});
}

/** Perbarui status sengketa. */
export async function setAdminDisputeStatus(
	id: string,
	outcome: DisputeStatus | 'resolved',
	note?: string
): Promise<ApiAdminCaseStatusResult> {
	return api<ApiAdminCaseStatusResult>(`/admin/cases/disputes/${encodeURIComponent(id)}/status`, {
		method: 'POST',
		body: { status: toApiDisputeStatus(outcome), note }
	});
}
