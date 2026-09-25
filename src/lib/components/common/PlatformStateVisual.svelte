<script lang="ts">
	import type { VisualAsset } from '$lib/domain/visualAssets';

	type Props = {
		asset: VisualAsset;
		className?: string;
		aspectRatio?: '4:3' | '16:10' | '1:1' | '16:9';
		objectPosition?: string;
	};
	let {
		asset,
		className = '',
		aspectRatio = asset.aspectRatio || '4:3',
		objectPosition = 'center'
	}: Props = $props();

	const aspectClass = $derived(
		aspectRatio === '16:9'
			? 'aspect-video'
			: aspectRatio === '16:10'
				? 'aspect-[16/10]'
				: aspectRatio === '1:1'
					? 'aspect-square'
					: 'aspect-[4/3]'
	);
</script>

{#if asset.url && asset.url.trim().length > 0}
	<div
		data-visual-key={asset.id}
		class="relative flex w-full items-center justify-center select-none {aspectClass} {className}"
	>
		<img
			src={asset.url}
			alt={asset.alt}
			class="h-full w-full object-contain object-center p-1 select-none sm:p-1.5"
			style={`object-position: ${objectPosition}`}
			referrerpolicy="no-referrer"
			loading="lazy"
		/>
	</div>
{:else}
	<div
		data-visual-key={asset.id}
		class="relative flex w-full items-center justify-center overflow-hidden rounded-xl border border-[#E5ECE7] bg-[#F4F8F5] select-none {aspectClass} {className}"
		aria-label={asset.alt}
	>
		<div class="absolute inset-0 opacity-40">
			<div class="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#E0EDE5] blur-xl"></div>
			<div class="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-[#EAF2ED] blur-lg"></div>
		</div>
		<div class="relative z-10 flex flex-col items-center justify-center p-4 text-center">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E0EBE4] bg-white shadow-2xs"
			>
				<svg
					class="h-5 w-5 text-brand"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><rect width="18" height="18" x="3" y="3" rx="2"></rect>
					<path d="m9 9 6 6"></path>
					<path d="m15 9-6 6"></path></svg
				>
			</div>
		</div>
	</div>
{/if}
