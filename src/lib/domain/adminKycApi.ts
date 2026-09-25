import { buildPageQuery, unwrapPage, type Paged, type PageQuery } from './pagination';
import { api } from '$lib/api';
import type { KycStatus } from '$lib/domain/kycApi';
import type { IdentityVerificationStatus, SellerProfile } from '$lib/types';

/** Baris antrean KYC admin dari BE (camelCase Drizzle). */
export interface ApiAdminKycRow {
	id: string;
	userId?: string | null;
	sellerName?: string | null;
	sellerEmail?: string | null;
	sellerUsername?: string | null;
	ktpName?: string | null;
	birthDate?: string | null;
	documentObjectKey?: string | null;
	status?: string | null;
	rejectionReason?: string | null;
	submittedAt?: string | null;
	verifiedAt?: string | null;
}

/** Pengajuan KYC yang sudah dinormalisasi. */
export interface AdminKycRecord {
	id: string;
	userId: string;
	sellerName: string;
	sellerEmail: string;
	sellerUsername: string;
	ktpName: string;
	birthDate?: string;
	documentObjectKey?: string;
	status: IdentityVerificationStatus;
	rejectionReason?: string;
	submittedAt?: string;
	verifiedAt?: string;
}

/** Status keputusan yang diterima `POST /admin/kyc/:id/status`. */
export type AdminKycReviewStatus = 'verified' | 'rejected' | 'needs_update';

const KYC_STATUSES: readonly IdentityVerificationStatus[] = [
	'unverified',
	'pending',
	'verified',
	'needs_update',
	'rejected'
];

function asIdentityStatus(value: unknown): IdentityVerificationStatus {
	return KYC_STATUSES.includes(value as IdentityVerificationStatus)
		? (value as IdentityVerificationStatus)
		: 'unverified';
}

function asOptionalString(value: unknown): string | undefined {
	return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** BE row → `AdminKycRecord`. */
export function mapApiAdminKyc(row: ApiAdminKycRow): AdminKycRecord {
	return {
		id: row.id,
		userId: row.userId ?? '',
		sellerName: row.sellerName ?? '',
		sellerEmail: row.sellerEmail ?? '',
		sellerUsername: row.sellerUsername ?? '',
		ktpName: row.ktpName ?? '',
		birthDate: asOptionalString(row.birthDate),
		documentObjectKey: asOptionalString(row.documentObjectKey),
		status: asIdentityStatus(row.status),
		rejectionReason: asOptionalString(row.rejectionReason),
		submittedAt: asOptionalString(row.submittedAt),
		verifiedAt: asOptionalString(row.verifiedAt)
	};
}

/**
 * Pengajuan KYC → `SellerProfile` agar bisa dirender view verifikasi yang
 * sudah ada. `id` memakai id dokumen KYC supaya aksi review bisa memakainya.
 */
export function mapKycToSellerProfile(record: AdminKycRecord): SellerProfile {
	return {
		id: record.id,
		userId: record.userId,
		name: record.sellerName,
		username: record.sellerUsername,
		email: record.sellerEmail,
		tagline: '',
		bio: '',
		topics: [],
		whatsapp: '',
		instagram: '',
		linkedin: '',
		tiktok: '',
		showWhatsappOnStore: false,
		avatarUrl: '',
		bankInfo: { bank: '', accountNumber: '', accountHolder: '' },
		verification: {
			status: record.status,
			fullNameKtp: record.ktpName,
			birthDate: record.birthDate,
			submittedAt: record.submittedAt,
			verifiedAt: record.verifiedAt,
			rejectionReason: record.rejectionReason
		}
	};
}

/* ------------------------------- endpoints ------------------------------- */

/** Antrean KYC (berhalaman; filter status/q + sort). */
export async function listAdminKyc(params: PageQuery = {}): Promise<Paged<AdminKycRecord>> {
	const res = await api<
		{ items?: ApiAdminKycRow[]; nextCursor?: string | null; total?: number } | ApiAdminKycRow[]
	>(`/admin/kyc${buildPageQuery(params)}`);
	const page = unwrapPage(res);
	return { ...page, items: page.items.map(mapApiAdminKyc) };
}

/** Tinjau pengajuan KYC; mengembalikan status terbaru dari BE. */
export async function reviewAdminKyc(
	id: string,
	status: AdminKycReviewStatus,
	reason?: string
): Promise<KycStatus> {
	return api<KycStatus>(`/admin/kyc/${encodeURIComponent(id)}/status`, {
		method: 'POST',
		body: { status, reason }
	});
}
