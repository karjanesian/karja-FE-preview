<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages.js';
import { admin } from '$lib/stores/admin.svelte';
	import { canAccessAdminRoute } from '$lib/domain/adminDomain';
	import type { AdminSubRoute } from '$lib/domain/adminRoutes';
	import AccessDenied from '$lib/components/admin/AccessDenied.svelte';
	import OverviewView from '$lib/components/admin/views/OverviewView.svelte';
	import SellersView from '$lib/components/admin/views/SellersView.svelte';
	import BuyersView from '$lib/components/admin/views/BuyersView.svelte';
	import ProductsView from '$lib/components/admin/views/ProductsView.svelte';
	import OrdersView from '$lib/components/admin/views/OrdersView.svelte';
	import TransactionsView from '$lib/components/admin/views/TransactionsView.svelte';
	import PayoutsView from '$lib/components/admin/views/PayoutsView.svelte';
	import FinanceView from '$lib/components/admin/views/FinanceView.svelte';
	import VerificationsView from '$lib/components/admin/views/VerificationsView.svelte';
	import CasesView from '$lib/components/admin/views/CasesView.svelte';
	import StorageView from '$lib/components/admin/views/StorageView.svelte';
	import AdminSettingsView from '$lib/components/admin/views/AdminSettingsView.svelte';
	import BlogCmsView from '$lib/components/admin/BlogCmsView.svelte';

	const VALID: AdminSubRoute[] = [
		'overview',
		'sellers',
		'buyers',
		'verifications',
		'products',
		'orders',
		'transactions',
		'payouts',
		'cases',
		'finance',
		'blog',
		'storage',
		'settings'
	];

	const section = $derived((page.params.section ?? 'overview') as AdminSubRoute);

	/** Label judul per section (huruf kapital yang benar, bukan slug mentah). */
	const SECTION_TITLES: Record<AdminSubRoute, () => string> = {
		login: () => m.ad_title_default(),
		overview: () => m.ad_nav_overview(),
		verifications: () => m.ad_nav_verification(),
		sellers: () => m.ad_nav_seller(),
		buyers: () => m.ad_nav_buyer(),
		products: () => m.ad_nav_product(),
		orders: () => m.ad_nav_order(),
		transactions: () => m.ad_nav_transaction(),
		payouts: () => m.ad_nav_payout(),
		finance: () => m.ad_nav_finance(),
		cases: () => m.ad_nav_case(),
		blog: () => m.ad_nav_blog(),
		storage: () => m.ad_nav_storage(),
		settings: () => m.ad_nav_settings()
	};
	const pageTitle = $derived(SECTION_TITLES[section]?.() ?? m.ad_title_default());
	const known = $derived(VALID.includes(section));
	const allowed = $derived(
		known && admin.adminUser ? canAccessAdminRoute(admin.adminUser, section) : false
	);
	let isLoggingOut = $state(false);

	$effect(() => {
		if (!known && admin.adminUser) void goto('/admin/overview', { replaceState: true });
	});
</script>

<svelte:head>
	<title>{pageTitle} · Admin Karja</title>
</svelte:head>

{#if known && !allowed}
	<AccessDenied
		reason="unauthorized_route"
		onLogin={() => {
			isLoggingOut = true;
			void admin.logout().then(() => goto('/admin/login'));
		}}
		onBackPublic={() => goto('/')}
		onNavigateAllowed={(sub) => goto(`/admin/${sub}`)}
		loginPending={isLoggingOut}
	/>
{:else if section === 'overview'}
	<OverviewView />
{:else if section === 'sellers'}
	<SellersView />
{:else if section === 'buyers'}
	<BuyersView />
{:else if section === 'verifications'}
	<VerificationsView />
{:else if section === 'products'}
	<ProductsView />
{:else if section === 'orders'}
	<OrdersView />
{:else if section === 'transactions'}
	<TransactionsView />
{:else if section === 'payouts'}
	<PayoutsView />
{:else if section === 'cases'}
	<CasesView />
{:else if section === 'finance'}
	<FinanceView />
{:else if section === 'blog'}
	<BlogCmsView />
{:else if section === 'storage'}
	<StorageView />
{:else if section === 'settings'}
	<AdminSettingsView />
{/if}
