import { m } from '$lib/paraglide/messages.js';
import {
	Order,
	Product,
	Booking,
	FulfillmentStatus,
	Review,
	normalizeProductType
} from '$lib/types';

export interface OrderActionDetails {
	status: FulfillmentStatus;
	badgeText: string;
	badgeVariant: 'amber' | 'green' | 'blue' | 'purple' | 'red' | 'gray';
	eyebrow: string;
	title: string;
	description: string;
	actionType:
		| 'schedule'
		| 'notify_reschedule'
		| 'share_link'
		| 'join_meeting'
		| 'start_working'
		| 'deliver'
		| 'complete'
		| 'feedback'
		| 'feedback_sent'
		| 'review_received'
		| 'view_detail'
		| 'none';
	actionLabel?: string;
	secondaryActionLabel?: string;
	isUrgent: boolean;
	intent?: 'meeting_link' | 'reschedule_notice' | 'feedback' | 'general';
}

/**
 * Single booking resolver for any order.
 * Consistently matches via order.bookingId or booking.orderId === order.id.
 */
export function findBookingForOrder(order: Order, bookings: Booking[] = []): Booking | undefined {
	if (!order) return undefined;
	return bookings.find(
		(b) => (order.bookingId && b.id === order.bookingId) || b.orderId === order.id
	);
}

/**
 * Checks if a session's scheduled time has already passed.
 * Supports optional deterministic now parameter (timestamp or Date).
 */
export function hasSessionEnded(
	order: Order,
	booking?: Booking | null,
	now?: Date | number
): boolean {
	const currentTime =
		now instanceof Date ? now.getTime() : typeof now === 'number' ? now : Date.now();
	if (booking?.endAt) {
		const end = new Date(booking.endAt).getTime();
		if (!isNaN(end) && end <= currentTime) {
			return true;
		}
	}
	if ((order as any)?.bookingEndAt) {
		const end = new Date((order as any).bookingEndAt).getTime();
		if (!isNaN(end) && end <= currentTime) {
			return true;
		}
	}
	return false;
}

/**
 * Checks if an order is in a finalized, completed state.
 * - Digital: completed upon delivery (akses_diberikan or selesai)
 * - Session: completed only when marked selesai
 * - Service: completed only when marked selesai
 */
export function isOrderCompleted(order: Order): boolean {
	if (!order || order.fulfillmentStatus === 'dibatalkan') return false;
	const canonicalType = normalizeProductType(order.productType);

	if (canonicalType === 'digital') {
		return order.fulfillmentStatus === 'akses_diberikan' || order.fulfillmentStatus === 'selesai';
	}

	return order.fulfillmentStatus === 'selesai';
}

/**
 * Checks if an order represents a genuine paid sale (not a free claim, not cancelled).
 */
export function isPaidSale(order: Order): boolean {
	if (!order) return false;
	return (
		order.paymentStatus === 'lunas' &&
		order.amount > 0 &&
		!order.isFreeClaim &&
		order.fulfillmentStatus !== 'dibatalkan'
	);
}

/**
 * Checks if an order represents a completed paid sale.
 * Both the payment must be a genuine sale AND the fulfillment lifecycle must be complete.
 */
export function isCompletedPaidSale(order: Order): boolean {
	return isPaidSale(order) && isOrderCompleted(order);
}

export interface PaymentStatusDisplay {
	label: string;
	variant: 'green' | 'blue' | 'amber' | 'red' | 'gray';
}

/**
 * Centralized payment status presentation helper across all screens.
 * Ensures free claims never show as 'Lunas', cancelled orders show as 'Dibatalkan',
 * and paid orders show as 'Lunas'.
 */
export function getPaymentStatusDisplay(order?: Order | null): PaymentStatusDisplay {
	if (!order) return { label: '—', variant: 'gray' };
	if (order.isFreeClaim || order.paymentStatus === 'gratis' || order.amount === 0) {
		return { label: m.pay_free_claim(), variant: 'gray' };
	}
	if (order.fulfillmentStatus === 'dibatalkan' || order.cancelledAt) {
		return { label: m.ful_cancelled(), variant: 'red' };
	}
	if (order.paymentStatus === 'lunas') {
		return { label: m.pay_paid(), variant: 'green' };
	}
	if (order.paymentStatus === 'menunggu_pembayaran') {
		return { label: m.pay_pending(), variant: 'amber' };
	}
	return { label: m.pay_paid(), variant: 'green' };
}

/**
 * Canonical Review Eligibility Helper
 * - Digital: akses_diberikan or selesai
 * - Session: selesai
 * - Service: selesai (hasil_dikirim is NOT completed and NOT review eligible!)
 * Free claims and cancelled orders are never review eligible.
 */
export function canOrderBeReviewed(order: Order): boolean {
	if (!order || order.fulfillmentStatus === 'dibatalkan') return false;
	if (order.isFreeClaim || order.amount === 0) return false;
	if (order.paymentStatus !== 'lunas') return false;

	const canonicalType = normalizeProductType(order.productType);
	if (canonicalType === 'digital') {
		return order.fulfillmentStatus === 'akses_diberikan' || order.fulfillmentStatus === 'selesai';
	}
	if (canonicalType === 'session') {
		return order.fulfillmentStatus === 'selesai';
	}
	if (canonicalType === 'service') {
		return order.fulfillmentStatus === 'selesai';
	}
	return false;
}

