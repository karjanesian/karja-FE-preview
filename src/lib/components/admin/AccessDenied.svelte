<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { admin } from '$lib/stores/admin.svelte';
	import { canAccessAdminRoute, getRoleDisplayName } from '$lib/domain/adminDomain';
	import type { AdminSubRoute } from '$lib/domain/adminRoutes';
	import ShieldAlert from 'lucide-svelte/icons/shield-alert';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import LogIn from 'lucide-svelte/icons/log-in';
	import Compass from 'lucide-svelte/icons/compass';
	import Spinner from '$lib/components/common/Spinner.svelte';

	export type AccessDeniedReason =
		'unauthenticated' | 'forbidden' | 'suspended' | 'disabled' | 'unauthorized_route';

	type Props = {
		reason: AccessDeniedReason;
		onLogin: () => void;
		onBackPublic: () => void;
		onNavigateAllowed: (subroute: AdminSubRoute) => void;
		loginPending?: boolean;
	};

	let { reason, onLogin, onBackPublic, onNavigateAllowed, loginPending = false }: Props = $props();

	const currentUser = $derived(admin.adminUser);

	const details = $derived.by(() => {
		switch (reason) {
			case 'unauthenticated':
				return {
					title: m.ad_denied_title_unauth(),
					desc: m.ad_denied_desc_unauth(),
					badge: m.ad_denied_badge_unauth()
				};
			case 'forbidden':
				return {
					title: m.ad_denied_title_forbidden(),
					desc: m.ad_denied_desc_forbidden({ name: currentUser?.name || '' }),
					badge: m.ad_denied_badge_forbidden()
				};
			case 'unauthorized_route': {
				const roleName = currentUser ? getRoleDisplayName(currentUser.role) : m.ad_user_fallback();
				return {
					title: m.ad_denied_title_route(),
					desc: m.ad_denied_desc_route({ name: currentUser?.name || '', role: roleName }),
					badge: m.ad_denied_badge_route()
				};
			}
			case 'suspended':
			case 'disabled':
				return {
					title: m.ad_denied_title_suspended(),
					desc: m.ad_denied_desc_suspended(),
					badge: m.ad_denied_badge_suspended()
				};
		}
	});

	const defaultSubroute = $derived(currentUser ? admin.defaultSubrouteFor(currentUser) : 'login');

	const candidateRoutes: AdminSubRoute[] = [
		'overview',
		'sellers',
		'buyers',
		'products',
		'orders',
		'transactions',
		'payouts',
		'finance',
		'verifications',
		'cases',
		'blog',
		'storage',
		'settings'
	];

	const allowedRoutes = $derived(
		currentUser ? candidateRoutes.filter((r) => canAccessAdminRoute(currentUser, r)) : []
	);

	function routeLabel(sub: AdminSubRoute): string {
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
</script>

<div
	class="flex min-h-[70vh] items-center justify-center p-4 font-sans selection:bg-[#EBF5F0] selection:text-[#0C7B58]"
>
	<div
		class="w-full max-w-md space-y-5 rounded-2xl border border-[#E4EBE7] bg-white p-6 text-center shadow-sm sm:p-8"
	>
		<div
			class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700"
		>
			<ShieldAlert class="h-6 w-6" />
		</div>

		<div>
			<span
				class="mb-2 inline-block rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900"
			>
				{details.badge}
			</span>
			<h2 class="text-lg font-bold text-[#0E2E25]">
				{details.title}
			</h2>
			<p class="mt-2 text-xs leading-relaxed text-[#52776C]">
				{details.desc}
			</p>
		</div>

		{#if currentUser && allowedRoutes.length > 0 && reason !== 'forbidden'}
			<div class="rounded-xl border border-[#E4EBE7] bg-[#FAFDFB] p-3 text-left">
				<p class="mb-1.5 text-[11px] font-semibold text-[#698E82]">
					{m.ad_denied_allowed_list()}
				</p>
				<ul class="flex flex-wrap gap-1.5">
					{#each allowedRoutes as route (route)}
						<li>
							<button
								type="button"
								onclick={() => onNavigateAllowed(route)}
								class="cursor-pointer rounded-full border border-[#D0E6DC] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#0C7B58] transition-colors hover:bg-[#EBF5F0]"
							>
								{routeLabel(route)}
							</button>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<div class="space-y-2 pt-2">
			{#if reason === 'unauthorized_route' && defaultSubroute !== 'login'}
				<button
					type="button"
					onclick={() => onNavigateAllowed(defaultSubroute)}
					class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0C7B58] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#096849]"
				>
					<Compass class="h-4 w-4" />
					<span>{m.ad_denied_btn_allowed()}</span>
				</button>
			{/if}

			{#if reason === 'unauthenticated'}
				<button
					type="button"
					onclick={onLogin}
					disabled={loginPending}
					class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0C7B58] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#096849] disabled:cursor-not-allowed disabled:opacity-60"
				>
					{#if loginPending}
						<Spinner class="h-4 w-4" label={m.common_loading()} />
					{:else}
						<LogIn class="h-4 w-4" />
					{/if}
					<span>{m.ad_denied_btn_login()}</span>
				</button>
			{/if}

			<button
				type="button"
				onclick={onBackPublic}
				class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E4EBE7] bg-[#FAFDFB] px-4 py-2.5 text-xs font-semibold text-[#52776C] transition-colors hover:bg-slate-50 hover:text-[#0E2E25]"
			>
				<ArrowLeft class="h-4 w-4" />
				<span>{m.ad_denied_btn_public()}</span>
			</button>
		</div>
	</div>
</div>
