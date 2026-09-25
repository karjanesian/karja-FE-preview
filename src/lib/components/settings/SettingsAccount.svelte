<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { seller } from '$lib/stores/seller.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { isBankConfigured, isIdentityVerified } from '$lib/domain/payout';
	import { getBankAccount, updateBankAccount } from '$lib/domain/bankAccountApi';
	import { ApiError, isNetworkError } from '$lib/api';
	import * as Select from '$lib/components/ui/select';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Building2 from 'lucide-svelte/icons/building-2';
	import Check from 'lucide-svelte/icons/check';
	import Clock from 'lucide-svelte/icons/clock';
	import Edit3 from 'lucide-svelte/icons/edit-3';
	import Save from 'lucide-svelte/icons/save';
	import ShieldAlert from 'lucide-svelte/icons/shield-alert';

	type Props = { onToast: (msg: string) => void };
	let { onToast }: Props = $props();

	const profile = $derived(seller.sellerProfile);
	const identityVerified = $derived(isIdentityVerified(profile));

	const hasExistingBank = $derived(isBankConfigured(profile));
	const seedBank = seller.sellerProfile.bankInfo;

	let isEditingBank = $state(!isBankConfigured(seller.sellerProfile));
	let bankName = $state(seedBank?.bank || 'BCA (Bank Central Asia)');
	let accountNumber = $state(seedBank?.accountNumber || '');
	let accountHolder = $state(seedBank?.accountHolder || seller.sellerProfile.name || '');
	let isSaving = $state(false);

	const BANK_OPTIONS = [
		'BCA (Bank Central Asia)',
		'Bank Mandiri',
		'BNI (Bank Negara Indonesia)',
		'BRI (Bank Rakyat Indonesia)',
		'CIMB Niaga',
		'Bank Jago',
		'SeaBank',
		'Bank Syariah Indonesia (BSI)',
		'Permata Bank',
		'Bank Danamon'
	];

	let bankOptions = $state([...BANK_OPTIONS]);

	const inputClass =
		'h-11 w-full rounded-xl border border-[#D8DFDC] bg-white px-3.5 text-xs text-[#0E2E25] transition-colors focus:border-[#0C7B58] focus:outline-none focus:ring-1 focus:ring-[#0C7B58]/10';

	onMount(() => {
		void (async () => {
			try {
				const bank = await getBankAccount();
				if (!bank) return;
				bankName = bank.bank;
				accountNumber = bank.accountNumber;
				accountHolder = bank.accountHolder;
				if (!bankOptions.includes(bank.bank)) bankOptions = [bank.bank, ...bankOptions];
				seller.updateProfile({
					bankInfo: {
						bank: bank.bank,
						accountNumber: bank.accountNumber,
						accountHolder: bank.accountHolder
					}
				});
			} catch (e) {
				if (!isNetworkError(e)) console.error('[karja] muat rekening bank gagal:', e);
			}
		})();
	});

	async function handleSaveBank(e: SubmitEvent) {
		e.preventDefault();
		if (!accountNumber.trim()) {
			onToast(m.se_toast_bank_number_required());
			return;
		}
		if (accountNumber.trim().length < 6 || accountNumber.trim().length > 34) {
			onToast(m.se_toast_bank_number_invalid());
			return;
		}
		if (!accountHolder.trim()) {
			onToast(m.se_toast_bank_holder_required());
			return;
		}

		const isUpdate = hasExistingBank;
		const bankInfo = {
			bank: bankName,
			accountNumber: accountNumber.trim(),
			accountHolder: accountHolder.trim()
		};
		if (isSaving) return;
		isSaving = true;

		try {
			const saved = await updateBankAccount(bankInfo);
			seller.updateProfile({
				bankInfo: {
					bank: saved.bank,
					accountNumber: saved.accountNumber,
					accountHolder: saved.accountHolder
				}
			});
			isEditingBank = false;
			onToast(isUpdate ? m.se_toast_bank_updated() : m.se_toast_bank_saved());
		} catch (err) {
			if (isNetworkError(err)) {
				seller.updateProfile({ bankInfo });
				isEditingBank = false;
				onToast(isUpdate ? m.se_toast_bank_updated() : m.se_toast_bank_saved());
			} else {
				onToast(err instanceof ApiError ? err.message : m.se_toast_bank_save_failed());
			}
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="space-y-6 rounded-2xl border border-[#E2E8E4] bg-white p-6 shadow-xs sm:p-8">
	<div class="border-b border-[#F0F4F2] pb-4">
		<h2 class="text-lg font-bold text-[#0E2E25]">{m.se_tab_account()}</h2>
		<p class="mt-0.5 text-xs text-[#52776C]">{m.se_bank_desc()}</p>
	</div>

	{#if !identityVerified}
		<div class="max-w-xl space-y-4 rounded-2xl border border-[#E2E8E4] bg-white p-6">
			{#if profile.verification?.status === 'pending'}
				<div class="space-y-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700"
					>
						<Clock class="h-5 w-5" />
					</div>
					<div class="space-y-0.5">
						<h3 class="text-sm font-bold text-[#0E2E25]">{m.se_status_pending()}</h3>
						<p class="text-xs leading-relaxed text-[#52776C]">{m.se_bank_gate_pending_desc()}</p>
					</div>
					<button
						type="button"
						onclick={() => void goto('/dashboard/settings/verification')}
						class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0C7B58] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#096649]"
					>
						<span>{m.se_btn_view_verification()}</span>
						<ArrowRight class="h-3.5 w-3.5" />
					</button>
				</div>
			{:else}
				<div class="space-y-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-xl border border-[#CCE6D6] bg-[#EAF8F0] text-[#0C7B58]"
					>
						<ShieldAlert class="h-5 w-5" />
					</div>
					<div class="space-y-0.5">
						<h3 class="text-sm font-bold text-[#0E2E25]">{m.se_bank_gate_title()}</h3>
						<p class="text-xs leading-relaxed text-[#52776C]">{m.se_bank_gate_desc()}</p>
					</div>
					<button
						type="button"
						onclick={() => void goto('/dashboard/settings/verification')}
						class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0C7B58] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#096649]"
					>
						<span>{m.se_btn_verify_identity()}</span>
						<ArrowRight class="h-3.5 w-3.5" />
					</button>
				</div>
			{/if}
		</div>
	{:else}
		<div class="max-w-xl space-y-5">
			{#if !isEditingBank && hasExistingBank}
				<div class="space-y-4 rounded-xl border border-[#E2E8E4] bg-white p-5">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3.5">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D8DFDC] bg-[#F0F5F2] text-[#0C7B58]"
							>
								<Building2 class="h-5 w-5" />
							</div>
							<div>
								<div class="flex items-center gap-2">
									<h3 class="text-xs font-bold text-[#0E2E25]">{profile.bankInfo?.bank}</h3>
									<span
										class="inline-flex items-center gap-1 rounded-md border border-[#CCE6D6] bg-[#EAF8F0] px-2 py-0.5 text-[11px] font-semibold text-[#0C7B58]"
									>
										<Check class="h-3 w-3" />
										<span>{m.se_bank_ready()}</span>
									</span>
								</div>
								<div class="mt-1 font-mono text-xs font-semibold text-[#0C7B58]">
									{profile.bankInfo?.accountNumber}
								</div>
								<div class="mt-0.5 text-xs text-[#52776C]">
									{m.se_lbl_holder()}: <strong>{profile.bankInfo?.accountHolder}</strong>
								</div>
							</div>
						</div>
					</div>

					<div class="flex items-center justify-between gap-3 border-t border-[#F0F4F2] pt-3">
						<p class="text-[11px] text-[#52776C]">{m.se_bank_desc()}</p>
						<button
							type="button"
							onclick={() => (isEditingBank = true)}
							class="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-[#D8DFDC] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#0E2E25] transition-colors hover:bg-gray-50"
						>
							<Edit3 class="h-3.5 w-3.5 text-[#52776C]" />
							<span>{m.se_btn_edit_bank()}</span>
						</button>
					</div>
				</div>
			{:else}
				<form onsubmit={handleSaveBank} class="space-y-4">
					<div>
						<label for="bank-name" class="mb-1.5 block text-xs font-semibold text-[#184A3B]">
							{m.se_field_bank()}
						</label>
						<Select.Root
							items={Object.fromEntries(bankOptions.map((o) => [o, o])) as Record<string, string>}
							value={bankName}
							onValueChange={(v) => v && (bankName = v)}
						>
							<Select.Trigger id="bank-name" class="h-11 w-full text-xs">
								<Select.Value />
							</Select.Trigger>
							<Select.Content>
								{#each bankOptions as option (option)}
									<Select.Item value={option} label={option}>{option}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div>
						<label
							for="bank-account-number"
							class="mb-1.5 block text-xs font-semibold text-[#184A3B]"
						>
							{m.se_field_account_number()}
						</label>
						<input
							id="bank-account-number"
							type="text"
							required
							value={accountNumber}
							oninput={(e) => (accountNumber = e.currentTarget.value.replace(/\D/g, ''))}
							placeholder={m.se_ph_account_number()}
							class="{inputClass} font-mono"
						/>
					</div>

					<div>
						<label
							for="bank-account-holder"
							class="mb-1.5 block text-xs font-semibold text-[#184A3B]"
						>
							{m.se_field_holder()}
						</label>
						<input
							id="bank-account-holder"
							type="text"
							required
							bind:value={accountHolder}
							placeholder={m.se_ph_holder()}
							class={inputClass}
						/>
						<p class="mt-1 text-[11px] text-[#52776C]">{m.se_holder_hint()}</p>
					</div>

					<div class="flex items-center gap-2 pt-2">
						{#if hasExistingBank}
							<button
								type="button"
								onclick={() => (isEditingBank = false)}
								class="cursor-pointer px-4 py-2 text-xs font-semibold text-gray-600 transition-colors hover:text-gray-900"
							>
								{m.common_cancel()}
							</button>
						{/if}
						<button
							type="submit"
							disabled={isSaving}
							class="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0C7B58] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#096649] disabled:cursor-not-allowed disabled:opacity-60"
						>
							<Save class="h-4 w-4" />
							<span>{isSaving ? m.my_payout_processing() : m.se_btn_save_bank()}</span>
						</button>
					</div>
				</form>
			{/if}
		</div>
	{/if}
</div>
