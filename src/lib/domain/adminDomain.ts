/**
 * KARJA ADMIN & PLATFORM DOMAIN LOGIC
 * Role & permission guards, transition validators, financial ledger calculations,
 * and backward-compatible seller data migration.
 */

import {
	PlatformUser,
	PlatformRole,
	AdminPermission,
	PayoutWorkflowStatus,
	ProductModerationStatus,
	ReportStatus,
	DisputeStatus,
	LedgerEntry,
	Payment
} from '$lib/types/admin';
import { AdminSubRoute } from '$lib/domain/adminRoutes';
import {
	SellerProfile,
	Product,
	Order,
	Transaction,
	Payout,
	Review,
	IdentityVerificationStatus
} from '$lib/types';

// ==========================================
// 1. Central RBAC Permission Matrix & Guards
// ==========================================

export const ALL_ADMIN_PERMISSIONS: AdminPermission[] = [
	'overview.read',
	'sellers.read',
	'sellers.restrict',
	'buyers.read',
	'products.read',
	'products.moderate',
	'orders.read',
	'orders.intervene',
	'transactions.read',
	'payouts.read',
	'payouts.approve',
	'payouts.hold',
	'payouts.reject',
	'finance.read',
	'verification.read',
	'verification.document.view',
	'verification.decide',
	'cases.read',
	'cases.resolve',
	'refunds.approve',
	'blog.read',
	'blog.write',
	'blog.publish',
	'blog.manage_categories',
	'blog.manage_authors',
	'blog.media',
	'storage.read',
	'storage.view_private',
	'storage.view_restricted',
	'storage.manage',
	'settings.read',
	'settings.write',
	'audit.read'
];

export const ROLE_PERMISSIONS: Record<PlatformRole, AdminPermission[]> = {
	super_admin: ALL_ADMIN_PERMISSIONS,

	ops: [
		'overview.read',
		'sellers.read',
		'sellers.restrict',
		'buyers.read',
		'products.read',
		'products.moderate',
		'orders.read',
		'orders.intervene',
		'transactions.read',
		'payouts.read',
		'verification.read',
		'cases.read',
		'storage.read',
		'storage.view_private',
		'audit.read'
	],

	finance: [
		'overview.read',
		'sellers.read',
		'buyers.read',
		'orders.read',
		'transactions.read',
		'payouts.read',
		'payouts.approve',
		'payouts.hold',
		'payouts.reject',
		'finance.read',
		'verification.read',
		'cases.read',
		'refunds.approve',
		'audit.read'
	],

	trust_safety: [
		'overview.read',
		'sellers.read',
		'sellers.restrict',
		'buyers.read',
		'products.read',
		'products.moderate',
		'orders.read',
		'transactions.read',
		'verification.read',
		'verification.document.view',
		'verification.decide',
		'cases.read',
		'cases.resolve',
		'storage.read',
		'storage.view_private',
		'storage.view_restricted',
		'audit.read'
	],

	content_editor: [
		'blog.read',
		'blog.write',
		'blog.publish',
		'blog.manage_categories',
		'blog.manage_authors',
		'blog.media'
	],

	content_writer: ['blog.read', 'blog.write', 'blog.media'],

	// LEGACY ALIAS: Mapped safely to ops permissions for backwards-compatibility
	admin: [
		'overview.read',
		'sellers.read',
		'sellers.restrict',
		'buyers.read',
		'products.read',
		'products.moderate',
		'orders.read',
		'orders.intervene',
		'transactions.read',
		'payouts.read',
		'verification.read',
		'cases.read',
		'storage.read',
		'storage.view_private',
		'audit.read'
	],

	seller: []
};

export const ADMIN_ROUTE_PERMISSIONS: Partial<Record<AdminSubRoute, AdminPermission>> = {
	overview: 'overview.read',
	sellers: 'sellers.read',
	buyers: 'buyers.read',
	products: 'products.read',
	orders: 'orders.read',
	transactions: 'transactions.read',
	payouts: 'payouts.read',
	finance: 'finance.read',
	verifications: 'verification.read',
	cases: 'cases.read',
	blog: 'blog.read',
	storage: 'storage.read',
	settings: 'settings.read'
};

