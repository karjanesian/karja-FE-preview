import { SellerProfile, SellerVerification } from '$lib/types';

/**
 * Canonical minimum withdrawal amount for Karja (Rp100.000).
 */
export const MINIMUM_WITHDRAWAL_AMOUNT = 100000;

/**
 * Checks if the seller's identity verification is fully approved (verified).
 */
export function isIdentityVerified(profile?: SellerProfile | null): boolean {
	return profile?.verification?.status === 'verified';
}

/**
 * Checks if the seller's payout bank information is complete.
 */
export function isBankConfigured(profile?: SellerProfile | null): boolean {
	const bank = profile?.bankInfo?.bank?.trim();
	const accNum = profile?.bankInfo?.accountNumber?.trim();
	const accHolder = profile?.bankInfo?.accountHolder?.trim();
	return Boolean(bank && accNum && accHolder);
}

/**
 * Payout readiness is derived strictly from:
 * 1. Identity is verified
 * 2. Bank details are complete
 */
export function isPayoutReady(profile?: SellerProfile | null): boolean {
	return isIdentityVerified(profile) && isBankConfigured(profile);
}

/**
 * Checks if seller is eligible to withdraw money right now.
 * Requires:
 * 1. Available balance >= MINIMUM_WITHDRAWAL_AMOUNT (Rp100.000)
 * 2. Identity is verified
 * 3. Bank details are configured
 */
export function canWithdraw(availableBalance: number, profile?: SellerProfile | null): boolean {
	return availableBalance >= MINIMUM_WITHDRAWAL_AMOUNT && isPayoutReady(profile);
}

/**
 * Returns the recommended Settings sub-tab for setting up payouts.
 * - If identity is not verified -> 'verifikasi'
 * - If identity is verified but bank is incomplete -> 'rekening'
 * - If already ready -> null
 */
export function getPayoutSetupTarget(
	profile?: SellerProfile | null
): 'verifikasi' | 'rekening' | null {
	if (!isIdentityVerified(profile)) {
		return 'verifikasi';
	}
	if (!isBankConfigured(profile)) {
		return 'rekening';
	}
	return null;
}

/**
 * Standard Indonesian label for identity verification status.
 */
export function getVerificationStatusLabel(status?: SellerVerification['status']): string {
	switch (status) {
		case 'verified':
			return 'Identitas terverifikasi';
		case 'pending':
			return 'Proses verifikasi';
		case 'needs_update':
		case 'rejected':
			return 'Perlu diperbaiki';
		case 'unverified':
		default:
			return 'Belum diverifikasi';
	}
}
