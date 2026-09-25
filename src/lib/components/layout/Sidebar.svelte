<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages.js';
	import Logo from '$lib/components/common/Logo.svelte';
	import Home from 'lucide-svelte/icons/home';
	import Package from 'lucide-svelte/icons/package';
	import FileText from 'lucide-svelte/icons/file-text';
	import Wallet from 'lucide-svelte/icons/wallet';
	import Store from 'lucide-svelte/icons/store';
	import SlidersHorizontal from 'lucide-svelte/icons/sliders-horizontal';
	import LogOut from 'lucide-svelte/icons/log-out';
	import Spinner from '$lib/components/common/Spinner.svelte';
	import X from 'lucide-svelte/icons/x';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';

	type Props = {
		mobileOpen: boolean;
		onCloseMobile: () => void;
		onLogout: () => void;
		attentionBadgeCount?: number;
		logoutPending?: boolean;
	};
	let {
		mobileOpen,
		onCloseMobile,
		onLogout,
		attentionBadgeCount = 0,
		logoutPending = false
	}: Props = $props();

	const primaryItems = [
		{ href: '/dashboard', label: () => m.nav_home(), icon: Home, badge: false },
		{ href: '/dashboard/orders', label: () => m.nav_orders(), icon: FileText, badge: true },
		{ href: '/dashboard/products', label: () => m.nav_products(), icon: Package, badge: false },
		{ href: '/dashboard/store', label: () => m.nav_store(), icon: Store, badge: false },
		{ href: '/dashboard/money', label: () => m.nav_wallet(), icon: Wallet, badge: false }
	];
	const secondaryItems = [
		{
			href: '/dashboard/settings',
			label: () => m.nav_settings(),
			icon: SlidersHorizontal,
			badge: false
		}
	];

	let internalCollapsed = $state(false);
	$effect(() => {
		try {
			internalCollapsed = localStorage.getItem('karja_sidebar_collapsed') === 'true';
		} catch {
			/* noop */
		}
	});
	let collapsed = $derived(internalCollapsed);

	function toggleCollapsed() {
		const next = !internalCollapsed;
		internalCollapsed = next;
		try {
			localStorage.setItem('karja_sidebar_collapsed', String(next));
		} catch {
			/* noop */
		}
	}

	function isActive(href: string) {
		return (
			page.url.pathname === href || (href !== '/dashboard' && page.url.pathname.startsWith(href))
		);
	}
</script>

<!-- Desktop sticky sidebar -->
<aside
	class="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-[#E4EBE7] bg-white transition-all duration-200 ease-in-out select-none md:flex {collapsed
		? 'w-16'
		: 'w-64'}"
