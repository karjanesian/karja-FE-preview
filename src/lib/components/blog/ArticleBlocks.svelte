<script lang="ts">
	import { goto } from '$app/navigation';
	import * as m from '$lib/paraglide/messages.js';
	import type { BlogContentBlock } from '$lib/types/blog';

	let { blocks }: { blocks: BlogContentBlock[] } = $props();

	function startSelling() {
		void goto('/dashboard/products/new');
	}
</script>

{#each blocks as block, idx (idx)}
	{#if block.type === 'paragraph'}
		<p class="leading-[1.78] text-[#1F3D33]">{block.text}</p>
	{:else if block.type === 'h2'}
		<h2
			class="pt-6 text-2xl leading-[1.28] font-bold tracking-tight text-[#0A261D] sm:pt-8 sm:text-[28px]"
		>
			{block.text}
		</h2>
	{:else if block.type === 'h3'}
		<h3 class="pt-4 text-xl leading-snug font-bold tracking-tight text-[#0A261D] sm:text-[22px]">
			{block.text}
		</h3>
	{:else if block.type === 'blockquote'}
		<blockquote
			class="my-8 rounded-r-2xl border-l-[3.5px] border-[#008A5E] bg-[#F4F9F6] py-4 pr-5 pl-5 sm:my-10 sm:pl-6"
		>
			<p class="text-lg leading-relaxed font-medium text-[#10382D] italic sm:text-[20px]">
				“{block.quote}”
			</p>
			{#if block.author}
				<cite
					class="mt-2.5 block text-xs font-bold tracking-wider text-[#008A5E] uppercase not-italic sm:text-sm"
				>
					— {block.author}
				</cite>
			{/if}
		</blockquote>
	{:else if block.type === 'bullet_list' && block.items}
		<ul class="my-6 list-disc space-y-3 pl-6 marker:text-[#008A5E]">
			{#each block.items as item, itemIdx (itemIdx)}
				<li class="pl-1 leading-relaxed text-[#1F3D33]">{item}</li>
			{/each}
		</ul>
	{:else if block.type === 'numbered_list' && block.items}
		<ol class="my-6 list-decimal space-y-3 pl-6 marker:font-semibold marker:text-[#008A5E]">
			{#each block.items as item, itemIdx (itemIdx)}
				<li class="pl-1 leading-relaxed text-[#1F3D33]">{item}</li>
			{/each}
		</ol>
	{:else if block.type === 'image' && block.imageUrl}
		<figure class="my-8 space-y-2.5 sm:my-10">
			<div class="overflow-hidden rounded-2xl border border-[#E5EDE8] bg-[#EDF4F1]">
				<img
					src={block.imageUrl}
					alt={block.imageAlt || ''}
					class="h-auto max-h-[500px] w-full object-cover"
					referrerpolicy="no-referrer"
					loading="lazy"
				/>
			</div>
			{#if block.imageCaption}
				<figcaption class="text-center text-xs text-[#73857D] italic sm:text-sm">
					{block.imageCaption}
				</figcaption>
			{/if}
		</figure>
	{:else if block.type === 'callout'}
		<div
			class="my-10 space-y-3.5 rounded-2xl border border-[#CFE4D9] bg-[#E8F5F0] p-6 sm:my-12 sm:p-8"
		>
			<span class="text-xs font-bold tracking-wider text-[#008A5E] uppercase">
				{m.bl_callout_eyebrow()}
			</span>
			<h4 class="text-xl font-bold tracking-tight text-[#0A261D] sm:text-2xl">
				{block.calloutTitle}
			</h4>
			<p class="text-sm leading-relaxed text-[#38544A] sm:text-base">
				{block.calloutText}
			</p>
			<div class="pt-2">
				<button
					type="button"
					onclick={startSelling}
					class="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#008A5E] px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#007550] active:scale-98"
				>
					<span>{block.calloutCtaLabel || m.bl_callout_default_cta()}</span>
				</button>
			</div>
		</div>
	{/if}
{/each}
