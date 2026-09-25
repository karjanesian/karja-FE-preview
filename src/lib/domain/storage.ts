/**
 * Centralized Storage and Persistence Management for Karja
 * Includes robust QuotaExceededError handling, legacy storage cleanup,
 * data URL sanitization, and graceful fallback.
 */

export const STORAGE_VERSION = 3;
export const STORAGE_KEY = 'karja_seller_state_v3';

export const ALL_KARJA_STORAGE_KEYS = [
	'karja_seller_state_v3',
	'karja_seller_state_v2',
	'karja_seller_state',
	'karja_state',
	'karja_bookings',
	'karja_availability',
	'karja_scheduling',
	'karja_notifications',
	'karja_profile',
	'karja_journey'
];

/**
 * Known fixture IDs & markers from mockData.ts to strip from normal user runtime state
 */
export const KNOWN_DEMO_PRODUCT_IDS = new Set([
	'prod_urban_harvest',
	'prod_ideation',
	'prod_1',
	'prod_2',
	'prod_3',
	'prod_4',
	'prod_5'
]);

export const KNOWN_DEMO_ORDER_IDS = new Set([
	'ord_ideation',
	'ord_1',
	'ord_2',
	'ord_3',
	'ord_4',
	'ord_5',
	'ord_6'
]);

export const KNOWN_DEMO_BOOKING_IDS = new Set(['book_1']);

export const KNOWN_DEMO_TRANSACTION_IDS = new Set(['trx_1', 'trx_2', 'trx_3', 'trx_4', 'trx_5']);

export const KNOWN_DEMO_PAYOUT_IDS = new Set(['pay_1']);

export const KNOWN_DEMO_NOTIFICATION_IDS = new Set([
	'notif_1',
	'notif_2',
	'notif_3',
	'notif_4',
	'notif_5'
]);

export const KNOWN_DEMO_REVIEW_IDS = new Set(['rev_1', 'rev_2', 'rev_3']);

export const KNOWN_DEMO_BUYER_NAMES = new Set([
	'Dion Pratama',
	'Putri Rahma',
	'Rina Sasmita',
	'Raka Aditya',
	'Hendra Wijaya',
	'Sarah Wijaya'
]);

export const KNOWN_DEMO_PRODUCT_TITLES = new Set([
	'Konsultasi Ideation',
	'Review Figma 20 Menit',
	'Urban Harvest: Panduan Berkebun Organik di Rumah',
	'Template Laporan Mingguan Excel Otomatis',
	'Audit & Masukan Profil LinkedIn'
]);

/**
 * One-time migration function that strips known sample/demo records from persisted state
 */