export type AdminAccessDecision =
	| { allowed: true; reason: 'authorized'; user: PlatformUser }
	| {
			allowed: false;
			reason: 'unauthenticated' | 'forbidden' | 'suspended' | 'disabled';
			user: PlatformUser | null;
	  };

/**
 * Returns canonical permissions for any PlatformUser.
 */
export function getUserPermissions(user: PlatformUser | null | undefined): AdminPermission[] {
	if (!user || user.status !== 'active') return [];
	if (user.role === 'super_admin') return ALL_ADMIN_PERMISSIONS;
	return ROLE_PERMISSIONS[user.role] || [];
}

/**
 * Checks if user has a specific permission.
 */
export function hasPermission(
	user: PlatformUser | null | undefined,
	permission: AdminPermission
): boolean {
	if (!user || user.status !== 'active') return false;
	if (user.role === 'super_admin') return true;
	const permissions = ROLE_PERMISSIONS[user.role] || [];
	return permissions.includes(permission);
}

/**
 * Checks if user has any of the listed permissions.
 */
export function hasAnyPermission(
	user: PlatformUser | null | undefined,
	permissions: AdminPermission[]
): boolean {
	if (!user || user.status !== 'active') return false;
	if (user.role === 'super_admin') return true;
	return permissions.some((p) => hasPermission(user, p));
}

/**
 * Checks if user has all of the listed permissions.
 */
export function hasAllPermissions(
	user: PlatformUser | null | undefined,
	permissions: AdminPermission[]
): boolean {
	if (!user || user.status !== 'active') return false;
	if (user.role === 'super_admin') return true;
	return permissions.every((p) => hasPermission(user, p));
}

/**
 * Checks if user can access an Admin subroute.
 */
export function canAccessAdminRoute(
	user: PlatformUser | null | undefined,
	route: AdminSubRoute
): boolean {
	if (!user || user.status !== 'active') return false;
	if (route === 'login') return true;
	const required = ADMIN_ROUTE_PERMISSIONS[route];
	if (!required) return user.role === 'super_admin';
	return hasPermission(user, required);
}

/**
 * Returns default landing subroute based on role and permissions.
 */
export function getDefaultAdminSubroute(user: PlatformUser | null | undefined): AdminSubRoute {
	if (!user || user.status !== 'active') return 'login';
	if (user.role === 'content_editor' || user.role === 'content_writer') {
		return 'blog';
	}
	if (hasPermission(user, 'overview.read')) {
		return 'overview';
	}
	const candidateRoutes: AdminSubRoute[] = [
		'overview',
		'sellers',
		'buyers',
		'products',
		'orders',
		'transactions',
		'payouts',
		'finance',
		'verifications',
		'cases',
		'blog',
		'storage',
		'settings'
	];
	for (const r of candidateRoutes) {
		if (canAccessAdminRoute(user, r)) return r;
	}
	return 'login';
}

/**
 * Human-friendly role display label in Karja Indonesian tone.
 */
export function getRoleDisplayName(role: PlatformRole): string {
	switch (role) {
		case 'super_admin':
			return 'Super Admin';
		case 'ops':
			return 'Tim Operasional';
		case 'finance':
			return 'Finance & Payout';
		case 'trust_safety':
			return 'Trust & Safety';
		case 'content_editor':
			return 'Content Editor';
		case 'content_writer':
			return 'Content Writer';
		case 'admin':
			return 'Admin Ops';
		case 'seller':
			return 'Seller Karja';
		default:
			return role;
	}
}

/**
 * Checks if a user has active administrative privileges.
 */
export function canAccessAdmin(user: PlatformUser | null | undefined): boolean {
	if (!user || user.status !== 'active') return false;
	if (user.role === 'seller') return false;
	const permissions = getUserPermissions(user);
	return permissions.length > 0;
}

/**
 * Detailed access check for Admin router and view gates.
 */
export function checkAdminAccess(user: PlatformUser | null | undefined): AdminAccessDecision {
	if (!user) {
		return { allowed: false, reason: 'unauthenticated', user: null };
	}
	if (user.status === 'suspended') {
		return { allowed: false, reason: 'suspended', user };
	}
	if (user.status === 'disabled') {
		return { allowed: false, reason: 'disabled', user };
	}
	if (user.role === 'seller' || !canAccessAdmin(user)) {
		return { allowed: false, reason: 'forbidden', user };
	}
	return { allowed: true, reason: 'authorized', user };
}

