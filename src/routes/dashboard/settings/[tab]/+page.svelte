<script lang="ts">
	import SettingsView from '$lib/components/settings/SettingsView.svelte';
	import { m } from '$lib/paraglide/messages.js';
</script>

<svelte:head>
	<title>{m.nav_settings()} · Karja</title>
</svelte:head>

<SettingsView />
