import type { RequestEvent } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';

const API_URL = PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export type SessionStatus = 'authed' | 'anonymous' | 'offline';

export interface SessionResult<T = Record<string, unknown>> {
	status: SessionStatus;
	user: T | null;
}

async function callApi(event: RequestEvent, path: string, method: 'GET' | 'POST' = 'GET') {
	const cookieHeader = event.cookies
		.getAll()
		.map((c) => `${c.name}=${c.value}`)
		.join('; ');

	const res = await fetch(`${API_URL}${path}`, {
		method,
		headers: {
			'content-type': 'application/json',
			...(cookieHeader ? { cookie: cookieHeader } : {})
		},
		...(method === 'POST' ? { body: '{}' } : {})
	});

	// Sampaikan Set-Cookie hasil rotasi token dari BE ke browser lewat event.cookies
	for (const sc of res.headers.getSetCookie()) {
		const [nameValue, ...attrs] = sc.split(';');
		const sep = nameValue.indexOf('=');
		const name = nameValue.slice(0, sep).trim();
		const value = nameValue.slice(sep + 1).trim();
		if (!name) continue;
		const maxAgeAttr = attrs.find((a) => /max-age/i.test(a));
		event.cookies.set(name, value, {
			path: '/',
			httpOnly: attrs.some((a) => /httponly/i.test(a)),
			secure: attrs.some((a) => /secure/i.test(a)),
			sameSite: /samesite=none/i.test(sc) ? 'none' : /samesite=strict/i.test(sc) ? 'strict' : 'lax',
			maxAge: maxAgeAttr ? Number(maxAgeAttr.split('=')[1]) : undefined
		});
	}
	return res;
}

async function probe(
	event: RequestEvent,
	mePath: string,
	domain: 'seller' | 'admin'
): Promise<SessionResult> {
	try {
		let res = await callApi(event, mePath);
		if (res.status === 401) {
			const r = await callApi(event, `/auth/${domain}/refresh`, 'POST');
			if (r.ok) {
				const json = (await r.json().catch(() => null)) as { ok?: boolean } | null;
				if (json?.ok) res = await callApi(event, mePath);
			}
		}
		if (res.ok) return { status: 'authed', user: await res.json() };
		if (res.status >= 400 && res.status < 500) return { status: 'anonymous', user: null };
		return { status: 'offline', user: null };
	} catch {
		return { status: 'offline', user: null };
	}
}

export function createSessionResolvers(event: RequestEvent) {
	let sellerP: Promise<SessionResult> | undefined;
	let adminP: Promise<SessionResult> | undefined;
	return {
		sellerSession: () => (sellerP ??= probe(event, '/auth/seller/me', 'seller')),
		adminSession: () => (adminP ??= probe(event, '/auth/admin/me', 'admin'))
	};
}
