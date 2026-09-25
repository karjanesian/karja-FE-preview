<script lang="ts">
	import { onMount } from 'svelte';
	import { seller } from '$lib/stores/seller.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { isNetworkError } from '$lib/api';
	import {
		getNotificationPreferences,
		mapApiNotificationPreferences,
		toApiNotificationPreferences,
		updateNotificationPreferences
	} from '$lib/domain/notificationsApi';
	import type { NotificationPreferences } from '$lib/types';
	import Save from 'lucide-svelte/icons/save';

	type Props = { onToast: (msg: string) => void };
	let { onToast }: Props = $props();

	const prefs = seller.sellerProfile.notificationPreferences;

	let notifPrefs: NotificationPreferences = $state({
		email: {
			newOrder: prefs?.email?.newOrder ?? true,
			orderActionRequired: prefs?.email?.orderActionRequired ?? true,
			sessionReminder: prefs?.email?.sessionReminder ?? true,
			newReview: prefs?.email?.newReview ?? true,
			payoutUpdates: prefs?.email?.payoutUpdates ?? true,
			weeklySummary: prefs?.email?.weeklySummary ?? true
		},
		inApp: {
			newOrder: prefs?.inApp?.newOrder ?? true,
			orderActionRequired: prefs?.inApp?.orderActionRequired ?? true,
			sessionReminder: prefs?.inApp?.sessionReminder ?? true,
			newReview: prefs?.inApp?.newReview ?? true,
			payoutUpdates: prefs?.inApp?.payoutUpdates ?? true
		}
	});

	const emailItems = $derived([
		{
			id: 'newOrder',
			title: m.se_notif_new_order(),
			desc: m.se_notif_new_order_desc(),
			checked: notifPrefs.email.newOrder
		},
		{
			id: 'sessionReminder',
			title: m.se_notif_session_reminder(),
			desc: m.se_notif_session_reminder_desc(),
			checked: notifPrefs.email.sessionReminder
		},
		{
			id: 'orderActionRequired',
			title: m.se_notif_update(),
			desc: m.se_notif_update_desc(),
			checked: notifPrefs.email.orderActionRequired
		},
		{
			id: 'newReview',
			title: m.se_notif_new_review(),
			desc: m.se_notif_new_review_desc(),
			checked: notifPrefs.email.newReview
		},
		{
			id: 'payoutUpdates',
			title: m.se_notif_payout(),
			desc: m.se_notif_payout_desc(),
			checked: notifPrefs.email.payoutUpdates
		},
		{
			id: 'weeklySummary',
			title: m.se_notif_weekly(),
			desc: m.se_notif_weekly_desc(),
			checked: notifPrefs.email.weeklySummary
		}
	]);

	// Muat preferensi dari BE saat online; offline → pertahankan preferensi lokal.
	onMount(() => {
		void (async () => {
			try {
				const remote = await getNotificationPreferences();
				notifPrefs = mapApiNotificationPreferences(remote, notifPrefs);
				seller.updateProfile({ notificationPreferences: notifPrefs });
			} catch (e) {
				if (!isNetworkError(e)) console.error('[karja] ambil preferensi notifikasi gagal:', e);
			}
		})();
	});

	function toggleEmail(id: keyof NotificationPreferences['email'], checked: boolean) {
		notifPrefs = { ...notifPrefs, email: { ...notifPrefs.email, [id]: checked } };
	}

	async function handleSaveNotifications() {
		try {
			const remote = await updateNotificationPreferences(toApiNotificationPreferences(notifPrefs));
			notifPrefs = mapApiNotificationPreferences(remote, notifPrefs);
		} catch (e) {
			if (!isNetworkError(e)) console.error('[karja] simpan preferensi notifikasi gagal:', e);
		}
		seller.updateProfile({ notificationPreferences: notifPrefs });
		onToast(m.common_saved());
	}
</script>

<div class="space-y-6 rounded-2xl border border-[#E2E8E4] bg-white p-6 shadow-xs sm:p-8">
	<div class="border-b border-[#F0F4F2] pb-4">
		<h2 class="text-lg font-bold text-[#0E2E25]">{m.se_tab_notifications()}</h2>
		<p class="mt-0.5 text-xs text-[#52776C]">{m.se_notif_desc()}</p>
	</div>

	<div class="space-y-4">
		<div class="divide-y divide-[#F0F4F2]">
			{#each emailItems as item (item.id)}
				<div class="flex items-center justify-between py-3.5 text-xs first:pt-0 last:pb-0">
					<div class="pr-4">
						<label
							for={`notif-${item.id}`}
							class="block cursor-pointer font-semibold text-[#0E2E25]"
						>
							{item.title}
						</label>
						<p class="mt-0.5 text-[11px] text-[#52776C]">{item.desc}</p>
					</div>
					<input
						type="checkbox"
						id={`notif-${item.id}`}
						checked={item.checked}
						onchange={(e) =>
							toggleEmail(
								item.id as keyof NotificationPreferences['email'],
								e.currentTarget.checked
							)}
						class="h-4 w-4 cursor-pointer rounded accent-[#0C7B58]"
					/>
				</div>
			{/each}
		</div>

		<div class="flex items-center justify-between gap-3 border-t border-[#F0F4F2] pt-4">
			<p class="text-[11px] text-[#52776C]">{m.se_notif_footer()}</p>
			<button
				type="button"
				onclick={handleSaveNotifications}
				class="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-[#0C7B58] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#096649]"
			>
				<Save class="h-4 w-4" />
				<span>{m.se_btn_save_changes()}</span>
			</button>
		</div>
	</div>
</div>
