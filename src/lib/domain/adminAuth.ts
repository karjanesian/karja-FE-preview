/**
 * Karja Admin Authentication & Credential Configuration
 *
 * PROTOTYPE ARCHITECTURE NOTE:
 * - Credentials and session checks in this file are for prototype/development use only.
 * - Client-side credential lists are NOT production security.
 * - In production, admin authentication MUST be migrated to secure server-side verification,
 *   secure HTTP-only session cookies or OAuth 2.0 / JWT tokens, and centralized RBAC.
 */

import { PlatformUser, PlatformRole } from '$lib/types/admin';

export interface AdminCredential {
	email: string;
	passwordHash: string; // Prototype plain validation key for demo test accounts
	user: PlatformUser;
}

export interface AdminSession {
	token: string;
	user: PlatformUser;
	expiresAt: number; // Unix timestamp in milliseconds
}

export const ADMIN_SESSION_STORAGE_KEY = 'karja_admin_session_v1';
export const ADMIN_SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Predefined administrative prototype accounts
 * (Strictly for prototype sandbox testing)
 */
export const PREDEFINED_ADMIN_ACCOUNTS: AdminCredential[] = [
	{
		email: 'admin@karja.id',
		passwordHash: 'karjaAdmin2026!',
		user: {
			id: 'admin_super_1',
			name: 'Super Admin Karja',
			email: 'admin@karja.id',
			role: 'super_admin',
			status: 'active',
			avatarUrl:
				'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
			createdAt: '2026-01-01T00:00:00.000Z',
			updatedAt: '2026-01-01T00:00:00.000Z'
		}
	},
	{
		email: 'ops@karja.id',
		passwordHash: 'karjaOps2026!',
		user: {
			id: 'admin_ops_1',
			name: 'Tim Operasional Karja',
			email: 'ops@karja.id',
			role: 'ops',
			status: 'active',
			avatarUrl:
				'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
			createdAt: '2026-01-05T00:00:00.000Z',
			updatedAt: '2026-01-05T00:00:00.000Z'
		}
	},
	{
		email: 'finance@karja.id',
		passwordHash: 'karjaFinance2026!',
		user: {
			id: 'admin_finance_1',
			name: 'Tim Keuangan & Payout Karja',
			email: 'finance@karja.id',
			role: 'finance',
			status: 'active',
			avatarUrl:
				'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
			createdAt: '2026-01-10T00:00:00.000Z',
			updatedAt: '2026-01-10T00:00:00.000Z'
		}
	},
	{
		email: 'trust@karja.id',
		passwordHash: 'karjaTrust2026!',
		user: {
			id: 'admin_trust_1',
			name: 'Tim Trust & Safety Karja',
			email: 'trust@karja.id',
			role: 'trust_safety',
			status: 'active',
			avatarUrl:
				'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
			createdAt: '2026-01-12T00:00:00.000Z',
			updatedAt: '2026-01-12T00:00:00.000Z'
		}
	},
	{
		email: 'editor@karja.id',
		passwordHash: 'karjaEditor2026!',
		user: {
			id: 'admin_editor_1',
			name: 'Content Editor Karja',
			email: 'editor@karja.id',
			role: 'content_editor',
			status: 'active',
			avatarUrl:
				'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
			createdAt: '2026-01-15T00:00:00.000Z',
			updatedAt: '2026-01-15T00:00:00.000Z'
		}
	},
	{
		email: 'writer@karja.id',
		passwordHash: 'karjaWriter2026!',
		user: {
			id: 'admin_writer_1',
			name: 'Content Writer Karja',
			email: 'writer@karja.id',
			role: 'content_writer',
			status: 'active',
			avatarUrl:
				'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
			createdAt: '2026-01-18T00:00:00.000Z',
			updatedAt: '2026-01-18T00:00:00.000Z'
		}
	}
];

export const GENERIC_AUTH_ERROR = 'Email atau password belum cocok.';

/**
 * Authenticates email + password against predefined administrative credentials.
 * Returns a generic error to prevent email enumeration.
 */
export function authenticateAdmin(
	email: string,
	password: string
): { success: boolean; session?: AdminSession; error?: string; internalReason?: string } {
	const normalizedEmail = email.trim().toLowerCase();
	const matched = PREDEFINED_ADMIN_ACCOUNTS.find(
		(acc) => acc.email.toLowerCase() === normalizedEmail
	);

	if (!matched) {
		return {
			success: false,
			error: GENERIC_AUTH_ERROR,
			internalReason: 'EMAIL_NOT_FOUND'
		};
	}

	if (matched.passwordHash !== password) {
		return {
			success: false,
			error: GENERIC_AUTH_ERROR,
			internalReason: 'INVALID_PASSWORD'
		};
	}

	if (matched.user.status !== 'active') {
		return {
			success: false,
			error: 'Akun administratif ini sedang dinonaktifkan oleh sistem.',
			internalReason: 'ACCOUNT_INACTIVE'
		};
	}

	const session: AdminSession = {
		token: `adm_tok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
		user: matched.user,
		expiresAt: Date.now() + ADMIN_SESSION_DURATION_MS
	};

	setAdminSession(session);
	return { success: true, session };
}

/**
 * Retrieves the current active admin session from storage
 */
export function getAdminSession(): AdminSession | null {
	if (typeof window === 'undefined') return null;

	try {
		const raw =
			sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY) ||
			localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
		if (!raw) return null;

		const session: AdminSession = JSON.parse(raw);
		if (!session || !session.expiresAt || !session.user) {
			clearAdminSession();
			return null;
		}

		if (Date.now() > session.expiresAt) {
			clearAdminSession();
			return null;
		}

		return session;
	} catch (err) {
		console.error('Failed to parse admin session:', err);
		clearAdminSession();
		return null;
	}
}

/**
 * Persists an admin session into storage
 */
export function setAdminSession(sessionOrUser: AdminSession | PlatformUser): void {
	if (typeof window === 'undefined') return;
	try {
		const session: AdminSession =
			'token' in sessionOrUser
				? sessionOrUser
				: {
						token: `adm_tok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
						user: sessionOrUser,
						expiresAt: Date.now() + ADMIN_SESSION_DURATION_MS
					};
		const serialized = JSON.stringify(session);
		sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, serialized);
		localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, serialized);
	} catch (err) {
		console.error('Failed to save admin session:', err);
	}
}

/**
 * Clears the active admin session
 */
export function clearAdminSession(): void {
	if (typeof window === 'undefined') return;
	try {
		sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
		localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
	} catch (err) {
		console.error('Failed to remove admin session:', err);
	}
}
