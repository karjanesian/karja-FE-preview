<script lang="ts">
	import { onMount } from 'svelte';
	import { admin } from '$lib/stores/admin.svelte';
	import { canTransitionVerificationStatus, hasPermission } from '$lib/domain/adminDomain';
	import { m } from '$lib/paraglide/messages.js';
	import { ApiError } from '$lib/api';
	import { mapKycToSellerProfile } from '$lib/domain/adminKycApi';
	import type { IdentityVerificationStatus, SellerProfile } from '$lib/types';
	import Check from 'lucide-svelte/icons/check';
	import X from 'lucide-svelte/icons/x';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import FileText from 'lucide-svelte/icons/file-text';
	import ShieldCheck from 'lucide-svelte/icons/shield-check';
	import Maximize2 from 'lucide-svelte/icons/maximize-2';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import ZoomIn from 'lucide-svelte/icons/zoom-in';
	import Lock from 'lucide-svelte/icons/lock';
	import Shield from 'lucide-svelte/icons/shield';
	import {
		DataTable,
		type DataTableColumn,
		type DataTableCellContext
	} from '$lib/components/ui/data-table';

	type ReviewAction = 'verified' | 'needs_update' | 'rejected';
	type VerificationFilter = 'pending' | 'needs_update' | 'verified' | 'rejected' | 'all';

	let selectedSeller = $state<SellerProfile | null>(null);
	let reviewAction = $state<ReviewAction | null>(null);
	let reviewNote = $state('');
	let activeFilter = $state<VerificationFilter>('pending');
	let fullDocZoom = $state<string | null>(null);
	let docError = $state(false);
	let isSubmitting = $state(false);
	let actionError = $state<string | null>(null);

	const PAGE_SIZE = 10;

	onMount(() => {
		void admin.syncAdminKyc();
		reload(1);
	});

	const canViewDocument = $derived(hasPermission(admin.adminUser, 'verification.document.view'));
	const canDecide = $derived(hasPermission(admin.adminUser, 'verification.decide'));

	const tabKeys = ['pending', 'needs_update', 'verified', 'rejected', 'all'] as const;

	const kycSellers = $derived(admin.platformKyc.map(mapKycToSellerProfile));
	const sourceSellers = $derived(kycSellers.length > 0 ? kycSellers : admin.platformSellers);

	const serverPage = $derived(admin.kycPage);
	const usingServer = $derived(serverPage?.server ?? false);
	const pageSellers = $derived((serverPage?.items ?? []).map(mapKycToSellerProfile));

	/** Muat satu halaman antrean KYC dari BE; `fallback` dipakai saat offline. */
	function reload(targetPage = 1) {
		void admin.loadKycPage(
			{
				page: targetPage,
				limit: PAGE_SIZE,
				status: activeFilter === 'all' ? undefined : activeFilter
			},
			admin.platformKyc
		);
	}

	function goToPage(target: number) {
		reload(target);
	}

	function setFilter(tab: VerificationFilter) {
		activeFilter = tab;
		reload(1);
	}

	function findKycRecord(id: string) {
		return (
			(serverPage?.items ?? []).find((k) => k.id === id) ??
			admin.platformKyc.find((k) => k.id === id)
		);
	}

	const filteredSellers = $derived(
		sourceSellers.filter((s) => {
			const status = s.verification?.status || 'unverified';
			return activeFilter === 'all' || status === activeFilter;
		})
	);

	const loading = $derived(!serverPage);
	const viewItems = $derived(serverPage ? (serverPage.server ? pageSellers : filteredSellers) : []);
	const viewTotal = $derived(
		serverPage ? (serverPage.server ? (serverPage.total ?? 0) : filteredSellers.length) : 0
	);

	const tabs = $derived<Record<VerificationFilter, () => string>>({
		pending: m.ady_ver_tab_pending,
		needs_update: m.ady_ver_tab_needs_update,
		verified: m.ady_ver_tab_verified,
		rejected: m.ady_ver_tab_rejected,
		all: m.ady_ver_tab_all
	});

	function statusClass(status: IdentityVerificationStatus): string {
		if (status === 'verified') return 'bg-[#EBF5F0] text-[#0C7B58] border border-[#D0E6DC]';
		if (status === 'pending') return 'bg-amber-50 text-amber-800 border border-amber-200';
		if (status === 'needs_update') return 'bg-orange-50 text-orange-800 border border-orange-200';
		if (status === 'rejected') return 'bg-red-50 text-red-700 border border-red-200';
		return 'bg-slate-100 text-slate-600 border border-slate-200';
	}

	function statusLabel(status: IdentityVerificationStatus): string {
		if (status === 'verified') return m.ady_ver_tab_verified();
		if (status === 'pending') return m.ady_ver_tab_pending();
		if (status === 'needs_update') return m.ady_ver_tab_needs_update();
		if (status === 'unverified') return m.ady_ver_tab_unverified();
		return m.ady_ver_tab_rejected();
	}

	function modalStatusLabel(status?: IdentityVerificationStatus): string {
		if (status === 'verified') return m.ady_ver_tab_verified();
		if (status === 'needs_update') return m.ady_ver_tab_needs_update();
		if (status === 'rejected') return m.ady_ver_tab_rejected();
		return m.ady_ver_tab_pending();
	}

	function getDocumentUrl(sellerItem: SellerProfile): string | null {
		const url = sellerItem.verification?.ktpPhotoUrl || sellerItem.verification?.idCardPhotoUrl;
		return typeof url === 'string' && url.trim().length > 0 ? url : null;
	}

	function getNik(sellerItem: SellerProfile): string {
		return sellerItem.verification?.nik || sellerItem.verification?.idCardNumber || '';
	}

	function getFullNameKtp(sellerItem: SellerProfile): string {
		return sellerItem.verification?.fullNameKtp || sellerItem.name;
	}

	function handleOpenReview(sellerItem: SellerProfile) {
		selectedSeller = sellerItem;
		reviewAction = null;
		reviewNote = sellerItem.verification?.rejectionReason || '';
		docError = false;
	}

	async function handleConfirmReview() {
		const seller = selectedSeller;
		if (!seller || !reviewAction || isSubmitting) return;
		const currentStatus = seller.verification?.status || 'unverified';
		if (!canTransitionVerificationStatus(currentStatus, reviewAction)) {
			alert(m.ady_ver_alert_transition({ from: currentStatus, to: reviewAction }));
			return;
		}

		if ((reviewAction === 'needs_update' || reviewAction === 'rejected') && !reviewNote.trim()) {
			alert(m.ady_ver_alert_note());
			return;
		}

		const kycRecord = seller.id ? findKycRecord(seller.id) : undefined;
		isSubmitting = true;
		actionError = null;
		try {
			if (kycRecord) {
				await admin.reviewKyc(kycRecord.id, reviewAction, reviewNote.trim());
			} else {
				admin.updateVerification(
					seller.id || `seller_${seller.username}`,
					reviewAction,
					reviewNote.trim()
				);
			}
			selectedSeller = null;
			reviewAction = null;
			reviewNote = '';
			reload(serverPage?.page ?? 1);
		} catch (e) {
			actionError = e instanceof ApiError ? e.message : m.admin_action_failed();
		} finally {
			isSubmitting = false;
		}
	}

	function closeModal() {
		selectedSeller = null;
		actionError = null;
	}

	function onEscape(e: KeyboardEvent) {
		if (e.key !== 'Escape') return;
		if (fullDocZoom) {
			fullDocZoom = null;
			return;
		}
		closeModal();
	}

	const columns: DataTableColumn<SellerProfile>[] = [
		{ id: 'seller', header: m.ady_ver_th_seller() },
		{ id: 'status', header: m.ady_ver_th_status() },
		{ id: 'account', header: m.ady_ver_th_account() },
		{ id: 'submitted', header: m.ady_ver_th_submitted() },
		{ id: 'action', header: m.ady_ver_th_action(), meta: { align: 'right' } }
	];