export function sanitizeAndMigrateKarjaState(rawState: any): any {
	if (!rawState || typeof rawState !== 'object') return null;

	// Strip known demo products
	const cleanedProducts = Array.isArray(rawState.products)
		? rawState.products.filter(
				(p: any) =>
					p &&
					typeof p === 'object' &&
					!KNOWN_DEMO_PRODUCT_IDS.has(p.id) &&
					!KNOWN_DEMO_PRODUCT_TITLES.has(p.title)
			)
		: [];

	// Strip known demo orders
	const cleanedOrders = Array.isArray(rawState.orders)
		? rawState.orders.filter(
				(o: any) =>
					o &&
					typeof o === 'object' &&
					!KNOWN_DEMO_ORDER_IDS.has(o.id) &&
					!KNOWN_DEMO_PRODUCT_IDS.has(o.productId) &&
					!KNOWN_DEMO_BUYER_NAMES.has(o.buyerName) &&
					!KNOWN_DEMO_PRODUCT_TITLES.has(o.productTitle)
			)
		: [];

	// Strip known demo bookings
	const cleanedBookings = Array.isArray(rawState.bookings)
		? rawState.bookings.filter(
				(b: any) =>
					b &&
					typeof b === 'object' &&
					!KNOWN_DEMO_BOOKING_IDS.has(b.id) &&
					!KNOWN_DEMO_PRODUCT_IDS.has(b.productId) &&
					!KNOWN_DEMO_BUYER_NAMES.has(b.buyerName) &&
					!KNOWN_DEMO_PRODUCT_TITLES.has(b.productTitle)
			)
		: [];

	// Strip known demo transactions
	const cleanedTransactions = Array.isArray(rawState.transactions)
		? rawState.transactions.filter(
				(t: any) =>
					t &&
					typeof t === 'object' &&
					!KNOWN_DEMO_TRANSACTION_IDS.has(t.id) &&
					!KNOWN_DEMO_ORDER_IDS.has(t.orderId)
			)
		: [];

	// Strip known demo payouts
	const cleanedPayouts = Array.isArray(rawState.payouts)
		? rawState.payouts.filter(
				(p: any) => p && typeof p === 'object' && !KNOWN_DEMO_PAYOUT_IDS.has(p.id)
			)
		: [];

	// Strip known demo notifications
	const cleanedNotifications = Array.isArray(rawState.notifications)
		? rawState.notifications.filter(
				(n: any) =>
					n &&
					typeof n === 'object' &&
					!KNOWN_DEMO_NOTIFICATION_IDS.has(n.id) &&
					!KNOWN_DEMO_ORDER_IDS.has(n.targetId) &&
					!KNOWN_DEMO_PRODUCT_IDS.has(n.targetId)
			)
		: [];

	// Strip known demo reviews
	const cleanedReviews = Array.isArray(rawState.reviews)
		? rawState.reviews.filter(
				(r: any) =>
					r &&
					typeof r === 'object' &&
					!KNOWN_DEMO_REVIEW_IDS.has(r.id) &&
					!KNOWN_DEMO_ORDER_IDS.has(r.orderId) &&
					!KNOWN_DEMO_PRODUCT_IDS.has(r.productId) &&
					!KNOWN_DEMO_BUYER_NAMES.has(r.buyerName)
			)
		: [];

	// Reset seller profile if it matches the demo seller
	let cleanedProfile = rawState.sellerProfile;
	if (
		cleanedProfile &&
		(cleanedProfile.name === 'Daniel Gallego' ||
			cleanedProfile.username === 'danielgallego' ||
			cleanedProfile.email === 'daniel@example.com')
	) {
		cleanedProfile = {
			name: 'Teman Karja',
			username: '',
			email: '',
			tagline: '',
			bio: '',
			topics: [],
			whatsapp: '',
			instagram: '',
			linkedin: '',
			tiktok: '',
			threads: '',
			showWhatsappOnStore: false,
			avatarUrl: '',
			bannerUrl: '',
			bankInfo: { bank: '', accountNumber: '', accountHolder: '' },
			calendarIntegration: { provider: 'google_calendar', status: 'disconnected' },
			verification: { status: 'unverified', karjaVerifiedStatus: 'not_eligible' },
			notificationPreferences: {
				email: {
					newOrder: true,
					orderActionRequired: true,
					sessionReminder: true,
					newReview: true,
					payoutUpdates: true,
					weeklySummary: false
				},
				inApp: {
					newOrder: true,
					orderActionRequired: true,
					sessionReminder: true,
					newReview: true,
					payoutUpdates: true
				}
			}
		};
	}

	// Normalize legacy meetingMethod values safely to 'google_meet'
	const normalizedProducts = cleanedProducts.map((p: any) => {
		if (p && typeof p === 'object' && p.meetingMethod && p.meetingMethod !== 'google_meet') {
			return { ...p, meetingMethod: 'google_meet' };
		}
		return p;
	});

	const normalizedOrders = cleanedOrders.map((o: any) => {
		if (o && typeof o === 'object' && o.meetingMethod && o.meetingMethod !== 'google_meet') {
			return { ...o, meetingMethod: 'google_meet' };
		}
		return o;
	});

	const normalizedBookings = cleanedBookings.map((b: any) => {
		if (b && typeof b === 'object' && b.meetingMethod && b.meetingMethod !== 'google_meet') {
			return { ...b, meetingMethod: 'google_meet' };
		}
		return b;
	});

	// Sanitize journey signals according to real domain state
	let cleanedJourneySignals = rawState.journeySignals || {
		hasSharedProduct: false,
		hasVisitedPublicStore: false,
		storeSetupCompleted: false,
		hasAcknowledgedFirstSaleMilestone: false
	};

	if (cleanedProducts.length === 0) {
		cleanedJourneySignals = {
			...cleanedJourneySignals,
			hasSharedProduct: false
		};
	}

	if (!cleanedProfile || !cleanedProfile.username || cleanedProfile.username.trim() === '') {
		cleanedJourneySignals = {
			...cleanedJourneySignals,
			storeSetupCompleted: false
		};
	}

	return {
		...rawState,
		_version: STORAGE_VERSION,
		sellerProfile: cleanedProfile,
		products: normalizedProducts,
		orders: normalizedOrders,
		bookings: normalizedBookings,
		transactions: cleanedTransactions,
		payouts: cleanedPayouts,
		notifications: cleanedNotifications,
		reviews: cleanedReviews,
		journeySignals: cleanedJourneySignals
	};
}

/**
 * Sweeps and clears ALL persisted Karja state from localStorage and sessionStorage
 */
export function clearKarjaPersistedState(): void {
	try {
		ALL_KARJA_STORAGE_KEYS.forEach((key) => {
			try {
				localStorage.removeItem(key);
				sessionStorage.removeItem(key);
			} catch (_) {}
		});

		if (typeof localStorage !== 'undefined') {
			const keysToRemove: string[] = [];
			for (let i = 0; i < localStorage.length; i++) {
				const k = localStorage.key(i);
				if (k && k.toLowerCase().startsWith('karja')) {
					keysToRemove.push(k);
				}
			}
			keysToRemove.forEach((k) => {
				try {
					localStorage.removeItem(k);
				} catch (_) {}
			});
		}

		if (typeof sessionStorage !== 'undefined') {
			const keysToRemove: string[] = [];
			for (let i = 0; i < sessionStorage.length; i++) {
				const k = sessionStorage.key(i);
				if (k && k.toLowerCase().startsWith('karja')) {
					keysToRemove.push(k);
				}
			}
			keysToRemove.forEach((k) => {
				try {
					sessionStorage.removeItem(k);
				} catch (_) {}
			});
		}
	} catch (err) {
		console.error('Failed to clear Karja persisted storage:', err);
	}
}

