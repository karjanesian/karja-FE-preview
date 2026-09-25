<script lang="ts">
	import type { Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { admin } from '$lib/stores/admin.svelte';
	import type { AdminSubRoute } from '$lib/domain/adminRoutes';
	import type { PlatformUser } from '$lib/types/admin';
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import AccessDenied from '$lib/components/admin/AccessDenied.svelte';
	import { checkAdminAccess } from '$lib/domain/adminDomain';
	import type { LayoutData } from './$types';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();
	let ready = $state(false);
	let isLoggingOut = $state(false);

	onMount(() => {
		admin.restoreSession();

		// Sesi httpOnly sudah divalidasi server → jadikan sumber kebenaran, timpa sesi lokal.
		if (data.sessionStatus === 'authed' && data.user) {
			admin.login(data.user as PlatformUser);
		}

		ready = true;
		if (data.sessionStatus !== 'offline' && !admin.adminUser) void goto('/admin/login');
	});

	const section = $derived((page.url.pathname.split('/')[2] || 'overview') as AdminSubRoute);
	const access = $derived(admin.adminUser ? checkAdminAccess(admin.adminUser) : null);

	$effect(() => {
		if (ready && admin.adminUser && access && !access.allowed) {
			isLoggingOut = true;
			void admin.logout().then(() => goto('/admin/login'));
		}
	});

	// Sesi berakhir / logout → jangan render skeleton kosong, langsung ke halaman login.
	$effect(() => {
		if (ready && data.sessionStatus !== 'offline' && !admin.adminUser) {
			void goto('/admin/login');
		}
	});
</script>

{#if ready && admin.adminUser && access?.allowed}
	<AdminLayout currentSubroute={section}>
		{@render children()}
	</AdminLayout>
{:else if ready && admin.adminUser}
	<AccessDenied
		reason={access?.reason && access.reason !== 'authorized' ? access.reason : 'unauthenticated'}
		onLogin={() => {
			isLoggingOut = true;
			void admin.logout().then(() => goto('/admin/login'));
		}}
		onBackPublic={() => goto('/')}
		onNavigateAllowed={(sub) => goto(`/admin/${sub}`)}
		loginPending={isLoggingOut}
	/>
{:else}
	<div class="flex min-h-screen items-center justify-center bg-canvas">
		<div class="h-8 w-40 animate-pulse rounded-lg bg-mist"></div>
	</div>
{/if}