/**
 * Checks if an order has a review submitted by the buyer.
 */
export function hasOrderReview(
	order: Order,
	reviews: { orderId?: string; id?: string }[] = []
): boolean {
	if (!order) return false;
	if (order.buyerReview) return true;
	return reviews.some((r) => r.orderId === order.id || (order.reviewId && r.id === order.reviewId));
}

/**
 * Checks if an order is active (in-progress / ongoing fulfillment).
 * Used for the "Aktif" view in Pesanan:
 * - Session: perlu_dijadwalkan, sudah_dijadwalkan (until selesai or dibatalkan)
 * - Service: menunggu_brief, sedang_dikerjakan, hasil_dikirim (until selesai or dibatalkan)
 * - Digital: false (automatically fulfilled, not active ongoing work)
 * - Excludes: completed (selesai / akses_diberikan) and dibatalkan
 */
export function isOrderActive(order: Order): boolean {
	if (!order || order.fulfillmentStatus === 'dibatalkan' || order.fulfillmentStatus === 'selesai') {
		return false;
	}
	if (order.paymentStatus !== 'lunas' && !order.isFreeClaim) {
		return false;
	}
	const canonicalType = normalizeProductType(order.productType);
	if (canonicalType === 'session') {
		return (
			order.fulfillmentStatus === 'perlu_dijadwalkan' ||
			order.fulfillmentStatus === 'sudah_dijadwalkan'
		);
	}
	if (canonicalType === 'service') {
		return (
			order.fulfillmentStatus === 'menunggu_brief' ||
			order.fulfillmentStatus === 'sedang_dikerjakan' ||
			order.fulfillmentStatus === 'hasil_dikirim'
		);
	}
	// Digital is automatically fulfilled (akses_diberikan) and not active ongoing work
	return false;
}

/**
 * Checks if Karja has delivered the session confirmation and Google Meet link to the buyer.
 * Handles both new session orders (with sessionConfirmationDeliveredAt) and legacy orders.
 */
export function isSessionConfirmationDelivered(order: Order, booking?: Booking | null): boolean {
	if (!order) return false;
	if (order.sessionConfirmationDeliveredAt) return true;
	// Legacy compatibility: If session is scheduled and meeting link or scheduled time exists,
	// Karja has already made the confirmation and link accessible to the buyer.
	if (
		order.fulfillmentStatus === 'sudah_dijadwalkan' &&
		(order.meetingLink || booking?.meetingUrl || order.bookingDateFormatted || order.scheduledDate)
	) {
		return true;
	}
	return false;
}

/**
 * Checks if an order needs immediate seller action to unblock fulfillment.
 * For Session:
 *   PRIORITY 1: perlu_dijadwalkan (needs scheduling)
 *   PRIORITY 2: sudah_dijadwalkan AND rescheduleNoticePending = true (needs notifying buyer of rescheduled time)
 *   PRIORITY 3: sudah_dijadwalkan AND session has ended (needs completion)
 *   NORMAL SCHEDULED: Karja system delivery is already complete -> false (no required seller action)
 *   SELESAI: false (feedback is optional, never an operational blocker)
 * For Service: menunggu_brief, sedang_dikerjakan
 * For Digital: none (auto fulfilled)
 */
export function needsSellerAction(
	order: Order,
	booking?: Booking | null,
	now?: Date | number
): boolean {
	if (!order || order.fulfillmentStatus === 'dibatalkan') return false;
	if (order.paymentStatus !== 'lunas' && !order.isFreeClaim) return false;

	const canonicalType = normalizeProductType(order.productType);

	if (canonicalType === 'session') {
		// Priority 1: Needs scheduling
		if (order.fulfillmentStatus === 'perlu_dijadwalkan') {
			return true;
		}
		if (order.fulfillmentStatus === 'sudah_dijadwalkan') {
			// Priority 2: Reschedule notice pending to buyer (seller rescheduled session)
			if (order.rescheduleNoticePending) {
				return true;
			}
			// Priority 3: Session end time has arrived/passed and needs to be marked completed
			if (hasSessionEnded(order, booking, now)) {
				return true;
			}
			// Normal scheduled session: Karja system delivery is already complete.
			// WhatsApp message is optional and does not block fulfillment.
			return false;
		}
		// Selesai -> false (no operational required action)
		return false;
	}

	if (canonicalType === 'service') {
		return (
			order.fulfillmentStatus === 'menunggu_brief' ||
			order.fulfillmentStatus === 'sedang_dikerjakan'
		);
	}

	return false;
}

/**
 * Checks if an order is pending fulfillment (not completed).
 */
export function isOrderPendingFulfillment(order: Order): boolean {
	if (!order || order.fulfillmentStatus === 'dibatalkan') return false;
	return !isOrderCompleted(order);
}

/**
 * Checks if a paid order is in escrow (pending balance) and not yet eligible for payout.
 */
export function isOrderPendingEscrow(order: Order): boolean {
	if (!order || order.fulfillmentStatus === 'dibatalkan') return false;
	if (order.isFreeClaim || order.amount === 0 || order.paymentStatus !== 'lunas') return false;
	return !isOrderCompleted(order);
}

/**
 * Derives actionable next step metadata for a given order.
 */
