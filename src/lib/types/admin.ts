/**
 * KARJA ADMIN & PLATFORM DOMAIN TYPES
 * Shared data structures across Admin, Public, and Multi-Seller contexts.
 */

// 1. Platform User & Role Model
export type PlatformRole =
	| 'seller'
	| 'super_admin'
	| 'ops'
	| 'finance'
	| 'trust_safety'
	| 'content_editor'
	| 'content_writer'
	| 'admin'; // Kept as alias to 'ops' for backwards-compatibility

export type PlatformUserStatus = 'active' | 'suspended' | 'disabled';

// Canonical RBAC Permission Identifiers
export type AdminPermission =
	| 'overview.read'
	| 'sellers.read'
	| 'sellers.restrict'
	| 'buyers.read'
	| 'products.read'
	| 'products.moderate'
	| 'orders.read'
	| 'orders.intervene'
	| 'transactions.read'
	| 'payouts.read'
	| 'payouts.approve'
	| 'payouts.hold'
	| 'payouts.reject'
	| 'finance.read'
	| 'verification.read'
	| 'verification.document.view'
	| 'verification.decide'
	| 'cases.read'
	| 'cases.resolve'
	| 'refunds.approve'
	| 'blog.read'
	| 'blog.write'
	| 'blog.publish'
	| 'blog.manage_categories'
	| 'blog.manage_authors'
	| 'blog.media'
	| 'storage.read'
	| 'storage.view_private'
	| 'storage.view_restricted'
	| 'storage.manage'
	| 'settings.read'
	| 'settings.write'
	| 'audit.read';

export interface PlatformUser {
	id: string;
	name: string;
	email: string;
	role: PlatformRole;
	status: PlatformUserStatus;
	createdAt: string;
	updatedAt: string;
	avatarUrl?: string;
	phone?: string;
}

// 2. Payment Domain
export type PaymentProvider = 'qris' | 'va' | 'ewallet' | 'mock_gateway';
export type PlatformPaymentStatus =
	'pending' | 'paid' | 'expired' | 'failed' | 'refunded' | 'partially_refunded';

export interface Payment {
	id: string;
	orderId: string;
	sellerId: string;
	buyerEmail: string;
	provider: PaymentProvider | string;
	method: string;
	providerReference?: string;
	amount: number;
	status: PlatformPaymentStatus;
	createdAt: string;
	expiresAt?: string;
	paidAt?: string;
	failedAt?: string;
	failureReason?: string;
	refundedAmount?: number;
}

// 3. Payout Admin Workflow
export type PayoutWorkflowStatus =
	'requested' | 'approved' | 'processing' | 'paid' | 'failed' | 'held' | 'rejected';

export interface ExtendedPayout {
	id: string;
	sellerId: string;
	amount: number;
	bankName: string;
	accountNumber: string;
	accountHolder: string;
	status: PayoutWorkflowStatus;
	requestedAt: string;
	arrivalEstimate?: string;
	referenceId: string;
	reviewedAt?: string;
	reviewedBy?: string;
	adminNote?: string;
	holdReason?: string;
	failureReason?: string;
	providerReference?: string;
	processedAt?: string;
	paidAt?: string;
}

// 4. Product Moderation
export type ProductModerationStatus =
	'not_required' | 'pending_review' | 'approved' | 'rejected' | 'suspended';

// 5. Trust & Safety: Reports
export type ReportTargetType = 'product' | 'seller';
export type ReportReason =
	'scam' | 'misleading_claim' | 'copyright' | 'harmful_content' | 'academic_cheating' | 'other';
export type ReportStatus = 'open' | 'reviewing' | 'action_taken' | 'dismissed' | 'resolved';
export type ReportPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Report {
	id: string;
	reporterType: 'buyer' | 'seller' | 'public' | 'system';
	reporterId?: string;
	reporterEmail?: string;
	targetType: ReportTargetType;
	targetId: string;
	sellerId?: string;
	productId?: string;
	reason: ReportReason;
	message?: string;
	status: ReportStatus;
	priority?: ReportPriority;
	createdAt: string;
	reviewedAt?: string;
	reviewedBy?: string;
	resolution?: string;
}

// 6. Trust & Safety: Disputes
export type DisputeStatus =
	| 'open'
	| 'waiting_seller'
	| 'waiting_buyer'
	| 'admin_review'
	| 'refund_approved'
	| 'refund_partial'
	| 'refund_rejected'
	| 'resolved';

export interface Dispute {
	id: string;
	orderId: string;
	sellerId: string;
	productId: string;
	buyerName?: string;
	buyerEmail: string;
	reason: string;
	buyerStatement: string;
	sellerResponse?: string;
	evidence?: string[];
	status: DisputeStatus;
	adminNote?: string;
	resolution?: string;
	refundAmount?: number;
	createdAt: string;
	sellerRespondedAt?: string;
	reviewedAt?: string;
	reviewedBy?: string;
	resolvedAt?: string;
}

// 7. Refund Domain
export type RefundStatus = 'pending' | 'completed' | 'failed';

export interface Refund {
	id: string;
	paymentId: string;
	orderId: string;
	sellerId: string;
	disputeId?: string;
	amount: number;
	reason: string;
	status: RefundStatus;
	createdAt: string;
	processedAt?: string;
	processedBy?: string;
	providerReference?: string;
}

// 8. Financial Ledger
export type LedgerEntryType =
	'sale' | 'platform_fee' | 'payment_fee' | 'refund' | 'payout' | 'adjustment';

export interface LedgerEntry {
	id: string;
	sellerId?: string;
	orderId?: string;
	paymentId?: string;
	payoutId?: string;
	refundId?: string;
	type: LedgerEntryType;
	amount: number;
	grossAmount?: number;
	karjaFee?: number;
	paymentFee?: number;
	sellerNet?: number;
	description?: string;
	createdAt: string;
}

// 9. Audit Log
export type AuditLogActorRole = PlatformRole | 'admin' | 'system' | 'seller';

export interface AuditLog {
	id: string;
	actorUserId: string;
	actorRole: AuditLogActorRole;
	action: string;
	entityType: string;
	entityId: string;
	previousValue?: any;
	newValue?: any;
	reason?: string;
	metadata?: Record<string, any>;
	createdAt: string;
}

// 10. Platform Settings & Configuration (Canonical Model)
export * from './fileAsset';
export * from './journeyEvents';
export * from './buyer';
export * from './blog';

export interface PlatformSettings {
	karjaFeePercent: number; // 7
	paymentFeePercent: number; // 2
	minimumWithdrawalAmount: number; // 100000
	supportContact: {
		email: string;
		whatsapp: string;
	};
	socialLinks: {
		instagram: string;
		tiktok: string;
		x: string;
	};
	legalLinks: {
		terms: string;
		privacy: string;
	};
	requireIdentityForPayout?: boolean;
}

export type PlatformConfig = PlatformSettings;

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
	karjaFeePercent: 7,
	paymentFeePercent: 2,
	minimumWithdrawalAmount: 100000,
	supportContact: {
		email: '',
		whatsapp: ''
	},
	socialLinks: {
		instagram: '',
		tiktok: '',
		x: ''
	},
	legalLinks: {
		terms: '/terms',
		privacy: '/privacy'
	},
	requireIdentityForPayout: false
};

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = DEFAULT_PLATFORM_SETTINGS;

// Aliases and Operational Models for Admin Console
export type UserReport = Report;
export type DisputeCase = Dispute;

// Alias for canonical BlogPost
export type AdminBlogPost = import('./blog').BlogPost;
