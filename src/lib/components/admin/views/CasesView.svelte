<script lang="ts">
	import { onMount } from 'svelte';
	import { admin } from '$lib/stores/admin.svelte';
	import { hasPermission } from '$lib/domain/adminDomain';
	import { formatRupiah } from '$lib/data/mockData';
	import { m } from '$lib/paraglide/messages.js';
	import { ApiError } from '$lib/api';
	import type { Dispute, DisputeStatus, Report, ReportStatus } from '$lib/types/admin';
	import Lock from 'lucide-svelte/icons/lock';
	import {
		DataTable,
		type DataTableColumn,
		type DataTableCellContext
	} from '$lib/components/ui/data-table';

	type DisputeOutcome = 'refund_approved' | 'refund_partial' | 'refund_rejected' | 'resolved';

	const canResolveCases = $derived(hasPermission(admin.adminUser, 'cases.resolve'));
	const canApproveRefund = $derived(hasPermission(admin.adminUser, 'refunds.approve'));

	let activeTab = $state<'disputes' | 'reports'>('disputes');
	let selectedDispute = $state<Dispute | null>(null);
	let selectedReport = $state<Report | null>(null);
	let disputeOutcome = $state<DisputeOutcome>('refund_approved');
	let adminNote = $state('');
	let reportResolution = $state('');
	let isSubmitting = $state(false);
	let actionError = $state<string | null>(null);

	const PAGE_SIZE = 10;

	onMount(() => {
		void admin.syncAdminCases();
		reload('disputes', 1);
	});

	const disputes = $derived(admin.platformDisputes);
	const reports = $derived(admin.platformReports);

	const serverPage = $derived(admin.casesPage);
	const usingServer = $derived(serverPage?.server ?? false);

	/** Muat satu halaman daftar kasus dari BE; `fallback` dipakai saat offline. */
	function reload(list: 'reports' | 'disputes' = activeTab, targetPage?: number) {
		const current = list === 'reports' ? serverPage?.reportsPage : serverPage?.disputesPage;
		const page = targetPage ?? current ?? 1;
		void admin.loadCasesPage({ page, limit: PAGE_SIZE }, list, reports, disputes);
	}

	function goToReportsPage(target: number) {
		reload('reports', target);
	}

	function goToDisputesPage(target: number) {
		reload('disputes', target);
	}

	const loading = $derived(!serverPage);
	const viewDisputes = $derived(
		serverPage ? (serverPage.server ? (serverPage.disputes ?? []) : disputes) : []
	);
	const viewReports = $derived(
		serverPage ? (serverPage.server ? (serverPage.reports ?? []) : reports) : []
	);
	const viewDisputesTotal = $derived(
		serverPage ? (serverPage.server ? (serverPage.disputesTotal ?? 0) : disputes.length) : 0
	);
	const viewReportsTotal = $derived(
		serverPage ? (serverPage.server ? (serverPage.reportsTotal ?? 0) : reports.length) : 0
	);

	function fmtRupiah(num?: number): string {
		if (!num) return '-';
		return formatRupiah(num);
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	async function handleExecuteDispute() {
		if (!selectedDispute || isSubmitting) return;
		if (
			(disputeOutcome === 'refund_approved' || disputeOutcome === 'refund_partial') &&
			!canApproveRefund
		) {
			alert(m.ady_cas_alert_refund_perm());
			return;
		}
		if (!canResolveCases && !canApproveRefund) return;

		isSubmitting = true;
		actionError = null;
		try {
			await admin.resolveDispute(selectedDispute.id, disputeOutcome, adminNote);
			selectedDispute = null;
			adminNote = '';
			reload('disputes');
		} catch (e) {
			actionError = e instanceof ApiError ? e.message : m.admin_action_failed();
		} finally {
			isSubmitting = false;
		}
	}

	async function handleExecuteReport() {
		if (!selectedReport || !canResolveCases || isSubmitting) return;

		isSubmitting = true;
		actionError = null;
		try {
			await admin.resolveReport(
				selectedReport.id,
				reportResolution || m.ady_cas_default_resolution()
			);
			selectedReport = null;
			reportResolution = '';
			reload('reports');
		} catch (e) {
			actionError = e instanceof ApiError ? e.message : m.admin_action_failed();
		} finally {
			isSubmitting = false;
		}
	}

	function disputeStatusLabel(status: DisputeStatus): string {
		switch (status) {
			case 'open':
				return m.ady_cas_ds_open();
			case 'waiting_seller':
				return m.ady_cas_ds_waiting_seller();
			case 'waiting_buyer':
				return m.ady_cas_ds_waiting_buyer();
			case 'admin_review':
				return m.ady_cas_ds_admin_review();
			case 'refund_approved':
				return m.ady_cas_ds_refund_approved();
			case 'refund_partial':
				return m.ady_cas_ds_refund_partial();
			case 'refund_rejected':
				return m.ady_cas_ds_refund_rejected();
			case 'resolved':
				return m.ady_cas_resolved();
			default:
				return status;
		}
	}

	function disputeStatusClass(status: DisputeStatus): string {
		if (status === 'open') return 'bg-amber-50 text-amber-800 border border-amber-200';
		if (status === 'waiting_seller') return 'bg-blue-50 text-blue-800 border border-blue-200';
		if (status === 'waiting_buyer') return 'bg-indigo-50 text-indigo-800 border border-indigo-200';
		if (status === 'admin_review') return 'bg-purple-50 text-purple-800 border border-purple-200';
		if (status === 'refund_approved')
			return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
		if (status === 'refund_partial') return 'bg-teal-50 text-teal-800 border border-teal-200';
		if (status === 'refund_rejected') return 'bg-rose-50 text-rose-800 border border-rose-200';
		if (status === 'resolved') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
		return 'bg-slate-100 text-slate-700';
	}

	function reportStatusLabel(status: ReportStatus): string {
		switch (status) {
			case 'open':
				return m.ady_cas_rp_open();
			case 'reviewing':
				return m.ady_cas_rp_reviewing();
			case 'action_taken':
				return m.ady_cas_rp_action_taken();
			case 'dismissed':
				return m.ady_cas_rp_dismissed();
			case 'resolved':
				return m.ady_cas_resolved();
			default:
				return status;
		}
	}

	function reportStatusClass(status: ReportStatus): string {
		if (status === 'open') return 'bg-amber-50 text-amber-800 border border-amber-200';
		if (status === 'reviewing') return 'bg-purple-50 text-purple-800 border border-purple-200';
		if (status === 'action_taken') return 'bg-blue-50 text-blue-800 border border-blue-200';
		if (status === 'dismissed') return 'bg-slate-100 text-slate-700 border border-slate-200';
		if (status === 'resolved') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
		return 'bg-slate-100 text-slate-700';
	}

	function openDisputeModal(d: Dispute) {
		selectedDispute = d;
		adminNote = d.adminNote || '';
	}

	function openReportModal(r: Report) {
		selectedReport = r;
		reportResolution = r.resolution || '';
	}

	function onEscape(e: KeyboardEvent) {
		if (e.key !== 'Escape') return;
		selectedDispute = null;
		selectedReport = null;
	}

	const disputeColumns: DataTableColumn<Dispute>[] = [
		{ id: 'case', header: m.ady_cas_th_case() },
		{ id: 'order', header: m.ady_cas_th_order() },
		{ id: 'claimant', header: m.ady_cas_th_claimant() },
		{ id: 'amount', header: m.ady_cas_th_amount() },
		{ id: 'status', header: m.ady_cas_th_status() },
		{ id: 'action', header: m.ady_cas_th_action(), meta: { align: 'right' } }
	];

	const reportColumns: DataTableColumn<Report>[] = [
		{ id: 'report', header: m.ady_cas_th_report() },
		{ id: 'target', header: m.ady_cas_th_target() },
		{ id: 'reason', header: m.ady_cas_th_reason() },
		{ id: 'reporter', header: m.ady_cas_th_reporter() },
		{ id: 'statusAction', header: m.ady_cas_th_status_action(), meta: { align: 'right' } }
	];
</script>

<svelte:window onkeydown={onEscape} />

{#snippet dCaseCell(ctx: DataTableCellContext<Dispute>)}
	{@const d = ctx.row.original}
	<p class="font-mono font-semibold text-[#0E2E25]">{d.id}</p>
	<p class="text-[11px] text-[#698E82]">{fmtDate(d.createdAt)}</p>
{/snippet}

{#snippet dOrderCell(ctx: DataTableCellContext<Dispute>)}
	{@const d = ctx.row.original}
	<p class="font-mono font-medium text-[#0E2E25]">{d.orderId}</p>
	<p class="font-mono text-[11px] text-[#698E82]">{d.sellerId}</p>
{/snippet}

{#snippet dClaimantCell(ctx: DataTableCellContext<Dispute>)}
	<span class="font-mono text-[11px] text-[#52776C]">{ctx.row.original.buyerEmail}</span>
{/snippet}

{#snippet dAmountCell(ctx: DataTableCellContext<Dispute>)}
	<span class="font-mono font-bold text-[#0E2E25]">
		{fmtRupiah(ctx.row.original.refundAmount)}
	</span>
{/snippet}

{#snippet dStatusCell(ctx: DataTableCellContext<Dispute>)}
	{@const d = ctx.row.original}
	<div class="mb-1">
		<span
			class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold {disputeStatusClass(
				d.status
			)}"
		>
			{disputeStatusLabel(d.status)}
		</span>
	</div>
	<p class="truncate text-[11px] text-[#52776C]" title={d.buyerStatement || d.reason}>
		{d.reason}: {d.buyerStatement}
	</p>
{/snippet}

{#snippet dActionCell(ctx: DataTableCellContext<Dispute>)}
	{@const d = ctx.row.original}
	{#if d.status !== 'resolved'}
		<button
			type="button"
			onclick={() => openDisputeModal(d)}
			class="cursor-pointer rounded-lg border border-[#D0E6DC] px-2.5 py-1 text-xs font-semibold text-[#0C7B58] transition-all hover:border-[#0C7B58] hover:bg-[#0C7B58] hover:text-white"
		>
			{m.ady_cas_decide()}
		</button>
	{:else}
		<span class="text-[11px] text-[#698E82]">{m.ady_cas_closed()}</span>
	{/if}
{/snippet}

{#snippet rReportCell(ctx: DataTableCellContext<Report>)}
	<span class="font-mono font-semibold text-[#0E2E25]">{ctx.row.original.id}</span>
{/snippet}

{#snippet rTargetCell(ctx: DataTableCellContext<Report>)}
	{@const r = ctx.row.original}
	<span class="font-medium text-[#0E2E25] capitalize">{r.targetType}</span>
	<span class="block font-mono text-[11px] text-[#698E82]">{r.targetId}</span>
{/snippet}

{#snippet rReasonCell(ctx: DataTableCellContext<Report>)}
	{@const r = ctx.row.original}
	<p class="font-semibold text-[#0E2E25]">{r.reason}</p>
	{#if r.message}
		<p class="mt-0.5 text-[11px] leading-relaxed text-[#52776C]">{r.message}</p>
	{/if}
{/snippet}

{#snippet rReporterCell(ctx: DataTableCellContext<Report>)}
	<span class="font-mono text-[11px] text-[#52776C]">
		{ctx.row.original.reporterEmail || m.ady_cas_anon()}
	</span>
{/snippet}

{#snippet rStatusActionCell(ctx: DataTableCellContext<Report>)}
	{@const r = ctx.row.original}
	<div>
		<span
			class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold {reportStatusClass(
				r.status
			)}"
		>
			{reportStatusLabel(r.status)}
		</span>
	</div>
	{#if r.status !== 'resolved' && r.status !== 'dismissed'}
		<button
			type="button"
			onclick={() => openReportModal(r)}
			class="mt-1 inline-block cursor-pointer rounded-lg border border-[#D0E6DC] px-2.5 py-1 text-xs font-semibold text-[#0C7B58] transition-all hover:border-[#0C7B58] hover:bg-[#0C7B58] hover:text-white"
		>
			{m.ady_cas_review_report()}
		</button>
	{:else}
		<span class="block text-[11px] text-[#698E82]">{m.ady_cas_handled()}</span>
	{/if}
{/snippet}

<div class="max-w-7xl space-y-6">
	<div
		class="flex flex-col justify-between gap-3 border-b border-[#E4EBE7] pb-4 sm:flex-row sm:items-center"
	>
		<div>
			<h1 class="text-xl font-bold tracking-tight text-[#0E2E25]">{m.ady_cas_title()}</h1>
			<p class="mt-0.5 text-xs text-[#52776C]">{m.ady_cas_subtitle()}</p>
		</div>

		<div
			class="flex items-center gap-1 self-start rounded-xl border border-[#D0E6DC] bg-[#EBF5F0] p-1 text-xs sm:self-auto"
			role="group"
			aria-label={m.ady_cas_title()}
		>
			<button
				type="button"
				onclick={() => (activeTab = 'disputes')}
				aria-pressed={activeTab === 'disputes'}
				class="cursor-pointer rounded-lg px-3 py-1.5 font-semibold transition-colors {activeTab ===
				'disputes'
					? 'bg-white text-[#0E2E25] shadow-xs'
					: 'text-[#52776C] hover:text-[#0E2E25]'}"
			>
				{m.ady_cas_tab_disputes({ count: viewDisputesTotal })}
			</button>
			<button
				type="button"
				onclick={() => (activeTab = 'reports')}
				aria-pressed={activeTab === 'reports'}
				class="cursor-pointer rounded-lg px-3 py-1.5 font-semibold transition-colors {activeTab ===
				'reports'
					? 'bg-white text-[#0E2E25] shadow-xs'
					: 'text-[#52776C] hover:text-[#0E2E25]'}"
			>
				{m.ady_cas_tab_reports({ count: viewReportsTotal })}
			</button>
		</div>
	</div>

	{#if activeTab === 'disputes'}
		<div class="overflow-hidden rounded-2xl border border-[#E4EBE7] bg-white shadow-xs">
			<DataTable
				data={viewDisputes}
				columns={disputeColumns}
				{loading}
				paginationMode={usingServer ? 'server' : 'client'}
				page={usingServer ? (serverPage?.disputesPage ?? 1) : undefined}
				total={usingServer ? viewDisputesTotal : undefined}
				onPageChange={goToDisputesPage}
				hideEmptyRow
				cellSnippets={{
					case: dCaseCell,
					order: dOrderCell,
					claimant: dClaimantCell,
					amount: dAmountCell,
					status: dStatusCell,
					action: dActionCell
				}}
			/>
		</div>
	{/if}

	{#if activeTab === 'reports'}
		<div class="overflow-hidden rounded-2xl border border-[#E4EBE7] bg-white shadow-xs">
			<DataTable
				data={viewReports}
				columns={reportColumns}
				{loading}
				paginationMode={usingServer ? 'server' : 'client'}
				page={usingServer ? (serverPage?.reportsPage ?? 1) : undefined}
				total={usingServer ? viewReportsTotal : undefined}
				onPageChange={goToReportsPage}
				hideEmptyRow
				cellSnippets={{
					report: rReportCell,
					target: rTargetCell,
					reason: rReasonCell,
					reporter: rReporterCell,
					statusAction: rStatusActionCell
				}}
			/>
		</div>
	{/if}

	{#if selectedDispute}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-[#0E2E25]/40 p-4 backdrop-blur-xs"
			role="presentation"
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-label={m.ady_cas_dm_title()}
				class="w-full max-w-lg space-y-4 rounded-2xl border border-[#E4EBE7] bg-white p-6 text-left shadow-xl"
			>
				<div class="flex items-center justify-between border-b border-[#E4EBE7] pb-3">
					<div>
						<h3 class="text-sm font-bold text-[#0E2E25]">{m.ady_cas_dm_title()}</h3>
						<p class="font-mono text-xs text-[#698E82]">
							{m.ady_cas_dm_case({ id: selectedDispute.id })}
						</p>
					</div>
					<button
						type="button"
						onclick={() => (selectedDispute = null)}
						aria-label={m.ady_cas_cancel()}
						class="cursor-pointer rounded-lg p-1 text-[#698E82] hover:text-[#0E2E25]"
					>
						✕
					</button>
				</div>

				<div class="space-y-3 text-xs">
					<div class="space-y-1.5 rounded-xl border border-[#E4EBE7] bg-[#FAFDFB] p-3 text-[11px]">
						<p>
							<strong class="text-[#0E2E25]">{m.ady_cas_dm_order()}</strong>
							<span class="font-mono">{selectedDispute.orderId}</span>
						</p>
						<p>
							<strong class="text-[#0E2E25]">{m.ady_cas_dm_seller()}</strong>
							<span class="font-mono">{selectedDispute.sellerId}</span>
						</p>
						<p>
							<strong class="text-[#0E2E25]">{m.ady_cas_dm_claim()}</strong>
							<span class="font-mono font-bold text-[#0E2E25]">
								{fmtRupiah(selectedDispute.refundAmount)}
							</span>
						</p>
						<p>
							<strong class="text-[#0E2E25]">{m.ady_cas_dm_reason()}</strong>
							{selectedDispute.reason}
						</p>
						{#if selectedDispute.buyerStatement}
							<p>
								<strong class="text-[#0E2E25]">{m.ady_cas_dm_buyer_stmt()}</strong>
								{selectedDispute.buyerStatement}
							</p>
						{/if}
						{#if selectedDispute.sellerResponse}
							<p>
								<strong class="text-[#0E2E25]">{m.ady_cas_dm_seller_resp()}</strong>
								{selectedDispute.sellerResponse}
							</p>
						{/if}
					</div>

					<div>
						<p class="mb-1.5 block font-semibold text-[#0E2E25]">
							{m.ady_cas_dm_outcome_label()}
						</p>
						<div class="space-y-1.5">
							<label
								class="flex items-start gap-2.5 rounded-xl border p-2.5 transition-all {canApproveRefund
									? 'cursor-pointer border-[#E4EBE7] hover:bg-[#FAFDFB]'
									: 'cursor-not-allowed border-slate-200 bg-slate-50/70 opacity-60'}"
							>
								<input
									type="radio"
									name="dispute-outcome"
									value="refund_approved"
									bind:group={disputeOutcome}
									disabled={!canApproveRefund}
									class="mt-0.5 text-[#0C7B58]"
								/>
								<div>
									<div class="flex items-center gap-2">
										<span class="block font-semibold text-[#0E2E25]">
											{m.ady_cas_out_full()}
										</span>
										{#if !canApproveRefund}
											<span
												class="py-0.2 flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 text-[10px] font-bold text-amber-700"
											>
												<Lock class="h-2.5 w-2.5" />
												{m.ady_cas_finance_only()}
											</span>
										{/if}
									</div>
									<span class="text-[11px] text-[#52776C]">{m.ady_cas_out_full_desc()}</span>
								</div>
							</label>

							<label
								class="flex items-start gap-2.5 rounded-xl border p-2.5 transition-all {canApproveRefund
									? 'cursor-pointer border-[#E4EBE7] hover:bg-[#FAFDFB]'
									: 'cursor-not-allowed border-slate-200 bg-slate-50/70 opacity-60'}"
							>
								<input
									type="radio"
									name="dispute-outcome"
									value="refund_partial"
									bind:group={disputeOutcome}
									disabled={!canApproveRefund}
									class="mt-0.5 text-[#0C7B58]"
								/>
								<div>
									<div class="flex items-center gap-2">
										<span class="block font-semibold text-[#0E2E25]">
											{m.ady_cas_out_partial()}
										</span>
										{#if !canApproveRefund}
											<span
												class="py-0.2 flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 text-[10px] font-bold text-amber-700"
											>
												<Lock class="h-2.5 w-2.5" />
												{m.ady_cas_finance_only()}
											</span>
										{/if}
									</div>
									<span class="text-[11px] text-[#52776C]">{m.ady_cas_out_partial_desc()}</span>
								</div>
							</label>

							<label
								class="flex cursor-pointer items-start gap-2.5 rounded-xl border border-[#E4EBE7] p-2.5 hover:bg-[#FAFDFB]"
							>
								<input
									type="radio"
									name="dispute-outcome"
									value="refund_rejected"
									bind:group={disputeOutcome}
									class="mt-0.5 text-[#0C7B58]"
								/>
								<div>
									<span class="block font-semibold text-[#0E2E25]">
										{m.ady_cas_out_rejected()}
									</span>
									<span class="text-[11px] text-[#52776C]">{m.ady_cas_out_rejected_desc()}</span>
								</div>
							</label>

							<label
								class="flex cursor-pointer items-start gap-2.5 rounded-xl border border-[#E4EBE7] p-2.5 hover:bg-[#FAFDFB]"
							>
								<input
									type="radio"
									name="dispute-outcome"
									value="resolved"
									bind:group={disputeOutcome}
									class="mt-0.5 text-[#0C7B58]"
								/>
								<div>
									<span class="block font-semibold text-[#0E2E25]">{m.ady_cas_out_resolved()}</span>
									<span class="text-[11px] text-[#52776C]">{m.ady_cas_out_resolved_desc()}</span>
								</div>
							</label>
						</div>
					</div>

					<div>
						<label for="dispute-admin-note" class="mb-1 block font-semibold text-[#0E2E25]">
							{m.ady_cas_note_label()}
						</label>
						<textarea
							id="dispute-admin-note"
							rows="2"
							bind:value={adminNote}
							placeholder={m.ady_cas_note_ph()}
							class="w-full rounded-xl border border-[#E4EBE7] bg-[#FAFDFB] p-2.5 text-xs focus:border-[#0C7B58] focus:ring-2 focus:ring-[#0C7B58]/20 focus:outline-none"
						></textarea>
					</div>
				</div>

				{#if actionError}
					<p
						class="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-700"
					>
						{actionError}
					</p>
				{/if}

				<div class="flex justify-end gap-2 border-t border-[#E4EBE7] pt-3">
					<button
						type="button"
						disabled={isSubmitting}
						onclick={() => (selectedDispute = null)}
						class="cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold text-[#52776C] transition-colors hover:bg-[#F0F5F2] disabled:cursor-not-allowed disabled:opacity-40"
					>
						{m.ady_cas_cancel()}
					</button>
					<button
						type="button"
						disabled={isSubmitting}
						onclick={handleExecuteDispute}
						class="cursor-pointer rounded-xl bg-[#0C7B58] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#096849] disabled:cursor-not-allowed disabled:opacity-40"
					>
						{m.ady_cas_save_dispute()}
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if selectedReport}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-[#0E2E25]/40 p-4 backdrop-blur-xs"
			role="presentation"
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-label={m.ady_cas_rm_title()}
				class="w-full max-w-lg space-y-4 rounded-2xl border border-[#E4EBE7] bg-white p-6 text-left shadow-xl"
			>
				<div class="flex items-center justify-between border-b border-[#E4EBE7] pb-3">
					<div>
						<h3 class="text-sm font-bold text-[#0E2E25]">{m.ady_cas_rm_title()}</h3>
						<p class="font-mono text-xs text-[#698E82]">
							{m.ady_cas_rm_report({ id: selectedReport.id })}
						</p>
					</div>
					<button
						type="button"
						onclick={() => (selectedReport = null)}
						aria-label={m.ady_cas_cancel()}
						class="cursor-pointer rounded-lg p-1 text-[#698E82] hover:text-[#0E2E25]"
					>
						✕
					</button>
				</div>

				<div class="space-y-3 text-xs">
					<div class="space-y-1.5 rounded-xl border border-[#E4EBE7] bg-[#FAFDFB] p-3 text-[11px]">
						<p>
							<strong class="text-[#0E2E25]">{m.ady_cas_rm_target()}</strong>
							<span class="font-semibold capitalize">{selectedReport.targetType}</span>
							({selectedReport.targetId})
						</p>
						<p>
							<strong class="text-[#0E2E25]">{m.ady_cas_rm_reporter()}</strong>
							{selectedReport.reporterEmail || m.ady_cas_anon()}
						</p>
						<p>
							<strong class="text-[#0E2E25]">{m.ady_cas_rm_reason()}</strong>
							{selectedReport.reason}
						</p>
						{#if selectedReport.message}
							<p>
								<strong class="text-[#0E2E25]">{m.ady_cas_rm_message()}</strong>
								{selectedReport.message}
							</p>
						{/if}
					</div>

					<div>
						<label for="report-resolution-note" class="mb-1 block font-semibold text-[#0E2E25]">
							{m.ady_cas_rm_note_label()}
						</label>
						<textarea
							id="report-resolution-note"
							rows="3"
							bind:value={reportResolution}
							placeholder={m.ady_cas_rm_note_ph()}
							class="w-full rounded-xl border border-[#E4EBE7] bg-[#FAFDFB] p-2.5 text-xs focus:border-[#0C7B58] focus:ring-2 focus:ring-[#0C7B58]/20 focus:outline-none"
						></textarea>
					</div>
				</div>

				{#if actionError}
					<p
						class="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-700"
					>
						{actionError}
					</p>
				{/if}

				<div class="flex justify-end gap-2 border-t border-[#E4EBE7] pt-3">
					<button
						type="button"
						disabled={isSubmitting}
						onclick={() => (selectedReport = null)}
						class="cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold text-[#52776C] transition-colors hover:bg-[#F0F5F2] disabled:cursor-not-allowed disabled:opacity-40"
					>
						{m.ady_cas_cancel()}
					</button>
					<button
						type="button"
						disabled={isSubmitting}
						onclick={handleExecuteReport}
						class="cursor-pointer rounded-xl bg-[#0C7B58] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#096849] disabled:cursor-not-allowed disabled:opacity-40"
					>
						{m.ady_cas_resolve_report()}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
