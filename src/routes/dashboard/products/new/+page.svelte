<script lang="ts">
	import ProductTypeSelect from '$lib/components/products/ProductTypeSelect.svelte';
	import { m } from '$lib/paraglide/messages.js';
</script>

<svelte:head>
	<title>{m.pc_types_title()} · Karja</title>
</svelte:head>

<ProductTypeSelect />
