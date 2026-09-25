import { api } from '$lib/api';
import { buildPageQuery, unwrapPage, type Paged } from './pagination';
import type { AppNotification, NotificationPreferences } from '$lib/types';

/** Tipe notifikasi yang dikenali BE. */
export type ApiNotificationType = 'sale' | 'action' | 'money' | 'system' | 'view';

/** Baris notifikasi dari BE (camelCase Drizzle). */
export interface ApiNotificationRow {
	id: string;
	type?: string | null;
	title?: string | null;
	description?: string | null;
	targetTab?: string | null;
	targetId?: string | null;
	isRead?: boolean | null;
	unread?: boolean | null;
	timestamp?: string | null;
}

/** Preferensi notifikasi dari BE (satu set boolean, tanpa pemisahan email/in-app). */
export interface ApiNotificationPreferences {
	userId?: string;
	newOrder?: boolean | null;
	sessionReminder?: boolean | null;
	serviceUpdates?: boolean | null;
	newReview?: boolean | null;
	payoutUpdates?: boolean | null;
	weeklySummary?: boolean | null;
}

/** Body PATCH /seller/notification-preferences (hanya field yang dikenali BE). */
export interface ApiNotificationPreferencesDto {
	newOrder?: boolean;
	sessionReminder?: boolean;
	serviceUpdates?: boolean;
	newReview?: boolean;
	payoutUpdates?: boolean;
	weeklySummary?: boolean;
}

const NOTIFICATION_TYPES: readonly ApiNotificationType[] = [
	'sale',
	'action',
	'money',
	'system',
	'view'
];

function asNotificationType(value: unknown): ApiNotificationType {
	return NOTIFICATION_TYPES.includes(value as ApiNotificationType)
		? (value as ApiNotificationType)
		: 'system';
}

function asBoolean(value: unknown, fallback: boolean): boolean {
	return typeof value === 'boolean' ? value : fallback;
}

/** ISO timestamp → jam tampilan (HH:mm, zona Asia/Jakarta). */
function formatNotificationTime(iso?: string | null): string | undefined {
	if (!iso) return undefined;
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return undefined;
	return date.toLocaleTimeString('en-GB', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
		timeZone: 'Asia/Jakarta'
	});
}

/** BE row → FE AppNotification. `description` = body, `timestamp` mengisi `timestamp` & `time`. */
export function mapApiNotification(row: ApiNotificationRow): AppNotification {
	const isRead = asBoolean(row.isRead, !asBoolean(row.unread, false));
	return {
		id: row.id,
		type: asNotificationType(row.type),
		title: row.title ?? '',
		description: row.description ?? '',
		targetTab: row.targetTab ?? undefined,
		targetId: row.targetId ?? undefined,
		isRead,
		unread: asBoolean(row.unread, !isRead),
		timestamp: row.timestamp ?? undefined,
		time: formatNotificationTime(row.timestamp)
	};
}

/** FE prefs (bagian email) → body BE. `orderActionRequired` dipetakan ke `serviceUpdates`. */
export function toApiNotificationPreferences(
	prefs: NotificationPreferences
): ApiNotificationPreferencesDto {
	return {
		newOrder: prefs.email.newOrder,
		sessionReminder: prefs.email.sessionReminder,
		serviceUpdates: prefs.email.orderActionRequired,
		newReview: prefs.email.newReview,
		payoutUpdates: prefs.email.payoutUpdates,
		weeklySummary: prefs.email.weeklySummary
	};
}

/** BE prefs → FE prefs, mempertahankan nilai `base` saat field BE tidak ada. */
export function mapApiNotificationPreferences(
	row: ApiNotificationPreferences,
	base: NotificationPreferences
): NotificationPreferences {
	return {
		email: {
			newOrder: asBoolean(row.newOrder, base.email.newOrder),
			orderActionRequired: asBoolean(row.serviceUpdates, base.email.orderActionRequired),
			sessionReminder: asBoolean(row.sessionReminder, base.email.sessionReminder),
			newReview: asBoolean(row.newReview, base.email.newReview),
			payoutUpdates: asBoolean(row.payoutUpdates, base.email.payoutUpdates),
			weeklySummary: asBoolean(row.weeklySummary, base.email.weeklySummary)
		},
		inApp: {
			newOrder: asBoolean(row.newOrder, base.inApp.newOrder),
			orderActionRequired: asBoolean(row.serviceUpdates, base.inApp.orderActionRequired),
			sessionReminder: asBoolean(row.sessionReminder, base.inApp.sessionReminder),
			newReview: asBoolean(row.newReview, base.inApp.newReview),
			payoutUpdates: asBoolean(row.payoutUpdates, base.inApp.payoutUpdates)
		}
	};
}

/* ------------------------------- endpoints ------------------------------- */

export interface ListSellerNotificationsParams {
	limit?: number;
	cursor?: string | null;
	unread?: boolean;
}

/** Semua notifikasi seller (butuh sesi), terbaru lebih dulu; keyset + filter. */
export async function listSellerNotifications(
	params: ListSellerNotificationsParams = {}
): Promise<Paged<AppNotification>> {
	const res = await api<
		| { items?: ApiNotificationRow[]; nextCursor?: string | null; total?: number }
		| ApiNotificationRow[]
	>(`/seller/notifications${buildPageQuery(params)}`);
	const page = unwrapPage(res);
	return { ...page, items: page.items.map(mapApiNotification) };
}

/** Jumlah notifikasi yang belum dibaca. */
export async function getUnreadCount(): Promise<number> {
	const res = await api<{ unread?: number | null }>('/seller/notifications/unread-count');
	return Number(res?.unread ?? 0);
}

/** Tandai satu notifikasi sudah dibaca. */
export async function markNotificationRead(id: string): Promise<void> {
	await api(`/seller/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH', body: {} });
}

/** Tandai semua notifikasi sudah dibaca. */
export async function markAllNotificationsRead(): Promise<void> {
	await api('/seller/notifications/read-all', { method: 'PATCH', body: {} });
}

/** Preferensi notifikasi seller. */
export async function getNotificationPreferences(): Promise<ApiNotificationPreferences> {
	return api<ApiNotificationPreferences>('/seller/notification-preferences');
}

/** Perbarui preferensi notifikasi seller; mengembalikan preferensi terbaru. */
export async function updateNotificationPreferences(
	dto: ApiNotificationPreferencesDto
): Promise<ApiNotificationPreferences> {
	return api<ApiNotificationPreferences>('/seller/notification-preferences', {
		method: 'PATCH',
		body: dto
	});
}
