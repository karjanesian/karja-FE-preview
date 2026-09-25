<script lang="ts">
	import { goto } from '$app/navigation';
	import { seller } from '$lib/stores/seller.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { formatRupiah } from '$lib/domain/pricing';
	import { MINIMUM_WITHDRAWAL_AMOUNT, isIdentityVerified, isPayoutReady } from '$lib/domain/payout';
	import { ApiError } from '$lib/api';
	import X from 'lucide-svelte/icons/x';
	import Building2 from 'lucide-svelte/icons/building-2';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Clock from 'lucide-svelte/icons/clock';
	import Check from 'lucide-svelte/icons/check';
	import CircleAlert from 'lucide-svelte/icons/circle-alert';

	type Props = {
		onClose: () => void;
	};

	let { onClose }: Props = $props();

	const availableBalance = $derived(
		seller.payoutBalance ? seller.payoutBalance.available : seller.availableBalance
	);

	let amount = $state(
		seller.payoutBalance ? seller.payoutBalance.available : seller.availableBalance
	);
	let isProcessing = $state(false);
	let isSuccess = $state(false);
	let errorMessage = $state<string | null>(null);

	const identityVerified = $derived(isIdentityVerified(seller.sellerProfile));
	const payoutReady = $derived(isPayoutReady(seller.sellerProfile));

	const bankName = $derived(seller.sellerProfile.bankInfo?.bank || 'BCA (Bank Central Asia)');
	const accountNumber = $derived(seller.sellerProfile.bankInfo?.accountNumber || '8291039481');
	const accountHolder = $derived(
		seller.sellerProfile.bankInfo?.accountHolder || seller.sellerProfile.name
	);

	const isTooLow = $derived(amount > 0 && amount < MINIMUM_WITHDRAWAL_AMOUNT);
	const isTooHigh = $derived(amount > availableBalance);
	const isValidAmount = $derived(amount >= MINIMUM_WITHDRAWAL_AMOUNT && amount <= availableBalance);

	function goToVerification() {
		void goto('/dashboard/settings/verification');
	}

	async function handlePayout() {
		if (!isValidAmount || isProcessing || !payoutReady) return;
		isProcessing = true;
		errorMessage = null;
		try {
			await seller.requestPayout(amount);
			isSuccess = true;
		} catch (e) {
			errorMessage = e instanceof ApiError ? e.message : m.my_payout_error();
		} finally {
			isProcessing = false;
		}
	}
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onClose()} />

<div
	role="presentation"
	class="fixed inset-0 z-50 flex items-center justify-center bg-[#092B21]/50 p-4 backdrop-blur-xs"