// ==========================================
// 2. Payout Workflow Transitions
// ==========================================
// Flow: requested -> approved / held / rejected
// approved -> processing -> paid / failed
// held -> approved / rejected
const PAYOUT_TRANSITIONS: Record<PayoutWorkflowStatus, PayoutWorkflowStatus[]> = {
	requested: ['approved', 'held', 'rejected'],
	approved: ['processing', 'held', 'rejected'],
	processing: ['paid', 'failed'],
	held: ['approved', 'rejected'],
	rejected: [],
	paid: [],
	failed: ['requested', 'approved'] // allow retry
};

export function canTransitionPayoutStatus(
	current: PayoutWorkflowStatus,
	next: PayoutWorkflowStatus
): boolean {
	if (current === next) return true;
	const allowed = PAYOUT_TRANSITIONS[current] || [];
	return allowed.includes(next);
}

// ==========================================
// 3. Identity Verification Transitions
// ==========================================
const VERIFICATION_TRANSITIONS: Record<IdentityVerificationStatus, IdentityVerificationStatus[]> = {
	unverified: ['pending'],
	pending: ['verified', 'needs_update', 'rejected'],
	needs_update: ['pending', 'rejected'],
	rejected: ['pending'], // allow seller re-submission
	verified: ['needs_update', 'rejected'] // revocable by admin if fraud discovered
};

export function canTransitionVerificationStatus(
	current: IdentityVerificationStatus,
	next: IdentityVerificationStatus
): boolean {
	if (current === next) return true;
	const allowed = VERIFICATION_TRANSITIONS[current] || [];
	return allowed.includes(next);
}

// ==========================================
// 4. Product Moderation Transitions
// ==========================================
const MODERATION_TRANSITIONS: Record<ProductModerationStatus, ProductModerationStatus[]> = {
	not_required: ['pending_review', 'approved'],
	pending_review: ['approved', 'rejected'],
	approved: ['suspended', 'pending_review'],
	rejected: ['pending_review'],
	suspended: ['approved', 'rejected']
};

export function canTransitionProductModerationStatus(
	current: ProductModerationStatus,
	next: ProductModerationStatus
): boolean {
	if (current === next) return true;
	const allowed = MODERATION_TRANSITIONS[current] || [];
	return allowed.includes(next);
}

// ==========================================
// 5. Trust & Safety: Report Transitions
// ==========================================
const REPORT_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
	open: ['reviewing', 'dismissed'],
	reviewing: ['action_taken', 'dismissed', 'resolved'],
	action_taken: ['resolved'],
	dismissed: ['reviewing'], // can reopen if new evidence
	resolved: []
};

export function canTransitionReportStatus(current: ReportStatus, next: ReportStatus): boolean {
	if (current === next) return true;
	const allowed = REPORT_TRANSITIONS[current] || [];
	return allowed.includes(next);
}

// ==========================================
// 6. Trust & Safety: Dispute Transitions
// ==========================================
const DISPUTE_TRANSITIONS: Record<DisputeStatus, DisputeStatus[]> = {
	open: ['waiting_seller', 'waiting_buyer', 'admin_review'],
	waiting_seller: ['admin_review', 'waiting_buyer', 'resolved'],
	waiting_buyer: ['admin_review', 'resolved'],
	admin_review: ['refund_approved', 'refund_partial', 'refund_rejected', 'resolved'],
	refund_approved: ['resolved'],
	refund_partial: ['resolved'],
	refund_rejected: ['resolved'],
	resolved: []
};

export function canTransitionDisputeStatus(current: DisputeStatus, next: DisputeStatus): boolean {
	if (current === next) return true;
	const allowed = DISPUTE_TRANSITIONS[current] || [];
	return allowed.includes(next);
}

