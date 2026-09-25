<script lang="ts">
	import OrdersView from '$lib/components/orders/OrdersView.svelte';
	import { m } from '$lib/paraglide/messages.js';
</script>

<svelte:head>
	<title>{m.orders_title()} · Karja</title>
</svelte:head>

<OrdersView />