export function getOrderNextAction(
	order: Order,
	booking?: Booking | null,
	now?: Date | number,
	reviews?: { orderId?: string; id?: string }[]
): OrderActionDetails {
	const canonicalType = normalizeProductType(order.productType);
	const reviewExists = hasOrderReview(order, reviews);

	if (order.fulfillmentStatus === 'dibatalkan') {
		return {
			status: 'dibatalkan',
			badgeText: m.na_cancelled_badge(),
			badgeVariant: 'red',
			eyebrow: m.na_eyebrow_done(),
			title: m.na_cancelled_title(),
			description: order.cancellationReason
				? m.na_cancelled_reason({ reason: order.cancellationReason })
				: m.na_cancelled_desc(),
			actionType: 'none',
			isUrgent: false
		};
	}

	// 1. SESSION LIFECYCLE
	if (canonicalType === 'session') {
		// Priority 1: Perlu dijadwalkan
		if (order.fulfillmentStatus === 'perlu_dijadwalkan') {
			return {
				status: 'perlu_dijadwalkan',
				badgeText: m.na_sched_badge(),
				badgeVariant: 'amber',
				eyebrow: m.na_eyebrow_action(),
				title: m.na_sched_title(),
				description: m.na_sched_desc({ buyer: order.buyerName }),
				actionType: 'schedule',
				actionLabel: m.na_sched_action(),
				secondaryActionLabel: m.na_contact_buyer(),
				isUrgent: true,
				intent: 'general'
			};
		}

		if (order.fulfillmentStatus === 'sudah_dijadwalkan') {
			const scheduleText = order.bookingDateFormatted
				? `${order.bookingDateFormatted} (${order.bookingTimeFormatted || ''})`
				: order.scheduledDate || m.na_sched_confirmed();
			const ended = hasSessionEnded(order, booking, now);

			// Priority 2: Reschedule notice pending
			if (order.rescheduleNoticePending) {
				return {
					status: 'sudah_dijadwalkan',
					badgeText: m.na_resched_badge(),
					badgeVariant: 'amber',
					eyebrow: m.na_eyebrow_action(),
					title: m.na_resched_title(),
					description: m.na_resched_desc({ schedule: scheduleText, buyer: order.buyerName }),
					actionType: 'notify_reschedule',
					actionLabel: m.na_resched_action(),
					secondaryActionLabel: m.na_detail(),
					isUrgent: true,
					intent: 'reschedule_notice'
				};
			}

			// Priority 3: Session time has passed -> needs completion
			if (ended) {
				return {
					status: 'sudah_dijadwalkan',
					badgeText: m.na_ended_badge(),
					badgeVariant: 'amber',
					eyebrow: m.na_eyebrow_action(),
					title: m.na_ended_title({ buyer: order.buyerName }),
					description: m.na_ended_desc(),
					actionType: 'complete',
					actionLabel: m.na_mark_done(),
					secondaryActionLabel: m.na_noshow_secondary(),
					isUrgent: true
				};
			}

			// Normal scheduled session: System delivery complete, session ready
			return {
				status: 'sudah_dijadwalkan',
				badgeText: m.na_scheduled_badge(),
				badgeVariant: 'green',
				eyebrow: m.na_eyebrow_next(),
				title: m.na_scheduled_title({ buyer: order.buyerName }),
				description: m.na_scheduled_desc({ schedule: scheduleText }),
				actionType: 'join_meeting',
				actionLabel: m.na_open_meet(),
				secondaryActionLabel: m.na_detail(),
				isUrgent: false
			};
		}

		// Priority 6: Selesai
		if (order.fulfillmentStatus === 'selesai') {
			if (reviewExists) {
				return {
					status: 'selesai',
					badgeText: m.na_review_badge(),
					badgeVariant: 'green',
					eyebrow: m.na_eyebrow_done(),
					title: m.na_done_title_session({ buyer: order.buyerName }),
					description: m.na_review_desc(),
					actionType: 'review_received',
					isUrgent: false
				};
			}

			if (order.feedbackRequestedAt) {
				return {
					status: 'selesai',
					badgeText: m.na_req_badge(),
					badgeVariant: 'green',
					eyebrow: m.na_eyebrow_done(),
					title: m.na_done_title_session({ buyer: order.buyerName }),
					description: m.na_req_desc(),
					actionType: 'feedback_sent',
					isUrgent: false
				};
			}

			return {
				status: 'selesai',
				badgeText: m.na_done_badge(),
				badgeVariant: 'green',
				eyebrow: m.na_eyebrow_done(),
				title: m.na_done_title_session({ buyer: order.buyerName }),
				description: m.na_done_desc({ buyer: order.buyerName }),
				actionType: 'feedback',
				actionLabel: m.na_ask_review(),
				secondaryActionLabel: m.na_detail(),
				isUrgent: false,
				intent: 'feedback'
			};
		}
	}

	// 2. SERVICE LIFECYCLE
	if (canonicalType === 'service') {
		if (order.fulfillmentStatus === 'menunggu_brief') {
			const hasBrief = Boolean(order.buyerNotes && order.buyerNotes.trim().length > 0);
			return {
				status: 'menunggu_brief',
				badgeText: hasBrief ? m.na_brief_in_badge() : m.na_brief_wait_badge(),
				badgeVariant: hasBrief ? 'blue' : 'amber',
				eyebrow: m.na_eyebrow_action(),
				title: hasBrief ? m.na_brief_in_title() : m.na_brief_wait_title(),
				description: hasBrief
					? m.na_brief_in_desc({ buyer: order.buyerName })
					: m.na_brief_wait_desc({ buyer: order.buyerName }),
				actionType: 'start_working',
				actionLabel: m.na_start_action(),
				secondaryActionLabel: m.na_contact_buyer(),
				isUrgent: true,
				intent: 'general'
			};
		}

		if (order.fulfillmentStatus === 'sedang_dikerjakan') {
			return {
				status: 'sedang_dikerjakan',
				badgeText: m.na_working_badge(),
				badgeVariant: 'blue',
				eyebrow: m.na_eyebrow_action(),
				title: m.na_working_title(),
				description: m.na_working_desc(),
				actionType: 'deliver',
				actionLabel: m.na_deliver_action(),
				secondaryActionLabel: m.na_detail(),
				isUrgent: true
			};
		}

		if (order.fulfillmentStatus === 'hasil_dikirim') {
			return {
				status: 'hasil_dikirim',
				badgeText: m.na_delivered_badge(),
				badgeVariant: 'purple',
				eyebrow: m.na_eyebrow_running(),
				title: m.na_delivered_title(),
				description: m.na_delivered_desc(),
				actionType: 'complete',
				actionLabel: m.na_mark_done(),
				secondaryActionLabel: m.na_detail(),
				isUrgent: false
			};
		}

		if (order.fulfillmentStatus === 'selesai') {
			if (reviewExists) {
				return {
					status: 'selesai',
					badgeText: m.na_review_badge(),
					badgeVariant: 'green',
					eyebrow: m.na_eyebrow_done(),
					title: m.na_done_title_service({ buyer: order.buyerName }),
					description: m.na_review_desc(),
					actionType: 'review_received',
					isUrgent: false
				};
			}

			if (order.feedbackRequestedAt) {
				return {
					status: 'selesai',
					badgeText: m.na_req_badge(),
					badgeVariant: 'green',
					eyebrow: m.na_eyebrow_done(),
					title: m.na_done_title_service({ buyer: order.buyerName }),
					description: m.na_req_desc(),
					actionType: 'feedback_sent',
					isUrgent: false
				};
			}

			return {
				status: 'selesai',
				badgeText: m.na_done_badge(),
				badgeVariant: 'green',
				eyebrow: m.na_eyebrow_done(),
				title: m.na_done_title_service({ buyer: order.buyerName }),
				description: m.na_done_desc({ buyer: order.buyerName }),
				actionType: 'feedback',
				actionLabel: m.na_ask_review(),
				secondaryActionLabel: m.na_detail(),
				isUrgent: false,
				intent: 'feedback'
			};
		}
	}

	// 3. DIGITAL LIFECYCLE
	if (canonicalType === 'digital') {
		if (reviewExists) {
			return {
				status: order.fulfillmentStatus || 'akses_diberikan',
				badgeText: m.na_review_badge(),
				badgeVariant: 'green',
				eyebrow: m.na_eyebrow_done(),
				title: m.na_access_title(),
				description: m.na_review_desc(),
				actionType: 'review_received',
				isUrgent: false
			};
		}

		if (order.feedbackRequestedAt) {
			return {
				status: order.fulfillmentStatus || 'akses_diberikan',
				badgeText: m.na_req_badge(),
				badgeVariant: 'green',
				eyebrow: m.na_eyebrow_done(),
				title: m.na_access_title(),
				description: m.na_req_desc(),
				actionType: 'feedback_sent',
				isUrgent: false
			};
		}

		return {
			status: order.fulfillmentStatus || 'akses_diberikan',
			badgeText: m.na_access_badge(),
			badgeVariant: 'green',
			eyebrow: m.na_eyebrow_done(),
			title: m.na_access_title(),
			description: m.na_access_desc(),
			actionType: 'feedback',
			actionLabel: m.na_ask_review(),
			secondaryActionLabel: m.na_detail(),
			isUrgent: false,
			intent: 'feedback'
		};
	}

	// Fallback
	return {
		status: order.fulfillmentStatus,
		badgeText: order.fulfillmentStatus,
		badgeVariant: 'gray',
		eyebrow: m.na_eyebrow_next(),
		title: m.na_fallback_title(),
		description: m.na_fallback_desc(),
		actionType: 'view_detail',
		actionLabel: m.na_fallback_action(),
		isUrgent: false
	};
}

