<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { seller } from '$lib/stores/seller.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { formatRupiah } from '$lib/domain/pricing';
	import {
		MINIMUM_WITHDRAWAL_AMOUNT,
		canWithdraw,
		isIdentityVerified,
		isPayoutReady
	} from '$lib/domain/payout';
	import type { Transaction } from '$lib/types';
	import PageContent from '$lib/components/common/PageContent.svelte';
	import PageFrame from '$lib/components/common/PageFrame.svelte';
	import PageHeader from '$lib/components/common/PageHeader.svelte';
	import Spinner from '$lib/components/common/Spinner.svelte';
	import PayoutModal from '$lib/components/wallet/PayoutModal.svelte';
	import TransactionDetailModal from '$lib/components/wallet/TransactionDetailModal.svelte';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Building2 from 'lucide-svelte/icons/building-2';
	import Check from 'lucide-svelte/icons/check';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Clock from 'lucide-svelte/icons/clock';
	import HelpCircle from 'lucide-svelte/icons/help-circle';
	import History from 'lucide-svelte/icons/history';
	import Receipt from 'lucide-svelte/icons/receipt';
	import ShieldCheck from 'lucide-svelte/icons/shield-check';

	type WalletTab = 'penjelasan' | 'transaksi' | 'pencairan';

	type TabIcon = typeof HelpCircle | typeof Receipt | typeof History;

	type WalletTabDef = { id: WalletTab; label: string; icon: TabIcon };

	let activeTab = $state<WalletTab>('penjelasan');
	let showPayoutModal = $state(false);
	let selectedTransaction = $state<Transaction | null>(null);

	// Saldo dari BE dipakai kalau sudah tersinkron; offline → fallback ke hitungan lokal.
	const apiBalance = $derived(seller.payoutBalance);
	const availableBalance = $derived(apiBalance ? apiBalance.available : seller.availableBalance);
	const pendingBalance = $derived(apiBalance ? apiBalance.pending : seller.pendingBalance);
	const totalRevenue = $derived(apiBalance ? apiBalance.total : seller.totalRevenue);
	const transactions = $derived(seller.transactions ?? []);
	const payouts = $derived(seller.payouts ?? []);

	// --- Paginasi pencairan (server-side + fallback client) ---
	const PAYOUT_PAGE_SIZE = 10;
	let payoutClientPage = $state(1);
	const payoutsPage = $derived(seller.payoutsPage);
	const usingServerPayouts = $derived(payoutsPage?.server === true);
	const loadingPayouts = $derived(!payoutsPage);
	const payoutTotal = $derived(
		payoutsPage ? (payoutsPage.server ? (payoutsPage.total ?? 0) : payouts.length) : 0
	);
	const payoutPageCount = $derived(Math.max(1, Math.ceil(payoutTotal / PAYOUT_PAGE_SIZE)));
	const payoutPage = $derived(
		usingServerPayouts
			? Math.min(payoutsPage?.page ?? 1, payoutPageCount)
			: Math.min(payoutClientPage, payoutPageCount)
	);
	const payoutItems = $derived(
		payoutsPage
			? payoutsPage.server
				? (payoutsPage.items ?? [])
				: payouts.slice((payoutPage - 1) * PAYOUT_PAGE_SIZE, payoutPage * PAYOUT_PAGE_SIZE)
			: []
	);
	const payoutRangeFrom = $derived(payoutTotal === 0 ? 0 : (payoutPage - 1) * PAYOUT_PAGE_SIZE + 1);
	const payoutRangeTo = $derived(Math.min(payoutPage * PAYOUT_PAGE_SIZE, payoutTotal));

	function loadPayouts(targetPage: number) {
		void seller.loadPayoutsPage({ page: targetPage, limit: PAYOUT_PAGE_SIZE }, payouts);
	}

	function goToPayoutPage(target: number) {
		const clamped = Math.max(1, Math.min(target, payoutPageCount));
		if (usingServerPayouts) loadPayouts(clamped);
		else payoutClientPage = clamped;
	}

	onMount(() => loadPayouts(1));

	const payoutReady = $derived(isPayoutReady(seller.sellerProfile));
	const identityVerified = $derived(isIdentityVerified(seller.sellerProfile));
	const eligibleToWithdraw = $derived(canWithdraw(availableBalance, seller.sellerProfile));

	const bankName = $derived(seller.sellerProfile.bankInfo?.bank || 'BCA (Bank Central Asia)');
	const bankAccountNumber = $derived(seller.sellerProfile.bankInfo?.accountNumber || '8291039481');

	const tabs = $derived<WalletTabDef[]>([
		{ id: 'penjelasan', label: m.my_money_tab_explainer(), icon: HelpCircle },
		{
			id: 'transaksi',
			label:
				transactions.length > 0
					? m.my_money_tab_transactions_count({ count: transactions.length })
					: m.my_money_tab_transactions(),
			icon: Receipt
		},
		{
			id: 'pencairan',
			label:
				payouts.length > 0
					? m.my_money_tab_payouts_count({ count: payouts.length })
					: m.my_money_tab_payouts(),
			icon: History
		}
	]);

	function navigateToSettings() {
		void goto(identityVerified ? '/dashboard/settings' : '/dashboard/settings/verification');
	}

	function selectTransaction(tx: Transaction) {
		selectedTransaction = tx;
	}
