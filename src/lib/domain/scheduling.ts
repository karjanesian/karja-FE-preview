import { m } from '$lib/paraglide/messages.js';
import {
	SellerAvailability,
	WeeklyAvailability,
	TimeRange,
	Booking,
	Product,
	MeetingMethod
} from '$lib/types';

export const DEFAULT_WEEKLY_AVAILABILITY: WeeklyAvailability[] = [
	{
		day: 'senin',
		dayLabel: 'Senin',
		enabled: true,
		startTime: '19:00',
		endTime: '21:00',
		timeRanges: [{ startTime: '19:00', endTime: '21:00' }]
	},
	{
		day: 'selasa',
		dayLabel: 'Selasa',
		enabled: true,
		startTime: '19:00',
		endTime: '21:00',
		timeRanges: [{ startTime: '19:00', endTime: '21:00' }]
	},
	{
		day: 'rabu',
		dayLabel: 'Rabu',
		enabled: true,
		startTime: '19:00',
		endTime: '21:00',
		timeRanges: [{ startTime: '19:00', endTime: '21:00' }]
	},
	{
		day: 'kamis',
		dayLabel: 'Kamis',
		enabled: true,
		startTime: '19:00',
		endTime: '21:00',
		timeRanges: [{ startTime: '19:00', endTime: '21:00' }]
	},
	{
		day: 'jumat',
		dayLabel: 'Jumat',
		enabled: false,
		startTime: '19:00',
		endTime: '21:00',
		timeRanges: [{ startTime: '19:00', endTime: '21:00' }]
	},
	{
		day: 'sabtu',
		dayLabel: 'Sabtu',
		enabled: true,
		startTime: '09:00',
		endTime: '12:00',
		timeRanges: [{ startTime: '09:00', endTime: '12:00' }]
	},
	{
		day: 'minggu',
		dayLabel: 'Minggu',
		enabled: false,
		startTime: '09:00',
		endTime: '12:00',
		timeRanges: [{ startTime: '09:00', endTime: '12:00' }]
	}
];

export const DEFAULT_SELLER_AVAILABILITY: SellerAvailability = {
	timezone: 'Asia/Jakarta',
	weeklySchedule: DEFAULT_WEEKLY_AVAILABILITY
};

// Generate realistic mock Google Meet URL with random 3-4-3 slug (e.g. meet.google.com/abc-defg-hij)
export function generateMockMeetUrl(): string {
	const letters = 'abcdefghijklmnopqrstuvwxyz';
	const pick = (count: number) => {
		let res = '';
		for (let i = 0; i < count; i++) {
			res += letters[Math.floor(Math.random() * letters.length)];
		}
		return res;
	};
	return `https://meet.google.com/${pick(3)}-${pick(4)}-${pick(3)}`;
}

const DAY_KEYS = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'] as const;
const MONTH_KEYS = [
	'january',
	'february',
	'march',
	'april',
	'may',
	'june',
	'july',
	'august',
	'september',
	'october',
	'november',
	'december'
] as const;

function dayName(index: number): string {
	return dayLabelFor(DAY_KEYS[index]);
}

function monthName(index: number): string {
	switch (index) {
		case 0:
			return m.dt_january();
		case 1:
			return m.dt_february();
		case 2:
			return m.dt_march();
		case 3:
			return m.dt_april();
		case 4:
			return m.dt_may();
		case 5:
			return m.dt_june();
		case 6:
			return m.dt_july();
		case 7:
			return m.dt_august();
		case 8:
			return m.dt_september();
		case 9:
			return m.dt_october();
		case 10:
			return m.dt_november();
		default:
			return m.dt_december();
	}
}

/** Localized weekday label for a weekly-availability day key ('senin'..'minggu'). */
export function dayLabelFor(day: string | undefined): string {
	switch (day) {
		case 'minggu':
			return m.dt_sunday();
		case 'senin':
			return m.dt_monday();
		case 'selasa':
			return m.dt_tuesday();
		case 'rabu':
			return m.dt_wednesday();
		case 'kamis':
			return m.dt_thursday();
		case 'jumat':
			return m.dt_friday();
		case 'sabtu':
			return m.dt_saturday();
		default:
			return day ?? '';
	}
}

