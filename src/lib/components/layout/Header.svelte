<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { seller } from '$lib/stores/seller.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { getPublicStoreUrl } from '$lib/domain/url';
	import Bell from 'lucide-svelte/icons/bell';
	import Menu from 'lucide-svelte/icons/menu';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import LocaleSwitcher from './LocaleSwitcher.svelte';

	type Props = { onOpenMobileSidebar: () => void };
	let { onOpenMobileSidebar }: Props = $props();

	let showNotifMenu = $state(false);
	let showProfileMenu = $state(false);
	let notifRef = $state<HTMLDivElement | undefined>();
	let profileRef = $state<HTMLDivElement | undefined>();

	const unreadCount = $derived(seller.notifications.filter((n) => n?.unread).length);
	const displayName = $derived(seller.sellerProfile?.name || m.header_greeting_fallback());
	const username = $derived(seller.sellerProfile?.username || '');
	const displayAvatar = $derived(
		typeof seller.sellerProfile?.avatarUrl === 'string' &&
			seller.sellerProfile.avatarUrl.trim().length > 0
			? seller.sellerProfile.avatarUrl
			: null
	);
	const initials = $derived(
		displayName && displayName.trim() !== ''
			? displayName
					.split(' ')
					.map((n) => n[0])
					.slice(0, 2)
					.join('')
					.toUpperCase()
			: 'TK'
	);

	const pageTitle = $derived(
		page.url.pathname.startsWith('/dashboard/orders')
			? m.nav_orders()
			: page.url.pathname.startsWith('/dashboard/products')
				? m.nav_products()
				: page.url.pathname.startsWith('/dashboard/store')
					? m.nav_store()
					: page.url.pathname.startsWith('/dashboard/money')
						? m.nav_wallet()
						: page.url.pathname.startsWith('/dashboard/settings')
							? m.nav_settings()
							: m.nav_home()
	);

	$effect(() => {
		function onClickOutside(event: MouseEvent) {
			if (notifRef && !notifRef.contains(event.target as Node)) showNotifMenu = false;
			if (profileRef && !profileRef.contains(event.target as Node)) showProfileMenu = false;
		}
		document.addEventListener('mousedown', onClickOutside);
		return () => document.removeEventListener('mousedown', onClickOutside);
	});

	function openNotification(notif: (typeof seller.notifications)[number]) {
		seller.markNotificationRead(notif.id);
		if (notif.targetTab) {
			const routeMap: Record<string, string> = {
				beranda: '/dashboard',
				pesanan: '/dashboard/orders',
				produk: '/dashboard/products',
				toko: '/dashboard/store',
				uangmu: '/dashboard/money',
				pengaturan: '/dashboard/settings'
			};
			const base = routeMap[notif.targetTab] || '/dashboard';
			const href =
				notif.targetTab === 'pesanan' && notif.targetId ? `${base}/${notif.targetId}` : base;
			void goto(href);
		}
		showNotifMenu = false;
	}
</script>

<header
	class="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E4EBE7] bg-canvas px-4 select-none sm:px-8 lg:px-12"
