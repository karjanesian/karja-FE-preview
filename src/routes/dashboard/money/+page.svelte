<script lang="ts">
	import WalletView from '$lib/components/wallet/WalletView.svelte';
	import { m } from '$lib/paraglide/messages.js';
</script>

<svelte:head>
	<title>{m.nav_wallet()} · Karja</title>
</svelte:head>

<WalletView />