</script>

<svelte:window onkeydown={onEscape} />

{#snippet vSellerCell(ctx: DataTableCellContext<SellerProfile>)}
	{@const sellerItem = ctx.row.original}
	<div class="flex items-center gap-3">
		{#if sellerItem.avatarUrl && sellerItem.avatarUrl.trim().length > 0}
			<img
				src={sellerItem.avatarUrl}
				alt=""
				class="h-8 w-8 rounded-full border border-[#E4EBE7] object-cover"
			/>
		{:else}
			<div
				class="flex h-8 w-8 items-center justify-center rounded-full border border-[#CCE6D6] bg-[#EAF8F0] text-xs font-bold text-[#0C7B58]"
			>
				{sellerItem.name.slice(0, 2).toUpperCase()}
			</div>
		{/if}
		<div>
			<p class="text-xs font-semibold text-[#0E2E25]">{sellerItem.name}</p>
			<p class="font-mono text-[11px] text-[#698E82]">@{sellerItem.username}</p>
		</div>
	</div>
{/snippet}

{#snippet vStatusCell(ctx: DataTableCellContext<SellerProfile>)}
	{@const vStatus = ctx.row.original.verification?.status || 'unverified'}
	<span
		class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold {statusClass(
			vStatus
		)}"
	>
		{#if vStatus === 'verified'}
			<ShieldCheck class="h-3.5 w-3.5 text-[#0C7B58]" />
		{:else if vStatus === 'pending'}
			<AlertCircle class="h-3.5 w-3.5 text-amber-700" />
		{:else if vStatus === 'needs_update'}
			<AlertTriangle class="h-3.5 w-3.5 text-orange-700" />
		{/if}
		{statusLabel(vStatus)}
	</span>
{/snippet}

{#snippet vAccountCell(ctx: DataTableCellContext<SellerProfile>)}
	{@const sellerItem = ctx.row.original}
	<p class="font-medium text-[#0E2E25]">{sellerItem.bankInfo?.bank || '-'}</p>
	<p class="font-mono text-[11px] text-[#52776C]">
		{m.ady_ver_an_line({
			number: sellerItem.bankInfo?.accountNumber || '-',
			holder: sellerItem.bankInfo?.accountHolder || '-'
		})}
	</p>
{/snippet}

{#snippet vSubmittedCell(ctx: DataTableCellContext<SellerProfile>)}
	<span class="font-mono text-[11px] text-[#52776C]">
		{ctx.row.original.verification?.submittedAt
			? new Date(ctx.row.original.verification.submittedAt).toLocaleDateString('id-ID', {
					day: 'numeric',
					month: 'short',
					year: 'numeric'
				})
			: '-'}
	</span>
{/snippet}

{#snippet vActionCell(ctx: DataTableCellContext<SellerProfile>)}
	<button
		type="button"
		onclick={() => handleOpenReview(ctx.row.original)}
		class="cursor-pointer rounded-lg border border-[#D0E6DC] bg-[#EBF5F0] px-3 py-1.5 text-xs font-semibold text-[#0C7B58] transition-all hover:bg-[#0C7B58] hover:text-white"
	>
		{m.ady_ver_review()}
	</button>
{/snippet}

{#snippet verificationsEmpty()}
	<div class="flex flex-col items-center justify-center gap-2">
		<div
			class="flex h-10 w-10 items-center justify-center rounded-full bg-[#EBF5F0] text-[#0C7B58]"
		>
			<Check class="h-5 w-5" />
		</div>
		<p class="font-semibold text-[#0E2E25]">{m.ady_ver_empty_title()}</p>
		<p class="text-[11px] text-[#698E82]">{m.ady_ver_empty_desc()}</p>
	</div>
{/snippet}

<div class="max-w-7xl space-y-6">
	<div
		class="flex flex-col justify-between gap-3 border-b border-[#E4EBE7] pb-4 sm:flex-row sm:items-center"
	>
		<div>
			<h1 class="text-xl font-bold tracking-tight text-[#0E2E25]">{m.ady_ver_title()}</h1>
			<p class="mt-0.5 text-xs text-[#52776C]">{m.ady_ver_subtitle()}</p>
		</div>

		<div
			class="flex items-center gap-1 self-start rounded-xl border border-[#D0E6DC] bg-[#EBF5F0] p-1 text-xs sm:self-auto"
			role="group"
			aria-label={m.ady_ver_title()}
		>
			{#each tabKeys as tab (tab)}
				<button
					type="button"
					onclick={() => setFilter(tab)}
					aria-pressed={activeFilter === tab}
					class="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors {activeFilter ===
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
			getRowId={(sellerItem) => sellerItem.username}
			empty={verificationsEmpty}
			cellSnippets={{
				seller: vSellerCell,
				status: vStatusCell,
				account: vAccountCell,
				submitted: vSubmittedCell,
				action: vActionCell
			}}
		/>
	</div>

	{#if selectedSeller}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#0E2E25]/60 p-3 backdrop-blur-xs sm:p-6"
			role="presentation"
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-label={m.ady_ver_modal_title()}
				class="my-auto max-h-[92vh] w-full max-w-4xl space-y-6 overflow-y-auto rounded-2xl border border-[#E4EBE7] bg-white p-6 text-left shadow-2xl"
			>
				<div class="flex items-start justify-between border-b border-[#E4EBE7] pb-4">
					<div class="flex items-center gap-3">
						{#if selectedSeller.avatarUrl && selectedSeller.avatarUrl.trim().length > 0}
							<img
								src={selectedSeller.avatarUrl}
								alt=""
								class="h-10 w-10 rounded-full border border-[#E4EBE7] object-cover"
							/>
						{:else}
							<div
								class="flex h-10 w-10 items-center justify-center rounded-full border border-[#CCE6D6] bg-[#EAF8F0] text-sm font-bold text-[#0C7B58]"
							>
								{selectedSeller.name.slice(0, 2).toUpperCase()}
							</div>
						{/if}
						<div>
							<h3 class="flex items-center gap-2 text-base font-bold text-[#0E2E25]">
								<span>{m.ady_ver_modal_title()}</span>
								<span
									class="rounded-full border border-[#D0E6DC] bg-[#EBF5F0] px-2 py-0.5 text-xs font-medium text-[#0C7B58]"
								>
									{modalStatusLabel(selectedSeller.verification?.status)}
								</span>
							</h3>
							<p class="text-xs text-[#52776C]">
								<span class="font-semibold text-[#0E2E25]">{selectedSeller.name}</span> •
								<span class="font-mono">@{selectedSeller.username}</span> • {selectedSeller.email}
							</p>
						</div>
					</div>
					<button
						type="button"
						onclick={closeModal}
						aria-label={m.ady_ver_close()}
						class="cursor-pointer rounded-lg p-1.5 text-[#52776C] transition-colors hover:bg-slate-100 hover:text-[#0E2E25]"
					>
						<X class="h-5 w-5" />
					</button>
				</div>

				<div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
					<div class="space-y-2 lg:col-span-7">
						<div class="flex items-center justify-between">
							<span class="flex items-center gap-1.5 text-xs font-bold text-[#0E2E25]">
								<FileText class="h-4 w-4 text-[#0C7B58]" />
								<span>{m.ady_ver_doc_title()}</span>
							</span>
							{#if canViewDocument && getDocumentUrl(selectedSeller) && !docError}
								<button
									type="button"
									onclick={() => (fullDocZoom = getDocumentUrl(selectedSeller!))}
									class="flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-[#0C7B58] hover:underline"
								>
									<Maximize2 class="h-3 w-3" />
									<span>{m.ady_ver_zoom()}</span>
								</button>
							{/if}
						</div>

						<div
							class="group relative flex min-h-[220px] items-center justify-center overflow-hidden rounded-xl border border-[#E4EBE7] bg-[#F8FAF9] p-2"
						>
							{#if !canViewDocument}
								<div class="max-w-sm space-y-2.5 p-6 text-center">
									<div
										class="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-[#D0E6DC] bg-[#EBF5F0] text-[#0C7B58]"
									>
										<Lock class="h-5 w-5" />
									</div>
									<p class="text-xs font-bold text-[#0E2E25]">{m.ady_ver_hidden_title()}</p>
									<p class="text-[11px] leading-relaxed text-[#52776C]">
										{m.ady_ver_hidden_desc()}
									</p>
								</div>
							{:else if getDocumentUrl(selectedSeller) && !docError}
								<div
									class="relative w-full cursor-zoom-in"
									role="button"
									tabindex="0"
									onclick={() => (fullDocZoom = getDocumentUrl(selectedSeller!))}
									onkeydown={(e) => {
										if (e.key === 'Enter') fullDocZoom = getDocumentUrl(selectedSeller!);
									}}
								>
									<img
										src={getDocumentUrl(selectedSeller) ?? ''}
										alt={m.ady_ver_doc_alt()}
										onerror={() => (docError = true)}
										class="max-h-[300px] w-full rounded-lg border border-[#D0E6DC] object-contain shadow-xs"
									/>
									<div
										class="absolute inset-0 flex items-center justify-center rounded-lg bg-black/20 opacity-0 transition-opacity group-hover:opacity-100"
									>
										<span
											class="flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#0E2E25] shadow-md"
										>
											<ZoomIn class="h-4 w-4 text-[#0C7B58]" />
											<span>{m.ady_ver_click_full()}</span>
										</span>
									</div>
								</div>
							{:else}
								<div class="space-y-2 p-6 text-center text-[#698E82]">
									<AlertCircle class="mx-auto h-8 w-8 text-amber-600" />
									<p class="text-xs font-semibold text-[#0E2E25]">{m.ady_ver_nodoc_title()}</p>
									<p class="text-[11px]">{m.ady_ver_nodoc_desc()}</p>
								</div>
							{/if}
						</div>
					</div>

					<div class="space-y-4 lg:col-span-5">
						<div class="space-y-3 rounded-xl border border-[#E4EBE7] bg-[#F8FAF9] p-4 text-xs">
							<div>
								<h4 class="border-b border-[#E4EBE7] pb-1.5 text-xs font-bold text-[#0E2E25]">
									{m.ady_ver_ktp_data()}
								</h4>
								<div class="mt-2 space-y-1.5 text-[11px]">
									<div class="flex justify-between">
										<span class="text-[#698E82]">{m.ady_ver_name_ktp()}</span>
										<span class="font-semibold text-[#0E2E25]">
											{getFullNameKtp(selectedSeller)}
										</span>
									</div>
									<div class="flex justify-between">
										<span class="text-[#698E82]">{m.ady_ver_nik()}</span>
										<span class="font-mono font-semibold text-[#0E2E25]">
											{#if canViewDocument}
												{getNik(selectedSeller) || m.ady_ver_nik_empty()}
											{:else if getNik(selectedSeller)}
												{`${getNik(selectedSeller).slice(0, 4)}••••••••${getNik(selectedSeller).slice(-2)}`}
											{:else}
												{m.ady_ver_nik_empty()}
											{/if}
										</span>
									</div>
									<div class="flex justify-between">
										<span class="text-[#698E82]">{m.ady_ver_birth()}</span>
										<span class="font-medium text-[#0E2E25]">
											{selectedSeller.verification?.birthDate || '-'}
										</span>
									</div>
								</div>
							</div>

							<div>
								<h4 class="border-b border-[#E4EBE7] pb-1.5 text-xs font-bold text-[#0E2E25]">
									{m.ady_ver_bank_data()}
								</h4>
								<div class="mt-2 space-y-1.5 text-[11px]">
									<div class="flex justify-between">
										<span class="text-[#698E82]">{m.ady_ver_bank()}</span>
										<span class="font-semibold text-[#0E2E25]">
											{selectedSeller.bankInfo?.bank || '-'}
										</span>
									</div>
									<div class="flex justify-between">
										<span class="text-[#698E82]">{m.ady_ver_account()}</span>
										<span class="font-mono font-semibold text-[#0E2E25]">
											{selectedSeller.bankInfo?.accountNumber || '-'}
										</span>
									</div>
									<div class="flex justify-between">
										<span class="text-[#698E82]">{m.ady_ver_holder()}</span>
										<span class="font-semibold text-[#0E2E25]">
											{selectedSeller.bankInfo?.accountHolder || '-'}
										</span>
									</div>
								</div>
							</div>
						</div>

						<div class="space-y-2 rounded-xl border border-[#D0E6DC] bg-[#EBF5F0]/60 p-3.5 text-xs">
							<p class="text-xs font-bold text-[#0E2E25]">{m.ady_ver_checks()}</p>
							<div class="space-y-1.5 text-[11px]">
								<div class="flex items-center gap-2">
									{#if selectedSeller.bankInfo?.accountHolder && selectedSeller.name
											.toLowerCase()
											.includes(selectedSeller.bankInfo.accountHolder.toLowerCase().split(' ')[0])}
										<Check class="h-3.5 w-3.5 text-[#0C7B58]" />
									{:else}
										<AlertCircle class="h-3.5 w-3.5 text-amber-600" />
									{/if}
									<span class="text-[#0E2E25]">{m.ady_ver_check1()}</span>
								</div>

								<div class="flex items-center gap-2">
									{#if getNik(selectedSeller) && selectedSeller.bankInfo?.accountNumber}
										<Check class="h-3.5 w-3.5 text-[#0C7B58]" />
									{:else}
										<X class="h-3.5 w-3.5 text-red-500" />
									{/if}
									<span class="text-[#0E2E25]">{m.ady_ver_check2()}</span>
								</div>

								<div class="flex items-center gap-2">
									{#if getDocumentUrl(selectedSeller)}
										<Check class="h-3.5 w-3.5 text-[#0C7B58]" />
									{:else}
										<AlertCircle class="h-3.5 w-3.5 text-amber-600" />
									{/if}
									<span class="text-[#0E2E25]">{m.ady_ver_check3()}</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div class="space-y-4 border-t border-[#E4EBE7] pt-4">
					{#if canDecide}
						<div>
							<p class="mb-2 block text-xs font-bold text-[#0E2E25]">{m.ady_ver_result_label()}</p>
							<div class="grid grid-cols-3 gap-3">
								<button
									type="button"
									onclick={() => (reviewAction = 'verified')}
									aria-pressed={reviewAction === 'verified'}
									class="flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all {reviewAction ===
									'verified'
										? 'border-[#0C7B58] bg-[#0C7B58] text-white shadow-xs'
										: 'border-[#E4EBE7] text-[#52776C] hover:bg-[#F8FAF9]'}"
								>
									<Check class="h-4 w-4" />
									<span>{m.ady_ver_action_approve()}</span>
								</button>

								<button
									type="button"
									onclick={() => (reviewAction = 'needs_update')}
									aria-pressed={reviewAction === 'needs_update'}
									class="flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all {reviewAction ===
									'needs_update'
										? 'border-amber-600 bg-amber-600 text-white shadow-xs'
										: 'border-[#E4EBE7] text-[#52776C] hover:bg-[#F8FAF9]'}"
								>
									<AlertCircle class="h-4 w-4" />
									<span>{m.ady_ver_action_update()}</span>
								</button>

								<button
									type="button"
									onclick={() => (reviewAction = 'rejected')}
									aria-pressed={reviewAction === 'rejected'}
									class="flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all {reviewAction ===
									'rejected'
										? 'border-red-600 bg-red-600 text-white shadow-xs'
										: 'border-[#E4EBE7] text-[#52776C] hover:bg-[#F8FAF9]'}"
								>
									<X class="h-4 w-4" />
									<span>{m.ady_ver_action_reject()}</span>
								</button>
							</div>
						</div>

						{#if reviewAction === 'needs_update' || reviewAction === 'rejected' || reviewAction === 'verified'}
							<div>
								<label
									for="verification-review-note"
									class="mb-1.5 block text-xs font-bold text-[#0E2E25]"
								>
									{m.ady_ver_note_label()}
									{#if reviewAction !== 'verified'}
										<span class="text-red-500">*</span>
									{/if}:
								</label>
								<textarea
									id="verification-review-note"
									rows="2"
									bind:value={reviewNote}
									placeholder={reviewAction === 'needs_update'
										? m.ady_ver_note_ph_update()
										: reviewAction === 'rejected'
											? m.ady_ver_note_ph_reject()
											: m.ady_ver_note_ph_verified()}
									class="w-full rounded-xl border border-[#E4EBE7] bg-[#F8FAF9] p-3 text-xs focus:ring-1 focus:ring-[#0C7B58] focus:outline-none"
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
								class="cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold text-[#52776C] hover:bg-[#F8FAF9] disabled:cursor-not-allowed disabled:opacity-40"
							>
								{m.ady_ver_cancel()}
							</button>
							<button
								type="button"
								disabled={isSubmitting ||
									!reviewAction ||
									((reviewAction === 'needs_update' || reviewAction === 'rejected') &&
										!reviewNote.trim())}
								onclick={handleConfirmReview}
								class="cursor-pointer rounded-xl bg-[#0C7B58] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#096649] disabled:cursor-not-allowed disabled:opacity-40"
							>
								{m.ady_ver_save()}
							</button>
						</div>
					{:else}
						<div
							class="flex items-center justify-between gap-3 rounded-xl border border-[#E4EBE7] bg-[#F8FAF9] p-3.5"
						>
							<div class="flex items-center gap-2.5 text-xs text-[#52776C]">
								<Shield class="h-4 w-4 shrink-0 text-[#698E82]" />
								<span>{m.ady_ver_viewonly()}</span>
							</div>
							<button
								type="button"
								onclick={closeModal}
								class="shrink-0 cursor-pointer rounded-lg border border-[#E4EBE7] px-4 py-1.5 text-xs font-semibold text-[#52776C] transition-colors hover:bg-white"
							>
								{m.ady_ver_close()}
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	{#if fullDocZoom}
		<div
			class="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
			role="presentation"
			onclick={() => (fullDocZoom = null)}
			onkeydown={() => {}}
		>
			<div class="relative flex max-h-[90vh] max-w-4xl flex-col items-center">
				<img
					src={fullDocZoom}
					alt={m.ady_ver_lightbox_alt()}
					class="max-h-[85vh] max-w-full rounded-xl border border-white/20 object-contain shadow-2xl"
				/>
				<p class="mt-3 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white">
					{m.ady_ver_lightbox_hint()}
				</p>
			</div>
		</div>
	{/if}
</div>
