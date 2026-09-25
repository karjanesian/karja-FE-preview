import {
	initialAdminPlatformUsers,
	initialMockSellers,
	initialMockProducts,
	initialMockOrders,
	initialMockPayouts,
	initialMockReports,
	initialMockDisputes,
	initialMockLedger,
	initialMockAuditLogs,
	initialMockBlogPosts,
	initialMockFiles,
	initialPlatformSettings
} from '$lib/data/mockAdminData';
import { INITIAL_BLOG_CATEGORIES, INITIAL_BLOG_AUTHORS } from '$lib/data/mockBlogCmsData';
import { MOCK_JOURNEY_EVENTS } from '$lib/data/mockJourneyEvents';
import { clearAdminSession, getAdminSession, setAdminSession } from '$lib/domain/adminAuth';
import {
	canAccessAdminRoute,
	checkAdminAccess,
	getDefaultAdminSubroute,
	hasPermission
} from '$lib/domain/adminDomain';
import type { AdminSubRoute } from '$lib/domain/adminRoutes';
import { m } from '$lib/paraglide/messages.js';
import type { BlogAuthor, BlogCategoryRecord, BlogPost } from '$lib/types/blog';
import type { JourneyEvent } from '$lib/types/journeyEvents';
import type {
	AuditLog,
	ExtendedPayout,
	FileAsset,
	FileAssetStatus,
	LedgerEntry,
	AdminPermission,
	PlatformSettings,
	PlatformUser,
	ProductModerationStatus,
	PayoutWorkflowStatus,
	Report,
	Dispute
} from '$lib/types/admin';
import type { FulfillmentStatus, Order, Product, Review, SellerProfile } from '$lib/types';
import type { DerivedBuyerSummary } from '$lib/types/buyer';
import { api, isNetworkError } from '$lib/api';
import {
	listAdminPayouts,
	reviewPayout,
	type AdminPayoutReviewStatus
} from '$lib/domain/adminPayoutsApi';
import { getAdminOverview, type AdminOverview } from '$lib/domain/adminOverviewApi';
import {
	listAdminSellers,
	setAdminSellerStatus,
	type AdminSellerProfile,
	type AdminSellerStatus
} from '$lib/domain/adminSellersApi';
import { listAdminBuyers } from '$lib/domain/adminBuyersApi';
import { listAdminProducts, moderateAdminProduct } from '$lib/domain/adminProductsApi';
import {
	listAdminOrders,
	getAdminOrderCounts,
	setAdminOrderStatus
} from '$lib/domain/adminOrdersApi';
import type { OrderCounts } from '$lib/domain/ordersApi';
import { listAdminTransactions } from '$lib/domain/adminTransactionsApi';
import { getAdminFinance, type AdminFinanceSummary } from '$lib/domain/adminFinanceApi';
import {
	listAdminKyc,
	reviewAdminKyc,
	type AdminKycRecord,
	type AdminKycReviewStatus
} from '$lib/domain/adminKycApi';
import {
	listAdminCases,
	setAdminDisputeStatus,
	setAdminReportStatus,
	type AdminCasesPage
} from '$lib/domain/adminCasesApi';
import type { PageQuery, Paged } from '$lib/domain/pagination';
import { deriveBuyersFromOrders } from '$lib/domain/buyerDomain';
import { seller } from './seller.svelte';

const ADMIN_REVIEW_STATUSES: readonly AdminPayoutReviewStatus[] = [
	'approved',
	'processing',
	'paid',
	'held',
	'rejected'
];

function isAdminReviewStatus(status: PayoutWorkflowStatus): status is AdminPayoutReviewStatus {
	return (ADMIN_REVIEW_STATUSES as readonly PayoutWorkflowStatus[]).includes(status);
}

/** State satu halaman list admin. `server: false` → data lokal (fallback offline). */
export interface AdminPagedState<T> {
	items: T[];
	nextCursor: string | null;
	total: number;
	page: number;
	server: boolean;
}

/** Kasus punya dua daftar (laporan & sengketa) dengan paginasi terpisah. */
export interface AdminCasesPagedState {
	reports: Report[];
	disputes: Dispute[];
	reportsTotal: number;
	disputesTotal: number;
	reportsNextCursor: string | null;
	disputesNextCursor: string | null;
	reportsPage: number;
	disputesPage: number;
	server: boolean;
}

type AdminPageResource = 'sellers' | 'products' | 'orders' | 'transactions' | 'kyc' | 'payouts';

const ADMIN_PAGE_SIZE = 10;

