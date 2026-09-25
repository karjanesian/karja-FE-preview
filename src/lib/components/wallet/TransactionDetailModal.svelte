<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { formatRupiah } from '$lib/domain/pricing';
	import type { Order, Transaction } from '$lib/types';
	import X from 'lucide-svelte/icons/x';
	import ShieldCheck from 'lucide-svelte/icons/shield-check';

	type Props = {
		transaction: Transaction;
		order?: Order;
		onClose: () => void;
	};

	let { transaction, order, onClose }: Props = $props();
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onClose()} />

<div
	role="presentation"
	class="fixed inset-0 z-50 flex items-center justify-center bg-[#092B21]/50 p-4 backdrop-blur-xs"
>
	<div
		class="relative w-full max-w-md space-y-5 rounded-2xl border border-[#E5ECE7] bg-white p-6 shadow-lg sm:p-7"
	>
		<div class="flex items-center justify-between border-b border-[#F0F4F2] pb-3">
			<h3 class="text-base font-bold text-[#0E2E25]">{m.my_trx_detail_title()}</h3>
			<button
				type="button"
				onclick={onClose}
				aria-label={m.common_close()}
				class="cursor-pointer rounded-xl p-1.5 text-[#52776C] transition-colors hover:bg-[#F0F6F3] hover:text-[#0E2E25]"
			>
				<X class="h-4 w-4" />
			</button>
		</div>

		<div class="space-y-1 py-2 text-center">
			<div class="text-xs font-semibold text-[#52776C]">{m.my_money_col_net()}</div>
			<div class="text-2xl font-bold text-[#008A5E] sm:text-3xl">
				{formatRupiah(transaction.netReceived)}
			</div>
			<div class="text-[11px] text-gray-500">{transaction.date}</div>
		</div>

		<div class="space-y-3 rounded-xl border border-[#E2E8E4] bg-white p-4 text-xs">
			<div class="font-bold text-[#0E2E25]">{m.my_trx_breakdown()}</div>

			<div class="space-y-2 text-[#52776C]">
				<div class="flex items-start justify-between gap-2">
					<span>{m.my_money_col_product()}</span>
					<span class="text-right font-semibold text-[#0E2E25]">{transaction.productTitle}</span>
				</div>
				{#if order}
					<div class="flex items-start justify-between gap-2">
						<span>{m.my_trx_buyer()}</span>
						<span class="text-right font-semibold text-[#0E2E25]">{order.buyerName}</span>
					</div>
				{/if}
				<div class="flex justify-between">
					<span>{m.my_trx_price()}</span>
					<span class="font-semibold text-[#0E2E25]">{formatRupiah(transaction.amount)}</span>
				</div>
				<div class="flex justify-between">
					<span>{m.my_trx_fee_karja()}</span>
					<span class="font-medium text-rose-600">-{formatRupiah(transaction.karjaFee)}</span>
				</div>
				<div class="flex justify-between">
					<span>{m.my_trx_fee_payment()}</span>
					<span class="font-medium text-rose-600">-{formatRupiah(transaction.paymentFee)}</span>
				</div>
			</div>

			<div
				class="flex justify-between border-t border-[#F0F4F2] pt-2.5 text-xs font-bold text-[#008A5E]"
			>
				<span>{m.my_money_col_net()}</span>
				<span>{formatRupiah(transaction.netReceived)}</span>
			</div>
		</div>

		<div
			class="flex items-center gap-2 rounded-xl border border-[#CCE6D6] bg-[#EAF8F0] p-3 text-[11px] leading-relaxed text-[#285444]"
		>
			<ShieldCheck class="h-4 w-4 flex-shrink-0 text-[#008A5E]" />
			<span>{m.my_trx_fee_note()}</span>
		</div>

		<button
			type="button"
			onclick={onClose}
			class="w-full cursor-pointer rounded-xl bg-[#F0F5F2] py-2.5 text-xs font-semibold text-[#0E2E25] transition-colors hover:bg-[#E4ECE7]"
		>
			{m.common_close()}
		</button>
	</div>
</div>
