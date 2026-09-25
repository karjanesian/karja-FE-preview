<script module lang="ts">
	export type SettingsTab = 'profile' | 'schedule' | 'verification' | 'account' | 'notifications';
</script>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { seller } from '$lib/stores/seller.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import type { LifecycleState } from '$lib/types';
	import * as Select from '$lib/components/ui/select';
	import PageFrame from '$lib/components/common/PageFrame.svelte';
	import PageContent from '$lib/components/common/PageContent.svelte';
	import PageHeader from '$lib/components/common/PageHeader.svelte';
	import SettingsProfile from './SettingsProfile.svelte';
	import SettingsSchedule from './SettingsSchedule.svelte';
	import SettingsVerification from './SettingsVerification.svelte';
	import SettingsAccount from './SettingsAccount.svelte';
	import SettingsNotifications from './SettingsNotifications.svelte';
	import User from 'lucide-svelte/icons/user';
	import Calendar from 'lucide-svelte/icons/calendar';
	import ShieldCheck from 'lucide-svelte/icons/shield-check';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import Bell from 'lucide-svelte/icons/bell';
	import Check from 'lucide-svelte/icons/check';

	const TAB_IDS: SettingsTab[] = [
		'profile',
		'schedule',
		'verification',
		'account',
		'notifications'
	];

	let toastMsg = $state<string | null>(null);
	let toastTimer: ReturnType<typeof setTimeout> | undefined;

	function showToast(msg: string) {
		toastMsg = msg;
		if (toastTimer) clearTimeout(toastTimer);
		toastTimer = setTimeout(() => (toastMsg = null), 2500);
	}

	const activeTab = $derived.by(() => {
		const last = page.url.pathname.replace(/\/+$/, '').split('/').pop() ?? '';
		return (TAB_IDS as string[]).includes(last) ? (last as SettingsTab) : 'profile';
	});

	const verificationStatus = $derived(seller.sellerProfile.verification?.status);

	const LC_KEYS = {
		no_product: () => m.lc_no_product(),
		product_draft: () => m.lc_product_draft(),
		product_published_not_shared: () => m.lc_product_published_not_shared(),
		product_shared_no_views: () => m.lc_product_shared_no_views(),
		first_views_no_sale: () => m.lc_first_views_no_sale(),
		first_sale_needs_action: () => m.lc_first_sale_needs_action(),
		first_sale_completed: () => m.lc_first_sale_completed(),
		balance_available: () => m.lc_balance_available(),
		repeat_seller: () => m.lc_repeat_seller()
	} as const;
	function lifecycleLabel(st: string): string {
		const fn = LC_KEYS[st as keyof typeof LC_KEYS];
		return fn ? fn() : st;
	}

	const LIFECYCLE_STATES: LifecycleState[] = [
		'no_product',
		'product_draft',
		'product_published_not_shared',
		'product_shared_no_views',
		'first_views_no_sale',
		'first_sale_needs_action',
		'first_sale_completed',
		'balance_available',
		'repeat_seller'
	];

	// Sembunyikan panel developer saat dev: set PUBLIC_DEV_PANEL=off di .env
	const isDev = import.meta.env.DEV && import.meta.env.PUBLIC_DEV_PANEL !== 'off';
	let devLifecycle = $state<string>(seller.manualLifecycleOverride ?? '');

	function applyDevOverride() {
		seller.setLifecycleOverride(devLifecycle ? (devLifecycle as LifecycleState) : null);
		showToast(devLifecycle ? m.se_dev_applied({ state: devLifecycle }) : m.se_dev_cleared());
	}

	function resetToFresh() {
		seller.resetToFresh();
		void goto('/login');
	}

	const tabs = $derived([
		{
			id: 'profile' as SettingsTab,
			href: '/dashboard/settings/profile',
			label: m.se_tab_profile(),
			icon: User
		},
		{
			id: 'schedule' as SettingsTab,
			href: '/dashboard/settings/schedule',
			label: m.se_tab_schedule(),
			icon: Calendar
		},
		{
			id: 'verification' as SettingsTab,
			href: '/dashboard/settings/verification',
			label:
				verificationStatus === 'verified'
					? m.se_tab_verification_verified()
					: verificationStatus === 'pending'
						? m.se_tab_verification_pending()
						: m.se_tab_verification(),
			icon: ShieldCheck
		},
		{
			id: 'account' as SettingsTab,
			href: '/dashboard/settings/account',
			label: m.se_tab_account(),
			icon: CreditCard
		},
		{
			id: 'notifications' as SettingsTab,
			href: '/dashboard/settings/notifications',
			label: m.se_tab_notifications(),
			icon: Bell
		}
	]);