class AdminStore {
	adminUser = $state<PlatformUser | null>(null);
	platformSellers = $state<SellerProfile[]>(initialMockSellers);
	platformPayouts = $state<ExtendedPayout[]>(initialMockPayouts);
	platformProducts = $state<Product[]>(initialMockProducts);
	platformOrders = $state<Order[]>(initialMockOrders);
	platformReports = $state<Report[]>(initialMockReports);
	platformDisputes = $state<Dispute[]>(initialMockDisputes);
	platformLedger = $state<LedgerEntry[]>(initialMockLedger);
	platformAuditLogs = $state<AuditLog[]>(initialMockAuditLogs);
	platformBlogPosts = $state<BlogPost[]>(initialMockBlogPosts);
	platformBlogCategories = $state<BlogCategoryRecord[]>(INITIAL_BLOG_CATEGORIES);
	platformBlogAuthors = $state<BlogAuthor[]>(INITIAL_BLOG_AUTHORS);
	platformJourneyEvents = $state<JourneyEvent[]>(MOCK_JOURNEY_EVENTS);
	platformFiles = $state<FileAsset[]>(initialMockFiles);
	platformSettings = $state<PlatformSettings>(initialPlatformSettings);
	platformOverview = $state<AdminOverview | null>(null);
	platformFinance = $state<AdminFinanceSummary | null>(null);
	platformKyc = $state<AdminKycRecord[]>([]);
	platformBuyers = $state<DerivedBuyerSummary[]>(
		deriveBuyersFromOrders(
			initialMockOrders,
			initialMockOrders.map((o) => o.buyerReview).filter((r): r is Review => Boolean(r)),
			initialMockDisputes
		)
	);

	// ---- Halaman list admin (server-side pagination + fallback lokal) ----
	sellersPage = $state<AdminPagedState<AdminSellerProfile> | null>(null);
	productsPage = $state<AdminPagedState<Product> | null>(null);
	ordersPage = $state<AdminPagedState<Order> | null>(null);
	/** Jumlah pesanan platform per tab/tipe dari BE; `null` → hitung lokal (offline). */
	orderCounts = $state<OrderCounts | null>(null);
	transactionsPage = $state<AdminPagedState<LedgerEntry> | null>(null);
	kycPage = $state<AdminPagedState<AdminKycRecord> | null>(null);
	payoutsPage = $state<AdminPagedState<ExtendedPayout> | null>(null);
	casesPage = $state<AdminCasesPagedState | null>(null);

	private pageCursors: Record<AdminPageResource, (string | null)[]> = {
		sellers: [null],
		products: [null],
		orders: [null],
		transactions: [null],
		kyc: [null],
		payouts: [null]
	};
	private pageSeq: Record<AdminPageResource, number> = {
		sellers: 0,
		products: 0,
		orders: 0,
		transactions: 0,
		kyc: 0,
		payouts: 0
	};
	private pageSignature: Record<AdminPageResource, string> = {
		sellers: '',
		products: '',
		orders: '',
		transactions: '',
		kyc: '',
		payouts: ''
	};

	// Kasus: dua rantai cursor terpisah (laporan & sengketa) berbagi signature filter.
	private casesCursors: { reports: (string | null)[]; disputes: (string | null)[] } = {
		reports: [null],
		disputes: [null]
	};
	private casesSeq = { reports: 0, disputes: 0 };
	private casesSignature = '';

	private syncInFlight = new Map<string, Promise<void>>();

	/**
	 * Guard sync bersama: satu request per resource; error jaringan ditelan
	 * (data mock/lokal dipertahankan), error lain cukup dicatat.
	 */
	private runSync(key: string, task: () => Promise<void>): Promise<void> {
		const existing = this.syncInFlight.get(key);
		if (existing) return existing;

		const run = (async () => {
			try {
				await task();
			} catch (e) {
				if (!isNetworkError(e)) console.error(`[karja] sync ${key} admin gagal:`, e);
			} finally {
				this.syncInFlight.delete(key);
			}
		})();

		this.syncInFlight.set(key, run);
		return run;
	}

	restoreSession() {
		this.adminUser = getAdminSession()?.user || null;
		// Merge seller state ke dataset platform (persis perilaku prototipe lama)
		this.platformSellers = this.platformSellers.some(
			(s) => s.username === seller.sellerProfile.username
		)
			? this.platformSellers
			: [...this.platformSellers, seller.sellerProfile];
		this.platformProducts = [
			...this.platformProducts,
			...seller.products.filter((p) => !this.platformProducts.some((mp) => mp.id === p.id))
		];
		this.platformOrders = [
			...this.platformOrders,
			...seller.orders.filter((o) => !this.platformOrders.some((mo) => mo.id === o.id))
		];
	}

	// ---- Access control ----

	isAllowed = $derived(!!this.adminUser && checkAdminAccess(this.adminUser).allowed);

	accessCheckFor(user: PlatformUser | null) {
		return checkAdminAccess(user as PlatformUser);
	}

	routeAllowed(subroute: AdminSubRoute) {
		return this.adminUser ? canAccessAdminRoute(this.adminUser, subroute) : false;
	}

	defaultSubrouteFor(user: PlatformUser): AdminSubRoute {
		return getDefaultAdminSubroute(user);
	}

	pendingCounts = $derived({
		verifications: this.platformSellers.filter((s) => s.verification?.status === 'pending').length,
		payouts: this.platformPayouts.filter((p) => p.status === 'requested').length,
		products: this.platformProducts.filter((p) => p.moderationStatus === 'pending_review').length,
		cases:
			this.platformDisputes.filter((d) => d.status !== 'resolved').length +
			this.platformReports.filter((r) => r.status !== 'resolved' && r.status !== 'dismissed')
				.length,
		storage: this.platformFiles.filter((f) => f.status === 'quarantined' || f.status === 'failed')
			.length
	});

