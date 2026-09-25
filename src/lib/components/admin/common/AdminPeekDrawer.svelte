<script lang="ts">
	import type { Snippet } from 'svelte';
	import X from 'lucide-svelte/icons/x';
	import { m } from '$lib/paraglide/messages.js';

	type Props = {
		open: boolean;
		title: Snippet;
		subtitle?: Snippet;
		badge?: Snippet;
		onClose: () => void;
		children: Snippet;
		footer?: Snippet;
		widthClass?: string;
	};

	let {
		open,
		title,
		subtitle,
		badge,
		onClose,
		children,
		footer,
		widthClass = 'sm:max-w-[620px]'
	}: Props = $props();

	$effect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	});
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape' && open) onClose();
	}}
/>

{#if open}
	<div class="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
		<div
			class="animate-fadeIn fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] transition-opacity duration-300 ease-in-out"
			onclick={onClose}
			onkeydown={(e) => e.key === 'Escape' && onClose()}
			role="presentation"
			aria-hidden="true"
		></div>

		<div class="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
			<div
				class="w-screen {widthClass} flex flex-col justify-between border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-out"
			>
				<div
					class="flex shrink-0 items-start justify-between border-b border-gray-100 bg-gray-50/70 px-6 py-4"
				>
					<div class="min-w-0 pr-4">
						<div class="flex flex-wrap items-center gap-2">
							<h3 class="truncate text-base font-bold text-gray-900">
								{@render title()}
							</h3>
							{#if badge}{@render badge()}{/if}
						</div>
						{#if subtitle}
							<div class="mt-0.5 truncate text-xs text-gray-500">
								{@render subtitle()}
							</div>
						{/if}
					</div>
					<button
						type="button"
						onclick={onClose}
						class="shrink-0 cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200/60 hover:text-gray-700"
						aria-label={m.ad_drawer_close_aria()}
					>
						<X class="h-5 w-5" />
					</button>
				</div>

				<div class="flex-1 space-y-6 overflow-y-auto p-6">
					{@render children()}
				</div>

				{#if footer}
					<div
						class="flex shrink-0 items-center justify-between border-t border-gray-100 bg-gray-50/80 px-6 py-3.5"
					>
						{@render footer()}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
