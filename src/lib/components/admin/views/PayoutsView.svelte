<script lang="ts">
	import { onMount } from 'svelte';
	import { admin } from '$lib/stores/admin.svelte';
	import { canTransitionPayoutStatus, hasPermission } from '$lib/domain/adminDomain';
	import { ApiError } from '$lib/api';
	import { formatRupiah } from '$lib/data/mockData';
	import { m } from '$lib/paraglide/messages.js';
	import type { ExtendedPayout, PayoutWorkflowStatus } from '$lib/types/admin';
	import Check from 'lucide-svelte/icons/check';
	import PauseCircle from 'lucide-svelte/icons/pause-circle';
	import CheckCircle2 from 'lucide-svelte/icons/check-circle-2';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import X from 'lucide-svelte/icons/x';
	import Shield from 'lucide-svelte/icons/shield';
	import {
		DataTable,
		type DataTableColumn,
		type DataTableCellContext
	} from '$lib/components/ui/data-table';

	type PayoutFilter = 'all' | 'requested' | 'approved' | 'processing' | 'paid' | 'held';

	let activeFilter = $state<PayoutFilter>('requested');
	let selectedPayout = $state<ExtendedPayout | null>(null);
	let actionType = $state<PayoutWorkflowStatus | null>(null);
	let providerRef = $state('');
	let note = $state('');
	let isSubmitting = $state(false);
	let actionError = $state<string | null>(null);

	const PAGE_SIZE = 10;
	let sortBy = $state<string | undefined>(undefined);
	let sortDir = $state<'asc' | 'desc' | undefined>(undefined);

	onMount(() => {
		reload(1);
	});

	const canApprove = $derived(hasPermission(admin.adminUser, 'payouts.approve'));
	const canHold = $derived(hasPermission(admin.adminUser, 'payouts.hold'));
	const canReject = $derived(hasPermission(admin.adminUser, 'payouts.reject'));
	const canManageAnyAction = $derived(canApprove || canHold || canReject);

	const tabs = $derived<Record<PayoutFilter, () => string>>({
		requested: m.ady_po_tab_requested,
		approved: m.ady_po_tab_approved,
		processing: m.ady_po_tab_processing,
		paid: m.ady_po_tab_paid,
		held: m.ady_po_tab_held,
		all: m.ady_po_tab_all
	});

	const tabKeys = ['requested', 'approved', 'processing', 'paid', 'held', 'all'] as const;

	const serverPage = $derived(admin.payoutsPage);
	const usingServer = $derived(serverPage?.server ?? false);

	/** Muat satu halaman pencairan dari BE; `fallback` dipakai saat offline. */
	function reload(targetPage = 1) {
		void admin.loadPayoutsPage(
			{
				page: targetPage,
				limit: PAGE_SIZE,
				status: activeFilter === 'all' ? undefined : activeFilter,
				sortBy,
				sortDir
			},
			filteredPayouts
		);
	}

	function goToPage(target: number) {
		reload(target);
	}

	function onSortChange(nextSortBy: string, nextSortDir: 'asc' | 'desc') {
		sortBy = nextSortBy;
		sortDir = nextSortDir;
		reload(1);
	}

	function setFilter(filter: PayoutFilter) {
		activeFilter = filter;
		reload(1);
	}

	const filteredPayouts = $derived(
		admin.platformPayouts.filter((p) => activeFilter === 'all' || p.status === activeFilter)
	);

	const loading = $derived(!serverPage);
	const viewItems = $derived(
		serverPage ? (serverPage.server ? (serverPage.items ?? []) : filteredPayouts) : []
	);
	const viewTotal = $derived(
		serverPage ? (serverPage.server ? (serverPage.total ?? 0) : filteredPayouts.length) : 0
	);

	function statusClass(s: PayoutWorkflowStatus): string {
		if (s === 'paid') return 'bg-[#EBF5F0] text-[#0C7B58] border border-[#D0E6DC]';
		if (s === 'requested') return 'bg-amber-50 text-amber-800 border border-amber-200';
		if (s === 'approved') return 'bg-blue-50 text-blue-800 border border-blue-200';
		if (s === 'processing') return 'bg-indigo-50 text-indigo-800 border border-indigo-200';
		if (s === 'held') return 'bg-orange-50 text-orange-800 border border-orange-200';
		return 'bg-red-50 text-red-700 border border-red-200';
	}

	function statusLabel(s: PayoutWorkflowStatus): string {
		switch (s) {
			case 'paid':
				return m.ady_po_tab_paid();
			case 'requested':
				return m.ady_po_tab_requested();
			case 'approved':
				return m.ady_po_tab_approved();
			case 'processing':
				return m.ady_po_tab_processing();
			case 'held':
				return m.ady_po_tab_held();
			case 'rejected':
				return m.ady_po_tab_rejected();
			default:
				return '';
		}
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	const columns: DataTableColumn<ExtendedPayout>[] = [
		{ id: 'ref', header: m.ady_po_th_ref(), enableSorting: true, meta: { sortKey: 'createdAt' } },
		{ id: 'seller', header: m.ady_po_th_seller() },
		{ id: 'account', header: m.ady_po_th_account() },
		{
			id: 'amount',
			header: m.ady_po_th_amount(),
			enableSorting: true,
			meta: { sortKey: 'amount' }
		},
		{ id: 'status', header: m.ady_po_th_status() },
		{ id: 'action', header: m.ady_po_th_action(), meta: { align: 'right' } }
	];

	function openWorkspace(p: ExtendedPayout) {
		selectedPayout = p;
		actionType = null;
		note = '';
		providerRef = '';
		actionError = null;
	}

	function closeModal() {
		selectedPayout = null;
		actionError = null;
	}

	async function handleExecuteAction() {
		if (!selectedPayout || !actionType || isSubmitting) return;

		if (!canTransitionPayoutStatus(selectedPayout.status, actionType)) {
			alert(m.ady_po_alert_transition({ from: selectedPayout.status, to: actionType }));
			return;
		}

		if (actionType === 'held' && !note.trim()) {
			alert(m.ady_po_alert_hold_reason());
			return;
		}

		if (actionType === 'rejected' && !note.trim()) {
			alert(m.ady_po_alert_reject_reason());
			return;
		}

		isSubmitting = true;
		actionError = null;
		try {
			await admin.updatePayout(selectedPayout.id, actionType, {
				note: note.trim() || undefined,
				providerRef: providerRef.trim() || undefined,
				holdReason: actionType === 'held' ? note.trim() : undefined
			});

			selectedPayout = null;
			actionType = null;
			providerRef = '';
			note = '';
			reload(serverPage?.page ?? 1);
		} catch (e) {
			actionError = e instanceof ApiError ? e.message : m.ady_po_alert_action_failed();
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') closeModal();
	}}
/>

{#snippet refCell(ctx: DataTableCellContext<ExtendedPayout>)}
	{@const p = ctx.row.original}
	<p class="font-mono text-xs font-bold text-[#0E2E25]">{p.referenceId}</p>
	<p class="font-mono text-[11px] text-[#698E82]">{fmtDate(p.requestedAt)}</p>
{/snippet}

{#snippet sellerCell(ctx: DataTableCellContext<ExtendedPayout>)}
	<span class="font-mono text-[11px] text-[#52776C]">{ctx.row.original.sellerId}</span>
{/snippet}

{#snippet accountCell(ctx: DataTableCellContext<ExtendedPayout>)}
	{@const p = ctx.row.original}
	<p class="font-semibold text-[#0E2E25]">{p.bankName}</p>
	<p class="font-mono text-[11px] text-[#698E82]">{p.accountNumber} ({p.accountHolder})</p>
{/snippet}

{#snippet amountCell(ctx: DataTableCellContext<ExtendedPayout>)}
	<span class="font-mono text-xs font-bold text-[#0E2E25]">
		{formatRupiah(ctx.row.original.amount)}
	</span>
{/snippet}

{#snippet payoutStatusCell(ctx: DataTableCellContext<ExtendedPayout>)}
	{@const p = ctx.row.original}
	<span
		class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold {statusClass(
			p.status
		)}"
	>
		{statusLabel(p.status)}
	</span>
{/snippet}

{#snippet actionCell(ctx: DataTableCellContext<ExtendedPayout>)}
	<button
		type="button"
		onclick={() => openWorkspace(ctx.row.original)}
		class="cursor-pointer rounded-lg border border-[#D0E6DC] bg-[#EBF5F0] px-3 py-1.5 text-xs font-semibold text-[#0C7B58] transition-all hover:bg-[#0C7B58] hover:text-white"
	>
		{m.ady_po_manage()}
	</button>
{/snippet}

{#snippet payoutsEmpty()}
	<div class="flex flex-col items-center justify-center gap-2">
		<div
			class="flex h-10 w-10 items-center justify-center rounded-full bg-[#EBF5F0] text-[#0C7B58]"
		>
			<Check class="h-5 w-5" />
		</div>
		<p class="font-semibold text-[#0E2E25]">{m.ady_po_empty_title()}</p>
		<p class="text-[11px] text-[#698E82]">{m.ady_po_empty_desc()}</p>
	</div>
{/snippet}

<div class="max-w-7xl space-y-6">
	<div
		class="flex flex-col justify-between gap-3 border-b border-[#E4EBE7] pb-4 sm:flex-row sm:items-center"
	>
		<div>
			<h1 class="text-xl font-bold tracking-tight text-[#0E2E25]">{m.ady_po_title()}</h1>
			<p class="mt-0.5 text-xs text-[#52776C]">{m.ady_po_subtitle()}</p>
		</div>

		<div
			class="flex max-w-full items-center gap-1 self-start overflow-x-auto rounded-xl border border-[#D0E6DC] bg-[#EBF5F0] p-1 text-xs sm:self-auto"
			role="group"
			aria-label={m.ady_po_title()}
		>
			{#each tabKeys as tab (tab)}
				<button
					type="button"
					onclick={() => setFilter(tab)}
					aria-pressed={activeFilter === tab}
					class="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors {activeFilter ===
					tab
						? 'bg-white text-[#0E2E25] shadow-xs'
						: 'text-[#52776C] hover:text-[#0E2E25]'}"
				>
					{tabs[tab]()}
				</button>
			{/each}
		</div>
	</div>

	<div class="overflow-hidden rounded-2xl border border-[#E4EBE7] bg-white shadow-xs">
		<DataTable
			data={viewItems}
			{columns}
			{loading}
			paginationMode={usingServer ? 'server' : 'client'}
			page={usingServer ? (serverPage?.page ?? 1) : undefined}
			total={usingServer ? viewTotal : undefined}
			onPageChange={goToPage}
			{onSortChange}
			sortBy={usingServer ? sortBy : undefined}
			sortDir={usingServer ? sortDir : undefined}
			empty={payoutsEmpty}
			cellSnippets={{
				ref: refCell,
				seller: sellerCell,
				account: accountCell,
				amount: amountCell,
				status: payoutStatusCell,
				action: actionCell
			}}
		/>
	</div>

	{#if selectedPayout}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#0E2E25]/60 p-3 backdrop-blur-xs sm:p-6"
			role="presentation"
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-label={m.ady_po_modal_title({ reference: selectedPayout.referenceId })}
				class="my-auto w-full max-w-lg space-y-5 rounded-2xl border border-[#E4EBE7] bg-white p-6 text-left shadow-2xl"
			>
				<div class="flex items-start justify-between border-b border-[#E4EBE7] pb-3">
					<div>
						<h3 class="text-sm font-bold text-[#0E2E25]">
							{m.ady_po_modal_title({ reference: selectedPayout.referenceId })}
						</h3>
						<p class="text-xs text-[#52776C]">
							{m.ady_po_modal_seller({ id: selectedPayout.sellerId })}
						</p>
					</div>
					<button
						type="button"
						onclick={closeModal}
						aria-label={m.ady_po_close()}
						class="cursor-pointer rounded-lg p-1.5 text-[#52776C] hover:bg-slate-100 hover:text-[#0E2E25]"
					>
						<X class="h-4 w-4" />
					</button>
				</div>

				<div class="space-y-2 rounded-xl border border-[#E4EBE7] bg-[#F8FAF9] p-4 text-xs">
					<div class="flex justify-between">
						<span class="text-[#698E82]">{m.ady_po_amount_label()}</span>
						<span class="text-sm font-bold text-[#0C7B58]">
							{formatRupiah(selectedPayout.amount)}
						</span>
					</div>
					<div class="flex justify-between">
						<span class="text-[#698E82]">{m.ady_po_bank_label()}</span>
						<span class="font-semibold text-[#0E2E25]">{selectedPayout.bankName}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-[#698E82]">{m.ady_po_account_label()}</span>
						<span class="font-mono font-semibold text-[#0E2E25]">
							{selectedPayout.accountNumber}
						</span>
					</div>
					<div class="flex justify-between">
						<span class="text-[#698E82]">{m.ady_po_holder_label()}</span>
						<span class="font-semibold text-[#0E2E25]">{selectedPayout.accountHolder}</span>
					</div>
				</div>

				{#if canManageAnyAction}
					<div>
						<p class="mb-2 block text-xs font-bold text-[#0E2E25]">{m.ady_po_choose_action()}</p>
						<div class="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
							{#if canApprove && selectedPayout.status === 'requested'}
								<button
									type="button"
									disabled={isSubmitting}
									onclick={() => (actionType = 'approved')}
									aria-pressed={actionType === 'approved'}
									class="flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-2 text-center font-bold transition-all {actionType ===
									'approved'
										? 'border-[#0C7B58] bg-[#0C7B58] text-white'
										: 'border-[#E4EBE7] text-[#52776C] hover:bg-[#F8FAF9]'}"
								>
									<Check class="h-4 w-4" />
									<span>{m.ady_po_action_approve()}</span>
								</button>
							{/if}

							{#if canApprove && (selectedPayout.status === 'approved' || selectedPayout.status === 'processing')}
								<button
									type="button"
									disabled={isSubmitting}
									onclick={() => (actionType = 'paid')}
									aria-pressed={actionType === 'paid'}
									class="flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-2 text-center font-bold transition-all {actionType ===
									'paid'
										? 'border-[#0C7B58] bg-[#0C7B58] text-white'
										: 'border-[#E4EBE7] text-[#52776C] hover:bg-[#F8FAF9]'}"
								>
									<CheckCircle2 class="h-4 w-4" />
									<span>{m.ady_po_action_mark_paid()}</span>
								</button>
							{/if}

							{#if canHold && selectedPayout.status !== 'held' && selectedPayout.status !== 'paid'}
								<button
									type="button"
									disabled={isSubmitting}
									onclick={() => (actionType = 'held')}
									aria-pressed={actionType === 'held'}
									class="flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-2 text-center font-bold transition-all {actionType ===
									'held'
										? 'border-amber-600 bg-amber-600 text-white'
										: 'border-[#E4EBE7] text-[#52776C] hover:bg-[#F8FAF9]'}"
								>
									<PauseCircle class="h-4 w-4" />
									<span>{m.ady_po_action_hold()}</span>
								</button>
							{/if}

							{#if canReject && selectedPayout.status !== 'rejected' && selectedPayout.status !== 'paid'}
								<button
									type="button"
									disabled={isSubmitting}
									onclick={() => (actionType = 'rejected')}
									aria-pressed={actionType === 'rejected'}
									class="flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-2 text-center font-bold transition-all {actionType ===
									'rejected'
										? 'border-red-600 bg-red-600 text-white'
										: 'border-[#E4EBE7] text-[#52776C] hover:bg-[#F8FAF9]'}"
								>
									<XCircle class="h-4 w-4" />
									<span>{m.ady_po_action_reject()}</span>
								</button>
							{/if}
						</div>
					</div>

					{#if actionType === 'paid'}
						<div>
							<label for="payout-provider-ref" class="mb-1 block text-xs font-bold text-[#0E2E25]">
								{m.ady_po_ref_label()}
							</label>
							<input
								id="payout-provider-ref"
								type="text"
								bind:value={providerRef}
								placeholder={m.ady_po_ref_placeholder()}
								class="w-full rounded-xl border border-[#E4EBE7] bg-[#F8FAF9] p-2.5 text-xs focus:ring-1 focus:ring-[#0C7B58] focus:outline-none"
							/>
						</div>
					{/if}

					{#if actionType === 'held' || actionType === 'rejected'}
						<div>
							<label for="payout-action-note" class="mb-1 block text-xs font-bold text-[#0E2E25]">
								{m.ady_po_reason_label()} <span class="text-red-500">*</span>:
							</label>
							<textarea
								id="payout-action-note"
								rows="2"
								bind:value={note}
								placeholder={m.ady_po_reason_placeholder()}
								class="w-full rounded-xl border border-[#E4EBE7] bg-[#F8FAF9] p-2.5 text-xs focus:ring-1 focus:ring-[#0C7B58] focus:outline-none"
							></textarea>
						</div>
					{/if}

					{#if actionError}
						<p
							class="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-700"
						>
							{actionError}
						</p>
					{/if}

					<div class="flex items-center justify-between border-t border-[#E4EBE7] pt-3">
						<button
							type="button"
							disabled={isSubmitting}
							onclick={closeModal}
							class="cursor-pointer rounded-lg px-3 py-1.5 text-xs text-[#52776C] hover:bg-[#F8FAF9] disabled:cursor-not-allowed disabled:opacity-40"
						>
							{m.ady_po_cancel()}
						</button>
						<button
							type="button"
							disabled={isSubmitting ||
								!actionType ||
								((actionType === 'held' || actionType === 'rejected') && !note.trim())}
							onclick={handleExecuteAction}
							class="cursor-pointer rounded-xl bg-[#0C7B58] px-5 py-2 text-xs font-bold text-white transition-all hover:bg-[#096649] disabled:cursor-not-allowed disabled:opacity-40"
						>
							{m.ady_po_save()}
						</button>
					</div>
				{:else}
					<div
						class="flex items-center justify-between gap-3 rounded-xl border border-[#E4EBE7] bg-[#F8FAF9] p-3.5"
					>
						<div class="flex items-center gap-2.5 text-xs text-[#52776C]">
							<Shield class="h-4 w-4 shrink-0 text-[#698E82]" />
							<span>{m.ady_po_viewonly()}</span>
						</div>
						<button
							type="button"
							onclick={closeModal}
							class="shrink-0 cursor-pointer rounded-lg border border-[#E4EBE7] px-4 py-1.5 text-xs font-semibold text-[#52776C] transition-colors hover:bg-white"
						>
							{m.ady_po_close()}
						</button>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