	// ---- Session ----

	login(user: PlatformUser) {
		setAdminSession(user);
		this.adminUser = user;
	}

	async logout() {
		// Cabut cookie dulu (biar UI + spinner tetap tampil), baru bersihkan sesi lokal.
		if (typeof window !== 'undefined') {
			try {
				await api('/auth/admin/logout', { method: 'POST', body: {} });
			} catch {
				// offline / sesi sudah tidak valid → tetap lanjut logout lokal
			}
		}
		clearAdminSession();
		this.adminUser = null;
	}

	private requirePermission(perm: AdminPermission, actionDesc: string): boolean {
		if (!hasPermission(this.adminUser, perm)) {
			alert(m.admin_access_denied({ perm, action: actionDesc }));
			return false;
		}
		return true;
	}

	private audit(
		action: string,
		entityType: AuditLog['entityType'],
		entityId: string,
		reason: string,
		idPrefix = 'audit'
	) {
		const newLog: AuditLog = {
			id: `${idPrefix}_${Date.now()}`,
			actorUserId: this.adminUser?.id || 'admin_ops',
			actorRole: this.adminUser?.role || 'ops',
			action,
			entityType,
			entityId,
			reason,
			createdAt: new Date().toISOString()
		};
		this.platformAuditLogs = [newLog, ...this.platformAuditLogs];
	}

	// ---- Handlers (ported 1:1 from App.tsx) ----

	updateFileStatus(fileId: string, newStatus: FileAssetStatus, reason?: string) {
		if (!this.requirePermission('storage.manage', m.admin_perm_storage_manage())) return;
		this.platformFiles = this.platformFiles.map((f) =>
			f.id === fileId ? { ...f, status: newStatus } : f
		);
		this.audit(
			newStatus === 'quarantined'
				? 'FILE_QUARANTINED'
				: newStatus === 'deleted'
					? 'FILE_DELETED'
					: 'FILE_STATUS_UPDATED',
			'FileAsset',
			fileId,
			reason || m.admin_file_status_reason({ status: newStatus }),
			'audit_file'
		);
	}

	updateVerification(
		sellerId: string,
		newStatus: 'verified' | 'needs_update' | 'rejected',
		note?: string
	) {
		if (!this.requirePermission('verification.decide', m.admin_perm_verification_decide())) return;

		this.platformSellers = this.platformSellers.map((s) => {
			const idMatches =
				s.id === sellerId || `seller_${s.username}` === sellerId || s.username === sellerId;
			if (!idMatches) return s;
			return {
				...s,
				verification: {
					...s.verification,
					status: newStatus,
					rejectionReason: note || s.verification?.rejectionReason,
					verifiedAt:
						newStatus === 'verified' ? new Date().toISOString() : s.verification?.verifiedAt
				}
			};
		});

		const sp = seller.sellerProfile;
		if (sp.id === sellerId || `seller_${sp.username}` === sellerId || sp.username === sellerId) {
			seller.updateProfile({
				verification: {
					...sp.verification,
					status: newStatus,
					rejectionReason: note || sp.verification?.rejectionReason,
					verifiedAt:
						newStatus === 'verified' ? new Date().toISOString() : sp.verification?.verifiedAt
				}
			});
		}

		this.audit(
			`VERIFICATION_${newStatus.toUpperCase()}`,
			'SellerProfile',
			sellerId,
			note || `Admin decision: ${newStatus}`
		);
	}

	private applyLocalPayoutTransition(
		payoutId: string,
		nextStatus: PayoutWorkflowStatus,
		options?: { note?: string; providerRef?: string; holdReason?: string }
	) {
		this.platformPayouts = this.platformPayouts.map((p) => {
			if (p.id !== payoutId) return p;
			return {
				...p,
				status: nextStatus,
				providerReference: options?.providerRef || p.providerReference,
				holdReason: options?.holdReason || p.holdReason,
				processedAt:
					nextStatus === 'processing' || nextStatus === 'paid'
						? p.processedAt || new Date().toISOString()
						: p.processedAt,
				paidAt: nextStatus === 'paid' ? new Date().toISOString() : p.paidAt
			};
		});
	}

	private finalizePayoutTransition(
		payoutId: string,
		nextStatus: PayoutWorkflowStatus,
		options?: { note?: string; providerRef?: string; holdReason?: string }
	) {
		if (nextStatus === 'paid') {
			const payout = this.platformPayouts.find((p) => p.id === payoutId);
			if (payout) {
				const newLedger: LedgerEntry = {
					id: `led_${Date.now()}`,
					type: 'payout',
					amount: payout.amount,
					payoutId: payoutId,
					sellerId: payout.sellerId,
					description: m.admin_ledger_payout_desc({
						referenceId: payout.referenceId,
						bankName: payout.bankName
					}),
					createdAt: new Date().toISOString()
				};
				this.platformLedger = [newLedger, ...this.platformLedger];
			}
		}

		this.audit(
			`PAYOUT_${nextStatus.toUpperCase()}`,
			'Payout',
			payoutId,
			options?.note || `Payout transition to ${nextStatus}`
		);
	}

