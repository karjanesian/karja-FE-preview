<script lang="ts">
	import { goto } from '$app/navigation';
	import { seller } from '$lib/stores/seller.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import {
		DEFAULT_WEEKLY_AVAILABILITY,
		formatDateIndonesian,
		formatTimeRangeDisplay,
		formatWeeklyScheduleSummary,
		getAvailableTimeSlotsForDate,
		dayLabelFor
	} from '$lib/domain/scheduling';
	import {
		normalizeProductType,
		type SellerAvailability,
		type TimeRange,
		type WeeklyAvailability
	} from '$lib/types';
	import Check from 'lucide-svelte/icons/check';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Video from 'lucide-svelte/icons/video';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Mail from 'lucide-svelte/icons/mail';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	import Link2 from 'lucide-svelte/icons/link-2';
	import Clock from 'lucide-svelte/icons/clock';
	import Globe from 'lucide-svelte/icons/globe';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Copy from 'lucide-svelte/icons/copy';
	import Plus from 'lucide-svelte/icons/plus';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import ChevronUp from 'lucide-svelte/icons/chevron-up';
	import CircleAlert from 'lucide-svelte/icons/circle-alert';
	import Save from 'lucide-svelte/icons/save';
	import X from 'lucide-svelte/icons/x';

	type Props = { onToast: (msg: string) => void };
	let { onToast }: Props = $props();

	const profile = $derived(seller.sellerProfile);
	const draftProduct = $derived(
		seller.products.find(
			(p) => p && p.status === 'draft' && normalizeProductType(p.type) === 'session'
		)
	);
	const hasDraftToResume = $derived(Boolean(draftProduct));

	function normalizeInitialAvailability(raw?: SellerAvailability): SellerAvailability {
		const base = raw?.weeklySchedule || DEFAULT_WEEKLY_AVAILABILITY;
		const normalized: WeeklyAvailability[] = base.map((day) => {
			const ranges: TimeRange[] =
				day.timeRanges && day.timeRanges.length > 0
					? day.timeRanges.map((r) => ({ ...r }))
					: [{ startTime: day.startTime || '19:00', endTime: day.endTime || '21:00' }];
			return {
				...day,
				timeRanges: ranges,
				startTime: ranges[0]?.startTime || day.startTime || '19:00',
				endTime: ranges[0]?.endTime || day.endTime || '21:00'
			};
		});
		return {
			timezone: raw?.timezone || 'Asia/Jakarta',
			weeklySchedule: normalized
		};
	}

	let availability: SellerAvailability = $state(
		normalizeInitialAvailability(seller.sellerProfile.availability)
	);

	let copySourceDay: WeeklyAvailability | null = $state(null);
	let selectedTargetDays: string[] = $state([]);

	let showAdvancedBookingSettings = $state(false);
	let defaultBufferMinutes = $state(0);
	let defaultMinimumNoticeHours = $state(6);
	let defaultBookingWindowDays = $state(30);

	let connectingModal = $state(false);

	const email = $derived(profile.email || 'seller@karja.id');
	const isCalendarConnected = $derived(profile.calendarIntegration?.status === 'connected');

	function parseTimeToMin(timeStr: string): number {
		if (!timeStr) return 0;
		const [h, mi] = timeStr.split(':').map(Number);
		return (h || 0) * 60 + (mi || 0);
	}

	function getDayValidationWarning(ranges: TimeRange[]): string | null {
		for (const r of ranges) {
			if (!r.startTime || !r.endTime) continue;
			if (parseTimeToMin(r.startTime) >= parseTimeToMin(r.endTime)) {
				return m.se_err_end_after_start();
			}
		}
		for (let i = 0; i < ranges.length; i++) {
			for (let j = i + 1; j < ranges.length; j++) {
				const s1 = parseTimeToMin(ranges[i].startTime);
				const e1 = parseTimeToMin(ranges[i].endTime);
				const s2 = parseTimeToMin(ranges[j].startTime);
				const e2 = parseTimeToMin(ranges[j].endTime);
				if (s1 < e2 && s2 < e1) {
					return m.se_err_overlap();
				}
			}
		}
		return null;
	}

	function rangesOf(
		day: WeeklyAvailability,
		fallbackStart = '19:00',
		fallbackEnd = '21:00'
	): TimeRange[] {
		return day.timeRanges && day.timeRanges.length > 0
			? day.timeRanges
			: [{ startTime: day.startTime || fallbackStart, endTime: day.endTime || fallbackEnd }];
	}

	function validateAvailability(): boolean {
		for (const d of availability.weeklySchedule.filter((x) => x.enabled)) {
			const err = getDayValidationWarning(rangesOf(d));
			if (err) {
				onToast(m.se_toast_day_error({ day: dayLabelFor(d.day), error: err }));
				return false;
			}
		}
		return true;
	}

	function handleSaveAvailability() {
		if (!validateAvailability()) return;
		seller.updateProfile({ availability });
		onToast(m.se_toast_schedule_saved());
	}

	function handleSaveAvailabilityAndResume() {
		if (!validateAvailability()) return;
		seller.updateProfile({ availability });
		onToast(m.se_toast_schedule_saved());
		if (draftProduct) {
			seller.updateProduct({
				...draftProduct,
				bufferMinutes: defaultBufferMinutes,
				minimumNoticeHours: defaultMinimumNoticeHours,
				bookingWindowDays: defaultBookingWindowDays
			});
			const productId = draftProduct.id;
			setTimeout(() => void goto(`/dashboard/products/${productId}/edit`), 150);
		}
	}

	function handleToggleDay(dayIndex: number) {
		const nextSchedule = [...availability.weeklySchedule];
		const current = nextSchedule[dayIndex];
		const willEnable = !current.enabled;
		const ranges = rangesOf(current, '09:00', '12:00');

		nextSchedule[dayIndex] = {
			...current,
			enabled: willEnable,
			timeRanges: ranges,
			startTime: ranges[0]?.startTime || '09:00',
			endTime: ranges[0]?.endTime || '12:00'
		};
		availability = { ...availability, weeklySchedule: nextSchedule };
	}

	function handleRangeTimeChange(
		dayIndex: number,
		rangeIndex: number,
		field: 'startTime' | 'endTime',
		value: string
	) {
		const nextSchedule = [...availability.weeklySchedule];
		const day = nextSchedule[dayIndex];
		const currentRanges = rangesOf(day).map((r) => ({ ...r }));

		currentRanges[rangeIndex] = { ...currentRanges[rangeIndex], [field]: value };

		nextSchedule[dayIndex] = {
			...day,
			timeRanges: currentRanges,
			startTime: currentRanges[0]?.startTime || day.startTime,
			endTime: currentRanges[0]?.endTime || day.endTime
		};
		availability = { ...availability, weeklySchedule: nextSchedule };
	}

	function handleAddRange(dayIndex: number) {
		const nextSchedule = [...availability.weeklySchedule];
		const day = nextSchedule[dayIndex];
		const currentRanges = rangesOf(day, '09:00', '12:00').map((r) => ({ ...r }));

		const lastRange = currentRanges[currentRanges.length - 1];
		const lastEndMin = parseTimeToMin(lastRange?.endTime || '12:00');
		let nextStart: string;
		let nextEnd: string;

		if (lastEndMin <= parseTimeToMin('12:00')) {
			nextStart = '13:00';
			nextEnd = '16:00';
		} else if (lastEndMin <= parseTimeToMin('17:00')) {
			nextStart = '18:00';
			nextEnd = '21:00';
		} else {
			nextStart = '21:00';
			nextEnd = '22:00';
		}

		currentRanges.push({ startTime: nextStart, endTime: nextEnd });

		nextSchedule[dayIndex] = {
			...day,
			timeRanges: currentRanges,
			startTime: currentRanges[0]?.startTime || day.startTime,
			endTime: currentRanges[0]?.endTime || day.endTime
		};
		availability = { ...availability, weeklySchedule: nextSchedule };
	}

	function handleRemoveRange(dayIndex: number, rangeIndex: number) {
		const nextSchedule = [...availability.weeklySchedule];
		const day = nextSchedule[dayIndex];
		const currentRanges = rangesOf(day).map((r) => ({ ...r }));

		if (currentRanges.length > 1) {
			currentRanges.splice(rangeIndex, 1);
			nextSchedule[dayIndex] = {
				...day,
				timeRanges: currentRanges,
				startTime: currentRanges[0]?.startTime || '19:00',
				endTime: currentRanges[0]?.endTime || '21:00'
			};
		} else {
			nextSchedule[dayIndex] = { ...day, enabled: false };
		}
		availability = { ...availability, weeklySchedule: nextSchedule };
	}

	function handleApplyWeekdays() {
		const monday = availability.weeklySchedule.find((d) => d.day === 'senin');
		const mondayRanges = rangesOf(monday ?? ({} as WeeklyAvailability));

		const nextSchedule = availability.weeklySchedule.map((day) => {
			if (['senin', 'selasa', 'rabu', 'kamis', 'jumat'].includes(day.day)) {
				return {
					...day,
					enabled: true,
					timeRanges: mondayRanges.map((r) => ({ ...r })),
					startTime: mondayRanges[0]?.startTime || '19:00',
					endTime: mondayRanges[0]?.endTime || '21:00'
				};
			}
			return day;
		});
		availability = { ...availability, weeklySchedule: nextSchedule };
		onToast(m.se_toast_weekdays_copied());
	}

	function handleOpenCopyModal(day: WeeklyAvailability) {
		copySourceDay = day;
		selectedTargetDays = [];
	}

	function handleApplyCopySchedule() {
		if (!copySourceDay || selectedTargetDays.length === 0) {
			copySourceDay = null;
			return;
		}
		const sourceRanges = rangesOf(copySourceDay);

		const nextSchedule = availability.weeklySchedule.map((day) => {
			if (selectedTargetDays.includes(day.day)) {
				return {
					...day,
					enabled: true,
					timeRanges: sourceRanges.map((r) => ({ ...r })),
					startTime: sourceRanges[0]?.startTime || '19:00',
					endTime: sourceRanges[0]?.endTime || '21:00'
				};
			}
			return day;
		});

		availability = { ...availability, weeklySchedule: nextSchedule };
		const count = selectedTargetDays.length;
		const dayLabel = dayLabelFor(copySourceDay.day);
		onToast(m.se_toast_days_copied({ day: dayLabel, count }));
		copySourceDay = null;
		selectedTargetDays = [];
	}

	function handleToggleGoogleCalendar() {
		connectingModal = true;
		// TODO Backend Phase 0
		setTimeout(() => {
			connectingModal = false;
			const isCurrentlyConnected = profile.calendarIntegration?.status === 'connected';
			seller.updateProfile({
				calendarIntegration: {
					provider: 'google',
					status: isCurrentlyConnected ? 'disconnected' : 'connected',
					connectedEmail: isCurrentlyConnected ? undefined : email,
					autoGenerateMeetingLink: !isCurrentlyConnected,
					syncAvailability: !isCurrentlyConnected
				}
			});
			onToast(
				isCurrentlyConnected ? m.se_toast_calendar_disconnected() : m.se_toast_calendar_connected()
			);
		}, 600);
	}

	const previewInfo = $derived.by(() => {
		void availability;
		const now = new Date();
		const dayMap: Record<number, string> = {
			0: 'minggu',
			1: 'senin',
			2: 'selasa',
			3: 'rabu',
			4: 'kamis',
			5: 'jumat',
			6: 'sabtu'
		};

		for (let offset = 1; offset <= 14; offset++) {
			const candidate = new Date(now.getTime() + offset * 24 * 60 * 60 * 1000);
			const dayKey = dayMap[candidate.getDay()];
			const schedule = availability.weeklySchedule.find((d) => d.day === dayKey);
			if (schedule?.enabled) {
				const dummyProduct = {
					sessionDurationMinutes: draftProduct?.sessionDurationMinutes || 30,
					bufferMinutes: defaultBufferMinutes,
					minimumNoticeHours: defaultMinimumNoticeHours,
					bookingWindowDays: defaultBookingWindowDays
				};
				const slots = getAvailableTimeSlotsForDate(
					candidate,
					dummyProduct,
					availability,
					seller.bookings
				);
				return {
					dateFormatted: formatDateIndonesian(candidate),
					slots,
					duration: dummyProduct.sessionDurationMinutes
				};
			}
		}
		return null;
	});

	const scheduleSummary = $derived(formatWeeklyScheduleSummary(availability));
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape' && copySourceDay) copySourceDay = null;
	}}