/**
 * Prioritizes orders for a single product to display in Product Detail's "Langkah Berikutnya" card.
 * Priority:
 * 1. Required operational actions
 * 2. Active upcoming order context (e.g. session ready, service ongoing)
 * 3. Optional follow-ups (completed order where feedback has not yet been requested)
 * 4. Completed order with feedback already sent / review received
 */
export function findHighestPriorityProductOrder(
	productOrders: Order[],
	bookings: Booking[] = [],
	reviews: { orderId?: string; id?: string }[] = []
): { order: Order | undefined; action: OrderActionDetails | null } {
	const nonCancelled = productOrders.filter((o) => o.fulfillmentStatus !== 'dibatalkan');
	if (nonCancelled.length === 0) {
		return { order: undefined, action: null };
	}

	// 1. Required operational action
	const urgentOrder = nonCancelled.find((o) =>
		needsSellerAction(o, findBookingForOrder(o, bookings))
	);
	if (urgentOrder) {
		const booking = findBookingForOrder(urgentOrder, bookings);
		return {
			order: urgentOrder,
			action: getOrderNextAction(urgentOrder, booking, undefined, reviews)
		};
	}

	// 2. Active upcoming order (e.g. Session ready, or Service in progress)
	const activeOrder = nonCancelled.find((o) => isOrderActive(o));
	if (activeOrder) {
		const booking = findBookingForOrder(activeOrder, bookings);
		return {
			order: activeOrder,
			action: getOrderNextAction(activeOrder, booking, undefined, reviews)
		};
	}

	// 3. Optional follow-up (completed order where feedback has not yet been requested and no review)
	const feedbackNeededOrder = nonCancelled.find(
		(o) => isOrderCompleted(o) && !o.feedbackRequestedAt && !hasOrderReview(o, reviews)
	);
	if (feedbackNeededOrder) {
		const booking = findBookingForOrder(feedbackNeededOrder, bookings);
		return {
			order: feedbackNeededOrder,
			action: getOrderNextAction(feedbackNeededOrder, booking, undefined, reviews)
		};
	}

	// 4. Most recently completed order
	const completedOrder = nonCancelled.find((o) => isOrderCompleted(o));
	if (completedOrder) {
		const booking = findBookingForOrder(completedOrder, bookings);
		return {
			order: completedOrder,
			action: getOrderNextAction(completedOrder, booking, undefined, reviews)
		};
	}

	const fallbackOrder = nonCancelled[0];
	const booking = findBookingForOrder(fallbackOrder, bookings);
	return {
		order: fallbackOrder,
		action: getOrderNextAction(fallbackOrder, booking, undefined, reviews)
	};
}