	async updatePayout(
		payoutId: string,
		nextStatus: PayoutWorkflowStatus,
		options?: { note?: string; providerRef?: string; holdReason?: string }
	): Promise<void> {
		let requiredPerm: AdminPermission = 'payouts.approve';
		if (nextStatus === 'held') requiredPerm = 'payouts.hold';
		else if (nextStatus === 'rejected') requiredPerm = 'payouts.reject';

		if (!this.requirePermission(requiredPerm, m.admin_perm_payout({ status: nextStatus }))) return;

		if (isAdminReviewStatus(nextStatus)) {
			try {
				const updated = await reviewPayout(payoutId, {
					status: nextStatus,
					reason: nextStatus === 'held' ? (options?.holdReason ?? options?.note) : options?.note,
					providerRef: options?.providerRef
				});
				this.platformPayouts = this.platformPayouts.map((p) => (p.id === payoutId ? updated : p));
				this.finalizePayoutTransition(payoutId, nextStatus, options);
				return;
			} catch (e) {
				if (!isNetworkError(e)) throw e;
			}
		}

		// Offline / BE tidak terjangkau → pertahankan perilaku lokal (mock).
		this.applyLocalPayoutTransition(payoutId, nextStatus, options);
		this.finalizePayoutTransition(payoutId, nextStatus, options);
	}

	/**
	 * Ambil payout dari BE dan ganti data lokal. Kalau BE tidak terjangkau
	 * (offline), pertahankan data mock lokal apa adanya dan jangan melempar error.
	 */
	syncAdminPayouts(params: PageQuery = {}): Promise<void> {
		return this.runSync('payouts', async () => {
			this.platformPayouts = (await listAdminPayouts({ limit: 100, ...params })).items;
		});
	}

	syncAdminOverview(): Promise<void> {
		return this.runSync('overview', async () => {
			this.platformOverview = await getAdminOverview();
		});
	}

	syncAdminSellers(params: PageQuery = {}): Promise<void> {
		return this.runSync('sellers', async () => {
			this.platformSellers = (await listAdminSellers({ limit: 100, ...params })).items;
		});
	}

	syncAdminBuyers(): Promise<void> {
		return this.runSync('buyers', async () => {
			this.platformBuyers = await listAdminBuyers();
		});
	}

	syncAdminProducts(params: PageQuery = {}): Promise<void> {
		return this.runSync('products', async () => {
			this.platformProducts = (await listAdminProducts({ limit: 100, ...params })).items;
		});
	}

	syncAdminOrders(params: PageQuery = {}): Promise<void> {
		return this.runSync('orders', async () => {
			this.platformOrders = (await listAdminOrders({ limit: 100, ...params })).items;
		});
	}

	syncAdminTransactions(params: PageQuery = {}): Promise<void> {
		return this.runSync('transactions', async () => {
			this.platformLedger = (await listAdminTransactions({ limit: 100, ...params })).items;
		});
	}

	syncAdminFinance(): Promise<void> {
		return this.runSync('finance', async () => {
			this.platformFinance = await getAdminFinance();
		});
	}

	syncAdminKyc(params: PageQuery = {}): Promise<void> {
		return this.runSync('kyc', async () => {
			this.platformKyc = (await listAdminKyc({ limit: 100, ...params })).items;
		});
	}

	syncAdminCases(params: PageQuery = {}): Promise<void> {
		return this.runSync('cases', async () => {
			const { reports, disputes } = await listAdminCases({ limit: 100, ...params });
			this.platformReports = reports;
			this.platformDisputes = disputes;
		});
	}

	// ---- Paginated list loading (server-side + fallback lokal) ----

	/**
	 * Inti pemuatan satu halaman ber-cursor untuk admin. Signature filter berubah
	 * → reset rantai cursor; sequence guard → respons lama tidak menimpa yang baru.
	 */
	private async fetchPagedPage<T>(
		resource: AdminPageResource,
		page: number,
		signature: string,
		fetcher: (cursor: string | null) => Promise<Paged<T>>
	): Promise<AdminPagedState<T> | 'stale' | null> {
		if (this.pageSignature[resource] !== signature) {
			this.pageSignature[resource] = signature;
			this.pageCursors[resource] = [null];
		}
		const seq = ++this.pageSeq[resource];
		const cursors = this.pageCursors[resource];
		const target = Math.max(1, page);
		const idx = target - 1;

		let last = cursors.length - 1;
		while (last < idx) {
			const cursor = cursors[last];
			if (cursor === null) return null;
			const step = await fetcher(cursor);
			if (seq !== this.pageSeq[resource]) return 'stale';
			last += 1;
			cursors[last] = step.nextCursor;
		}

		const res = await fetcher(cursors[idx] ?? null);
		if (seq !== this.pageSeq[resource]) return 'stale';
		cursors[target] = res.nextCursor;
		return {
			items: res.items,
			nextCursor: res.nextCursor,
			total: res.total,
			page: target,
			server: true
		};
	}

	/** State fallback offline: seluruh data lokal, biar DataTable paginate client-side. */
	private offlinePage<T>(items: T[]): AdminPagedState<T> {
		return { items, nextCursor: null, total: items.length, page: 1, server: false };
	}

