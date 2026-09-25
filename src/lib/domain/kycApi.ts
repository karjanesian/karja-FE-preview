import { api, ApiError } from '$lib/api';
import { m } from '$lib/paraglide/messages.js';
import type { IdentityVerificationStatus } from '$lib/types';

export const KYC_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const KYC_DOCUMENT_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/** Status KYC dari BE (tanpa NIK; tanggal dalam ISO). */
export interface KycStatus {
	status: IdentityVerificationStatus;
	ktpName?: string;
	birthDate?: string;
	rejectionReason?: string;
	submittedAt?: string;
	verifiedAt?: string;
}

/** Body POST /seller/kyc (hanya field yang dikenali BE). */
export interface SubmitKycDto {
	ktpName: string;
	nik: string;
	birthDate?: string;
	fileId: string;
}

const KYC_STATUSES: readonly IdentityVerificationStatus[] = [
	'unverified',
	'pending',
	'verified',
	'needs_update',
	'rejected'
];

function asKycStatus(value: unknown): IdentityVerificationStatus {
	return KYC_STATUSES.includes(value as IdentityVerificationStatus)
		? (value as IdentityVerificationStatus)
		: 'unverified';
}

function asOptionalString(value: unknown): string | undefined {
	return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** Normalisasi respons BE (status tidak dikenal → unverified). */
export function mapKycStatus(row: unknown): KycStatus {
	const data = (row ?? {}) as Record<string, unknown>;
	return {
		status: asKycStatus(data.status),
		ktpName: asOptionalString(data.ktpName),
		birthDate: asOptionalString(data.birthDate),
		rejectionReason: asOptionalString(data.rejectionReason),
		submittedAt: asOptionalString(data.submittedAt),
		verifiedAt: asOptionalString(data.verifiedAt)
	};
}

/* ------------------------------- endpoints ------------------------------- */

export async function getKycStatus(): Promise<KycStatus> {
	return mapKycStatus(await api<unknown>('/seller/kyc'));
}

export async function submitKyc(dto: SubmitKycDto): Promise<KycStatus> {
	return mapKycStatus(await api<unknown>('/seller/kyc', { method: 'POST', body: dto }));
}

/** upload-url → PUT bytes → complete. Bucket privat, jadi tidak ada publicUrl. */
export async function uploadKycDocument(file: File): Promise<{ fileId: string }> {
	if (!KYC_DOCUMENT_MIME_TYPES.includes(file.type) || file.size > KYC_DOCUMENT_MAX_BYTES) {
		throw new ApiError(m.se_err_ktp_format(), 400);
	}

	const requested = await api<{ fileId: string; uploadUrl: string }>('/seller/files/upload-url', {
		method: 'POST',
		body: {
			category: 'kyc_document',
			fileName: file.name,
			mimeType: file.type,
			sizeBytes: file.size
		}
	});

	const upload = await fetch(requested.uploadUrl, {
		method: 'PUT',
		headers: { 'content-type': file.type },
		body: file
	});
	if (!upload.ok) throw new ApiError(m.se_err_ktp_upload_failed(), upload.status);

	await api(`/seller/files/${requested.fileId}/complete`, { method: 'POST', body: {} });

	return { fileId: requested.fileId };
}
