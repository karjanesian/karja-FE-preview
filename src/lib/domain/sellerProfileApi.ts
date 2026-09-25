import { api, ApiError } from '$lib/api';
import { m } from '$lib/paraglide/messages.js';
import type { KarjaVerificationStatus, SellerProfile } from '$lib/types';

export const STORE_ASSET_MAX_BYTES = 6 * 1024 * 1024;
export const STORE_ASSET_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/** Baris profil seller dari BE (camelCase Drizzle). */
export interface ApiSellerProfile {
	id?: string;
	name?: string | null;
	username?: string | null;
	email?: string | null;
	tagline?: string | null;
	bio?: string | null;
	topics?: string[] | null;
	whatsapp?: string | null;
	showWhatsappOnStore?: boolean | null;
	instagram?: string | null;
	linkedin?: string | null;
	tiktok?: string | null;
	avatarUrl?: string | null;
	bannerUrl?: string | null;
	karjaVerifiedStatus?: string | null;
}

/** Body untuk PATCH /seller/profile (hanya field yang dikenali BE). */
export interface UpdateSellerProfileDto {
	name?: string;
	username?: string;
	tagline?: string;
	bio?: string;
	topics?: string[];
	whatsapp?: string;
	showWhatsappOnStore?: boolean;
	instagram?: string;
	linkedin?: string;
	tiktok?: string;
	avatarUrl?: string;
	bannerUrl?: string;
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

function normalizeUsername(raw: string): string {
	return raw.trim().toLowerCase().replace(/^@+/, '');
}

/**
 * Profil BE → SellerProfile lokal. Field yang tidak dikirim BE (bank, jadwal,
 * notifikasi, dsb.) dipertahankan dari `current` agar fitur lain tidak hilang.
 */
export function mapApiSellerProfile(row: ApiSellerProfile, current: SellerProfile): SellerProfile {
	const karjaStatus = asKarjaStatus(row.karjaVerifiedStatus);
	return {
		...current,
		id: row.id ?? current.id,
		name: row.name ?? current.name,
		username: row.username ?? current.username,
		email: row.email ?? current.email,
		tagline: row.tagline ?? '',
		bio: row.bio ?? '',
		topics: Array.isArray(row.topics) ? row.topics : [],
		whatsapp: row.whatsapp ?? '',
		showWhatsappOnStore: row.showWhatsappOnStore ?? current.showWhatsappOnStore,
		instagram: row.instagram ?? '',
		linkedin: row.linkedin ?? '',
		tiktok: row.tiktok ?? '',
		avatarUrl: row.avatarUrl ?? '',
		bannerUrl: row.bannerUrl ?? '',
		verification: karjaStatus
			? {
					...(current.verification ?? { status: 'unverified' as const }),
					karjaVerifiedStatus: karjaStatus
				}
			: current.verification
	};
}

/** SellerProfile lokal → body PATCH. String kosong tetap dikirim agar field bisa dikosongkan. */
export function toUpdateSellerProfileDto(profile: SellerProfile): UpdateSellerProfileDto {
	return {
		name: profile.name.trim(),
		username: normalizeUsername(profile.username),
		tagline: profile.tagline ?? '',
		bio: profile.bio ?? '',
		topics: (profile.topics ?? []).map((topic) => topic.trim()).filter(Boolean),
		whatsapp: profile.whatsapp ?? '',
		showWhatsappOnStore: profile.showWhatsappOnStore,
		instagram: profile.instagram ?? '',
		linkedin: profile.linkedin ?? '',
		tiktok: profile.tiktok ?? '',
		avatarUrl: profile.avatarUrl ?? '',
		bannerUrl: profile.bannerUrl ?? ''
	};
}

/* ------------------------------- endpoints ------------------------------- */

export async function getSellerProfile(): Promise<ApiSellerProfile> {
	return api<ApiSellerProfile>('/seller/profile');
}

export async function updateSellerProfile(dto: UpdateSellerProfileDto): Promise<ApiSellerProfile> {
	return api<ApiSellerProfile>('/seller/profile', { method: 'PATCH', body: dto });
}

/** upload-url → PUT bytes → complete. Mengembalikan `publicUrl` CDN untuk avatar/banner. */
export async function uploadStoreAsset(file: File): Promise<{ url: string }> {
	if (!STORE_ASSET_MIME_TYPES.includes(file.type) || file.size > STORE_ASSET_MAX_BYTES) {
		throw new ApiError(m.pb_image_invalid(), 400);
	}

	const requested = await api<{ fileId: string; uploadUrl: string; publicUrl?: string }>(
		'/seller/files/upload-url',
		{
			method: 'POST',
			body: {
				category: 'store_asset',
				fileName: file.name,
				mimeType: file.type,
				sizeBytes: file.size
			}
		}
	);

	const upload = await fetch(requested.uploadUrl, {
		method: 'PUT',
		headers: { 'content-type': file.type },
		body: file
	});
	if (!upload.ok) throw new ApiError(m.pb_image_upload_failed(), upload.status);

	await api(`/seller/files/${requested.fileId}/complete`, { method: 'POST', body: {} });

	return { url: requested.publicUrl ?? '' };
}
