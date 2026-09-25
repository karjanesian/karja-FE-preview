/**
 * KARJA JOURNEY & PLATFORM EVENT MODEL
 * Canonical time-series and milestone event tracking across Seller & Buyer lifecycles.
 */

export type JourneyEventType =
	| 'seller.signup'
	| 'seller.store_ready'
	| 'product.created'
	| 'product.published'
	| 'product.shared'
	| 'store.viewed'
	| 'product.viewed'
	| 'product.buy_clicked'
	| 'checkout.started'
	| 'payment.paid'
	| 'order.created'
	| 'buyer.access_opened'
	| 'order.completed'
	| 'review.submitted'
	| 'payout.requested'
	| 'payout.paid';

export interface JourneyEvent {
	id: string;
	type: JourneyEventType;
	actorType: 'seller' | 'buyer' | 'visitor' | 'admin' | 'system';
	sellerId?: string;
	buyerKey?: string; // normalized email e.g. "budi.santoso@gmail.com"
	buyerEmail?: string;
	buyerName?: string;
	productId?: string;
	orderId?: string;
	bookingId?: string;
	occurredAt: string; // ISO 8601 string
	metadata?: Record<string, any>;
}

export type PlatformEvent = JourneyEvent;