/>

<div class="space-y-6">
	{#if hasDraftToResume && draftProduct}
		<div
			class="flex flex-col justify-between gap-3 rounded-2xl border border-[#CCE6D6] bg-[#EAF8F0] p-4 shadow-xs sm:flex-row sm:items-center"
		>
			<div class="flex items-center gap-3">
				<div
					class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#CCE6D6] bg-white font-bold text-[#0C7B58]"
				>
					<Calendar class="h-4 w-4 text-[#0C7B58]" />
				</div>
				<div>
					<h4 class="text-xs font-bold text-[#0E2E25]">{m.se_draft_banner_title()}</h4>
					<p class="text-xs text-[#52776C]">{m.se_draft_banner_desc()}</p>
				</div>
			</div>
			<div class="flex shrink-0 flex-wrap items-center gap-2 self-start sm:self-auto">
				<button
					type="button"
					onclick={() => void goto(`/dashboard/products/${draftProduct.id}/edit`)}
					class="cursor-pointer rounded-xl border border-[#CCE6D6] bg-white px-4 py-2 text-xs font-semibold text-[#0C7B58] transition-colors hover:bg-[#F2FAF6]"
				>
					{m.se_btn_resume_draft()}
				</button>
				<button
					type="button"
					onclick={handleSaveAvailabilityAndResume}
					class="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0C7B58] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#096649]"
				>
					<span>{m.se_btn_save_resume()}</span>
					<ArrowRight class="h-3.5 w-3.5" />
				</button>
			</div>
		</div>
	{/if}

	<div class="space-y-5 rounded-2xl border border-[#E2E8E4] bg-white p-6 shadow-xs sm:p-7">
		<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
			<div class="flex items-start gap-3.5">
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D8DFDC] bg-[#F0F5F2] text-[#0C7B58]"
				>
					<Video class="h-5 w-5 stroke-[1.75]" />
				</div>
				<div>
					<div class="flex items-center gap-2">
						<h3 class="text-sm font-bold text-[#0E2E25]">{m.se_gcal_title()}</h3>
						{#if isCalendarConnected}
							<span
								class="inline-flex items-center gap-1 rounded-md border border-[#CCE6D6] bg-[#EAF8F0] px-2 py-0.5 text-[11px] font-medium text-[#0C7B58]"
							>
								<CheckCircle class="h-3 w-3 text-[#0C7B58]" />
								{m.se_gcal_connected()}
							</span>
						{:else}
							<span
								class="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-500"
							>
								{m.se_gcal_not_connected()}
							</span>
						{/if}
					</div>
					<p class="mt-1 max-w-xl text-xs leading-relaxed text-[#52776C]">{m.se_gcal_desc()}</p>
				</div>
			</div>

			<button
				onclick={handleToggleGoogleCalendar}
				disabled={connectingModal}
				class="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors {isCalendarConnected
					? 'border border-[#D8DFDC] bg-white text-rose-700 hover:bg-rose-50'
					: 'bg-[#0C7B58] text-white shadow-xs hover:bg-[#096649]'}"
			>
				{#if connectingModal}
					<RefreshCw class="h-3.5 w-3.5 animate-spin" />
					<span>{m.se_gcal_connecting()}</span>
				{:else if isCalendarConnected}
					<Link2 class="h-3.5 w-3.5" />
					<span>{m.se_gcal_disconnect()}</span>
				{:else}
					<Link2 class="h-3.5 w-3.5" />
					<span>{m.se_gcal_title()}</span>
				{/if}
			</button>
		</div>

		{#if isCalendarConnected}
			<div
				class="flex flex-col justify-between gap-3 rounded-xl border border-[#E2E8E4] bg-white p-3.5 text-xs sm:flex-row sm:items-center"
			>
				<div class="flex items-start gap-2.5 text-[#0E2E25]">
					<Mail class="mt-0.5 h-4 w-4 shrink-0 text-[#0C7B58]" />
					<div>
						<div class="flex flex-wrap items-center gap-2">
							<span class="font-semibold text-[#0E2E25]">{m.se_gcal_connected_to()}</span>
							<span class="font-medium text-[#52776C]">
								{profile.calendarIntegration?.connectedEmail || email}
							</span>
						</div>
						<p class="mt-0.5 text-[11px] text-[#52776C]">{m.se_gcal_conflict_note()}</p>
					</div>
				</div>
				<span
					class="inline-flex shrink-0 items-center gap-1.5 self-start rounded-md border border-[#CCE6D6] bg-[#EAF8F0] px-2 py-0.5 text-[11px] font-medium text-[#0C7B58] sm:self-auto"
				>
					<span class="h-1.5 w-1.5 rounded-full bg-[#0C7B58]"></span>
					{m.se_gcal_connected()}
				</span>
			</div>
		{/if}
	</div>

	<div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
		<div
			class="space-y-6 rounded-2xl border border-[#E2E8E4] bg-white p-6 shadow-xs sm:p-7 lg:col-span-8"
		>
			<div
				class="flex flex-col justify-between gap-3 border-b border-[#F0F4F2] pb-4 sm:flex-row sm:items-center"
			>
				<div>
					<h3 class="text-sm font-bold text-[#0E2E25]">{m.se_sched_title()}</h3>
					<p class="mt-0.5 text-xs leading-relaxed text-[#52776C]">{m.se_sched_desc()}</p>
				</div>

				<button
					type="button"
					onclick={handleApplyWeekdays}
					class="self-start rounded-lg border border-[#CCE6D6] bg-[#EAF8F0] px-3 py-1.5 text-xs font-semibold text-[#0C7B58] transition-colors hover:text-[#096649] sm:self-auto"
				>
					{m.se_btn_apply_weekdays()}
				</button>
			</div>

			<div class="space-y-3">
				{#each availability.weeklySchedule as day, idx (day.day)}
					{@const ranges = rangesOf(day, '09:00', '12:00')}
					{@const dayWarning = day.enabled ? getDayValidationWarning(ranges) : null}
					<div
						class="rounded-xl border p-4 transition-colors {day.enabled
							? 'space-y-3 border-[#D8DFDC] bg-white'
							: 'flex items-center justify-between border-gray-200 bg-gray-50/70'}"
					>
						<div class="flex items-center justify-between gap-3">
							<div class="flex items-center gap-3">
								<input
									type="checkbox"
									id={`day-${day.day}`}
									checked={day.enabled}
									onchange={() => handleToggleDay(idx)}
									class="h-4 w-4 cursor-pointer rounded accent-[#0C7B58]"
								/>
								<label
									for={`day-${day.day}`}
									class="cursor-pointer text-xs font-bold text-[#0E2E25] select-none"
								>
									{dayLabelFor(day.day)}
								</label>
							</div>

							{#if !day.enabled}
								<div class="flex items-center gap-3">
									<span class="text-xs font-medium text-gray-400">{m.se_day_inactive()}</span>
									<button
										type="button"
										onclick={() => handleToggleDay(idx)}
										class="cursor-pointer rounded-lg border border-[#CCE6D6] bg-[#EAF8F0] px-2.5 py-1 text-xs font-semibold text-[#0C7B58] transition-colors hover:text-[#096649]"
									>
										{m.se_btn_enable()}
									</button>
								</div>
							{:else}
								<div class="flex items-center gap-2">
									<button
										type="button"
										onclick={() => handleOpenCopyModal(day)}
										title={m.se_copy_day_title()}
										class="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-[#52776C] transition-colors hover:border-[#CCE6D6] hover:bg-[#EAF8F0] hover:text-[#0C7B58]"
									>
										<Copy class="h-3 w-3" />
										<span>{m.se_btn_copy_day()}</span>
									</button>
								</div>
							{/if}
						</div>

						{#if day.enabled}
							<div class="space-y-2.5 border-t border-[#F0F4F2] pt-2">
								<div class="space-y-2">
									{#each ranges as r, rIdx (rIdx)}
										<div class="flex flex-wrap items-center gap-2">
											<div
												class="inline-flex items-center gap-1.5 rounded-xl border border-[#D8DFDC] bg-white px-2.5 py-1.5 transition-colors focus-within:border-[#0C7B58] focus-within:ring-1 focus-within:ring-[#0C7B58]/10"
											>
												<Clock class="h-3.5 w-3.5 text-[#52776C]" />
												<input
													type="time"
													value={r.startTime}
													oninput={(e) =>
														handleRangeTimeChange(idx, rIdx, 'startTime', e.currentTarget.value)}
													class="cursor-pointer bg-transparent text-xs font-semibold text-[#0E2E25] focus:outline-none"
													aria-label={`${dayLabelFor(day.day)} · ${m.se_time_start()}`}
												/>
												<span class="px-0.5 text-xs font-medium text-gray-400">—</span>
												<input
													type="time"
													value={r.endTime}
													oninput={(e) =>
														handleRangeTimeChange(idx, rIdx, 'endTime', e.currentTarget.value)}
													class="cursor-pointer bg-transparent text-xs font-semibold text-[#0E2E25] focus:outline-none"
													aria-label={`${dayLabelFor(day.day)} · ${m.se_time_end()}`}
												/>
												<span class="ml-1 text-[10px] font-medium text-[#52776C]">{m.se_wib()}</span
												>
											</div>

											{#if ranges.length > 1}
												<button
													type="button"
													onclick={() => handleRemoveRange(idx, rIdx)}
													title={m.se_btn_remove_range_title()}
													class="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
												>
													<Trash2 class="h-3.5 w-3.5" />
												</button>
											{/if}
										</div>
									{/each}
								</div>

								{#if dayWarning}
									<div class="flex items-center gap-1 pt-0.5 text-[11px] font-medium text-rose-600">
										<CircleAlert class="h-3.5 w-3.5 shrink-0" />
										<span>{dayWarning}</span>
									</div>
								{/if}

								<div class="pt-1">
									<button
										type="button"
										onclick={() => handleAddRange(idx)}
										class="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#CCE6D6] bg-[#EAF8F0] px-2.5 py-1.5 text-[11px] font-semibold text-[#0C7B58] transition-colors hover:text-[#096649]"
									>
										<Plus class="h-3 w-3" />
										<span>{m.se_btn_add_range()}</span>
									</button>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>

			{#if draftProduct}
				<div class="space-y-3 rounded-xl border border-[#E2E8E4] bg-white p-4">
					<div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
						<div>
							<h4 class="text-xs font-bold text-[#0E2E25]">{m.se_advanced_title()}</h4>
							<p class="text-[11px] text-[#52776C]">{m.se_advanced_desc()}</p>
						</div>
						<button
							type="button"
							onclick={() => (showAdvancedBookingSettings = !showAdvancedBookingSettings)}
							class="inline-flex cursor-pointer items-center gap-1 self-start py-1 text-xs font-semibold text-[#0C7B58] hover:text-[#096649] sm:self-auto"
						>
							<span>
								{showAdvancedBookingSettings ? m.se_advanced_hide() : m.se_advanced_title()}
							</span>
							{#if showAdvancedBookingSettings}
								<ChevronUp class="h-3.5 w-3.5" />
							{:else}
								<ChevronDown class="h-3.5 w-3.5" />
							{/if}
						</button>
					</div>

					{#if showAdvancedBookingSettings}
						<div class="space-y-4 border-t border-[#F0F4F2] pt-3">
							<div class="space-y-1.5">
								<div class="flex items-center justify-between">
									<label class="text-xs font-semibold text-[#0E2E25]" for="buffer-hours">
										{m.se_buffer_label()}
									</label>
									<span class="text-[11px] font-semibold text-[#0C7B58]">
										{defaultBufferMinutes === 0
											? m.se_buffer_none()
											: m.se_minutes({ n: defaultBufferMinutes })}
									</span>
								</div>
								<p class="text-[11px] text-[#52776C]">{m.se_buffer_desc()}</p>
								<div id="buffer-hours" class="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-4">
									{#each [0, 10, 15, 30] as value (value)}
										<button
											type="button"
											onclick={() => (defaultBufferMinutes = value)}
											class="cursor-pointer rounded-xl border px-3 py-2 text-center text-xs font-semibold transition-colors {defaultBufferMinutes ===
											value
												? 'border-[#0C7B58] bg-[#EAF8F0] text-[#0C7B58]'
												: 'border-[#D8DFDC] bg-white text-[#52776C] hover:border-gray-400'}"
										>
											{value === 0 ? m.se_buffer_none() : m.se_minutes({ n: value })}
										</button>
									{/each}
								</div>
							</div>

							<div class="space-y-1.5 pt-1">
								<div class="flex items-center justify-between">
									<span class="text-xs font-semibold text-[#0E2E25]" id="notice-label">
										{m.se_notice_label()}
									</span>
									<span class="text-[11px] font-semibold text-[#0C7B58]">
										{defaultMinimumNoticeHours === 24
											? m.se_one_day_before()
											: m.se_hours_before({ n: defaultMinimumNoticeHours })}
									</span>
								</div>
								<p class="text-[11px] text-[#52776C]">{m.se_notice_desc()}</p>
								<div
									class="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-4"
									role="group"
									aria-labelledby="notice-label"
								>
									{#each [2, 6, 12, 24] as value (value)}
										<button
											type="button"
											onclick={() => (defaultMinimumNoticeHours = value)}
											class="cursor-pointer rounded-xl border px-3 py-2 text-center text-xs font-semibold transition-colors {defaultMinimumNoticeHours ===
											value
												? 'border-[#0C7B58] bg-[#EAF8F0] text-[#0C7B58]'
												: 'border-[#D8DFDC] bg-white text-[#52776C] hover:border-gray-400'}"
										>
											{value === 24 ? m.se_one_day_before() : m.se_hours_before({ n: value })}
										</button>
									{/each}
								</div>
							</div>

							<div class="space-y-1.5 pt-1">
								<div class="flex items-center justify-between">
									<span class="text-xs font-semibold text-[#0E2E25]" id="window-label">
										{m.se_window_label()}
									</span>
									<span class="text-[11px] font-semibold text-[#0C7B58]">
										{m.se_days_ahead({ n: defaultBookingWindowDays })}
									</span>
								</div>
								<div
									class="grid grid-cols-3 gap-2 pt-1"
									role="group"
									aria-labelledby="window-label"
								>
									{#each [14, 30, 60] as value (value)}
										<button
											type="button"
											onclick={() => (defaultBookingWindowDays = value)}
											class="cursor-pointer rounded-xl border px-3 py-2 text-center text-xs font-semibold transition-colors {defaultBookingWindowDays ===
											value
												? 'border-[#0C7B58] bg-[#EAF8F0] text-[#0C7B58]'
												: 'border-[#D8DFDC] bg-white text-[#52776C] hover:border-gray-400'}"
										>
											{m.se_days_ahead({ n: value })}
										</button>
									{/each}
								</div>
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<div
				class="flex flex-col justify-between gap-3 border-t border-[#F0F4F2] pt-3 sm:flex-row sm:items-center"
			>
				<div class="flex items-center gap-1.5 text-xs text-[#52776C]">
					<Globe class="h-4 w-4 text-[#52776C]" />
					<span>{m.se_timezone_label()} <strong>{m.se_wib()}</strong></span>
				</div>

				<div class="flex items-center gap-2">
					{#if hasDraftToResume}
						<button
							type="button"
							onclick={handleSaveAvailabilityAndResume}
							class="flex cursor-pointer items-center gap-2 rounded-xl bg-[#0C7B58] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#096649]"
						>
							<Check class="h-4 w-4 text-white" />
							<span>{m.se_btn_save_resume()}</span>
							<ArrowRight class="h-3.5 w-3.5" />
						</button>
					{:else}
						<button
							type="button"
							onclick={handleSaveAvailability}
							class="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0C7B58] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#096649]"
						>
							<Save class="h-4 w-4" />
							<span>{m.se_btn_save_schedule()}</span>
						</button>
					{/if}
				</div>
			</div>
		</div>

		<div class="space-y-4 lg:col-span-4">
			{#if draftProduct}
				<div
					class="sticky top-6 space-y-4 rounded-2xl border border-[#E2E8E4] bg-white p-5 shadow-xs"
				>
					<div class="flex items-center justify-between">
						<span class="text-[11px] font-bold tracking-wider text-[#52776C] uppercase">
							{m.se_preview_eyebrow()}
						</span>
						<span
							class="rounded-md border border-[#CCE6D6] bg-[#EAF8F0] px-2 py-0.5 text-[11px] font-semibold text-[#0C7B58]"
						>
							{m.se_preview_badge()}
						</span>
					</div>

					<div class="space-y-1">
						<h4 class="text-sm font-bold text-[#0E2E25]">
							{draftProduct.title || m.se_preview_default_title()}
						</h4>
						<div class="flex items-center gap-1.5 text-xs font-medium text-[#52776C]">
							<Clock class="h-3.5 w-3.5 text-[#52776C]" />
							<span
								>{m.se_session_minutes({
									n: previewInfo?.duration || draftProduct.sessionDurationMinutes || 30
								})}</span
							>
						</div>
					</div>

					<div class="space-y-2.5 rounded-xl border border-[#E2E8E4] bg-white p-3">
						<div class="flex items-center justify-between text-xs font-bold text-[#0E2E25]">
							<span>{previewInfo?.dateFormatted || m.se_preview_no_date()}</span>
						</div>

						{#if previewInfo && previewInfo.slots.length > 0}
							<div class="grid grid-cols-3 gap-1.5">
								{#each previewInfo.slots.slice(0, 9) as slot, sIdx (sIdx)}
									<div
										class="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-center text-xs font-semibold text-[#0E2E25]"
									>
										{slot}
									</div>
								{/each}
							</div>
						{:else}
							<div class="py-2 text-center text-xs text-gray-400 italic">
								{m.se_preview_no_slots()}
							</div>
						{/if}
					</div>
				</div>
			{:else}
				<div
					class="sticky top-6 space-y-4 rounded-2xl border border-[#E2E8E4] bg-white p-5 shadow-xs"
				>
					<div class="flex items-center justify-between">
						<span class="text-[11px] font-bold tracking-wider text-[#52776C] uppercase">
							{m.se_summary_title()}
						</span>
						<span
							class="rounded-md border border-[#CCE6D6] bg-[#EAF8F0] px-2 py-0.5 text-[11px] font-semibold text-[#0C7B58]"
						>
							{m.se_summary_active()}
						</span>
					</div>

					<div class="space-y-2">
						{#each scheduleSummary as group, gIdx (gIdx)}
							<div
								class="flex items-center justify-between rounded-xl border border-[#E2E8E4] bg-white p-2.5 text-xs"
							>
								<span class="font-semibold text-[#0E2E25]">{group.dayGroup}</span>
								<span class="font-mono text-[#52776C]">{group.timeRange} {m.se_wib()}</span>
							</div>
						{/each}
					</div>

					<div
						class="space-y-1 rounded-xl border border-[#E2E8E4] bg-white p-3 text-xs text-[#52776C]"
					>
						<div class="flex items-center gap-1.5 font-semibold text-[#0E2E25]">
							<Video class="h-3.5 w-3.5 text-[#0C7B58]" />
							<span>
								{isCalendarConnected
									? m.se_gcal_summary_connected()
									: m.se_gcal_summary_disconnected()}
							</span>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

{#if copySourceDay}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-[#092B21]/50 p-4"
		role="presentation"
		onclick={(e) => {
			if (e.target === e.currentTarget) copySourceDay = null;
		}}
	>
		<div
			class="w-full max-w-md space-y-5 rounded-2xl border border-[#E5ECE7] bg-white p-6 shadow-lg"
			role="dialog"
			aria-modal="true"
			aria-label={m.se_copy_modal_title({ day: dayLabelFor(copySourceDay.day) })}
		>
			<div class="flex items-center justify-between border-b border-[#F0F4F2] pb-3">
				<div>
					<h3 class="text-sm font-bold text-[#0E2E25]">
						{m.se_copy_modal_title({ day: dayLabelFor(copySourceDay.day) })}
					</h3>
					<p class="mt-0.5 text-xs text-[#52776C]">
						{m.se_copy_modal_time()}
						<strong>{formatTimeRangeDisplay(rangesOf(copySourceDay))} {m.se_wib()}</strong>
					</p>
				</div>
				<button
					type="button"
					onclick={() => (copySourceDay = null)}
					class="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
					aria-label={m.common_close()}
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			<div class="flex items-center gap-2 text-xs">
				<button
					type="button"
					onclick={() => {
						const weekdays = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'].filter(
							(d) => d !== copySourceDay?.day
						);
						selectedTargetDays = weekdays;
					}}
					class="cursor-pointer rounded-lg border border-[#CCE6D6] bg-[#EAF8F0] px-2.5 py-1 font-semibold text-[#0C7B58] transition-colors hover:bg-[#DDF2E6]"
				>
					{m.se_copy_preset_weekdays()}
				</button>
				<button
					type="button"
					onclick={() => {
						selectedTargetDays = availability.weeklySchedule
							.map((d) => d.day)
							.filter((d) => d !== copySourceDay?.day);
					}}
					class="cursor-pointer rounded-lg bg-gray-100 px-2.5 py-1 font-semibold text-gray-700 transition-colors hover:bg-gray-200"
				>
					{m.se_copy_preset_all()}
				</button>
			</div>

			<div class="max-h-60 space-y-2 overflow-y-auto">
				{#each availability.weeklySchedule.filter((d) => d.day !== copySourceDay?.day) as targetDay (targetDay.day)}
					{@const isSelected = selectedTargetDays.includes(targetDay.day)}
					<label
						for={`copy-${targetDay.day}`}
						class="flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-colors {isSelected
							? 'border-[#0C7B58] bg-[#EAF8F0]'
							: 'border-[#E2E8E4] bg-white hover:border-gray-300'}"
					>
						<div class="flex items-center gap-2.5">
							<input
								type="checkbox"
								id={`copy-${targetDay.day}`}
								checked={isSelected}
								onchange={(e) => {
									const el = e.currentTarget;
									selectedTargetDays = el.checked
										? [...selectedTargetDays, targetDay.day]
										: selectedTargetDays.filter((d) => d !== targetDay.day);
								}}
								class="h-4 w-4 cursor-pointer rounded accent-[#0C7B58]"
							/>
							<span class="text-xs font-semibold text-[#0E2E25]">{dayLabelFor(targetDay.day)}</span>
						</div>
						<span class="text-[11px] text-gray-400">
							{targetDay.enabled
								? formatTimeRangeDisplay(rangesOf(targetDay))
								: m.se_day_inactive()}
						</span>
					</label>
				{/each}
			</div>

			<div class="flex items-center justify-end gap-2 border-t border-[#F0F4F2] pt-2">
				<button
					type="button"
					onclick={() => (copySourceDay = null)}
					class="cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100"
				>
					{m.common_cancel()}
				</button>
				<button
					type="button"
					onclick={handleApplyCopySchedule}
					disabled={selectedTargetDays.length === 0}
					class="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#008A5E] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#007550] disabled:cursor-not-allowed disabled:opacity-50"
				>
					<Check class="h-3.5 w-3.5" />
					<span>{m.se_copy_apply({ count: selectedTargetDays.length })}</span>
				</button>
			</div>
		</div>
	</div>
{/if}
