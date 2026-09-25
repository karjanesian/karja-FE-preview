<script lang="ts">
	import { goto } from '$app/navigation';
	import { tabRoute } from '$lib/domain/nav';
	import { getOnboardingProgress } from '$lib/domain/onboarding';
	import { getVisualAsset } from '$lib/domain/visualAssets';
	import { seller } from '$lib/stores/seller.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import PlatformStateVisual from '$lib/components/common/PlatformStateVisual.svelte';
	import Check from 'lucide-svelte/icons/check';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';

	const onboarding = $derived(
		getOnboardingProgress(seller.sellerProfile, seller.products, seller.journeySignals)
	);
	const isStoreReady = $derived(onboarding.step1Complete);
	const hasPublishedProduct = $derived(onboarding.step2Complete);
	const hasSharedProduct = $derived(onboarding.step3Complete);
	const currentStep = $derived(onboarding.currentStep);

	function navigateTab(tab: Parameters<typeof tabRoute>[0], targetId?: string) {
		void goto(tabRoute(tab, targetId));
	}

	function startCreateProduct() {
		void goto('/dashboard/products/new');
	}

	const activeProducts = $derived(seller.products.filter((p) => p?.status === 'active'));

	function handleShareClick() {
		if (activeProducts.length > 0) {
			void goto(tabRoute('produk', activeProducts[0].id));
		} else {
			navigateTab('produk');
		}
	}

	const stepAsset = $derived(
		currentStep === 1
			? getVisualAsset('onboarding.setupStore')
			: currentStep === 2
				? getVisualAsset('onboarding.createProduct')
				: getVisualAsset('onboarding.shareProduct')
	);
</script>

