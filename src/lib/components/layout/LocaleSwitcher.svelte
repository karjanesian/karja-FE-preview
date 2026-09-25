<script lang="ts">
	import { getLocale, locales, setLocale } from '$lib/paraglide/runtime.js';

	type Locale = (typeof locales)[number];

	const labels: Record<string, string> = {
		id: 'Bahasa Indonesia',
		en: 'English'
	};

	type Props = { compact?: boolean };
	let { compact = false }: Props = $props();

	const shortLabels: Record<string, string> = { id: 'ID', en: 'EN' };
	let current: Locale = $state(getLocale());

	function choose(locale: Locale) {
		if (locale === current) return;
		setLocale(locale, { reload: true });
	}
</script>

<div class="flex items-center gap-1 rounded-full bg-mist p-1">
	{#each locales as locale (locale)}
		<button
			type="button"
			class="rounded-full px-3 py-1 text-sm font-medium transition-colors {current === locale
				? 'bg-brand text-white'
				: 'text-sage hover:text-ink'}"
			aria-current={current === locale ? 'true' : undefined}
			onclick={() => choose(locale)}
		>
			{compact ? (shortLabels[locale] ?? locale.toUpperCase()) : (labels[locale] ?? locale)}
		</button>
	{/each}
</div>
