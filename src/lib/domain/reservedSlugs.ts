/**
 * RESERVED SYSTEM SLUGS & ROUTE PROTECTION
 * Prevents seller usernames or dynamic routes from colliding with internal/system routes.
 */

export const RESERVED_SYSTEM_SLUGS: readonly string[] = [
	'admin',
	'login',
	'signup',
	'register',
	'blog',
	'orders',
	'api',
	'settings',
	'help',
	'terms',
	'privacy',
	'dashboard',
	'pesanan',
	'produk',
	'toko',
	'uangmu',
	'pengaturan',
	'static',
	'assets',
	'landing',
	'auth',
	'app',
	'public',
	'root',
	'support'
];

const RESERVED_SLUGS_SET = new Set(RESERVED_SYSTEM_SLUGS.map((s) => s.toLowerCase()));

/**
 * Check whether a candidate slug is a reserved system slug.
 */
export function isReservedSlug(slug: string): boolean {
	if (!slug) return false;
	const clean = slug.trim().toLowerCase().replace(/^@/, '');
	return RESERVED_SLUGS_SET.has(clean);
}

export interface UsernameValidationResult {
	valid: boolean;
	error?: string;
}

/**
 * Validates a seller username against format rules and system reserved words.
 */
export function validateSellerUsername(username: string): UsernameValidationResult {
	const clean = username.trim().toLowerCase().replace(/^@/, '');

	if (!clean) {
		return { valid: false, error: 'Username wajib diisi.' };
	}

	if (clean.length < 3) {
		return { valid: false, error: 'Username minimal 3 karakter.' };
	}

	if (clean.length > 30) {
		return { valid: false, error: 'Username maksimal 30 karakter.' };
	}

	if (!/^[a-z0-9_.-]+$/.test(clean)) {
		return {
			valid: false,
			error: 'Username hanya boleh huruf kecil, angka, garis bawah (_), titik (.), atau strip (-).'
		};
	}

	if (isReservedSlug(clean)) {
		return {
			valid: false,
			error: `Username "${clean}" dicadangkan untuk sistem internal Karja.`
		};
	}

	return { valid: true };
}
