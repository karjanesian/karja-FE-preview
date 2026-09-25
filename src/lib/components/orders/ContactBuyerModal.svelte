<script lang="ts">
	import { seller } from '$lib/stores/seller.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import type { Order, Product } from '$lib/types';
	import X from 'lucide-svelte/icons/x';
	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	import MessageSquare from 'lucide-svelte/icons/message-square';
	import Mail from 'lucide-svelte/icons/mail';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Star from 'lucide-svelte/icons/star';

	export type ContactIntent =
		'meeting_link' | 'reschedule_notice' | 'feedback' | 'general' | 'schedule' | 'brief' | 'custom';

	type Props = {
		order: Order;
		product?: Product | undefined;
		intent?: ContactIntent;
		onClose: () => void;
		onContactActionCompleted?: (intent: EffectiveIntent, orderId: string) => void;
	};
	type EffectiveIntent = 'meeting_link' | 'reschedule_notice' | 'feedback' | 'general';

	let { order, product, intent = 'general', onClose, onContactActionCompleted }: Props = $props();

	const effectiveIntent: EffectiveIntent = $derived(
		intent === 'meeting_link'
			? 'meeting_link'
			: intent === 'reschedule_notice'
				? 'reschedule_notice'
				: intent === 'feedback'
					? 'feedback'
					: 'general'
	);

	let copiedDraft = $state(false);
	let customMessage = $state('');

	const buyerAccessUrl = $derived(`https://karja.id/access/${order.accessToken || order.id}`);
	const sellerName = $derived(seller.sellerProfile?.name || 'Rival');
	const productTitle = $derived(
		order.productTitle || product?.title || m.contact_product_fallback()
	);
	const scheduleInfo = $derived(
		order.bookingDateFormatted
			? `${order.bookingDateFormatted} (${order.bookingTimeFormatted || ''})`
			: order.scheduledDate || m.contact_schedule_fallback()
	);
	const meetLine = $derived(
		order.meetingLink
			? m.contact_meet_line_with({ link: order.meetingLink })
			: m.contact_meet_line_none()
	);

	const template = $derived.by(() => {
		if (effectiveIntent === 'meeting_link') {
			return m.contact_tpl_meeting({
				buyer: order.buyerName,
				product: productTitle,
				schedule: scheduleInfo,
				meetLine,
				seller: sellerName
			});
		}
		if (effectiveIntent === 'reschedule_notice') {
			return m.contact_tpl_reschedule({
				buyer: order.buyerName,
				product: productTitle,
				orderNumber: order.orderNumber,
				schedule: scheduleInfo,
				meetLine,
				seller: sellerName
			});
		}
		if (effectiveIntent === 'feedback') {
			return m.contact_tpl_feedback({
				buyer: order.buyerName,
				product: productTitle,
				url: buyerAccessUrl,
				seller: sellerName
			});
		}
		return m.contact_tpl_general({
			buyer: order.buyerName,
			seller: sellerName,
			product: productTitle,
			orderNumber: order.orderNumber
		});
	});

	$effect(() => {
		customMessage = template;
	});

	const modalConfig = $derived(
		effectiveIntent === 'meeting_link'
			? {
					title: m.contact_title_meeting({ buyer: order.buyerName }),
					icon: MessageSquare,
					tip: m.contact_tip_meeting()
				}
			: effectiveIntent === 'reschedule_notice'
				? {
						title: m.contact_title_reschedule(),
						icon: Calendar,
						tip: m.contact_tip_reschedule()
					}
				: effectiveIntent === 'feedback'
					? { title: m.contact_title_feedback(), icon: Star, tip: m.contact_tip_feedback() }
					: {
							title: m.contact_title_general({ buyer: order.buyerName }),
							icon: MessageSquare,
							tip: m.contact_tip_general()
						}
	);

	async function handleCopyMessage() {
		try {
			await navigator.clipboard.writeText(customMessage);
			copiedDraft = true;
			setTimeout(() => (copiedDraft = false), 2000);
		} catch {
			/* noop */
		}
	}

	const rawPhone = $derived(order.buyerPhone ? order.buyerPhone.trim() : '');
	const cleanPhone = $derived(rawPhone.replace(/^0/, '62').replace(/\D/g, ''));
	const hasPhone = $derived(Boolean(cleanPhone.length >= 8));

	function handleOpenWhatsApp() {
		if (!hasPhone) return;
		if (effectiveIntent !== 'general') {
			onContactActionCompleted?.(effectiveIntent, order.id);
		}
		window.open(
			`https://wa.me/${cleanPhone}?text=${encodeURIComponent(customMessage)}`,
			'_blank',
			'noopener,noreferrer'
		);
	}

	const mailto = $derived(
		order.buyerEmail
			? `mailto:${order.buyerEmail}?subject=${encodeURIComponent(m.contact_email_subject({ product: productTitle }))}&body=${encodeURIComponent(customMessage)}`
			: ''
	);
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onClose()} />

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-[#092B21]/50 p-4 backdrop-blur-xs"
>
	<div
		class="relative max-h-[90vh] w-full max-w-lg space-y-5 overflow-y-auto rounded-2xl border border-[#E5ECE7] bg-white p-6 shadow-lg sm:p-7"
	>
		<button
			type="button"
			onclick={onClose}
			class="absolute top-5 right-5 cursor-pointer rounded-xl p-2 text-sage transition-colors hover:bg-[#F0F6F3] hover:text-[#0E2E25]"
			aria-label={m.common_close()}
		>
			<X class="h-5 w-5" />
		</button>

		<div class="space-y-1.5 pr-8">
			<div
				class="inline-flex items-center gap-1.5 rounded-full bg-[#EAF8F0] px-2.5 py-0.5 text-xs font-semibold text-brand"
			>
				<modalConfig.icon class="h-3.5 w-3.5" />
				<span>{m.contact_wa_badge()}</span>
			</div>
			<h3 class="text-xl font-bold text-[#0E2E25]">{modalConfig.title}</h3>
			<p class="text-xs text-sage">
				{order.buyerName} · {productTitle} ({order.orderNumber || order.id})
			</p>
		</div>

		<div
			class="rounded-xl border border-[#D5EBDD] bg-canvas p-3 text-xs leading-relaxed text-[#2F5A4D]"
		>
			{modalConfig.tip}
		</div>

		<div class="space-y-1.5">
			<div class="flex items-center justify-between">
				<label for="contact-draft" class="text-xs font-bold text-[#0E2E25]"
					>{m.contact_draft_label()}</label
				>
				<button
					type="button"
					onclick={handleCopyMessage}
					class="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-[#0C7B58] hover:underline"
				>
					{#if copiedDraft}
						<Check class="h-3.5 w-3.5 text-brand" />
					{:else}
						<Copy class="h-3.5 w-3.5" />
					{/if}
					<span>{copiedDraft ? `${m.contact_copied()} ✓` : m.contact_copy()}</span>
				</button>
			</div>

			<textarea
				id="contact-draft"
				bind:value={customMessage}
				rows="7"
				class="min-h-[140px] w-full resize-y rounded-2xl border border-[#CCE6D6] bg-canvas p-3.5 font-sans text-xs leading-relaxed text-[#0E2E25] focus:border-[#0C7B58] focus:ring-1 focus:ring-[#0C7B58] focus:outline-none"
				placeholder={m.contact_placeholder()}></textarea>
		</div>

		<div class="space-y-2 border-t border-[#F0F8F3] pt-2">
			{#if hasPhone}
				<div class="flex items-center justify-between text-xs text-sage">
					<span>
						{m.contact_phone_label()}
						<strong class="text-[#0E2E25]">{order.buyerPhone}</strong>
					</span>
					<span class="text-[11px] font-semibold text-[#0C7B58]">{m.contact_connected()}</span>
				</div>
			{:else}
				<div
					class="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
				>
					{m.contact_no_phone()}
				</div>
			{/if}

			{#if order.buyerEmail}
				<div class="flex items-center justify-between text-[11px] text-sage">
					<span>{m.contact_alt_email({ email: order.buyerEmail })}</span>
					<a
						href={mailto}
						class="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
					>
						<Mail class="h-3 w-3" />
						<span>{m.contact_open_email()}</span>
					</a>
				</div>
			{/if}
		</div>

		<div class="flex flex-col items-center gap-2.5 pt-2 sm:flex-row">
			{#if hasPhone}
				<button
					type="button"
					onclick={handleOpenWhatsApp}
					class="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#1EBE5D] sm:flex-1 sm:text-sm"
				>
					<MessageSquare class="h-4 w-4 fill-white" />
					<span>{m.contact_open_wa()}</span>
				</button>
			{:else}
				<button
					type="button"
					disabled
					title={m.contact_no_phone_title()}
					class="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-[#D5E2DC] bg-[#F0F5F2] py-3 text-xs font-semibold text-[#8EA79D] sm:flex-1 sm:text-sm"
				>
					<MessageSquare class="h-4 w-4 text-[#8EA79D]" />
					<span>{m.contact_open_wa()}</span>
				</button>
			{/if}

			<button
				type="button"
				onclick={handleCopyMessage}
				class="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#D5E2DC] bg-white px-4 py-3 text-xs font-semibold text-[#0E2E25] shadow-2xs transition-colors hover:bg-[#F0F6F3] sm:w-auto sm:text-sm"
			>
				{#if copiedDraft}
					<Check class="h-4 w-4 text-brand" />
				{:else}
					<Copy class="h-4 w-4 text-sage" />
				{/if}
				<span>{copiedDraft ? m.contact_copied() : m.contact_copy()}</span>
			</button>
		</div>
	</div>
</div>