export function getDayKeyFromDate(
	date: Date
): 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu' {
	const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, ...
	const map: Record<number, 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu'> =
		{
			0: 'minggu',
			1: 'senin',
			2: 'selasa',
			3: 'rabu',
			4: 'kamis',
			5: 'jumat',
			6: 'sabtu'
		};
	return map[dayIndex];
}

export function formatDateIndonesian(date: Date): string {
	const day = dayName(date.getDay());
	const dayNum = date.getDate();
	const month = monthName(date.getMonth());
	const year = date.getFullYear();
	return `${day}, ${dayNum} ${month} ${year}`;
}

export function formatShortDateIndonesian(date: Date): string {
	const day = dayName(date.getDay()).slice(0, 3);
	const dayNum = date.getDate();
	return `${day} ${dayNum}`;
}

export function formatTimeRange(
	startTimeStr: string, // e.g. "19:30" or "19.30"
	durationMinutes: number = 20,
	timezoneLabel: string = 'WIB'
): string {
	const normalized = startTimeStr.replace('.', ':');
	const [hStr, mStr] = normalized.split(':');
	const startH = parseInt(hStr, 10) || 0;
	const startM = parseInt(mStr, 10) || 0;

	const startTotalMinutes = startH * 60 + startM;
	const endTotalMinutes = startTotalMinutes + durationMinutes;

	const endH = Math.floor(endTotalMinutes / 60) % 24;
	const endM = endTotalMinutes % 60;

	const pad = (n: number) => n.toString().padStart(2, '0');
	const displayStart = `${pad(startH)}.${pad(startM)}`;
	const displayEnd = `${pad(endH)}.${pad(endM)}`;

	return `${displayStart}–${displayEnd} ${timezoneLabel}`;
}

export interface AvailableDateOption {
	date: Date;
	dateString: string; // ISO YYYY-MM-DD
	dayLabel: string; // e.g. "Sen 24"
	fullLabel: string; // e.g. "Rabu, 26 Agustus 2026"
	isAvailable: boolean;
}

// Generate next bookable dates based on booking window & availability
export function getBookableDates(
	bookingWindowDays: number = 30,
	availability: SellerAvailability = DEFAULT_SELLER_AVAILABILITY,
	startDate?: Date
): AvailableDateOption[] {
	const result: AvailableDateOption[] = [];
	const base = startDate ? new Date(startDate) : new Date();

	// Normalize base to start of day
	base.setHours(0, 0, 0, 0);

	const scheduleMap = new Map<string, boolean>();
	(availability.weeklySchedule || DEFAULT_WEEKLY_AVAILABILITY).forEach((s) => {
		scheduleMap.set(s.day, s.enabled);
	});

	const count = Math.max(1, Math.min(bookingWindowDays || 30, 60));

	for (let i = 0; i < count; i++) {
		const current = new Date(base);
		current.setDate(base.getDate() + i);

		const dayKey = getDayKeyFromDate(current);
		const isDayEnabled = scheduleMap.get(dayKey) ?? false;

		const y = current.getFullYear();
		const m = String(current.getMonth() + 1).padStart(2, '0');
		const d = String(current.getDate()).padStart(2, '0');
		const dateString = `${y}-${m}-${d}`;

		result.push({
			date: current,
			dateString,
			dayLabel: formatShortDateIndonesian(current),
			fullLabel: formatDateIndonesian(current),
			isAvailable: isDayEnabled
		});
	}

	return result;
}

/**
 * Parses time string (e.g. "19:30" or "19.30") to minutes from 00:00
 */
export function parseTimeToMinutes(timeStr: string): number {
	if (!timeStr) return 0;
	const clean = timeStr.replace('.', ':');
	const [h, m] = clean.split(':').map(Number);
	return (h || 0) * 60 + (m || 0);
}

/**
 * Builds ISO-8601 start and end timestamp with timezone offset (+07:00 for WIB).
 */