/**
 * Sorts orders for Product Detail compact list (up to ~3 items):
 * 1. Required-action orders
 * 2. Upcoming sessions (nearest first) / active services
 * 3. Recently completed orders
 */
export function sortOrdersForProductDetail(orders: Order[], bookings: Booking[] = []): Order[] {
	return [...orders].sort((a, b) => {
		const aUrgent = needsSellerAction(a, findBookingForOrder(a, bookings));
		const bUrgent = needsSellerAction(b, findBookingForOrder(b, bookings));
		if (aUrgent && !bUrgent) return -1;
		if (!aUrgent && bUrgent) return 1;

		const aActive = isOrderActive(a);
		const bActive = isOrderActive(b);
		if (aActive && !bActive) return -1;
		if (!aActive && bActive) return 1;

		// Upcoming sessions sorted by nearest date
		if (a.productType === 'session' && b.productType === 'session') {
			const aBooking = findBookingForOrder(a, bookings);
			const bBooking = findBookingForOrder(b, bookings);
			const aTime = aBooking?.startAt ? new Date(aBooking.startAt).getTime() : 0;
			const bTime = bBooking?.startAt ? new Date(bBooking.startAt).getTime() : 0;
			if (aTime && bTime) return aTime - bTime;
		}

		return 0;
	});
}

export type ProductMomentumState =
	| 'action_required'
	| 'active_order'
	| 'first_sale'
	| 'repeat_sales'
	| 'viewed'
	| 'no_signal'
	| 'draft';

export interface ProductNextStepInput {
	product: Product;
	productOrders: Order[];
	bookings?: Booking[];
	reviews?: { orderId?: string; id?: string }[];
	now?: Date | number;
}

export interface ProductNextStepResult {
	state: ProductMomentumState;
	title: string;
	description: string;
	completedSalesCount: number;
	urgentOrder?: Order;
	urgentNextAction?: OrderActionDetails | null;
	activeOrder?: Order;
	feedbackEligibleOrder?: Order;
	representativeCompletedOrder?: Order;
	feedbackStatus: 'none' | 'can_request' | 'requested' | 'reviewed';
}

/**
 * Counts real completed/fulfilled purchases for a product.
 * Respects product type:
 * - Digital: completed when akses_diberikan or selesai
 * - Session: completed only when selesai (sudah_dijadwalkan is active, not completed)
 * - Service: completed only when selesai (hasil_dikirim is active, not completed)
 * If productOrders has records, relies strictly on isOrderCompleted(order).
 * Falls back to product.sales only if productOrders has no records.
 */
export function getProductCompletedSalesCount(
	product: Product,
	productOrders: Order[] = []
): number {
	if (productOrders && productOrders.length > 0) {
		const nonCancelled = productOrders.filter((o) => o.fulfillmentStatus !== 'dibatalkan');
		return nonCancelled.filter((o) => isCompletedPaidSale(o)).length;
	}
	return product.sales || 0;
}

/**
 * Evaluates the next best action and product momentum state for Product Detail view.
 *
 * Strict Priority Order:
 * 1. ACTION_REQUIRED (operational required action outranks everything)
 * 2. ACTIVE_ORDER (upcoming session or ongoing service context outranks general milestone/momentum)
 * 3. DRAFT (if draft with no sales/orders)
 * 4. FIRST_SALE (milestone: exactly 1 completed sale)
 * 5. REPEAT_SALES (ongoing momentum: 2+ completed sales - avoids stale first-sale message)
 * 6. VIEWED (views > 0, 0 sales)
 * 7. NO_SIGNAL (0 views, 0 sales)
 */
