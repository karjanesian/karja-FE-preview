import { api, ApiError } from '$lib/api';
import { m } from '$lib/paraglide/messages.js';
import { buildPageQuery, unwrapPage, type Paged } from './pagination';
import type {
	PriceMode,
	Product,
	ProductFAQ,
	ProductModerationStatus,
	ProductStatus,
	ProductType,
	ProductVisibility
} from '$lib/types';

export const PRODUCT_IMAGE_MAX_BYTES = 6 * 1024 * 1024;
export const PRODUCT_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export interface ApiProductImage {
	id: string;
	url: string;
	name?: string;
	position?: number;
}

export interface ApiProductFaq {
	question: string;
	answer: string;
}

/** Baris produk dari BE (camelCase Drizzle) + relasi files/faqs. */
export interface ApiProductRow {
	id: string;
	sellerId?: string;
	type?: string | null;
	title?: string | null;
	slug?: string | null;
	productSubtype?: string | null;
	category?: string | null;
	shortDescription?: string | null;
	priceMode?: string | null;
	priceIdr?: number | null;
	regularPriceIdr?: number | null;
	promoPriceIdr?: number | null;
	promoEndsAt?: string | null;
	visibility?: string | null;
	status?: string | null;
	coverEmoji?: string | null;
	targetAudience?: string | null;
	problemSolved?: string | null;
	whatYouGet?: string | null;
	howItWorks?: string | null;
	aboutCreator?: string | null;
	fileDownloadName?: string | null;
	fileAccessInstructions?: string | null;
	digitalAccessUrl?: string | null;
	sessionDurationMinutes?: number | null;
	meetingMethod?: string | null;
	preparationQuestions?: string[] | null;
	availabilityMode?: string | null;
	customAvailability?: unknown;
	bufferMinutes?: number | null;
	minimumNoticeHours?: number | null;
	bookingWindowDays?: number | null;
	meetingInstructions?: string | null;
	sessionBookingNote?: string | null;
	sessionPrepNote?: string | null;
	serviceTimelineDays?: number | null;
	serviceRevisions?: number | null;
	serviceDeliverables?: string | null;
	serviceBuyerInputs?: string | null;
	badge?: string | null;
	moderationStatus?: string | null;
	moderationReason?: string | null;
	moderatedAt?: string | null;
	moderatedBy?: string | null;
	views?: number | null;
	buyClicks?: number | null;
	sales?: number | null;
	claims?: number | null;
	revenueIdr?: number | null;
	rating?: number | string | null;
	reviewsCount?: number | null;
	createdAt?: string | null;
	updatedAt?: string | null;
	images?: ApiProductImage[] | null;
	faqs?: ApiProductFaq[] | null;
}

/** Body untuk POST/PATCH /seller/products (hanya field yang dikenali BE). */
export interface ApiProductDto {
	title?: string;
	type?: ProductType;
	productSubtype?: string;
	category?: string;
	shortDescription?: string;
	priceMode?: PriceMode;
	priceIdr?: number;
	regularPriceIdr?: number;
	promoPriceIdr?: number;
	promoEndsAt?: string;
	visibility?: ProductVisibility;
	targetAudience?: string;
	problemSolved?: string;
	whatYouGet?: string;
	howItWorks?: string;
	aboutCreator?: string;
	fileDownloadName?: string;
	fileAccessInstructions?: string;
	digitalAccessUrl?: string;
	sessionDurationMinutes?: number;
	meetingMethod?: 'google_meet';
	preparationQuestions?: string[];
	availabilityMode?: 'seller_default' | 'custom';
	customAvailability?: Record<string, unknown>;
	bufferMinutes?: number;
	minimumNoticeHours?: number;
	bookingWindowDays?: number;
	meetingInstructions?: string;
	sessionBookingNote?: string;
	sessionPrepNote?: string;
	serviceTimelineDays?: number;
	serviceRevisions?: number;
	serviceDeliverables?: string;
	serviceBuyerInputs?: string;
	badge?: string;
}

function asProductType(value: unknown): ProductType {
	return value === 'session' || value === 'service' ? value : 'digital';
}

function asVisibility(value: unknown): ProductVisibility {
	return value === 'store' ? 'store' : 'link_only';
}

