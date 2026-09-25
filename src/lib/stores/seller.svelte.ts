import {
	freshProducts,
	freshOrders,
	freshBookings,
	freshTransactions,
	freshPayouts,
	freshNotifications,
	freshJourneySignals,
	freshReviews,
	freshSellerProfile,
	sampleProducts,
	sampleOrders,
	sampleBookings,
	sampleTransactions,
	samplePayouts,
	sampleNotifications,
	sampleJourneySignals,
	sampleReviews,
	sampleSellerProfile,
	deriveLifecycleState,
	formatRupiah
} from '$lib/data/mockData';
import { m } from '$lib/paraglide/messages.js';
import type {
	AppNotification,
	Booking,
	FulfillmentStatus,
	LifecycleState,
	MainNavTab,
	Order,
	Payout,
	Product,
	ProductType,
	Review,
	SellerJourneySignals,
	SellerProfile,
	ServiceDelivery,
	Transaction
} from '$lib/types';
import { normalizeProductType } from '$lib/types';
import {
	findBookingForOrder,
	isOrderCompleted,
	isOrderPendingEscrow,
	needsSellerAction
} from '$lib/domain/orderLifecycle';
import { getEffectivePrice } from '$lib/domain/pricing';
import { MINIMUM_WITHDRAWAL_AMOUNT, isPayoutReady } from '$lib/domain/payout';
import { evaluateKarjaVerification } from '$lib/domain/verification';
import { clearKarjaPersistedState, loadKarjaState, saveKarjaState } from '$lib/domain/storage';
import { listProducts, type ListProductsParams } from '$lib/domain/productsApi';
import {
	listSellerReviews,
	replyToReview,
	type ListSellerReviewsParams
} from '$lib/domain/reviewsApi';
import {
	getSellerOrderCounts,
	listSellerOrders,
	toApiFulfillmentStatus,
	updateOrderFulfillment,
	type ApiOrderFulfillmentDto,
	type ListSellerOrdersParams,
	type OrderCounts
} from '$lib/domain/ordersApi';
import {
	listSellerNotifications,
	markAllNotificationsRead as markAllNotificationsReadApi,
	markNotificationRead as markNotificationReadApi,
	type ListSellerNotificationsParams
} from '$lib/domain/notificationsApi';
import { getKycStatus, type KycStatus } from '$lib/domain/kycApi';
import { getBankAccount } from '$lib/domain/bankAccountApi';
import {
	getPayoutBalance,
	listSellerPayouts,
	requestPayout as requestPayoutApi,
	type ListSellerPayoutsParams,
	type PayoutBalance
} from '$lib/domain/payoutsApi';
import type { Paged } from '$lib/domain/pagination';
import { isNetworkError } from '$lib/api';

type SyncResource = 'products' | 'reviews' | 'orders' | 'notifications' | 'payoutSetup' | 'payouts';

type PageResource = 'products' | 'orders' | 'payouts' | 'reviews' | 'notifications';

/** State satu halaman list. `server: false` → data lokal, DataTable paginate client-side. */
export interface PagedState<T> {
	items: T[];
	nextCursor: string | null;
	total: number;
	page: number;
	server: boolean;
}

const PAGE_SIZE = 10;

