/**
 * KARJA MOCK JOURNEY EVENTS DATASET
 * Rich, relationally coherent event history across all 9 seller lifecycle stages
 * and the complete buyer conversion funnel.
 */

import { JourneyEvent } from '$lib/types/journeyEvents';

export const MOCK_JOURNEY_EVENTS: JourneyEvent[] = [
	// --- Seller 1: Rian Ardianto (seller_rian) -> Repeat Seller ---
	{
		id: 'evt-s1-01',
		type: 'seller.signup',
		actorType: 'seller',
		sellerId: 'seller_rian',
		occurredAt: '2026-08-01T08:30:00Z',
		metadata: { username: 'rianardianto', email: 'rian@example.com' }
	},
	{
		id: 'evt-s1-02',
		type: 'seller.store_ready',
		actorType: 'seller',
		sellerId: 'seller_rian',
		occurredAt: '2026-08-01T08:45:00Z',
		metadata: { storeName: 'Rian Ardianto', handle: 'rianardianto' }
	},
	{
		id: 'evt-s1-03',
		type: 'product.created',
		actorType: 'seller',
		sellerId: 'seller_rian',
		productId: 'prod-001',
		occurredAt: '2026-08-01T09:00:00Z',
		metadata: { title: 'Template Notion Pelacak Keuangan Freelance', type: 'digital' }
	},
	{
		id: 'evt-s1-04',
		type: 'product.published',
		actorType: 'seller',
		sellerId: 'seller_rian',
		productId: 'prod-001',
		occurredAt: '2026-08-01T09:15:00Z',
		metadata: { price: 49000 }
	},
	{
		id: 'evt-s1-05',
		type: 'product.shared',
		actorType: 'seller',
		sellerId: 'seller_rian',
		productId: 'prod-001',
		occurredAt: '2026-08-01T10:00:00Z',
		metadata: { channel: 'whatsapp' }
	},
	{
		id: 'evt-s1-06',
		type: 'store.viewed',
		actorType: 'visitor',
		sellerId: 'seller_rian',
		occurredAt: '2026-08-01T10:15:00Z',
		metadata: { referrer: 'whatsapp' }
	},
	{
		id: 'evt-s1-07',
		type: 'product.viewed',
		actorType: 'visitor',
		sellerId: 'seller_rian',
		productId: 'prod-001',
		occurredAt: '2026-08-01T10:18:00Z'
	},
	{
		id: 'evt-s1-08',
		type: 'product.buy_clicked',
		actorType: 'buyer',
		sellerId: 'seller_rian',
		productId: 'prod-001',
		buyerKey: 'budi.santoso@gmail.com',
		occurredAt: '2026-08-01T10:25:00Z'
	},
	{
		id: 'evt-s1-09',
		type: 'checkout.started',
		actorType: 'buyer',
		sellerId: 'seller_rian',
		productId: 'prod-001',
		buyerKey: 'budi.santoso@gmail.com',
		buyerEmail: 'budi.santoso@gmail.com',
		occurredAt: '2026-08-01T10:26:00Z'
	},
	{
		id: 'evt-s1-10',
		type: 'payment.paid',
		actorType: 'system',
		sellerId: 'seller_rian',
		productId: 'prod-001',
		orderId: 'ord-001',
		buyerKey: 'budi.santoso@gmail.com',
		buyerEmail: 'budi.santoso@gmail.com',
		occurredAt: '2026-08-01T10:28:00Z',
		metadata: { amount: 49000, paymentMethod: 'qris' }
	},
	{
		id: 'evt-s1-11',
		type: 'buyer.access_opened',
		actorType: 'buyer',
		sellerId: 'seller_rian',
		productId: 'prod-001',
		orderId: 'ord-001',
		buyerKey: 'budi.santoso@gmail.com',
		occurredAt: '2026-08-01T10:30:00Z'
	},
	{
		id: 'evt-s1-12',
		type: 'order.completed',
		actorType: 'system',
		sellerId: 'seller_rian',
		productId: 'prod-001',
		orderId: 'ord-001',
		occurredAt: '2026-08-01T10:30:00Z'
	},
	{
		id: 'evt-s1-13',
		type: 'review.submitted',
		actorType: 'buyer',
		sellerId: 'seller_rian',
		productId: 'prod-001',
		orderId: 'ord-001',
		buyerKey: 'budi.santoso@gmail.com',
		occurredAt: '2026-08-02T14:20:00Z',
		metadata: { rating: 5, comment: 'Sangat rapi dan gampang dipahami!' }
	},
	// Second sale for Rian
	{
		id: 'evt-s1-14',
		type: 'payment.paid',
		actorType: 'system',
		sellerId: 'seller_rian',
		productId: 'prod-002',
		orderId: 'ord-002',
		buyerKey: 'siti.aminah@gmail.com',
		buyerEmail: 'siti.aminah@gmail.com',
		occurredAt: '2026-08-05T11:00:00Z',
		metadata: { amount: 150000 }
	},
	{
		id: 'evt-s1-15',
		type: 'order.completed',
		actorType: 'seller',
		sellerId: 'seller_rian',
		productId: 'prod-002',
		orderId: 'ord-002',
		occurredAt: '2026-08-06T15:00:00Z'
	},
	{
		id: 'evt-s1-16',
		type: 'payout.requested',
		actorType: 'seller',
		sellerId: 'seller_rian',
		occurredAt: '2026-08-10T09:00:00Z',
		metadata: { amount: 180000, bankName: 'BCA' }
	},
	{
		id: 'evt-s1-17',
		type: 'payout.paid',
		actorType: 'admin',
		sellerId: 'seller_rian',
		occurredAt: '2026-08-10T14:30:00Z',
		metadata: { amount: 180000, referenceNumber: 'TRX-PO-88192' }
	},

	// --- Seller 2: Siti Rahma (seller_siti) -> first_sale_needs_action ---
	{
		id: 'evt-s2-01',
		type: 'seller.signup',
		actorType: 'seller',
		sellerId: 'seller_siti',
		occurredAt: '2026-08-15T10:00:00Z'
	},
	{
		id: 'evt-s2-02',
		type: 'seller.store_ready',
		actorType: 'seller',
		sellerId: 'seller_siti',
		occurredAt: '2026-08-15T10:20:00Z'
	},
	{
		id: 'evt-s2-03',
		type: 'product.created',
		actorType: 'seller',
		sellerId: 'seller_siti',
		productId: 'prod-003',
		occurredAt: '2026-08-15T11:00:00Z'
	},
	{
		id: 'evt-s2-04',
		type: 'product.published',
		actorType: 'seller',
		sellerId: 'seller_siti',
		productId: 'prod-003',
		occurredAt: '2026-08-15T11:10:00Z'
	},
	{
		id: 'evt-s2-05',
		type: 'product.shared',
		actorType: 'seller',
		sellerId: 'seller_siti',
		productId: 'prod-003',
		occurredAt: '2026-08-15T12:00:00Z'
	},
	{
		id: 'evt-s2-06',
		type: 'payment.paid',
		actorType: 'system',
		sellerId: 'seller_siti',
		productId: 'prod-003',
		orderId: 'ord-003',
		buyerKey: 'dimas.prasetyo@gmail.com',
		buyerEmail: 'dimas.prasetyo@gmail.com',
		occurredAt: '2026-08-16T09:00:00Z',
		metadata: { amount: 99000 }
	},

	// --- Seller 3: Budi Utomo (seller_budi) -> first_views_no_sale ---
	{
		id: 'evt-s3-01',
		type: 'seller.signup',
		actorType: 'seller',
		sellerId: 'seller_budi',
		occurredAt: '2026-08-20T08:00:00Z'
	},
	{
		id: 'evt-s3-02',
		type: 'seller.store_ready',
		actorType: 'seller',
		sellerId: 'seller_budi',
		occurredAt: '2026-08-20T08:15:00Z'
	},
	{
		id: 'evt-s3-03',
		type: 'product.created',
		actorType: 'seller',
		sellerId: 'seller_budi',
		productId: 'prod-004',
		occurredAt: '2026-08-20T09:00:00Z'
	},
	{
		id: 'evt-s3-04',
		type: 'product.published',
		actorType: 'seller',
		sellerId: 'seller_budi',
		productId: 'prod-004',
		occurredAt: '2026-08-20T09:30:00Z'
	},
	{
		id: 'evt-s3-05',
		type: 'product.shared',
		actorType: 'seller',
		sellerId: 'seller_budi',
		productId: 'prod-004',
		occurredAt: '2026-08-20T10:00:00Z'
	},
	{
		id: 'evt-s3-06',
		type: 'product.viewed',
		actorType: 'visitor',
		sellerId: 'seller_budi',
		productId: 'prod-004',
		occurredAt: '2026-08-20T11:00:00Z'
	},
	{
		id: 'evt-s3-07',
		type: 'product.buy_clicked',
		actorType: 'buyer',
		sellerId: 'seller_budi',
		productId: 'prod-004',
		buyerKey: 'hendra.wijaya@gmail.com',
		occurredAt: '2026-08-21T14:00:00Z'
	},

	// --- Seller 4: Dewi Lestari (seller_dewi) -> product_published_not_shared ---
	{
		id: 'evt-s4-01',
		type: 'seller.signup',
		actorType: 'seller',
		sellerId: 'seller_dewi',
		occurredAt: '2026-08-25T07:00:00Z'
	},
	{
		id: 'evt-s4-02',
		type: 'seller.store_ready',
		actorType: 'seller',
		sellerId: 'seller_dewi',
		occurredAt: '2026-08-25T07:20:00Z'
	},
	{
		id: 'evt-s4-03',
		type: 'product.created',
		actorType: 'seller',
		sellerId: 'seller_dewi',
		productId: 'prod-005',
		occurredAt: '2026-08-25T08:00:00Z'
	},
	{
		id: 'evt-s4-04',
		type: 'product.published',
		actorType: 'seller',
		sellerId: 'seller_dewi',
		productId: 'prod-005',
		occurredAt: '2026-08-25T08:15:00Z'
	},

	// --- Seller 5: Eko Prasetyo (seller_eko) -> product_draft ---
	{
		id: 'evt-s5-01',
		type: 'seller.signup',
		actorType: 'seller',
		sellerId: 'seller_eko',
		occurredAt: '2026-08-28T14:00:00Z'
	},
	{
		id: 'evt-s5-02',
		type: 'seller.store_ready',
		actorType: 'seller',
		sellerId: 'seller_eko',
		occurredAt: '2026-08-28T14:30:00Z'
	},
	{
		id: 'evt-s5-03',
		type: 'product.created',
		actorType: 'seller',
		sellerId: 'seller_eko',
		productId: 'prod-006',
		occurredAt: '2026-08-28T15:00:00Z',
		metadata: { status: 'draft' }
	},

	// --- Seller 6: Maya Indah (seller_maya) -> no_product ---
	{
		id: 'evt-s6-01',
		type: 'seller.signup',
		actorType: 'seller',
		sellerId: 'seller_maya',
		occurredAt: '2026-09-01T10:00:00Z'
	},
	{
		id: 'evt-s6-02',
		type: 'seller.store_ready',
		actorType: 'seller',
		sellerId: 'seller_maya',
		occurredAt: '2026-09-01T10:15:00Z'
	},

	// --- Additional General Funnel Events ---
	// More views and buy clicks for funnel volume
	{
		id: 'evt-gen-01',
		type: 'product.viewed',
		actorType: 'visitor',
		sellerId: 'seller_rian',
		productId: 'prod-001',
		occurredAt: '2026-09-02T11:00:00Z'
	},
	{
		id: 'evt-gen-02',
		type: 'product.viewed',
		actorType: 'visitor',
		sellerId: 'seller_rian',
		productId: 'prod-001',
		occurredAt: '2026-09-03T15:00:00Z'
	},
	{
		id: 'evt-gen-03',
		type: 'product.buy_clicked',
		actorType: 'buyer',
		sellerId: 'seller_rian',
		productId: 'prod-001',
		buyerKey: 'budi.santoso@gmail.com',
		occurredAt: '2026-09-04T09:00:00Z'
	},
	{
		id: 'evt-gen-04',
		type: 'checkout.started',
		actorType: 'buyer',
		sellerId: 'seller_rian',
		productId: 'prod-001',
		buyerKey: 'budi.santoso@gmail.com',
		buyerEmail: 'budi.santoso@gmail.com',
		occurredAt: '2026-09-04T09:02:00Z'
	},
	{
		id: 'evt-gen-05',
		type: 'payment.paid',
		actorType: 'system',
		sellerId: 'seller_rian',
		productId: 'prod-001',
		orderId: 'ord-004',
		buyerKey: 'budi.santoso@gmail.com',
		buyerEmail: 'budi.santoso@gmail.com',
		occurredAt: '2026-09-04T09:05:00Z',
		metadata: { amount: 49000 }
	},
	{
		id: 'evt-gen-06',
		type: 'buyer.access_opened',
		actorType: 'buyer',
		sellerId: 'seller_rian',
		productId: 'prod-001',
		orderId: 'ord-004',
		buyerKey: 'budi.santoso@gmail.com',
		occurredAt: '2026-09-04T09:06:00Z'
	}
];