export function buildSessionTimestamps(
	dateString: string, // YYYY-MM-DD
	timeSlot: string, // "19:30" or "19.30"
	durationMinutes: number
): { startAt: string; endAt: string; timeFormatted: string } {
	const [h, m] = timeSlot.replace('.', ':').split(':').map(Number);
	const startH = String(h).padStart(2, '0');
	const startM = String(m).padStart(2, '0');
	const startAt = `${dateString}T${startH}:${startM}:00+07:00`;

	const totalEndMin = h * 60 + m + durationMinutes;
	const endH = String(Math.floor(totalEndMin / 60) % 24).padStart(2, '0');
	const endM = String(totalEndMin % 60).padStart(2, '0');
	const endAt = `${dateString}T${endH}:${endM}:00+07:00`;

	const timeFormatted = formatTimeRange(timeSlot, durationMinutes, 'WIB');

	return { startAt, endAt, timeFormatted };
}

export interface FormattedDayScheduleGroup {
	dayGroup: string;
	timeRange: string;
}

/**
 * Formats a single TimeRange or an array of TimeRanges into Indonesian time string (e.g. 09.00–12.00)
 */
export function formatTimeRangeDisplay(
	rangeOrRanges:
		{ startTime?: string; endTime?: string } | { startTime?: string; endTime?: string }[]
): string {
	if (!rangeOrRanges) return '';
	if (Array.isArray(rangeOrRanges)) {
		if (rangeOrRanges.length === 0) return '';
		return rangeOrRanges
			.map((r) => formatTimeRangeDisplay(r))
			.filter(Boolean)
			.join(', ');
	}
	const start = (rangeOrRanges.startTime || '09:00').replace(':', '.');
	const end = (rangeOrRanges.endTime || '12:00').replace(':', '.');
	return `${start}–${end}`;
}

/**
 * Returns formatted time ranges for a single day schedule (e.g. "09.00–12.00, 13.00–16.00")
 */
export function formatDayTimeRanges(schedule: WeeklyAvailability): string {
	const ranges =
		schedule.timeRanges && schedule.timeRanges.length > 0
			? schedule.timeRanges
			: [{ startTime: schedule.startTime || '19:00', endTime: schedule.endTime || '21:00' }];
	return ranges.map(formatTimeRangeDisplay).join(', ');
}

/**
 * Intelligently groups active days sharing identical time ranges into human-readable Indonesian labels
 * e.g. "Sabtu–Minggu · 09.00–12.00" or "Senin, Rabu, Jumat · 19.00–21.00"
 */
export function formatWeeklyScheduleSummary(
	availability?: SellerAvailability
): FormattedDayScheduleGroup[] {
	const weekly = availability?.weeklySchedule || DEFAULT_WEEKLY_AVAILABILITY;
	const enabledDays = weekly.filter((d) => d.enabled);

	if (enabledDays.length === 0) {
		return [{ dayGroup: 'Belum ada jadwal.', timeRange: 'Aktifkan minimal satu hari dulu' }];
	}

	// Day ordering map: Senin (0) -> Minggu (6)
	const dayOrder: Record<string, number> = {
		senin: 0,
		selasa: 1,
		rabu: 2,
		kamis: 3,
		jumat: 4,
		sabtu: 5,
		minggu: 6
	};

	// Sort enabled days by natural Indonesian week order (Senin to Minggu)
	const sorted = [...enabledDays].sort((a, b) => (dayOrder[a.day] ?? 0) - (dayOrder[b.day] ?? 0));

	// Group by identical time range strings
	const groups: { timeRange: string; days: WeeklyAvailability[] }[] = [];

	sorted.forEach((day) => {
		const timeRangeStr = formatDayTimeRanges(day);
		const existing = groups.find((g) => g.timeRange === timeRangeStr);
		if (existing) {
			existing.days.push(day);
		} else {
			groups.push({ timeRange: timeRangeStr, days: [day] });
		}
	});

	return groups.map((g) => {
		const days = g.days;
		let dayGroupLabel = '';

		if (days.length === 1) {
			dayGroupLabel = dayLabelFor(days[0].day);
		} else if (days.length === 2) {
			const idx0 = dayOrder[days[0].day];
			const idx1 = dayOrder[days[1].day];
			if (idx1 === idx0 + 1) {
				dayGroupLabel = `${dayLabelFor(days[0].day)}–${dayLabelFor(days[1].day)}`;
			} else {
				dayGroupLabel = `${dayLabelFor(days[0].day)} & ${dayLabelFor(days[1].day)}`;
			}
		} else {
			// Check if days form a continuous sequence
			let isContinuous = true;
			for (let i = 1; i < days.length; i++) {
				if (dayOrder[days[i].day] !== dayOrder[days[i - 1].day] + 1) {
					isContinuous = false;
					break;
				}
			}

			if (isContinuous) {
				dayGroupLabel = `${dayLabelFor(days[0].day)}–${dayLabelFor(days[days.length - 1].day)}`;
			} else {
				dayGroupLabel = days.map((d) => dayLabelFor(d.day)).join(', ');
			}
		}

		return {
			dayGroup: dayGroupLabel,
			timeRange: g.timeRange
		};
	});
}