/** ISO timestamp KYC → tanggal tampilan (mis. "22 Sep 2026"). */
function formatKycDate(iso?: string): string | undefined {
	if (!iso) return undefined;
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return undefined;
	return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Gabungkan field terdefinisi dari respons API ke order lokal (field lokal-only dipertahankan). */
function mergeOrderDefined(base: Order, patch: Partial<Order>): Order {
	const merged: Order = { ...base };
	(Object.keys(patch) as (keyof Order)[]).forEach((key) => {
		const value = patch[key];
		if (value !== undefined) (merged as unknown as Record<string, unknown>)[key] = value;
	});
	return merged;
}

export interface ReschedulePayload {
	dateString: string;
	timeSlot: string;
	dateFormatted: string;
	timeFormatted: string;
	startAt: string;
	endAt: string;
	reason?: string;
	rescheduledBy: 'seller' | 'buyer';
}

export interface PurchaseExtraData {
	email?: string;
	phone?: string;
	preferredTime?: string;
	bookingData?: {
		dateFormatted: string;
		timeFormatted: string;
		timeSlot: string;
		durationMinutes: number;
		startAt: string;
		endAt: string;
		meetingMethod?: string;
		meetingUrl: string;
		preparationAnswers?: Array<{ question: string; answer: string }>;
	};
}

class SellerStore {
	isLoaded = $state(false);
	isAuthenticated = $state(false);

	sellerProfile = $state<SellerProfile>(structuredClone(freshSellerProfile));
	products = $state<Product[]>(structuredClone(freshProducts));
	orders = $state<Order[]>(structuredClone(freshOrders));
	bookings = $state<Booking[]>(structuredClone(freshBookings));
	transactions = $state<Transaction[]>(structuredClone(freshTransactions));
	payouts = $state<Payout[]>(structuredClone(freshPayouts));
	payoutBalance = $state<PayoutBalance | null>(null);
	notifications = $state<AppNotification[]>(structuredClone(freshNotifications));
	reviews = $state<Review[]>(structuredClone(freshReviews));
	journeySignals = $state<SellerJourneySignals>(structuredClone(freshJourneySignals));
	hasSeenWelcome = $state(false);
	manualLifecycleOverride = $state<LifecycleState | null>(null);

	// ---- Halaman list (server-side pagination) ----
	// Diisi oleh load*Page; `null` sebelum pernah dimuat. `server:false` = fallback lokal.
	productsPage = $state<PagedState<Product> | null>(null);
	ordersPage = $state<PagedState<Order> | null>(null);
	/** Jumlah pesanan seller per tab dari BE; `null` → hitung lokal (offline). */
	orderCounts = $state<OrderCounts | null>(null);
	payoutsPage = $state<PagedState<Payout> | null>(null);
	reviewsPage = $state<PagedState<Review> | null>(null);
	notificationsPage = $state<PagedState<AppNotification> | null>(null);

	// Cursor keyset per halaman: index i = cursor untuk halaman i+1 (index 0 = null).
	private pageCursors: Record<PageResource, (string | null)[]> = {
		products: [null],
		orders: [null],
		payouts: [null],
		reviews: [null],
		notifications: [null]
	};
	// Nomor urut per resource: respons halaman lama tidak boleh menimpa yang lebih baru.
	private pageSeq: Record<PageResource, number> = {
		products: 0,
		orders: 0,
		payouts: 0,
		reviews: 0,
		notifications: 0
	};
	// Signature filter; berubah → reset rantai cursor.
	private pageSignature: Record<PageResource, string> = {
		products: '',
		orders: '',
		payouts: '',
		reviews: '',
		notifications: ''
	};

	// ---- Sync guards (race-condition hardening) ----
	// Setiap resource punya nomor urut sync; hanya respons terbaru yang boleh menimpa state.
	private syncSeq: Record<SyncResource, number> = {
		products: 0,
		reviews: 0,
		orders: 0,
		notifications: 0,
		payoutSetup: 0,
		payouts: 0
	};
	// Coalesce: selama sync resource masih berjalan, permintaan berikutnya memakai promise yang sama.
	private syncInFlight: Partial<Record<SyncResource, Promise<void>>> = {};
	// Waktu mutasi lokal terakhir; sync yang mulai sebelum ini dibuang saat respons tiba.
	private lastMutationAt = 0;

	// ---- Derived (financial & lifecycle) ----

	completedOrdersNet = $derived(
		this.orders
			.filter((o) => o.paymentStatus === 'lunas' && isOrderCompleted(o))
			.reduce((sum, o) => sum + o.netAmount, 0)
	);

	totalPaidOut = $derived(
		this.payouts
			.filter((p) => p.status === 'paid' || p.status === 'processing')
			.reduce((sum, p) => sum + p.amount, 0)
	);

	availableBalance = $derived(Math.max(0, this.completedOrdersNet - this.totalPaidOut));

	pendingBalance = $derived(
		this.orders
			.filter((o) => o.paymentStatus === 'lunas' && isOrderPendingEscrow(o))
			.reduce((sum, o) => sum + o.netAmount, 0)
	);

	totalRevenue = $derived(
		this.orders
			.filter((o) => o.paymentStatus === 'lunas' && o.fulfillmentStatus !== 'dibatalkan')
			.reduce((sum, o) => sum + o.amount, 0)
	);

	lifecycleState = $derived<LifecycleState>(
		this.manualLifecycleOverride ||
			deriveLifecycleState(
				this.products,
				this.orders,
				this.availableBalance,
				this.journeySignals,
				this.bookings
			)
	);

	actionRequiredOrdersCount = $derived(
		this.orders.filter((o) => o && needsSellerAction(o, findBookingForOrder(o, this.bookings)))
			.length
	);

	unreadCount = $derived(this.notifications.filter((n) => !n.isRead && n.unread).length);

	findOrder(id: string | null | undefined): Order | null {
		return id ? this.orders.find((o) => o.id === id) || null : null;
	}

	findProduct(id: string | null | undefined): Product | null {
		return id ? this.products.find((p) => p.id === id) || null : null;
	}

	// ---- Persistence ----

	load() {
		try {
			const parsed = loadKarjaState();
			if (parsed) {
				if (parsed.sellerProfile) this.sellerProfile = parsed.sellerProfile;
				if (Array.isArray(parsed.products)) this.products = parsed.products;
				if (Array.isArray(parsed.orders)) this.orders = parsed.orders;
				if (Array.isArray(parsed.bookings)) this.bookings = parsed.bookings;
				if (Array.isArray(parsed.transactions)) this.transactions = parsed.transactions;
				if (Array.isArray(parsed.payouts)) this.payouts = parsed.payouts;
				if (Array.isArray(parsed.notifications)) this.notifications = parsed.notifications;
				if (Array.isArray(parsed.reviews)) this.reviews = parsed.reviews;
				if (parsed.journeySignals) this.journeySignals = parsed.journeySignals;
				if (typeof parsed.hasSeenWelcome === 'boolean') this.hasSeenWelcome = parsed.hasSeenWelcome;
				if (typeof parsed.isAuthenticated === 'boolean')
					this.isAuthenticated = parsed.isAuthenticated;
			}
		} catch (e) {
			console.error('Failed to load Karja state:', e);
		} finally {
			this.isLoaded = true;
		}
	}

	save() {
		if (!this.isLoaded) return;
		try {
			saveKarjaState({
				sellerProfile: this.sellerProfile,
				products: this.products,
				orders: this.orders,
				bookings: this.bookings,
				transactions: this.transactions,
				payouts: this.payouts,
				notifications: this.notifications,
				reviews: this.reviews,
				journeySignals: this.journeySignals,
				hasSeenWelcome: this.hasSeenWelcome,
				isAuthenticated: this.isAuthenticated
			});
		} catch (e) {
			console.error('Failed to save Karja state:', e);
		}
	}

	// ---- Notifications ----

	addNotification(item: {
		title: string;
		description: string;
		type: 'sale' | 'action' | 'money' | 'system' | 'view';
		targetTab?: MainNavTab;
		targetId?: string;
	}) {
		const newNotif: AppNotification = {
			id: `notif_${Date.now()}_${Math.random().toString().slice(2, 6)}`,
			title: item.title,
			description: item.description,
			type: item.type,
			targetTab: item.targetTab,
			targetId: item.targetId,
			unread: true,
			isRead: false,
			time: m.common_time_new(),
			timestamp: m.common_time_new()
		};
		this.notifications = [newNotif, ...this.notifications];
	}

	/**
	 * Tandai satu notifikasi dibaca. Saat online, kirim ke BE setelah update lokal
	 * (optimistic); kalau BE tidak terjangkau (offline), cukup lokal saja.
	 */
	async markNotificationRead(id: string): Promise<void> {
		this.markMutation();
		this.notifications = this.notifications.map((n) =>
			n.id === id ? { ...n, isRead: true, unread: false } : n
		);
		try {
			await markNotificationReadApi(id);
		} catch (e) {
			if (!isNetworkError(e)) console.error('[karja] tandai notifikasi dibaca gagal:', e);
		}
	}

	/**
	 * Tandai semua notifikasi dibaca. Saat online, kirim ke BE setelah update lokal
	 * (optimistic); kalau BE tidak terjangkau (offline), cukup lokal saja.
	 */
	async markAllNotificationsRead(): Promise<void> {
		this.markMutation();
		this.notifications = this.notifications.map((n) => ({ ...n, isRead: true, unread: false }));
		try {
			await markAllNotificationsReadApi();
		} catch (e) {
			if (!isNetworkError(e)) console.error('[karja] tandai semua notifikasi dibaca gagal:', e);
		}
	}

	// ---- Products ----

	/** Tandai adanya mutasi lokal; sync yang dimulai sebelum ini tidak boleh menimpa. */
	markMutation() {
		this.lastMutationAt = Date.now();
	}

	/** Timpa order lokal dengan field terdefinisi dari respons API. */
	private applyOrderPatch(orderId: string, remote: Order) {
		this.orders = this.orders.map((o) => (o.id === orderId ? mergeOrderDefined(o, remote) : o));
	}

	/**
	 * Jalankan satu sync resource dengan guard race-condition:
	 * - coalesce: kalau masih in-flight, kembalikan promise yang sama (tidak menembak dua kali);
	 * - sequencing: hanya respons dengan seq terbaru yang boleh menimpa state;
	 * - lastMutationAt: respons dibuang kalau ada mutasi lokal saat sync berjalan;
	 * - offline: error jaringan diabaikan (pertahankan data lokal).
	 */
	private runSync<T>(
		resource: SyncResource,
		fetcher: () => Promise<T>,
		apply: (data: T) => void,
		errorLabel: string
	): Promise<void> {
		const inFlight = this.syncInFlight[resource];
		if (inFlight) return inFlight;

		const seq = ++this.syncSeq[resource];
		const startedAt = Date.now();

		const run = (async () => {
			try {
				const remote = await fetcher();
				if (seq !== this.syncSeq[resource]) return;
				if (startedAt < this.lastMutationAt) return;
				apply(remote);
			} catch (e) {
				if (!isNetworkError(e)) console.error(errorLabel, e);
			} finally {
				this.syncInFlight[resource] = undefined;
			}
		})();

		this.syncInFlight[resource] = run;
		return run;
	}

	/**
	 * Ambil produk dari BE dan ganti data lokal. Kalau BE tidak terjangkau
	 * (offline), pertahankan data lokal apa adanya dan jangan melempar error.
	 */
	async syncProducts(): Promise<void> {
		return this.runSync(
			'products',
			() => listProducts(),
			(remote) => {
				this.products = remote.items;
			},
			'[karja] sync produk gagal:'
		);
	}

	/**
	 * Ambil ulasan dari BE dan ganti data lokal. Kalau BE tidak terjangkau
	 * (offline), pertahankan data lokal apa adanya dan jangan melempar error.
	 */
	async syncReviews(): Promise<void> {
		return this.runSync(
			'reviews',
			() => listSellerReviews(),
			(remote) => {
				this.reviews = remote.items;
			},
			'[karja] sync ulasan gagal:'
		);
	}

	/**
	 * Ambil pesanan dari BE dan ganti data lokal. Kalau BE tidak terjangkau
	 * (offline), pertahankan data lokal apa adanya dan jangan melempar error.
	 */
	async syncOrders(): Promise<void> {
		return this.runSync(
			'orders',
			() => listSellerOrders(),
			(remote) => {
				this.orders = remote.items;
			},
			'[karja] sync pesanan gagal:'
		);
	}

	/**
	 * Ambil notifikasi dari BE dan ganti data lokal. Kalau BE tidak terjangkau
	 * (offline), pertahankan data lokal apa adanya dan jangan melempar error.
	 */
	async syncNotifications(): Promise<void> {
		return this.runSync(
			'notifications',
			() => listSellerNotifications(),
			(remote) => {
				this.notifications = remote.items;
			},
			'[karja] sync notifikasi gagal:'
		);
	}

	/**
	 * Ambil status KYC + rekening bank dari BE, lalu cerminkan ke profil supaya
	 * `isPayoutReady` akurat. Kalau BE tidak terjangkau (offline), pertahankan data lokal.
	 */
	async syncPayoutSetup(): Promise<void> {
		return this.runSync(
			'payoutSetup',
			() => Promise.all([getKycStatus(), getBankAccount()]),
			([kyc, bank]) => {
				this.applyKycStatus(kyc);
				if (bank) {
					this.sellerProfile = {
						...this.sellerProfile,
						bankInfo: {
							bank: bank.bank,
							accountNumber: bank.accountNumber,
							accountHolder: bank.accountHolder
						}
					};
				}
			},
			'[karja] sync verifikasi & rekening gagal:'
		);
	}

	/**
	 * Ambil saldo + riwayat pencairan dari BE. Kalau BE tidak terjangkau (offline),
	 * pertahankan data lokal apa adanya.
	 */
	async syncPayouts(): Promise<void> {
		return this.runSync(
			'payouts',
			() => Promise.all([getPayoutBalance(), listSellerPayouts()]),
			([balance, list]) => {
				this.payoutBalance = balance;
				this.payouts = list.items;
			},
			'[karja] sync pencairan gagal:'
		);
	}

	// ---- Paginated list loading (server-side + fallback lokal) ----

	/**
	 * Inti pemuatan satu halaman ber-cursor:
	 * - signature filter berubah → reset rantai cursor;
	 * - navigasi ke halaman yang belum punya cursor → telusuri berurutan;
	 * - sequence guard → respons lama tidak menimpa yang lebih baru.
	 * Mengembalikan `'stale'` bila kalah balapan, `null` bila halaman melewati akhir data.
	 */
	private async fetchPagedPage<T>(
		resource: PageResource,
		page: number,
		signature: string,
		fetcher: (cursor: string | null) => Promise<Paged<T>>
	): Promise<PagedState<T> | 'stale' | null> {
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
	private offlinePage<T>(items: T[]): PagedState<T> {
		return { items, nextCursor: null, total: items.length, page: 1, server: false };
	}

	async loadProductsPage(
		params: ListProductsParams & { page?: number } = {},
		fallback: Product[] = []
	): Promise<void> {
		const page = Math.max(1, params.page ?? 1);
		const signature = JSON.stringify([
			params.q ?? '',
			params.status ?? '',
			params.type ?? '',
			params.sortBy ?? '',
			params.sortDir ?? ''
		]);
		try {
			const result = await this.fetchPagedPage('products', page, signature, (cursor) =>
				listProducts({
					limit: params.limit ?? PAGE_SIZE,
					cursor,
					q: params.q,
					status: params.status,
					type: params.type,
					sortBy: params.sortBy,
					sortDir: params.sortDir
				})
			);
			if (result === 'stale') return;
			if (result === null) return;
			this.productsPage = result;
		} catch (e) {
			if (isNetworkError(e)) {
				this.productsPage = this.offlinePage(fallback);
				return;
			}
			console.error('[karja] muat halaman produk gagal:', e);
		}
	}

	/**
	 * Ambil jumlah pesanan per tab dari BE (seluruh pesanan seller, bukan halaman).
	 * Offline (error jaringan): pertahankan nilai sebelumnya; view menghitung lokal.
	 */
	async loadOrderCounts(): Promise<void> {
		try {
			this.orderCounts = await getSellerOrderCounts();
		} catch (e) {
			if (!isNetworkError(e)) console.error('[karja] muat jumlah pesanan gagal:', e);
		}
	}

	async loadOrdersPage(
		params: ListSellerOrdersParams & { page?: number } = {},
		fallback: Order[] = []
	): Promise<void> {
		void this.loadOrderCounts();
		const page = Math.max(1, params.page ?? 1);
		const signature = JSON.stringify([
			params.q ?? '',
			params.state ?? '',
			params.type ?? '',
			params.fulfillmentStatus ?? '',
			params.sortBy ?? '',
			params.sortDir ?? ''
		]);
		try {
			const result = await this.fetchPagedPage('orders', page, signature, (cursor) =>
				listSellerOrders({
					limit: params.limit ?? PAGE_SIZE,
					cursor,
					q: params.q,
					state: params.state,
					type: params.type,
					fulfillmentStatus: params.fulfillmentStatus,
					sortBy: params.sortBy,
					sortDir: params.sortDir
				})
			);
			if (result === 'stale') return;
			if (result === null) return;
			this.ordersPage = result;
		} catch (e) {
			if (isNetworkError(e)) {
				this.ordersPage = this.offlinePage(fallback);
				return;
			}
			console.error('[karja] muat halaman pesanan gagal:', e);
		}
	}

	async loadPayoutsPage(
		params: ListSellerPayoutsParams & { page?: number } = {},
		fallback: Payout[] = []
	): Promise<void> {
		const page = Math.max(1, params.page ?? 1);
		const signature = JSON.stringify([
			params.status ?? '',
			params.sortBy ?? '',
			params.sortDir ?? ''
		]);
		try {
			const result = await this.fetchPagedPage('payouts', page, signature, (cursor) =>
				listSellerPayouts({
					limit: params.limit ?? PAGE_SIZE,
					cursor,
					status: params.status,
					sortBy: params.sortBy,
					sortDir: params.sortDir
				})
			);
			if (result === 'stale') return;
			if (result === null) return;
			this.payoutsPage = result;
		} catch (e) {
			if (isNetworkError(e)) {
				this.payoutsPage = this.offlinePage(fallback);
				return;
			}
			console.error('[karja] muat halaman pencairan gagal:', e);
		}
	}

	async loadReviewsPage(
		params: ListSellerReviewsParams & { page?: number } = {},
		fallback: Review[] = []
	): Promise<void> {
		const page = Math.max(1, params.page ?? 1);
		const signature = JSON.stringify([params.q ?? '']);
		try {
			const result = await this.fetchPagedPage('reviews', page, signature, (cursor) =>
				listSellerReviews({
					limit: params.limit ?? PAGE_SIZE,
					cursor,
					q: params.q
				})
			);
			if (result === 'stale') return;
			if (result === null) return;
			this.reviewsPage = result;
		} catch (e) {
			if (isNetworkError(e)) {
				this.reviewsPage = this.offlinePage(fallback);
				return;
			}
			console.error('[karja] muat halaman ulasan gagal:', e);
		}
	}

	async loadNotificationsPage(
		params: ListSellerNotificationsParams & { page?: number } = {},
		fallback: AppNotification[] = []
	): Promise<void> {
		const page = Math.max(1, params.page ?? 1);
		const signature = JSON.stringify([params.unread ?? null]);
		try {
			const result = await this.fetchPagedPage('notifications', page, signature, (cursor) =>
				listSellerNotifications({
					limit: params.limit ?? PAGE_SIZE,
					cursor,
					unread: params.unread
				})
			);
			if (result === 'stale') return;
			if (result === null) return;
			this.notificationsPage = result;
		} catch (e) {
			if (isNetworkError(e)) {
				this.notificationsPage = this.offlinePage(fallback);
				return;
			}
			console.error('[karja] muat halaman notifikasi gagal:', e);
		}
	}

	/**
	 * Cerminkan status KYC BE ke profil. Tanggal ISO diformat untuk tampilan.
	 * `mark` dipakai saat status berasal dari aksi user (submit), bukan dari sync.
	 */
	applyKycStatus(status: KycStatus, mark = false): void {
		if (mark) this.markMutation();
		const current = this.sellerProfile.verification;
		this.sellerProfile = {
			...this.sellerProfile,
			verification: {
				...(current ?? { status: 'unverified' as const }),
				status: status.status,
				fullNameKtp: status.ktpName ?? current?.fullNameKtp,
				birthDate: status.birthDate ?? current?.birthDate,
				rejectionReason: status.rejectionReason,
				submittedAt: formatKycDate(status.submittedAt) ?? current?.submittedAt,
				verifiedAt: formatKycDate(status.verifiedAt) ?? current?.verifiedAt
			}
		};
	}

	publishProduct(product: Product) {
		this.markMutation();
		const exists = this.products.some((p) => p.id === product.id);
		this.products = exists
			? this.products.map((p) => (p.id === product.id ? product : p))
			: [product, ...this.products];

		this.addNotification({
			title: m.products_publish_success_title(),
			description: m.products_publish_success_desc({ title: product.title }),
			type: 'system',
			targetTab: 'produk',
			targetId: product.id
		});
	}

	saveProductDraft(draftProduct: Product) {
		this.markMutation();
		const exists = this.products.some((p) => p.id === draftProduct.id);
		this.products = exists
			? this.products.map((p) => (p.id === draftProduct.id ? draftProduct : p))
			: [draftProduct, ...this.products];

		this.addNotification({
			title: m.products_draft_saved_title(),
			description: m.products_draft_saved_desc({ title: draftProduct.title }),
			type: 'system',
			targetTab: 'produk',
			targetId: draftProduct.id
		});
	}

	updateProduct(updatedProduct: Product) {
		this.markMutation();
		this.products = this.products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
	}

	duplicateProduct(product: Product) {
		this.markMutation();
		const randomSuffix = Math.random().toString(36).substring(2, 6);
		const clonedProduct: Product = {
			...product,
			id: `prod_${Date.now()}`,
			title: `${product.title}${m.products_dup_suffix()}`,
			slug: `${product.slug}-salinan-${randomSuffix}`,
			status: 'draft',
			views: 0,
			sales: 0,
			revenue: 0,
			buyClicks: 0,
			createdAt: m.common_day_today()
		};
		this.products = [clonedProduct, ...this.products];
		this.addNotification({
			title: m.products_duplicated_title(),
			description: m.products_duplicated_desc({ title: product.title }),
			type: 'system',
			targetTab: 'produk',
			targetId: clonedProduct.id
		});
	}

	toggleProductStatus(productId: string) {
		this.markMutation();
		this.products = this.products.map((p) => {
			if (p.id === productId) {
				if (p.status === 'draft' || p.status === 'archived') return p;
				return { ...p, status: p.status === 'active' ? 'paused' : 'active' };
			}
			return p;
		});
	}

	archiveProduct(productId: string) {
		this.markMutation();
		this.products = this.products.map((p) =>
			p.id === productId ? { ...p, status: 'archived' } : p
		);
	}

	shareProduct(product: Product) {
		if (!this.journeySignals.hasSharedProduct) {
			this.journeySignals = { ...this.journeySignals, hasSharedProduct: true };
			this.addNotification({
				title: m.products_shared_title(),
				description: m.products_shared_desc(),
				type: 'action',
				targetTab: 'produk',
				targetId: product.id
			});
		}
	}

	viewProductAsBuyer(product: Product) {
		const currentViews = product.views;
		this.products = this.products.map((p) =>
			p.id === product.id ? { ...p, views: (p.views || 0) + 1 } : p
		);
		if (currentViews === 0) {
			this.addNotification({
				title: m.products_first_view_title(),
				description: m.products_first_view_desc({ title: product.title }),
				type: 'view',
				targetTab: 'produk',
				targetId: product.id
			});
		}
	}

	recordBuyClick(product: Product) {
		this.products = this.products.map((p) =>
			p.id === product.id ? { ...p, buyClicks: (p.buyClicks || 0) + 1 } : p
		);
	}

	// ---- Orders & Fulfillment ----

	async updateFulfillment(
		orderId: string,
		newStatus: FulfillmentStatus,
		extra?: {
			scheduledDate?: string;
			meetingLink?: string;
			deliveryNotes?: string;
			serviceDelivery?: ServiceDelivery;
			meetingLinkSharedAt?: string;
			rescheduleNoticePending?: boolean;
			rescheduleNotifiedAt?: string;
			feedbackRequestedAt?: string;
		}
	): Promise<void> {
		this.markMutation();
		const targetOrder = this.orders.find((o) => o.id === orderId);

		this.orders = this.orders.map((o) => {
			if (o.id !== orderId) return o;
			return {
				...o,
				fulfillmentStatus: newStatus,
				scheduledDate: extra?.scheduledDate || o.scheduledDate,
				meetingLink: extra?.meetingLink || o.meetingLink,
				deliveryNotes: extra?.deliveryNotes || o.deliveryNotes,
				serviceDelivery: extra?.serviceDelivery || o.serviceDelivery,
				meetingLinkSharedAt:
					extra?.meetingLinkSharedAt !== undefined
						? extra.meetingLinkSharedAt
						: o.meetingLinkSharedAt,
				rescheduleNoticePending:
					extra?.rescheduleNoticePending !== undefined
						? extra.rescheduleNoticePending
						: o.rescheduleNoticePending,
				rescheduleNotifiedAt:
					extra?.rescheduleNotifiedAt !== undefined
						? extra.rescheduleNotifiedAt
						: o.rescheduleNotifiedAt,
				feedbackRequestedAt:
					extra?.feedbackRequestedAt !== undefined
						? extra.feedbackRequestedAt
						: o.feedbackRequestedAt
			};
		});

		if (targetOrder?.bookingId || this.bookings.some((b) => b.orderId === orderId)) {
			this.bookings = this.bookings.map((b) => {
				if (b.id === targetOrder?.bookingId || b.orderId === orderId) {
					if (newStatus === 'selesai') return { ...b, status: 'completed' as const };
					if (newStatus === 'dibatalkan') return { ...b, status: 'cancelled' as const };
					if (newStatus === 'sudah_dijadwalkan')
						return {
							...b,
							status: 'confirmed' as const,
							meetingUrl: extra?.meetingLink || b.meetingUrl
						};
				}
				return b;
			});
		}

		if (targetOrder && (newStatus === 'selesai' || newStatus === 'akses_diberikan')) {
			this.addNotification({
				title: m.orders_payout_ready_title(),
				description: m.orders_payout_ready_desc({
					amount: formatRupiah(targetOrder.netAmount),
					orderNumber: targetOrder.orderNumber
				}),
				type: 'money',
				targetTab: 'uangmu',
				targetId: targetOrder.id
			});
		}

		const dto: ApiOrderFulfillmentDto = {
			fulfillmentStatus: toApiFulfillmentStatus(newStatus)
		};
		if (extra?.meetingLink !== undefined) dto.meetingLink = extra.meetingLink;
		if (extra?.deliveryNotes !== undefined) dto.deliveryNotes = extra.deliveryNotes;
		if (extra?.rescheduleNoticePending !== undefined)
			dto.rescheduleNoticePending = extra.rescheduleNoticePending;
		if (extra?.feedbackRequestedAt !== undefined)
			dto.feedbackRequestedAt = extra.feedbackRequestedAt;

		try {
			const updated = await updateOrderFulfillment(orderId, dto);
			this.applyOrderPatch(orderId, updated);
		} catch (e) {
			if (!isNetworkError(e)) console.error('[karja] update pemenuhan gagal:', e);
		}
	}

	async rescheduleBooking(orderId: string, payload: ReschedulePayload): Promise<void> {
		this.markMutation();
		const targetOrder = this.orders.find((o) => o.id === orderId);
		const targetBooking = this.bookings.find(
			(b) => b.orderId === orderId || (targetOrder?.bookingId && b.id === targetOrder.bookingId)
		);

		if (targetBooking) {
			const historyItem = {
				previousStartAt: targetBooking.startAt,
				previousEndAt: targetBooking.endAt,
				previousDateFormatted: targetBooking.dateFormatted,
				previousTimeFormatted: targetBooking.timeFormatted,
				newStartAt: payload.startAt,
				newEndAt: payload.endAt,
				newDateFormatted: payload.dateFormatted,
				newTimeFormatted: payload.timeFormatted,
				rescheduledAt: m.orders_rescheduled_at(),
				rescheduledBy: payload.rescheduledBy,
				reason: payload.reason
			};

			this.bookings = this.bookings.map((b) =>
				b.id === targetBooking.id
					? {
							...b,
							dateString: payload.dateString,
							timeSlot: payload.timeSlot,
							dateFormatted: payload.dateFormatted,
							timeFormatted: payload.timeFormatted,
							startAt: payload.startAt,
							endAt: payload.endAt,
							status: 'confirmed' as const,
							rescheduleCount: (b.rescheduleCount || 0) + 1,
							rescheduleHistory: [...(b.rescheduleHistory || []), historyItem]
						}
					: b
			);
		}

		this.orders = this.orders.map((o) =>
			o.id === orderId
				? {
						...o,
						fulfillmentStatus: 'sudah_dijadwalkan' as FulfillmentStatus,
						scheduledDate: `${payload.dateFormatted} (${payload.timeFormatted})`,
						bookingDateFormatted: payload.dateFormatted,
						bookingTimeFormatted: payload.timeFormatted,
						scheduledAt: payload.startAt,
						bookingStart: payload.startAt,
						sessionStart: payload.startAt,
						startAt: payload.startAt,
						rescheduleNoticePending: true
					}
				: o
		);

		this.addNotification({
			title: m.orders_rescheduled_title(),
			description: m.orders_rescheduled_desc({
				buyer: targetOrder?.buyerName || m.orders_buyer_fallback(),
				when: `${payload.dateFormatted} · ${payload.timeFormatted}`
			}),
			type: 'action',
			targetTab: 'pesanan',
			targetId: orderId
		});

		try {
			const updated = await updateOrderFulfillment(orderId, {
				fulfillmentStatus: 'sudah_dijadwalkan',
				scheduledAt: payload.startAt,
				rescheduleNoticePending: true
			});
			this.applyOrderPatch(orderId, updated);
		} catch (e) {
			if (!isNetworkError(e)) console.error('[karja] jadwalkan ulang gagal:', e);
		}
	}

	async cancelBooking(
		orderId: string,
		payload: { reason: string; cancelledBy: 'seller' | 'buyer' }
	): Promise<void> {
		this.markMutation();
		const targetOrder = this.orders.find((o) => o.id === orderId);
		const targetBooking = this.bookings.find(
			(b) => b.orderId === orderId || (targetOrder?.bookingId && b.id === targetOrder.bookingId)
		);

		if (targetBooking) {
			this.bookings = this.bookings.map((b) =>
				b.id === targetBooking.id
					? {
							...b,
							status: 'cancelled' as const,
							cancelledBy: payload.cancelledBy,
							cancellationReason: payload.reason,
							cancelledAt: new Date().toISOString()
						}
					: b
			);
		}

		this.orders = this.orders.map((o) =>
			o.id === orderId
				? {
						...o,
						fulfillmentStatus: 'dibatalkan' as FulfillmentStatus,
						cancelledBy: payload.cancelledBy,
						cancellationReason: payload.reason
					}
				: o
		);

		this.addNotification({
			title: m.orders_session_cancelled_title(),
			description: m.orders_session_cancelled_desc({
				orderNumber: targetOrder?.orderNumber || ''
			}),
			type: 'action',
			targetTab: 'pesanan',
			targetId: orderId
		});

		try {
			const updated = await updateOrderFulfillment(orderId, {
				fulfillmentStatus: 'dibatalkan',
				cancelledBy: payload.cancelledBy,
				cancellationReason: payload.reason
			});
			this.applyOrderPatch(orderId, updated);
		} catch (e) {
			if (!isNetworkError(e)) console.error('[karja] batalkan sesi gagal:', e);
		}
	}

	async markNoShow(
		orderId: string,
		payload: { noShowParty: 'buyer' | 'seller'; notes?: string }
	): Promise<void> {
		this.markMutation();
		const targetOrder = this.orders.find((o) => o.id === orderId);
		const targetBooking = this.bookings.find(
			(b) => b.orderId === orderId || (targetOrder?.bookingId && b.id === targetOrder.bookingId)
		);
		const isBuyerNoShow = payload.noShowParty === 'buyer';

		if (targetBooking) {
			this.bookings = this.bookings.map((b) =>
				b.id === targetBooking.id
					? {
							...b,
							status: (isBuyerNoShow ? 'completed' : 'cancelled') as 'completed' | 'cancelled',
							noShowParty: payload.noShowParty,
							noShowNotes: payload.notes
						}
					: b
			);
		}

		this.orders = this.orders.map((o) =>
			o.id === orderId
				? {
						...o,
						fulfillmentStatus: (isBuyerNoShow ? 'selesai' : 'dibatalkan') as FulfillmentStatus,
						noShowParty: payload.noShowParty
					}
				: o
		);

		this.addNotification({
			title: isBuyerNoShow ? m.orders_noshow_buyer_title() : m.orders_noshow_seller_title(),
			description: m.orders_noshow_desc({ orderNumber: targetOrder?.orderNumber || '' }),
			type: isBuyerNoShow ? 'money' : 'action',
			targetTab: 'pesanan',
			targetId: orderId
		});

		try {
			const updated = await updateOrderFulfillment(orderId, {
				fulfillmentStatus: isBuyerNoShow ? 'selesai' : 'dibatalkan',
				noShowParty: payload.noShowParty
			});
			this.applyOrderPatch(orderId, updated);
		} catch (e) {
			if (!isNetworkError(e)) console.error('[karja] tandai no-show gagal:', e);
		}
	}

	// ---- Payouts ----

	confirmPayout(amount: number) {
		if (
			!amount ||
			amount < MINIMUM_WITHDRAWAL_AMOUNT ||
			amount > this.availableBalance ||
			!isPayoutReady(this.sellerProfile)
		) {
			return;
		}
		const newPayout: Payout = {
			id: `pay_${Date.now()}`,
			amount: amount,
			status: 'processing',
			bankName: this.sellerProfile.bankInfo?.bank || 'BCA (Bank Central Asia)',
			accountNumber: this.sellerProfile.bankInfo?.accountNumber || '8291039481',
			accountHolder: this.sellerProfile.bankInfo?.accountHolder || this.sellerProfile.name,
			requestedAt: m.money_requested_today(),
			arrivalEstimate: m.money_processing(),
			referenceId: `TF${Math.floor(100000 + Math.random() * 900000)}`
		};
		this.payouts = [newPayout, ...this.payouts];

		this.addNotification({
			title: m.money_payout_request_title(),
			description: m.money_payout_request_desc({
				amount: formatRupiah(amount),
				bank: this.sellerProfile.bankInfo?.bank || 'bank'
			}),
			type: 'money',
			targetTab: 'uangmu',
			targetId: newPayout.id
		});
	}

	/**
	 * Ajukan pencairan. Saat online, kirim ke BE lalu segarkan saldo + riwayat.
	 * Kalau BE tidak terjangkau (offline), pakai simulasi lokal `confirmPayout`.
	 * Error non-jaringan (mis. 400 dari BE) dilempar agar UI bisa menampilkan pesannya.
	 */
	async requestPayout(amount: number): Promise<void> {
		this.markMutation();
		try {
			const created = await requestPayoutApi(amount);
			this.payouts = [created, ...this.payouts.filter((p) => p.id !== created.id)];
			await this.syncPayouts();
		} catch (e) {
			if (!isNetworkError(e)) throw e;
			this.confirmPayout(amount);
		}
	}

	simulatePayoutReceived(payoutId: string) {
		const target = this.payouts.find((p) => p.id === payoutId);
		if (!target) return;

		this.payouts = this.payouts.map((p) =>
			p.id === payoutId
				? { ...p, status: 'paid' as const, arrivalEstimate: m.money_transfer_done() }
				: p
		);

		this.addNotification({
			title: m.money_payout_received_title(),
			description: m.money_payout_received_desc({
				amount: formatRupiah(target.amount),
				bank: target.bankName
			}),
			type: 'money',
			targetTab: 'uangmu',
			targetId: payoutId
		});
	}

	// ---- Storefront simulation (purchase) ----

	simulatePurchase(
		product: Product,
		buyerName: string,
		notes: string,
		extraData?: PurchaseExtraData
	): string {
		this.markMutation();
		const effectivePrice = getEffectivePrice(product);
		const isFree = product.priceMode === 'free' || effectivePrice === 0;
		const karjaFee = isFree ? 0 : Math.round(effectivePrice * 0.07);
		const paymentFee = isFree ? 0 : Math.round(effectivePrice * 0.02);
		const net = isFree ? 0 : effectivePrice - karjaFee - paymentFee;
		const canonicalType: ProductType = normalizeProductType(product.type);
		const isSession = canonicalType === 'session';
		const bData = extraData?.bookingData;
		const hasBookingData = !!bData;

		const initialFulfillment: FulfillmentStatus = isSession
			? hasBookingData
				? 'sudah_dijadwalkan'
				: 'perlu_dijadwalkan'
			: product.type === 'service'
				? 'menunggu_brief'
				: 'akses_diberikan';

		const orderId = `ord_${Date.now()}`;
		const orderNumber = `#KRJ${Math.floor(1000 + Math.random() * 9000)}`;

		const newOrder: Order = {
			id: orderId,
			orderNumber,
			productId: product.id,
			productTitle: product.title,
			productType: product.type,
			buyerName: buyerName || 'Dion Pratama',
			buyerEmail:
				extraData?.email || `${(buyerName || 'dion').toLowerCase().replace(/\s+/g, '')}@gmail.com`,
			buyerPhone: extraData?.phone || '',
			buyerNotes: notes,
			scheduledDate:
				hasBookingData && bData
					? `${bData.dateFormatted} (${bData.timeFormatted})`
					: extraData?.preferredTime,
			meetingMethod: bData?.meetingMethod || (isSession ? 'google_meet' : undefined),
			meetingLink: bData?.meetingUrl,
			preparationAnswers: bData?.preparationAnswers,
			bookingDateFormatted: bData?.dateFormatted,
			bookingTimeFormatted: bData?.timeFormatted,
			bookingDurationMinutes: bData?.durationMinutes,
			amount: effectivePrice,
			karjaFee,
			paymentFee,
			netAmount: net,
			paymentStatus: isFree ? 'gratis' : 'lunas',
			fulfillmentStatus: initialFulfillment,
			isFreeClaim: isFree,
			accessToken: `acc_${orderId}`,
			createdAt: m.common_time_new()
		};

		this.orders = [newOrder, ...this.orders];

		if (hasBookingData && bData) {
			const newBooking: Booking = {
				id: `book_${Date.now()}`,
				orderId: newOrder.id,
				productId: product.id,
				sellerId: 'seller_1',
				buyerName: newOrder.buyerName,
				buyerEmail: newOrder.buyerEmail,
				buyerPhone: newOrder.buyerPhone,
				startAt: bData.startAt,
				endAt: bData.endAt,
				dateFormatted: bData.dateFormatted,
				timeFormatted: bData.timeFormatted,
				timeSlot: bData.timeSlot,
				durationMinutes: bData.durationMinutes,
				meetingMethod: 'google_meet',
				meetingUrl: bData.meetingUrl,
				status: 'confirmed',
				preparationAnswers: bData.preparationAnswers,
				createdAt: m.common_time_new()
			};
			this.bookings = [newBooking, ...this.bookings];
		}

		this.products = this.products.map((p) => {
			if (p.id !== product.id) return p;
			return isFree
				? { ...p, claims: (p.claims || 0) + 1 }
				: { ...p, sales: p.sales + 1, revenue: p.revenue + effectivePrice };
		});

		if (!isFree) {
			const newTrx: Transaction = {
				id: `trx_${Date.now()}`,
				orderId: newOrder.id,
				date: m.common_day_today(),
				type: 'sale',
				amount: effectivePrice,
				karjaFee,
				paymentFee,
				netReceived: net,
				productTitle: product.title,
				status: 'sukses'
			};
			this.transactions = [newTrx, ...this.transactions];
		}

		if (isSession && hasBookingData && bData) {
			this.addNotification({
				title: m.orders_session_scheduled_title(),
				description: m.orders_session_scheduled_desc({
					buyer: newOrder.buyerName,
					when: `${bData.dateFormatted} · ${bData.timeFormatted}`
				}),
				type: 'sale',
				targetTab: 'pesanan',
				targetId: newOrder.id
			});
		} else if (isFree) {
			this.addNotification({
				title: m.orders_free_claim_title(),
				description: m.orders_free_claim_desc({
					buyer: newOrder.buyerName,
					title: product.title
				}),
				type: 'action',
				targetTab: 'pesanan',
				targetId: newOrder.id
			});
		} else {
			this.addNotification({
				title: m.orders_new_sale_title(),
				description: m.orders_new_sale_desc({
					buyer: newOrder.buyerName,
					title: product.title,
					price: formatRupiah(effectivePrice)
				}),
				type: 'sale',
				targetTab: 'pesanan',
				targetId: newOrder.id
			});
		}

		if (!isFree && canonicalType === 'digital') {
			this.addNotification({
				title: m.orders_payout_ready_title(),
				description: m.orders_payout_ready_new_desc({ amount: formatRupiah(net) }),
				type: 'money',
				targetTab: 'uangmu',
				targetId: newOrder.id
			});
		} else if (canonicalType === 'service') {
			this.addNotification({
				title: m.orders_brief_in_title(),
				description: m.orders_brief_in_desc({ buyer: newOrder.buyerName }),
				type: 'action',
				targetTab: 'pesanan',
				targetId: newOrder.id
			});
		}

		return newOrder.id;
	}

	// ---- Reviews ----

	/**
	 * Balas ulasan. Saat online, kirim ke BE dan pakai ulasan hasil respons.
	 * Kalau BE tidak terjangkau (offline), simpan balasan secara lokal saja.
	 */
	async replyReview(reviewId: string, replyText: string): Promise<void> {
		this.markMutation();
		try {
			const updated = await replyToReview(reviewId, replyText);
			this.reviews = this.reviews.map((r) => (r.id === reviewId ? updated : r));
		} catch (e) {
			if (!isNetworkError(e)) {
				console.error('[karja] balas ulasan gagal:', e);
				return;
			}
			this.reviews = this.reviews.map((r) =>
				r.id === reviewId
					? { ...r, sellerReply: { comment: replyText, createdAt: m.common_time_new() } }
					: r
			);
		}

		this.addNotification({
			title: m.orders_reply_sent_title(),
			description: m.orders_reply_sent_desc(),
			type: 'system',
			targetTab: 'pesanan'
		});
	}

	addReviewForOrder(orderId: string, reviewData: { rating: number; comment: string }) {
		this.markMutation();
		const targetOrder = this.orders.find((o) => o.id === orderId);
		if (!targetOrder) return;
		const reviewId = `rev_${Date.now()}`;
		const newRev: Review = {
			id: reviewId,
			orderId: targetOrder.id,
			productId: targetOrder.productId,
			productTitle: targetOrder.productTitle,
			buyerName: targetOrder.buyerName,
			rating: reviewData.rating,
			comment: reviewData.comment,
			isVerifiedPurchase: !targetOrder.isFreeClaim && targetOrder.amount > 0,
			createdAt: m.common_time_new()
		};

		this.reviews = [newRev, ...this.reviews];
		this.orders = this.orders.map((o) =>
			o.id === targetOrder.id ? { ...o, reviewId, buyerReview: newRev } : o
		);

		this.products = this.products.map((p) => {
			if (p.id === targetOrder.productId) {
				const prodReviews = [...this.reviews.filter((r) => r.productId === p.id), newRev];
				const avg = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
				return { ...p, rating: Number(avg.toFixed(1)), reviewsCount: prodReviews.length };
			}
			return p;
		});

		this.addNotification({
			title: m.orders_review_new_title(),
			description: m.orders_review_new_desc({
				buyer: targetOrder.buyerName,
				rating: reviewData.rating,
				title: targetOrder.productTitle
			}),
			type: 'action',
			targetTab: 'pesanan',
			targetId: targetOrder.id
		});
	}

	// ---- Store & Profile ----

	updateStoreProfile(updated: SellerProfile) {
		this.sellerProfile = updated;
		this.journeySignals = { ...this.journeySignals, storeSetupCompleted: true };
		this.addNotification({
			title: m.store_updated_title(),
			description: m.store_updated_desc(),
			type: 'system',
			targetTab: 'toko'
		});
	}

	updateProfile(partial: Partial<SellerProfile>) {
		this.sellerProfile = { ...this.sellerProfile, ...partial };
	}

	setLifecycleOverride(state: LifecycleState | null) {
		this.manualLifecycleOverride = state;
	}

	// ---- Auth (simulated OTP) ----

	login(creds?: { email?: string; name?: string; mode?: 'fresh' | 'sample' }) {
		this.isAuthenticated = true;
		if (creds?.email) {
			this.sellerProfile = {
				...this.sellerProfile,
				email: creds.email || this.sellerProfile.email,
				name: creds.name || this.sellerProfile.name
			};
		}
	}

	startFreshSeller() {
		clearKarjaPersistedState();
		this.resetDataTo(
			freshSellerProfile,
			freshProducts,
			freshOrders,
			freshBookings,
			freshTransactions,
			freshPayouts,
			freshNotifications,
			freshReviews,
			freshJourneySignals
		);
		this.hasSeenWelcome = true;
		this.isAuthenticated = true;
	}

	loadSampleDemo() {
		this.resetDataTo(
			sampleSellerProfile,
			sampleProducts,
			sampleOrders,
			sampleBookings,
			sampleTransactions,
			samplePayouts,
			sampleNotifications,
			sampleReviews,
			sampleJourneySignals
		);
		this.hasSeenWelcome = true;
		this.isAuthenticated = true;
	}

	resetToFresh() {
		clearKarjaPersistedState();
		this.resetDataTo(
			freshSellerProfile,
			freshProducts,
			freshOrders,
			freshBookings,
			freshTransactions,
			freshPayouts,
			freshNotifications,
			freshReviews,
			freshJourneySignals
		);
		this.hasSeenWelcome = false;
		this.isAuthenticated = false;
	}

	private resetDataTo(
		profile: SellerProfile,
		products: Product[],
		orders: Order[],
		bookings: Booking[],
		transactions: Transaction[],
		payouts: Payout[],
		notifications: AppNotification[],
		reviews: Review[],
		journeySignals: SellerJourneySignals
	) {
		this.sellerProfile = structuredClone(profile);
		this.products = structuredClone(products);
		this.orders = structuredClone(orders);
		this.bookings = structuredClone(bookings);
		this.transactions = structuredClone(transactions);
		this.payouts = structuredClone(payouts);
		this.notifications = structuredClone(notifications);
		this.reviews = structuredClone(reviews);
		this.journeySignals = structuredClone(journeySignals);
		this.manualLifecycleOverride = null;
	}

	logout() {
		this.isAuthenticated = false;
	}

	// ---- Karja-Verified auto-sync ----

	syncKarjaVerified() {
		if (!this.sellerProfile) return;
		const evaluation = evaluateKarjaVerification(this.sellerProfile, this.orders);
		if (
			this.sellerProfile.verification?.karjaVerifiedStatus !== evaluation.karjaVerificationStatus
		) {
			this.sellerProfile = {
				...this.sellerProfile,
				verification: {
					...this.sellerProfile.verification!,
					karjaVerifiedStatus: evaluation.karjaVerificationStatus,
					karjaVerifiedAt:
						evaluation.karjaVerificationStatus === 'verified'
							? this.sellerProfile.verification?.karjaVerifiedAt ||
								new Date().toISOString().split('T')[0]
							: this.sellerProfile.verification?.karjaVerifiedAt
				}
			};
		}
	}
}

export const seller = new SellerStore();
