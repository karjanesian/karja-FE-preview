<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { admin } from '$lib/stores/admin.svelte';
	import AdminLogin from '$lib/components/admin/AdminLogin.svelte';

	onMount(() => {
		admin.restoreSession();
		if (admin.adminUser && admin.isAllowed) void goto('/admin');
	});
</script>

<svelte:head>
	<title>Admin Ops · Karja</title>
</svelte:head>

<AdminLogin />
