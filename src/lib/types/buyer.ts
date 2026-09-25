/**
 * KARJA DERIVED BUYER MODEL
 * Grouped and derived from canonical Order, Review, and Dispute data.
 * No separate buyer authentication or account required.
 */

import { Order, Review } from '$lib/types';
import { Dispute } from './admin';

export interface DerivedBuyerSummary {
	buyerKey: string; // normalized email e.g. "budi.santoso@gmail.com"
	name: string;
	email: string;
	phone?: string;
	paidOrdersCount: number;
	completedOrdersCount: number;
	totalSpend: number;
	firstPurchaseAt: string; // ISO timestamp
	lastPurchaseAt: string; // ISO timestamp
	repeatBuyer: boolean;
	reviewCount: number;
	disputeCount: number;
	activeOrdersCount: number;
	orders: Order[];
	reviews: Review[];
	disputes: Dispute[];
}
