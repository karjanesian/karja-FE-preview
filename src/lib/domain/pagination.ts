/** BE list admin kini mengembalikan `{ items, nextCursor }` (keyset). Terima juga array lama. */
export function unwrapItems<T>(res: T[] | { items: T[] } | null | undefined): T[] {
	if (!res) return [];
	return Array.isArray(res) ? res : (res.items ?? []);
}

/** Bentuk respons list berhalaman dari BE (keyset). */
export interface Paged<T> {
	items: T[];
	nextCursor: string | null;
	total: number;
}

/** Terima `{ items, nextCursor, total }` baru maupun array lama. */
export function unwrapPage<T>(
	res: T[] | { items?: T[]; nextCursor?: string | null; total?: number } | null | undefined
): Paged<T> {
	if (!res) return { items: [], nextCursor: null, total: 0 };
	if (Array.isArray(res)) return { items: res, nextCursor: null, total: res.length };
	const items = res.items ?? [];
	return {
		items,
		nextCursor: res.nextCursor ?? null,
		total: typeof res.total === 'number' ? res.total : items.length
	};
}

export type SortDir = 'asc' | 'desc';

export interface PageQuery {
	limit?: number;
	cursor?: string | null;
	q?: string;
	status?: string;
	type?: string;
	state?: string;
	moderationStatus?: string;
	paymentStatus?: string;
	fulfillmentStatus?: string;
	sortBy?: string;
	sortDir?: SortDir;
	unread?: boolean;
}

/** Bangun query string untuk endpoint berhalaman; lewati nilai kosong. */
export function buildPageQuery(params: PageQuery = {}): string {
	const search = new URLSearchParams();
	if (params.limit !== undefined) search.set('limit', String(params.limit));
	if (params.cursor) search.set('cursor', params.cursor);
	if (params.q && params.q.trim()) search.set('q', params.q.trim());
	if (params.status && params.status.trim()) search.set('status', params.status.trim());
	if (params.type && params.type.trim()) search.set('type', params.type.trim());
	if (params.state && params.state.trim()) search.set('state', params.state.trim());
	if (params.moderationStatus && params.moderationStatus.trim())
		search.set('moderationStatus', params.moderationStatus.trim());
	if (params.paymentStatus && params.paymentStatus.trim())
		search.set('paymentStatus', params.paymentStatus.trim());
	if (params.fulfillmentStatus && params.fulfillmentStatus.trim())
		search.set('fulfillmentStatus', params.fulfillmentStatus.trim());
	if (params.sortBy && params.sortBy.trim()) search.set('sortBy', params.sortBy.trim());
	if (params.sortDir) search.set('sortDir', params.sortDir);
	if (params.unread !== undefined) search.set('unread', String(params.unread));
	const query = search.toString();
	return query ? `?${query}` : '';
}