	async loadSellersPage(
		params: PageQuery & { page?: number } = {},
		fallback: AdminSellerProfile[] = []
	): Promise<void> {
		const page = Math.max(1, params.page ?? 1);
		const signature = JSON.stringify([
			params.q ?? '',
			params.status ?? '',
			params.sortBy ?? '',
			params.sortDir ?? ''
		]);
		try {
			const result = await this.fetchPagedPage('sellers', page, signature, (cursor) =>
				listAdminSellers({
					limit: params.limit ?? ADMIN_PAGE_SIZE,
					cursor,
					q: params.q,
					status: params.status,
					sortBy: params.sortBy,
					sortDir: params.sortDir
				})
			);
			if (result === 'stale' || result === null) return;
			this.sellersPage = result;
		} catch (e) {
			if (isNetworkError(e)) {
				this.sellersPage = this.offlinePage(fallback);
				return;
			}
			console.error('[karja] muat halaman seller admin gagal:', e);
		}
	}

	async loadProductsPage(
		params: PageQuery & { page?: number } = {},
		fallback: Product[] = []
	): Promise<void> {
		const page = Math.max(1, params.page ?? 1);
		const signature = JSON.stringify([
			params.q ?? '',
			params.status ?? '',
			params.type ?? '',
			params.moderationStatus ?? '',
			params.sortBy ?? '',
			params.sortDir ?? ''
		]);
		try {
			const result = await this.fetchPagedPage('products', page, signature, (cursor) =>
				listAdminProducts({
					limit: params.limit ?? ADMIN_PAGE_SIZE,
					cursor,
					q: params.q,
					status: params.status,
					type: params.type,
					moderationStatus: params.moderationStatus,
					sortBy: params.sortBy,
					sortDir: params.sortDir
				})
			);
			if (result === 'stale' || result === null) return;
			this.productsPage = result;
		} catch (e) {
			if (isNetworkError(e)) {
				this.productsPage = this.offlinePage(fallback);
				return;
			}
			console.error('[karja] muat halaman produk admin gagal:', e);
		}
	}

	/**
	 * Ambil jumlah pesanan per tab/tipe dari BE (seluruh pesanan, bukan halaman).
	 * Offline (error jaringan): pertahankan nilai sebelumnya; view menghitung lokal.
	 */
	async loadOrderCounts(): Promise<void> {
		try {
			this.orderCounts = await getAdminOrderCounts();
		} catch (e) {
			if (!isNetworkError(e)) console.error('[karja] muat jumlah pesanan admin gagal:', e);
		}
	}

	async loadOrdersPage(
		params: PageQuery & { page?: number } = {},
		fallback: Order[] = []
	): Promise<void> {
		void this.loadOrderCounts();
		const page = Math.max(1, params.page ?? 1);
		const signature = JSON.stringify([
			params.q ?? '',
			params.state ?? '',
			params.type ?? '',
			params.paymentStatus ?? '',
			params.fulfillmentStatus ?? '',
			params.sortBy ?? '',
			params.sortDir ?? ''
		]);
		try {
			const result = await this.fetchPagedPage('orders', page, signature, (cursor) =>
				listAdminOrders({
					limit: params.limit ?? ADMIN_PAGE_SIZE,
					cursor,
					q: params.q,
					state: params.state,
					type: params.type,
					paymentStatus: params.paymentStatus,
					fulfillmentStatus: params.fulfillmentStatus,
					sortBy: params.sortBy,
					sortDir: params.sortDir
				})
			);
			if (result === 'stale' || result === null) return;
			this.ordersPage = result;
		} catch (e) {
			if (isNetworkError(e)) {
				this.ordersPage = this.offlinePage(fallback);
				return;
			}
			console.error('[karja] muat halaman pesanan admin gagal:', e);
		}
	}

	async loadTransactionsPage(
		params: PageQuery & { page?: number } = {},
		fallback: LedgerEntry[] = []
	): Promise<void> {
		const page = Math.max(1, params.page ?? 1);
		const signature = JSON.stringify([
			params.q ?? '',
			params.type ?? '',
			params.sortBy ?? '',
			params.sortDir ?? ''
		]);
		try {
			const result = await this.fetchPagedPage('transactions', page, signature, (cursor) =>
				listAdminTransactions({
					limit: params.limit ?? ADMIN_PAGE_SIZE,
					cursor,
					q: params.q,
					type: params.type,
					sortBy: params.sortBy,
					sortDir: params.sortDir
				})
			);
			if (result === 'stale' || result === null) return;
			this.transactionsPage = result;
		} catch (e) {
			if (isNetworkError(e)) {
				this.transactionsPage = this.offlinePage(fallback);
				return;
			}
			console.error('[karja] muat halaman transaksi admin gagal:', e);
		}
	}

	async loadKycPage(
		params: PageQuery & { page?: number } = {},
		fallback: AdminKycRecord[] = []
	): Promise<void> {
		const page = Math.max(1, params.page ?? 1);
		const signature = JSON.stringify([params.q ?? '', params.status ?? '']);
		try {
			const result = await this.fetchPagedPage('kyc', page, signature, (cursor) =>
				listAdminKyc({
					limit: params.limit ?? ADMIN_PAGE_SIZE,
					cursor,
					q: params.q,
					status: params.status,
					sortBy: params.sortBy,
					sortDir: params.sortDir
				})
			);
			if (result === 'stale' || result === null) return;
			this.kycPage = result;
		} catch (e) {
			if (isNetworkError(e)) {
				this.kycPage = this.offlinePage(fallback);
				return;
			}
			console.error('[karja] muat halaman verifikasi admin gagal:', e);
		}
	}

