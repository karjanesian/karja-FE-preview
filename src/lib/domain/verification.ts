import { SellerProfile, Order, SellerVerification } from '$lib/types';
import { isBankConfigured } from './payout';
import { isCompletedPaidSale } from './orderLifecycle';

/**
 * Karja Verified Rule-Based Eligibility Engine
 *
 * Separates administrative ID verification (KYC/compliance) from
 * reputation-based verification (Karja Verified badge).
 */

export const KARJA_VERIFIED_BADGE_URL = 'https://file.garden/ao1B7sLFNyZKt73m/verified%20logo.png';

export const KARJA_VERIFIED_RULES = {
	minCompletedOrders: 5,
	minDistinctBuyers: 3,
	maxDisputeRate: 0.05, // 5% max dispute rate
	maxFulfillmentFailureRate: 0.05 // 5% max failure rate
};

export interface VerificationRequirementItem {
	met: boolean;
	label: string;
	current?: number | string | boolean;
	required?: number | string | boolean;
	description?: string;
}

export interface VerificationEvaluation {
	isIdentityVerified: boolean;
	isKarjaVerified: boolean;
	karjaVerificationStatus: 'not_eligible' | 'eligible' | 'verified' | 'revoked';
	eligible: boolean;
	requirements: {
		identityVerified: VerificationRequirementItem;
		payoutVerified: VerificationRequirementItem;
		completedOrders: VerificationRequirementItem & { current: number; required: number };
		distinctBuyers: VerificationRequirementItem & { current: number; required: number };
		accountStanding: VerificationRequirementItem;
		trustSafetyClear: VerificationRequirementItem;
	};
	stats: {
		completedOrdersCount: number;
		distinctBuyersCount: number;
		totalOrdersCount: number;
		disputesCount: number;
		fulfillmentFailuresCount: number;
	};
	reason?: string;
}

/**
 * Checks if seller identity (e-KTP) has been approved by admin.
 */
export function isIdentityVerified(seller?: SellerProfile | null): boolean {
	return seller?.verification?.status === 'verified';
}

/**
 * Evaluates seller eligibility for the Karja Verified status.
 */
