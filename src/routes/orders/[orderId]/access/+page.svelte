<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { seller } from '$lib/stores/seller.svelte';
	import { ApiError, isNetworkError } from '$lib/api';
	import { m } from '$lib/paraglide/messages.js';
	import { getPublicOrder, type PublicOrder } from '$lib/domain/checkoutApi';
	import BuyerAccessPortal from '$lib/components/buyer/BuyerAccessPortal.svelte';
	import BuyerAccessView from '$lib/components/buyer/BuyerAccessView.svelte';

	const accessToken = $derived(page.params.orderId ?? '');
	let viewState = $state<'loading' | 'api' | 'notfound' | 'fallback'>('loading');
	let order = $state<PublicOrder | null>(null);

	onMount(() => {
		if (!seller.isLoaded) seller.load();
		void load();
	});

	async function load() {
		if (!accessToken) {
			viewState = 'notfound';
			return;
		}
		try {
			order = await getPublicOrder(accessToken);
			viewState = 'api';
		} catch (e) {
			if (isNetworkError(e)) {
				viewState = 'fallback';
				return;
			}
			if (!(e instanceof ApiError) || e.status !== 404) {
				console.error('[karja] gagal memuat akses pesanan:', e);
			}
			viewState = 'notfound';
		}
	}
</script>

<svelte:head>
	<title>{m.bu_acc_badge()} · Karja</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if viewState === 'loading'}
	<div class="mx-auto max-w-[1240px] px-4 py-24 sm:px-8">
		<div class="h-40 animate-pulse rounded-2xl bg-mist"></div>
		<p class="sr-only">{m.common_loading()}</p>
	</div>
{:else if viewState === 'fallback'}
	<BuyerAccessPortal orderId={accessToken} />
{:else}
	<BuyerAccessView {order} />
{/if}
