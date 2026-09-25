import { api } from '$lib/api';

/* -------------------------------- requests ------------------------------- */

export interface CheckoutInput {
	username: string;
	slug: string;
	buyerName: string;
	buyerEmail: string;
	buyerPhone?: string;
	notes?: string;
}

export interface PaymentInstruction {
	label: string;
	value: string;
}

export interface CheckoutPayment {
	gateway: string;
	method: string;
	reference: string;
	instructions: PaymentInstruction[];
	expiresAt: string;
}

export type PublicOrderPaymentStatus =
	'menunggu_pembayaran' | 'lunas' | 'gratis' | 'gagal' | 'dibatalkan';

export interface PublicOrder {
	orderId: string;
	orderNumber: string;
	accessToken: string;
	productTitle: string;
	productType: string;
	buyerName: string;
	amount: number;
	paymentStatus: PublicOrderPaymentStatus;
	paymentGateway?: string;
	paymentMethod?: string;
	paymentReference?: string;
	paymentExpiresAt?: string;
	paidAt?: string;
	fulfillmentStatus: string;
	meetingLink?: string;
	deliveryNotes?: string;
	createdAt: string;
}

/** Order berbayar: hasil `POST /public/checkout` (masih menunggu pembayaran). */
export interface CheckoutPaidResult {
	orderId: string;
	accessToken: string;
	orderNumber: string;
	payment: CheckoutPayment;
}

/**
 * Produk gratis mengembalikan bentuk `PublicOrder` (sudah lunas/gratis),
 * sedangkan produk berbayar mengembalikan `CheckoutPaidResult`.
 */
export type CheckoutResult = CheckoutPaidResult | PublicOrder;

export function isPaidCheckout(result: CheckoutResult): result is CheckoutPaidResult {
	return 'payment' in result && Boolean(result.payment);
}

/* ------------------------------- endpoints ------------------------------- */

function encodeParam(value: string): string {
	return encodeURIComponent(value.trim());
}

/** Checkout publik: buat order + instruksi pembayaran (tanpa auth). */
export async function checkout(input: CheckoutInput): Promise<CheckoutResult> {
	return api<CheckoutResult>('/public/checkout', { method: 'POST', body: input });
}

/** Halaman akses pembeli via access token (tanpa auth). 404 kalau tidak ada. */
export async function getPublicOrder(accessToken: string): Promise<PublicOrder> {
	return api<PublicOrder>(`/public/orders/${encodeParam(accessToken)}`);
}

/**
 * Dev-only: tandai order sebagai lunas lewat jalur yang sama dengan webhook.
 * Dipakai tombol simulasi di CheckoutModal dan tidak boleh diaktifkan di production.
 */
export async function devMarkPaid(orderId: string, secret: string): Promise<PublicOrder> {
	return api<PublicOrder>(`/dev/orders/${encodeParam(orderId)}/mark-paid`, {
		method: 'POST',
		headers: { 'x-dev-secret': secret }
	});
}