function asPriceMode(value: unknown): PriceMode {
	return value === 'free' || value === 'promo' ? value : 'fixed';
}

function asStatus(value: unknown): ProductStatus {
	if (value === 'active' || value === 'paused' || value === 'archived') return value;
	return 'draft';
}

function asModeration(value: unknown): ProductModerationStatus | undefined {
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
		default:
			return undefined;
	}
}

function asNumber(value: unknown, fallback = 0): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function asOptionalNumber(value: unknown): number | undefined {
	if (value === null || value === undefined || value === '') return undefined;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
}

/** BE row → FE Product. `images[].url` jadi `images: string[]`, file id disimpan di `imageFiles`. */
export function mapApiProduct(row: ApiProductRow): Product {
	const apiImages = Array.isArray(row.images)
		? row.images.filter((img) => img && typeof img.url === 'string' && img.url.length > 0)
		: [];
	const imageUrls = apiImages.map((img) => img.url);
	const faqs: ProductFAQ[] = (row.faqs ?? [])
		.filter((faq) => faq && (faq.question || faq.answer))
		.map((faq, index) => ({
			id: `faq_${row.id}_${index}`,
			question: faq.question ?? '',
			answer: faq.answer ?? ''
		}));
	const digitalAccessUrl = row.digitalAccessUrl ?? '';

	return {
		id: row.id,
		sellerId: row.sellerId,
		title: row.title ?? '',
		slug: row.slug ?? '',
		type: asProductType(row.type),
		productSubtype: row.productSubtype ?? '',
		category: row.category ?? '',
		price: asNumber(row.priceIdr),
		priceMode: asPriceMode(row.priceMode),
		regularPrice: asOptionalNumber(row.regularPriceIdr),
		promoPrice: asOptionalNumber(row.promoPriceIdr),
		promoEndsAt: row.promoEndsAt ?? '',
		visibility: asVisibility(row.visibility),
		status: asStatus(row.status),
		images: imageUrls,
		imageFiles: apiImages.map((img, index) => ({
			id: img.id,
			url: img.url,
			position: img.position ?? index
		})),
		coverImage: imageUrls[0] ?? '',
		coverEmoji: row.coverEmoji ?? undefined,
		badge: row.badge ?? undefined,
		rating: asOptionalNumber(row.rating) ?? 0,
		reviewsCount: asNumber(row.reviewsCount),
		shortDescription: row.shortDescription ?? '',
		targetAudience: row.targetAudience ?? '',
		problemSolved: row.problemSolved ?? '',
		whatYouGet: row.whatYouGet ?? '',
		howItWorks: row.howItWorks ?? '',
		aboutCreator: row.aboutCreator ?? '',
		faqs,
		digitalDeliveryType: digitalAccessUrl
			? 'external_link'
			: row.fileAccessInstructions
				? 'instructions'
				: 'upload',
		fileDownloadName: row.fileDownloadName ?? '',
		fileSize: undefined,
		externalAccessUrl: digitalAccessUrl,
		accessInstructions: row.fileAccessInstructions ?? '',
		fileAccessInstructions: row.fileAccessInstructions ?? '',
		sessionDurationMinutes: asOptionalNumber(row.sessionDurationMinutes),
		availabilityMode: row.availabilityMode === 'custom' ? 'custom' : 'seller_default',
		customAvailability: (row.customAvailability as Product['customAvailability']) ?? undefined,
		bufferMinutes: asOptionalNumber(row.bufferMinutes),
		minimumNoticeHours: asOptionalNumber(row.minimumNoticeHours),
		bookingWindowDays: asOptionalNumber(row.bookingWindowDays),
		meetingMethod: 'google_meet',
		meetingInstructions: row.meetingInstructions ?? undefined,
		preparationQuestions: Array.isArray(row.preparationQuestions) ? row.preparationQuestions : [],
		sessionPlatform: 'Google Meet',
		sessionBookingNote: row.sessionBookingNote ?? '',
		sessionPrepNote: row.sessionPrepNote ?? '',
		serviceTimelineDays: asOptionalNumber(row.serviceTimelineDays),
		serviceRevisions: asOptionalNumber(row.serviceRevisions),
		serviceBuyerInputsRequired: row.serviceBuyerInputs ?? '',
		serviceDeliverables: row.serviceDeliverables ?? '',
		moderationStatus: asModeration(row.moderationStatus),
		moderationReason: row.moderationReason ?? undefined,
		moderatedAt: row.moderatedAt ?? undefined,
		moderatedBy: row.moderatedBy ?? undefined,
		views: asNumber(row.views),
		sales: asNumber(row.sales),
		revenue: asNumber(row.revenueIdr),
		claims: asNumber(row.claims),
		downloads: 0,
		buyClicks: asNumber(row.buyClicks),
		createdAt: row.createdAt ?? ''
	};
}

