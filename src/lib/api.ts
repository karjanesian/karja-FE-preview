import { PUBLIC_API_URL } from '$env/static/public';
import { m } from '$lib/paraglide/messages.js';
import { apiLoading } from '$lib/stores/apiLoading.svelte';

export const API_URL = PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export class ApiError extends Error {
	status: number;
	constructor(message: string, status: number) {
		super(message);
		this.status = status;
	}
}

export interface SellerUser {
	id: string;
	email: string;
	name: string;
	username: string;
}

export type AuthDomain = 'seller' | 'admin';

type ApiOpts = {
	method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
	body?: unknown;
	headers?: Record<string, string>;
};

function domainFor(path: string): AuthDomain | null {
	if (path.startsWith('/auth/admin/') || path.startsWith('/admin/')) return 'admin';
	if (path.startsWith('/auth/seller/') || path.startsWith('/seller/')) return 'seller';
	return null;
}

/** Endpoint langkah-auth (login/otp/refresh/logout) tidak boleh memicu refresh-otomatis. */
function isRefreshable(path: string): boolean {
	if (/(\/login|\/logout|\/refresh|-otp)$/.test(path)) return false;
	return domainFor(path) !== null;
}

let refreshPromise: Promise<boolean> | null = null;

function refreshSession(domain: AuthDomain): Promise<boolean> {
	refreshPromise ??= (async () => {
		apiLoading.start();
		try {
			const res = await fetch(`${API_URL}/auth/${domain}/refresh`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				credentials: 'include',
				body: '{}'
			});
			if (!res.ok) return false;
			const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;
			return data?.ok === true;
		} catch {
			return false;
		} finally {
			apiLoading.done();
		}
	})().finally(() => {
		setTimeout(() => (refreshPromise = null), 0);
	});
	return refreshPromise;
}

type SessionExpiredHandler = (domain: AuthDomain) => void;
let sessionExpiredHandler: SessionExpiredHandler | null = null;

export function setSessionExpiredHandler(handler: SessionExpiredHandler | null) {
	sessionExpiredHandler = handler;
}

async function request(path: string, opts: ApiOpts): Promise<Response> {
	apiLoading.start();
	try {
		return await fetch(`${API_URL}${path}`, {
			method: opts.method ?? 'GET',
			headers: { 'content-type': 'application/json', ...opts.headers },
			credentials: 'include',
			body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined
		});
	} finally {
		apiLoading.done();
	}
}

export async function api<T = unknown>(path: string, opts: ApiOpts = {}): Promise<T> {
	const domain = domainFor(path);
	let res = await request(path, opts);

	// Access token expired → request again.
	if (res.status === 401 && domain && isRefreshable(path)) {
		const refreshed = await refreshSession(domain);
		if (refreshed) {
			res = await request(path, opts);
		} else {
			sessionExpiredHandler?.(domain);
		}
	}

	const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
	if (!res.ok) {
		throw new ApiError(
			typeof data?.message === 'string' ? data.message : m.auth_err_generic(),
			res.status
		);
	}
	return data as T;
}

export function isNetworkError(e: unknown): boolean {
	return e instanceof TypeError;
}

export async function fetchMe(): Promise<SellerUser | null> {
	try {
		return await api<SellerUser>('/auth/seller/me');
	} catch {
		return null;
	}
}
