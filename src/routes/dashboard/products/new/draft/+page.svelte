<script lang="ts">
	import { page } from '$app/state';
	import ProductBuilder from '$lib/components/products/ProductBuilder.svelte';
	import { newDraftProduct } from '$lib/domain/productDraft';
	import type { ProductType } from '$lib/types';

	const type = (page.url.searchParams.get('type') ?? 'digital') as ProductType;
	const draft = newDraftProduct(type);
</script>

<ProductBuilder product={draft} isNew />