export function getProductNextStepState({
	product,
	productOrders = [],
	bookings = [],
	reviews = [],
	now
}: ProductNextStepInput): ProductNextStepResult {
	const nonCancelled = productOrders.filter((o) => o.fulfillmentStatus !== 'dibatalkan');
	const completedOrders = nonCancelled.filter((o) => isCompletedPaidSale(o));
	const completedSalesCount = getProductCompletedSalesCount(product, productOrders);

	// Priority 1: Required operational action (Session: schedule, reschedule notice, finish; Service: brief, work, deliver)
	const urgentOrder = nonCancelled.find((o) =>
		needsSellerAction(o, findBookingForOrder(o, bookings), now)
	);
	if (urgentOrder) {
		const booking = findBookingForOrder(urgentOrder, bookings);
		const urgentNextAction = getOrderNextAction(urgentOrder, booking, now, reviews);
		return {
			state: 'action_required',
			title: urgentNextAction.title,
			description: urgentNextAction.description,
			completedSalesCount,
			urgentOrder,
			urgentNextAction,
			feedbackStatus: 'none'
		};
	}

	// Priority 2: Active upcoming order context (e.g. Session scheduled ready for call, or Service result sent awaiting confirmation)
	const activeOrder = nonCancelled.find((o) => isOrderActive(o));
	if (activeOrder) {
		let title = m.ns_active_title();
		let description = m.ns_active_desc();

		if (activeOrder.productType === 'session') {
			title = m.na_scheduled_title({ buyer: activeOrder.buyerName });
			const scheduleInfo =
				activeOrder.bookingDateFormatted || activeOrder.scheduledDate || m.ns_sched_confirmed();
			description = m.ns_session_desc({ schedule: scheduleInfo });
		} else if (activeOrder.productType === 'service') {
			if (activeOrder.fulfillmentStatus === 'hasil_dikirim') {
				title = m.ns_result_sent_title();
				description = m.ns_result_sent_desc({ buyer: activeOrder.buyerName });
			} else {
				title = m.ns_service_working_title();
				description = m.ns_service_working_desc({ buyer: activeOrder.buyerName });
			}
		}

		return {
			state: 'active_order',
			title,
			description,
			completedSalesCount,
			activeOrder,
			feedbackStatus: 'none'
		};
	}

	// Check draft status (when product is in draft mode and has no sales)
	if (product.status === 'draft' && completedSalesCount === 0) {
		return {
			state: 'draft',
			title: m.ns_draft_title(),
			description: m.ns_draft_desc(),
			completedSalesCount,
			feedbackStatus: 'none'
		};
	}

	// Check feedback eligibility across completed orders
	const feedbackEligibleOrder = completedOrders.find(
		(o) => canOrderBeReviewed(o) && !o.feedbackRequestedAt && !hasOrderReview(o, reviews)
	);
	const representativeCompletedOrder = completedOrders[0];
	let feedbackStatus: 'none' | 'can_request' | 'requested' | 'reviewed' = 'none';

	if (feedbackEligibleOrder) {
		feedbackStatus = 'can_request';
	} else if (representativeCompletedOrder) {
		if (hasOrderReview(representativeCompletedOrder, reviews)) {
			feedbackStatus = 'reviewed';
		} else if (representativeCompletedOrder.feedbackRequestedAt) {
			feedbackStatus = 'requested';
		}
	}

	// Priority 3: First sale milestone (EXACTLY 1 completed sale)
	if (completedSalesCount === 1) {
		return {
			state: 'first_sale',
			title: m.ns_first_title(),
			description: m.ns_first_desc(),
			completedSalesCount,
			feedbackEligibleOrder,
			representativeCompletedOrder,
			feedbackStatus
		};
	}

	// Priority 4: Repeat sales / Product momentum (2 or more completed sales)
	if (completedSalesCount >= 2) {
		let title = m.ns_repeat_title();
		if (completedSalesCount === 2) {
			title = m.ns_repeat_two();
		} else if (completedSalesCount >= 5) {
			title = m.ns_repeat_many();
		}

		const views = product.views || 0;
		let description = '';
		if (views > 0) {
			if (views <= 10) {
				description = m.ns_repeat_small({ sales: completedSalesCount, views });
			} else {
				description = m.ns_repeat_views({ sales: completedSalesCount, views });
			}
		} else {
			description = m.ns_repeat_noviews({ sales: completedSalesCount });
		}

		return {
			state: 'repeat_sales',
			title,
			description,
			completedSalesCount,
			feedbackEligibleOrder,
			representativeCompletedOrder,
			feedbackStatus
		};
	}

	// Priority 5: Viewed (views > 0, 0 sales)
	const views = product.views || 0;
	if (views > 0) {
		return {
			state: 'viewed',
			title: m.ns_viewed_title(),
			description: m.ns_viewed_desc(),
			completedSalesCount: 0,
			feedbackStatus: 'none'
		};
	}

	// Priority 6: No signal (0 views, 0 sales)
	return {
		state: 'no_signal',
		title: m.ns_live_title(),
		description: m.ns_live_desc(),
		completedSalesCount: 0,
		feedbackStatus: 'none'
	};
}

/**
 * Indonesian month mapping for date parsing
 */