	async loadPayoutsPage(
		params: PageQuery & { page?: number } = {},
		fallback: ExtendedPayout[] = []
	): Promise<void> {
		const page = Math.max(1, params.page ?? 1);
		const signature = JSON.stringify([
			params.q ?? '',
			params.status ?? '',
			params.sortBy ?? '',
			params.sortDir ?? ''
		]);
		try {
			const result = await this.fetchPagedPage('payouts', page, signature, (cursor) =>
				listAdminPayouts({
					limit: params.limit ?? ADMIN_PAGE_SIZE,
					cursor,
					q: params.q,
					status: params.status,
					sortBy: params.sortBy,
					sortDir: params.sortDir
				})
			);
			if (result === 'stale' || result === null) return;
			this.payoutsPage = result;
		} catch (e) {
			if (isNetworkError(e)) {
				this.payoutsPage = this.offlinePage(fallback);
				return;
			}
			console.error('[karja] muat halaman pencairan admin gagal:', e);
		}
	}

	async loadCasesPage(
		params: PageQuery & { page?: number } = {},
		list: 'reports' | 'disputes' = 'disputes',
		fallbackReports: Report[] = [],
		fallbackDisputes: Dispute[] = []
	): Promise<void> {
		const page = Math.max(1, params.page ?? 1);
		const signature = JSON.stringify([params.status ?? '']);
		if (this.casesSignature !== signature) {
			this.casesSignature = signature;
			this.casesCursors = { reports: [null], disputes: [null] };
			this.casesSeq = { reports: 0, disputes: 0 };
		}
		const seq = ++this.casesSeq[list];
		const cursors = this.casesCursors[list];
		const idx = page - 1;
		const cursorOf = (res: AdminCasesPage) =>
			list === 'reports' ? res.reportsNextCursor : res.disputesNextCursor;
		try {
			let last = cursors.length - 1;
			while (last < idx) {
				const cursor = cursors[last];
				if (cursor === null) return;
				const step = await listAdminCases({
					limit: params.limit ?? ADMIN_PAGE_SIZE,
					cursor,
					status: params.status
				});
				if (seq !== this.casesSeq[list]) return;
				last += 1;
				cursors[last] = cursorOf(step);
			}
			const res = await listAdminCases({
				limit: params.limit ?? ADMIN_PAGE_SIZE,
				cursor: cursors[idx] ?? null,
				status: params.status
			});
			if (seq !== this.casesSeq[list]) return;
			cursors[page] = cursorOf(res);

			const base: AdminCasesPagedState = this.casesPage ?? {
				reports: [],
				disputes: [],
				reportsTotal: 0,
				disputesTotal: 0,
				reportsNextCursor: null,
				disputesNextCursor: null,
				reportsPage: 1,
				disputesPage: 1,
				server: true
			};
			// `total` tidak terpengaruh cursor, jadi selalu aman diperbarui.
			const next: AdminCasesPagedState = {
				...base,
				reportsTotal: res.reportsTotal,
				disputesTotal: res.disputesTotal,
				server: true
			};
			if (list === 'reports') {
				next.reports = res.reports;
				next.reportsNextCursor = res.reportsNextCursor;
				next.reportsPage = page;
				// Hanya halaman 1 (cursor null) yang mengembalikan daftar lain secara benar.
				if (page === 1) {
					next.disputes = res.disputes;
					next.disputesNextCursor = res.disputesNextCursor;
					next.disputesPage = 1;
				}
			} else {
				next.disputes = res.disputes;
				next.disputesNextCursor = res.disputesNextCursor;
				next.disputesPage = page;
				if (page === 1) {
					next.reports = res.reports;
					next.reportsNextCursor = res.reportsNextCursor;
					next.reportsPage = 1;
				}
			}
			this.casesPage = next;
		} catch (e) {
			if (isNetworkError(e)) {
				this.casesPage = {
					reports: fallbackReports,
					disputes: fallbackDisputes,
					reportsTotal: fallbackReports.length,
					disputesTotal: fallbackDisputes.length,
					reportsNextCursor: null,
					disputesNextCursor: null,
					reportsPage: 1,
					disputesPage: 1,
					server: false
				};
				return;
			}
			console.error('[karja] muat halaman kasus admin gagal:', e);
		}
	}

	/** Ubah status akun seller; fallback lokal saat offline. */
	async setSellerStatus(sellerId: string, nextStatus: AdminSellerStatus): Promise<void> {
		if (!this.requirePermission('sellers.restrict', m.admin_perm_seller_restrict())) return;

		try {
			const updated = await setAdminSellerStatus(sellerId, nextStatus);
			this.applyLocalSellerStatus(sellerId, updated.status);
			return;
		} catch (e) {
			if (!isNetworkError(e)) throw e;
		}

		this.applyLocalSellerStatus(sellerId, nextStatus);
	}