</script>

<PageFrame>
	<PageContent variant="standard">
		<PageHeader title={m.nav_wallet()} description={m.my_money_desc()} />

		<div class="rounded-2xl border border-[#E2E8E4] bg-white p-6 shadow-xs sm:p-7">
			<div class="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8 md:divide-x md:divide-[#F0F4F2]">
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold text-[#52776C]">
							{m.my_money_available()}
						</span>
					</div>

					<div class="text-2xl font-bold tracking-tight text-[#008A5E] sm:text-3xl">
						{formatRupiah(availableBalance)}
					</div>

					<p class="text-xs leading-relaxed text-[#52776C]">{m.my_money_available_hint()}</p>

					<div class="space-y-2 pt-2">
						{#if !payoutReady}
							<div class="space-y-2">
								<span class="block text-xs font-medium text-amber-700">
									{identityVerified ? m.my_money_bank_not_ready() : m.my_money_verify_first()}
								</span>
								<button
									type="button"
									onclick={navigateToSettings}
									class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#008A5E] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#007550]"
								>
									<span>{m.my_money_setup_cta()}</span>
									<ArrowRight class="h-3.5 w-3.5" />
								</button>
							</div>
						{:else if availableBalance >= MINIMUM_WITHDRAWAL_AMOUNT}
							<div class="space-y-2">
								<button
									type="button"
									onclick={() => (showPayoutModal = true)}
									class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#008A5E] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#007550]"
								>
									<span>{m.my_money_withdraw()}</span>
									<ArrowRight class="h-3.5 w-3.5" />
								</button>
								<p class="text-[11px] text-[#52776C]">{m.my_money_min_withdraw()}</p>
								<p class="text-[11px] text-[#52776C]">
									{m.my_money_into({ bank: bankName, account: bankAccountNumber })}
								</p>
							</div>
						{:else if availableBalance > 0}
							<div class="space-y-2">
								<button
									type="button"
									disabled
									class="inline-flex cursor-not-allowed items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-400"
								>
									<span>{m.my_money_withdraw()}</span>
									<ArrowRight class="h-3.5 w-3.5" />
								</button>
								<p class="text-[11px] text-[#52776C]">{m.my_money_min_withdraw()}</p>
								<p class="text-[11px] font-medium text-amber-700">
									{m.my_money_short_by({
										amount: formatRupiah(MINIMUM_WITHDRAWAL_AMOUNT - availableBalance)
									})}
								</p>
							</div>
						{:else}
							<div class="space-y-2">
								<button
									type="button"
									disabled
									class="inline-flex cursor-not-allowed items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-400"
								>
									<span>{m.my_money_withdraw()}</span>
									<ArrowRight class="h-3.5 w-3.5" />
								</button>
								<p class="text-[11px] leading-relaxed text-[#52776C]">{m.my_money_none()}</p>
							</div>
						{/if}
					</div>
				</div>

				<div class="space-y-3 md:pl-8">
					<span class="block text-xs font-semibold text-[#52776C]">{m.money_processing()}</span>

					<div class="text-2xl font-bold tracking-tight text-[#0E2E25] sm:text-3xl">
						{formatRupiah(pendingBalance)}
					</div>

					<p class="text-xs leading-relaxed text-[#52776C]">{m.my_money_pending_hint()}</p>

					<div class="pt-2 text-xs text-[#52776C]">{m.my_money_pending_note()}</div>
				</div>

				<div class="space-y-3 md:pl-8">
					<span class="block text-xs font-semibold text-[#52776C]">{m.my_money_revenue()}</span>

					<div class="text-2xl font-bold tracking-tight text-[#0E2E25] sm:text-3xl">
						{formatRupiah(totalRevenue)}
					</div>

					<p class="text-xs leading-relaxed text-[#52776C]">{m.my_money_revenue_hint()}</p>

					<div class="pt-2 text-xs text-[#52776C]">{m.my_money_revenue_note()}</div>
				</div>
			</div>
		</div>

		<div class="-mb-[1px] border-b border-[#EFF5F1]">
			<div class="flex items-center gap-6 overflow-x-auto select-none sm:gap-8">
				{#each tabs as tab (tab.id)}
					{@const isActive = activeTab === tab.id}
					<button
						type="button"
						onclick={() => (activeTab = tab.id)}
						class={`relative flex cursor-pointer items-center gap-2 pb-3 text-xs font-semibold whitespace-nowrap transition-colors duration-150 sm:text-[13px] ${
							isActive ? 'text-[#0E2E25]' : 'text-[#52776C] hover:text-[#0E2E25]'
						}`}
					>
						<tab.icon class={`h-3.5 w-3.5 ${isActive ? 'text-[#008A5E]' : 'text-[#8CA399]'}`} />
						<span>{tab.label}</span>
						{#if isActive}
							<span class="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-[#008A5E]"></span>
						{/if}
					</button>
				{/each}
			</div>
		</div>

		{#if activeTab === 'penjelasan'}
			<div class="space-y-8 rounded-2xl border border-[#E2E8E4] bg-white p-6 shadow-xs sm:p-8">
				<div>
					<h2 class="text-base font-bold text-[#0E2E25]">{m.my_money_process_title()}</h2>
					<p class="mt-0.5 text-xs text-[#52776C]">{m.my_money_process_desc()}</p>
				</div>

				<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
					<div class="space-y-2.5 rounded-xl border border-[#E2E8E4] bg-white p-5">
						<div
							class="flex h-7 w-7 items-center justify-center rounded-full bg-[#F0F5F2] text-xs font-bold text-[#0C7B58]"
						>
							1
						</div>
						<h3 class="text-xs font-bold text-[#0E2E25]">{m.my_money_step1_title()}</h3>
						<p class="text-xs leading-relaxed text-[#52776C]">{m.my_money_step1_desc()}</p>
					</div>

					<div class="space-y-2.5 rounded-xl border border-[#E2E8E4] bg-white p-5">
						<div
							class="flex h-7 w-7 items-center justify-center rounded-full bg-[#F0F5F2] text-xs font-bold text-[#0C7B58]"
						>
							2
						</div>
						<h3 class="text-xs font-bold text-[#0E2E25]">{m.my_money_step2_title()}</h3>
						<p class="text-xs leading-relaxed text-[#52776C]">{m.my_money_step2_desc()}</p>
					</div>

					<div class="space-y-2.5 rounded-xl border border-[#E2E8E4] bg-white p-5">
						<div
							class="flex h-7 w-7 items-center justify-center rounded-full bg-[#F0F5F2] text-xs font-bold text-[#0C7B58]"
						>
							3
						</div>
						<h3 class="text-xs font-bold text-[#0E2E25]">{m.my_money_step3_title()}</h3>
						<p class="text-xs leading-relaxed text-[#52776C]">{m.my_money_step3_desc()}</p>
					</div>
				</div>

				<div
					class="flex items-start gap-3.5 rounded-xl border border-[#CCE6D6] bg-[#EAF8F0] p-5 text-xs text-[#0E2E25]"
				>
					<ShieldCheck class="mt-0.5 h-5 w-5 flex-shrink-0 text-[#0C7B58]" />
					<div class="space-y-1">
						<h4 class="text-xs font-bold text-[#0E2E25]">{m.my_money_fees_title()}</h4>
						<p class="text-xs leading-relaxed text-[#52776C]">{m.my_money_fees_desc()}</p>
					</div>
				</div>
			</div>
		{:else if activeTab === 'transaksi'}
			<div class="space-y-6 rounded-2xl border border-[#E2E8E4] bg-white p-6 shadow-xs sm:p-8">
				<div
					class="flex flex-col justify-between gap-2 border-b border-[#F0F4F2] pb-4 sm:flex-row sm:items-center"
				>
					<div>
						<h2 class="text-base font-bold text-[#0E2E25]">{m.my_money_list_title()}</h2>
						<p class="mt-0.5 text-xs text-[#52776C]">{m.my_money_list_desc()}</p>
					</div>
				</div>

				{#if transactions.length === 0}
					<div class="space-y-2 py-12 text-center">
						<Receipt class="mx-auto h-8 w-8 text-gray-300" />
						<h3 class="text-xs font-bold text-[#0E2E25]">{m.my_money_empty_trx_title()}</h3>
						<p class="mx-auto max-w-sm text-xs text-[#52776C]">{m.my_money_empty_trx_desc()}</p>
					</div>
				{:else}
					<div class="space-y-3">
						<div class="hidden overflow-x-auto md:block">
							<table class="w-full text-left text-xs">
								<thead>
									<tr class="border-b border-[#F0F4F2] text-[#52776C]">
										<th class="pb-3 font-semibold">{m.my_money_col_date()}</th>
										<th class="pb-3 font-semibold">{m.my_money_col_product()}</th>
										<th class="pb-3 text-right font-semibold">{m.my_money_col_amount()}</th>
										<th class="pb-3 text-right font-semibold">{m.my_money_col_fee()}</th>
										<th class="pb-3 text-right font-semibold">{m.my_money_col_payfee()}</th>
										<th class="pb-3 text-right font-semibold">{m.my_money_col_net()}</th>
										<th class="pb-3"></th>
									</tr>
								</thead>
								<tbody class="divide-y divide-[#F0F4F2]">
									{#each transactions as tx (tx.id)}
										<tr
											onclick={() => selectTransaction(tx)}
											class="cursor-pointer transition-colors hover:bg-gray-50/70"
										>
											<td class="py-3.5 font-mono text-[11px] text-gray-500">{tx.date}</td>
											<td class="max-w-xs truncate py-3.5 pr-4 font-medium text-[#0E2E25]">
												{tx.productTitle}
											</td>
											<td class="py-3.5 text-right font-medium text-gray-700">
												{formatRupiah(tx.amount)}
											</td>
											<td class="py-3.5 text-right font-medium text-rose-600">
												-{formatRupiah(tx.karjaFee)}
											</td>
											<td class="py-3.5 text-right font-medium text-rose-600">
												-{formatRupiah(tx.paymentFee)}
											</td>
											<td class="py-3.5 text-right font-bold text-[#0C7B58]">
												{formatRupiah(tx.netReceived)}
											</td>
											<td class="py-3.5 pl-2 text-right text-gray-400">
												<ChevronRight class="ml-auto h-4 w-4" />
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>

						<div class="divide-y divide-[#F0F4F2] md:hidden">
							{#each transactions as tx (tx.id)}
								<div
									role="button"
									tabindex="0"
									onclick={() => selectTransaction(tx)}
									onkeydown={(e) => e.key === 'Enter' && selectTransaction(tx)}
									class="cursor-pointer space-y-1.5 py-3.5 first:pt-0 last:pb-0"
								>
									<div class="flex items-start justify-between gap-2">
										<span class="line-clamp-1 text-xs font-semibold text-[#0E2E25]">
											{tx.productTitle}
										</span>
										<span class="flex-shrink-0 text-xs font-bold text-[#0C7B58]">
											{formatRupiah(tx.netReceived)}
										</span>
									</div>
									<div class="flex items-center justify-between text-[11px] text-[#52776C]">
										<span>{tx.date}</span>
										<span>{m.my_money_amount_line({ amount: formatRupiah(tx.amount) })}</span>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{:else if activeTab === 'pencairan'}
			<div class="space-y-6 rounded-2xl border border-[#E2E8E4] bg-white p-6 shadow-xs sm:p-8">
				<div
					class="flex flex-col justify-between gap-3 border-b border-[#F0F4F2] pb-4 sm:flex-row sm:items-center"
				>
					<div>
						<h2 class="text-base font-bold text-[#0E2E25]">{m.my_money_tab_payouts()}</h2>
						<p class="mt-0.5 text-xs text-[#52776C]">{m.my_money_payout_list_desc()}</p>
					</div>

					{#if eligibleToWithdraw}
						<button
							type="button"
							onclick={() => (showPayoutModal = true)}
							class="inline-flex cursor-pointer items-center gap-1.5 self-start rounded-xl bg-[#0C7B58] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#096649] sm:self-auto"
						>
							<span>{m.my_money_withdraw()}</span>
							<ArrowRight class="h-3.5 w-3.5" />
						</button>
					{/if}
				</div>

				{#if loadingPayouts}
					<div class="flex items-center justify-center py-12">
						<Spinner class="h-6 w-6 text-[#0C7B58]" label={m.common_loading()} />
					</div>
				{:else if payoutTotal === 0}
					<div class="space-y-2 py-12 text-center">
						<History class="mx-auto h-8 w-8 text-gray-300" />
						<h3 class="text-xs font-bold text-[#0E2E25]">{m.my_money_empty_payout_title()}</h3>
						<p class="mx-auto max-w-sm text-xs text-[#52776C]">{m.my_money_empty_payout_desc()}</p>
					</div>
				{:else}
					<div class="divide-y divide-[#F0F4F2]">
						{#each payoutItems as po (po.id)}
							<div
								class="flex flex-col justify-between gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
							>
								<div class="flex items-start gap-3.5">
									<div
										class="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[#D8DFDC] bg-[#F0F5F2] text-[#0C7B58]"
									>
										<Building2 class="h-4 w-4" />
									</div>
									<div>
										<div class="flex flex-wrap items-center gap-2">
											<span class="text-xs font-bold text-[#0E2E25]">{po.bankName}</span>
											<span class="font-mono text-[11px] text-gray-500">({po.accountNumber})</span>
											{#if po.status === 'paid'}
												<span
													class="inline-flex items-center gap-1 rounded-md border border-[#CCE6D6] bg-[#EAF8F0] px-2 py-0.5 text-[10px] font-medium text-[#0C7B58]"
												>
													<Check class="h-3 w-3 text-[#0C7B58]" />
													<span>{m.my_money_badge_paid()}</span>
												</span>
											{:else}
												<span
													class="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700"
												>
													<Clock class="h-3 w-3 text-amber-600" />
													<span>{m.my_money_badge_processing()}</span>
												</span>
											{/if}
										</div>
										<div class="mt-0.5 text-[11px] text-[#52776C]">
											{po.requestedAt} · {po.accountHolder}
										</div>
									</div>
								</div>

								<div
									class="flex w-full items-center justify-between gap-3 self-end sm:w-auto sm:justify-end sm:self-auto"
								>
									<div class="text-right">
										<div class="text-sm font-bold text-[#0E2E25]">{formatRupiah(po.amount)}</div>
										<span class="font-mono text-[10px] text-gray-400">
											{m.my_money_no_fee_note()}
										</span>
									</div>
								</div>
							</div>
						{/each}
					</div>

					{#if payoutPageCount > 1}
						<div
							class="flex flex-col items-center justify-between gap-3 border-t border-[#F0F4F2] pt-4 sm:flex-row"
						>
							<p class="text-[11px] text-[#52776C] sm:text-xs">
								{m.dt_showing({
									from: payoutRangeFrom,
									to: payoutRangeTo,
									total: payoutTotal
								})}
							</p>
							<nav class="flex items-center gap-1" aria-label={m.dt_pagination_label()}>
								<button
									type="button"
									onclick={() => goToPayoutPage(payoutPage - 1)}
									disabled={payoutPage <= 1}
									aria-label={m.dt_prev_page()}
									class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#E2E8E4] text-[#52776C] transition-colors hover:bg-[#F2FAF5] hover:text-[#0C7B58] disabled:cursor-not-allowed disabled:opacity-40"
								>
									<ChevronLeft class="h-4 w-4" />
								</button>
								<span class="px-2 text-xs font-semibold text-[#245344]">
									{m.dt_page_of({ page: payoutPage })}
								</span>
								<button
									type="button"
									onclick={() => goToPayoutPage(payoutPage + 1)}
									disabled={payoutPage >= payoutPageCount}
									aria-label={m.dt_next_page()}
									class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#E2E8E4] text-[#52776C] transition-colors hover:bg-[#F2FAF5] hover:text-[#0C7B58] disabled:cursor-not-allowed disabled:opacity-40"
								>
									<ChevronRight class="h-4 w-4" />
								</button>
							</nav>
						</div>
					{/if}
				{/if}
			</div>
		{/if}

		{#if showPayoutModal}
			<PayoutModal onClose={() => (showPayoutModal = false)} />
		{/if}

		{#if selectedTransaction}
			<TransactionDetailModal
				transaction={selectedTransaction}
				order={seller.findOrder(selectedTransaction.orderId) ?? undefined}
				onClose={() => (selectedTransaction = null)}
			/>
		{/if}
	</PageContent>
</PageFrame>
