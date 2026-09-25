import { api } from '$lib/api';
import { buildPageQuery, unwrapPage, type Paged } from './pagination';
import { normalizeProductType } from '$lib/types';
import type { FulfillmentStatus, Order, PaymentStatus } from '$lib/types';

/** Status pemenuhan yang dikenali BE (FE `'terjadwal'` dipetakan ke `'sudah_dijadwalkan'`). */
export type ApiFulfillmentStatus = Exclude<FulfillmentStatus, 'terjadwal'>;

/** Baris pesanan dari BE (camelCase Drizzle). */
export interface ApiOrderRow {
	id: string;
	orderNumber?: string | null;
	sellerId?: string | null;
	buyerName?: string | null;
	buyerEmail?: string | null;
	buyerPhone?: string | null;
	productId?: string | null;
	productTitle?: string | null;
	productType?: string | null;
	amount?: number | string | null;
	karjaFee?: number | string | null;
	paymentFee?: number | string | null;
	netAmount?: number | string | null;
	isFreeClaim?: boolean | null;
	paymentStatus?: string | null;
	paymentMethod?: string | null;
	providerReference?: string | null;
	paymentIntentId?: string | null;
	fulfillmentStatus?: string | null;
	accessToken?: string | null;
	meetingLink?: string | null;
	scheduledAt?: string | null;
	deliveryNotes?: string | null;
	rescheduleNoticePending?: boolean | null;
	feedbackRequestedAt?: string | null;
	cancelledBy?: string | null;
	cancellationReason?: string | null;
	noShowParty?: string | null;
	buyerNotes?: string | null;
	createdAt?: string | null;
}

/** Body PATCH /seller/orders/:id/fulfillment (hanya field yang dikenali BE). */
export interface ApiOrderFulfillmentDto {
	fulfillmentStatus?: ApiFulfillmentStatus;
	scheduledAt?: string;
	meetingLink?: string;
	deliveryNotes?: string;
	cancelledBy?: 'seller' | 'buyer';
	cancellationReason?: string;
	noShowParty?: 'seller' | 'buyer';
	rescheduleNoticePending?: boolean;
	feedbackRequestedAt?: string;
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

/** Nilai BE diteruskan apa adanya; `'terjadwal'` hanya ada di FE, bukan dari BE. */
function asFulfillmentStatus(value: unknown): FulfillmentStatus {
	return FULFILLMENT_STATUSES.includes(value as FulfillmentStatus)
		? (value as FulfillmentStatus)
		: 'perlu_dijadwalkan';
}

function asParty(value: unknown): 'seller' | 'buyer' | undefined {
	return value === 'seller' || value === 'buyer' ? value : undefined;
}

function formatScheduledDate(iso?: string | null): string | undefined {
	if (!iso) return undefined;
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return undefined;
	return date.toLocaleString('id-ID', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		timeZone: 'Asia/Jakarta'
	});
}

/** FE status → status yang diterima BE (`'terjadwal'` → `'sudah_dijadwalkan'`). */
export function toApiFulfillmentStatus(status: FulfillmentStatus): ApiFulfillmentStatus {
	return status === 'terjadwal' ? 'sudah_dijadwalkan' : status;
}

/** BE row → FE Order. Field rupiah dipetakan 1:1 (sudah dalam rupiah). */
export function mapApiOrder(row: ApiOrderRow): Order {
	return {
		id: row.id,
		sellerId: row.sellerId ?? undefined,
		orderNumber: row.orderNumber ?? '',
		buyerName: row.buyerName ?? '',
		buyerEmail: row.buyerEmail ?? '',
		buyerPhone: row.buyerPhone ?? '',
		productId: row.productId ?? '',
		productTitle: row.productTitle ?? '',
		productType: normalizeProductType(row.productType),
		amount: asNumber(row.amount),
		karjaFee: asNumber(row.karjaFee),
		paymentFee: asNumber(row.paymentFee),
		netAmount: asNumber(row.netAmount),
		paymentStatus: asPaymentStatus(row.paymentStatus),
		paymentMethod: row.paymentMethod ?? undefined,
		paymentIntentId: row.paymentIntentId ?? undefined,
		providerReference: row.providerReference ?? undefined,
		fulfillmentStatus: asFulfillmentStatus(row.fulfillmentStatus),
		accessToken: row.accessToken ?? undefined,
		meetingLink: row.meetingLink ?? undefined,
		scheduledAt: row.scheduledAt ?? undefined,
		scheduledDate: formatScheduledDate(row.scheduledAt),
		deliveryNotes: row.deliveryNotes ?? undefined,
		rescheduleNoticePending: row.rescheduleNoticePending ?? undefined,
		feedbackRequestedAt: row.feedbackRequestedAt ?? undefined,
		cancelledBy: asParty(row.cancelledBy),
		cancellationReason: row.cancellationReason ?? undefined,
		noShowParty: asParty(row.noShowParty),
		buyerNotes: row.buyerNotes ?? undefined,
		isFreeClaim: Boolean(row.isFreeClaim),
		createdAt: row.createdAt ?? ''
	};
}

/* ------------------------------- endpoints ------------------------------- */

/** Jumlah pesanan per pengelompokan tab (badge), dihitung di BE. */
export interface OrderCounts {
	all: number;
	actionRequired: number;
	active: number;
	completed: number;
	digital: number;
	session: number;
	service: number;
}

/** Jumlah pesanan seller per tab/tipe (seluruh pesanan, bukan per halaman). */
export async function getSellerOrderCounts(): Promise<OrderCounts> {
	return api<OrderCounts>('/seller/orders/counts');
}

export interface ListSellerOrdersParams {
	limit?: number;
	cursor?: string | null;
	q?: string;
	state?: string;
	type?: string;
	fulfillmentStatus?: string;
	sortBy?: string;
	sortDir?: 'asc' | 'desc';
}

/** Semua pesanan seller (butuh sesi), terbaru lebih dulu; keyset + filter. */
export async function listSellerOrders(params: ListSellerOrdersParams = {}): Promise<Paged<Order>> {
	const res = await api<
		{ items?: ApiOrderRow[]; nextCursor?: string | null; total?: number } | ApiOrderRow[]
	>(`/seller/orders${buildPageQuery(params)}`);
	const page = unwrapPage(res);
	return { ...page, items: page.items.map(mapApiOrder) };
}

/** Detail satu pesanan seller. */
export async function getSellerOrder(id: string): Promise<Order> {
	return mapApiOrder(await api<ApiOrderRow>(`/seller/orders/${encodeURIComponent(id)}`));
}

/** Perbarui status pemenuhan pesanan; mengembalikan pesanan terbaru. */
export async function updateOrderFulfillment(
	id: string,
	dto: ApiOrderFulfillmentDto
): Promise<Order> {
	return mapApiOrder(
		await api<ApiOrderRow>(`/seller/orders/${encodeURIComponent(id)}/fulfillment`, {
			method: 'PATCH',
			body: dto
		})
	);
}