	private applyLocalSellerStatus(sellerId: string, nextStatus: AdminSellerStatus) {
		this.platformSellers = this.platformSellers.map((s) => {
			if (s.id !== sellerId) return s;
			return {
				...s,
				accountStatus: nextStatus,
				verification: {
					...(s.verification ?? { status: 'unverified' as const }),
					isAccountSuspended: nextStatus !== 'active'
				}
			};
		});
		this.audit(
			`SELLER_STATUS_${nextStatus.toUpperCase()}`,
			'SellerProfile',
			sellerId,
			m.admin_audit_seller_status({ status: nextStatus })
		);
	}

	/** Intervensi status pemenuhan pesanan; fallback lokal saat offline. */
	async setOrderStatus(orderId: string, nextStatus: FulfillmentStatus): Promise<void> {
		if (!this.requirePermission('orders.intervene', m.admin_perm_order_intervene())) return;

		try {
			await setAdminOrderStatus(orderId, nextStatus);
			this.applyLocalOrderStatus(orderId, nextStatus);
			return;
		} catch (e) {
			if (!isNetworkError(e)) throw e;
		}

		this.applyLocalOrderStatus(orderId, nextStatus);
	}

	private applyLocalOrderStatus(orderId: string, nextStatus: FulfillmentStatus) {
		this.platformOrders = this.platformOrders.map((o) =>
			o.id === orderId ? { ...o, fulfillmentStatus: nextStatus } : o
		);
		this.audit(
			`ORDER_STATUS_${nextStatus.toUpperCase()}`,
			'Order',
			orderId,
			m.admin_audit_order_status({ status: nextStatus })
		);
	}

	private applyLocalProductModeration(
		productId: string,
		nextStatus: ProductModerationStatus,
		reason?: string
	) {
		this.platformProducts = this.platformProducts.map((p) =>
			p.id === productId
				? { ...p, moderationStatus: nextStatus, moderationReason: reason || p.moderationReason }
				: p
		);
		const target = seller.findProduct(productId);
		if (target) {
			seller.updateProduct({
				...target,
				moderationStatus: nextStatus,
				moderationReason: reason || target.moderationReason
			});
		}

		this.audit(
			`PRODUCT_MODERATION_${nextStatus.toUpperCase()}`,
			'Product',
			productId,
			reason || `Status set to ${nextStatus}`
		);
	}

	/** Moderasi produk; fallback lokal saat offline. Melempar `ApiError` non-jaringan. */
	async updateProductModeration(
		productId: string,
		nextStatus: ProductModerationStatus,
		reason?: string
	): Promise<void> {
		if (!this.requirePermission('products.moderate', m.admin_perm_products_moderate())) return;

		try {
			await moderateAdminProduct(productId, nextStatus, reason);
			this.applyLocalProductModeration(productId, nextStatus, reason);
			return;
		} catch (e) {
			if (!isNetworkError(e)) throw e;
		}

		this.applyLocalProductModeration(productId, nextStatus, reason);
	}

	/** Tinjau pengajuan KYC; fallback lokal saat offline. */
	async reviewKyc(kycId: string, nextStatus: AdminKycReviewStatus, reason?: string): Promise<void> {
		if (!this.requirePermission('verification.decide', m.admin_perm_verification_decide())) return;

		try {
			const updated = await reviewAdminKyc(kycId, nextStatus, reason);
			this.platformKyc = this.platformKyc.map((k) =>
				k.id === kycId
					? {
							...k,
							status: updated.status,
							rejectionReason: updated.rejectionReason,
							verifiedAt: updated.verifiedAt,
							submittedAt: updated.submittedAt ?? k.submittedAt
						}
					: k
			);
			return;
		} catch (e) {
			if (!isNetworkError(e)) throw e;
		}

		this.applyLocalKyc(kycId, nextStatus, reason);
	}

	private applyLocalKyc(kycId: string, nextStatus: AdminKycReviewStatus, reason?: string) {
		this.platformKyc = this.platformKyc.map((k) =>
			k.id === kycId
				? {
						...k,
						status: nextStatus,
						rejectionReason: nextStatus === 'verified' ? undefined : reason || k.rejectionReason,
						verifiedAt: nextStatus === 'verified' ? new Date().toISOString() : k.verifiedAt
					}
				: k
		);
		this.audit(
			`KYC_${nextStatus.toUpperCase()}`,
			'SellerProfile',
			kycId,
			reason || m.admin_audit_kyc_decision({ status: nextStatus })
		);
	}

	private applyLocalReportResolution(reportId: string, resolution: string) {
		this.platformReports = this.platformReports.map((r) =>
			r.id === reportId ? { ...r, status: 'resolved' as const, resolution } : r
		);
		this.audit('REPORT_RESOLVED', 'Report', reportId, resolution);
	}

	/** Resolusi laporan kasus; fallback lokal saat offline. */
	async resolveReport(reportId: string, resolution: string): Promise<void> {
		if (!this.requirePermission('cases.resolve', m.admin_perm_report_resolve())) return;

		try {
			await setAdminReportStatus(reportId, 'resolved', resolution);
			this.applyLocalReportResolution(reportId, resolution);
			return;
		} catch (e) {
			if (!isNetworkError(e)) throw e;
		}

		this.applyLocalReportResolution(reportId, resolution);
	}

