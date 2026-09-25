<script lang="ts">
	import { goto } from '$app/navigation';
	import CreateProductWizard from '$lib/components/products/CreateProductWizard.svelte';
	import { newDraftProduct } from '$lib/domain/productDraft';
	import { seller } from '$lib/stores/seller.svelte';
	import type { Product, ProductType } from '$lib/types';

	function onComplete(draftData: Partial<Product>) {
		const full = {
			...newDraftProduct((draftData.type ?? 'digital') as ProductType),
			...draftData
		} as Product;
		seller.saveProductDraft(full);
		void goto(`/dashboard/products/${full.id}/edit?from=wizard`);
	}
</script>

<CreateProductWizard oncomplete={onComplete} />