>
	<div
		class="flex h-[68px] items-center border-b border-[#E4EBE7] p-4 {collapsed
			? 'justify-center'
			: 'justify-between px-5'}"
	>
		<a
			href="/dashboard"
			class="flex cursor-pointer items-center rounded-lg transition-opacity hover:opacity-85"
			aria-label="Karja — {m.nav_home()}"
		>
			{#if collapsed}<Logo variant="icon" size="sm" />{:else}<Logo size="md" />{/if}
		</a>
		{#if !collapsed}
			<button
				type="button"
				onclick={toggleCollapsed}
				class="cursor-pointer rounded-lg p-1.5 text-[#698E82] transition-colors hover:bg-[#F2F7F4] hover:text-ink"
				aria-label={m.nav_collapse()}
				title={m.nav_collapse()}
			>
				<ChevronLeft class="h-4 w-4 stroke-[2]" />
			</button>
		{/if}
	</div>

	<div class="flex-1 space-y-1 overflow-y-auto py-4 {collapsed ? 'px-2' : 'px-3'}">
		{#each primaryItems as item (item.href)}
			{#if collapsed}
				<div class="relative flex justify-center py-1">
					<a
						href={item.href}
						aria-label={item.label()}
						title={item.label()}
						class="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-all duration-150 {isActive(
							item.href
						)
							? 'bg-[#F0F7F3] text-[#0E2E25]'
							: 'text-sage hover:bg-[#F2F7F4] hover:text-[#0E2E25]'}"
					>
						<item.icon
							class="h-5 w-5 {isActive(item.href)
								? 'stroke-[2.2] text-brand'
								: 'stroke-[1.8] text-sage'}"
						/>
						{#if item.badge && attentionBadgeCount > 0}
							<span class="absolute top-1 right-1 h-2 w-2 rounded-full bg-brand ring-2 ring-white"
							></span>
						{/if}
					</a>
				</div>
			{:else}
				<a
					href={item.href}
					class="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-all duration-150 {isActive(
						item.href
					)
						? 'bg-[#F0F7F3] font-semibold text-[#0E2E25]'
						: 'font-medium text-sage hover:bg-[#F2F7F4] hover:text-[#0E2E25]'}"
				>
					<span class="flex min-w-0 items-center gap-2.5">
						<item.icon
							class="h-[18px] w-[18px] shrink-0 {isActive(item.href)
								? 'stroke-[2.2] text-brand'
								: 'stroke-[1.8] text-[#698E82]'}"
						/>
						<span class="truncate">{item.label()}</span>
					</span>
					{#if item.badge && attentionBadgeCount > 0}
						<span
							class="flex-shrink-0 rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white"
						>
							{attentionBadgeCount}
						</span>
					{/if}
				</a>
			{/if}
		{/each}

		<div class="py-2.5">
			<div class="h-px bg-[#E4EBE7] {collapsed ? 'mx-auto w-6' : 'mx-2'}"></div>
		</div>

		<div class="space-y-1">
			{#each secondaryItems as item (item.href)}
				{#if collapsed}
					<div class="relative flex justify-center py-1">
						<a
							href={item.href}
							aria-label={item.label()}
							title={item.label()}
							class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-all duration-150 {isActive(
								item.href
							)
								? 'bg-[#F0F7F3] text-[#0E2E25]'
								: 'text-sage hover:bg-[#F2F7F4] hover:text-[#0E2E25]'}"
						>
							<item.icon
								class="h-5 w-5 {isActive(item.href)
									? 'stroke-[2.2] text-brand'
									: 'stroke-[1.8] text-sage'}"
							/>
						</a>
					</div>
				{:else}
					<a
						href={item.href}
						class="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-all duration-150 {isActive(
							item.href
						)
							? 'bg-[#F0F7F3] font-semibold text-[#0E2E25]'
							: 'font-medium text-sage hover:bg-[#F2F7F4] hover:text-[#0E2E25]'}"
					>
						<span class="flex min-w-0 items-center gap-2.5">
							<item.icon
								class="h-[18px] w-[18px] shrink-0 {isActive(item.href)
									? 'stroke-[2.2] text-brand'
									: 'stroke-[1.8] text-[#698E82]'}"
							/>
							<span class="truncate">{item.label()}</span>
						</span>
					</a>
				{/if}
			{/each}
		</div>
	</div>

	{#if collapsed}
		<div class="flex justify-center border-t border-[#E4EBE7] p-2">
			<button
				type="button"
				onclick={toggleCollapsed}
				class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[#698E82] transition-colors hover:bg-[#F2F7F4] hover:text-[#0E2E25]"
				aria-label={m.nav_expand()}
				title={m.nav_expand()}
			>
				<ChevronRight class="h-4 w-4 stroke-[2]" />
			</button>
		</div>
	{/if}

	<div class="border-t border-[#E4EBE7] p-3 {collapsed ? 'flex justify-center' : ''}">
		{#if collapsed}
			<button
				type="button"
				onclick={onLogout}
				disabled={logoutPending}
				class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-sage transition-colors hover:bg-[#F2F7F4] hover:text-[#0E2E25] disabled:cursor-not-allowed disabled:opacity-60"
				aria-label={m.nav_logout()}
				title={m.nav_logout()}
			>
				{#if logoutPending}
					<Spinner class="h-[18px] w-[18px]" label={m.common_loading()} />
				{:else}
					<LogOut class="h-[18px] w-[18px] stroke-[1.8] text-[#698E82]" />
				{/if}
			</button>
		{:else}
			<button
				type="button"
				onclick={onLogout}
				disabled={logoutPending}
				class="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-sage transition-colors hover:bg-[#F2F7F4] hover:text-[#0E2E25] disabled:cursor-not-allowed disabled:opacity-60"
			>
				{#if logoutPending}
					<Spinner class="h-[18px] w-[18px]" label={m.common_loading()} />
				{:else}
					<LogOut class="h-[18px] w-[18px] shrink-0 stroke-[1.8] text-[#698E82]" />
				{/if}
				<span>{m.nav_logout()}</span>
			</button>
		{/if}
	</div>
</aside>

<!-- Mobile drawer -->
{#if mobileOpen}
	<div class="fixed inset-0 z-50 flex md:hidden">
		<div
			class="fixed inset-0 bg-[#092B21]/30 backdrop-blur-xs transition-opacity"
			onclick={onCloseMobile}
			onkeydown={onCloseMobile}
			role="presentation"
		></div>
		<div class="relative z-50 flex w-full max-w-xs flex-1 flex-col bg-white shadow-xl">
			<div class="flex items-center justify-between border-b border-[#E4EBE7] p-4">
				<a href="/dashboard" onclick={onCloseMobile} class="cursor-pointer rounded-lg">
					<Logo size="md" />
				</a>
				<button
					type="button"
					onclick={onCloseMobile}
					class="cursor-pointer rounded-lg p-1.5 text-sage hover:bg-[#F2F7F4]"
					aria-label={m.nav_close_menu()}
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<div class="flex-1 space-y-1 overflow-y-auto px-3 py-4">
				{#each [...primaryItems, ...secondaryItems] as item (item.href)}
					<a
						href={item.href}
						onclick={onCloseMobile}
						class="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-all {isActive(
							item.href
						)
							? 'bg-[#F0F7F3] font-semibold text-[#0E2E25]'
							: 'font-medium text-sage hover:bg-[#F2F7F4] hover:text-[#0E2E25]'}"
					>
						<span class="flex min-w-0 items-center gap-2.5">
							<item.icon
								class="h-[18px] w-[18px] shrink-0 {isActive(item.href)
									? 'stroke-[2.2] text-brand'
									: 'stroke-[1.8] text-[#698E82]'}"
							/>
							<span class="truncate">{item.label()}</span>
						</span>
						{#if item.badge && attentionBadgeCount > 0}
							<span
								class="flex-shrink-0 rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white"
							>
								{attentionBadgeCount}
							</span>
						{/if}
					</a>
					{#if item.href === '/dashboard/money'}
						<div class="py-2.5"><div class="mx-2 h-px bg-[#E4EBE7]"></div></div>
					{/if}
				{/each}
			</div>

			<div class="border-t border-[#E4EBE7] p-3">
				<button
					type="button"
					disabled={logoutPending}
					onclick={() => {
						onCloseMobile();
						onLogout();
					}}
					class="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-sage transition-colors hover:bg-[#F2F7F4] disabled:cursor-not-allowed disabled:opacity-60"
				>
					{#if logoutPending}
						<Spinner class="h-[18px] w-[18px]" label={m.common_loading()} />
					{:else}
						<LogOut class="h-[18px] w-[18px] stroke-[1.8] text-[#698E82]" />
					{/if}
					<span>{m.nav_logout()}</span>
				</button>
			</div>
		</div>
	</div>
{/if}
