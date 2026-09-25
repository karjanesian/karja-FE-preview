import { buildPageQuery, unwrapPage, type Paged, type PageQuery } from './pagination';
import { api } from '$lib/api';
import type {
	Product,
	ProductModerationStatus,
	ProductStatus,
	ProductType,
	ProductVisibility
} from '$lib/types';

/** Baris produk admin dari BE (camelCase Drizzle). */
export interface ApiAdminProductRow {
	id: string;
	title?: string | null;
	slug?: string | null;
	type?: string | null;
	status?: string | null;
	visibility?: string | null;
	priceIdr?: number | string | null;
	moderationStatus?: string | null;
	moderationReason?: string | null;
	sellerName?: string | null;
	sellerUsername?: string | null;
	sales?: number | string | null;
	createdAt?: string | null;
}

/** Body `POST /admin/products/:id/moderation` (status yang dikenali BE). */
export type ApiAdminModerationStatus = 'none' | 'pending_review' | 'approved' | 'rejected';

function asNumber(value: unknown, fallback = 0): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function asProductType(value: unknown): ProductType {
	return value === 'session' || value === 'service' ? value : 'digital';
}

function asVisibility(value: unknown): ProductVisibility {
	return value === 'store' ? 'store' : 'link_only';
}

function asStatus(value: unknown): ProductStatus {
	if (value === 'active' || value === 'paused' || value === 'archived') return value;
	return 'draft';
}

/** BE moderation status → FE `ProductModerationStatus`. */
export function mapApiModerationStatus(value: unknown): ProductModerationStatus {
	switch (value) {
		case 'none':
			return 'not_required';
		case 'pending_review':
		case 'flagged':
			return 'pending_review';
		case 'approved':
			return 'approved';
		case 'rejected':
			return 'rejected';
		case 'suspended':
			return 'suspended';
		default:
			return 'not_required';
	}
}

/** FE `ProductModerationStatus` → status yang diterima BE (tanpa `suspended`). */
export function toApiModerationStatus(status: ProductModerationStatus): ApiAdminModerationStatus {
	switch (status) {
		case 'not_required':
			return 'none';
		case 'suspended':
			return 'rejected';
		case 'pending_review':
		case 'approved':
		case 'rejected':
			return status;
		default:
			return 'none';
	}
}

/** BE row → FE `Product`. `sellerId` memakai konvensi `seller_<username>` agar cocok dengan seller. */
export function mapApiAdminProduct(row: ApiAdminProductRow): Product {
	return {
		id: row.id,
		sellerId: row.sellerUsername ? `seller_${row.sellerUsername}` : undefined,
		title: row.title ?? '',
		slug: row.slug ?? '',
		type: asProductType(row.type),
		category: '',
		price: asNumber(row.priceIdr),
		priceMode: 'fixed',
		visibility: asVisibility(row.visibility),
		status: asStatus(row.status),
		images: [],
		targetAudience: '',
		problemSolved: '',
		whatYouGet: '',
		howItWorks: '',
		aboutCreator: '',
		faqs: [],
		moderationStatus: mapApiModerationStatus(row.moderationStatus),
		moderationReason: row.moderationReason ?? undefined,
		views: 0,
		sales: asNumber(row.sales),
		revenue: 0,
		buyClicks: 0,
		createdAt: row.createdAt ?? ''
	};
}

/* ------------------------------- endpoints ------------------------------- */

export interface ApiAdminModerationResult {
	id: string;
	moderationStatus: ApiAdminModerationStatus;
}

/** Semua produk platform (berhalaman + filter/sort). */
export async function listAdminProducts(params: PageQuery = {}): Promise<Paged<Product>> {
	const res = await api<
		| { items?: ApiAdminProductRow[]; nextCursor?: string | null; total?: number }
		| ApiAdminProductRow[]
	>(`/admin/products${buildPageQuery(params)}`);
	const page = unwrapPage(res);
	return { ...page, items: page.items.map(mapApiAdminProduct) };
}

/** Moderasi satu produk; mengembalikan status terbaru dari BE. */
export async function moderateAdminProduct(
	id: string,
	status: ProductModerationStatus,
	reason?: string
): Promise<ApiAdminModerationResult> {
	return api<ApiAdminModerationResult>(`/admin/products/${encodeURIComponent(id)}/moderation`, {
		method: 'POST',
		body: { status: toApiModerationStatus(status), reason }
	});
}
