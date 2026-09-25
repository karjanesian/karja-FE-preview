<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { seller } from '$lib/stores/seller.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { evaluateKarjaVerification, KARJA_VERIFIED_RULES } from '$lib/domain/verification';
	import { compressImageFile } from '$lib/domain/imageCompressor';
	import { getKycStatus, submitKyc, uploadKycDocument } from '$lib/domain/kycApi';
	import { ApiError, isNetworkError } from '$lib/api';
	import type { SellerVerification } from '$lib/types';
	import * as Popover from '$lib/components/ui/popover';
	import { Calendar } from '$lib/components/ui/calendar';
	import { parseDate } from '@internationalized/date';
	import Check from 'lucide-svelte/icons/check';
	import CalendarIcon from 'lucide-svelte/icons/calendar';
	import ShieldCheck from 'lucide-svelte/icons/shield-check';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import Clock from 'lucide-svelte/icons/clock';
	import CircleAlert from 'lucide-svelte/icons/circle-alert';
	import Upload from 'lucide-svelte/icons/upload';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import IdentityStatusPill from './IdentityStatusPill.svelte';
	import KarjaVerifiedBadge from './KarjaVerifiedBadge.svelte';

	type Props = { onToast: (msg: string) => void };
	let { onToast }: Props = $props();

	const profile = $derived(seller.sellerProfile);
	const currentVerification: SellerVerification = $derived(
		profile.verification ?? { status: 'unverified', emailVerified: true, phoneVerified: true }
	);

	const seedVerification = seller.sellerProfile.verification;
	const seedProfile = seller.sellerProfile;

	let ktpFullName = $state(seedVerification?.fullNameKtp || seedProfile.name || '');
	let ktpNik = $state(seedVerification?.nik || '');
	let ktpBirthDate = $state(seedVerification?.birthDate || '1995-06-15');
	let ktpPhotoFile: string | null = $state(seedVerification?.ktpPhotoUrl || null);
	let ktpFile: File | null = $state(null);
	let ktpFileName = $state('foto_ktp.jpg');
	let uploadError: string | null = $state(null);
	let isSubmitting = $state(false);

	let ktpInput: HTMLInputElement | undefined = $state();

	onMount(() => {
		void (async () => {
			try {
				const status = await getKycStatus();
				seller.applyKycStatus(status);
				if (status.ktpName) ktpFullName = status.ktpName;
				if (status.birthDate) ktpBirthDate = status.birthDate;
			} catch (e) {
				if (!isNetworkError(e)) console.error('[karja] muat status KYC gagal:', e);
			}
		})();
	});

	const verificationEvaluation = $derived(evaluateKarjaVerification(profile, seller.orders));

	const inputClass =
		'h-11 w-full rounded-xl border border-[#D8DFDC] bg-white px-3.5 text-xs text-[#0E2E25] transition-colors focus:border-[#0C7B58] focus:outline-none focus:ring-1 focus:ring-[#0C7B58]/10';

	function maskedNik(nik?: string | null): string {
		return nik ? `${nik.slice(0, 6)}******${nik.slice(-4)}` : '';
	}

	async function handleKtpUpload(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		if (file.size > 10 * 1024 * 1024) {
			uploadError = m.se_err_ktp_size();
			return;
		}
		uploadError = null;
		ktpFileName = file.name;
		ktpFile = file;
		try {
			ktpPhotoFile = await compressImageFile(file, 1000, 1000, 0.75);
		} catch {
			const reader = new FileReader();
			reader.onload = () => {
				ktpPhotoFile = reader.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	/** Fallback offline: simpan pengajuan secara lokal seperti sebelumnya. */
	function applyLocalPendingVerification() {
		const updatedVerification: SellerVerification = {
			...currentVerification,
			status: 'pending',
			fullNameKtp: ktpFullName,
			nik: ktpNik,
			birthDate: ktpBirthDate,
			ktpPhotoUrl: ktpPhotoFile ?? undefined,
			submittedAt: new Date().toLocaleDateString('id-ID', {
				day: 'numeric',
				month: 'short',
				year: 'numeric'
			}),
			rejectionReason: undefined
		};
		seller.updateProfile({ verification: updatedVerification });
	}

	async function handleSubmitKtpVerification(e: SubmitEvent) {
		e.preventDefault();
		if (!ktpPhotoFile) {
			uploadError = m.se_err_ktp_photo();
			return;
		}
		if (ktpNik.length !== 16) {
			uploadError = m.se_err_nik_length();
			return;
		}
		if (isSubmitting) return;
		isSubmitting = true;
		uploadError = null;

		try {
			if (!ktpFile) throw new ApiError(m.se_err_ktp_photo(), 400);
			const { fileId } = await uploadKycDocument(ktpFile);
			const status = await submitKyc({
				ktpName: ktpFullName,
				nik: ktpNik,
				birthDate: ktpBirthDate || undefined,
				fileId
			});
			seller.applyKycStatus(status, true);
			onToast(m.se_toast_verification_submitted());
		} catch (err) {
			if (isNetworkError(err)) {
				applyLocalPendingVerification();
				onToast(m.se_toast_verification_submitted());
			} else {
				uploadError = err instanceof ApiError ? err.message : m.se_err_ktp_generic();
			}
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="space-y-6">
	<div class="space-y-6 rounded-2xl border border-[#E2E8E4] bg-white p-6 shadow-xs sm:p-8">
		<div
			class="flex flex-col justify-between gap-2 border-b border-[#F0F4F2] pb-4 sm:flex-row sm:items-center"
		>
			<div>
				<div class="flex items-center gap-2">
					<ShieldCheck class="h-5 w-5 text-[#0C7B58]" />
					<h2 class="text-lg font-bold text-[#0E2E25]">{m.se_id_title()}</h2>
				</div>
				<p class="mt-1 text-xs text-[#52776C]">{m.se_id_desc()}</p>
			</div>
			<div>
				<IdentityStatusPill status={currentVerification.status} size="md" showLabel={true} />
			</div>
		</div>

		{#if currentVerification.status === 'verified'}
			<div class="space-y-6">
				<div
					class="flex items-start gap-3.5 rounded-xl border border-[#CCE6D6] bg-[#EAF8F0] p-4 text-xs text-[#0E2E25]"
				>
					<CheckCircle class="mt-0.5 h-4 w-4 shrink-0 text-[#0C7B58]" />
					<div class="space-y-0.5">
						<h3 class="text-xs font-bold text-[#0E2E25]">{m.se_status_verified()}</h3>
						<p class="text-xs leading-relaxed text-[#52776C]">{m.se_id_verified_desc()}</p>
					</div>
				</div>

				<div
					class="grid grid-cols-1 gap-4 rounded-xl border border-[#E2E8E4] bg-white p-4 text-xs sm:grid-cols-2"
				>
					<div>
						<span class="block text-[11px] text-gray-500">{m.se_field_ktp_name()}:</span>
						<p class="mt-0.5 text-xs font-semibold text-[#0E2E25]">
							{currentVerification.fullNameKtp || profile.name}
						</p>
					</div>
					<div>
						<span class="block text-[11px] text-gray-500">{m.se_field_nik()}:</span>
						<p class="mt-0.5 font-mono text-xs font-semibold text-[#0E2E25]">
							{maskedNik(currentVerification.nik) || '317101******0001'}
						</p>
					</div>
					{#if currentVerification.birthDate}
						<div>
							<span class="block text-[11px] text-gray-500">{m.se_field_birthdate()}:</span>
							<p class="mt-0.5 font-medium text-[#0E2E25]">{currentVerification.birthDate}</p>
						</div>
					{/if}
					{#if currentVerification.verifiedAt}
						<div>
							<span class="block text-[11px] text-gray-500">{m.se_lbl_verified_at()}</span>
							<p class="mt-0.5 font-medium text-[#0E2E25]">{currentVerification.verifiedAt}</p>
						</div>
					{/if}
				</div>

				<div
					class="flex flex-col justify-between gap-3 border-t border-[#F0F4F2] pt-2 sm:flex-row sm:items-center"
				>
					<span class="text-xs text-[#52776C]">{m.se_id_verified_footer()}</span>
					<button
						type="button"
						onclick={() => void goto('/dashboard/settings/account')}
						class="inline-flex cursor-pointer items-center gap-1.5 self-start rounded-xl bg-[#0C7B58] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#096649] sm:self-auto"
					>
						<span>{m.se_btn_goto_bank()}</span>
						<ArrowRight class="h-3.5 w-3.5" />
					</button>
				</div>
			</div>
		{:else if currentVerification.status === 'needs_update' || currentVerification.status === 'rejected'}
			<div class="space-y-5">
				<div
					class="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900"
				>
					<XCircle class="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
					<div class="space-y-0.5">
						<h3 class="text-xs font-bold text-rose-950">{m.se_id_failed_title()}</h3>
						<p class="text-xs leading-relaxed text-rose-800">
							{currentVerification.rejectionReason || m.se_id_failed_default()}
						</p>
					</div>
				</div>

				<button
					type="button"
					onclick={() => {
						seller.updateProfile({
							verification: { ...currentVerification, status: 'unverified' }
						});
					}}
					class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0C7B58] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#096649]"
				>
					<RefreshCw class="h-4 w-4" />
					<span>{m.se_btn_update_data()}</span>
				</button>
			</div>
		{:else if currentVerification.status === 'pending'}
			<div class="space-y-5">
				<div
					class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900"
				>
					<Clock class="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
					<div class="space-y-0.5">
						<h3 class="text-xs font-bold text-amber-950">{m.se_status_pending()}</h3>
						<p class="text-xs leading-relaxed text-amber-800">{m.se_pending_banner_desc()}</p>
					</div>
				</div>

				<div class="space-y-3 rounded-xl border border-[#E2E8E4] bg-white p-4 text-xs">
					<h4 class="text-xs font-bold text-[#0E2E25]">{m.se_id_submitted_data()}</h4>
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div>
							<span class="block text-[11px] text-gray-500">{m.se_field_ktp_name()}:</span>
							<strong class="text-xs text-[#0E2E25]">
								{currentVerification.fullNameKtp || ktpFullName}
							</strong>
						</div>
						<div>
							<span class="block text-[11px] text-gray-500">{m.se_field_nik()}:</span>
							<strong class="font-mono text-xs text-[#0E2E25]">
								{maskedNik(currentVerification.nik) || (ktpNik ? maskedNik(ktpNik) : '-')}
							</strong>
						</div>
						{#if currentVerification.birthDate}
							<div>
								<span class="block text-[11px] text-gray-500">{m.se_field_birthdate()}:</span>
								<span class="font-medium text-[#0E2E25]">{currentVerification.birthDate}</span>
							</div>
						{/if}
						{#if currentVerification.submittedAt}
							<div>
								<span class="block text-[11px] text-gray-500">{m.se_lbl_submitted_at()}</span>
								<span class="font-medium text-[#0E2E25]">{currentVerification.submittedAt}</span>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{:else}
			<form onsubmit={handleSubmitKtpVerification} class="space-y-5">
				{#if uploadError}
					<div
						class="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
					>
						<XCircle class="h-4 w-4 shrink-0 text-rose-600" />
						<span>{uploadError}</span>
					</div>
				{/if}

				<input
					type="file"
					bind:this={ktpInput}
					onchange={handleKtpUpload}
					accept="image/png, image/jpeg, image/webp"
					class="hidden"
					id="ktp-file-input"
				/>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<label for="ktp-name" class="mb-1.5 block text-xs font-semibold text-[#184A3B]">
							{m.se_field_ktp_name()}
						</label>
						<input
							id="ktp-name"
							type="text"
							required
							bind:value={ktpFullName}
							placeholder={m.se_ph_ktp_name()}
							class={inputClass}
						/>
					</div>

					<div>
						<label for="ktp-nik" class="mb-1.5 block text-xs font-semibold text-[#184A3B]">
							{m.se_field_nik()}
						</label>
						<input
							id="ktp-nik"
							type="text"
							required
							maxlength="16"
							value={ktpNik}
							oninput={(e) => (ktpNik = e.currentTarget.value.replace(/\D/g, ''))}
							placeholder={m.se_ph_nik()}
							class="{inputClass} font-mono"
						/>
					</div>
				</div>

				<div class="max-w-xs">
					<label for="ktp-birthdate" class="mb-1.5 block text-xs font-semibold text-[#184A3B]">
						{m.se_field_birthdate()}
					</label>
					<Popover.Root>
						<Popover.Trigger>
							<button
								type="button"
								id="ktp-birthdate"
								class="flex h-11 w-full cursor-pointer items-center gap-2 rounded-xl border border-[#D8DFDC] bg-white px-3 text-xs transition-colors hover:border-[#0C7B58] focus-visible:ring-1 focus-visible:ring-[#0C7B58] focus-visible:outline-none"
							>
								<CalendarIcon class="h-3.5 w-3.5 text-sage" />
								<span class={ktpBirthDate ? 'text-[#0E2E25]' : 'text-[#94A39D]'}>
									{ktpBirthDate || '—'}
								</span>
							</button>
						</Popover.Trigger>
						<Popover.Content class="w-auto p-0">
							<Calendar
								type="single"
								value={ktpBirthDate ? parseDate(ktpBirthDate) : undefined}
								onValueChange={(d) => (ktpBirthDate = d ? d.toString() : '')}
							/>
						</Popover.Content>
					</Popover.Root>
				</div>

				<div class="space-y-2 pt-2">
					<span class="block text-xs font-semibold text-[#184A3B]">{m.se_upload_label()}</span>
					<p class="text-[11px] text-[#52776C]">{m.se_upload_hint()}</p>

					{#if ktpPhotoFile && ktpPhotoFile.trim().length > 0}
						<div class="max-w-md space-y-2.5 rounded-xl border border-[#D8DFDC] bg-white p-3.5">
							<div
								class="flex h-40 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
							>
								<img
									src={ktpPhotoFile}
									alt={m.se_ktp_preview_alt()}
									class="h-full w-full object-contain"
								/>
							</div>
							<div class="flex items-center justify-between pt-1 text-xs">
								<span class="max-w-[200px] truncate font-medium text-gray-600">{ktpFileName}</span>
								<div class="flex items-center gap-3">
									<button
										type="button"
										onclick={() => ktpInput?.click()}
										class="cursor-pointer font-semibold text-[#0C7B58] hover:underline"
									>
										{m.se_btn_replace()}
									</button>
									<button
										type="button"
										onclick={() => (ktpPhotoFile = null)}
										class="cursor-pointer font-semibold text-rose-600 hover:underline"
									>
										{m.common_delete()}
									</button>
								</div>
							</div>
						</div>
					{:else}
						<button
							type="button"
							onclick={() => ktpInput?.click()}
							class="flex max-w-md cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#D8DFDC] bg-white p-6 text-center transition-colors hover:border-[#0C7B58] hover:bg-gray-50/50"
						>
							<span
								class="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF8F0] text-[#0C7B58]"
							>
								<Upload class="h-4 w-4" />
							</span>
							<span>
								<span class="block text-xs font-semibold text-[#0E2E25]">{m.se_upload_label()}</span
								>
								<span class="text-[11px] text-gray-500">{m.se_upload_formats()}</span>
							</span>
						</button>
					{/if}
				</div>

				<p class="text-[11px] text-[#52776C]">{m.se_upload_confirm()}</p>

				<div class="pt-1">
					<button
						type="submit"
						disabled={isSubmitting}
						class="w-full cursor-pointer rounded-xl bg-[#0C7B58] px-6 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#096649] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
					>
						{isSubmitting ? m.my_payout_processing() : m.se_btn_submit_verification()}
					</button>
				</div>
			</form>
		{/if}
	</div>

	<div class="space-y-6 rounded-2xl border border-[#E2E8E4] bg-white p-6 shadow-xs sm:p-8">
		<div
			class="flex flex-col justify-between gap-3 border-b border-[#F0F4F2] pb-4 sm:flex-row sm:items-center"
		>
			<div>
				<div class="flex items-center gap-2">
					<KarjaVerifiedBadge size="md" />
					<h2 class="text-lg font-bold text-[#0E2E25]">{m.se_kv_title()}</h2>
				</div>
				<p class="mt-1 max-w-2xl text-xs leading-relaxed text-[#52776C]">{m.se_kv_desc()}</p>
			</div>

			<div>
				{#if verificationEvaluation.karjaVerificationStatus === 'verified'}
					<span
						class="inline-flex items-center gap-1.5 rounded-full border border-[#CCE6D6] bg-[#EAF8F0] px-3 py-1 text-xs font-semibold text-[#0C7B58]"
					>
						<KarjaVerifiedBadge size="sm" />
						<span>{m.se_kv_pill_verified()}</span>
					</span>
				{:else if verificationEvaluation.karjaVerificationStatus === 'revoked'}
					<span
						class="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
					>
						<CircleAlert class="h-3.5 w-3.5 text-rose-600" />
						<span>{m.se_kv_pill_revoked()}</span>
					</span>
				{:else}
					<span
						class="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600"
					>
						<Clock class="h-3.5 w-3.5 text-gray-500" />
						<span>{m.se_kv_pill_not_eligible()}</span>
					</span>
				{/if}
			</div>
		</div>

		{#if verificationEvaluation.karjaVerificationStatus === 'verified'}
			<div
				class="flex items-start gap-3.5 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-4 text-xs text-[#0E2E25]"
			>
				<div class="mt-0.5 shrink-0">
					<KarjaVerifiedBadge size="md" />
				</div>
				<div class="space-y-1">
					<h3 class="text-xs font-bold text-[#0E2E25]">{m.se_kv_active_title()}</h3>
					<p class="text-xs leading-relaxed text-[#166534]">{m.se_kv_active_desc()}</p>
				</div>
			</div>
		{:else if verificationEvaluation.karjaVerificationStatus === 'revoked'}
			<div
				class="flex items-start gap-3.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-950"
			>
				<CircleAlert class="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
				<div class="space-y-1">
					<h3 class="text-xs font-bold text-rose-950">{m.se_kv_revoked_title()}</h3>
					<p class="text-xs leading-relaxed text-rose-800">
						{currentVerification.karjaRevokedReason || m.se_kv_revoked_default()}
					</p>
				</div>
			</div>
		{:else}
			<div
				class="flex items-start gap-3.5 rounded-xl border border-[#E2E8E4] bg-[#F7F9F8] p-4 text-xs text-[#0E2E25]"
			>
				<Clock class="mt-0.5 h-4 w-4 shrink-0 text-[#52776C]" />
				<div class="space-y-1">
					<h3 class="text-xs font-bold text-[#0E2E25]">{m.se_kv_progress_title()}</h3>
					<p class="text-xs leading-relaxed text-[#52776C]">{m.se_kv_progress_desc()}</p>
				</div>
			</div>
		{/if}

		<div class="space-y-3 pt-2">
			<h4 class="text-xs font-bold text-[#0E2E25]">{m.se_kv_requirements()}</h4>

			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div class="space-y-2 rounded-xl border border-[#E2E8E4] bg-white p-3.5">
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold text-[#0E2E25]">{m.se_req1_title()}</span>
						{#if verificationEvaluation.requirements?.identityVerified?.met}
							<span class="inline-flex items-center gap-1 text-[11px] font-bold text-[#0C7B58]">
								<Check class="h-3.5 w-3.5" />
								<span>{m.se_req1_met()}</span>
							</span>
						{:else}
							<span class="text-[11px] font-medium text-gray-500">{m.se_req1_unmet()}</span>
						{/if}
					</div>
					<p class="text-[11px] text-[#52776C]">{m.se_req1_desc()}</p>
				</div>

				<div class="space-y-2 rounded-xl border border-[#E2E8E4] bg-white p-3.5">
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold text-[#0E2E25]">{m.se_req2_title()}</span>
						{#if verificationEvaluation.requirements?.payoutVerified?.met}
							<span class="inline-flex items-center gap-1 text-[11px] font-bold text-[#0C7B58]">
								<Check class="h-3.5 w-3.5" />
								<span>{m.se_req2_met()}</span>
							</span>
						{:else}
							<span class="text-[11px] font-medium text-gray-500">{m.se_req2_unmet()}</span>
						{/if}
					</div>
					<p class="text-[11px] text-[#52776C]">{m.se_req2_desc()}</p>
				</div>

				<div class="space-y-2 rounded-xl border border-[#E2E8E4] bg-white p-3.5">
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold text-[#0E2E25]">{m.se_req3_title()}</span>
						{#if verificationEvaluation.requirements?.completedOrders?.met}
							<span class="inline-flex items-center gap-1 text-[11px] font-bold text-[#0C7B58]">
								<Check class="h-3.5 w-3.5" />
								<span
									>{m.se_req3_count({
										count: verificationEvaluation.stats?.completedOrdersCount ?? 0
									})}</span
								>
							</span>
						{:else}
							<span class="text-[11px] font-bold text-[#0E2E25]">
								{m.se_progress_count({
									current: verificationEvaluation.stats?.completedOrdersCount ?? 0,
									required: KARJA_VERIFIED_RULES.minCompletedOrders
								})}
							</span>
						{/if}
					</div>
					<div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
						<div
							class="h-full rounded-full transition-all {verificationEvaluation.requirements
								?.completedOrders?.met
								? 'bg-[#0C7B58]'
								: 'bg-[#184A3B]'}"
							style="width: {Math.min(
								100,
								((verificationEvaluation.stats?.completedOrdersCount ?? 0) /
									KARJA_VERIFIED_RULES.minCompletedOrders) *
									100
							)}%"
						></div>
					</div>
					<p class="text-[11px] text-[#52776C]">
						{m.se_req3_desc({ min: KARJA_VERIFIED_RULES.minCompletedOrders })}
					</p>
				</div>

				<div class="space-y-2 rounded-xl border border-[#E2E8E4] bg-white p-3.5">
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold text-[#0E2E25]">{m.se_req4_title()}</span>
						{#if verificationEvaluation.requirements?.distinctBuyers?.met}
							<span class="inline-flex items-center gap-1 text-[11px] font-bold text-[#0C7B58]">
								<Check class="h-3.5 w-3.5" />
								<span
									>{m.se_req4_count({
										count: verificationEvaluation.stats?.distinctBuyersCount ?? 0
									})}</span
								>
							</span>
						{:else}
							<span class="text-[11px] font-bold text-[#0E2E25]">
								{m.se_progress_count({
									current: verificationEvaluation.stats?.distinctBuyersCount ?? 0,
									required: KARJA_VERIFIED_RULES.minDistinctBuyers
								})}
							</span>
						{/if}
					</div>
					<div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
						<div
							class="h-full rounded-full transition-all {verificationEvaluation.requirements
								?.distinctBuyers?.met
								? 'bg-[#0C7B58]'
								: 'bg-[#184A3B]'}"
							style="width: {Math.min(
								100,
								((verificationEvaluation.stats?.distinctBuyersCount ?? 0) /
									KARJA_VERIFIED_RULES.minDistinctBuyers) *
									100
							)}%"
						></div>
					</div>
					<p class="text-[11px] text-[#52776C]">
						{m.se_req4_desc({ min: KARJA_VERIFIED_RULES.minDistinctBuyers })}
					</p>
				</div>

				<div class="space-y-2 rounded-xl border border-[#E2E8E4] bg-white p-3.5">
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold text-[#0E2E25]">{m.se_req5_title()}</span>
						{#if verificationEvaluation.requirements?.accountStanding?.met}
							<span class="inline-flex items-center gap-1 text-[11px] font-bold text-[#0C7B58]">
								<Check class="h-3.5 w-3.5" />
								<span>{m.se_req5_met()}</span>
							</span>
						{:else}
							<span class="text-[11px] font-medium text-rose-600">{m.se_req5_unmet()}</span>
						{/if}
					</div>
					<p class="text-[11px] text-[#52776C]">{m.se_req5_desc()}</p>
				</div>

				<div class="space-y-2 rounded-xl border border-[#E2E8E4] bg-white p-3.5">
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold text-[#0E2E25]">{m.se_req6_title()}</span>
						{#if verificationEvaluation.requirements?.trustSafetyClear?.met}
							<span class="inline-flex items-center gap-1 text-[11px] font-bold text-[#0C7B58]">
								<Check class="h-3.5 w-3.5" />
								<span>{m.se_req6_met()}</span>
							</span>
						{:else}
							<span class="text-[11px] font-medium text-amber-600">{m.se_req6_unmet()}</span>
						{/if}
					</div>
					<p class="text-[11px] text-[#52776C]">{m.se_req6_desc()}</p>
				</div>
			</div>
		</div>
	</div>
</div>
