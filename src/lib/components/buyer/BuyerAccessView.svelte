<script lang="ts">
	import { goto } from '$app/navigation';
	import { formatRupiah } from '$lib/data/mockData';
	import * as m from '$lib/paraglide/messages.js';
	import PublicNavbar from '$lib/components/public/PublicNavbar.svelte';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Check from 'lucide-svelte/icons/check';
	import Copy from 'lucide-svelte/icons/copy';
	import Download from 'lucide-svelte/icons/download';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import PackageX from 'lucide-svelte/icons/package-x';
	import Video from 'lucide-svelte/icons/video';
	import type { PublicOrder, PublicOrderPaymentStatus } from '$lib/domain/checkoutApi';

	type Props = {
		order: PublicOrder | null;
	};
	let { order }: Props = $props();

	let copiedLink = $state(false);

	function paymentLabel(status: PublicOrderPaymentStatus): string {
		switch (status) {
			case 'lunas':
				return m.bu_acc_paid();
			case 'gratis':
				return m.bu_sh_free();
			case 'menunggu_pembayaran':
				return m.bu_acc_pay_pending();
			case 'gagal':
				return m.bu_acc_pay_failed();
			case 'dibatalkan':
				return m.bu_acc_pay_cancelled();
			default:
				return status;
		}
	}

	function fulfillmentLabel(status: string): string {
		switch (status) {
			case 'belum_dibayar':
				return m.bu_acc_fulfillment_unpaid();
			case 'perlu_dijadwalkan':
				return m.bu_acc_fulfillment_need_schedule();
			case 'terjadwal':
			case 'sudah_dijadwalkan':
				return m.bu_acc_fulfillment_scheduled();
			case 'menunggu_brief':
				return m.bu_acc_fulfillment_waiting_brief();
			case 'sedang_dikerjakan':
				return m.bu_acc_service_progress();
			case 'hasil_dikirim':
				return m.bu_acc_service_delivered();
			case 'akses_diberikan':
				return m.bu_acc_fulfillment_access_granted();
			case 'selesai':
				return m.bu_acc_fulfillment_done();
			case 'dibatalkan':
				return m.bu_acc_fulfillment_cancelled();
			default:
				return status;
		}
	}

	async function handleCopyLink(link?: string) {
		if (!link) return;
		try {
			await navigator.clipboard.writeText(link);
			copiedLink = true;
			setTimeout(() => (copiedLink = false), 2000);
		} catch {
			/* noop */
		}
	}

	function goHome() {
		void goto('/');
	}
</script>