export const STALE_ONBOARDING_KEYS = [
	'onboardingProgress',
	'setupCompleted',
	'storeSetupDone',
	'productCreated',
	'productShared',
	'hasShared',
	'firstRunCompleted'
];

/**
 * Cleans up old / orphaned Karja keys from localStorage except the active key
 */
export function cleanOldStorageKeys(): void {
	try {
		if (typeof localStorage === 'undefined') return;
		for (const key of ALL_KARJA_STORAGE_KEYS) {
			if (key !== STORAGE_KEY) {
				try {
					localStorage.removeItem(key);
				} catch (_) {}
			}
		}
		for (const key of STALE_ONBOARDING_KEYS) {
			try {
				localStorage.removeItem(key);
			} catch (_) {}
		}
	} catch (_) {}
}

/**
 * Recursively sanitize deep objects to truncate huge base64 data URLs (>30KB)
 */
function sanitizeLargePayload(obj: any): any {
	if (!obj || typeof obj !== 'object') return obj;

	if (Array.isArray(obj)) {
		return obj.map((item) => sanitizeLargePayload(item));
	}

	const sanitized: Record<string, any> = {};
	for (const [key, value] of Object.entries(obj)) {
		if (typeof value === 'string' && value.startsWith('data:') && value.length > 30000) {
			// Truncate/strip giant data URLs to prevent quota overflow
			sanitized[key] = '';
		} else if (typeof value === 'object' && value !== null) {
			sanitized[key] = sanitizeLargePayload(value);
		} else {
			sanitized[key] = value;
		}
	}
	return sanitized;
}

/**
 * Safely saves state to localStorage with automatic quota management
 */
export function saveKarjaState(stateToSave: any): boolean {
	if (typeof localStorage === 'undefined') return false;

	try {
		// 1. Clean old keys first
		cleanOldStorageKeys();

		// 2. Attach storage version
		const payload = {
			...stateToSave,
			_version: STORAGE_VERSION
		};

		// 3. Normal attempt
		const serialized = JSON.stringify(payload);
		localStorage.setItem(STORAGE_KEY, serialized);
		return true;
	} catch (error: any) {
		console.warn('Primary localStorage.setItem failed, attempting recovery:', error?.message);

		try {
			// Recovery Level 1: Sanitize large data URLs (images/photos)
			const sanitized = sanitizeLargePayload({
				...stateToSave,
				_version: STORAGE_VERSION
			});
			const sanitizedStr = JSON.stringify(sanitized);
			localStorage.setItem(STORAGE_KEY, sanitizedStr);
			return true;
		} catch (sanitizedError: any) {
			console.warn(
				'Sanitized localStorage.setItem failed, attempting fallback to sessionStorage:',
				sanitizedError?.message
			);

			try {
				// Recovery Level 2: Clear other keys and try sessionStorage
				clearKarjaPersistedState();
				const sanitized = sanitizeLargePayload({
					...stateToSave,
					_version: STORAGE_VERSION
				});
				sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
				return true;
			} catch (sessionError) {
				console.error('All storage attempts failed gracefully:', sessionError);
				return false;
			}
		}
	}
}

/**
 * Safely loads state from localStorage or sessionStorage
 */
export function loadKarjaState(): any | null {
	if (typeof localStorage === 'undefined') return null;

	let raw: string | null = null;

	try {
		raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			// Check legacy keys for existing user data to migrate
			for (const legacyKey of ALL_KARJA_STORAGE_KEYS) {
				if (legacyKey !== STORAGE_KEY) {
					const oldRaw = localStorage.getItem(legacyKey);
					if (oldRaw) {
						raw = oldRaw;
						break;
					}
				}
			}
		}
	} catch (e) {
		console.warn('Failed to parse state from localStorage, trying sessionStorage:', e);
	}

	if (!raw && typeof sessionStorage !== 'undefined') {
		try {
			raw = sessionStorage.getItem(STORAGE_KEY);
		} catch (_) {}
	}

	if (!raw) return null;

	try {
		const parsed = JSON.parse(raw);
		const migrated = sanitizeAndMigrateKarjaState(parsed);

		// Save migrated state to new STORAGE_KEY and purge legacy keys
		if (migrated) {
			saveKarjaState(migrated);
		}

		return migrated;
	} catch (e) {
		console.error('Failed to parse or migrate Karja state:', e);
		return null;
	}
}