const INDO_MONTH_MAP: Record<string, number> = {
	jan: 0,
	januari: 0,
	feb: 1,
	februari: 1,
	mar: 2,
	maret: 2,
	apr: 3,
	april: 3,
	mei: 4,
	may: 4,
	jun: 5,
	juni: 5,
	jul: 6,
	juli: 6,
	agu: 7,
	ags: 7,
	agustus: 7,
	aug: 7,
	sep: 8,
	sept: 8,
	september: 8,
	okt: 9,
	oktober: 9,
	oct: 9,
	nov: 10,
	november: 10,
	des: 11,
	desember: 11,
	dec: 11
};

/**
 * Robust date parser for ISO timestamps and Indonesian date strings.
 * e.g. "2026-09-07T14:00:00+07:00", "7 Sep 2026 14:00", "19 Agu 2026, 19:30 WIB", "Besok, 19.30 WIB"
 */
export function parseIndonesianOrIsoDate(
	dateStr?: string | null,
	timeFallback?: string | null
): number | null {
	if (!dateStr || typeof dateStr !== 'string') return null;

	// 1. Try standard ISO parse
	const direct = Date.parse(dateStr);
	if (!isNaN(direct) && direct > 0 && !dateStr.includes('WIB') && !dateStr.includes('wib')) {
		return direct;
	}

	const str = dateStr.trim();

	// Extract time: e.g. "14:00", "19.30", "19:30"
	let hours = 0;
	let minutes = 0;
	let hasTime = false;

	const timeMatch = str.match(/(\d{1,2})[:.](\d{2})/);
	if (timeMatch) {
		hours = parseInt(timeMatch[1], 10);
		minutes = parseInt(timeMatch[2], 10);
		hasTime = true;
	} else if (timeFallback) {
		const fallbackMatch = timeFallback.match(/(\d{1,2})[:.](\d{2})/);
		if (fallbackMatch) {
			hours = parseInt(fallbackMatch[1], 10);
			minutes = parseInt(fallbackMatch[2], 10);
			hasTime = true;
		}
	}

	// 2. Relative dates: "Hari ini", "Besok", "Kemarin"
	const lower = str.toLowerCase();
	if (lower.includes('hari ini') || lower.includes('besok') || lower.includes('kemarin')) {
		const d = new Date();
		if (lower.includes('besok')) {
			d.setDate(d.getDate() + 1);
		} else if (lower.includes('kemarin')) {
			d.setDate(d.getDate() - 1);
		}
		if (hasTime) {
			d.setHours(hours, minutes, 0, 0);
		}
		return d.getTime();
	}

	// 3. Match day, month name, year: e.g. "7 Sep 2026", "19 Agu 2026", "26 Agustus 2026"
	const dmyMatch = str.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
	if (dmyMatch) {
		const day = parseInt(dmyMatch[1], 10);
		const monthKey = dmyMatch[2].toLowerCase();
		const year = parseInt(dmyMatch[3], 10);
		const month = INDO_MONTH_MAP[monthKey];
		if (month !== undefined && !isNaN(day) && !isNaN(year)) {
			const pad = (n: number) => n.toString().padStart(2, '0');
			const iso = `${year}-${pad(month + 1)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:00+07:00`;
			const t = new Date(iso).getTime();
			if (!isNaN(t)) return t;
			return new Date(year, month, day, hours, minutes, 0, 0).getTime();
		}
	}

	// 4. Match ISO YYYY-MM-DD
	const ymdMatch = str.match(/(\d{4})-(\d{2})-(\d{2})/);
	if (ymdMatch) {
		const year = parseInt(ymdMatch[1], 10);
		const month = parseInt(ymdMatch[2], 10) - 1;
		const day = parseInt(ymdMatch[3], 10);
		const pad = (n: number) => n.toString().padStart(2, '0');
		const iso = `${year}-${pad(month + 1)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:00+07:00`;
		const t = new Date(iso).getTime();
		if (!isNaN(t)) return t;
		return new Date(year, month, day, hours, minutes, 0, 0).getTime();
	}

	// 5. Fallback Date.parse for other formats
	if (!isNaN(direct) && direct > 0) {
		return direct;
	}

	return null;
}

/**
 * Returns the canonical scheduled timestamp (epoch milliseconds) for a session order.
 * Prioritizes real ISO timestamps from the matched booking or order fields.
 */
export function getSessionScheduledTimestamp(
	order: Order,
	booking?: Booking | null
): number | null {
	if (!order) return null;

	// 1. Matched booking startAt (Canonical ISO timestamp / UTC / +07:00)
	if (booking?.startAt) {
		const t = new Date(booking.startAt).getTime();
		if (!isNaN(t) && t > 0) return t;
	}

	// 2. Direct real timestamp / datetime fields on order
	const candidateFields = [
		order.scheduledAt,
		order.bookingStart,
		order.sessionStart,
		order.startAt,
		(order as any).sessionDate
	];
	for (const field of candidateFields) {
		if (field) {
			if (typeof field === 'number' && !isNaN(field) && field > 0) return field;
			if (field instanceof Date && !isNaN(field.getTime())) return field.getTime();
			if (typeof field === 'string') {
				const parsed = parseIndonesianOrIsoDate(field);
				if (parsed !== null) return parsed;
			}
		}
	}

	// 3. Booking dateString + timeSlot
	if (booking?.dateString && booking?.timeSlot) {
		const cleanSlot = booking.timeSlot.replace('.', ':');
		const iso = `${booking.dateString}T${cleanSlot}:00+07:00`;
		const t = new Date(iso).getTime();
		if (!isNaN(t) && t > 0) return t;
	}

	// 4. Fallback: Parse order.bookingDateFormatted, order.scheduledDate, or booking.dateFormatted
	const dateStr = order.bookingDateFormatted || order.scheduledDate || booking?.dateFormatted;
	if (dateStr) {
		const parsed = parseIndonesianOrIsoDate(
			dateStr,
			order.bookingTimeFormatted || booking?.timeSlot || order.preferredTime
		);
		if (parsed !== null) return parsed;
	}

	return null;
}