function compact<T extends Record<string, unknown>>(input: T): T {
	const out: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(input)) {
		if (value === undefined || value === null) continue;
		if (typeof value === 'string' && value.trim() === '') continue;
		out[key] = value;
	}
	return out as T;
}

/** FE Product → body BE. Field non-API (images, faqs, stats, status, coverEmoji, slug, dll) diomisi. */
export function toApiDto(product: Product): ApiProductDto {
	const preparationQuestions = (product.preparationQuestions ?? []).filter(
		(question) => question.trim().length > 0
	);
	const timelineDays = asOptionalNumber(product.serviceTimelineDays);
	const digitalAccessUrl = product.externalAccessUrl || '';

	return compact({
		title: product.title,
		type: product.type,
		productSubtype: product.productSubtype,
		category: product.category,
		shortDescription: product.shortDescription?.slice(0, 300),
		priceMode: product.priceMode,
		priceIdr: Math.max(0, Math.round(product.priceMode === 'free' ? 0 : product.price)),
		regularPriceIdr:
			product.regularPrice !== undefined
				? Math.max(0, Math.round(product.regularPrice))
				: undefined,
		promoPriceIdr:
			product.promoPrice !== undefined ? Math.max(0, Math.round(product.promoPrice)) : undefined,
		promoEndsAt: product.promoEndsAt || undefined,
		visibility: product.visibility,
		targetAudience: product.targetAudience,
		problemSolved: product.problemSolved,
		whatYouGet: product.whatYouGet,
		howItWorks: product.howItWorks,
		aboutCreator: product.aboutCreator,
		fileDownloadName: product.fileDownloadName,
		fileAccessInstructions: product.fileAccessInstructions || product.accessInstructions,
		digitalAccessUrl: digitalAccessUrl || undefined,
		sessionDurationMinutes:
			product.type === 'session' ? asOptionalNumber(product.sessionDurationMinutes) : undefined,
		meetingMethod: product.type === 'session' ? 'google_meet' : undefined,
		preparationQuestions: product.type === 'session' ? preparationQuestions : undefined,
		availabilityMode: product.type === 'session' ? product.availabilityMode : undefined,
		customAvailability:
			product.type === 'session' && product.availabilityMode === 'custom'
				? (product.customAvailability as Record<string, unknown> | undefined)
				: undefined,
		bufferMinutes: product.type === 'session' ? asOptionalNumber(product.bufferMinutes) : undefined,
		minimumNoticeHours:
			product.type === 'session' ? asOptionalNumber(product.minimumNoticeHours) : undefined,
		bookingWindowDays:
			product.type === 'session' ? asOptionalNumber(product.bookingWindowDays) : undefined,
		meetingInstructions: product.type === 'session' ? product.meetingInstructions : undefined,
		sessionBookingNote: product.type === 'session' ? product.sessionBookingNote : undefined,
		sessionPrepNote: product.type === 'session' ? product.sessionPrepNote : undefined,
		serviceTimelineDays:
			product.type === 'service' && timelineDays && timelineDays > 0 ? timelineDays : undefined,
		serviceRevisions:
			product.type === 'service' ? asOptionalNumber(product.serviceRevisions) : undefined,
		serviceDeliverables: product.type === 'service' ? product.serviceDeliverables : undefined,
		serviceBuyerInputs: product.type === 'service' ? product.serviceBuyerInputsRequired : undefined,
		badge: product.badge
	}) as ApiProductDto;
}

