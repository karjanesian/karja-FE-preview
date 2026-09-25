<script lang="ts">
	import type { Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import { m } from '$lib/paraglide/messages.js';
	import { admin } from '$lib/stores/admin.svelte';
	import { canAccessAdminRoute, hasPermission, getRoleDisplayName } from '$lib/domain/adminDomain';
	import type { AdminSubRoute } from '$lib/domain/adminRoutes';
	import Logo from '$lib/components/common/Logo.svelte';
	import LayoutDashboard from 'lucide-svelte/icons/layout-dashboard';
	import Users from 'lucide-svelte/icons/users';
	import UserCheck from 'lucide-svelte/icons/user-check';
	import User from 'lucide-svelte/icons/user';
	import Package from 'lucide-svelte/icons/package';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import ArrowUpRight from 'lucide-svelte/icons/arrow-up-right';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import BookOpen from 'lucide-svelte/icons/book-open';
	import SlidersHorizontal from 'lucide-svelte/icons/sliders-horizontal';
	import LogOut from 'lucide-svelte/icons/log-out';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import Menu from 'lucide-svelte/icons/menu';
	import X from 'lucide-svelte/icons/x';
	import Shield from 'lucide-svelte/icons/shield';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import ShoppingBag from 'lucide-svelte/icons/shopping-bag';
	import HardDrive from 'lucide-svelte/icons/hard-drive';
	import Spinner from '$lib/components/common/Spinner.svelte';

	type Props = {
		currentSubroute: AdminSubRoute;
		children: Snippet;
	};

	let { currentSubroute, children }: Props = $props();

	let mobileMenuOpen = $state(false);
	let showProfileDropdown = $state(false);
	let isLoggingOut = $state(false);
	let profileDropdownEl = $state<HTMLDivElement | undefined>();

	$effect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				profileDropdownEl &&
				!profileDropdownEl.contains(event.target as Node) &&
				showProfileDropdown
			) {
				showProfileDropdown = false;
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	});

	const pendingCounts = $derived(admin.pendingCounts);
	const currentUser = $derived(admin.adminUser);

	const navSections = $derived(
		[
			{
				title: () => m.ad_nav_operasi(),
				items: [
					{
						id: 'sellers' as AdminSubRoute,
						label: () => m.ad_nav_seller(),
						icon: Users,
						badge: 0
					},
					{
						id: 'buyers' as AdminSubRoute,
						label: () => m.ad_nav_buyer(),
						icon: User,
						badge: 0
					},
					{
						id: 'products' as AdminSubRoute,
						label: () => m.ad_nav_product(),
						icon: Package,
						badge: pendingCounts.products
					},
					{
						id: 'orders' as AdminSubRoute,
						label: () => m.ad_nav_order(),
						icon: ShoppingBag,
						badge: 0
					}
				]
			},
			{
				title: () => m.ad_nav_keuangan(),
				items: [
					{
						id: 'transactions' as AdminSubRoute,
						label: () => m.ad_nav_transaction(),
						icon: CreditCard,
						badge: 0
					},
					{
						id: 'payouts' as AdminSubRoute,
						label: () => m.ad_nav_payout(),
						icon: ArrowUpRight,
						badge: pendingCounts.payouts
					},
					{
						id: 'finance' as AdminSubRoute,
						label: () => m.ad_nav_finance(),
						icon: DollarSign,
						badge: 0
					}
				]
			},
			{
				title: () => m.ad_nav_trust(),
				items: [
					{
						id: 'verifications' as AdminSubRoute,
						label: () => m.ad_nav_verification(),
						icon: UserCheck,
						badge: pendingCounts.verifications
					},
					{
						id: 'cases' as AdminSubRoute,
						label: () => m.ad_nav_case(),
						icon: AlertTriangle,
						badge: pendingCounts.cases
					}
				]
			},
			{
				title: () => m.ad_nav_konten(),
				items: [
					{
						id: 'blog' as AdminSubRoute,
						label: () => m.ad_nav_blog(),
						icon: BookOpen,
						badge: 0
					}
				]
			},
			{
				title: () => m.ad_nav_sistem(),
				items: [
					{
						id: 'storage' as AdminSubRoute,
						label: () => m.ad_nav_storage(),
						icon: HardDrive,
						badge: pendingCounts.storage
					},
					{
						id: 'settings' as AdminSubRoute,
						label: () => m.ad_nav_settings(),
						icon: SlidersHorizontal,
						badge: 0
					}
				]
			}
		]
			.map((section) => ({
				...section,
				items: section.items.filter((item) => canAccessAdminRoute(currentUser, item.id))
			}))
			.filter((section) => section.items.length > 0)
	);

	const canViewOverview = $derived(hasPermission(currentUser, 'overview.read'));

	const initials = $derived(
		currentUser?.name
			? currentUser.name
					.split(' ')
					.map((n) => n[0])
					.slice(0, 2)
					.join('')
					.toUpperCase()
			: 'AD'
	);

	const roleLabel = $derived(
		currentUser?.role ? getRoleDisplayName(currentUser.role) : m.ad_badge_admin()
	);

	function getSubrouteTitle(sub: AdminSubRoute): string {
		switch (sub) {
			case 'overview':
				return m.ad_title_overview();
			case 'sellers':
				return m.ad_nav_seller();
			case 'buyers':
				return m.ad_nav_buyer();
			case 'verifications':
				return m.ad_title_verifications();
			case 'products':
				return m.ad_nav_product();
			case 'orders':
				return m.ad_nav_order();
			case 'transactions':
				return m.ad_nav_transaction();
			case 'payouts':
				return m.ad_nav_payout();
			case 'cases':
				return m.ad_nav_case();
			case 'finance':
				return m.ad_nav_finance();
			case 'blog':
				return m.ad_nav_blog();
			case 'storage':
				return m.ad_title_storage();
			case 'settings':
				return m.ad_nav_settings();
			default:
				return m.ad_title_default();
		}
	}

	function navigateSubroute(sub: AdminSubRoute) {
		mobileMenuOpen = false;
		goto(`/admin/${sub}`);
	}

	function handleBrandClick() {
		navigateSubroute(canViewOverview ? 'overview' : (navSections[0]?.items[0]?.id ?? 'overview'));
	}

	async function handleLogout() {
		if (isLoggingOut) return;
		showProfileDropdown = false;
		isLoggingOut = true;
		await admin.logout();
		void goto('/admin/login');
	}

	function handlePublicHome() {
		showProfileDropdown = false;
		goto('/');
	}

	function handleSellerDashboard() {
		showProfileDropdown = false;
		goto('/dashboard');
	}
