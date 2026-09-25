<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { api, ApiError, isNetworkError, type SellerUser } from '$lib/api';
	import { seller } from '$lib/stores/seller.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import Logo from '$lib/components/common/Logo.svelte';
	import Spinner from '$lib/components/common/Spinner.svelte';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Check from 'lucide-svelte/icons/check';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';

	// Selaras dengan RESEND_COOLDOWN_MS di BE (otp.service.ts).
	const RESEND_COOLDOWN_SECONDS = 60;

	type Step = 'email_entry' | 'code_sent';
	let step: Step = $state('email_entry');
	let email = $state('');
	let emailError = $state('');
	let isLoading = $state(false);

	let otpDigits: string[] = $state(['', '', '', '', '', '']);
	let otpError = $state('');
	let cooldownSeconds = $state(RESEND_COOLDOWN_SECONDS);
	let resendNotification = $state('');
	let isResending = $state(false);

	let otpRefs = $state<(HTMLInputElement | null)[]>([]);
	let legalModalType: 'terms' | 'privacy' | null = $state(null);

	const sessionExpired = $derived(page.url.searchParams.get('reason') === 'expired');

	$effect(() => {
		if (step !== 'code_sent' || cooldownSeconds <= 0) return;
		const timer = setInterval(() => {
			cooldownSeconds -= 1;
		}, 1000);
		return () => clearInterval(timer);
	});

	function validateEmailFormat(val: string) {
		const trimmed = val.trim();
		if (!trimmed) return false;
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
	}

	async function handleSendCode(e: SubmitEvent) {
		e.preventDefault();
		emailError = '';
		const trimmedEmail = email.trim();

		if (!trimmedEmail) {
			emailError = m.auth_err_email_empty();
			return;
		}
		if (!validateEmailFormat(trimmedEmail)) {
			emailError = m.auth_err_email_format();
			return;
		}

		isLoading = true;
		try {
			await api('/auth/seller/request-otp', { method: 'POST', body: { email: trimmedEmail } });
			openCodeStep();
		} catch (err) {
			if (isNetworkError(err)) {
				console.warn('[karja] backend tidak terlihat — lanjut mode simulasi lokal');
				openCodeStep();
			} else {
				emailError = err instanceof ApiError ? err.message : m.auth_err_email_format();
			}
		} finally {
			isLoading = false;
		}
	}

	function openCodeStep() {
		step = 'code_sent';
		cooldownSeconds = RESEND_COOLDOWN_SECONDS;
		otpError = '';
		otpDigits = ['', '', '', '', '', ''];
		setTimeout(() => otpRefs[0]?.focus(), 100);
	}

	function handleOtpDigitChange(index: number, value: string) {
		otpError = '';
		const digit = value.slice(-1);
		if (digit && !/^\d$/.test(digit)) return;

		const newDigits = [...otpDigits];
		newDigits[index] = digit;
		otpDigits = newDigits;

		if (digit && index < 5) otpRefs[index + 1]?.focus();
		if (newDigits.join('').length === 6) verifyOtpCode(newDigits.join(''));
	}

	function handleOtpKeyDown(index: number, e: KeyboardEvent) {
		if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
			otpRefs[index - 1]?.focus();
		}
	}

	function handleOtpPaste(e: ClipboardEvent) {
		e.preventDefault();
		otpError = '';
		const pastedData = e.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) ?? '';
		if (!pastedData) return;

		const newDigits = ['', '', '', '', '', ''];
		for (let i = 0; i < pastedData.length; i++) newDigits[i] = pastedData[i];
		otpDigits = newDigits;

		otpRefs[Math.min(pastedData.length, 5)]?.focus();
		if (pastedData.length === 6) verifyOtpCode(pastedData);
	}

	async function verifyOtpCode(code: string) {
		if (code.length < 6) return;
		isLoading = true;
		try {
			const res = await api<{ user: SellerUser }>('/auth/seller/verify-otp', {
				method: 'POST',
				body: { email: email.trim(), otp: code }
			});
			// BE tidak mengembalikan email pada payload verify-otp → pakai email yang diisi.
			seller.login({ email: email.trim(), name: res.user.name, mode: 'fresh' });
			void goto('/dashboard');
		} catch (err) {
			if (isNetworkError(err)) {
				// fallback simulasi lokal agar prototipe tetap bisa didemokan offline
				if (code === '000000') otpError = m.auth_err_code_mismatch();
				else if (code === '999999') otpError = m.auth_err_code_expired();
				else {
					seller.login({ email: email.trim(), mode: 'fresh' });
					void goto('/dashboard');
				}
			} else {
				otpError = err instanceof ApiError ? err.message : m.auth_err_code_mismatch();
			}
		} finally {
			isLoading = false;
		}
	}

	async function handleResendCode() {
		if (cooldownSeconds > 0 || isResending) return;
		otpError = '';
		isResending = true;

		try {
			await api('/auth/seller/request-otp', { method: 'POST', body: { email: email.trim() } });
			startResendCooldown();
		} catch (err) {
			if (isNetworkError(err)) {
				console.warn('[karja] backend tidak terlihat — simulasi kirim ulang lokal');
				startResendCooldown();
			} else {
				// Mis. BE masih dalam cooldown/throttle → tampilkan pesan, biarkan tombol tetap aktif.
				otpError = err instanceof ApiError ? err.message : m.auth_err_generic();
			}
		} finally {
			isResending = false;
		}
	}

	function startResendCooldown() {
		cooldownSeconds = RESEND_COOLDOWN_SECONDS;
		otpDigits = ['', '', '', '', '', ''];
		resendNotification = m.auth_resend_sent();
		setTimeout(() => (resendNotification = ''), 3500);
		setTimeout(() => otpRefs[0]?.focus(), 100);
	}

	function handleBackToEmail() {
		step = 'email_entry';
		otpError = '';
		emailError = '';
		otpDigits = ['', '', '', '', '', ''];
	}

	const year = new Date().getFullYear();
