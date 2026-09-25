import { api } from '$lib/api';
import { freshSellerProfile } from '$lib/data/mockData';
import { mapApiProduct, type ApiProductRow } from '$lib/domain/productsApi';
import { mapApiSellerProfile, type ApiSellerProfile } from '$lib/domain/sellerProfileApi';
import { buildPageQuery, unwrapPage, type Paged } from '$lib/domain/pagination';
import type { Product, SellerProfile } from '$lib/types';

export interface ApiPublicSellerProducts {
	seller: ApiSellerProfile;
	products?: ApiProductRow[];
	items?: ApiProductRow[];
	nextCursor?: string | null;
	total?: number;
}

export interface ApiPublicSellerProduct {
	seller: ApiSellerProfile;
	product: ApiProductRow;
}

export interface ListPublicSellerProductsParams {
	limit?: number;
	cursor?: string | null;
	q?: string;
	type?: string;
}

function encodeParam(value: string): string {
	return encodeURIComponent(value.trim());
}

/* ------------------------------- endpoints ------------------------------- */

/** Profil publik toko (tanpa auth). 404 kalau toko tidak ada / tidak aktif. */
export async function getPublicSeller(username: string): Promise<ApiSellerProfile> {
	return api<ApiSellerProfile>(`/public/sellers/${encodeParam(username)}`);
}

/** Produk publik sebuah toko (hanya active + tampil di toko); berhalaman + filter. */
export async function getPublicSellerProducts(
	username: string,
	params: ListPublicSellerProductsParams = {}
): Promise<{ seller: ApiSellerProfile } & Paged<Product>> {
	const res = await api<ApiPublicSellerProducts>(
		`/public/sellers/${encodeParam(username)}/products${buildPageQuery(params)}`
	);
	const page = unwrapPage<ApiProductRow>({
		items: res.items ?? res.products ?? [],
		nextCursor: res.nextCursor ?? null,
		total: res.total
	});
	return {
		seller: res.seller,
		items: page.items.map(mapApiProduct),
		nextCursor: page.nextCursor,
		total: page.total
	};
}

/** Detail produk publik berdasarkan slug. 404 kalau produk tidak ada / tidak aktif. */
export async function getPublicSellerProduct(
	username: string,
	slug: string
): Promise<ApiPublicSellerProduct> {
	return api<ApiPublicSellerProduct>(
		`/public/sellers/${encodeParam(username)}/products/${encodeParam(slug)}`
	);
}

/* -------------------------------- mappers -------------------------------- */

/** Profil publik BE → SellerProfile lokal. Field lokal-only pakai default aman. */
export function mapPublicSeller(row: ApiSellerProfile): SellerProfile {
	return mapApiSellerProfile(row, structuredClone(freshSellerProfile));
}

/** Respons detail produk publik → tipe FE. */
export function mapPublicSellerProduct(res: ApiPublicSellerProduct): {
	seller: SellerProfile;
	product: Product;
} {
	return {
		seller: mapPublicSeller(res.seller),
		product: mapApiProduct(res.product)
	};
}
