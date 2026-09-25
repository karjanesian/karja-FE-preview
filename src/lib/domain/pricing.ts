import { Product } from '$lib/types';

/**
 * Platform Fee Configuration
 * Karja Platform Fee: 7%
 * Payment Gateway Fee: 2%
 */
export const KARJA_FEE_PERCENT = 0.07;
export const PAYMENT_FEE_PERCENT = 0.02;

/**
 * Checks if a promo price is currently active based on promoEndsAt (if specified).
 */
export function isPromoActive(product: Product, now: Date = new Date()): boolean {
	if (product.priceMode !== 'promo') return false;
	if (!product.promoPrice && product.promoPrice !== 0) return false;
	if (product.promoEndsAt) {
		const end = new Date(product.promoEndsAt);
		if (!isNaN(end.getTime()) && end < now) {
			return false; // promo expired
		}
	}
	return true;
}

/**
 * Calculates the discount percentage between regular price and promo price.
 */
export function getPromoDiscountPercentage(regularPrice?: number, promoPrice?: number): number {
	if (!regularPrice || regularPrice <= 0 || promoPrice === undefined || promoPrice === null) {
		return 0;
	}
	if (promoPrice >= regularPrice) return 0;
	const pct = Math.round(((regularPrice - promoPrice) / regularPrice) * 100);
	return Math.max(0, Math.min(99, pct));
}

export interface ProductPriceState {
	effectivePrice: number;
	originalPrice: number;
	isPromoActive: boolean;
	isFree: boolean;
	promoEndsAt?: string;
	discountPercentage: number;
	formattedPrice: string;
	formattedOriginalPrice?: string;
}

/**
 * Single source of truth resolver for product pricing.
 * Validates promo status against promoEndsAt and ensures consistent display and charging.
 */
export function getProductPriceState(
	product?: Product | null,
	now: Date = new Date()
): ProductPriceState {
	if (!product) {
		return {
			effectivePrice: 0,
			originalPrice: 0,
			isPromoActive: false,
			isFree: true,
			discountPercentage: 0,
			formattedPrice: 'Gratis'
		};
	}

	const isExplicitFree =
		product.priceMode === 'free' || (product.price === 0 && !product.promoPrice);
	if (isExplicitFree) {
		return {
			effectivePrice: 0,
			originalPrice: 0,
			isPromoActive: false,
			isFree: true,
			promoEndsAt: undefined,
			discountPercentage: 0,
			formattedPrice: 'Gratis'
		};
	}

	const promoActive = isPromoActive(product, now);
	if (promoActive) {
		const effectivePrice =
			product.promoPrice !== undefined ? product.promoPrice : product.price || 0;
		const originalPrice =
			product.regularPrice !== undefined ? product.regularPrice : product.price || 0;
		const discountPct = getPromoDiscountPercentage(originalPrice, effectivePrice);
		return {
			effectivePrice,
			originalPrice,
			isPromoActive: true,
			isFree: effectivePrice === 0,
			promoEndsAt: product.promoEndsAt,
			discountPercentage: discountPct,
			formattedPrice: effectivePrice === 0 ? 'Gratis' : formatRupiah(effectivePrice),
			formattedOriginalPrice: formatRupiah(originalPrice)
		};
	}

	// Fixed price or Expired promo:
	// If promo is expired, the price reverts to regularPrice (if specified) or base price.
	const effectivePrice =
		product.priceMode === 'promo' && product.regularPrice !== undefined
			? product.regularPrice
			: product.price || 0;

	return {
		effectivePrice,
		originalPrice: effectivePrice,
		isPromoActive: false,
		isFree: effectivePrice === 0,
		promoEndsAt: product.promoEndsAt,
		discountPercentage: 0,
		formattedPrice: effectivePrice === 0 ? 'Gratis' : formatRupiah(effectivePrice)
	};
}

/**
 * Computes the single source of truth effective price of a product.
 * - 'free' -> 0
 * - 'promo' (active) -> promoPrice ?? price
 * - 'promo' (expired) -> regularPrice ?? price
 * - 'fixed' -> price
 */
export function getEffectivePrice(product: Product, now: Date = new Date()): number {
	return getProductPriceState(product, now).effectivePrice;
}

/**
 * Calculates Karja platform fee (7%), payment processing fee (2%), and net amount for seller.
 */
export function calculateKarjaFees(amount: number): {
	karjaFee: number;
	paymentFee: number;
	netReceived: number;
} {
	if (!amount || amount <= 0) {
		return { karjaFee: 0, paymentFee: 0, netReceived: 0 };
	}
	const karjaFee = Math.round(amount * KARJA_FEE_PERCENT);
	const paymentFee = Math.round(amount * PAYMENT_FEE_PERCENT);
	const netReceived = Math.max(0, amount - karjaFee - paymentFee);

	return {
		karjaFee,
		paymentFee,
		netReceived
	};
}

/**
 * Standard Indonesian Rupiah currency formatter (e.g., Rp52.500)
 */
export function formatRupiah(amount: number): string {
	if (amount === 0) return 'Rp0';
	if (!amount || isNaN(amount)) return 'Rp0';
	return `Rp${Math.round(amount).toLocaleString('id-ID')}`;
}

/**
 * Formats a buyer name for public display with abbreviated last name (e.g. "Raka Aditya" -> "Raka A.")
 */
export function formatBuyerDisplayName(fullName?: string): string {
	if (!fullName || typeof fullName !== 'string') return 'Pembeli Terverifikasi';
	const parts = fullName.trim().split(/\s+/);
	if (parts.length <= 1) return parts[0] || 'Pembeli Terverifikasi';
	const first = parts[0];
	const lastInitial = parts[parts.length - 1][0].toUpperCase();
	return `${first} ${lastInitial}.`;
}