>
	<div class="flex items-center gap-3">
		<button
			type="button"
			onclick={onOpenMobileSidebar}
			class="cursor-pointer rounded-lg p-2 text-[#0E2E25] hover:bg-[#F2F7F4] md:hidden"
			aria-label={m.nav_open_menu()}
		>
			<Menu class="h-5 w-5" />
		</button>
		<span class="text-sm font-semibold tracking-tight text-[#0E2E25] md:hidden">{pageTitle}</span>
	</div>

	<div class="flex items-center gap-2 sm:gap-3">
		<LocaleSwitcher compact />
		<!-- Notifications -->
		<div class="relative" bind:this={notifRef}>
			<button
				type="button"
				onclick={() => (showNotifMenu = !showNotifMenu)}
				class="relative cursor-pointer rounded-lg p-2 text-sage transition-colors hover:bg-[#F2F7F4] hover:text-[#0E2E25]"
				aria-label={m.header_notifications()}
				title={m.header_notifications()}
			>
				<Bell class="h-5 w-5 stroke-[1.8]" />
				{#if unreadCount > 0}
					<span
						class="absolute top-1.5 right-1.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-[#E11D48] px-0.5 text-[9px] font-bold text-white ring-2 ring-white"
					>
						{unreadCount}
					</span>
				{/if}
			</button>

			{#if showNotifMenu}
				<div
					class="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-[#E4EBE7] bg-white text-sm shadow-lg sm:w-96"
				>
					<div class="flex items-center justify-between border-b border-[#E4EBE7] bg-canvas p-3">
						<div class="flex items-center gap-2">
							<span class="font-semibold text-[#0E2E25]">{m.header_notifications()}</span>
							{#if unreadCount > 0}
								<span class="rounded-full bg-mist px-2 py-0.5 text-xs font-semibold text-brand">
									{m.header_unread_badge({ count: unreadCount })}
								</span>
							{/if}
						</div>
						{#if unreadCount > 0}
							<button
								type="button"
								onclick={() => seller.markAllNotificationsRead()}
								class="cursor-pointer text-xs font-medium text-brand hover:underline"
							>
								{m.header_mark_read()}
							</button>
						{/if}
					</div>

					<div class="max-h-80 divide-y divide-[#F0F4F1] overflow-y-auto">
						{#if seller.notifications.length === 0}
							<div class="p-6 text-center text-xs text-gray-500">
								{m.header_no_notifications()}
							</div>
						{:else}
							{#each seller.notifications as notif (notif.id)}
								<button
									type="button"
									onclick={() => openNotification(notif)}
									class="block w-full cursor-pointer p-3.5 text-left transition-colors hover:bg-[#F9FCFA] {notif.unread
										? 'bg-[#F4FAF6]/50'
										: 'opacity-85'}"
								>
									<span class="flex items-start justify-between gap-2">
										<span class="flex items-center gap-1.5">
											{#if notif.unread}
												<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-brand"></span>
											{/if}
											<span class="text-xs font-semibold text-[#0E2E25] sm:text-[13px]"
												>{notif.title}</span
											>
										</span>
										<span class="shrink-0 text-[11px] text-gray-500">{notif.time}</span>
									</span>
									<span class="mt-1 block pl-3 text-xs leading-relaxed text-sage"
										>{notif.description}</span
									>
								</button>
							{/each}
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- Profile -->
		<div class="relative border-l border-[#E4EBE7] pl-1" bind:this={profileRef}>
			<button
				type="button"
				onclick={() => (showProfileMenu = !showProfileMenu)}
				class="group flex cursor-pointer items-center gap-1.5 rounded-lg p-1 transition-colors hover:bg-[#F2F7F4]"
			>
				<span
					class="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[#E8F2EC] text-xs font-semibold text-[#0E2E25] ring-1 ring-[#D8E2DC]"
					title={displayName}
				>
					{#if displayAvatar}
						<img src={displayAvatar} alt={displayName} class="h-full w-full object-cover" />
					{:else}
						{initials}
					{/if}
				</span>
				<ChevronDown
					class="hidden h-3.5 w-3.5 text-[#698E82] transition-colors group-hover:text-[#0E2E25] sm:block"
				/>
			</button>

			{#if showProfileMenu}
				<div
					class="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-[#E4EBE7] bg-white p-1.5 shadow-lg"
				>
					<div class="mb-1 rounded-lg border border-[#E4EBE7] bg-canvas px-3 py-2">
						<p class="truncate text-xs font-semibold text-[#0E2E25]">{displayName}</p>
						<p class="truncate text-[11px] text-sage">
							{username ? `@${username}` : m.header_no_username()}
						</p>
					</div>
					<div class="space-y-0.5 text-xs text-sage">
						<button
							type="button"
							id="btn-profile-dropdown-lihat-toko"
							onclick={() => {
								showProfileMenu = false;
								if (username) {
									window.open(getPublicStoreUrl(username), '_blank', 'noopener,noreferrer');
								}
							}}
							class="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left font-medium transition-colors hover:bg-[#F2F7F4] hover:text-[#0E2E25]"
						>
							<ExternalLink class="h-3.5 w-3.5 text-brand" />
							<span>{m.header_view_store()}</span>
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</header>
