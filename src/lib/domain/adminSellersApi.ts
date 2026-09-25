import { buildPageQuery, unwrapPage, type Paged, type PageQuery } from './pagination';
import { api } from '$lib/api';
import type {
	IdentityVerificationStatus,
	KarjaVerificationStatus,
	PlatformUserStatus,
	SellerProfile
} from '$lib/types';

/** Baris seller admin dari BE (camelCase Drizzle). */
export interface ApiAdminSellerRow {
	id: string;
	name?: string | null;
	username?: string | null;
	email?: string | null;
	status?: string | null;
	avatarUrl?: string | null;
	karjaVerifiedStatus?: string | null;
	createdAt?: string | null;
	kycStatus?: string | null;
	products?: number | string | null;
	orders?: number | string | null;
}

/** Seller admin: `SellerProfile` + kolom operasional khusus konsol. */
export type AdminSellerProfile = SellerProfile & {
	createdAt?: string;
	productCount?: number;
	orderCount?: number;
	accountStatus?: PlatformUserStatus;
};

/** Status akun seller yang diterima `POST /admin/sellers/:id/status`. */
export type AdminSellerStatus = 'active' | 'suspended' | 'disabled';

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

function asKarjaStatus(value: unknown): KarjaVerificationStatus | undefined {
	switch (value) {
		case 'not_eligible':
		case 'eligible':
		case 'verified':
		case 'revoked':
			return value;
		default:
			return undefined;
	}
}

function asAccountStatus(value: unknown): PlatformUserStatus {
	if (value === 'suspended' || value === 'disabled') return value;
	return 'active';
}

function asNumber(value: unknown, fallback = 0): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

/** BE row → `SellerProfile` (kolom yang tidak dikirim BE diisi default aman). */
export function mapApiAdminSeller(row: ApiAdminSellerRow): AdminSellerProfile {
	const accountStatus = asAccountStatus(row.status);
	const karjaStatus = asKarjaStatus(row.karjaVerifiedStatus);
	return {
		id: row.id,
		name: row.name ?? '',
		username: row.username ?? '',
		email: row.email ?? '',
		tagline: '',
		bio: '',
		topics: [],
		whatsapp: '',
		instagram: '',
		linkedin: '',
		tiktok: '',
		showWhatsappOnStore: false,
		avatarUrl: row.avatarUrl ?? '',
		bankInfo: { bank: '', accountNumber: '', accountHolder: '' },
		verification: {
			status: asIdentityStatus(row.kycStatus),
			karjaVerifiedStatus: karjaStatus,
			isAccountSuspended: accountStatus !== 'active'
		},
		createdAt: row.createdAt ?? undefined,
		productCount: asNumber(row.products),
		orderCount: asNumber(row.orders),
		accountStatus
	};
}

/* ------------------------------- endpoints ------------------------------- */

export interface ApiAdminSellerStatusResult {
	id: string;
	status: AdminSellerStatus;
}

/** Semua seller platform (butuh sesi admin), berhalaman + filter/sort. */
export async function listAdminSellers(params: PageQuery = {}): Promise<Paged<AdminSellerProfile>> {
	const res = await api<
		| { items?: ApiAdminSellerRow[]; nextCursor?: string | null; total?: number }
		| ApiAdminSellerRow[]
	>(`/admin/sellers${buildPageQuery(params)}`);
	const page = unwrapPage(res);
	return { ...page, items: page.items.map(mapApiAdminSeller) };
}

/** Ubah status akun seller; mengembalikan `{ id, status }` dari BE. */
export async function setAdminSellerStatus(
	id: string,
	status: AdminSellerStatus
): Promise<ApiAdminSellerStatusResult> {
	return api<ApiAdminSellerStatusResult>(`/admin/sellers/${encodeURIComponent(id)}/status`, {
		method: 'POST',
		body: { status }
	});
}
