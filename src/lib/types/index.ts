import { ProductModerationStatus } from './admin';
export * from './admin';

export type ProductType = 'digital' | 'session' | 'service';
export type ProductStatus = 'active' | 'draft' | 'paused' | 'archived';
export type ProductVisibility = 'link_only' | 'store';
export type PriceMode = 'free' | 'fixed' | 'promo';
export type DigitalDeliveryType = 'upload' | 'external_link' | 'instructions';
export type MeetingMethod = 'google_meet';

export interface TimeRange {
	startTime: string; // e.g. "09:00"
	endTime: string; // e.g. "12:00"
}

export interface WeeklyAvailability {
	day: 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu';
	dayLabel: string;
	enabled: boolean;
	startTime: string; // e.g. "19:00" (backward compat fallback)
	endTime: string; // e.g. "21:00" (backward compat fallback)
	timeRanges?: TimeRange[]; // Multiple time ranges per day
}

export interface SellerAvailability {
	timezone: string; // e.g. "Asia/Jakarta"
	weeklySchedule: WeeklyAvailability[];
}

export interface CalendarIntegration {
	provider: 'google_calendar' | 'google';
	status: 'connected' | 'disconnected';
	connectedEmail?: string;
	connectedAt?: string;
	autoGenerateMeetingLink?: boolean;
	syncAvailability?: boolean;
}

export interface BookingRescheduleRecord {
	previousStartAt: string;
	previousEndAt: string;
	previousDateFormatted?: string;
	previousTimeFormatted?: string;
	newStartAt: string;
	newEndAt: string;
	newDateFormatted?: string;
	newTimeFormatted?: string;
	rescheduledAt: string;
	rescheduledBy: 'seller' | 'buyer';
	reason?: string;
}

export interface Booking {
	id: string;
	orderId: string;
	productId: string;
	sellerId?: string;
	productTitle?: string;
	buyerName: string;
	buyerEmail: string;
	buyerPhone?: string;
	startAt: string; // ISO string with Asia/Jakarta offset
	endAt: string; // ISO string with Asia/Jakarta offset
	dateFormatted: string; // e.g. "Rabu, 26 Agustus 2026"
	dateString?: string; // e.g. "2026-08-26"
	timeFormatted: string; // e.g. "19.30–19.50 WIB"
	timeSlot: string; // e.g. "19:30"
	timezone?: string; // Explicitly "Asia/Jakarta" (WIB)
	durationMinutes: number;
	meetingMethod?: MeetingMethod;
	meetingUrl?: string; // e.g. "https://meet.google.com/abc-defg-hij"
	calendarEventId?: string;
	status: 'confirmed' | 'rescheduled' | 'completed' | 'cancelled' | 'no_show';
	rescheduleCount?: number;
	rescheduleHistory?: BookingRescheduleRecord[];
	cancellationReason?: string;
	cancelledBy?: 'seller' | 'buyer';
	cancelledAt?: string;
	noShowParty?: 'buyer' | 'seller';
	noShowNotes?: string;
	preparationAnswers?: {
		question: string;
		answer: string;
	}[];
	rescheduleNoticePending?: boolean;
	rescheduleNotifiedAt?: string;
	createdAt: string;
}

export interface ProductFAQ {
	id: string;
	question: string;
	answer: string;
}

export interface Product {
	id: string;
	sellerId?: string;
	title: string;
	slug: string;
	type: ProductType;
	productSubtype?: string;
	category: string;
	price: number; // Effective price (0 if free, promoPrice if promo)
	priceMode: PriceMode;
	regularPrice?: number;
	promoPrice?: number;
	promoEndsAt?: string;
	visibility: ProductVisibility;
	status: ProductStatus;
	images: string[]; // Max 5 images; first image is cover
	imageFiles?: { id: string; url: string; position?: number }[]; // API file ids for images (index 0 = primary)
	coverImage?: string; // Compatibility fallback for images[0]
	coverEmoji?: string;
	badge?: string;
	rating?: number;
	reviewsCount?: number;
	shortDescription?: string;

	// Persuasive / Block Content (Optional)
	targetAudience: string;
	problemSolved: string;
	whatYouGet: string;
	howItWorks: string;
	aboutCreator: string;
	faqs: ProductFAQ[];

	// Digital specific configs
	digitalDeliveryType?: DigitalDeliveryType;
	fileDownloadName?: string;
	fileSize?: string;
	fileUrl?: string;
	externalAccessUrl?: string;
	accessInstructions?: string;
	fileAccessInstructions?: string; // Compatibility

