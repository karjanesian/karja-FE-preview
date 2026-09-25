<script lang="ts">
	import { goto } from '$app/navigation';
	import { seller } from '$lib/stores/seller.svelte';
	import { ApiError, isNetworkError } from '$lib/api';
	import {
		checkout,
		devMarkPaid,
		getPublicOrder,
		isPaidCheckout,
		type PaymentInstruction
	} from '$lib/domain/checkoutApi';
	import { formatRupiah } from '$lib/data/mockData';
	import { calculateKarjaFees, getEffectivePrice, getProductPriceState } from '$lib/domain/pricing';
	import {
		buildSessionTimestamps,
		formatTimeRange,
		generateMockMeetUrl,
		getAvailableTimeSlotsForDate,
		getBookableDates,
		type AvailableDateOption
	} from '$lib/domain/scheduling';
	import { getVisualAsset } from '$lib/domain/visualAssets';
	import { normalizeProductType, type MeetingMethod, type Product } from '$lib/types';
	import * as m from '$lib/paraglide/messages.js';
	import ProductTypeMeta from '$lib/components/common/ProductTypeMeta.svelte';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Check from 'lucide-svelte/icons/check';
	import CheckCircle2 from 'lucide-svelte/icons/check-circle-2';
	import Copy from 'lucide-svelte/icons/copy';
	import Download from 'lucide-svelte/icons/download';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import Video from 'lucide-svelte/icons/video';
	import X from 'lucide-svelte/icons/x';

	type Props = {
		product: Product;
		sellerUsername: string;
		onClose: () => void;
	};
	let { product, sellerUsername, onClose }: Props = $props();

	let buyerName = $state('Dion Pratama');
	let buyerPhone = $state('');
	let buyerEmail = $state('dion.pratama@gmail.com');
	// svelte-ignore state_referenced_locally
	let buyerNotes = $state(product.priceMode === 'free' ? 'Klaim produk gratis' : '');

	const canonicalType = $derived(normalizeProductType(product.type));
	const isSession = $derived(canonicalType === 'session');
	const priceState = $derived(getProductPriceState(product));
	const effectivePrice = $derived(getEffectivePrice(product));
	const fees = $derived(calculateKarjaFees(effectivePrice));

	const availability = $derived(
		product.availabilityMode === 'custom' && product.customAvailability
			? product.customAvailability
			: seller.sellerProfile.availability
	);

	function slotsFor(dateOpt: AvailableDateOption | null): string[] {
		if (!dateOpt) return [];
		return getAvailableTimeSlotsForDate(dateOpt.date, product, availability, seller.bookings);
	}

	function firstAvailableDate(): AvailableDateOption | null {
		if (normalizeProductType(product.type) !== 'session') return null;
		const dates = getBookableDates(product.bookingWindowDays || 30, availability);
		return dates.find((d) => d.isAvailable) || dates[0] || null;
	}

	const bookableDates = $derived(
		isSession ? getBookableDates(product.bookingWindowDays || 30, availability) : []
	);

	let selectedDateOption = $state<AvailableDateOption | null>(firstAvailableDate());
	// svelte-ignore state_referenced_locally
	let selectedTimeSlot = $state<string | null>(
		isSessionInit() ? slotsFor(selectedDateOption)[0] || null : null
	);
	function isSessionInit(): boolean {
		return normalizeProductType(product.type) === 'session';
	}

	const availableTimeSlots = $derived(
		isSession && selectedDateOption ? slotsFor(selectedDateOption) : []
	);

	let prepAnswers = $state<Record<number, string>>(initPrepAnswers());
	function initPrepAnswers(): Record<number, string> {
		const initialAnswers: Record<number, string> = {};
		if (
			normalizeProductType(product.type) === 'session' &&
			product.preparationQuestions &&
			product.preparationQuestions.length > 0
		) {
			product.preparationQuestions.forEach((_, idx) => {
				initialAnswers[idx] = idx === 0 ? 'Mau review dan feedback terarah...' : '';
			});
		}
		return initialAnswers;
	}

	let stage = $state<'form' | 'pay' | 'success'>('form');
	let isPurchasing = $state(false);
	let createdOrderId = $state<string | null>(null);
	let createdAccessToken = $state<string | null>(null);
	let checkoutError = $state<string | null>(null);
	let copiedLink = $state(false);
	let confirmedBookingDetails = $state<{
		dateFormatted: string;
		timeFormatted: string;
		duration: number;
		meetingUrl: string;
		meetingMethod: MeetingMethod;
		prepAnswers: { question: string; answer: string }[];
	} | null>(null);

	type PaymentState = {
		reference: string;
		instructions: PaymentInstruction[];
		expiresAtMs: number;
	};
	let payment = $state<PaymentState | null>(null);
	let secondsLeft = $state(0);

	function padNum(n: number): string {
		return n.toString().padStart(2, '0');
	}

	$effect(() => {
		if (stage === 'pay' && payment) {
			const tick = () => {
				secondsLeft = Math.max(0, Math.ceil((payment!.expiresAtMs - Date.now()) / 1000));
			};
			tick();
			const iv = setInterval(tick, 1000);
			return () => clearInterval(iv);
		}
	});

	const countdownLabel = $derived(
		secondsLeft > 0
			? `${padNum(Math.floor(secondsLeft / 60))}:${padNum(secondsLeft % 60)}`
			: '00:00'
	);
	const paymentExpired = $derived(stage === 'pay' && payment !== null && secondsLeft <= 0);

	// Pantau status pembayaran tiap ~3 detik selama tahap bayar terbuka.
	// Berhenti saat sukses, kedaluwarsa, atau komponen dibongkar.
	$effect(() => {
		if (stage !== 'pay' || !createdAccessToken) return;
		const token = createdAccessToken;
		let stopped = false;
		let intervalId: ReturnType<typeof setInterval> | null = null;

		const stop = () => {
			stopped = true;
			if (intervalId) clearInterval(intervalId);
		};

		const poll = async () => {
			if (stopped || paymentExpired) {
				stop();
				return;
			}
			try {
				const order = await getPublicOrder(token);
				if (stopped) return;
				if (order.paymentStatus === 'lunas' || order.paymentStatus === 'gratis') {
					createdOrderId = order.orderId;
					stage = 'success';
				} else if (order.paymentStatus === 'gagal' || order.paymentStatus === 'dibatalkan') {
					checkoutError = m.bu_co_pay_failed();
					stop();
				}
			} catch (e) {
				if (!isNetworkError(e)) console.error('[karja] gagal memantau status pembayaran:', e);
			}
		};

		intervalId = setInterval(() => void poll(), 3000);
		return stop;
	});

	function handleDateChange(dateOpt: AvailableDateOption) {
		selectedDateOption = dateOpt;
		selectedTimeSlot = slotsFor(dateOpt)[0] || null;
	}

	/** Detail sesi lokal untuk tampilan konfirmasi (BE belum menerima data booking). */
	function buildConfirmedBooking() {
		if (!isSession || !selectedDateOption || !selectedTimeSlot) return null;
		const duration = product.sessionDurationMinutes || 20;
		const { timeFormatted } = buildSessionTimestamps(
			selectedDateOption.dateString,
			selectedTimeSlot,
			duration
		);
		const formattedPrepAnswers = (product.preparationQuestions || []).map((q, idx) => ({
			question: q,
			answer: prepAnswers[idx] || buyerNotes || 'Siap berdiskusi.'
		}));
		return {
			dateFormatted: selectedDateOption.fullLabel,
			timeFormatted,
			duration,
			meetingUrl: generateMockMeetUrl(),
			meetingMethod: 'google_meet' as MeetingMethod,
			prepAnswers: formattedPrepAnswers
		};
	}

	async function startCheckout() {
		if (!product) return;
		isPurchasing = true;
		checkoutError = null;
		confirmedBookingDetails = buildConfirmedBooking();

		try {
			const result = await checkout({
				username: sellerUsername,
				slug: product.slug,
				buyerName: buyerName.trim(),
				buyerEmail: buyerEmail.trim(),
				buyerPhone: buyerPhone.trim() || undefined,
				notes: buyerNotes.trim() || undefined
			});

			createdOrderId = result.orderId;
			createdAccessToken = result.accessToken;

			if (isPaidCheckout(result)) {
				payment = {
					reference: result.payment.reference,
					instructions: result.payment.instructions ?? [],
					expiresAtMs: new Date(result.payment.expiresAt).getTime()
				};
				stage = 'pay';
			} else {
				stage = 'success';
			}
		} catch (e) {
			checkoutError = e instanceof ApiError ? e.message : m.bu_co_pay_error();
			if (!isNetworkError(e)) console.error('[karja] checkout gagal:', e);
		} finally {
			isPurchasing = false;
		}
	}

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!product) return;

		if (isSession && (!selectedDateOption || !selectedTimeSlot)) {
			window.alert(m.bu_co_err_slot());
			return;
		}

		void startCheckout();
	}

	function retryPayment() {
		void startCheckout();
	}

	async function confirmPayment() {
		if (!createdAccessToken || paymentExpired) return;
		isPurchasing = true;
		try {
			const order = await getPublicOrder(createdAccessToken);
			if (order.paymentStatus === 'lunas' || order.paymentStatus === 'gratis') {
				createdOrderId = order.orderId;
				stage = 'success';
			}
		} catch (e) {
			if (!isNetworkError(e)) console.error('[karja] cek pembayaran gagal:', e);
		} finally {
			isPurchasing = false;
		}
	}

	async function handleSimulatePaid() {
		if (!createdOrderId) return;
		isPurchasing = true;
		checkoutError = null;
		try {
			const order = await devMarkPaid(
				createdOrderId,
				import.meta.env.PUBLIC_DEV_PAYMENT_SECRET ?? 'dev-secret'
			);
			createdAccessToken = order.accessToken;
			stage = 'success';
		} catch (e) {
			checkoutError = e instanceof ApiError ? e.message : m.bu_co_pay_error();
			if (!isNetworkError(e)) console.error('[karja] simulasi pembayaran gagal:', e);
		} finally {
			isPurchasing = false;
		}
	}

	async function handleCopyMeetUrl(url: string) {
		try {
			await navigator.clipboard.writeText(url);
			copiedLink = true;
			setTimeout(() => (copiedLink = false), 2000);
		} catch {
			/* noop */
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') onClose();
	}

	const modalTitle = $derived(
		isSession
			? m.bu_co_title_session()
			: canonicalType === 'service'
				? m.bu_co_title_service()
				: m.bu_co_title_digital()
	);
	const emailLabel = $derived(
		isSession
			? m.bu_co_email_session()
			: canonicalType === 'service'
				? m.bu_co_email_service()
				: m.bu_co_email_digital()
	);
	const doneTitle = $derived(
		isSession
			? m.bu_co_done_session()
			: priceState.isFree
				? m.bu_co_done_free()
				: m.bu_co_done_paid()
	);
	const submitLabel = $derived(
		isPurchasing
			? m.bu_co_submit_processing()
			: priceState.isFree
				? m.bu_co_submit_free()
				: isSession
					? m.bu_co_submit_session({ price: formatRupiah(effectivePrice) })
					: m.bu_co_submit_paid({ price: formatRupiah(effectivePrice) })
	);
	const successAsset = $derived(getVisualAsset('lifecycle.firstSaleComplete'));
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	role="presentation"
	onclick={(e) => {
		if (e.target === e.currentTarget) onClose();
	}}
	class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#092B21]/60 p-3 backdrop-blur-xs sm:p-4"
>
	<div
		role="dialog"
		aria-modal="true"
		aria-label={modalTitle}
		class="relative my-8 w-full max-w-lg space-y-4 rounded-3xl border border-[#CCE6D6] bg-white p-5 text-xs shadow-2xl sm:p-6"
	>
		<div
			class="mb-3 flex items-center justify-between border-b border-[#E5ECE7] pb-3 text-sm font-bold text-[#0E2E25]"
		>
			<span>{modalTitle}</span>
			<button
				type="button"
				onclick={onClose}
				class="cursor-pointer rounded-lg p-1 text-gray-400 transition-colors hover:text-gray-800"
				aria-label={m.bu_sh_close()}
			>
				<X class="h-5 w-5" />
			</button>
		</div>

		{#if stage === 'success'}
			<div class="space-y-4 py-4 text-center">
				<div class="flex justify-center">
					<img
						src={successAsset.url}
						alt={m.bu_co_done_img_alt()}
						class="h-28 w-28 object-contain sm:h-32 sm:w-32"
						referrerpolicy="no-referrer"
					/>
				</div>

				<div class="space-y-1">
					<h3 class="text-lg font-bold text-[#0E2E25]">{doneTitle}</h3>

					{#if isSession}
						<p class="mx-auto max-w-sm text-xs leading-relaxed text-[#355B50]">
							{m.bu_co_done_desc_session()}
						</p>
					{:else if canonicalType === 'service'}
						<p class="mx-auto max-w-xs text-xs leading-relaxed text-[#355B50]">
							{m.bu_co_done_desc_service()}{product.serviceTimelineDays
								? ` ${m.bu_co_done_desc_service_eta({ days: product.serviceTimelineDays })}`
								: ''}
						</p>
					{:else}
						<p class="mx-auto max-w-xs text-xs leading-relaxed text-[#355B50]">
							{m.bu_co_done_desc_digital()}
						</p>
					{/if}
				</div>

				{#if isSession && confirmedBookingDetails}
					<div
						class="space-y-3 rounded-2xl border border-[#CCE6D6] bg-[#F2FAF5] p-4 text-left text-xs"
					>
						<div
							class="flex items-center gap-1.5 border-b border-[#D5EBDD] pb-2 font-bold text-[#0A3D2E]"
						>
							<Calendar class="h-4 w-4 text-[#0C7B58]" />
							<span>{m.bu_co_meet_title()}</span>
						</div>

						<div class="space-y-1.5 text-[#18483B]">
							<div class="flex items-center justify-between">
								<span class="text-gray-500">{m.bu_co_meet_when()}</span>
								<span class="font-bold text-[#0E2E25]">
									{confirmedBookingDetails.dateFormatted}
								</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-gray-500">{m.bu_co_meet_dur()}</span>
								<span class="font-bold text-[#0C7B58]">
									{m.bu_co_meet_dur_value({
										time: confirmedBookingDetails.timeFormatted,
										count: confirmedBookingDetails.duration
									})}
								</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-gray-500">{m.bu_co_meet_platform()}</span>
								<span class="font-semibold text-[#0E2E25]">{m.bu_sh_google_meet()}</span>
							</div>
						</div>

						<div class="space-y-1.5 border-t border-[#D5EBDD] pt-2">
							<div class="flex items-center gap-1 text-[11px] font-bold text-[#0A3D2E]">
								<Video class="h-3.5 w-3.5 text-[#0C7B58]" />
								<span>{m.bu_co_meet_link()}</span>
							</div>
							<div
								class="flex items-center justify-between gap-2 rounded-xl border border-[#CCE6D6] bg-white p-2.5"
							>
								<span class="truncate font-mono text-xs text-[#0C7B58]">
									{confirmedBookingDetails.meetingUrl}
								</span>
								<div class="flex shrink-0 items-center gap-1">
									<button
										type="button"
										onclick={() => void handleCopyMeetUrl(confirmedBookingDetails!.meetingUrl)}
										class="cursor-pointer rounded-lg p-1.5 text-xs text-[#0C7B58] hover:bg-[#EAF8F0]"
										title={m.bu_co_copy_meet()}
									>
										{#if copiedLink}
											<Check class="h-3.5 w-3.5 text-emerald-600" />
										{:else}
											<Copy class="h-3.5 w-3.5" />
										{/if}
									</button>
									<a
										href={confirmedBookingDetails.meetingUrl}
										target="_blank"
										rel="noopener noreferrer"
										class="inline-flex items-center gap-1 rounded-lg bg-[#0C7B58] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#096649]"
									>
										<span>{m.bu_co_open()}</span>
										<ExternalLink class="h-3 w-3" />
									</a>
								</div>
							</div>
							<p class="text-[10px] text-gray-500 italic">
								{m.bu_co_email_sent({ email: buyerEmail })}
							</p>
						</div>
					</div>
				{/if}

				{#if canonicalType === 'digital'}
					<div class="space-y-2 rounded-2xl border border-[#CCE6D6] bg-[#F2FAF5] p-4 text-left">
						<div class="text-xs font-bold text-[#0A3D2E]">{m.bu_co_digital_title()}</div>
						<div
							class="flex items-center justify-between rounded-xl border border-[#CCE6D6] bg-white p-2.5"
						>
							<span class="truncate font-mono text-xs text-[#0C7B58]">
								{product.fileDownloadName ||
									product.externalAccessUrl ||
									m.bu_co_digital_fallback()}
							</span>
							<a
								href={product.externalAccessUrl || '#'}
								onclick={(e) => {
									if (!product.externalAccessUrl) {
										e.preventDefault();
										window.alert(m.bu_sh_download_started());
									}
								}}
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg bg-[#0C7B58] px-3 py-1 text-xs font-bold text-white hover:bg-[#096649]"
							>
								<Download class="h-3.5 w-3.5" />
								<span>{m.bu_co_download()}</span>
							</a>
						</div>
					</div>
				{/if}

				<div class="flex justify-center pt-2">
					<button
						type="button"
						onclick={() => createdAccessToken && void goto(`/orders/${createdAccessToken}/access`)}
						class="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#008A5E] px-5 py-2.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-[#007550] sm:w-auto"
					>
						<ExternalLink class="h-3.5 w-3.5" />
						<span>{m.bu_co_open_access()}</span>
					</button>
				</div>
			</div>
		{:else if stage === 'pay' && payment}
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<h3 class="text-sm font-bold text-[#0E2E25]">{m.bu_co_pay_title()}</h3>
					{#if !isPurchasing}
						<button
							type="button"
							onclick={() => (stage = 'form')}
							class="cursor-pointer text-[11px] font-semibold text-[#0C7B58] hover:underline"
						>
							{m.bu_co_pay_back()}
						</button>
					{/if}
				</div>

				<div
					class="rounded-xl border border-[#BDE5D0] bg-[#F4FAF6] px-3 py-2 text-[11px] leading-relaxed text-[#2F5A4D]"
				>
					{m.bu_co_pay_manual_note()}
				</div>

				<div class="space-y-2 rounded-2xl border border-[#CCE6D6] bg-[#F2FAF5] p-4">
					<div class="flex items-center justify-between">
						<span class="text-[11px] font-bold text-[#0A3D2E]">{m.bu_co_pay_amount()}</span>
						<span class="text-lg font-black text-[#0B6651]">
							{formatRupiah(effectivePrice)}
						</span>
					</div>
					<div class="flex items-center justify-between text-[11px]">
						<span class="text-gray-500">{m.bu_co_pay_expires()}</span>
						<span class="font-mono font-bold {paymentExpired ? 'text-red-600' : 'text-[#0C7B58]'}"
							>{countdownLabel}</span
						>
					</div>
					{#if paymentExpired}
						<div
							class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-800"
						>
							<button
								type="button"
								onclick={retryPayment}
								class="cursor-pointer font-bold underline">{m.bu_co_pay_retry()}</button
							>
							<span class="ml-1.5">{m.bu_co_pay_expired()}</span>
						</div>
					{/if}
				</div>

				<div class="space-y-2">
					<div class="text-[11px] font-bold text-[#184A3B]">{m.bu_co_pay_method()}</div>
					<div class="space-y-2.5 rounded-2xl border border-[#CCE6D6] bg-white p-4">
						{#each payment.instructions as instruction (instruction.label)}
							<div class="flex items-start justify-between gap-3 text-[11px]">
								<span class="shrink-0 text-gray-500">{instruction.label}</span>
								<span class="text-right font-mono font-bold text-[#0C7B58]">
									{instruction.value}
								</span>
							</div>
						{/each}
						<div
							class="flex items-center justify-between gap-3 border-t border-[#E5ECE7] pt-2 text-[11px]"
						>
							<span class="shrink-0 text-gray-500">{m.bu_co_pay_reference()}</span>
							<span class="text-right font-mono text-[#0C7B58]">{payment.reference}</span>
						</div>
					</div>
				</div>

				{#if checkoutError}
					<div
						class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-800"
					>
						{checkoutError}
					</div>
				{/if}

				{#if import.meta.env.DEV}
					<button
						type="button"
						onclick={handleSimulatePaid}
						disabled={isPurchasing}
						class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#0C7B58] bg-[#EAF8F0] py-2.5 text-xs font-bold text-[#0C7B58] transition-all hover:bg-[#DDF3E7] disabled:cursor-not-allowed disabled:opacity-50"
					>
						<CheckCircle2 class="h-4 w-4" />
						<span>{m.bu_co_pay_dev_sim()}</span>
					</button>
				{/if}

				<button
					type="button"
					onclick={confirmPayment}
					disabled={isPurchasing || paymentExpired}
					class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0C7B58] py-3 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#096649] disabled:cursor-not-allowed disabled:opacity-50"
				>
					<span>{isPurchasing ? m.bu_co_submit_processing() : m.bu_co_pay_confirm()}</span>
					<ArrowRight class="h-4 w-4" />
				</button>

				<p class="text-center text-[10px] text-gray-400">{m.bu_co_pay_poll_note()}</p>
			</div>
		{:else}
			<form onsubmit={handleSubmit} class="space-y-4 text-xs">
				<div
					class="flex items-center justify-between rounded-xl border border-[#CCE6D6] bg-[#FAFDFB] p-3.5"
				>
					<div class="min-w-0 flex-1 pr-2">
						<div class="truncate text-sm font-bold text-[#0E2E25]">{product.title}</div>
						<div class="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#4A7264]">
							<ProductTypeMeta
								type={product.type}
								subtype={isSession
									? m.bu_co_subtype_minutes({
											count: product.sessionDurationMinutes || 20
										})
									: undefined}
							/>
							{#if isSession}
								<span class="text-[#B0CCC1]">·</span>
								<span>{m.bu_sh_google_meet()}</span>
							{/if}
						</div>
					</div>
					<div class="shrink-0 text-right text-base font-bold text-[#0C7B58]">
						{#if priceState.isFree}
							{m.bu_sh_free()}
						{:else if priceState.isPromoActive}
							<div>
								<div class="text-[10px] font-normal text-gray-400 line-through">
									{priceState.formattedOriginalPrice || formatRupiah(product.regularPrice || 0)}
								</div>
								<div>{priceState.formattedPrice}</div>
							</div>
						{:else}
							{priceState.formattedPrice}
						{/if}
					</div>
				</div>

				{#if isSession}
					<div class="space-y-3 rounded-2xl border border-[#CCE6D6] bg-[#F4FAF6] p-3.5">
						<div class="flex items-center justify-between">
							<span class="flex items-center gap-1.5 font-bold text-[#184A3B]">
								<Calendar class="h-4 w-4 text-[#0C7B58]" />
								<span>{m.bu_co_sched_title()}</span>
							</span>
							<span class="text-[11px] font-medium text-[#4A7264]">
								{m.bu_co_sched_tz()}
							</span>
						</div>

						<div>
							<div class="mb-1.5 text-[11px] font-semibold text-gray-500">
								{m.bu_co_sched_date_label()}
							</div>
							<div class="flex items-center gap-2 overflow-x-auto pb-1.5">
								{#each bookableDates.slice(0, 14) as d (d.dateString)}
									{@const isSelected = selectedDateOption?.dateString === d.dateString}
									<button
										type="button"
										disabled={!d.isAvailable}
										onclick={() => handleDateChange(d)}
										class="flex min-w-[62px] shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl border p-2 text-center transition-all disabled:cursor-not-allowed {isSelected
											? 'border-[#0C7B58] bg-[#0C7B58] text-white shadow-xs'
											: d.isAvailable
												? 'border-[#CCE6D6] bg-white text-[#0E2E25] hover:border-[#0C7B58]'
												: 'border-gray-200 bg-gray-100 text-gray-400 opacity-60'}"
									>
										<span class="text-[10px] font-semibold uppercase">
											{d.dayLabel.split(' ')[0]}
										</span>
										<span class="text-sm font-bold {isSelected ? 'text-white' : 'text-[#0E2E25]'}"
											>{d.dayLabel.split(' ')[1]}</span
										>
									</button>
								{/each}
							</div>
						</div>

						<div>
							<div class="mb-1.5 text-[11px] font-semibold text-gray-500">
								{m.bu_co_sched_time_label({ date: selectedDateOption?.fullLabel || '' })}
							</div>
							{#if availableTimeSlots.length === 0}
								<div
									class="rounded-xl border border-[#CCE6D6] bg-white p-3 text-center text-xs text-gray-500"
								>
									{m.bu_co_sched_empty()}
								</div>
							{:else}
								<div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
									{#each availableTimeSlots as slot (slot)}
										<button
											type="button"
											onclick={() => (selectedTimeSlot = slot)}
											class="cursor-pointer rounded-xl border p-2 text-center transition-all {selectedTimeSlot ===
											slot
												? 'border-[#0C7B58] bg-[#0C7B58] font-bold text-white shadow-xs'
												: 'border-[#CCE6D6] bg-white font-semibold text-[#0E2E25] hover:border-[#0C7B58]'}"
										>
											<div class="text-xs">
												{m.bu_co_slot_time({ time: slot })}
											</div>
											<div
												class="text-[10px] {selectedTimeSlot === slot
													? 'text-emerald-100'
													: 'text-gray-400'}"
											>
												{m.bu_co_slot_minutes({
													count: product.sessionDurationMinutes || 20
												})}
											</div>
										</button>
									{/each}
								</div>
							{/if}
						</div>

						{#if selectedDateOption && selectedTimeSlot}
							<div
								class="flex items-center justify-between rounded-xl border border-[#BDE5D0] bg-white p-2.5 text-xs text-[#0A3D2E]"
							>
								<div class="flex items-center gap-2">
									<CheckCircle2 class="h-4 w-4 shrink-0 text-[#0C7B58]" />
									<span>
										{m.bu_co_sched_selected({
											date: selectedDateOption.fullLabel,
											time: formatTimeRange(
												selectedTimeSlot,
												product.sessionDurationMinutes || 20,
												'WIB'
											)
										})}
									</span>
								</div>
							</div>
						{/if}
					</div>
				{/if}

				<div class="space-y-3">
					<div class="text-xs font-bold tracking-wider text-[#184A3B] uppercase">
						{m.bu_co_info_title()}
					</div>

					<div>
						<label for="bu-co-name" class="mb-1 block font-semibold text-[#184A3B]">
							{m.bu_co_name_label()}
						</label>
						<input
							id="bu-co-name"
							type="text"
							required
							bind:value={buyerName}
							placeholder={m.bu_co_name_ph()}
							class="w-full rounded-xl border border-[#CCE6D6] bg-[#FAFDFB] p-2.5 text-[#0E2E25]"
						/>
					</div>

					<div>
						<label for="bu-co-email" class="mb-1 block font-semibold text-[#184A3B]">
							{emailLabel}
						</label>
						<input
							id="bu-co-email"
							type="email"
							required
							bind:value={buyerEmail}
							placeholder={m.bu_co_email_ph()}
							class="w-full rounded-xl border border-[#CCE6D6] bg-[#FAFDFB] p-2.5 text-[#0E2E25]"
						/>
					</div>

					{#if !priceState.isFree}
						<div>
							<div class="mb-1 flex items-center justify-between">
								<label for="bu-co-phone" class="block font-semibold text-[#184A3B]">
									{m.bu_co_phone_label()}
								</label>
								<span class="text-[11px] font-normal text-[#52776C]">
									{m.bu_co_optional()}
								</span>
							</div>
							<input
								id="bu-co-phone"
								type="tel"
								bind:value={buyerPhone}
								placeholder={m.bu_co_phone_ph()}
								class="w-full rounded-xl border border-[#CCE6D6] bg-[#FAFDFB] p-2.5 text-[#0E2E25]"
							/>
						</div>
					{/if}
				</div>

				{#if isSession}
					<div class="space-y-3 border-t border-gray-100 pt-1">
						<div class="text-xs font-bold tracking-wider text-[#184A3B] uppercase">
							{m.bu_co_prep_title()}
						</div>

						{#if product.preparationQuestions && product.preparationQuestions.length > 0}
							{#each product.preparationQuestions as q, idx (idx)}
								<div>
									<label for="bu-co-prep-{idx}" class="mb-1 block font-semibold text-[#184A3B]">
										{q}
									</label>
									<input
										id="bu-co-prep-{idx}"
										type="text"
										required
										value={prepAnswers[idx] || ''}
										oninput={(e) =>
											(prepAnswers = {
												...prepAnswers,
												[idx]: (e.currentTarget as HTMLInputElement).value
											})}
										placeholder={m.bu_co_prep_ph()}
										class="w-full rounded-xl border border-[#CCE6D6] bg-[#FAFDFB] p-2.5 text-[#0E2E25]"
									/>
								</div>
							{/each}
						{:else}
							<div>
								<label for="bu-co-topic" class="mb-1 block font-semibold text-[#184A3B]">
									{m.bu_co_topic_label()}
								</label>
								<textarea
									id="bu-co-topic"
									rows="2"
									bind:value={buyerNotes}
									placeholder={m.bu_co_topic_ph()}
									class="w-full rounded-xl border border-[#CCE6D6] bg-[#FAFDFB] p-2.5 text-[#0E2E25]"
								></textarea>
							</div>
						{/if}
					</div>
				{/if}

				{#if canonicalType === 'service'}
					<div class="space-y-2 border-t border-gray-100 pt-1">
						<label for="bu-co-brief" class="block font-semibold text-[#184A3B]">
							{m.bu_co_brief_label()}
						</label>
						<textarea
							id="bu-co-brief"
							rows="3"
							required
							bind:value={buyerNotes}
							placeholder={m.bu_co_brief_ph()}
							class="w-full rounded-xl border border-[#CCE6D6] bg-[#FAFDFB] p-2.5 text-[#0E2E25]"
						></textarea>
					</div>
				{:else if canonicalType === 'digital'}
					<div>
						<label for="bu-co-notes" class="mb-1 block font-semibold text-[#184A3B]">
							{m.bu_co_notes_label()}
						</label>
						<textarea
							id="bu-co-notes"
							rows="2"
							bind:value={buyerNotes}
							placeholder={m.bu_co_notes_ph()}
							class="w-full rounded-xl border border-[#CCE6D6] bg-[#FAFDFB] p-2.5 text-[#0E2E25]"
						></textarea>
					</div>
				{/if}

				{#if !priceState.isFree}
					<div class="space-y-1.5 rounded-xl border border-[#E4EBE7] bg-[#FAFDFB] p-3.5">
						<div class="text-[11px] font-bold tracking-wider text-[#184A3B] uppercase">
							{m.bu_co_sum_title()}
						</div>
						<div class="flex items-center justify-between text-[11px]">
							<span class="text-[#52776C]">{m.bu_co_sum_price()}</span>
							<span class="font-semibold text-[#0E2E25]">
								{formatRupiah(priceState.isPromoActive ? priceState.originalPrice : effectivePrice)}
							</span>
						</div>
						{#if priceState.isPromoActive && priceState.originalPrice > effectivePrice}
							<div class="flex items-center justify-between text-[11px]">
								<span class="text-[#52776C]">{m.bu_co_sum_discount()}</span>
								<span class="font-semibold text-red-500">
									−{formatRupiah(priceState.originalPrice - effectivePrice)}
								</span>
							</div>
						{/if}
						<div class="flex items-center justify-between border-t border-[#E4EBE7] pt-1.5 text-xs">
							<span class="font-bold text-[#0E2E25]">{m.bu_co_sum_total()}</span>
							<span class="font-black text-[#0B6651]">
								{formatRupiah(effectivePrice)}
							</span>
						</div>
						<div class="flex items-center justify-between text-[10px] text-gray-400">
							<span>{m.bu_co_sum_karja_fee()}</span>
							<span>{formatRupiah(fees.karjaFee)}</span>
						</div>
						<div class="flex items-center justify-between text-[10px] text-gray-400">
							<span>{m.bu_co_sum_payment_fee()}</span>
							<span>{formatRupiah(fees.paymentFee)}</span>
						</div>
						<p class="text-[10px] leading-relaxed text-gray-400">{m.bu_co_sum_fee_note()}</p>
					</div>
				{/if}

				<div class="pt-2">
					<button
						type="submit"
						disabled={isPurchasing || (isSession && (!selectedDateOption || !selectedTimeSlot))}
						class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0C7B58] py-3 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#096649] disabled:opacity-50"
					>
						<span>{submitLabel}</span>
						<ArrowRight class="h-4 w-4" />
					</button>
					<p class="mt-1.5 text-center text-[10px] text-gray-400">
						{m.bu_co_submit_note()}
					</p>
				</div>
			</form>
		{/if}
	</div>
</div>