</script>

<PageFrame>
	<PageContent variant="standard">
		<PageHeader title={m.nav_settings()} description={m.se_page_desc()} />

		{#if toastMsg}
			<div
				class="flex items-center gap-2 rounded-xl border border-[#BDE5D0] bg-[#EAF8F0] p-3.5 text-xs font-semibold text-[#0C7B58]"
				role="status"
			>
				<Check class="h-4 w-4 text-[#0C7B58]" />
				<span>{toastMsg}</span>
			</div>
		{/if}

		<div class="-mb-px border-b border-[#EFF5F1]">
			<nav class="flex items-center gap-6 overflow-x-auto select-none sm:gap-8">
				{#each tabs as tab (tab.id)}
					{@const Icon = tab.icon}
					<a
						href={tab.href}
						aria-current={activeTab === tab.id ? 'page' : undefined}
						class="relative flex items-center gap-2 pb-3 text-xs font-semibold whitespace-nowrap transition-colors duration-150 sm:text-[13px] {activeTab ===
						tab.id
							? 'text-[#0E2E25]'
							: 'text-[#52776C] hover:text-[#0E2E25]'}"
					>
						<Icon
							class="h-3.5 w-3.5 {activeTab === tab.id ? 'text-[#008A5E]' : 'text-[#8CA399]'}"
						/>
						<span>{tab.label}</span>
						{#if activeTab === tab.id}
							<span class="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-[#008A5E]"></span>
						{/if}
					</a>
				{/each}
			</nav>
		</div>

		{#if activeTab === 'profile'}
			<SettingsProfile onToast={showToast} />
		{:else if activeTab === 'schedule'}
			<SettingsSchedule onToast={showToast} />
		{:else if activeTab === 'verification'}
			<SettingsVerification onToast={showToast} />
		{:else if activeTab === 'account'}
			<SettingsAccount onToast={showToast} />
		{:else}
			<SettingsNotifications onToast={showToast} />
		{/if}

		{#if isDev}
			<div class="space-y-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5">
				<div>
					<h3 class="text-xs font-bold tracking-wider text-gray-700 uppercase">
						{m.se_dev_title()}
					</h3>
					<p class="mt-0.5 text-[11px] text-gray-500">{m.se_dev_desc()}</p>
					<p class="mt-1 text-[11px] font-semibold text-gray-700">
						{m.se_dev_current_state({ state: seller.lifecycleState })}
					</p>
				</div>

				<div class="flex flex-wrap items-center gap-2">
					<label for="dev-lifecycle" class="text-[11px] font-semibold text-gray-700">
						{m.se_dev_lifecycle()}
					</label>
					<Select.Root
						items={{
							none: m.se_dev_option_none(),
							...Object.fromEntries(LIFECYCLE_STATES.map((st) => [st, st]))
						} as Record<string, string>}
						value={devLifecycle || 'none'}
						onValueChange={(v) => (devLifecycle = !v || v === 'none' ? '' : v)}
					>
						<Select.Trigger id="dev-lifecycle" size="sm">
							<Select.Value />
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="none" label={m.se_dev_option_none()}
								>{m.se_dev_option_none()}</Select.Item
							>
							{#each LIFECYCLE_STATES as state (state)}
								<Select.Item value={state} label={lifecycleLabel(state)}
									>{lifecycleLabel(state)}</Select.Item
								>
							{/each}
						</Select.Content>
					</Select.Root>
					<button
						type="button"
						onclick={applyDevOverride}
						class="cursor-pointer rounded-lg bg-gray-800 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-gray-700"
					>
						{m.se_dev_apply()}
					</button>
				</div>

				<div
					class="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-3"
				>
					<p class="text-[11px] text-gray-600">{m.se_dev_reset_desc()}</p>
					<button
						type="button"
						onclick={resetToFresh}
						class="cursor-pointer rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
					>
						{m.se_dev_reset_btn()}
					</button>
				</div>
			</div>
		{/if}
	</PageContent>
</PageFrame>