	// Session specific configs (v0.8)
	sessionDurationMinutes?: number; // 20, 30, 45, 60, 90
	availabilityMode?: 'seller_default' | 'custom';
	customAvailability?: SellerAvailability;
	bufferMinutes?: number; // 0, 10, 15, 30
	minimumNoticeHours?: number; // 2, 6, 12, 24
	bookingWindowDays?: number; // 7, 14, 30, 60
	meetingMethod?: MeetingMethod;
	meetingInstructions?: string;
	preparationQuestions?: string[]; // Up to 3 questions
	sessionPlatform?: string; // Compatibility
	sessionBookingNote?: string;
	sessionPrepNote?: string;

	// Service specific configs
	serviceTimelineDays?: number;
	serviceRevisions?: number;
	serviceBuyerInputsRequired?: string;
	serviceDeliverables?: string;

	// Product Moderation (v1.4 Admin Foundation)
	moderationStatus?: ProductModerationStatus;
	moderationReason?: string;
	moderatedAt?: string;
	moderatedBy?: string;
	moderationNote?: string;

	// Analytics & Counts
	views: number;
	sales: number;
	revenue: number;
	claims?: number; // Free claims / downloads
	downloads?: number;
	buyClicks: number;
	createdAt: string;
}

export type PaymentStatus = 'lunas' | 'menunggu_pembayaran' | 'gratis';
export type FulfillmentStatus =
	| 'belum_dibayar'
	| 'terjadwal'
	| 'perlu_dijadwalkan'
	| 'sudah_dijadwalkan'
	| 'menunggu_brief'
	| 'sedang_dikerjakan'
	| 'hasil_dikirim'
	| 'akses_diberikan'
	| 'selesai'
	| 'dibatalkan';

export interface Order {
	id: string;
	sellerId?: string;
	orderNumber: string;
	buyerName: string;
	buyerEmail: string;
	buyerPhone: string;
	productId: string;
	productTitle: string;
	productType: ProductType;
	amount: number;
	karjaFee: number;
	paymentFee: number;
	netAmount: number;
	paymentStatus: PaymentStatus;
	paymentMethod?: string;
	paymentIntentId?: string;
	providerReference?: string;
	fulfillmentStatus: FulfillmentStatus;
	createdAt: string;
	buyerNotes?: string;
	preferredTime?: string;
	scheduledDate?: string;
	scheduledAt?: string;
	bookingStart?: string;
	sessionStart?: string;
	startAt?: string;
	meetingMethod?: string;
	meetingLink?: string;
	deliveryNotes?: string;
	serviceDelivery?: ServiceDelivery;
	reviewId?: string;
	buyerReview?: Review;
	isFreeClaim?: boolean;
	accessToken?: string;
	cancellationReason?: string;
	cancelledBy?: 'seller' | 'buyer';
	cancelledAt?: string;
	noShowParty?: 'buyer' | 'seller';
	sessionConfirmationDeliveredAt?: string;
	meetingLinkSharedAt?: string;
	rescheduleNoticePending?: boolean;
	rescheduleNotifiedAt?: string;
	feedbackRequestedAt?: string;

	// Service delivery relation & timestamps (v1.5)
	serviceDueAt?: string; // ISO timestamp
	serviceStartedAt?: string; // ISO timestamp
	serviceCompletedAt?: string; // ISO timestamp

	// Session booking relation (v0.8)
	bookingId?: string;
	bookingTimeFormatted?: string;
	bookingDateFormatted?: string;
	bookingDurationMinutes?: number;
	preparationAnswers?: {
		question: string;
		answer: string;
	}[];
}

export interface Transaction {
	id: string;
	sellerId?: string;
	date: string;
	orderId?: string;
	productTitle: string;
	type: 'sale' | 'payout';
	amount: number;
	karjaFee: number;
	paymentFee: number;
	netReceived: number;
	status: 'sukses' | 'proses' | 'siap';
}