/**
 * Comparator for Active Session Orders:
 * 1. Upcoming active sessions first, sorted nearest future datetime to furthest future datetime (ascending).
 * 2. Unscheduled active sessions (e.g. perlu_dijadwalkan without datetime) placed in middle/predictable place.
 * 3. Past-but-still-active sessions placed AFTER all upcoming sessions, sorted most recently passed first (descending).
 * 4. Deterministic tie-breaker: created_at (ascending) / orderNumber / id.
 */
export function compareActiveSessionOrders(
	a: Order,
	b: Order,
	bookings: Booking[] = [],
	now: Date | number = Date.now()
): number {
	const currentTime =
		now instanceof Date ? now.getTime() : typeof now === 'number' ? now : Date.now();

	const bookingA = findBookingForOrder(a, bookings);
	const bookingB = findBookingForOrder(b, bookings);

	const timeA = getSessionScheduledTimestamp(a, bookingA);
	const timeB = getSessionScheduledTimestamp(b, bookingB);

	// Group classification:
	// Group 1: Upcoming active sessions (time >= currentTime)
	// Group 2: Unscheduled active sessions (time === null)
	// Group 3: Past active sessions (time < currentTime)
	const getGroup = (time: number | null) => {
		if (time === null) return 2;
		if (time >= currentTime) return 1;
		return 3;
	};

	const groupA = getGroup(timeA);
	const groupB = getGroup(timeB);

	// Cross-group ordering: Group 1 < Group 2 < Group 3
	if (groupA !== groupB) {
		return groupA - groupB;
	}

	// Within Group 1 (Upcoming):
	// Nearest future session (smallest timestamp >= currentTime) comes first -> ascending
	if (groupA === 1 && timeA !== null && timeB !== null) {
		if (timeA !== timeB) {
			return timeA - timeB;
		}
	}

	// Within Group 3 (Past but still active):
	// Most recently passed session (largest timestamp < currentTime, closest to now) comes first -> descending
	if (groupA === 3 && timeA !== null && timeB !== null) {
		if (timeA !== timeB) {
			return timeB - timeA;
		}
	}

	// Deterministic tie-breaker: created_at ascending
	const parseCreated = (ord: Order) => {
		if (!ord.createdAt) return 0;
		const parsed = parseIndonesianOrIsoDate(ord.createdAt);
		return parsed !== null ? parsed : 0;
	};

	const createdA = parseCreated(a);
	const createdB = parseCreated(b);

	if (createdA !== 0 && createdB !== 0 && createdA !== createdB) {
		return createdA - createdB;
	}

	// Secondary tie-breaker: orderNumber / id
	const orderNumCompare = (a.orderNumber || '').localeCompare(b.orderNumber || '');
	if (orderNumCompare !== 0) return orderNumCompare;

	return (a.id || '').localeCompare(b.id || '');
}

/**
 * Sorts active session orders according to the canonical scheduling criteria.
 */
export function sortActiveSessionOrders(
	orders: Order[],
	bookings: Booking[] = [],
	now: Date | number = Date.now()
): Order[] {
	return [...orders].sort((a, b) => compareActiveSessionOrders(a, b, bookings, now));
}

export type SessionTimeGroup =
	'HARI INI' | 'BESOK' | 'MINGGU INI' | 'NANTI' | 'SEBELUMNYA' | 'BELUM DIJADWALKAN';

/**
 * Returns a human-friendly operational time bucket for a session order.
 */
export function getSessionTimeGroup(
	order: Order,
	booking?: Booking | null,
	now: Date | number = Date.now()
): SessionTimeGroup {
	if (order.fulfillmentStatus === 'perlu_dijadwalkan') {
		return 'BELUM DIJADWALKAN';
	}

	const timestamp = getSessionScheduledTimestamp(order, booking);
	if (!timestamp) {
		return 'BELUM DIJADWALKAN';
	}

	const currentTime = typeof now === 'number' ? now : now.getTime();

	// If session is before current time
	if (timestamp < currentTime) {
		return 'SEBELUMNYA';
	}

	// Calculate day difference in WIB (UTC+7)
	const MS_PER_DAY = 24 * 60 * 60 * 1000;
	const WIB_OFFSET = 7 * 60 * 60 * 1000;

	const orderDayNumber = Math.floor((timestamp + WIB_OFFSET) / MS_PER_DAY);
	const nowDayNumber = Math.floor((currentTime + WIB_OFFSET) / MS_PER_DAY);
	const diffDays = orderDayNumber - nowDayNumber;

	if (diffDays <= 0) {
		return 'HARI INI';
	}
	if (diffDays === 1) {
		return 'BESOK';
	}
	if (diffDays <= 7) {
		return 'MINGGU INI';
	}
	return 'NANTI';
}
