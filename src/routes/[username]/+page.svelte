<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { seller } from '$lib/stores/seller.svelte';
	import { ApiError, isNetworkError } from '$lib/api';
	import { m } from '$lib/paraglide/messages.js';
	import { getPublicSellerProducts, mapPublicSeller } from '$lib/domain/publicApi';
	import { getPublicSellerReviews } from '$lib/domain/reviewsApi';
	import type { Product, ProductType, Review, SellerProfile } from '$lib/types';
	import PublicNavbar from '$lib/components/public/PublicNavbar.svelte';
	import PublicFooter from '$lib/components/public/PublicFooter.svelte';
	import Storefront from '$lib/components/public/Storefront.svelte';
	import { freshSellerProfile } from '$lib/data/mockData';

	const PRODUCT_PAGE_SIZE = 12;
	const REVIEW_PAGE_SIZE = 5;

	let ready = $state(false);
	let apiSeller = $state<SellerProfile | null>(null);
	let apiReviews = $state<Review[]>([]);
	let apiNotFound = $state(false);

	// Produk berhalaman dari BE (keyset); `usingServer=false` → fallback lokal.
	let productItems = $state<Product[]>([]);
	let productTotal = $state(0);
	let productNextCursor = $state<string | null>(null);
	let productType = $state<'all' | ProductType>('all');
	let productsLoading = $state(false);
	let usingServer = $state(false);

	const username = $derived(page.params.username);
	const isOwner = $derived(seller.sellerProfile.username === username && Boolean(username));

	// Fallback lokal/offline (perilaku lama): hanya owner yang punya data lokal.
	const localSeller = $derived(isOwner ? seller.sellerProfile : null);
	const localProducts = $derived(isOwner ? seller.products : []);
	const localReviews = $derived(isOwner ? seller.reviews : []);

	const sellerProfile = $derived(apiSeller ?? localSeller);
	const products = $derived(usingServer ? productItems : localProducts);
	const reviews = $derived(usingServer ? apiReviews : localReviews);
	const notFound = $derived(apiNotFound || !sellerProfile);
	const hasMore = $derived(usingServer && Boolean(productNextCursor));

	function typeParam(): string | undefined {
		return productType === 'all' ? undefined : productType;
	}

	async function loadPublicStore(name: string) {
		try {
			const [productsRes, reviewsRes] = await Promise.all([
				getPublicSellerProducts(name, { limit: PRODUCT_PAGE_SIZE }),
				getPublicSellerReviews(name, { limit: REVIEW_PAGE_SIZE })
			]);
			apiSeller = mapPublicSeller(productsRes.seller);
			productItems = productsRes.items;
			productTotal = productsRes.total;
			productNextCursor = productsRes.nextCursor;
			apiReviews = reviewsRes.items;
			usingServer = true;
			apiNotFound = false;
		} catch (e) {
			if (e instanceof ApiError && e.status === 404) {
				apiSeller = null;
				productItems = [];
				apiReviews = [];
				apiNotFound = true;
				return;
			}
			if (!isNetworkError(e)) console.error('[karja] gagal memuat toko publik:', e);
			// BE tidak terjangkau → biarkan fallback lokal / not-found tampil.
		}
	}

	async function loadMoreProducts() {
		if (!username || !productNextCursor || productsLoading) return;
		productsLoading = true;
		try {
			const res = await getPublicSellerProducts(username, {
				limit: PRODUCT_PAGE_SIZE,
				cursor: productNextCursor,
				type: typeParam()
			});
			productItems = [...productItems, ...res.items];
			productTotal = res.total;
			productNextCursor = res.nextCursor;
		} catch (e) {
			if (!isNetworkError(e)) console.error('[karja] gagal memuat produk berikutnya:', e);
		} finally {
			productsLoading = false;
		}
	}

	async function changeProductType(next: 'all' | ProductType) {
		if (!username || next === productType) return;
		productType = next;
		productsLoading = true;
		try {
			const res = await getPublicSellerProducts(username, {
				limit: PRODUCT_PAGE_SIZE,
				type: typeParam()
			});
			productItems = res.items;
			productTotal = res.total;
			productNextCursor = res.nextCursor;
		} catch (e) {
			if (!isNetworkError(e)) console.error('[karja] gagal memuat filter produk:', e);
		} finally {
			productsLoading = false;
		}
	}

	onMount(() => {
		if (!seller.isLoaded) seller.load();
		ready = true;
		if (username) void loadPublicStore(username);
	});
</script>

<svelte:head>
	<title>{sellerProfile ? `${sellerProfile.name} · Karja` : `@${username} · Karja`}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<PublicNavbar activePage="other" />
{#if ready}
	<Storefront
		seller={sellerProfile ?? { ...structuredClone(freshSellerProfile), username: username ?? '' }}
		{products}
		{reviews}
		{notFound}
		serverMode={usingServer}
		productTotal={usingServer ? productTotal : undefined}
		{hasMore}
		loadingMore={productsLoading}
		typeFilter={productType}
		onTypeFilterChange={changeProductType}
		onLoadMore={loadMoreProducts}
	/>
{:else}
	<div class="mx-auto max-w-[1240px] px-4 py-24 sm:px-8">
		<div class="h-40 animate-pulse rounded-2xl bg-mist"></div>
		<p class="sr-only">{m.common_loading()}</p>
	</div>
{/if}
<PublicFooter />
