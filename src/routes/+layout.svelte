<script lang="ts">
	import '../app.css';
	import { goto } from '$app/navigation';
	import { m } from '$lib/paraglide/messages.js';
	import { setSessionExpiredHandler } from '$lib/api';
	import { seller } from '$lib/stores/seller.svelte';
	import { apiLoading } from '$lib/stores/apiLoading.svelte';

	let { children } = $props();

	// Refresh token gagal di mana pun → bersihkan sesi lokal dan arahkan ke login.
	$effect(() => {
		setSessionExpiredHandler((domain) => {
			if (domain === 'seller') {
				seller.logout();
				void goto('/login?reason=expired');
				return;
			}
			void import('$lib/stores/admin.svelte').then(async ({ admin }) => {
				await admin.logout();
				void goto('/admin/login?reason=expired');
			});
		});
		return () => setSessionExpiredHandler(null);
	});
</script>

<svelte:head>
	<link rel="icon" href="/logo.svg" />
	<title>Karja — {m.landing_slogan()}</title>
</svelte:head>

{#if apiLoading.active}
	<div
		class="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-[#0C7B58]/10"
		role="status"
		aria-label={m.common_loading()}
	>
		<div
			class="h-full w-1/3 bg-[#0C7B58]"
			style="animation: karja-loading-bar 1.1s ease-in-out infinite;"
		></div>
	</div>
{/if}

{@render children()}
