<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { seller } from '$lib/stores/seller.svelte';
	import { ApiError, isNetworkError } from '$lib/api';
	import { m } from '$lib/paraglide/messages.js';
	import { getPublicSellerProduct, mapPublicSellerProduct } from '$lib/domain/publicApi';
	import type { Product, SellerProfile } from '$lib/types';
	import PublicNavbar from '$lib/components/public/PublicNavbar.svelte';
	import PublicFooter from '$lib/components/public/PublicFooter.svelte';
	import PublicProductLanding from '$lib/components/buyer/PublicProductLanding.svelte';

	let ready = $state(false);
	let apiProduct = $state<Product | null>(null);
	let apiSeller = $state<SellerProfile | null>(null);

	const username = $derived(page.params.username);
	const productSlug = $derived(page.params.productSlug);
	const isOwner = $derived(seller.sellerProfile.username === username && Boolean(username));

	// Fallback lokal/offline (perilaku lama): hanya owner yang punya data lokal.
	const localProduct = $derived(
		isOwner ? seller.products.find((p) => p.slug === productSlug) : undefined
	);
	const product = $derived(apiProduct ?? localProduct);
	const sellerProfile = $derived(apiSeller ?? (isOwner ? seller.sellerProfile : null));

	async function loadPublicProduct(name: string, slug: string) {
		try {
			const mapped = mapPublicSellerProduct(await getPublicSellerProduct(name, slug));
			apiSeller = mapped.seller;
			apiProduct = mapped.product;
		} catch (e) {
			if (e instanceof ApiError && e.status === 404) {
				apiSeller = null;
				apiProduct = null;
				return;
			}
			if (!isNetworkError(e)) console.error('[karja] gagal memuat produk publik:', e);
			// BE tidak terjangkau → biarkan fallback lokal / not-found tampil.
		}
	}

	onMount(() => {
		if (!seller.isLoaded) seller.load();
		ready = true;
		if (username && productSlug) void loadPublicProduct(username, productSlug);
	});
</script>

<svelte:head>
	<title>{product ? `${product.title} · Karja` : 'Produk · Karja'}</title>
	{#if product}
		<meta name="description" content={product.shortDescription ?? ''} />
		<meta property="og:title" content={product.title} />
		<meta property="og:description" content={product.shortDescription ?? ''} />
		<meta property="og:type" content="product" />
	{/if}
	<meta name="robots" content="noindex" />
</svelte:head>

<PublicNavbar activePage="other" />
{#if ready && product}
	<PublicProductLanding {product} seller={sellerProfile ?? undefined} />
{:else if ready}
	<div class="mx-auto max-w-lg px-4 py-24 text-center">
		<h1 class="text-xl font-bold text-ink">{m.pu_store_notfound_title()}</h1>
		<p class="mt-2 text-sm text-sage">{m.pu_store_notfound_desc()}</p>
	</div>
{:else}
	<div class="mx-auto max-w-[1240px] px-4 py-24 sm:px-8">
		<div class="h-64 animate-pulse rounded-2xl bg-mist"></div>
		<p class="sr-only">{m.common_loading()}</p>
	</div>
{/if}
<PublicFooter />
