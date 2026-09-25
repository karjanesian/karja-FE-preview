<script lang="ts">
	import { goto } from '$app/navigation';
	import { admin } from '$lib/stores/admin.svelte';

	const dest = admin.adminUser ? admin.defaultSubrouteFor(admin.adminUser) : 'overview';
	$effect(() => void goto(`/admin/${dest}`, { replaceState: true }));
</script>
