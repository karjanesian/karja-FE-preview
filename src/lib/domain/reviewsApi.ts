import { api } from '$lib/api';
import { buildPageQuery, unwrapPage, type Paged } from './pagination';
import type { Review } from '$lib/types';

/** Balasan seller pada ulasan dari BE (camelCase Drizzle). */
export interface ApiReviewReply {
	comment?: string | null;
	createdAt?: string | null;
}

/** Baris ulasan dari BE (camelCase Drizzle). */
export interface ApiReviewRow {
	id: string;
	orderId?: string | null;
	productId?: string | null;
	productTitle?: string | null;
	sellerId?: string | null;
	buyerName?: string | null;
	rating?: number | string | null;
	comment?: string | null;
	isVerifiedPurchase?: boolean | null;
	createdAt?: string | null;
	sellerReply?: ApiReviewReply | null;
}

/** Respons ulasan publik sebuah toko (bentuk lama, sebelum paginasi). */
export interface ApiPublicSellerReviews {
	seller: unknown;
	reviews: ApiReviewRow[];
}

function asNumber(value: unknown, fallback = 0): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function encodeParam(value: string): string {
	return encodeURIComponent(value.trim());
}

/** BE row → FE Review. API tidak punya `buyerAvatar` (biarkan undefined). */
export function mapApiReview(row: ApiReviewRow): Review {
	return {
		id: row.id,
		sellerId: row.sellerId ?? undefined,
		orderId: row.orderId ?? '',
		productId: row.productId ?? '',
		productTitle: row.productTitle ?? '',
		buyerName: row.buyerName ?? '',
		buyerAvatar: undefined,
		rating: asNumber(row.rating),
		comment: row.comment ?? '',
		isVerifiedPurchase: Boolean(row.isVerifiedPurchase),
		createdAt: row.createdAt ?? '',
		sellerReply: row.sellerReply
			? {
					comment: row.sellerReply.comment ?? '',
					createdAt: row.sellerReply.createdAt ?? ''
				}
			: undefined
	};
}

/* ------------------------------- endpoints ------------------------------- */

export interface ListSellerReviewsParams {
	limit?: number;
	cursor?: string | null;
	q?: string;
}

/** Ulasan seller (butuh sesi), terbaru lebih dulu; keyset + filter. */
export async function listSellerReviews(
	params: ListSellerReviewsParams = {}
): Promise<Paged<Review>> {
	const res = await api<
		{ items?: ApiReviewRow[]; nextCursor?: string | null; total?: number } | ApiReviewRow[]
	>(`/seller/reviews${buildPageQuery(params)}`);
	const page = unwrapPage(res);
	return { ...page, items: page.items.map(mapApiReview) };
}

/** Kirim balasan seller untuk sebuah ulasan; mengembalikan ulasan terbaru. */
export async function replyToReview(id: string, comment: string): Promise<Review> {
	return mapApiReview(
		await api<ApiReviewRow>(`/seller/reviews/${encodeParam(id)}/reply`, {
			method: 'POST',
			body: { comment }
		})
	);
}

export interface ListPublicSellerReviewsParams {
	limit?: number;
	cursor?: string | null;
}

/** Ulasan publik sebuah toko (tanpa auth), berhalaman. */
export async function getPublicSellerReviews(
	username: string,
	params: ListPublicSellerReviewsParams = {}
): Promise<Paged<Review>> {
	const res = await api<
		| {
				items?: ApiReviewRow[];
				reviews?: ApiReviewRow[];
				nextCursor?: string | null;
				total?: number;
		  }
		| ApiReviewRow[]
	>(`/public/sellers/${encodeParam(username)}/reviews${buildPageQuery(params)}`);
	if (Array.isArray(res)) {
		const items = res.map(mapApiReview);
		return { items, nextCursor: null, total: items.length };
	}
	const page = unwrapPage<ApiReviewRow>({
		items: res?.items ?? res?.reviews ?? [],
		nextCursor: res?.nextCursor ?? null,
		total: res?.total
	});
	return { ...page, items: page.items.map(mapApiReview) };
}
