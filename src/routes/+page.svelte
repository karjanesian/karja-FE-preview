<script lang="ts">
	import Landing from '$lib/components/landing/Landing.svelte';
	import { m } from '$lib/paraglide/messages.js';
</script>

<svelte:head>
	<title>Karja — {m.landing_slogan()}</title>
	<meta name="description" content={m.landing_tagline()} />
</svelte:head>

<Landing />
