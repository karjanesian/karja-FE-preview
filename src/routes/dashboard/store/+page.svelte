<script lang="ts">
	import StoreEditor from '$lib/components/store/StoreEditor.svelte';
	import { m } from '$lib/paraglide/messages.js';
</script>

<svelte:head>
	<title>{m.nav_store()} · Karja</title>
</svelte:head>

<StoreEditor />
