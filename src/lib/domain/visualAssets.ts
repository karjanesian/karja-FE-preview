/**
 * Centralized Visual Asset Configuration for Karja
 *
 * Strict registry of visual keys and structural metadata.
 * Ready for future FileGarden asset URLs to be plugged in cleanly.
 * No Karyo, no legacy artwork, no random stock photos.
 */

export interface VisualAsset {
	id: string;
	url?: string;
	alt: string;
	aspectRatio: '4:3' | '16:10' | '1:1' | '16:9';
}

export const VISUAL_ASSETS: Record<string, VisualAsset> = {
	// Onboarding
	'onboarding.setupStore': {
		id: 'onboarding.setupStore',
		url: 'https://file.garden/ao1B7sLFNyZKt73m/platform%20new/onboarding.setupStore.png',
		alt: 'Siapkan toko',
		aspectRatio: '16:10'
	},
	'onboarding.createProduct': {
		id: 'onboarding.createProduct',
		url: 'https://file.garden/ao1B7sLFNyZKt73m/platform%20new/onboarding.createProduct.png',
		alt: 'Buat produk pertamamu',
		aspectRatio: '16:10'
	},
	'onboarding.shareProduct': {
		id: 'onboarding.shareProduct',
		url: 'https://file.garden/ao1B7sLFNyZKt73m/platform%20new/onboarding.shareProduct.png',
		alt: 'Bagikan produkmu',
		aspectRatio: '16:10'
	},

	// Lifecycle / Next Best Action
	'lifecycle.noProduct': {
		id: 'lifecycle.noProduct',
		url: 'https://file.garden/ao1B7sLFNyZKt73m/platform%20new/lifecycle.noProduct.png',
		alt: 'Mulai dari satu hal yang sering kamu bantu',
		aspectRatio: '4:3'
	},
	'lifecycle.productDraft': {
		id: 'lifecycle.productDraft',
		url: 'https://file.garden/ao1B7sLFNyZKt73m/platform%20new/lifecycle.productDraft.png',
		alt: 'Draft produk sedang disiapkan',
		aspectRatio: '4:3'
	},
	'lifecycle.readyToShare': {
		id: 'lifecycle.readyToShare',
		url: 'https://file.garden/ao1B7sLFNyZKt73m/platform%20new/lifecycle.readyToShare.png',
		alt: 'Produk sudah tayang dan siap dibagikan',
		aspectRatio: '4:3'
	},
	'lifecycle.sharedNoViews': {
		id: 'lifecycle.sharedNoViews',
		url: 'https://file.garden/ao1B7sLFNyZKt73m/platform%20new/lifecycle.sharedNoViews.png',
		alt: 'Menunggu kunjungan pertama',
		aspectRatio: '4:3'
	},
	'lifecycle.viewsNoSale': {
		id: 'lifecycle.viewsNoSale',
		url: 'https://file.garden/ao1B7sLFNyZKt73m/platform%20new/lifecycle.viewsNoSale.png',
		alt: 'Ada pengunjung yang mampir ke tokomu',
		aspectRatio: '4:3'
	},
	'lifecycle.actionRequired': {
		id: 'lifecycle.actionRequired',
		url: 'https://file.garden/ao1B7sLFNyZKt73m/platform%20new/lifecycle.actionRequired.png',
		alt: 'Pesanan perlu tindakan penjual',
		aspectRatio: '4:3'
	},
	'lifecycle.firstSaleComplete': {
		id: 'lifecycle.firstSaleComplete',
		url: 'https://file.garden/ao1B7sLFNyZKt73m/platform%20new/lifecycle.firstSaleComplete.png',
		alt: 'Pesanan pertama berhasil diselesaikan',
		aspectRatio: '4:3'
	},
	'lifecycle.balanceAvailable': {
		id: 'lifecycle.balanceAvailable',
		url: 'https://file.garden/ao1B7sLFNyZKt73m/platform%20new/lifecycle.balanceAvailable.png',
		alt: 'Saldo siap untuk ditarik',
		aspectRatio: '4:3'
	},
	'lifecycle.repeatSeller': {
		id: 'lifecycle.repeatSeller',
		url: 'https://file.garden/ao1B7sLFNyZKt73m/platform%20new/lifecycle.repeatSeller.png',
		alt: 'Semua aman dan berjalan lancar',
		aspectRatio: '4:3'
	},

	// Empty states
	'empty.products': {
		id: 'empty.products',
		url: 'https://file.garden/ao1B7sLFNyZKt73m/platform%20new/empty.products.png',
		alt: 'Belum ada produk',
		aspectRatio: '4:3'
	},
	'empty.orders': {
		id: 'empty.orders',
		url: 'https://file.garden/ao1B7sLFNyZKt73m/platform%20new/empty.orders.png',
		alt: 'Belum ada pesanan',
		aspectRatio: '4:3'
	},

	// Success states
	'success.productPublished': {
		id: 'success.productPublished',
		url: 'https://file.garden/ao1B7sLFNyZKt73m/platform%20new/success.productPublished.png',
		alt: 'Produk berhasil diterbitkan',
		aspectRatio: '16:9'
	}
};

export function getVisualAsset(key: string): VisualAsset {
	return (
		VISUAL_ASSETS[key] || {
			id: key,
			alt: 'Karja workspace visual',
			aspectRatio: '4:3'
		}
	);
}
