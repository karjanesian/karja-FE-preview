<script lang="ts">
	import type { Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import { onDestroy, onMount } from 'svelte';
	import { seller } from '$lib/stores/seller.svelte';
	import { api, isNetworkError } from '$lib/api';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import { cleanOldStorageKeys } from '$lib/domain/storage';
	import type { LayoutData } from './$types';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	let mobileSidebarOpen = $state(false);
	let hydrated = $state(false);
	let isLoggingOut = $state(false);
	let notificationsPollId: ReturnType<typeof setInterval> | undefined;

	onMount(() => {
		cleanOldStorageKeys();
		seller.load();

		// Sinkronkan store client dengan sesi httpOnly yang sudah divalidasi server.
		if (data.sessionStatus === 'authed' && data.user) {
			seller.login({ email: data.user.email, name: data.user.name });
		}

		// Tarik produk dari BE tanpa memblokir render; offline → pakai data lokal.
		void seller.syncProducts();
		void seller.syncReviews();
		void seller.syncOrders();
		void seller.syncNotifications();
		void seller.syncPayoutSetup();
		void seller.syncPayouts();

		// Polling notifikasi tiap 30 detik; lewati saat tab tidak aktif.
		notificationsPollId = setInterval(() => {
			if (document.visibilityState === 'visible') void seller.syncNotifications();
		}, 30_000);

		hydrated = true;
		if (data.sessionStatus !== 'offline' && !seller.isAuthenticated) void goto('/login');
	});

	onDestroy(() => {
		if (notificationsPollId !== undefined) {
			clearInterval(notificationsPollId);
			notificationsPollId = undefined;
		}
	});

	$effect(() => {
		if (hydrated && seller.isLoaded) seller.save();
	});

	$effect(() => {
		if (hydrated && seller.isLoaded) seller.syncKarjaVerified();
	});

	$effect(() => {
		if (hydrated && data.sessionStatus !== 'offline' && !seller.isAuthenticated) {
			void goto('/login');
		}
	});

	async function logout() {
		if (isLoggingOut) return;
		isLoggingOut = true;
		if (data.sessionStatus !== 'offline') {
			try {
				await api('/auth/seller/logout', { method: 'POST', body: {} });
			} catch (e) {
				if (!isNetworkError(e)) console.error('[karja] logout gagal:', e);
			}
		}
		seller.logout();
		void goto('/login');
	}
</script>

<svelte:head>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="flex min-h-screen flex-col bg-canvas text-[#0E2E25] antialiased">
	<div class="flex flex-1">
		<Sidebar
			mobileOpen={mobileSidebarOpen}
			onCloseMobile={() => (mobileSidebarOpen = false)}
			onLogout={logout}
			attentionBadgeCount={seller.actionRequiredOrdersCount}
			logoutPending={isLoggingOut}
		/>

		<div class="flex min-w-0 flex-1 flex-col">
			<Header onOpenMobileSidebar={() => (mobileSidebarOpen = true)} />
			<main class="flex-1">
				{#if hydrated && seller.isAuthenticated}
					{@render children()}
				{:else}
					<div class="mx-auto w-full max-w-[1240px] px-4 py-16 sm:px-8">
						<div class="h-8 w-40 animate-pulse rounded-lg bg-mist"></div>
						<div class="mt-6 h-40 animate-pulse rounded-2xl bg-mist"></div>
					</div>
				{/if}
			</main>
		</div>
	</div>
</div>