/**
 * Returns a human-readable one-line summary of product session booking rules
 * e.g. "Tanpa jeda antar sesi · Minimal pesan 6 jam sebelumnya · Bisa dipesan hingga 30 hari ke depan"
 */
export function formatBookingRulesSummary(product: Partial<Product>): string {
	const buffer = product.bufferMinutes ?? 0;
	const notice = product.minimumNoticeHours ?? 6;
	const windowDays = product.bookingWindowDays ?? 30;

	const bufferText = buffer === 0 ? 'Tanpa jeda antar sesi' : `Jeda ${buffer} menit`;
	const noticeText =
		notice === 24 ? 'Minimal pesan 1 hari sebelumnya' : `Minimal pesan ${notice} jam sebelumnya`;
	const windowText = `Bisa dipesan hingga ${windowDays} hari ke depan`;

	return `${bufferText} · ${noticeText} · ${windowText}`;
}

/**
 * Generate time slots for a specific date given product configuration, availability & existing bookings.
 * Enforces:
 * 1. Exact weekly schedule boundaries (supports multiple timeRanges per day)
 * 2. True Interval overlap collision check with existing bookings (including buffer) with explicit Asia/Jakarta (+07:00) parsing
 * 3. Minimum notice hours rule relative to current time
 * 4. Zero dangerous fallback slots
 */