// ==========================================
// 7. Karja Financial Calculations & Ledger
// ==========================================
export interface PlatformFinancialSummary {
	gmv: number; // Total gross transaction value
	karjaRevenue: number; // Platform fee (7%)
	paymentFees: number; // Payment gateway costs (2%)
	sellerEarnings: number; // Net earnings attributable to sellers (91%)
	completedPayouts: number; // Successfully paid out to sellers
	refundsTotal: number; // Total refunds issued
	outstandingLiability: number; // Unwithdrawn seller balance
}

/**
 * Calculates platform financial breakdown from ledger entries.
 * Adheres strictly to Karja economic model:
 * GMV != Revenue. Karja Revenue = 7%. Payment Fee = 2%. Seller = 91%.
 */
export function calculatePlatformFinancials(entries: LedgerEntry[]): PlatformFinancialSummary {
	let gmv = 0;
	let karjaRevenue = 0;
	let paymentFees = 0;
	let sellerEarnings = 0;
	let completedPayouts = 0;
	let refundsTotal = 0;

	for (const entry of entries) {
		if (entry.type === 'sale') {
			const gross = entry.grossAmount !== undefined ? entry.grossAmount : entry.amount;
			gmv += gross;
			karjaRevenue += entry.karjaFee !== undefined ? entry.karjaFee : Math.round(gross * 0.07);
			paymentFees += entry.paymentFee !== undefined ? entry.paymentFee : Math.round(gross * 0.02);
			sellerEarnings +=
				entry.sellerNet !== undefined ? entry.sellerNet : gross - Math.round(gross * 0.09);
		} else if (entry.type === 'platform_fee') {
			karjaRevenue += entry.amount;
		} else if (entry.type === 'payment_fee') {
			paymentFees += entry.amount;
		} else if (entry.type === 'payout') {
			completedPayouts += entry.amount;
		} else if (entry.type === 'refund') {
			refundsTotal += entry.amount;
		}
	}

	// Outstanding liability: Seller earnings minus payouts and refunds
	const outstandingLiability = Math.max(0, sellerEarnings - completedPayouts - refundsTotal);

	return {
		gmv,
		karjaRevenue,
		paymentFees,
		sellerEarnings,
		completedPayouts,
		refundsTotal,
		outstandingLiability
	};
}

// ==========================================
// 8. Backward-Compatible Multi-Seller Data Migration
// ==========================================
export interface MultiSellerNormalizedState {
	sellerProfile: SellerProfile;
	products: Product[];
	orders: Order[];
	transactions: Transaction[];
	payouts: Payout[];
	reviews: Review[];
}

/**
 * Normalizes legacy v1.4 single-seller data by guaranteeing stable seller identifiers.
 * Assigns sellerId to all unowned entities without breaking existing data structures or UI.
 */
export function normalizeLegacySellerData(state: {
	sellerProfile: SellerProfile;
	products: Product[];
	orders: Order[];
	transactions: Transaction[];
	payouts: Payout[];
	reviews?: Review[];
}): MultiSellerNormalizedState {
	const stableSellerId =
		state.sellerProfile.id || `seller_${state.sellerProfile.username || 'primary'}`;
	const stableUserId =
		state.sellerProfile.userId || `user_${state.sellerProfile.username || 'primary'}`;

	const normalizedProfile: SellerProfile = {
		...state.sellerProfile,
		id: stableSellerId,
		userId: stableUserId
	};

	const normalizedProducts: Product[] = state.products.map((p) => ({
		...p,
		sellerId: p.sellerId || stableSellerId,
		moderationStatus: p.moderationStatus || 'approved'
	}));

	const normalizedOrders: Order[] = state.orders.map((o) => ({
		...o,
		sellerId: o.sellerId || stableSellerId
	}));

	const normalizedTransactions: Transaction[] = state.transactions.map((t) => ({
		...t,
		sellerId: t.sellerId || stableSellerId
	}));

	const normalizedPayouts: Payout[] = state.payouts.map((p) => ({
		...p,
		sellerId: p.sellerId || stableSellerId
	}));

	const normalizedReviews: Review[] = (state.reviews || []).map((r) => ({
		...r,
		sellerId: r.sellerId || stableSellerId
	}));

	return {
		sellerProfile: normalizedProfile,
		products: normalizedProducts,
		orders: normalizedOrders,
		transactions: normalizedTransactions,
		payouts: normalizedPayouts,
		reviews: normalizedReviews
	};
}