>
	<div
		class="relative w-full max-w-md space-y-5 rounded-2xl border border-[#E5ECE7] bg-white p-6 shadow-lg sm:p-7"
	>
		{#if !identityVerified}
			<div class="flex items-center justify-between border-b border-[#F0F4F2] pb-3">
				<h3 class="text-base font-bold text-[#0E2E25]">{m.my_money_withdraw()}</h3>
				<button
					type="button"
					onclick={onClose}
					aria-label={m.common_close()}
					class="cursor-pointer rounded-xl p-1.5 text-[#52776C] transition-colors hover:bg-[#F0F6F3] hover:text-[#0E2E25]"
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			<div class="space-y-4 py-4 text-center">
				<p class="text-xs font-medium text-amber-700">{m.my_money_verify_first()}</p>
				<button
					type="button"
					onclick={goToVerification}
					class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#008A5E] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#007550]"
				>
					<span>{m.my_money_setup_cta()}</span>
					<ArrowRight class="h-3.5 w-3.5" />
				</button>
			</div>
		{:else if isSuccess}
			<div class="flex items-center justify-between border-b border-[#F0F4F2] pb-3">
				<h3 class="text-base font-bold text-[#0E2E25]">{m.my_money_withdraw()}</h3>
				<button
					type="button"
					onclick={onClose}
					aria-label={m.common_close()}
					class="cursor-pointer rounded-xl p-1.5 text-[#52776C] transition-colors hover:bg-[#F0F6F3] hover:text-[#0E2E25]"
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			<div class="space-y-4 py-6 text-center">
				<div
					class="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#CCE6D6] bg-[#EAF8F0] text-lg font-bold text-[#008A5E]"
				>
					<Check class="h-6 w-6 text-[#008A5E]" />
				</div>
				<div class="space-y-1">
					<h4 class="text-base font-bold text-[#0E2E25]">{m.my_payout_success_title()}</h4>
					<p class="text-xs leading-relaxed text-[#52776C]">
						{m.my_payout_success_desc({ amount: formatRupiah(amount), bank: bankName })}
					</p>
				</div>
				<button
					type="button"
					onclick={onClose}
					class="w-full cursor-pointer rounded-xl bg-[#008A5E] py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#007550]"
				>
					{m.my_payout_done()}
				</button>
			</div>
		{:else}
			<div class="flex items-center justify-between border-b border-[#F0F4F2] pb-3">
				<h3 class="text-base font-bold text-[#0E2E25]">{m.my_money_withdraw()}</h3>
				<button
					type="button"
					onclick={onClose}
					aria-label={m.common_close()}
					class="cursor-pointer rounded-xl p-1.5 text-[#52776C] transition-colors hover:bg-[#F0F6F3] hover:text-[#0E2E25]"
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			<div class="space-y-4">
				<div class="space-y-1.5">
					<label for="payout-amount" class="text-xs font-semibold text-[#184A3B]">
						{m.my_payout_ask()}
					</label>
					<div class="relative">
						<span
							class="absolute top-1/2 left-3.5 -translate-y-1/2 text-xs font-bold text-[#52776C]"
						>
							Rp
						</span>
						<input
							id="payout-amount"
							type="number"
							max={availableBalance}
							min={MINIMUM_WITHDRAWAL_AMOUNT}
							value={amount || ''}
							oninput={(e) => (amount = Number(e.currentTarget.value))}
							placeholder="100000"
							class={`h-11 w-full rounded-xl border bg-white pr-4 pl-10 text-sm font-bold text-[#0E2E25] focus:outline-none ${
								isTooLow || isTooHigh
									? 'border-rose-400 focus:border-rose-500'
									: 'border-[#D8DFDC] focus:border-[#008A5E] focus:ring-1 focus:ring-[#008A5E]/10'
							}`}
						/>
					</div>

					{#if isTooLow}
						<p class="px-1 text-[11px] font-medium text-rose-600">{m.my_money_min_withdraw()}</p>
					{/if}
					{#if isTooHigh}
						<p class="px-1 text-[11px] font-medium text-rose-600">{m.my_payout_too_high()}</p>
					{/if}

					<div class="flex items-center justify-between px-1 text-[11px] text-[#52776C]">
						<span>{m.my_payout_available_line({ amount: formatRupiah(availableBalance) })}</span>
						<button
							type="button"
							onclick={() => (amount = availableBalance)}
							class="cursor-pointer font-bold text-[#008A5E] hover:underline"
						>
							{m.my_payout_withdraw_all()}
						</button>
					</div>
				</div>

				<div class="space-y-2 rounded-xl border border-[#E2E8E4] bg-white p-4">
					<div class="text-[11px] font-semibold text-[#52776C]">{m.my_payout_into()}</div>
					<div class="flex items-center gap-3">
						<div
							class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[#D8DFDC] bg-[#F0F5F2] text-[#008A5E]"
						>
							<Building2 class="h-4 w-4" />
						</div>
						<div>
							<div class="text-xs font-bold text-[#0E2E25]">{bankName}</div>
							<div class="font-mono text-xs text-[#52776C]">
								{accountNumber} • {accountHolder}
							</div>
						</div>
					</div>
				</div>

				<div
					class="flex items-center gap-2 rounded-xl border border-[#CCE6D6] bg-[#EAF8F0] p-3 text-[11px] text-[#285444]"
				>
					<Clock class="h-3.5 w-3.5 flex-shrink-0 text-[#008A5E]" />
					<span>{m.my_payout_note()}</span>
				</div>

				{#if errorMessage}
					<div
						class="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-800"
					>
						<CircleAlert class="h-3.5 w-3.5 flex-shrink-0 text-rose-600" />
						<span>{errorMessage}</span>
					</div>
				{/if}

				<div class="flex items-center gap-2 pt-2">
					<button
						type="button"
						onclick={onClose}
						class="w-1/3 cursor-pointer py-2.5 text-xs font-semibold text-[#52776C] transition-colors hover:text-[#0E2E25]"
					>
						{m.common_cancel()}
					</button>
					<button
						type="button"
						disabled={!isValidAmount || isProcessing || !payoutReady}
						onclick={handlePayout}
						class={`inline-flex w-2/3 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-white shadow-xs transition-all ${
							isValidAmount && !isProcessing && payoutReady
								? 'cursor-pointer bg-[#008A5E] hover:bg-[#007550]'
								: 'cursor-not-allowed bg-gray-200 text-gray-400'
						}`}
					>
						<span>{isProcessing ? m.my_payout_processing() : m.my_money_withdraw()}</span>
						<ArrowRight class="h-3.5 w-3.5" />
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