export function getAvailableTimeSlotsForDate(
	date: Date,
	product: Partial<Product>,
	sellerAvailability: SellerAvailability = DEFAULT_SELLER_AVAILABILITY,
	existingBookings: Booking[] = [],
	now: Date = new Date()
): string[] {
	const effectiveAvailability =
		product.availabilityMode === 'custom' && product.customAvailability
			? product.customAvailability
			: sellerAvailability || DEFAULT_SELLER_AVAILABILITY;

	const dayKey = getDayKeyFromDate(date);
	const daySchedule = (effectiveAvailability.weeklySchedule || DEFAULT_WEEKLY_AVAILABILITY).find(
		(s) => s.day === dayKey
	);

	if (!daySchedule || !daySchedule.enabled) {
		return [];
	}

	const duration = product.sessionDurationMinutes || 20;
	const buffer = product.bufferMinutes ?? 0;
	const stepMinutes = duration + buffer;
	const minimumNoticeHours = product.minimumNoticeHours ?? 6;

	const ranges: TimeRange[] =
		daySchedule.timeRanges && daySchedule.timeRanges.length > 0
			? daySchedule.timeRanges
			: [{ startTime: daySchedule.startTime || '19:00', endTime: daySchedule.endTime || '21:00' }];

	const pad = (n: number) => n.toString().padStart(2, '0');
	const targetYear = date.getFullYear();
	const targetMonth = date.getMonth();
	const targetDay = date.getDate();
	const targetDatePrefix = `${targetYear}-${pad(targetMonth + 1)}-${pad(targetDay)}`;
	const targetIndoFull = formatDateIndonesian(date);

	// Collect booked interval ranges for this date in epoch milliseconds
	interface BookedInterval {
		startMs: number;
		endMs: number;
	}

	const bufferMs = buffer * 60 * 1000;
	const bookedIntervals: BookedInterval[] = [];

	existingBookings.forEach((b) => {
		if (b.status === 'cancelled') return;

		if (b.startAt && b.endAt) {
			const bStart = new Date(b.startAt).getTime();
			const bEnd = new Date(b.endAt).getTime();
			if (!isNaN(bStart) && !isNaN(bEnd)) {
				bookedIntervals.push({
					startMs: bStart - bufferMs,
					endMs: bEnd + bufferMs
				});
				return;
			}
		}

		// Fallback if ISO timestamp is missing but matching date
		const isMatchingDate =
			(b.startAt && b.startAt.startsWith(targetDatePrefix)) ||
			(b.dateFormatted && b.dateFormatted === targetIndoFull);

		if (isMatchingDate && b.timeSlot) {
			const slotMin = parseTimeToMinutes(b.timeSlot);
			const bDuration = b.durationMinutes || duration;
			const bStartMs = new Date(
				`${targetDatePrefix}T${pad(Math.floor(slotMin / 60))}:${pad(slotMin % 60)}:00+07:00`
			).getTime();
			const bEndMs = bStartMs + bDuration * 60 * 1000;
			bookedIntervals.push({
				startMs: bStartMs - bufferMs,
				endMs: bEndMs + bufferMs
			});
		}
	});

	const minimumNoticeMs = minimumNoticeHours * 60 * 60 * 1000;
	const nowMs = now.getTime();
	const slotsSet = new Set<string>();

	// Iterate over each time range for this day
	for (const range of ranges) {
		if (!range.startTime || !range.endTime) continue;
		const startMinutes = parseTimeToMinutes(range.startTime);
		const endMinutes = parseTimeToMinutes(range.endTime);

		// If this specific range cannot accommodate even one session duration, continue
		if (startMinutes + duration > endMinutes) {
			continue;
		}

		for (let current = startMinutes; current + duration <= endMinutes; current += stepMinutes) {
			const h = Math.floor(current / 60);
			const min = current % 60;
			const timeIsoString = `${targetDatePrefix}T${pad(h)}:${pad(min)}:00+07:00`;
			const candidateStartMs = new Date(timeIsoString).getTime();
			const candidateEndMs = candidateStartMs + duration * 60 * 1000;

			// 1. Minimum Notice Check: Cannot book slots that are less than minimumNoticeHours from now
			if (candidateStartMs - nowMs < minimumNoticeMs) {
				continue;
			}

			// 2. Interval Collision Check: (candidateStart < bookedEnd && candidateEnd > bookedStart)
			const hasCollision = bookedIntervals.some((interval) => {
				return candidateStartMs < interval.endMs && candidateEndMs > interval.startMs;
			});

			if (!hasCollision) {
				slotsSet.add(`${pad(h)}:${pad(min)}`);
			}
		}
	}

	// Sort slots in chronological order
	return Array.from(slotsSet).sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));
}

/**
 * Validates whether a specific slot is available at the moment of booking/rescheduling.
 */
export function validateSlotAvailability(
	dateString: string, // "YYYY-MM-DD"
	timeSlot: string, // "19:30" or "19.30"
	product: Product,
	sellerAvailability: SellerAvailability = DEFAULT_SELLER_AVAILABILITY,
	existingBookings: Booking[] = [],
	excludeBookingId?: string,
	now: Date = new Date()
): { valid: boolean; reason?: string } {
	const parts = dateString.split('-').map(Number);
	if (parts.length !== 3) {
		return { valid: false, reason: 'Format tanggal tidak valid.' };
	}
	const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);

	const filteredBookings = excludeBookingId
		? existingBookings.filter((b) => b.id !== excludeBookingId)
		: existingBookings;

	const availableSlots = getAvailableTimeSlotsForDate(
		dateObj,
		product,
		sellerAvailability,
		filteredBookings,
		now
	);

	const normalizedSlot = timeSlot.replace('.', ':');
	const isAvailable = availableSlots.some(
		(s) => s === normalizedSlot || s.replace('.', ':') === normalizedSlot
	);

	if (!isAvailable) {
		return {
			valid: false,
			reason: 'Waktu itu udah terisi atau nggak memenuhi batas booking.'
		};
	}

	return { valid: true };
}

/**
 * Helper to retrieve booking linked to an order
 */
export function getBookingForOrder(orderId: string, bookings: Booking[] = []): Booking | undefined {
	return bookings.find((b) => b.orderId === orderId);
}
