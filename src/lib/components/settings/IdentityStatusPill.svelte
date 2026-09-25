<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { IdentityVerificationStatus } from '$lib/types';
	import ShieldCheck from 'lucide-svelte/icons/shield-check';
	import Clock from 'lucide-svelte/icons/clock';
	import CircleAlert from 'lucide-svelte/icons/circle-alert';

	type Props = {
		status?: IdentityVerificationStatus;
		size?: 'xs' | 'md';
		showLabel?: boolean;
	};
	let { status = 'verified', size = 'xs', showLabel = true }: Props = $props();

	const textClass = $derived(size === 'md' ? 'text-xs' : 'text-[11px]');

	const tooltip = $derived(m.se_status_verified_tooltip());
</script>

{#if status === 'pending'}
	<span
		class="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 font-medium text-amber-800 select-none {textClass}"
	>
		<Clock class="h-3.5 w-3.5 shrink-0 text-amber-600" />
		{#if showLabel}<span>{m.se_status_pending()}</span>{/if}
	</span>
{:else if status === 'needs_update' || status === 'rejected'}
	<span
		class="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 font-medium text-rose-800 select-none {textClass}"
	>
		<CircleAlert class="h-3.5 w-3.5 shrink-0 text-rose-600" />
		{#if showLabel}<span>{m.se_status_needs_update()}</span>{/if}
	</span>
{:else if status === 'unverified'}
	<span
		class="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 font-medium text-gray-600 select-none {textClass}"
	>
		<ShieldCheck class="h-3.5 w-3.5 shrink-0 text-gray-400" />
		{#if showLabel}<span>{m.se_status_unverified()}</span>{/if}
	</span>
{:else}
	<span
		class="inline-flex items-center gap-1.5 rounded-md border border-[#CCE6D6] bg-[#EAF8F0] px-2.5 py-1 font-medium text-[#0C7B58] select-none {textClass}"
		title={tooltip}
		aria-label={m.se_status_verified()}
	>
		<ShieldCheck class="shrink-0 text-[#0C7B58] {size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'}" />
		{#if showLabel}<span>{m.se_status_verified()}</span>{/if}
	</span>
{/if}