/* ------------------------------- endpoints ------------------------------- */

export interface ListProductsParams {
	limit?: number;
	cursor?: string | null;
	q?: string;
	status?: string;
	type?: string;
	sortBy?: string;
	sortDir?: 'asc' | 'desc';
}

/** Produk seller (butuh sesi) dengan paginasi keyset + filter. */
export async function listProducts(params: ListProductsParams = {}): Promise<Paged<Product>> {
	const res = await api<
		{ items?: ApiProductRow[]; nextCursor?: string | null; total?: number } | ApiProductRow[]
	>(`/seller/products${buildPageQuery(params)}`);
	const page = unwrapPage(res);
	return { ...page, items: page.items.map(mapApiProduct) };
}

export async function getProduct(id: string): Promise<Product> {
	return mapApiProduct(await api<ApiProductRow>(`/seller/products/${id}`));
}

/** Alias eksplisit: produk milik seller yang sedang login (GET /seller/products/:id). */
export async function getSellerProduct(id: string): Promise<Product> {
	return getProduct(id);
}

export async function createProduct(product: Product): Promise<Product> {
	const row = await api<ApiProductRow>('/seller/products', {
		method: 'POST',
		body: toApiDto(product)
	});
	return mapApiProduct(row);
}

export async function updateProduct(id: string, product: Product): Promise<Product> {
	const row = await api<ApiProductRow>(`/seller/products/${id}`, {
		method: 'PATCH',
		body: toApiDto(product)
	});
	return mapApiProduct(row);
}

export async function publishProduct(id: string): Promise<Product> {
	return mapApiProduct(
		await api<ApiProductRow>(`/seller/products/${id}/publish`, { method: 'POST', body: {} })
	);
}

export async function duplicateProduct(id: string): Promise<Product> {
	return mapApiProduct(
		await api<ApiProductRow>(`/seller/products/${id}/duplicate`, { method: 'POST', body: {} })
	);
}

export async function toggleProduct(id: string): Promise<Product> {
	return mapApiProduct(
		await api<ApiProductRow>(`/seller/products/${id}/toggle`, { method: 'POST', body: {} })
	);
}

export async function archiveProduct(id: string): Promise<Product> {
	return mapApiProduct(
		await api<ApiProductRow>(`/seller/products/${id}/archive`, { method: 'POST', body: {} })
	);
}

export async function replaceFaqs(id: string, faqs: ProductFAQ[]): Promise<void> {
	const payload = faqs
		.map((faq) => ({ question: faq.question.trim(), answer: faq.answer.trim() }))
		.filter((faq) => faq.question.length > 0 && faq.answer.length > 0);
	await api(`/seller/products/${id}/faqs`, { method: 'PUT', body: { faqs: payload } });
}

/** fileIds[0] = gambar utama. */
export async function setProductImages(id: string, fileIds: string[]): Promise<void> {
	await api(`/seller/products/${id}/images`, { method: 'PUT', body: { fileIds } });
}

export interface UploadedProductImage {
	fileId: string;
	url: string;
}

/** upload-url → PUT bytes → complete. `productId` opsional (link menyusul via setProductImages). */
export async function uploadProductImage(
	file: File,
	productId?: string
): Promise<UploadedProductImage> {
	if (!PRODUCT_IMAGE_MIME_TYPES.includes(file.type) || file.size > PRODUCT_IMAGE_MAX_BYTES) {
		throw new ApiError(m.pb_image_invalid(), 400);
	}

	const requested = await api<{ fileId: string; uploadUrl: string; publicUrl?: string }>(
		'/seller/files/upload-url',
		{
			method: 'POST',
			body: {
				category: 'product_image',
				fileName: file.name,
				mimeType: file.type,
				sizeBytes: file.size,
				productId
			}
		}
	);

	const upload = await fetch(requested.uploadUrl, {
		method: 'PUT',
		headers: { 'content-type': file.type },
		body: file
	});
	if (!upload.ok) throw new ApiError(m.pb_image_upload_failed(), upload.status);

	await api(`/seller/files/${requested.fileId}/complete`, { method: 'POST', body: {} });

	return { fileId: requested.fileId, url: requested.publicUrl ?? '' };
}
