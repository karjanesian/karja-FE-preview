/**
 * KARJA BUYER DOMAIN & AGGREGATION LOGIC
 * Derives buyer profiles dynamically from Orders, Reviews, and Disputes.
 * Normalizes email identifiers to group repeat purchasers consistently.
 */

import { Order, Review } from '$lib/types';
import { Dispute } from '$lib/types/admin';
import { DerivedBuyerSummary } from '$lib/types/buyer';
import { isPaidSale, isOrderCompleted, isOrderActive } from './orderLifecycle';

/**
 * Normalizes email address for consistent buyer grouping.
 * Strips leading/trailing whitespace and lowercases string.
 */
export function normalizeBuyerEmail(email?: string): string {
	if (!email || typeof email !== 'string') return '';
	return email.trim().toLowerCase();
}

/**
 * Derives unique buyer summaries from platform orders.
 */
export function deriveBuyersFromOrders(
	orders: Order[] = [],
	reviews: Review[] = [],
	disputes: Dispute[] = []
): DerivedBuyerSummary[] {
	const buyerMap = new Map<
		string,
		{
			buyerKey: string;
			names: string[];
			emails: string[];
			phones: string[];
			orders: Order[];
		}
	>();

	for (const order of orders) {
		const key = normalizeBuyerEmail(order.buyerEmail);
		if (!key) continue;

		if (!buyerMap.has(key)) {
			buyerMap.set(key, {
				buyerKey: key,
				names: [],
				emails: [],
				phones: [],
				orders: []
			});
		}

		const group = buyerMap.get(key)!;
		group.orders.push(order);
		if (order.buyerName && !group.names.includes(order.buyerName.trim())) {
			group.names.push(order.buyerName.trim());
		}
		if (order.buyerEmail && !group.emails.includes(order.buyerEmail.trim())) {
			group.emails.push(order.buyerEmail.trim());
		}
		if (order.buyerPhone && !group.phones.includes(order.buyerPhone.trim())) {
			group.phones.push(order.buyerPhone.trim());
		}
	}

	const summaries: DerivedBuyerSummary[] = [];

	for (const [key, group] of buyerMap.entries()) {
		const buyerOrders = group.orders.sort((a, b) => {
			const timeA = new Date(a.createdAt || 0).getTime();
			const timeB = new Date(b.createdAt || 0).getTime();
			return timeB - timeA; // newest first
		});

		const paidOrders = buyerOrders.filter((o) => isPaidSale(o));
		const completedOrders = buyerOrders.filter((o) => isOrderCompleted(o) && isPaidSale(o));
		const activeOrders = buyerOrders.filter((o) => isOrderActive(o));
		const totalSpend = paidOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

		const firstOrder = buyerOrders[buyerOrders.length - 1];
		const lastOrder = buyerOrders[0];

		// Find linked reviews and disputes
		const buyerOrderIds = new Set(buyerOrders.map((o) => o.id));
		const matchedReviews = reviews.filter(
			(r) =>
				buyerOrderIds.has(r.orderId) ||
				(r.buyerName && group.names.some((n) => n.toLowerCase() === r.buyerName.toLowerCase()))
		);

		const matchedDisputes = disputes.filter(
			(d) => buyerOrderIds.has(d.orderId) || normalizeBuyerEmail(d.buyerEmail) === key
		);

		const repeatBuyer = paidOrders.length >= 2;

		summaries.push({
			buyerKey: key,
			name: group.names[0] || 'Pembeli Guest',
			email: group.emails[0] || key,
			phone: group.phones[0] || undefined,
			paidOrdersCount: paidOrders.length,
			completedOrdersCount: completedOrders.length,
			totalSpend,
			firstPurchaseAt: firstOrder?.createdAt || new Date().toISOString(),
			lastPurchaseAt: lastOrder?.createdAt || new Date().toISOString(),
			repeatBuyer,
			reviewCount: matchedReviews.length,
			disputeCount: matchedDisputes.length,
			activeOrdersCount: activeOrders.length,
			orders: buyerOrders,
			reviews: matchedReviews,
			disputes: matchedDisputes
		});
	}

	// Sort by last purchase date descending
	return summaries.sort((a, b) => {
		return new Date(b.lastPurchaseAt).getTime() - new Date(a.lastPurchaseAt).getTime();
	});
}

/**
 * Computes high-level buyer metrics for overview and analytics.
 */
export function computeBuyerAnalytics(buyers: DerivedBuyerSummary[]) {
	const totalUniqueBuyers = buyers.length;
	const repeatBuyers = buyers.filter((b) => b.repeatBuyer);
	const repeatBuyersCount = repeatBuyers.length;
	const repeatPurchaseRate =
		totalUniqueBuyers > 0 ? Math.round((repeatBuyersCount / totalUniqueBuyers) * 100) : 0;

	const totalGrossSpend = buyers.reduce((sum, b) => sum + b.totalSpend, 0);
	const averageSpendPerBuyer =
		totalUniqueBuyers > 0 ? Math.round(totalGrossSpend / totalUniqueBuyers) : 0;

	return {
		totalUniqueBuyers,
		repeatBuyersCount,
		repeatPurchaseRate,
		totalGrossSpend,
		averageSpendPerBuyer
	};
}
