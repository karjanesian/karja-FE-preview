<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ProductDetailView from '$lib/components/products/ProductDetailView.svelte';
	import Spinner from '$lib/components/common/Spinner.svelte';
	import { seller } from '$lib/stores/seller.svelte';
	import { getSellerProduct } from '$lib/domain/productsApi';
	import { ApiError } from '$lib/api';
	import { m } from '$lib/paraglide/messages.js';
	import type { Product } from '$lib/types';

	let fetched = $state<Product | null>(null);
	let loading = $state(false);

	const localProduct = $derived(seller.findProduct(page.params.id));
	const product = $derived(localProduct ?? fetched);

	$effect(() => {
		const id = page.params.id;
		if (!id || !seller.isLoaded || localProduct || fetched) return;

		let cancelled = false;
		loading = true;
		(async () => {
			try {
				const remote = await getSellerProduct(id);
				if (!cancelled) fetched = remote;
			} catch (e) {
				if (cancelled) return;
				if (!(e instanceof ApiError && e.status === 404)) {
					console.error('[karja] muat produk gagal:', e);
				}
				void goto('/dashboard/products');
			} finally {
				if (!cancelled) loading = false;
			}
		})();

		return () => {
			cancelled = true;
		};
	});
</script>

<svelte:head>
	<title>{product?.title ?? m.nav_products()} · Karja</title>
</svelte:head>

{#if product}
	<ProductDetailView {product} />
{:else if loading}
	<div class="flex items-center justify-center gap-2 py-16 text-sm text-[#52776C]">
		<Spinner label={m.common_loading()} />
		<span>{m.common_loading()}</span>
	</div>
{/if}
