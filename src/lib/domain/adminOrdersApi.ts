import { buildPageQuery, unwrapPage, type Paged, type PageQuery } from './pagination';
import { api } from '$lib/api';
import { normalizeProductType } from '$lib/types';
import type { FulfillmentStatus, Order, PaymentStatus } from '$lib/types';
import { toApiFulfillmentStatus, type OrderCounts } from '$lib/domain/ordersApi';

/** Baris pesanan admin dari BE (camelCase Drizzle). */
export interface ApiAdminOrderRow {
	id: string;
	orderNumber?: string | null;
	buyerName?: string | null;
	buyerEmail?: string | null;
	productTitle?: string | null;
	productType?: string | null;
	amount?: number | string | null;
	netAmount?: number | string | null;
	paymentStatus?: string | null;
	fulfillmentStatus?: string | null;
	sellerName?: string | null;
	sellerUsername?: string | null;
	createdAt?: string | null;
}

const FULFILLMENT_STATUSES: readonly FulfillmentStatus[] = [
	'belum_dibayar',
	'akses_diberikan',
	'perlu_dijadwalkan',
	'sudah_dijadwalkan',
	'menunggu_brief',
	'sedang_dikerjakan',
	'hasil_dikirim',
	'selesai',
	'dibatalkan',
	'terjadwal'
];

function asNumber(value: unknown, fallback = 0): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function asPaymentStatus(value: unknown): PaymentStatus {
	if (value === 'lunas' || value === 'gratis' || value === 'menunggu_pembayaran') return value;
	return 'menunggu_pembayaran';
}

function asFulfillmentStatus(value: unknown): FulfillmentStatus {
	return FULFILLMENT_STATUSES.includes(value as FulfillmentStatus)
		? (value as FulfillmentStatus)
		: 'perlu_dijadwalkan';
}

/** BE row → FE `Order`. `sellerId` memakai konvensi `seller_<username>` agar cocok dengan seller. */
export function mapApiAdminOrder(row: ApiAdminOrderRow): Order {
	return {
		id: row.id,
		sellerId: row.sellerUsername ? `seller_${row.sellerUsername}` : undefined,
		orderNumber: row.orderNumber ?? '',
		buyerName: row.buyerName ?? '',
		buyerEmail: row.buyerEmail ?? '',
		buyerPhone: '',
		productId: '',
		productTitle: row.productTitle ?? '',
		productType: normalizeProductType(row.productType),
		amount: asNumber(row.amount),
		karjaFee: 0,
		paymentFee: 0,
		netAmount: asNumber(row.netAmount),
		paymentStatus: asPaymentStatus(row.paymentStatus),
		fulfillmentStatus: asFulfillmentStatus(row.fulfillmentStatus),
		createdAt: row.createdAt ?? ''
	};
}

/* ------------------------------- endpoints ------------------------------- */

export interface ApiAdminOrderStatusResult {
	id: string;
	fulfillmentStatus: string;
}

/** Semua pesanan platform (berhalaman + filter/sort). */
export async function listAdminOrders(params: PageQuery = {}): Promise<Paged<Order>> {
	const res = await api<
		{ items?: ApiAdminOrderRow[]; nextCursor?: string | null; total?: number } | ApiAdminOrderRow[]
	>(`/admin/orders${buildPageQuery(params)}`);
	const page = unwrapPage(res);
	return { ...page, items: page.items.map(mapApiAdminOrder) };
}

/** Jumlah pesanan platform per tab/tipe (seluruh pesanan, bukan per halaman). */
export async function getAdminOrderCounts(): Promise<OrderCounts> {
	return api<OrderCounts>('/admin/orders/counts');
}

/** Intervensi status pemenuhan pesanan; mengembalikan status terbaru dari BE. */
export async function setAdminOrderStatus(
	id: string,
	status: FulfillmentStatus
): Promise<ApiAdminOrderStatusResult> {
	return api<ApiAdminOrderStatusResult>(`/admin/orders/${encodeURIComponent(id)}/status`, {
		method: 'POST',
		body: { status: toApiFulfillmentStatus(status) }
	});
}