</script>

<div
	class="flex min-h-screen flex-col bg-[#F8FAF9] font-sans text-[#0E2E25] selection:bg-[#EBF5F0] selection:text-[#0C7B58]"
>
	<header class="sticky top-0 z-40 h-16 border-b border-[#E4EBE7] bg-white">
		<div class="mx-auto flex h-full max-w-[1600px] items-center justify-between px-4 sm:px-6">
			<div class="flex items-center gap-3">
				<button
					type="button"
					onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
					class="cursor-pointer rounded-lg p-1.5 text-[#52776C] transition-colors hover:bg-slate-100 hover:text-[#0E2E25] lg:hidden"
					aria-label={mobileMenuOpen ? m.ad_aria_close_menu() : m.ad_aria_open_menu()}
					aria-expanded={mobileMenuOpen}
				>
					{#if mobileMenuOpen}
						<X class="h-5 w-5" />
					{:else}
						<Menu class="h-5 w-5" />
					{/if}
				</button>

				<button
					type="button"
					onclick={handleBrandClick}
					class="group hidden cursor-pointer items-center gap-2 sm:flex"
				>
					<Logo size="sm" variant="full" />
					<span
						class="inline-flex items-center rounded border border-[#D0E6DC] bg-[#EBF5F0] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-[#0C7B58] uppercase"
					>
						{m.ad_badge_admin()}
					</span>
				</button>

				<div class="hidden h-4 w-[1px] bg-[#E4EBE7] sm:block" aria-hidden="true"></div>

				<div class="flex items-center gap-1.5 text-xs">
					<span class="hidden text-[#698E82] md:inline">{m.ad_badge_admin()}</span>
					<ChevronRight class="hidden h-3.5 w-3.5 text-[#698E82] md:inline" aria-hidden="true" />
					<span class="font-semibold text-[#0E2E25]">
						{getSubrouteTitle(currentSubroute)}
					</span>
				</div>
			</div>

			<div class="flex items-center gap-2 sm:gap-3">
				<div
					class="hidden items-center gap-1.5 rounded-full border border-[#D0E6DC] bg-[#EBF5F0] px-2.5 py-1 text-[11px] font-medium text-[#0C7B58] md:flex"
				>
					<span class="h-2 w-2 rounded-full bg-[#0C7B58]" aria-hidden="true"></span>
					<span>{m.ad_status_normal()}</span>
				</div>

				<button
					type="button"
					onclick={handleSellerDashboard}
					class="hidden cursor-pointer items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-semibold text-[#52776C] transition-colors hover:border-[#E4EBE7] hover:bg-[#F0F7F3] hover:text-[#0E2E25] sm:flex"
					title={m.ad_tip_seller_dash()}
				>
					<span>{m.ad_link_seller_dash()}</span>
					<ExternalLink class="h-3.5 w-3.5 text-[#698E82]" />
				</button>

				<button
					type="button"
					onclick={handlePublicHome}
					class="hidden cursor-pointer items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-semibold text-[#52776C] transition-colors hover:border-[#E4EBE7] hover:bg-[#F0F7F3] hover:text-[#0E2E25] lg:flex"
					title={m.ad_tip_public_web()}
				>
					<span>{m.ad_link_public_web()}</span>
					<ExternalLink class="h-3.5 w-3.5 text-[#698E82]" />
				</button>

				<div class="hidden h-4 w-[1px] bg-[#E4EBE7] sm:block" aria-hidden="true"></div>

				<div class="relative" bind:this={profileDropdownEl}>
					<button
						type="button"
						onclick={() => (showProfileDropdown = !showProfileDropdown)}
						class="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1 transition-colors hover:border-[#E4EBE7] hover:bg-slate-50"
						aria-haspopup="menu"
						aria-expanded={showProfileDropdown}
					>
						<div
							class="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0C7B58] text-xs font-bold text-white"
						>
							{initials}
						</div>
						<div class="hidden text-left sm:block">
							<div class="text-xs leading-tight font-semibold text-[#0E2E25]">
								{currentUser?.name || m.ad_badge_admin()}
							</div>
							<div class="text-[10px] leading-none text-[#52776C]">
								{roleLabel}
							</div>
						</div>
						<ChevronDown class="h-3.5 w-3.5 text-[#698E82]" />
					</button>

					{#if showProfileDropdown}
						<div
							class="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-[#E4EBE7] bg-white py-2 text-xs shadow-lg"
							role="menu"
						>
							<div class="border-b border-[#E4EBE7] px-4 py-2">
								<p class="font-bold text-[#0E2E25]">{currentUser?.name}</p>
								<p class="truncate text-[11px] text-[#698E82]">{currentUser?.email}</p>
								<div class="mt-1.5">
									<span
										class="inline-flex items-center gap-1 rounded-full border border-[#D0E6DC] bg-[#EBF5F0] px-2 py-0.5 text-[10px] font-semibold text-[#0C7B58]"
									>
										<Shield class="h-3 w-3" />
										{roleLabel}
									</span>
								</div>
							</div>

							<div class="border-b border-[#E4EBE7] py-1 sm:hidden">
								<button
									type="button"
									onclick={handleSellerDashboard}
									class="flex w-full cursor-pointer items-center justify-between px-4 py-1.5 text-left text-[#52776C] hover:bg-slate-50"
								>
									<span>{m.ad_link_seller_dash()}</span>
									<ExternalLink class="h-3.5 w-3.5" />
								</button>
								<button
									type="button"
									onclick={handlePublicHome}
									class="flex w-full cursor-pointer items-center justify-between px-4 py-1.5 text-left text-[#52776C] hover:bg-slate-50"
								>
									<span>{m.ad_menu_public_web()}</span>
									<ExternalLink class="h-3.5 w-3.5" />
								</button>
							</div>

							<div class="pt-1">
								<button
									type="button"
									onclick={handleLogout}
									disabled={isLoggingOut}
									class="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left font-medium text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
								>
									{#if isLoggingOut}
										<Spinner class="h-3.5 w-3.5" label={m.common_loading()} />
									{:else}
										<LogOut class="h-3.5 w-3.5" />
									{/if}
									<span>{m.ad_logout_menu()}</span>
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</header>

	<div class="mx-auto flex w-full max-w-[1600px] flex-1">
		<aside
			class="fixed inset-y-0 left-0 z-30 flex w-60 transform flex-col justify-between border-r border-[#E4EBE7] bg-white transition-transform duration-200 ease-in-out lg:sticky lg:inset-y-auto lg:top-16 lg:h-[calc(100vh-4rem)] lg:transform-none {mobileMenuOpen
				? 'top-16 translate-x-0'
				: '-translate-x-full lg:translate-x-0'}"
			aria-label={m.ad_badge_admin()}
		>
			<nav class="flex-1 space-y-4 overflow-y-auto p-3">
				{#if canViewOverview}
					<div>
						<button
							type="button"
							onclick={() => navigateSubroute('overview')}
							class="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all {currentSubroute ===
							'overview'
								? 'bg-[#EBF5F0] text-[#0C7B58]'
								: 'text-[#52776C] hover:bg-[#FAFDFB] hover:text-[#0E2E25]'}"
						>
							<div class="flex items-center gap-2.5">
								<LayoutDashboard
									class="h-4 w-4 {currentSubroute === 'overview'
										? 'text-[#0C7B58]'
										: 'text-[#698E82]'}"
								/>
								<span>{m.ad_nav_overview()}</span>
							</div>
						</button>
					</div>
				{/if}

				{#each navSections as section, idx (idx)}
					<div class="pt-2">
						<p class="mb-1 px-3 text-[10px] font-bold tracking-wider text-[#698E82] uppercase">
							{section.title()}
						</p>
						<div class="space-y-0.5">
							{#each section.items as item (item.id)}
								{@const active = currentSubroute === item.id}
								<button
									type="button"
									onclick={() => navigateSubroute(item.id)}
									class="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all {active
										? 'bg-[#EBF5F0] font-semibold text-[#0C7B58]'
										: 'text-[#52776C] hover:bg-[#FAFDFB] hover:text-[#0E2E25]'}"
									aria-current={active ? 'page' : undefined}
								>
									<div class="flex items-center gap-2.5">
										<item.icon class="h-4 w-4 {active ? 'text-[#0C7B58]' : 'text-[#698E82]'}" />
										<span>{item.label()}</span>
									</div>

									{#if item.badge > 0}
										<span
											class="py-0.2 rounded-full px-1.5 text-[10px] font-bold {active
												? 'bg-[#0C7B58] text-white'
												: 'bg-[#FEF3C7] text-[#92400E]'}"
										>
											{item.badge}
										</span>
									{/if}
								</button>
							{/each}
						</div>
					</div>
				{/each}
			</nav>

			<div class="border-t border-[#E4EBE7] bg-[#FAFDFB] p-3">
				<div
					class="mb-2 flex items-center justify-between gap-2 rounded-xl border border-[#E4EBE7] bg-white p-2"
				>
					<div class="flex min-w-0 items-center gap-2">
						<div
							class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EBF5F0] text-xs font-bold text-[#0C7B58]"
						>
							{initials}
						</div>
						<div class="min-w-0 text-left">
							<div class="truncate text-xs font-semibold text-[#0E2E25]">
								{currentUser?.name || m.ad_user_fallback()}
							</div>
							<div class="truncate text-[10px] text-[#698E82]">
								{roleLabel}
							</div>
						</div>
					</div>
				</div>

				<button
					type="button"
					onclick={handleLogout}
					disabled={isLoggingOut}
					class="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:border-rose-200 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{#if isLoggingOut}
						<Spinner class="h-3.5 w-3.5" label={m.common_loading()} />
					{:else}
						<LogOut class="h-3.5 w-3.5" />
					{/if}
					<span>{m.ad_logout()}</span>
				</button>
			</div>
		</aside>

		{#if mobileMenuOpen}
			<div
				class="fixed inset-0 z-20 bg-slate-900/30 lg:hidden"
				onclick={() => (mobileMenuOpen = false)}
				onkeydown={(e) => e.key === 'Escape' && (mobileMenuOpen = false)}
				role="presentation"
			></div>
		{/if}

		<main class="min-w-0 flex-1 overflow-y-auto bg-[#F8FAF9] p-4 sm:p-6 lg:p-8">
			{@render children()}
		</main>
	</div>
</div>
