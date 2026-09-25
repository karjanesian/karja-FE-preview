<script lang="ts">
	import ProductsView from '$lib/components/products/ProductsView.svelte';
	import { m } from '$lib/paraglide/messages.js';
</script>

<svelte:head>
	<title>{m.nav_products()} · Karja</title>
</svelte:head>

<ProductsView />