<div class="flex min-h-screen flex-col bg-[#FAFDFB] text-[#0E2E25] antialiased">
	<PublicNavbar />

	<main class="flex flex-1 items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
		{#if !order}
			<div
				class="w-full max-w-md space-y-4 rounded-3xl border border-[#E5ECE7] bg-white p-8 text-center shadow-xs"
			>
				<div
					class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF8E6] text-[#B88710]"
				>
					<PackageX class="h-7 w-7" />
				</div>
				<h1 class="text-lg font-bold text-[#0E2E25]">{m.bu_acc_nf_title()}</h1>
				<p class="text-xs leading-relaxed text-[#52776C]">{m.bu_acc_nf_desc()}</p>
				<div class="pt-2">
					<button
						type="button"
						onclick={goHome}
						class="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#0C7B58] py-2.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-[#096649]"
					>
						<ArrowLeft class="h-3.5 w-3.5" />
						<span>{m.bu_acc_nf_home()}</span>
					</button>
				</div>
			</div>
		{:else}
			<div class="w-full max-w-xl space-y-3">
				<div class="flex justify-end">
					<span
						class="rounded-full border border-[#CCE6D6] bg-[#EAF8F0] px-2.5 py-1 text-xs font-medium text-[#0C7B58]"
					>
						{m.bu_acc_badge()}
					</span>
				</div>

				<div
					class="relative space-y-6 rounded-3xl border border-[#CCE6D6] bg-white p-5 shadow-xs sm:p-7"
				>
					<div class="flex items-start justify-between space-y-1 border-b border-[#EAF4EE] pb-3">
						<div class="space-y-1">
							<div class="flex flex-wrap items-center gap-2">
								<span
									class="rounded-md bg-[#EAF8F0] px-2 py-0.5 font-mono text-xs font-bold text-[#0C7B58]"
								>
									{order.orderNumber}
								</span>
								<span
									class="rounded-full border border-[#BDE5D0] bg-[#EAF8F0] px-2 py-0.5 text-xs font-bold text-[#0C7B58]"
								>
									{paymentLabel(order.paymentStatus)}
								</span>
							</div>
							<h2 class="text-lg font-bold text-[#0E2E25] sm:text-xl">
								{order.productTitle}
							</h2>
							<p class="text-xs text-[#52776C]">
								{m.bu_acc_from_to({
									seller: m.bu_acc_seller_fallback(),
									buyer: order.buyerName
								})}
							</p>
						</div>
					</div>

					<div
						class="grid gap-2 rounded-2xl border border-[#E4EBE7] bg-[#FAFDFB] p-4 text-xs sm:grid-cols-2"
					>
						<div class="flex items-center justify-between gap-3">
							<span class="text-gray-500">{m.bu_acc_amount_label()}</span>
							<span class="font-bold text-[#0E2E25]">
								{order.amount > 0 ? formatRupiah(order.amount) : m.bu_sh_free()}
							</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-gray-500">{m.bu_acc_pay_label()}</span>
							<span class="font-semibold text-[#0C7B58]">
								{paymentLabel(order.paymentStatus)}
							</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-gray-500">{m.bu_acc_fulfillment_label()}</span>
							<span class="font-semibold text-[#0E2E25]">
								{fulfillmentLabel(order.fulfillmentStatus)}
							</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-gray-500">{m.bu_acc_buyer_label()}</span>
							<span class="font-semibold text-[#0E2E25]">{order.buyerName}</span>
						</div>
					</div>

					<div class="space-y-3 rounded-2xl border border-[#CCE6D6] bg-[#F2FAF5] p-4 text-xs">
						<div class="flex items-center gap-2 font-bold text-[#0A3D2E]">
							{#if order.meetingLink}
								<Video class="h-4 w-4 text-[#0C7B58]" />
							{:else}
								<Download class="h-4 w-4 text-[#0C7B58]" />
							{/if}
							<span>{m.bu_acc_delivery_title()}</span>
						</div>

						{#if order.meetingLink}
							<div class="space-y-2 border-t border-[#D5EBDD] pt-2">
								<div class="flex items-center gap-1 text-[11px] font-bold text-[#0A3D2E]">
									<Video class="h-3.5 w-3.5 text-[#0C7B58]" />
									<span>{m.bu_acc_meet_link()}</span>
								</div>
								<div
									class="flex items-center justify-between gap-2 rounded-xl border border-[#CCE6D6] bg-white p-2.5"
								>
									<span class="truncate font-mono text-xs text-[#0C7B58]">
										{order.meetingLink}
									</span>
									<div class="flex shrink-0 items-center gap-1">
										<button
											type="button"
											onclick={() => void handleCopyLink(order?.meetingLink)}
											class="cursor-pointer rounded-lg p-1.5 text-xs text-[#0C7B58] hover:bg-[#EAF8F0]"
											title={m.bu_acc_copy_link()}
										>
											{#if copiedLink}
												<Check class="h-3.5 w-3.5 text-emerald-600" />
											{:else}
												<Copy class="h-3.5 w-3.5" />
											{/if}
										</button>
										<a
											href={order.meetingLink}
											target="_blank"
											rel="noopener noreferrer"
											class="inline-flex items-center gap-1 rounded-lg bg-[#0C7B58] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#096649]"
										>
											<span>{m.bu_acc_open_meet()}</span>
											<ExternalLink class="h-3 w-3" />
										</a>
									</div>
								</div>
							</div>
						{/if}

						{#if order.deliveryNotes}
							<div class="space-y-1 border-t border-[#D5EBDD] pt-2">
								<span class="block font-bold text-[#0C7B58]">{m.bu_acc_seller_note()}</span>
								<p class="leading-relaxed whitespace-pre-wrap text-[#2D5347]">
									{order.deliveryNotes}
								</p>
							</div>
						{/if}

						{#if !order.meetingLink && !order.deliveryNotes}
							<p class="leading-relaxed text-[#355B50]">{m.bu_acc_delivery_pending()}</p>
						{/if}
					</div>

					<div class="flex items-center justify-between pt-1">
						<button
							type="button"
							onclick={goHome}
							class="cursor-pointer text-xs font-bold text-[#0C7B58] hover:underline"
						>
							{m.bu_acc_nf_home()}
						</button>
					</div>
				</div>
			</div>
		{/if}
	</main>

	<footer class="border-t border-[#E5ECE7] bg-white py-6 text-center text-xs text-gray-400">
		<div class="mx-auto flex max-w-xl flex-col items-center justify-between gap-2 px-4 sm:flex-row">
			<div class="text-[11px] text-[#52776C]">
				{m.bu_acc_footer_prefix()} <span class="font-semibold text-[#0E2E25]">Karja</span>
				{m.bu_acc_footer_tagline()}
			</div>
			<button
				type="button"
				onclick={goHome}
				class="cursor-pointer text-[11px] font-medium text-[#0C7B58] hover:underline"
			>
				{m.bu_acc_footer_about()}
			</button>
		</div>
	</footer>
</div>
