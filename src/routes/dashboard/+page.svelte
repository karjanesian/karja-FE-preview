<script lang="ts">
	import HomeView from '$lib/components/home/HomeView.svelte';
	import { m } from '$lib/paraglide/messages.js';
</script>

<svelte:head>
	<title>{m.nav_home()} · Karja</title>
</svelte:head>

<HomeView />
