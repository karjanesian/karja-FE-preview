import { test } from 'vitest';
import assert from 'node:assert';
import {
	canAccessAdmin,
	checkAdminAccess,
	canTransitionPayoutStatus,
	canTransitionVerificationStatus,
	canTransitionProductModerationStatus,
	canTransitionReportStatus,
	canTransitionDisputeStatus,
	calculatePlatformFinancials,
	normalizeLegacySellerData
} from '$lib/domain/adminDomain';
import { isReservedSlug, validateSellerUsername } from '$lib/domain/reservedSlugs';
import { PlatformUser, LedgerEntry } from '$lib/types/admin';
import { SellerProfile, Product, Order, Transaction, Payout } from '$lib/types';

// ====================================================
// 1. Role / Permission Guard Tests
// ====================================================
test('Role guard: denies unauthenticated / null user', () => {
	assert.strictEqual(canAccessAdmin(null), false);
	assert.strictEqual(canAccessAdmin(undefined), false);

	const check = checkAdminAccess(null);
	assert.strictEqual(check.allowed, false);
	assert.strictEqual(check.reason, 'unauthenticated');
});

test('Role guard: denies seller role from admin access', () => {
	const sellerUser: PlatformUser = {
		id: 'user_seller_1',
		name: 'Budi Seller',
		email: 'budi@karja.id',
		role: 'seller',
		status: 'active',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	assert.strictEqual(canAccessAdmin(sellerUser), false);
	const check = checkAdminAccess(sellerUser);
	assert.strictEqual(check.allowed, false);
	assert.strictEqual(check.reason, 'forbidden');
});

test('Role guard: allows active admin and super_admin', () => {
	const adminUser: PlatformUser = {
		id: 'user_admin_1',
		name: 'Riana Ops',
		email: 'riana@karja.id',
		role: 'admin',
		status: 'active',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	const superAdminUser: PlatformUser = {
		id: 'user_super_1',
		name: 'Bima Super',
		email: 'bima@karja.id',
		role: 'super_admin',
		status: 'active',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	assert.strictEqual(canAccessAdmin(adminUser), true);
	assert.strictEqual(canAccessAdmin(superAdminUser), true);

	assert.strictEqual(checkAdminAccess(adminUser).allowed, true);
	assert.strictEqual(checkAdminAccess(superAdminUser).allowed, true);
});

test('Role guard: rejects suspended or disabled admin', () => {
	const suspendedAdmin: PlatformUser = {
		id: 'user_admin_suspended',
		name: 'Suspended Admin',
		email: 'suspended@karja.id',
		role: 'admin',
		status: 'suspended',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	assert.strictEqual(canAccessAdmin(suspendedAdmin), false);
	assert.strictEqual(checkAdminAccess(suspendedAdmin).reason, 'suspended');
});

// ====================================================
// 2. Reserved-Route & Username Validation Tests
// ====================================================
test('Reserved slugs: correctly recognizes system routes', () => {
	assert.strictEqual(isReservedSlug('admin'), true);
	assert.strictEqual(isReservedSlug('ADMIN'), true);
	assert.strictEqual(isReservedSlug('login'), true);
	assert.strictEqual(isReservedSlug('blog'), true);
	assert.strictEqual(isReservedSlug('orders'), true);
	assert.strictEqual(isReservedSlug('settings'), true);
	assert.strictEqual(isReservedSlug('toko'), true);
	assert.strictEqual(isReservedSlug('uangmu'), true);
	assert.strictEqual(isReservedSlug('temankarja'), false);
	assert.strictEqual(isReservedSlug('sarah_desain'), false);
});

test('Username validation: prevents reserved usernames', () => {
	const adminRes = validateSellerUsername('admin');
	assert.strictEqual(adminRes.valid, false);
	assert.match(adminRes.error || '', /dicadangkan untuk sistem/);

	const blogRes = validateSellerUsername('blog');
	assert.strictEqual(blogRes.valid, false);

	const validRes = validateSellerUsername('andipratama');
	assert.strictEqual(validRes.valid, true);

	const shortRes = validateSellerUsername('ab');
	assert.strictEqual(shortRes.valid, false);

	const invalidChar = validateSellerUsername('user@karja');
	assert.strictEqual(invalidChar.valid, false);
});

// ====================================================
// 3. Seller Ownership Migration Tests
// ====================================================
test('Seller ownership migration: assigns stable ID to legacy unowned data', () => {
	const legacyProfile: SellerProfile = {
		name: 'Sari Ayu',
		username: 'sariayu',
		tagline: 'Desain Grafis',
		bio: 'Menyediakan template canva',
		topics: ['desain'],
		whatsapp: '08123456789',
		instagram: 'sariayu',
		linkedin: '',
		tiktok: '',
		showWhatsappOnStore: true,
		avatarUrl: 'https://avatar.com/sari',
		bankInfo: { bank: 'BCA', accountNumber: '1234567890', accountHolder: 'Sari Ayu' }
	};

	const legacyProducts: Product[] = [
		{
			id: 'prod_1',
			title: 'Template Canva',
			slug: 'template-canva',
			type: 'digital',
			category: 'Desain',
			price: 50000,
			priceMode: 'fixed',
			visibility: 'store',
			status: 'active',
			images: [],
			targetAudience: '',
			problemSolved: '',
			whatYouGet: '',
			howItWorks: '',
			aboutCreator: '',
			faqs: [],
			views: 10,
			sales: 2,
			revenue: 100000,
			buyClicks: 5,
			createdAt: '2026-09-01'
		}
	];

	const legacyOrders: Order[] = [
		{
			id: 'ord_1',
			orderNumber: 'KJ-001',
			buyerName: 'Buyer 1',
			buyerEmail: 'buyer@test.com',
			buyerPhone: '0811111111',
			productId: 'prod_1',
			productTitle: 'Template Canva',
			productType: 'digital',
			amount: 50000,
			karjaFee: 3500,
			paymentFee: 1000,
			netAmount: 45500,
			paymentStatus: 'lunas',
			fulfillmentStatus: 'selesai',
			createdAt: '2026-09-02'
		}
	];

	const normalized = normalizeLegacySellerData({
		sellerProfile: legacyProfile,
		products: legacyProducts,
		orders: legacyOrders,
		transactions: [],
		payouts: []
	});

	assert.ok(normalized.sellerProfile.id);
	assert.strictEqual(normalized.products[0].sellerId, normalized.sellerProfile.id);
	assert.strictEqual(normalized.orders[0].sellerId, normalized.sellerProfile.id);
	assert.strictEqual(normalized.products[0].moderationStatus, 'approved');
});

// ====================================================
// 4. Payout Workflow Transitions Tests
// ====================================================
test('Payout transitions: enforces legitimate operational lifecycle', () => {
	// requested -> approved (OK)
	assert.strictEqual(canTransitionPayoutStatus('requested', 'approved'), true);
	// requested -> held (OK)
	assert.strictEqual(canTransitionPayoutStatus('requested', 'held'), true);
	// requested -> rejected (OK)
	assert.strictEqual(canTransitionPayoutStatus('requested', 'rejected'), true);
	// approved -> processing (OK)
	assert.strictEqual(canTransitionPayoutStatus('approved', 'processing'), true);
	// processing -> paid (OK)
	assert.strictEqual(canTransitionPayoutStatus('processing', 'paid'), true);
	// processing -> failed (OK)
	assert.strictEqual(canTransitionPayoutStatus('processing', 'failed'), true);
	// paid -> requested (Forbidden)
	assert.strictEqual(canTransitionPayoutStatus('paid', 'requested'), false);
	// rejected -> approved (Forbidden)
	assert.strictEqual(canTransitionPayoutStatus('rejected', 'approved'), false);
});

// ====================================================
// 5. Verification Transitions Tests
// ====================================================
test('Verification transitions: supports review workflow', () => {
	assert.strictEqual(canTransitionVerificationStatus('unverified', 'pending'), true);
	assert.strictEqual(canTransitionVerificationStatus('pending', 'verified'), true);
	assert.strictEqual(canTransitionVerificationStatus('pending', 'needs_update'), true);
	assert.strictEqual(canTransitionVerificationStatus('pending', 'rejected'), true);
	assert.strictEqual(canTransitionVerificationStatus('needs_update', 'pending'), true);
	assert.strictEqual(canTransitionVerificationStatus('verified', 'needs_update'), true);
});

// ====================================================
// 6. Report Transitions Tests
// ====================================================
test('Report transitions: enforces review and resolution flow', () => {
	assert.strictEqual(canTransitionReportStatus('open', 'reviewing'), true);
	assert.strictEqual(canTransitionReportStatus('reviewing', 'action_taken'), true);
	assert.strictEqual(canTransitionReportStatus('reviewing', 'dismissed'), true);
	assert.strictEqual(canTransitionReportStatus('action_taken', 'resolved'), true);
	assert.strictEqual(canTransitionReportStatus('resolved', 'open'), false);
});

// ====================================================
// 7. Dispute Transitions Tests
// ====================================================
test('Dispute transitions: connects order dispute steps', () => {
	assert.strictEqual(canTransitionDisputeStatus('open', 'waiting_seller'), true);
	assert.strictEqual(canTransitionDisputeStatus('waiting_seller', 'admin_review'), true);
	assert.strictEqual(canTransitionDisputeStatus('admin_review', 'refund_approved'), true);
	assert.strictEqual(canTransitionDisputeStatus('admin_review', 'refund_rejected'), true);
	assert.strictEqual(canTransitionDisputeStatus('refund_approved', 'resolved'), true);
	assert.strictEqual(canTransitionDisputeStatus('resolved', 'open'), false);
});

// ====================================================
// 8. Financial Ledger Calculation Tests
// ====================================================
test('Ledger calculation: accurately distinguishes GMV, Karja Fee 7%, Payment 2%, and Liability', () => {
	const entries: LedgerEntry[] = [
		{
			id: 'ledg_1',
			type: 'sale',
			amount: 100000,
			grossAmount: 100000,
			karjaFee: 7000,
			paymentFee: 2000,
			sellerNet: 91000,
			createdAt: '2026-09-10'
		},
		{
			id: 'ledg_2',
			type: 'sale',
			amount: 200000,
			grossAmount: 200000,
			karjaFee: 14000,
			paymentFee: 4000,
			sellerNet: 182000,
			createdAt: '2026-09-11'
		},
		{
			id: 'ledg_3',
			type: 'payout',
			amount: 100000,
			createdAt: '2026-09-12'
		}
	];

	const financials = calculatePlatformFinancials(entries);

	// Total GMV = 100k + 200k = 300k
	assert.strictEqual(financials.gmv, 300000);
	// Karja Revenue (7%) = 7k + 14k = 21k
	assert.strictEqual(financials.karjaRevenue, 21000);
	// Payment Costs (2%) = 2k + 4k = 6k
	assert.strictEqual(financials.paymentFees, 6000);
	// Seller Earnings = 91k + 182k = 273k
	assert.strictEqual(financials.sellerEarnings, 273000);
	// Completed Payouts = 100k
	assert.strictEqual(financials.completedPayouts, 100000);
	// Outstanding Seller Liability = 273k - 100k = 173k
	assert.strictEqual(financials.outstandingLiability, 173000);
});

// ====================================================
// 9. Legacy Data Migration Tests
// ====================================================
test('Legacy data migration: preserves existing properties without breaking structure', () => {
	const legacyProfile: SellerProfile = {
		name: 'Budi Test',
		username: 'buditest',
		tagline: 'Tagline',
		bio: 'Bio',
		topics: [],
		whatsapp: '0812',
		instagram: '',
		linkedin: '',
		tiktok: '',
		showWhatsappOnStore: false,
		avatarUrl: '',
		bankInfo: { bank: 'BCA', accountNumber: '123', accountHolder: 'Budi' }
	};

	const res = normalizeLegacySellerData({
		sellerProfile: legacyProfile,
		products: [],
		orders: [],
		transactions: [],
		payouts: []
	});

	assert.strictEqual(res.sellerProfile.name, 'Budi Test');
	assert.strictEqual(res.sellerProfile.username, 'buditest');
	assert.strictEqual(res.sellerProfile.id, 'seller_buditest');
	assert.strictEqual(res.sellerProfile.userId, 'user_buditest');
});

// ====================================================
// 11. RBAC Permissions Matrix Tests
// ====================================================
import {
	hasPermission,
	canAccessAdminRoute,
	getDefaultAdminSubroute
} from '$lib/domain/adminDomain';

test('RBAC: Super Admin has full platform permissions across all subroutes and actions', () => {
	const superAdmin: PlatformUser = {
		id: 'u_super',
		name: 'Super User',
		email: 'super@karja.id',
		role: 'super_admin',
		status: 'active',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	assert.strictEqual(hasPermission(superAdmin, 'overview.read'), true);
	assert.strictEqual(hasPermission(superAdmin, 'finance.read'), true);
	assert.strictEqual(hasPermission(superAdmin, 'payouts.approve'), true);
	assert.strictEqual(hasPermission(superAdmin, 'verification.decide'), true);
	assert.strictEqual(hasPermission(superAdmin, 'verification.document.view'), true);
	assert.strictEqual(hasPermission(superAdmin, 'storage.view_restricted'), true);
	assert.strictEqual(hasPermission(superAdmin, 'storage.manage'), true);
	assert.strictEqual(hasPermission(superAdmin, 'settings.write'), true);
	assert.strictEqual(hasPermission(superAdmin, 'blog.publish'), true);

	assert.strictEqual(canAccessAdminRoute(superAdmin, 'overview'), true);
	assert.strictEqual(canAccessAdminRoute(superAdmin, 'finance'), true);
	assert.strictEqual(canAccessAdminRoute(superAdmin, 'storage'), true);
	assert.strictEqual(canAccessAdminRoute(superAdmin, 'settings'), true);
	assert.strictEqual(getDefaultAdminSubroute(superAdmin), 'overview');
});

test('RBAC: Operations role enforces least privilege (cannot view KTP, decide verifications, resolve cases, approve payouts, or manage storage)', () => {
	const opsUser: PlatformUser = {
		id: 'u_ops',
		name: 'Ops User',
		email: 'ops@karja.id',
		role: 'ops',
		status: 'active',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	// Allowed Ops permissions
	assert.strictEqual(hasPermission(opsUser, 'overview.read'), true);
	assert.strictEqual(hasPermission(opsUser, 'sellers.read'), true);
	assert.strictEqual(hasPermission(opsUser, 'sellers.restrict'), true);
	assert.strictEqual(hasPermission(opsUser, 'buyers.read'), true);
	assert.strictEqual(hasPermission(opsUser, 'products.read'), true);
	assert.strictEqual(hasPermission(opsUser, 'products.moderate'), true);
	assert.strictEqual(hasPermission(opsUser, 'orders.read'), true);
	assert.strictEqual(hasPermission(opsUser, 'orders.intervene'), true);
	assert.strictEqual(hasPermission(opsUser, 'transactions.read'), true);
	assert.strictEqual(hasPermission(opsUser, 'payouts.read'), true);
	assert.strictEqual(hasPermission(opsUser, 'verification.read'), true);
	assert.strictEqual(hasPermission(opsUser, 'cases.read'), true);
	assert.strictEqual(hasPermission(opsUser, 'storage.read'), true);
	assert.strictEqual(hasPermission(opsUser, 'storage.view_private'), true);
	assert.strictEqual(hasPermission(opsUser, 'audit.read'), true);

	// Strictly Forbidden for Ops
	assert.strictEqual(hasPermission(opsUser, 'verification.document.view'), false);
	assert.strictEqual(hasPermission(opsUser, 'verification.decide'), false);
	assert.strictEqual(hasPermission(opsUser, 'cases.resolve'), false);
	assert.strictEqual(hasPermission(opsUser, 'refunds.approve'), false);
	assert.strictEqual(hasPermission(opsUser, 'storage.view_restricted'), false);
	assert.strictEqual(hasPermission(opsUser, 'storage.manage'), false);
	assert.strictEqual(hasPermission(opsUser, 'payouts.approve'), false);
	assert.strictEqual(hasPermission(opsUser, 'payouts.hold'), false);
	assert.strictEqual(hasPermission(opsUser, 'payouts.reject'), false);
	assert.strictEqual(hasPermission(opsUser, 'finance.read'), false);
	assert.strictEqual(hasPermission(opsUser, 'settings.write'), false);

	// Route access
	assert.strictEqual(canAccessAdminRoute(opsUser, 'overview'), true);
	assert.strictEqual(canAccessAdminRoute(opsUser, 'sellers'), true);
	assert.strictEqual(canAccessAdminRoute(opsUser, 'products'), true);
	assert.strictEqual(canAccessAdminRoute(opsUser, 'orders'), true);
	assert.strictEqual(canAccessAdminRoute(opsUser, 'transactions'), true);
	assert.strictEqual(canAccessAdminRoute(opsUser, 'payouts'), true);
	assert.strictEqual(canAccessAdminRoute(opsUser, 'verifications'), true);
	assert.strictEqual(canAccessAdminRoute(opsUser, 'cases'), true);
	assert.strictEqual(canAccessAdminRoute(opsUser, 'storage'), true);
	assert.strictEqual(canAccessAdminRoute(opsUser, 'finance'), false);
	assert.strictEqual(canAccessAdminRoute(opsUser, 'blog'), false);
	assert.strictEqual(canAccessAdminRoute(opsUser, 'settings'), false);
	assert.strictEqual(getDefaultAdminSubroute(opsUser), 'overview');
});

test('RBAC: Trust & Safety role owns identity review and case decisions, but cannot approve payouts or access finance', () => {
	const tsUser: PlatformUser = {
		id: 'u_ts',
		name: 'Trust Safety User',
		email: 'trust@karja.id',
		role: 'trust_safety',
		status: 'active',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	// Allowed
	assert.strictEqual(hasPermission(tsUser, 'overview.read'), true);
	assert.strictEqual(hasPermission(tsUser, 'sellers.read'), true);
	assert.strictEqual(hasPermission(tsUser, 'sellers.restrict'), true);
	assert.strictEqual(hasPermission(tsUser, 'buyers.read'), true);
	assert.strictEqual(hasPermission(tsUser, 'products.read'), true);
	assert.strictEqual(hasPermission(tsUser, 'products.moderate'), true);
	assert.strictEqual(hasPermission(tsUser, 'orders.read'), true);
	assert.strictEqual(hasPermission(tsUser, 'transactions.read'), true);
	assert.strictEqual(hasPermission(tsUser, 'verification.read'), true);
	assert.strictEqual(hasPermission(tsUser, 'verification.document.view'), true);
	assert.strictEqual(hasPermission(tsUser, 'verification.decide'), true);
	assert.strictEqual(hasPermission(tsUser, 'cases.read'), true);
	assert.strictEqual(hasPermission(tsUser, 'cases.resolve'), true);
	assert.strictEqual(hasPermission(tsUser, 'storage.read'), true);
	assert.strictEqual(hasPermission(tsUser, 'storage.view_private'), true);
	assert.strictEqual(hasPermission(tsUser, 'storage.view_restricted'), true);
	assert.strictEqual(hasPermission(tsUser, 'audit.read'), true);

	// Forbidden
	assert.strictEqual(hasPermission(tsUser, 'payouts.approve'), false);
	assert.strictEqual(hasPermission(tsUser, 'payouts.hold'), false);
	assert.strictEqual(hasPermission(tsUser, 'payouts.reject'), false);
	assert.strictEqual(hasPermission(tsUser, 'finance.read'), false);
	assert.strictEqual(hasPermission(tsUser, 'refunds.approve'), false);
	assert.strictEqual(hasPermission(tsUser, 'storage.manage'), false);
	assert.strictEqual(hasPermission(tsUser, 'settings.write'), false);
	assert.strictEqual(hasPermission(tsUser, 'blog.publish'), false);

	// Routes
	assert.strictEqual(canAccessAdminRoute(tsUser, 'overview'), true);
	assert.strictEqual(canAccessAdminRoute(tsUser, 'verifications'), true);
	assert.strictEqual(canAccessAdminRoute(tsUser, 'cases'), true);
	assert.strictEqual(canAccessAdminRoute(tsUser, 'storage'), true);
	assert.strictEqual(canAccessAdminRoute(tsUser, 'finance'), false);
	assert.strictEqual(canAccessAdminRoute(tsUser, 'blog'), false);
	assert.strictEqual(canAccessAdminRoute(tsUser, 'settings'), false);
	assert.strictEqual(getDefaultAdminSubroute(tsUser), 'overview');
});

test('RBAC: Finance role owns payout approvals and financial ledger, but cannot view KTP documents or moderate products', () => {
	const financeUser: PlatformUser = {
		id: 'u_fin',
		name: 'Finance User',
		email: 'finance@karja.id',
		role: 'finance',
		status: 'active',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	// Allowed
	assert.strictEqual(hasPermission(financeUser, 'overview.read'), true);
	assert.strictEqual(hasPermission(financeUser, 'sellers.read'), true);
	assert.strictEqual(hasPermission(financeUser, 'buyers.read'), true);
	assert.strictEqual(hasPermission(financeUser, 'orders.read'), true);
	assert.strictEqual(hasPermission(financeUser, 'transactions.read'), true);
	assert.strictEqual(hasPermission(financeUser, 'payouts.read'), true);
	assert.strictEqual(hasPermission(financeUser, 'payouts.approve'), true);
	assert.strictEqual(hasPermission(financeUser, 'payouts.hold'), true);
	assert.strictEqual(hasPermission(financeUser, 'payouts.reject'), true);
	assert.strictEqual(hasPermission(financeUser, 'finance.read'), true);
	assert.strictEqual(hasPermission(financeUser, 'verification.read'), true);
	assert.strictEqual(hasPermission(financeUser, 'cases.read'), true);
	assert.strictEqual(hasPermission(financeUser, 'refunds.approve'), true);
	assert.strictEqual(hasPermission(financeUser, 'audit.read'), true);

	// Forbidden
	assert.strictEqual(hasPermission(financeUser, 'verification.document.view'), false);
	assert.strictEqual(hasPermission(financeUser, 'verification.decide'), false);
	assert.strictEqual(hasPermission(financeUser, 'products.moderate'), false);
	assert.strictEqual(hasPermission(financeUser, 'sellers.restrict'), false);
	assert.strictEqual(hasPermission(financeUser, 'cases.resolve'), false);
	assert.strictEqual(hasPermission(financeUser, 'storage.read'), false);
	assert.strictEqual(hasPermission(financeUser, 'storage.view_restricted'), false);
	assert.strictEqual(hasPermission(financeUser, 'storage.manage'), false);
	assert.strictEqual(hasPermission(financeUser, 'blog.write'), false);
	assert.strictEqual(hasPermission(financeUser, 'blog.publish'), false);
	assert.strictEqual(hasPermission(financeUser, 'settings.write'), false);

	// Routes
	assert.strictEqual(canAccessAdminRoute(financeUser, 'overview'), true);
	assert.strictEqual(canAccessAdminRoute(financeUser, 'transactions'), true);
	assert.strictEqual(canAccessAdminRoute(financeUser, 'payouts'), true);
	assert.strictEqual(canAccessAdminRoute(financeUser, 'finance'), true);
	assert.strictEqual(canAccessAdminRoute(financeUser, 'verifications'), true);
	assert.strictEqual(canAccessAdminRoute(financeUser, 'storage'), false);
	assert.strictEqual(canAccessAdminRoute(financeUser, 'blog'), false);
	assert.strictEqual(canAccessAdminRoute(financeUser, 'settings'), false);
	assert.strictEqual(getDefaultAdminSubroute(financeUser), 'overview');
});

test('RBAC: Content Editor vs Content Writer separation', () => {
	const editorUser: PlatformUser = {
		id: 'u_ed',
		name: 'Editor User',
		email: 'editor@karja.id',
		role: 'content_editor',
		status: 'active',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	const writerUser: PlatformUser = {
		id: 'u_wr',
		name: 'Writer User',
		email: 'writer@karja.id',
		role: 'content_writer',
		status: 'active',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	// Editor permissions
	assert.strictEqual(hasPermission(editorUser, 'blog.read'), true);
	assert.strictEqual(hasPermission(editorUser, 'blog.write'), true);
	assert.strictEqual(hasPermission(editorUser, 'blog.publish'), true);
	assert.strictEqual(hasPermission(editorUser, 'blog.manage_categories'), true);
	assert.strictEqual(hasPermission(editorUser, 'blog.manage_authors'), true);
	assert.strictEqual(hasPermission(editorUser, 'blog.media'), true);
	assert.strictEqual(hasPermission(editorUser, 'overview.read'), false);
	assert.strictEqual(canAccessAdminRoute(editorUser, 'blog'), true);
	assert.strictEqual(canAccessAdminRoute(editorUser, 'overview'), false);
	assert.strictEqual(canAccessAdminRoute(editorUser, 'finance'), false);
	assert.strictEqual(getDefaultAdminSubroute(editorUser), 'blog');

	// Writer permissions
	assert.strictEqual(hasPermission(writerUser, 'blog.read'), true);
	assert.strictEqual(hasPermission(writerUser, 'blog.write'), true);
	assert.strictEqual(hasPermission(writerUser, 'blog.media'), true);
	assert.strictEqual(hasPermission(writerUser, 'blog.publish'), false);
	assert.strictEqual(hasPermission(writerUser, 'blog.manage_categories'), false);
	assert.strictEqual(hasPermission(writerUser, 'blog.manage_authors'), false);
	assert.strictEqual(hasPermission(writerUser, 'overview.read'), false);
	assert.strictEqual(canAccessAdminRoute(writerUser, 'blog'), true);
	assert.strictEqual(canAccessAdminRoute(writerUser, 'overview'), false);
	assert.strictEqual(getDefaultAdminSubroute(writerUser), 'blog');
});

test('RBAC: Legacy admin role maps safely into ops permissions', () => {
	const legacyAdmin: PlatformUser = {
		id: 'u_legacy_admin',
		name: 'Legacy Admin',
		email: 'legacy@karja.id',
		role: 'admin',
		status: 'active',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	assert.strictEqual(hasPermission(legacyAdmin, 'products.moderate'), true);
	assert.strictEqual(hasPermission(legacyAdmin, 'verification.document.view'), false);
	assert.strictEqual(hasPermission(legacyAdmin, 'payouts.approve'), false);
	assert.strictEqual(hasPermission(legacyAdmin, 'finance.read'), false);
	assert.strictEqual(hasPermission(legacyAdmin, 'settings.write'), false);
	assert.strictEqual(canAccessAdminRoute(legacyAdmin, 'finance'), false);
	assert.strictEqual(canAccessAdminRoute(legacyAdmin, 'settings'), false);
});

test('RBAC: KTP Document & Restricted Storage Privacy (Only Trust & Safety & Super Admin can view)', () => {
	const superAdmin: PlatformUser = {
		id: 'u_sa',
		name: 'Super Admin',
		email: 'admin@karja.id',
		role: 'super_admin',
		status: 'active',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	const tsUser: PlatformUser = {
		id: 'u_ts',
		name: 'Trust Safety',
		email: 'trust@karja.id',
		role: 'trust_safety',
		status: 'active',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	const opsUser: PlatformUser = {
		id: 'u_ops',
		name: 'Ops',
		email: 'ops@karja.id',
		role: 'ops',
		status: 'active',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	const financeUser: PlatformUser = {
		id: 'u_fin',
		name: 'Finance',
		email: 'finance@karja.id',
		role: 'finance',
		status: 'active',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	// KTP Document view
	assert.strictEqual(hasPermission(superAdmin, 'verification.document.view'), true);
	assert.strictEqual(hasPermission(tsUser, 'verification.document.view'), true);
	assert.strictEqual(hasPermission(opsUser, 'verification.document.view'), false);
	assert.strictEqual(hasPermission(financeUser, 'verification.document.view'), false);

	// Restricted Storage view
	assert.strictEqual(hasPermission(superAdmin, 'storage.view_restricted'), true);
	assert.strictEqual(hasPermission(tsUser, 'storage.view_restricted'), true);
	assert.strictEqual(hasPermission(opsUser, 'storage.view_restricted'), false);
	assert.strictEqual(hasPermission(financeUser, 'storage.view_restricted'), false);
});

test('RBAC: Case Resolution vs Refund Approval Separation', () => {
	const tsUser: PlatformUser = {
		id: 'u_ts',
		name: 'Trust Safety',
		email: 'trust@karja.id',
		role: 'trust_safety',
		status: 'active',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	const financeUser: PlatformUser = {
		id: 'u_fin',
		name: 'Finance',
		email: 'finance@karja.id',
		role: 'finance',
		status: 'active',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	// T&S can resolve cases, but cannot approve refunds
	assert.strictEqual(hasPermission(tsUser, 'cases.resolve'), true);
	assert.strictEqual(hasPermission(tsUser, 'refunds.approve'), false);

	// Finance can approve refunds, but cannot resolve dispute cases
	assert.strictEqual(hasPermission(financeUser, 'cases.resolve'), false);
	assert.strictEqual(hasPermission(financeUser, 'refunds.approve'), true);
});

test('RBAC: Direct Route Access matrix across all subroutes', () => {
	const ops: PlatformUser = {
		id: 'u_ops',
		name: 'Ops',
		email: 'ops@karja.id',
		role: 'ops',
		status: 'active',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	const finance: PlatformUser = {
		id: 'u_fin',
		name: 'Fin',
		email: 'fin@karja.id',
		role: 'finance',
		status: 'active',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	const ts: PlatformUser = {
		id: 'u_ts',
		name: 'TS',
		email: 'ts@karja.id',
		role: 'trust_safety',
		status: 'active',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	const editor: PlatformUser = {
		id: 'u_ed',
		name: 'Ed',
		email: 'ed@karja.id',
		role: 'content_editor',
		status: 'active',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	// /admin/settings is only accessible by super_admin
	assert.strictEqual(canAccessAdminRoute(ops, 'settings'), false);
	assert.strictEqual(canAccessAdminRoute(finance, 'settings'), false);
	assert.strictEqual(canAccessAdminRoute(ts, 'settings'), false);
	assert.strictEqual(canAccessAdminRoute(editor, 'settings'), false);

	// /admin/finance is only accessible by finance & super_admin
	assert.strictEqual(canAccessAdminRoute(finance, 'finance'), true);
	assert.strictEqual(canAccessAdminRoute(ops, 'finance'), false);
	assert.strictEqual(canAccessAdminRoute(ts, 'finance'), false);
	assert.strictEqual(canAccessAdminRoute(editor, 'finance'), false);

	// /admin/storage is accessible by ops, ts & super_admin, but not finance or editor
	assert.strictEqual(canAccessAdminRoute(ops, 'storage'), true);
	assert.strictEqual(canAccessAdminRoute(ts, 'storage'), true);
	assert.strictEqual(canAccessAdminRoute(finance, 'storage'), false);
	assert.strictEqual(canAccessAdminRoute(editor, 'storage'), false);

	// /admin/blog is accessible by editor and super_admin, but not ops, ts, finance
	assert.strictEqual(canAccessAdminRoute(editor, 'blog'), true);
	assert.strictEqual(canAccessAdminRoute(ops, 'blog'), false);
	assert.strictEqual(canAccessAdminRoute(ts, 'blog'), false);
	assert.strictEqual(canAccessAdminRoute(finance, 'blog'), false);
});