{#if !onboarding.onboardingComplete}
	<div
		class="space-y-6 rounded-2xl border border-[#E5ECE7] bg-white p-6 shadow-2xs sm:space-y-7 sm:p-8"
	>
		<!-- Header row -->
		<div class="flex items-center justify-between">
			<span class="text-[11px] font-bold tracking-wider text-brand uppercase">
				{m.home_start_here_eyebrow()}
			</span>
			<span class="text-xs font-medium text-[#7A988D]"
				>{m.home_step_counter({ step: currentStep })}</span
			>
		</div>

		<!-- Hero -->
		<div class="flex flex-col items-center justify-between gap-6 sm:flex-row sm:gap-8">
			<div class="w-full max-w-xl flex-1 space-y-4">
				{#if currentStep === 2}
					<div
						class="inline-flex items-center gap-1.5 rounded-md bg-mist px-2.5 py-1 text-[11px] font-semibold text-brand"
					>
						<Check class="h-3 w-3 stroke-[3]" />
						<span>{m.home_done_store()}</span>
					</div>
				{/if}
				{#if currentStep === 3}
					<div class="flex flex-wrap items-center gap-2">
						<div
							class="inline-flex items-center gap-1.5 rounded-md bg-mist px-2.5 py-1 text-[11px] font-semibold text-brand"
						>
							<Check class="h-3 w-3 stroke-[3]" />
							<span>{m.home_done_store()}</span>
						</div>
						<div
							class="inline-flex items-center gap-1.5 rounded-md bg-mist px-2.5 py-1 text-[11px] font-semibold text-brand"
						>
							<Check class="h-3 w-3 stroke-[3]" />
							<span>{m.home_done_product()}</span>
						</div>
					</div>
				{/if}

				<div class="space-y-2">
					<h3 class="text-2xl leading-tight font-bold tracking-tight text-[#0E2E25] sm:text-[28px]">
						{currentStep === 1
							? m.home_step1_title()
							: currentStep === 2
								? m.home_step2_title()
								: m.home_step3_title()}
					</h3>
					<p class="text-sm leading-relaxed text-sage sm:text-base">
						{currentStep === 1
							? m.home_step1_desc()
							: currentStep === 2
								? m.home_step2_desc()
								: m.home_step3_desc()}
					</p>
				</div>

				<div class="pt-1">
					{#if currentStep === 1}
						<button
							type="button"
							onclick={() => navigateTab('toko')}
							class="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#007550]"
						>
							<span>{m.home_cta_setup_store()}</span>
							<ArrowRight class="h-4 w-4" />
						</button>
					{:else if currentStep === 2}
						<button
							type="button"
							onclick={startCreateProduct}
							class="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#007550]"
						>
							<span>{m.home_cta_create_product()}</span>
							<ArrowRight class="h-4 w-4" />
						</button>
					{:else}
						<button
							type="button"
							onclick={handleShareClick}
							class="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#007550]"
						>
							<span>{m.home_cta_share_product()}</span>
							<ArrowRight class="h-4 w-4" />
						</button>
					{/if}
				</div>
			</div>

			<div
				class="mx-auto w-full max-w-[220px] shrink-0 sm:w-[220px] sm:max-w-none md:w-[250px] lg:w-[280px]"
			>
				<PlatformStateVisual asset={stepAsset} aspectRatio="16:10" />
			</div>
		</div>

		<!-- Progress row -->
		<div
			class="flex items-center justify-between gap-2 border-t border-[#EEF3F0] pt-4 text-xs sm:pt-5"
		>
			<div class="flex min-w-0 items-center gap-1.5 sm:gap-2">
				<button
					type="button"
					onclick={() => navigateTab('toko')}
					class="flex cursor-pointer items-center gap-1.5 transition-colors {isStoreReady
						? 'font-medium text-brand'
						: currentStep === 1
							? 'font-semibold text-[#0E2E25]'
							: 'text-[#8DA69B]'}"
				>
					{#if isStoreReady}
						<span
							class="flex h-4 w-4 items-center justify-center rounded-full bg-[#EAF8F0] text-[10px] text-brand"
						>
							<Check class="h-2.5 w-2.5 stroke-[3]" />
						</span>
					{:else if currentStep === 1}
						<span class="h-2 w-2 rounded-full bg-brand"></span>
					{:else}
						<span class="h-2 w-2 rounded-full border border-[#BED6C8] bg-white"></span>
					{/if}
					<span class="truncate">{m.home_cta_setup_store()}</span>
				</button>

				<span class="h-[1px] w-4 shrink-0 bg-[#E5ECE7] sm:w-8"></span>

				<button
					type="button"
					onclick={() => isStoreReady && startCreateProduct()}
					class="flex items-center gap-1.5 transition-colors {isStoreReady
						? 'cursor-pointer'
						: 'cursor-default'} {hasPublishedProduct
						? 'font-medium text-brand'
						: currentStep === 2
							? 'font-semibold text-[#0E2E25]'
							: 'text-[#8DA69B]'}"
				>
					{#if hasPublishedProduct}
						<span
							class="flex h-4 w-4 items-center justify-center rounded-full bg-[#EAF8F0] text-[10px] text-brand"
						>
							<Check class="h-2.5 w-2.5 stroke-[3]" />
						</span>
					{:else if currentStep === 2}
						<span class="h-2 w-2 rounded-full bg-brand"></span>
					{:else}
						<span class="h-2 w-2 rounded-full border border-[#BED6C8] bg-white"></span>
					{/if}
					<span class="truncate">{m.home_cta_create_product()}</span>
				</button>

				<span class="h-[1px] w-4 shrink-0 bg-[#E5ECE7] sm:w-8"></span>

				<button
					type="button"
					onclick={() => hasPublishedProduct && handleShareClick()}
					class="flex items-center gap-1.5 transition-colors {hasPublishedProduct
						? 'cursor-pointer'
						: 'cursor-default'} {hasSharedProduct
						? 'font-medium text-brand'
						: currentStep === 3
							? 'font-semibold text-[#0E2E25]'
							: 'text-[#8DA69B]'}"
				>
					{#if hasSharedProduct}
						<span
							class="flex h-4 w-4 items-center justify-center rounded-full bg-[#EAF8F0] text-[10px] text-brand"
						>
							<Check class="h-2.5 w-2.5 stroke-[3]" />
						</span>
					{:else if currentStep === 3}
						<span class="h-2 w-2 rounded-full bg-brand"></span>
					{:else}
						<span class="h-2 w-2 rounded-full border border-[#BED6C8] bg-white"></span>
					{/if}
					<span class="truncate">{m.home_progress_share()}</span>
				</button>
			</div>
		</div>
	</div>
{/if}
