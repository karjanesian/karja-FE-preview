import type { Product, ProductType } from '$lib/types';

export function slugify(title: string): string {
	return (
		title
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.slice(0, 60) || `produk-${Date.now().toString(36)}`
	);
}

const TYPE_DEFAULTS: Record<ProductType, { category: string; emoji: string }> = {
	digital: { category: 'Produk digital', emoji: '📄' },
	session: { category: 'Sesi', emoji: '💡' },
	service: { category: 'Layanan', emoji: '💼' }
};

export function newDraftProduct(type: ProductType, prefill: Partial<Product> = {}): Product {
	const now = Date.now();
	const defaults = TYPE_DEFAULTS[type];
	const title = prefill.title ?? '';
	return {
		title,
		slug: slugify(title || `produk-baru-${now.toString(36)}`),
		type,
		category: prefill.category || defaults.category,
		price: prefill.price ?? 0,
		priceMode: prefill.priceMode ?? 'fixed',
		visibility: prefill.visibility ?? 'store',
		status: 'draft',
		images: prefill.images ?? [],
		coverEmoji: prefill.coverEmoji ?? defaults.emoji,
		targetAudience: prefill.targetAudience ?? '',
		problemSolved: prefill.problemSolved ?? '',
		whatYouGet: prefill.whatYouGet ?? '',
		howItWorks: prefill.howItWorks ?? '',
		aboutCreator: prefill.aboutCreator ?? '',
		faqs: prefill.faqs ?? [],
		rating: 0,
		reviewsCount: 0,
		views: 0,
		sales: 0,
		revenue: 0,
		claims: 0,
		buyClicks: 0,
		createdAt: 'Hari ini',
		...prefill,
		id: `prod_${now}`
	} as Product;
}