export function evaluateKarjaVerification(
	seller?: SellerProfile | null,
	orders: Order[] = [],
	options?: {
		disputesCount?: number;
		fulfillmentFailuresCount?: number;
		forceRevoked?: boolean;
		forceVerified?: boolean;
	}
): VerificationEvaluation {
	const verification = seller?.verification;
	const isIdVerified = isIdentityVerified(seller);
	const isPayoutConfigured = isBankConfigured(seller);

	// Filter completed, paid orders
	const completedOrders = orders.filter((o) => isCompletedPaidSale(o));
	const completedOrdersCount = completedOrders.length;

	// Calculate distinct real buyers by normalized email, phone, or name
	const distinctBuyerKeys = new Set<string>();
	completedOrders.forEach((o) => {
		const key =
			o.buyerEmail?.trim().toLowerCase() ||
			o.buyerPhone?.trim() ||
			o.buyerName?.trim().toLowerCase();
		if (key) distinctBuyerKeys.add(key);
	});
	const distinctBuyersCount = distinctBuyerKeys.size;

	const disputesCount = options?.disputesCount ?? 0;
	const fulfillmentFailuresCount = options?.fulfillmentFailuresCount ?? 0;

	const isSuspended = Boolean(verification?.isAccountSuspended);
	const hasTsViolation = Boolean(verification?.hasTrustSafetyViolation);
	const isExplicitlyRevoked =
		verification?.karjaVerifiedStatus === 'revoked' || options?.forceRevoked;

	// Requirement items
	const reqIdentity: VerificationRequirementItem = {
		met: isIdVerified,
		label: 'Identitas e-KTP terverifikasi',
		current: isIdVerified,
		description: 'Identitas e-KTP udah terverifikasi.'
	};

	const reqPayout: VerificationRequirementItem = {
		met: isPayoutConfigured,
		label: 'Rekening bank terdaftar',
		current: isPayoutConfigured,
		description: 'Rekening terdaftar atas nama pemilik akun.'
	};

	const reqOrders = {
		met: completedOrdersCount >= KARJA_VERIFIED_RULES.minCompletedOrders,
		label: 'Minimal 5 pesanan selesai',
		current: completedOrdersCount,
		required: KARJA_VERIFIED_RULES.minCompletedOrders,
		description: `${completedOrdersCount} dari ${KARJA_VERIFIED_RULES.minCompletedOrders} pesanan berbayar udah selesai.`
	};

	const reqBuyers = {
		met: distinctBuyersCount >= KARJA_VERIFIED_RULES.minDistinctBuyers,
		label: 'Minimal 3 pembeli berbeda',
		current: distinctBuyersCount,
		required: KARJA_VERIFIED_RULES.minDistinctBuyers,
		description: `${distinctBuyersCount} dari ${KARJA_VERIFIED_RULES.minDistinctBuyers} pembeli berbeda.`
	};

	const reqAccountStanding: VerificationRequirementItem = {
		met: !isSuspended && disputesCount === 0,
		label: 'Nggak ada sengketa aktif',
		current: !isSuspended && disputesCount === 0,
		description: 'Nggak ada sengketa aktif di akunmu.'
	};

	const reqTrustSafety: VerificationRequirementItem = {
		met: !hasTsViolation && fulfillmentFailuresCount === 0,
		label: 'Nggak ada pelanggaran aktif',
		current: !hasTsViolation,
		description: 'Nggak ada pelanggaran pedoman komunitas.'
	};

	const allRequirementsMet =
		reqIdentity.met &&
		reqPayout.met &&
		reqOrders.met &&
		reqBuyers.met &&
		reqAccountStanding.met &&
		reqTrustSafety.met;

	let karjaStatus: 'not_eligible' | 'eligible' | 'verified' | 'revoked' = 'not_eligible';

	if (isExplicitlyRevoked || isSuspended || hasTsViolation) {
		karjaStatus = 'revoked';
	} else if (
		options?.forceVerified ||
		verification?.karjaVerifiedStatus === 'verified' ||
		allRequirementsMet
	) {
		karjaStatus = 'verified';
	} else {
		karjaStatus = 'not_eligible';
	}

	// Active verified badge requires non-suspended, non-revoked standing
	const isKarjaVerified =
		karjaStatus === 'verified' && !isSuspended && !hasTsViolation && !isExplicitlyRevoked;

	return {
		isIdentityVerified: isIdVerified,
		isKarjaVerified,
		karjaVerificationStatus: karjaStatus,
		eligible: allRequirementsMet,
		requirements: {
			identityVerified: reqIdentity,
			payoutVerified: reqPayout,
			completedOrders: reqOrders,
			distinctBuyers: reqBuyers,
			accountStanding: reqAccountStanding,
			trustSafetyClear: reqTrustSafety
		},
		stats: {
			completedOrdersCount,
			distinctBuyersCount,
			totalOrdersCount: orders.length,
			disputesCount,
			fulfillmentFailuresCount
		},
		reason: isExplicitlyRevoked
			? verification?.karjaRevokedReason || 'Badge dijeda karena status akun perlu dicek.'
			: isSuspended
				? 'Akun lagi dijeda.'
				: undefined
	};
}

/**
 * Quick helper to check if seller currently has the Karja Verified badge.
 * Evaluates both explicit profile status and actual orders if provided.
 */
export function isKarjaVerified(seller?: SellerProfile | null, orders?: Order[]): boolean {
	if (!seller) return false;

	// Guard against suspended / revoked accounts
	if (seller.verification?.isAccountSuspended || seller.verification?.hasTrustSafetyViolation) {
		return false;
	}
	if (seller.verification?.karjaVerifiedStatus === 'revoked') {
		return false;
	}

	// Identity is a strict prerequisite
	if (seller.verification?.status !== 'verified') {
		return false;
	}

	// If explicit verified status is stored
	if (seller.verification?.karjaVerifiedStatus === 'verified') {
		return true;
	}

	// Evaluate dynamically using orders if provided, or evaluate profile criteria
	const evaluation = evaluateKarjaVerification(seller, orders || []);
	return evaluation.isKarjaVerified;
}

/**
 * Returns canonical trust level:
 * - 'karja_verified' : Identity verified + Karja Verified criteria met
 * - 'identity_verified' : Identity verified only
 * - 'unverified' : Not identity verified
 */
export function getSellerTrustLevel(
	seller?: SellerProfile | null,
	orders?: Order[]
): 'unverified' | 'identity_verified' | 'karja_verified' {
	if (isKarjaVerified(seller, orders)) {
		return 'karja_verified';
	}
	if (isIdentityVerified(seller)) {
		return 'identity_verified';
	}
	return 'unverified';
}
