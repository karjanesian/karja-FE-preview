/**
 * Canonical Karja URL helpers
 * Single source of truth for generating store and product URLs.
 */

export function cleanUsername(username?: string): string {
	if (!username) return 'username-kamu';
	const cleaned = username
		.trim()
		.replace(/^@+/, '')
		.replace(/^\/+|\/+$/g, '');
	return cleaned || 'username-kamu';
}

export function cleanSlug(slug?: string): string {
	if (!slug) return 'produk';
	return slug.trim().replace(/^\/+|\/+$/g, '') || 'produk';
}

/**
 * Returns canonical store display URL: karja.id/{username}
 */
export function getStoreUrl(username?: string): string {
	return `karja.id/${cleanUsername(username)}`;
}

/**
 * Returns canonical product display URL: karja.id/{username}/{productSlug}
 */
export function getProductUrl(username?: string, productSlug?: string): string {
	return `karja.id/${cleanUsername(username)}/${cleanSlug(productSlug)}`;
}

/**
 * Returns fully-qualified HTTPS store URL: https://karja.id/{username}
 * Uses current origin in browser context so links resolve in any environment.
 */
export function getPublicStoreUrl(username?: string): string {
	const origin =
		typeof window !== 'undefined' && window.location?.origin
			? window.location.origin
			: 'https://karja.id';
	return `${origin}/${cleanUsername(username)}`;
}

/**
 * Returns fully-qualified HTTPS product URL: https://karja.id/{username}/{productSlug}
 * Uses current origin in browser context so links resolve in any environment.
 */
export function getPublicProductUrl(username?: string, productSlug?: string): string {
	const origin =
		typeof window !== 'undefined' && window.location?.origin
			? window.location.origin
			: 'https://karja.id';
	return `${origin}/${cleanUsername(username)}/${cleanSlug(productSlug)}`;
}

/**
 * Returns fully-qualified HTTPS buyer access URL: https://karja.id/orders/{orderId}/access
 */
export function getBuyerAccessUrl(orderId: string): string {
	const origin =
		typeof window !== 'undefined' && window.location?.origin
			? window.location.origin
			: 'https://karja.id';
	return `${origin}/orders/${orderId}/access`;
}

/**
 * Abbreviates buyer name for privacy on public review displays (e.g. "Dion Pratama" -> "Dion P.")
 */
export function formatBuyerDisplayName(name?: string): string {
	if (!name || !name.trim()) return 'Pembeli Terverifikasi';
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0];
	const first = parts[0];
	const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
	return `${first} ${lastInitial}.`;
}

/**
 * Opens canonical public store page in a new window/tab safely, or navigates in-app if blocked.
 */
export function openPublicStoreWindow(username?: string, fallbackNavigate?: () => void): void {
	const url = getPublicStoreUrl(username);
	if (typeof window === 'undefined') return;
	try {
		const opened = window.open(url, '_blank', 'noopener,noreferrer');
		if (!opened || opened.closed || typeof opened.closed === 'undefined') {
			if (fallbackNavigate) fallbackNavigate();
			else window.location.href = url;
		}
	} catch (_) {
		if (fallbackNavigate) fallbackNavigate();
		else window.location.href = url;
	}
}

/**
 * Opens canonical public product page in a new window/tab safely, or navigates in-app if blocked.
 */
export function openPublicProductWindow(
	username?: string,
	productSlug?: string,
	fallbackNavigate?: () => void
): void {
	const url = getPublicProductUrl(username, productSlug);
	if (typeof window === 'undefined') return;
	try {
		const opened = window.open(url, '_blank', 'noopener,noreferrer');
		if (!opened || opened.closed || typeof opened.closed === 'undefined') {
			if (fallbackNavigate) fallbackNavigate();
			else window.location.href = url;
		}
	} catch (_) {
		if (fallbackNavigate) fallbackNavigate();
		else window.location.href = url;
	}
}