</script>

<svelte:head>
	<title>{m.auth_title()} · Karja</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div
	class="flex min-h-svh w-full flex-col justify-between bg-[#F5F7F5] px-4 py-5 font-sans text-ink-deep antialiased selection:bg-[#E8F5F0] selection:text-ink-deep sm:px-6 sm:py-8 lg:px-8"
>
	<header class="mx-auto mb-4 flex w-full max-w-[980px] items-center justify-between px-1 sm:mb-6">
		<button
			type="button"
			onclick={() => goto('/')}
			class="cursor-pointer rounded-lg p-0.5 transition-opacity hover:opacity-90 focus:ring-2 focus:ring-brand"
			aria-label="Karja"
		>
			<Logo size="md" />
		</button>
		<button
			type="button"
			onclick={() => goto('/')}
			class="inline-flex cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium text-[#4A5852] transition-colors hover:bg-white/80 hover:text-ink-deep"
		>
			<ArrowLeft class="h-4 w-4 text-[#4A5852]" />
			<span>{m.auth_back_home()}</span>
		</button>
	</header>

	<main class="mx-auto my-auto w-full max-w-[980px]">
		<div
			class="flex flex-col overflow-hidden rounded-2xl border border-[#E2E8E4] bg-white shadow-xl shadow-ink-deep/5 sm:rounded-3xl md:h-[600px] md:max-h-[640px] md:min-h-[580px] md:flex-row"
		>
			<!-- Left editorial panel -->
			<div
				class="relative flex h-[200px] w-full shrink-0 flex-col justify-between overflow-hidden bg-[#0E2E25] p-6 sm:h-[230px] sm:p-8 md:h-auto md:w-[40%] md:p-10 lg:p-10"
			>
				<img
					src="https://file.garden/ao1B7sLFNyZKt73m/auth/Sign%20up%201.png"
					alt="Karja"
					class="absolute inset-0 h-full w-full object-cover object-center"
				/>
				<div
					class="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-deep/85 via-ink-deep/25 to-black/15"
				></div>
				<div class="relative z-10">
					<img
						src="https://file.garden/ao1B7sLFNyZKt73m/auth/Karja%20Icon%20White.png"
						alt="Karja"
						class="h-7 w-auto object-contain drop-shadow-xs sm:h-8"
					/>
				</div>
				<div class="relative z-10 mt-auto space-y-1.5 pt-4 text-white sm:space-y-2">
					<h2
						class="text-lg leading-[1.2] font-bold tracking-tight text-white drop-shadow-xs sm:text-xl md:text-[24px] lg:text-[26px]"
					>
						{m.auth_hero_line1()}<br />
						{m.auth_hero_line2()}
					</h2>
					<p class="text-xs font-medium tracking-wide text-white/80 sm:text-sm">
						{m.auth_hero_sub()}
					</p>
				</div>
			</div>

			<!-- Right form panel -->
			<div
				class="flex w-full flex-col justify-center bg-white p-6 sm:p-10 md:w-[60%] md:p-12 lg:p-14"
			>
				<div class="mx-auto my-auto w-full max-w-[360px]">
					{#if sessionExpired}
						<div
							class="mb-5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-medium text-amber-900 sm:text-sm"
						>
							<AlertCircle class="h-4 w-4 shrink-0 text-amber-600" />
							<span>{m.auth_session_expired()}</span>
						</div>
					{/if}

					{#if step === 'email_entry'}
						<div>
							<div class="mb-6 text-left sm:mb-8">
								<h1
									class="text-2xl leading-tight font-bold tracking-tight text-ink-deep sm:text-[28px]"
								>
									{m.auth_title()}
								</h1>
								<p class="mt-2 text-sm leading-relaxed text-[#4A5852] sm:text-[15px]">
									{m.auth_subtitle()}
								</p>
								<p class="mt-1 text-xs leading-normal text-[#7A8882]">{m.auth_helper()}</p>
							</div>

							<form onsubmit={handleSendCode} class="space-y-4">
								<div>
									<label for="auth-email" class="mb-2 block text-sm font-medium text-ink-deep"
										>{m.auth_email_label()}</label
									>
									<input
										id="auth-email"
										type="email"
										bind:value={email}
										oninput={() => {
											if (emailError) emailError = '';
										}}
										placeholder={m.auth_email_placeholder()}
										autocomplete="email"
										class="h-[50px] w-full rounded-xl border bg-white px-4 text-base text-ink-deep transition-all outline-none placeholder:text-[#94A39D] sm:h-[52px] {emailError
											? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-500/20'
											: 'border-[#D2DBD5] focus:border-brand focus:ring-2 focus:ring-brand/15'}"
									/>
									{#if emailError}
										<p class="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
											<AlertCircle class="h-3.5 w-3.5 shrink-0" />
											<span>{emailError}</span>
										</p>
									{/if}
								</div>

								<button
									type="submit"
									disabled={isLoading}
									class="group mt-3 flex h-[50px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand px-6 text-base font-semibold text-white shadow-xs transition-all hover:bg-[#007550] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:h-[52px]"
								>
									{#if isLoading}
										<Spinner class="h-5 w-5" label={m.common_loading()} />
									{:else}
										<span>{m.auth_continue()}</span>
										<ArrowRight
											class="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
										/>
									{/if}
								</button>
							</form>

							<p
								class="mt-6 text-center text-xs leading-relaxed text-[#7A8882] select-none sm:mt-8"
							>
								{m.auth_legal_prefix()}
								<button
									type="button"
									onclick={() => (legalModalType = 'terms')}
									class="inline cursor-pointer font-medium text-brand hover:underline"
								>
									{m.auth_terms()}
								</button>

								{m.auth_legal_mid()}
								<button
									type="button"
									onclick={() => (legalModalType = 'privacy')}
									class="inline cursor-pointer font-medium text-brand hover:underline"
								>
									{m.auth_privacy()}
								</button>

								{m.auth_legal_suffix()}
							</p>
						</div>
					{:else}
						<div>
							<button
								type="button"
								onclick={handleBackToEmail}
								class="mb-5 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-brand transition-colors hover:text-[#007550]"
							>
								<ArrowLeft class="h-4 w-4" />
								<span>{m.auth_change_email()}</span>
							</button>

							<div class="mb-6">
								<h2
									class="text-2xl leading-tight font-bold tracking-tight text-ink-deep sm:text-[26px]"
								>
									{m.auth_check_email()}
								</h2>
								<p class="mt-2 text-sm leading-relaxed text-[#4A5852] sm:text-[15px]">
									{m.auth_code_sent_to()}
								</p>
								<p class="mt-0.5 text-sm font-semibold break-all text-ink-deep sm:text-base">
									{email}
								</p>
							</div>

							{#if resendNotification}
								<div
									class="mb-5 flex items-center gap-2 rounded-xl border border-brand/20 bg-[#E8F5F0] p-3.5 text-xs font-medium text-ink-deep sm:text-sm"
								>
									<Check class="h-4 w-4 shrink-0 text-brand" />
									<span>{resendNotification}</span>
								</div>
							{/if}

							<div class="my-6">
								<div class="flex items-center justify-between gap-1.5 sm:gap-2">
									{#each otpDigits as digit, idx (idx)}
										<input
											bind:this={otpRefs[idx]}
											type="text"
											inputmode="numeric"
											pattern="[0-9]*"
											maxlength="1"
											value={digit}
											oninput={(e: Event) =>
												handleOtpDigitChange(idx, (e.target as HTMLInputElement).value)}
											onkeydown={(e) => handleOtpKeyDown(idx, e)}
											onpaste={handleOtpPaste}
											autocomplete="one-time-code"
											aria-label={m.auth_otp_digit({ index: idx + 1 })}
											class="h-12 w-10 rounded-xl border bg-white text-center text-lg font-bold text-ink-deep transition-all outline-none sm:h-13 sm:w-12 sm:text-xl {otpError
												? 'border-red-500 bg-red-50/40 text-red-700 focus:ring-2 focus:ring-red-500/20'
												: 'border-[#D2DBD5] focus:border-brand focus:ring-2 focus:ring-brand/15'}"
										/>
									{/each}
								</div>

								{#if otpError}
									<p class="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-600">
										<AlertCircle class="h-3.5 w-3.5 shrink-0" />
										<span>{otpError}</span>
									</p>
								{/if}
							</div>

							<button
								type="button"
								onclick={() => verifyOtpCode(otpDigits.join(''))}
								disabled={isLoading || otpDigits.join('').length < 6}
								class="group flex h-[50px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand px-6 text-base font-semibold text-white shadow-xs transition-all hover:bg-[#007550] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:h-[52px]"
							>
								{#if isLoading}
									<Spinner class="h-5 w-5" label={m.common_loading()} />
								{:else}
									<span>{m.auth_continue()}</span>
									<ArrowRight
										class="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
									/>
								{/if}
							</button>

							<div class="mt-5 text-center">
								{#if cooldownSeconds > 0}
									<p class="text-xs font-medium text-[#7A8882] sm:text-sm">
										{m.auth_resend_in({ seconds: cooldownSeconds })}
									</p>
								{:else}
									<button
										type="button"
										onclick={handleResendCode}
										disabled={isResending}
										class="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-brand transition-colors hover:underline disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
									>
										{#if isResending}
											<Spinner class="h-3.5 w-3.5" />
											<span>{m.auth_resend_sending()}</span>
										{:else}
											{m.auth_resend()}
										{/if}
									</button>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</main>

	<footer class="w-full py-2 text-center text-xs text-[#94A39D]">
		{m.auth_footer({ year: String(year) })}
	</footer>
</div>

{#if legalModalType}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
		<div class="w-full max-w-md rounded-2xl border border-[#E1E6E2] bg-white p-6 shadow-lg sm:p-7">
			<h3 class="mb-2 text-base font-bold text-ink-deep sm:text-lg">
				{legalModalType === 'terms' ? m.auth_terms_title() : m.auth_privacy_title()}
			</h3>
			<p class="mb-6 text-xs leading-relaxed text-[#4A5852] sm:text-sm">
				{legalModalType === 'terms' ? m.auth_terms_body() : m.auth_privacy_body()}
			</p>
			<div class="flex justify-end">
				<button
					type="button"
					onclick={() => (legalModalType = null)}
					class="cursor-pointer rounded-xl bg-brand px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#007550] sm:text-sm"
				>
					{m.common_close()}
				</button>
			</div>
		</div>
	</div>
{/if}
