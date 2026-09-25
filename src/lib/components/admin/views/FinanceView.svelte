<script lang="ts">
	import { onMount } from 'svelte';
	import { admin } from '$lib/stores/admin.svelte';
	import { calculatePlatformFinancials } from '$lib/domain/adminDomain';
	import { formatRupiah } from '$lib/data/mockData';
	import { m } from '$lib/paraglide/messages.js';
	import type { LedgerEntryType } from '$lib/types/admin';
	import Download from 'lucide-svelte/icons/download';

	let filterType = $state<'all' | LedgerEntryType>('all');

	onMount(() => {
		void admin.syncAdminTransactions();
		void admin.syncAdminFinance();
	});

	const financials = $derived(calculatePlatformFinancials(admin.platformLedger));
	const financeSummary = $derived(admin.platformFinance);
	const revenueValue = $derived(financeSummary ? financeSummary.karjaFee : financials.karjaRevenue);
	const paymentFeesValue = $derived(
		financeSummary ? financeSummary.gatewayFee : financials.paymentFees
	);
	const liabilityValue = $derived(
		financeSummary ? financeSummary.escrowLiability : financials.outstandingLiability
	);

	const filteredEntries = $derived(
		admin.platformLedger.filter((e) => filterType === 'all' || e.type === filterType)
	);

	function fmtRupiah(num?: number): string {
		if (typeof num !== 'number') return '-';
		return formatRupiah(num);
	}

	function typeBadgeClass(type: LedgerEntryType): string {
		switch (type) {
			case 'sale':
				return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
			case 'payout':
				return 'bg-blue-50 text-blue-800 border border-blue-200';
			case 'refund':
				return 'bg-rose-50 text-rose-800 border border-rose-200';
			case 'platform_fee':
				return 'bg-teal-50 text-teal-800 border border-teal-200';
			case 'payment_fee':
				return 'bg-slate-100 text-slate-800 border border-slate-200';
			case 'adjustment':
				return 'bg-amber-50 text-amber-800 border border-amber-200';
			default:
				return 'bg-slate-100 text-slate-800';
		}
	}

	function typeLabel(type: LedgerEntryType): string {
		switch (type) {
			case 'sale':
				return m.ady_fin_type_sale();
			case 'payout':
				return m.ady_fin_type_payout();
			case 'refund':
				return m.ady_fin_type_refund();
			case 'platform_fee':
				return m.ady_fin_type_platform_fee();
			case 'payment_fee':
				return m.ady_fin_type_payment_fee();
			case 'adjustment':
				return m.ady_fin_type_adjustment();
			default:
				return type;
		}
	}

	function handleExportCSV() {
		const headers = [
			'ID',
			m.ady_fin_csv_date(),
			m.ady_fin_csv_type(),
			m.ady_fin_csv_desc(),
			m.ady_fin_csv_amount(),
			m.ady_fin_csv_seller(),
			m.ady_fin_csv_order(),
			m.ady_fin_csv_payout()
		];
		const rows = filteredEntries.map((e) => [
			e.id,
			e.createdAt,
			e.type,
			`"${(e.description || '').replace(/"/g, '""')}"`,
			String(e.amount),
			e.sellerId || '',
			e.orderId || '',
			e.payoutId || ''
		]);
		const csvContent =
			'data:text/csv;charset=utf-8,' +
			[headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
		const encodedUri = encodeURI(csvContent);
		const link = document.createElement('a');
		link.setAttribute('href', encodedUri);
		link.setAttribute('download', `karja_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	const tabs = $derived<Record<string, () => string>>({
		all: m.ady_fin_tab_all,
		sale: m.ady_fin_tab_sale,
		payout: m.ady_fin_tab_payout,
		refund: m.ady_fin_tab_refund,
		adjustment: m.ady_fin_tab_adjustment
	});
</script>

<div class="max-w-7xl space-y-6">
	<div
		class="flex flex-col justify-between gap-3 border-b border-[#E4EBE7] pb-4 sm:flex-row sm:items-center"
	>
		<div>
			<h1 class="text-xl font-bold tracking-tight text-[#0E2E25]">{m.ady_fin_title()}</h1>
			<p class="mt-0.5 text-xs text-[#52776C]">{m.ady_fin_subtitle()}</p>
		</div>

		<button
			type="button"
			onclick={handleExportCSV}
			class="inline-flex cursor-pointer items-center gap-1.5 self-start rounded-xl border border-[#E4EBE7] bg-white px-3 py-1.5 text-xs font-semibold text-[#0E2E25] shadow-xs transition-colors hover:bg-[#FAFDFB] sm:self-auto"
		>
			<Download class="h-3.5 w-3.5 text-[#52776C]" />
			<span>{m.ady_fin_export()}</span>
		</button>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-2xl border border-[#E4EBE7] bg-white p-4 shadow-xs">
			<span class="block text-[11px] font-semibold tracking-wider text-[#698E82] uppercase">
				{m.ady_fin_gmv_label()}
			</span>
			<p class="mt-1 font-mono text-lg font-bold text-[#0E2E25]">{fmtRupiah(financials.gmv)}</p>
			<span class="mt-0.5 block text-[11px] text-[#52776C]">{m.ady_fin_gmv_desc()}</span>
		</div>

		<div class="rounded-2xl border border-[#E4EBE7] bg-white p-4 shadow-xs">
			<span class="block text-[11px] font-semibold tracking-wider text-[#0C7B58] uppercase">
				{m.ady_fin_revenue_label()}
			</span>
			<p class="mt-1 font-mono text-lg font-bold text-[#0C7B58]">
				{fmtRupiah(revenueValue)}
			</p>
			<span class="mt-0.5 block text-[11px] text-[#52776C]">{m.ady_fin_revenue_desc()}</span>
		</div>

		<div class="rounded-2xl border border-[#E4EBE7] bg-white p-4 shadow-xs">
			<span class="block text-[11px] font-semibold tracking-wider text-[#698E82] uppercase">
				{m.ady_fin_paymentfees_label()}
			</span>
			<p class="mt-1 font-mono text-lg font-bold text-[#0E2E25]">
				{fmtRupiah(paymentFeesValue)}
			</p>
			<span class="mt-0.5 block text-[11px] text-[#52776C]">{m.ady_fin_paymentfees_desc()}</span>
		</div>

		<div class="rounded-2xl border border-[#E4EBE7] bg-white p-4 shadow-xs">
			<span class="block text-[11px] font-semibold tracking-wider text-blue-900 uppercase">
				{m.ady_fin_liability_label()}
			</span>
			<p class="mt-1 font-mono text-lg font-bold text-blue-900">
				{fmtRupiah(liabilityValue)}
			</p>
			<span class="mt-0.5 block text-[11px] text-[#52776C]">{m.ady_fin_liability_desc()}</span>
		</div>
	</div>

	<div class="overflow-hidden rounded-2xl border border-[#E4EBE7] bg-white shadow-xs">
		<div
			class="flex flex-col justify-between gap-2 border-b border-[#E4EBE7] bg-[#FAFDFB] p-3 sm:flex-row sm:items-center"
		>
			<span class="text-xs font-bold text-[#0E2E25]">
				{m.ady_fin_journal_title()} ({m.ady_fin_entries_count({ count: filteredEntries.length })})
			</span>
			<div
				class="flex items-center gap-1 overflow-x-auto rounded-xl border border-[#E4EBE7] bg-white p-1 text-xs"
				role="group"
				aria-label={m.ady_fin_journal_title()}
			>
				{#each ['all', 'sale', 'payout', 'refund', 'adjustment'] as tab (tab)}
					<button
						type="button"
						onclick={() => (filterType = tab as 'all' | LedgerEntryType)}
						aria-pressed={filterType === tab}
						class="cursor-pointer rounded-lg px-2.5 py-1 transition-colors {filterType === tab
							? 'bg-[#EBF5F0] font-semibold text-[#0C7B58]'
							: 'font-medium text-[#52776C] hover:text-[#0E2E25]'}"
					>
						{tabs[tab]()}
					</button>
				{/each}
			</div>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs">
				<thead
					class="border-b border-[#E4EBE7] bg-[#FAFDFB] text-[11px] font-semibold tracking-wider text-[#52776C] uppercase"
				>
					<tr>
						<th class="px-4 py-3">{m.ady_fin_th_entry()}</th>
						<th class="px-4 py-3">{m.ady_fin_th_type()}</th>
						<th class="px-4 py-3">{m.ady_fin_th_components()}</th>
						<th class="px-4 py-3">{m.ady_fin_th_desc()}</th>
						<th class="px-4 py-3 text-right">{m.ady_fin_th_amount()}</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-[#E4EBE7] text-[#0E2E25]">
					{#each filteredEntries as e (e.id)}
						{@const isOutflow = e.type === 'payout' || e.type === 'refund'}
						<tr class="transition-colors hover:bg-[#FAFDFB]">
							<td class="px-4 py-3.5">
								<p class="font-mono font-semibold text-[#0E2E25]">{e.id}</p>
								<p class="text-[11px] text-[#698E82]">
									{new Date(e.createdAt).toLocaleDateString('id-ID', {
										day: 'numeric',
										month: 'short',
										year: 'numeric'
									})}
								</p>
							</td>
							<td class="space-y-1 px-4 py-3.5">
								<div>
									<span
										class="rounded-md border px-2 py-0.5 text-[11px] font-semibold {typeBadgeClass(
											e.type
										)}"
									>
										{typeLabel(e.type)}
									</span>
								</div>
								<p class="font-mono text-[11px] text-[#698E82]">
									{e.orderId || e.payoutId || e.refundId || e.sellerId || '-'}
								</p>
							</td>
							<td class="px-4 py-3.5 text-[11px] text-[#52776C]">
								{#if e.type === 'sale'}
									<div class="space-y-0.5 font-mono">
										<p>{m.ady_fin_gross()}: {fmtRupiah(e.grossAmount || e.amount)}</p>
										<p class="text-[#0C7B58]">
											{m.ady_fin_karja_fee()}: {fmtRupiah(e.karjaFee)}
										</p>
										<p>{m.ady_fin_payment_fee()}: {fmtRupiah(e.paymentFee)}</p>
										<p class="font-semibold text-[#0E2E25]">
											{m.ady_fin_net_seller()}: {fmtRupiah(e.sellerNet)}
										</p>
									</div>
								{:else}
									<p class="font-mono">{fmtRupiah(e.amount)}</p>
								{/if}
							</td>
							<td class="max-w-sm px-4 py-3.5 text-[#52776C]">{e.description || '-'}</td>
							<td class="px-4 py-3.5 text-right font-mono font-bold">
								<span class={isOutflow ? 'text-[#0E2E25]' : 'text-[#0C7B58]'}>
									{isOutflow ? '-' : '+'}
									{fmtRupiah(e.amount)}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
