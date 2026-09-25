<script lang="ts">
	import { KARJA_VERIFIED_BADGE_URL } from '$lib/domain/verification';
	import { m } from '$lib/paraglide/messages.js';
	import CheckCircle from 'lucide-svelte/icons/check-circle';

	type Props = { size?: 'xs' | 'sm' | 'md' | 'lg' };
	let { size = 'sm' }: Props = $props();

	let hasError = $state(false);

	const sizeClass = $derived(
		size === 'xs'
			? 'h-3.5 w-3.5 min-h-[14px] min-w-[14px]'
			: size === 'sm'
				? 'h-[18px] w-[18px] min-h-[18px] min-w-[18px]'
				: size === 'md'
					? 'h-5 w-5 min-h-[20px] min-w-[20px]'
					: 'h-6 w-6 min-h-[24px] min-w-[24px]'
	);
</script>

<span
	class="inline-flex shrink-0 items-center justify-center align-middle select-none"
	title={m.se_badge_tooltip()}
	aria-label="Karja Verified"
>
	{#if !hasError}
		<img
			src={KARJA_VERIFIED_BADGE_URL}
			alt="Karja Verified"
			class="object-contain {sizeClass}"
			onerror={() => (hasError = true)}
			referrerpolicy="no-referrer"
			loading="lazy"
		/>
	{:else}
		<CheckCircle class="{sizeClass} fill-[#0B7BEB] text-white" aria-hidden="true" />
	{/if}
</span>