export interface Payout {
	id: string;
	sellerId?: string;
	amount: number;
	bankName: string;
	accountNumber: string;
	accountHolder: string;
	status: 'requested' | 'approved' | 'processing' | 'paid' | 'failed' | 'held' | 'rejected';
	requestedAt: string;
	arrivalEstimate: string;
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

export interface SellerProfile {
	id?: string;
	userId?: string;
	name: string;
	username: string;
	email?: string;
	tagline: string;
	bio: string;
	topics: string[];
	whatsapp: string;
	instagram: string;
	linkedin: string;
	tiktok: string;
	threads?: string;
	showWhatsappOnStore: boolean;
	avatarUrl: string;
	bannerUrl?: string;
	bankInfo: {
		bank: string;
		accountNumber: string;
		accountHolder: string;
	};

	// Account level Integrations & Availability (v0.8)
	calendarIntegration?: CalendarIntegration;
	availability?: SellerAvailability;
	verification?: SellerVerification;
	notificationPreferences?: NotificationPreferences;
}

export type LifecycleState =
	| 'no_product'
	| 'product_draft'
	| 'product_published_not_shared'
	| 'product_shared_no_views'
	| 'first_views_no_sale'
	| 'first_sale_needs_action'
	| 'first_sale_completed'
	| 'balance_available'
	| 'repeat_seller';

export interface AppNotification {
	id: string;
	title: string;
	description: string;
	time?: string;
	timestamp?: string;
	unread?: boolean;
	isRead?: boolean;
	targetTab?: string;
	targetId?: string;
	type: 'sale' | 'view' | 'action' | 'money' | 'system';
}

export interface JourneySignals {
	hasSharedProduct: boolean;
	hasVisitedPublicStore: boolean;
	storeSetupCompleted?: boolean;
	hasAcknowledgedFirstSaleMilestone?: boolean;
}

export type SellerJourneySignals = JourneySignals;

export type MainNavTab = 'beranda' | 'pesanan' | 'produk' | 'toko' | 'uangmu' | 'pengaturan';
export type TabType = MainNavTab;

export interface Review {
	id: string;
	sellerId?: string;
	orderId: string;
	productId: string;
	productTitle: string;
	buyerName: string;
	buyerAvatar?: string;
	rating: number; // 1 to 5
	comment: string;
	isVerifiedPurchase: boolean;
	createdAt: string;
	sellerReply?: {
		comment: string;
		createdAt: string;
	};
}

export interface ServiceDelivery {
	id: string;
	orderId: string;
	method: 'upload' | 'link' | 'instruction';
	fileName?: string;
	fileSize?: string;
	externalUrl?: string;
	urlPlatform?:
		'google_drive' | 'google_docs' | 'notion' | 'figma' | 'canva' | 'loom' | 'dropbox' | 'other';
	instructions?: string;
	sellerMessage?: string;
	deliveredAt: string;
}

export type IdentityVerificationStatus =
	'unverified' | 'pending' | 'verified' | 'needs_update' | 'rejected';
export type KarjaVerificationStatus = 'not_eligible' | 'eligible' | 'verified' | 'revoked';

export interface SellerVerification {
	// Identity / KYC Verification (Administrative)
	status: IdentityVerificationStatus;
	fullNameKtp?: string;
	nik?: string;
	idCardNumber?: string;
	birthDate?: string;
	ktpPhotoUrl?: string;
	idCardPhotoUrl?: string;
	submittedAt?: string;
	reviewedAt?: string;
	reviewedBy?: string;
	reviewerNotes?: string;
	rejectionReason?: string;
	verifiedAt?: string;
	emailVerified?: boolean;
	phoneVerified?: boolean;

	// Karja Verified (Reputation & Proven Activity)
	karjaVerifiedStatus?: KarjaVerificationStatus;
	karjaVerifiedAt?: string;
	karjaRevokedAt?: string;
	karjaRevokedReason?: string;
	isAccountSuspended?: boolean;
	hasTrustSafetyViolation?: boolean;
}

export interface NotificationPreferences {
	email: {
		newOrder: boolean;
		orderActionRequired: boolean;
		sessionReminder: boolean;
		newReview: boolean;
		payoutUpdates: boolean;
		weeklySummary: boolean;
	};
	inApp: {
		newOrder: boolean;
		orderActionRequired: boolean;
		sessionReminder: boolean;
		newReview: boolean;
		payoutUpdates: boolean;
	};
}

// Helper to safely normalize legacy product type values
export function normalizeProductType(type: any): ProductType {
	if (!type) return 'digital';
	if (type === 'digital' || type === 'digital_file' || type === 'file') return 'digital';
	if (type === 'session' || type === 'consultation') return 'session';
	if (type === 'service') return 'service';
	return 'digital';
}
