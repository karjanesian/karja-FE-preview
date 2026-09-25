<script lang="ts">
	import { admin } from '$lib/stores/admin.svelte';
	import { hasPermission } from '$lib/domain/adminDomain';
	import { m } from '$lib/paraglide/messages.js';
	import type { PlatformSettings } from '$lib/types/admin';
	import ShieldCheck from 'lucide-svelte/icons/shield-check';
	import Lock from 'lucide-svelte/icons/lock';
	import Save from 'lucide-svelte/icons/save';

	const canWriteSettings = $derived(hasPermission(admin.adminUser, 'settings.write'));

	let formData = $state<PlatformSettings>(cloneSettings(admin.platformSettings));
	let savedSuccess = $state(false);

	function cloneSettings(s: PlatformSettings): PlatformSettings {
		return {
			...s,
			supportContact: { ...s.supportContact },
			socialLinks: { ...s.socialLinks },
			legalLinks: { ...s.legalLinks }
		};
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (!canWriteSettings) {
			alert(m.ady_cfg_alert_denied());
			return;
		}
		admin.saveSettings({
			...formData,
			karjaFeePercent: Number(formData.karjaFeePercent) || 0,
			paymentFeePercent: Number(formData.paymentFeePercent) || 0,
			minimumWithdrawalAmount: Number(formData.minimumWithdrawalAmount) || 0
		});
		savedSuccess = true;
		setTimeout(() => (savedSuccess = false), 3000);
	}
</script>

<div class="max-w-4xl space-y-6">
	<div
		class="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center"
	>
		<div>
			<h1 class="text-xl font-bold tracking-tight text-slate-900">{m.ady_cfg_title()}</h1>
			<p class="mt-0.5 text-xs text-slate-500">{m.ady_cfg_subtitle()}</p>
		</div>

		{#if savedSuccess}
			<span
				class="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"
			>
				<ShieldCheck class="h-3.5 w-3.5 text-emerald-600" />
				{m.ady_cfg_saved()}
			</span>
		{/if}
	</div>

	<form onsubmit={handleSubmit} class="space-y-5">
		<div class="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
			<h2 class="border-b border-slate-100 pb-2 text-sm font-bold text-slate-900">
				{m.ady_cfg_econ_title()}
			</h2>

			<div class="grid grid-cols-1 gap-4 text-xs sm:grid-cols-3">
				<div>
					<label for="cfg-karja-fee" class="mb-1 block font-semibold text-slate-700">
						{m.ady_cfg_fee_platform()}
					</label>
					<div class="relative">
						<input
							id="cfg-karja-fee"
							type="number"
							step="0.1"
							bind:value={formData.karjaFeePercent}
							class="w-full rounded-lg border border-slate-300 p-2 pr-8 font-mono text-xs focus:ring-1 focus:ring-emerald-500"
						/>
						<span class="absolute top-2 right-3 font-bold text-slate-400">%</span>
					</div>
					<p class="mt-1 text-[11px] text-slate-400">{m.ady_cfg_fee_platform_hint()}</p>
				</div>

				<div>
					<label for="cfg-payment-fee" class="mb-1 block font-semibold text-slate-700">
						{m.ady_cfg_fee_gateway()}
					</label>
					<div class="relative">
						<input
							id="cfg-payment-fee"
							type="number"
							step="0.1"
							bind:value={formData.paymentFeePercent}
							class="w-full rounded-lg border border-slate-300 p-2 pr-8 font-mono text-xs focus:ring-1 focus:ring-emerald-500"
						/>
						<span class="absolute top-2 right-3 font-bold text-slate-400">%</span>
					</div>
					<p class="mt-1 text-[11px] text-slate-400">{m.ady_cfg_fee_gateway_hint()}</p>
				</div>

				<div>
					<label for="cfg-min-payout" class="mb-1 block font-semibold text-slate-700">
						{m.ady_cfg_min_payout()}
					</label>
					<input
						id="cfg-min-payout"
						type="number"
						step="5000"
						value={formData.minimumWithdrawalAmount || 100000}
						oninput={(e) =>
							(formData.minimumWithdrawalAmount = parseInt(e.currentTarget.value) || 0)}
						class="w-full rounded-lg border border-slate-300 p-2 font-mono text-xs focus:ring-1 focus:ring-emerald-500"
					/>
					<p class="mt-1 text-[11px] text-slate-400">{m.ady_cfg_min_payout_hint()}</p>
				</div>
			</div>
		</div>

		<div class="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
			<h2 class="border-b border-slate-100 pb-2 text-sm font-bold text-slate-900">
				{m.ady_cfg_support_title()}
			</h2>

			<div class="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
				<div>
					<label for="cfg-support-email" class="mb-1 block font-semibold text-slate-700">
						{m.ady_cfg_email()}
					</label>
					<input
						id="cfg-support-email"
						type="email"
						value={formData.supportContact?.email || ''}
						oninput={(e) => {
							formData.supportContact = {
								...(formData.supportContact || { email: '', whatsapp: '' }),
								email: e.currentTarget.value
							};
						}}
						class="w-full rounded-lg border border-slate-300 p-2 font-mono text-xs focus:ring-1 focus:ring-emerald-500"
					/>
				</div>

				<div>
					<label for="cfg-support-whatsapp" class="mb-1 block font-semibold text-slate-700">
						{m.ady_cfg_whatsapp()}
					</label>
					<input
						id="cfg-support-whatsapp"
						type="text"
						value={formData.supportContact?.whatsapp || ''}
						oninput={(e) => {
							formData.supportContact = {
								...(formData.supportContact || { email: '', whatsapp: '' }),
								whatsapp: e.currentTarget.value
							};
						}}
						class="w-full rounded-lg border border-slate-300 p-2 font-mono text-xs focus:ring-1 focus:ring-emerald-500"
					/>
				</div>
			</div>

			<div class="pt-2">
				<label
					for="cfg-require-ktp"
					class="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-800"
				>
					<input
						id="cfg-require-ktp"
						type="checkbox"
						bind:checked={formData.requireIdentityForPayout}
						class="rounded text-emerald-600 focus:ring-emerald-500"
					/>
					<span>{m.ady_cfg_require_ktp()}</span>
				</label>
				<p class="mt-0.5 ml-5 text-[11px] text-slate-400">{m.ady_cfg_require_ktp_hint()}</p>
			</div>
		</div>

		<div class="flex items-center justify-between pt-2">
			{#if !canWriteSettings}
				<p class="flex items-center gap-1.5 text-xs font-medium text-slate-500">
					<Lock class="h-3.5 w-3.5 text-slate-400" />
					<span>{m.ady_cfg_readonly_note()}</span>
				</p>
			{:else}
				<div></div>
			{/if}
			<button
				type="submit"
				disabled={!canWriteSettings}
				class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#0C7B58] px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#096649] disabled:cursor-not-allowed disabled:bg-slate-300"
			>
				<Save class="h-4 w-4" />
				<span>{m.ady_cfg_save()}</span>
			</button>
		</div>
	</form>
</div>