	private applyLocalDisputeResolution(
		disputeId: string,
		outcome: 'refund_approved' | 'refund_partial' | 'refund_rejected' | 'resolved',
		adminNote: string
	) {
		this.platformDisputes = this.platformDisputes.map((d) =>
			d.id === disputeId
				? {
						...d,
						status: outcome,
						resolution: outcome,
						adminNote,
						resolvedAt: new Date().toISOString()
					}
				: d
		);
		this.audit(`DISPUTE_RESOLVED_${outcome.toUpperCase()}`, 'Dispute', disputeId, adminNote);
	}

	/** Resolusi sengketa; fallback lokal saat offline. */
	async resolveDispute(
		disputeId: string,
		outcome: 'refund_approved' | 'refund_partial' | 'refund_rejected' | 'resolved',
		adminNote: string
	): Promise<void> {
		if (outcome === 'refund_approved' || outcome === 'refund_partial') {
			if (!this.requirePermission('refunds.approve', m.admin_perm_refund_approve())) return;
		} else {
			if (!this.requirePermission('cases.resolve', m.admin_perm_dispute_handle())) return;
		}

		try {
			await setAdminDisputeStatus(disputeId, outcome, adminNote);
			this.applyLocalDisputeResolution(disputeId, outcome, adminNote);
			return;
		} catch (e) {
			if (!isNetworkError(e)) throw e;
		}

		this.applyLocalDisputeResolution(disputeId, outcome, adminNote);
	}

	savePost(post: BlogPost) {
		if (!this.requirePermission('blog.write', m.admin_perm_blog_write())) return;
		this.platformBlogPosts = this.platformBlogPosts.some((p) => p.id === post.id)
			? this.platformBlogPosts.map((p) => (p.id === post.id ? post : p))
			: [post, ...this.platformBlogPosts];
		this.audit(
			'BLOG_POST_SAVED',
			'BlogPost',
			post.id,
			m.admin_audit_post_saved({ title: post.title, status: post.status }),
			'audit_blog'
		);
	}

	deletePost(postId: string) {
		if (!this.requirePermission('blog.write', m.admin_perm_blog_delete())) return;
		this.platformBlogPosts = this.platformBlogPosts.filter((p) => p.id !== postId);
		this.audit(
			'BLOG_POST_DELETED',
			'BlogPost',
			postId,
			m.admin_audit_post_deleted({ id: postId }),
			'audit_blog'
		);
	}

	saveCategory(cat: BlogCategoryRecord) {
		if (!this.requirePermission('blog.manage_categories', m.admin_perm_category_save())) return;
		this.platformBlogCategories = this.platformBlogCategories.some((c) => c.id === cat.id)
			? this.platformBlogCategories.map((c) => (c.id === cat.id ? cat : c))
			: [...this.platformBlogCategories, cat];
	}

	deleteCategory(catId: string) {
		if (!this.requirePermission('blog.manage_categories', m.admin_perm_category_delete())) return;
		this.platformBlogCategories = this.platformBlogCategories.filter((c) => c.id !== catId);
	}

	saveAuthor(author: BlogAuthor) {
		if (!this.requirePermission('blog.manage_authors', m.admin_perm_author_save())) return;
		this.platformBlogAuthors = this.platformBlogAuthors.some((a) => a.id === author.id)
			? this.platformBlogAuthors.map((a) => (a.id === author.id ? author : a))
			: [...this.platformBlogAuthors, author];
	}

	deleteAuthor(authorId: string) {
		if (!this.requirePermission('blog.manage_authors', m.admin_perm_author_delete())) return;
		this.platformBlogAuthors = this.platformBlogAuthors.filter((a) => a.id !== authorId);
	}

	uploadBlogMedia(file: File): Promise<FileAsset | null> {
		if (!this.requirePermission('blog.write', m.admin_perm_media_upload()))
			return Promise.resolve(null);
		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.onload = () => {
				const newAsset: FileAsset = {
					id: `asset_blog_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
					ownerType: 'platform',
					category: 'blog_asset',
					accessLevel: 'public',
					originalName: file.name,
					mimeType: file.type || 'image/jpeg',
					sizeBytes: file.size,
					storageProvider: 'mock',
					objectKey: `blog/${file.name}`,
					publicUrl: reader.result as string,
					linkedEntityType: 'blog_post',
					linkedEntityId: '',
					status: 'available',
					createdAt: new Date().toISOString(),
					metadata: { dimensions: { width: 1200, height: 800 } }
				};
				this.platformFiles = [newAsset, ...this.platformFiles];
				resolve(newAsset);
			};
			reader.onerror = () => resolve(null);
			reader.readAsDataURL(file);
		});
	}

	saveSettings(newSettings: PlatformSettings) {
		if (!this.requirePermission('settings.write', m.admin_perm_settings())) return;
		this.platformSettings = newSettings;
		this.audit(
			'SETTINGS_UPDATED',
			'PlatformSettings',
			'global',
			'Platform financial and operational parameters updated'
		);
	}
}

export const admin = new AdminStore();
export { initialAdminPlatformUsers };
