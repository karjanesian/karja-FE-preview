<script lang="ts">
	import { goto } from '$app/navigation';
	import { getPublicProductUrl } from '$lib/domain/url';
	import { getVisualAsset } from '$lib/domain/visualAssets';
	import * as m from '$lib/paraglide/messages.js';
	import { seller } from '$lib/stores/seller.svelte';
	import type { Product } from '$lib/types';
	import PlatformStateVisual from '$lib/components/common/PlatformStateVisual.svelte';
	import Check from 'lucide-svelte/icons/check';
	import Copy from 'lucide-svelte/icons/copy';
	import Share2 from 'lucide-svelte/icons/share-2';
	import X from 'lucide-svelte/icons/x';

	type Props = {
		product: Product;
		onClose: () => void;
	};
	let { product, onClose }: Props = $props();

	let copiedLink = $state(false);

	const username = $derived(seller.sellerProfile?.username || 'toko');
	const fullProductUrl = $derived(getPublicProductUrl(username, product.slug));

	async function copyToClipboard(text: string) {
		await navigator.clipboard.writeText(text);
		copiedLink = true;
		setTimeout(() => (copiedLink = false), 2000);
	}

	function openProductDetail() {
		onClose();
		void goto(`/dashboard/products/${product.id}`);
	}

	function shareProduct() {
		onClose();
		seller.shareProduct(product);
		void copyToClipboard(fullProductUrl);
	}
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-[#092B21]/50 p-4 backdrop-blur-xs"
>
	<div
		class="relative w-full max-w-lg space-y-6 overflow-hidden rounded-2xl border border-[#E5ECE7] bg-white p-6 shadow-lg sm:p-8"
	>
		<button
			type="button"
			onclick={onClose}
			class="absolute top-4 right-4 cursor-pointer rounded-xl p-2 text-[#52776C] transition-colors hover:bg-[#F0F6F3] hover:text-[#0E2E25]"
			aria-label={m.common_close()}
		>
			<X class="h-5 w-5" />
		</button>

		<div class="mx-auto w-full max-w-[320px] pt-1">
			<PlatformStateVisual asset={getVisualAsset('success.productPublished')} aspectRatio="16:9" />
		</div>

		<div class="space-y-1.5 text-center">
			<h2 class="text-xl font-bold tracking-tight text-[#0E2E25] sm:text-2xl">{m.pc_ps_title()}</h2>
			<p class="mx-auto max-w-md text-xs leading-relaxed text-[#52776C] sm:text-sm">
				{m.pc_ps_desc()}
			</p>
		</div>

		<div
			class="flex items-center justify-between gap-2.5 rounded-xl border border-[#E5ECE7] bg-[#F8FBF9] p-3"
		>
			<div class="truncate pl-2 font-mono text-xs font-medium text-[#008A5E] select-all">
				{fullProductUrl}
			</div>
			<button
				type="button"
				onclick={() => void copyToClipboard(fullProductUrl)}
				class="inline-flex flex-shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all {copiedLink
					? 'bg-[#008A5E] text-white'
					: 'border border-[#D5E5DB] bg-white text-[#0E2E25] hover:bg-[#EDF6F1]'}"
			>
				{#if copiedLink}
					<Check class="h-3.5 w-3.5" />
				{:else}
					<Copy class="h-3.5 w-3.5 text-[#52776C]" />
				{/if}
				<span>{copiedLink ? m.pc_ps_copied() : m.pc_ps_copy()}</span>
			</button>
		</div>

		<div class="flex flex-col items-center justify-between gap-3 pt-2 sm:flex-row">
			<button
				type="button"
				onclick={openProductDetail}
				class="w-full cursor-pointer rounded-xl border border-[#E5ECE7] px-4 py-2.5 text-center text-xs font-semibold text-[#0E2E25] transition-colors hover:bg-[#F4F8F6] sm:w-auto"
			>
				{m.pc_ps_manage()}
			</button>

			<button
				type="button"
				onclick={shareProduct}
				class="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#008A5E] px-6 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#007550] sm:w-auto"
			>
				<Share2 class="h-4 w-4" />
				<span>{m.pc_ps_share()}</span>
			</button>
		</div>
	</div>
</div>
