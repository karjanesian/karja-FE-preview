<script lang="ts">
	import { seller } from '$lib/stores/seller.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { findBookingForOrder, getPaymentStatusDisplay } from '$lib/domain/orderLifecycle';
	import { formatRupiah } from '$lib/data/mockData';
	import type { Order } from '$lib/types';
	import { normalizeProductType } from '$lib/types';
	import ProductTypeMeta from '$lib/components/common/ProductTypeMeta.svelte';
	import ContactBuyerModal, {
		type ContactIntent
	} from '$lib/components/orders/ContactBuyerModal.svelte';
	import X from 'lucide-svelte/icons/x';
	import Check from 'lucide-svelte/icons/check';
	import Copy from 'lucide-svelte/icons/copy';

	type Props = { order: Order; onClose: () => void };
	let { order, onClose }: Props = $props();

	let copiedLink = $state(false);
	let cancelMode = $state(false);
	let cancelReason = $state('');
	let deliverNotes = $state('');
	let contactOpen = $state(false);
	let contactIntent: ContactIntent = $state('general');
	let replyDraft = $state('');
	let pending = $state(false);

	const live = $derived(seller.findOrder(order.id) ?? order);
	const canonical = $derived(normalizeProductType(live.productType));
	const booking = $derived(findBookingForOrder(live, seller.bookings));
	const review = $derived(
		live.reviewId ? seller.reviews.find((r) => r.id === live.reviewId) : live.buyerReview
	);
	const paymentLabel = $derived(
		live.paymentStatus === 'lunas'
			? m.pay_paid()
			: live.isFreeClaim || live.paymentStatus === 'gratis'
				? m.pay_free_claim()
				: getPaymentStatusDisplay(live).label
	);

	async function run(action: () => Promise<void>) {
		if (pending) return;
		pending = true;
		try {
			await action();
		} finally {
			pending = false;
		}
	}

	async function copyText(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			copiedLink = true;
			setTimeout(() => (copiedLink = false), 1500);
		} catch {
			/* noop */
		}
	}

	function startWorking() {
		return run(() => seller.updateFulfillment(live.id, 'sedang_dikerjakan'));
	}

	function deliverResult() {
		return run(() =>
			seller.updateFulfillment(live.id, 'hasil_dikirim', {
				deliveryNotes: deliverNotes || undefined,
				serviceDelivery: {
					id: `srv_${Date.now()}`,
					orderId: live.id,
					method: 'instruction',
					instructions: deliverNotes || '',
					deliveredAt: new Date().toISOString()
				}
			})
		);
	}

	function markComplete() {
		return run(() => seller.updateFulfillment(live.id, 'selesai'));
	}

	function markBuyerNoShow() {
		return run(() => seller.markNoShow(live.id, { noShowParty: 'buyer' }));
	}

	async function confirmCancel() {
		if (pending || !cancelReason.trim()) return;
		await run(async () => {
			if (canonical === 'session') {
				await seller.cancelBooking(live.id, { reason: cancelReason, cancelledBy: 'seller' });
			} else {
				await seller.updateFulfillment(live.id, 'dibatalkan');
			}
		});
		cancelMode = false;
		onClose();
	}

	function sendReply() {
		if (!review || !replyDraft.trim()) return;
		void run(async () => {
			await seller.replyReview(review.id, replyDraft.trim());
			replyDraft = '';
		});
	}
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onClose()} />

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-[#092B21]/50 p-4 backdrop-blur-xs"
>
	<div
		class="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#E5ECE7] bg-white shadow-lg"
	>
		<!-- Header -->
		<div class="flex items-start justify-between border-b border-[#EEF3F0] p-5">
			<div class="space-y-1">
				<div class="flex items-center gap-2">
					<h3 class="text-lg font-bold text-[#0E2E25]">{m.odm_title()}</h3>
					<ProductTypeMeta type={live.productType} size="xs" />
				</div>
				<p class="text-xs text-sage">
					{m.odm_order_number({ number: `#${live.orderNumber}` })} · {m.odm_created_at({
						time: live.createdAt
					})}
				</p>
			</div>
			<button
				type="button"
				onclick={onClose}
				class="cursor-pointer rounded-xl p-2 text-sage transition-colors hover:bg-[#F0F6F3] hover:text-[#0E2E25]"
				aria-label={m.odm_close()}
			>
				<X class="h-5 w-5" />
			</button>
		</div>

		<!-- Body -->
		<div class="flex-1 space-y-4 overflow-y-auto p-5">
			<div class="grid grid-cols-2 gap-3 text-xs">
				<div class="rounded-xl bg-canvas p-3">
					<p class="font-semibold text-sage">{m.odm_buyer()}</p>
					<p class="mt-1 font-bold text-[#0E2E25]">{live.buyerName}</p>
					{#if live.buyerEmail}<p class="truncate text-sage">{live.buyerEmail}</p>{/if}
					{#if live.buyerPhone}<p class="text-sage">{live.buyerPhone}</p>{/if}
				</div>
				<div class="rounded-xl bg-canvas p-3">
					<p class="font-semibold text-sage">{m.odm_paid()}</p>
					<p class="mt-1 font-bold text-[#0E2E25]">
						{live.isFreeClaim || live.amount === 0 ? m.pay_free() : formatRupiah(live.amount)}
					</p>
					<p class="text-sage">{paymentLabel}</p>
				</div>
				<div class="rounded-xl bg-canvas p-3">
					<p class="font-semibold text-sage">{m.odm_product()}</p>
					<p class="mt-1 font-bold text-[#0E2E25]">{live.productTitle}</p>
				</div>
				<div class="rounded-xl bg-canvas p-3">
					<p class="font-semibold text-sage">{m.odm_net_label()}</p>
					<p class="mt-1 font-bold text-brand">{formatRupiah(live.netAmount)}</p>
				</div>
			</div>

			<div class="rounded-xl border border-[#EEF3F0] p-3.5">
				<p class="text-xs font-semibold text-sage">{m.odm_notes()}</p>
				<p class="mt-1 text-sm text-[#0E2E25]">
					{live.buyerNotes && live.buyerNotes.trim() ? live.buyerNotes : m.odm_no_notes()}
				</p>
			</div>

			{#if canonical === 'session'}
				<div class="rounded-xl border border-[#EEF3F0] p-3.5 text-xs">
					<p class="font-semibold text-sage">{m.odm_scheduled()}</p>
					<p class="mt-1 font-bold text-[#0E2E25]">
						{live.bookingDateFormatted
							? `${live.bookingDateFormatted} · ${live.bookingTimeFormatted || ''}`
							: live.scheduledDate || m.odm_not_scheduled()}
					</p>
					{#if live.meetingLink || booking?.meetingUrl}
						<div class="mt-2 flex items-center justify-between gap-2">
							<p class="truncate text-sage">
								{m.odm_meet_link()}: {live.meetingLink || booking?.meetingUrl}
							</p>
							<button
								type="button"
								onclick={() => copyText((live.meetingLink || booking?.meetingUrl) as string)}
								class="inline-flex shrink-0 cursor-pointer items-center gap-1 font-bold text-brand hover:underline"
							>
								{#if copiedLink}
									<Check class="h-3.5 w-3.5" />
								{:else}
									<Copy class="h-3.5 w-3.5" />
								{/if}
								{copiedLink ? m.odm_copied() : m.odm_copy()}
							</button>
						</div>
					{/if}
				</div>
			{/if}

			{#if canonical === 'digital'}
				<div class="rounded-xl border border-[#D5EBDD] bg-[#F4FAF6] p-3.5 text-xs text-[#2F5A4D]">
					{m.odm_access_granted_note()}
				</div>
				<button
					type="button"
					onclick={() => {
						contactIntent = 'feedback';
						contactOpen = true;
					}}
					class="w-full cursor-pointer rounded-xl border border-[#CCE6D6] bg-white px-4 py-2.5 text-xs font-bold text-[#0C7B58] transition-colors hover:bg-[#F2FAF6]"
				>
					{m.odm_action_share_access()}
				</button>
			{/if}

			{#if canonical === 'service' && live.fulfillmentStatus === 'sedang_dikerjakan'}
				<div class="space-y-2">
					<label for="deliver-notes" class="text-xs font-bold text-[#0E2E25]"
						>{m.odm_deliver_notes_label()}</label
					>
					<textarea
						id="deliver-notes"
						bind:value={deliverNotes}
						rows="3"
						placeholder={m.odm_deliver_notes_placeholder()}
						class="w-full rounded-xl border border-[#CCE6D6] bg-canvas p-3 text-xs text-[#0E2E25] focus:border-[#0C7B58] focus:outline-none"
					></textarea>
				</div>
			{/if}

			{#if review}
				<div class="space-y-2 rounded-xl border border-[#EEF3F0] p-3.5">
					<p class="text-xs font-semibold text-sage">{m.odm_review_title()}</p>
					<p class="text-sm text-[#0E2E25]">
						<span class="font-bold">{'★'.repeat(review.rating)}</span>
						{review.comment}
					</p>
					{#if review.sellerReply}
						<p class="rounded-lg bg-canvas p-2 text-xs text-sage">
							{review.sellerReply.comment}
						</p>
					{:else}
						<div class="flex gap-2">
							<input
								bind:value={replyDraft}
								placeholder={m.odm_reply_placeholder()}
								class="flex-1 rounded-xl border border-[#CCE6D6] px-3 py-2 text-xs focus:border-[#0C7B58] focus:outline-none"
							/>
							<button
								type="button"
								onclick={sendReply}
								disabled={pending}
								class="cursor-pointer rounded-xl bg-brand px-3 py-2 text-xs font-bold text-white hover:bg-[#007550] disabled:cursor-not-allowed disabled:opacity-60"
							>
								{m.odm_reply()}
							</button>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Actions -->
			{#if cancelMode}
				<div class="space-y-2 rounded-xl border border-amber-200 bg-[#FFFDF9] p-3.5">
					<p class="text-xs font-bold text-amber-800">{m.odm_cancel_confirm_title()}</p>
					<p class="text-[11px] text-[#92400E]">{m.odm_cancel_confirm_desc()}</p>
					<input
						bind:value={cancelReason}
						placeholder={m.odm_cancel_reason_label()}
						class="w-full rounded-xl border border-[#F2DC9B] bg-white px-3 py-2 text-xs focus:outline-none"
					/>
					<div class="flex gap-2">
						<button
							type="button"
							onclick={confirmCancel}
							disabled={pending}
							class="flex-1 cursor-pointer rounded-xl bg-[#B91C1C] px-3 py-2 text-xs font-bold text-white hover:bg-[#991B1B] disabled:cursor-not-allowed disabled:opacity-60"
						>
							{m.odm_yes_cancel()}
						</button>
						<button
							type="button"
							onclick={() => (cancelMode = false)}
							class="cursor-pointer rounded-xl border border-[#D5E2DC] bg-white px-3 py-2 text-xs font-bold text-sage"
						>
							{m.common_cancel()}
						</button>
					</div>
				</div>
			{:else if canonical === 'service'}
				{#if live.fulfillmentStatus === 'menunggu_brief' || live.fulfillmentStatus === 'perlu_dijadwalkan'}
					<button
						type="button"
						onclick={startWorking}
						disabled={pending}
						class="w-full cursor-pointer rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-[#007550] disabled:cursor-not-allowed disabled:opacity-60"
					>
						{m.odm_action_start()}
					</button>
				{:else if live.fulfillmentStatus === 'sedang_dikerjakan'}
					<button
						type="button"
						onclick={deliverResult}
						disabled={pending}
						class="w-full cursor-pointer rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-[#007550] disabled:cursor-not-allowed disabled:opacity-60"
					>
						{m.odm_action_deliver()}
					</button>
				{:else if live.fulfillmentStatus === 'hasil_dikirim'}
					<button
						type="button"
						onclick={markComplete}
						disabled={pending}
						class="w-full cursor-pointer rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-[#007550] disabled:cursor-not-allowed disabled:opacity-60"
					>
						{m.odm_action_complete()}
					</button>
				{/if}
			{:else if canonical === 'session' && live.fulfillmentStatus !== 'selesai' && live.fulfillmentStatus !== 'dibatalkan'}
				{#if live.fulfillmentStatus === 'sudah_dijadwalkan'}
					<div class="flex gap-2">
						<button
							type="button"
							onclick={markComplete}
							disabled={pending}
							class="flex-1 cursor-pointer rounded-xl bg-brand px-3 py-2.5 text-xs font-bold text-white hover:bg-[#007550] disabled:cursor-not-allowed disabled:opacity-60"
						>
							{m.odm_action_complete()}
						</button>
						<button
							type="button"
							onclick={markBuyerNoShow}
							disabled={pending}
							class="cursor-pointer rounded-xl border border-[#D5E2DC] bg-white px-3 py-2.5 text-xs font-bold text-sage hover:bg-[#F0F6F3] disabled:cursor-not-allowed disabled:opacity-60"
						>
							{m.odm_action_noshow_buyer()}
						</button>
					</div>
				{/if}
			{/if}

			{#if live.fulfillmentStatus !== 'selesai' && live.fulfillmentStatus !== 'dibatalkan' && live.fulfillmentStatus !== 'akses_diberikan'}
				<div class="flex gap-2">
					<button
						type="button"
						onclick={() => {
							contactIntent = 'general';
							contactOpen = true;
						}}
						class="flex-1 cursor-pointer rounded-xl border border-[#CCE6D6] bg-white px-3 py-2.5 text-xs font-bold text-[#0C7B58] hover:bg-[#F2FAF6]"
					>
						{m.orders_cta_notify()}
					</button>
					<button
						type="button"
						onclick={() => (cancelMode = true)}
						class="cursor-pointer rounded-xl border border-[#D5E2DC] bg-white px-3 py-2.5 text-xs font-bold text-[#B91C1C] hover:bg-[#FEF2F2]"
					>
						{m.odm_action_cancel()}
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>

{#if contactOpen}
	<ContactBuyerModal
		order={live}
		product={seller.findProduct(live.productId) ?? undefined}
		intent={contactIntent}
		onClose={() => (contactOpen = false)}
	/>
{/if}
