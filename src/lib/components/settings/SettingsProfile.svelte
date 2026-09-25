<script lang="ts">
	import { seller } from '$lib/stores/seller.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { getSellerTrustLevel } from '$lib/domain/verification';
	import type { SellerVerification } from '$lib/types';
	import IdentityStatusPill from './IdentityStatusPill.svelte';
	import KarjaVerifiedBadge from './KarjaVerifiedBadge.svelte';
	import Save from 'lucide-svelte/icons/save';

	type Props = { onToast: (msg: string) => void };
	let { onToast }: Props = $props();

	const profile = $derived(seller.sellerProfile);
	const verification: SellerVerification = $derived(
		profile.verification ?? { status: 'unverified', emailVerified: true, phoneVerified: true }
	);
	const trustLevel = $derived(getSellerTrustLevel(profile, seller.orders));

	const seed = seller.sellerProfile;

	let name = $state(seed.name || '');
	let username = $state(seed.username || '');
	let email = $state(seed.email || 'seller@karja.id');
	let whatsapp = $state(seed.whatsapp || '');
	let tagline = $state(seed.tagline || '');
	let bio = $state(seed.bio || '');

	const initials = $derived(
		profile?.name
			? profile.name
					.split(' ')
					.map((n) => n[0])
					.slice(0, 2)
					.join('')
					.toUpperCase()
			: 'TK'
	);

	function handleSaveProfile(e: SubmitEvent) {
		e.preventDefault();
		if (!name.trim()) {
			onToast(m.se_toast_name_required());
			return;
		}
		if (email && !email.includes('@')) {
			onToast(m.se_toast_email_invalid());
			return;
		}
		seller.updateProfile({ name, username, email, whatsapp, tagline, bio });
		onToast(m.se_toast_profile_saved());
	}

	const inputClass =
		'h-11 w-full rounded-xl border border-[#D8DFDC] bg-white px-3.5 text-xs text-[#0E2E25] transition-colors focus:border-[#0C7B58] focus:outline-none focus:ring-1 focus:ring-[#0C7B58]/10';
</script>

<div class="space-y-8 rounded-2xl border border-[#E2E8E4] bg-white p-6 shadow-xs sm:p-8">
	<div class="flex items-center gap-4 border-b border-[#F0F4F2] pb-6">
		<div
			class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#CCE6D6] bg-[#EAF8F0] text-lg font-bold text-[#0C7B58]"
		>
			{#if profile.avatarUrl && profile.avatarUrl.trim().length > 0}
				<img src={profile.avatarUrl} alt={profile.name} class="h-full w-full object-cover" />
			{:else}
				<span>{initials}</span>
			{/if}
		</div>
		<div class="space-y-0.5">
			<div class="flex flex-wrap items-center gap-2">
				<span class="text-base font-bold text-[#0E2E25]">{profile.name}</span>
				{#if trustLevel === 'karja_verified'}
					<KarjaVerifiedBadge size="sm" />
				{:else if trustLevel === 'identity_verified'}
					<IdentityStatusPill status="verified" size="xs" />
				{/if}
				{#if verification.status !== 'verified'}
					<span
						class="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-500"
					>
						<span>{m.se_status_unverified()}</span>
					</span>
				{/if}
			</div>
			<p class="text-xs text-[#52776C]">
				@{profile.username || 'temankarja'} · {profile.email || 'seller@karja.id'}
			</p>
		</div>
	</div>

	<form onsubmit={handleSaveProfile} class="space-y-6">
		<div class="space-y-4">
			<div>
				<h3 class="text-sm font-bold text-[#0E2E25]">{m.se_tab_profile()}</h3>
				<p class="mt-0.5 text-xs text-[#52776C]">{m.se_profile_info_desc()}</p>
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label for="profile-name" class="mb-1.5 block text-xs font-semibold text-[#184A3B]">
						{m.se_field_name()}
					</label>
					<input
						id="profile-name"
						type="text"
						bind:value={name}
						class={inputClass}
						placeholder={m.se_ph_name()}
					/>
					<p class="mt-1 text-[11px] text-[#52776C]">{m.se_name_hint()}</p>
				</div>
				<div>
					<label for="profile-username" class="mb-1.5 block text-xs font-semibold text-[#184A3B]">
						{m.se_field_username()}
					</label>
					<div class="flex items-center">
						<span
							class="flex h-11 items-center rounded-l-xl border border-r-0 border-[#D8DFDC] bg-gray-50 px-3 font-mono text-xs text-gray-500"
						>
							{m.se_prefix_url()}
						</span>
						<input
							id="profile-username"
							type="text"
							value={username}
							oninput={(e) =>
								(username = e.currentTarget.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
							class="h-11 w-full rounded-r-xl border border-[#D8DFDC] bg-white px-3.5 font-mono text-xs text-[#0E2E25] transition-colors focus:border-[#0C7B58] focus:ring-1 focus:ring-[#0C7B58]/10 focus:outline-none"
							placeholder={m.se_ph_username()}
						/>
					</div>
				</div>
			</div>

			<div>
				<label for="profile-tagline" class="mb-1.5 block text-xs font-semibold text-[#184A3B]">
					{m.se_field_tagline()}
				</label>
				<input
					id="profile-tagline"
					type="text"
					bind:value={tagline}
					class={inputClass}
					placeholder={m.se_ph_tagline()}
				/>
			</div>

			<div>
				<label for="profile-bio" class="mb-1.5 block text-xs font-semibold text-[#184A3B]">
					{m.se_field_bio()}
				</label>
				<textarea
					id="profile-bio"
					rows="3"
					bind:value={bio}
					class="w-full resize-none rounded-xl border border-[#D8DFDC] bg-white p-3 text-xs leading-relaxed text-[#0E2E25] transition-colors focus:border-[#0C7B58] focus:ring-1 focus:ring-[#0C7B58]/10 focus:outline-none"
					placeholder={m.se_ph_bio()}></textarea>
			</div>
		</div>

		<div class="space-y-4 border-t border-[#F0F4F2] pt-4">
			<div>
				<h4 class="text-xs font-bold tracking-wider text-[#0E2E25] uppercase">
					{m.se_section_contact()}
				</h4>
				<p class="mt-0.5 text-xs text-[#52776C]">{m.se_contact_desc()}</p>
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label for="profile-email" class="mb-1.5 block text-xs font-semibold text-[#184A3B]">
						{m.se_field_email()}
					</label>
					<input
						id="profile-email"
						type="email"
						bind:value={email}
						class={inputClass}
						placeholder={m.se_ph_email()}
					/>
					<p class="mt-1 text-[11px] text-[#52776C]">{m.se_email_hint()}</p>
				</div>
				<div>
					<label for="profile-whatsapp" class="mb-1.5 block text-xs font-semibold text-[#184A3B]">
						{m.se_field_whatsapp()}
					</label>
					<input
						id="profile-whatsapp"
						type="text"
						bind:value={whatsapp}
						class={inputClass}
						placeholder={m.se_ph_whatsapp()}
					/>
					<p class="mt-1 text-[11px] text-[#52776C]">{m.se_contact_desc()}</p>
				</div>
			</div>
		</div>

		<div class="flex justify-end border-t border-[#F0F4F2] pt-4">
			<button
				type="submit"
				class="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0C7B58] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#096649]"
			>
				<Save class="h-4 w-4" />
				<span>{m.se_btn_save_profile()}</span>
			</button>
		</div>
	</form>
</div>
