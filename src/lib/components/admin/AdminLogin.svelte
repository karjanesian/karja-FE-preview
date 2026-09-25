<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages.js';
	import { admin } from '$lib/stores/admin.svelte';
	import { authenticateAdmin, PREDEFINED_ADMIN_ACCOUNTS } from '$lib/domain/adminAuth';
	import { api, ApiError, isNetworkError } from '$lib/api';
	import type { PlatformUser } from '$lib/types/admin';
	import Logo from '$lib/components/common/Logo.svelte';
	import Spinner from '$lib/components/common/Spinner.svelte';
	import Shield from 'lucide-svelte/icons/shield';
	import Lock from 'lucide-svelte/icons/lock';
	import Mail from 'lucide-svelte/icons/mail';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import KeyRound from 'lucide-svelte/icons/key-round';
	import Eye from 'lucide-svelte/icons/eye';
	import EyeOff from 'lucide-svelte/icons/eye-off';
	import Info from 'lucide-svelte/icons/info';

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let error = $state<string | null>(null);
	let isLoading = $state(false);
	let showDemoHelp = $state(false);

	const sessionExpired = $derived(page.url.searchParams.get('reason') === 'expired');

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = null;
		isLoading = true;

		try {
			const res = await api<{ user: PlatformUser }>('/auth/admin/login', {
				method: 'POST',
				body: { email, password }
			});
			completeLogin(res.user);
		} catch (err) {
			if (isNetworkError(err)) {
				console.warn('[karja] backend admin tidak terlihat — fallback akun lokal');
				const result = authenticateAdmin(email, password);
				if (!result.success || !result.session) {
					error = result.error || m.ad_login_error_default();
				} else {
					completeLogin(result.session.user);
				}
			} else {
				error = err instanceof ApiError ? err.message : m.ad_login_error_default();
			}
		} finally {
			isLoading = false;
		}
	}

	function completeLogin(user: PlatformUser) {
		admin.login(user);
		void goto(`/admin/${admin.defaultSubrouteFor(user)}`);
	}

	function handleApplyDemoAccount(demoEmail: string, demoPass: string) {
		email = demoEmail;
		password = demoPass;
		error = null;
	}
</script>

<div
	class="flex min-h-screen flex-col justify-between bg-[#F8FAF9] font-sans selection:bg-[#EBF5F0] selection:text-[#0C7B58]"
>
	<header class="flex items-center justify-between px-4 py-5 sm:px-8">
		<button
			type="button"
			onclick={() => goto('/')}
			class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-3 py-1.5 text-xs font-semibold text-[#52776C] transition-colors hover:border-[#E4EBE7] hover:bg-white/80 hover:text-[#0E2E25]"
		>
			<ArrowLeft class="h-4 w-4" />
			<span>{m.ad_login_back_home()}</span>
		</button>

		<div class="flex items-center gap-2">
			<span
				class="inline-flex items-center gap-1.5 rounded-full border border-[#D0E6DC] bg-[#EBF5F0] px-2.5 py-1 text-[11px] font-medium text-[#0C7B58]"
			>
				<Shield class="h-3 w-3 text-[#0C7B58]" />
				{m.ad_login_portal()}
			</span>
		</div>
	</header>

	<main class="flex flex-1 items-center justify-center px-4 py-8">
		<div class="w-full max-w-md rounded-2xl border border-[#E4EBE7] bg-white p-6 shadow-sm sm:p-8">
			<div class="mb-6 text-center">
				<div class="mb-3 flex items-center justify-center gap-2">
					<Logo size="md" variant="full" />
					<span
						class="inline-flex items-center rounded bg-[#0C7B58] px-2 py-0.5 text-[11px] font-bold tracking-wide text-white uppercase"
					>
						{m.ad_badge_admin()}
					</span>
				</div>
				<h1 class="mb-1 text-xl font-bold tracking-tight text-[#0E2E25]">
					{m.ad_login_title()}
				</h1>
				<p class="text-xs text-[#52776C]">
					{m.ad_login_subtitle()}
				</p>
			</div>

			{#if sessionExpired}
				<div
					class="mb-5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900"
				>
					<AlertCircle class="h-4 w-4 shrink-0 text-amber-600" />
					<span>{m.ad_session_expired()}</span>
				</div>
			{/if}

			{#if error}
				<div
					class="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-relaxed text-rose-800"
					role="alert"
				>
					<AlertCircle class="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
					<div>
						<span class="block font-semibold">{m.ad_login_error_title()}</span>
						{error}
					</div>
				</div>
			{/if}

			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<label for="admin-email" class="mb-1.5 block text-xs font-semibold text-[#0E2E25]">
						{m.ad_login_email_label()}
					</label>
					<div class="relative">
						<div
							class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#698E82]"
						>
							<Mail class="h-4 w-4" />
						</div>
						<!-- svelte-ignore a11y_autofocus -->
						<input
							id="admin-email"
							type="email"
							required
							autofocus
							bind:value={email}
							oninput={() => {
								if (error) error = null;
							}}
							placeholder="admin@karja.id"
							class="w-full rounded-xl border border-[#E4EBE7] bg-[#FAFDFB] py-2.5 pr-3.5 pl-9 text-sm text-[#0E2E25] placeholder-[#698E82]/60 transition-all focus:border-[#0C7B58] focus:ring-2 focus:ring-[#0C7B58]/20 focus:outline-none"
						/>
					</div>
				</div>

				<div>
					<label for="admin-password" class="mb-1.5 block text-xs font-semibold text-[#0E2E25]">
						{m.ad_login_password_label()}
					</label>
					<div class="relative">
						<div
							class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#698E82]"
						>
							<Lock class="h-4 w-4" />
						</div>
						<input
							id="admin-password"
							type={showPassword ? 'text' : 'password'}
							required
							bind:value={password}
							oninput={() => {
								if (error) error = null;
							}}
							placeholder="••••••••••••"
							class="w-full rounded-xl border border-[#E4EBE7] bg-[#FAFDFB] py-2.5 pr-10 pl-9 text-sm text-[#0E2E25] placeholder-[#698E82]/60 transition-all focus:border-[#0C7B58] focus:ring-2 focus:ring-[#0C7B58]/20 focus:outline-none"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-[#698E82] hover:text-[#0E2E25]"
							aria-label={showPassword ? m.ad_login_hide_password() : m.ad_login_show_password()}
						>
							{#if showPassword}
								<EyeOff class="h-4 w-4" />
							{:else}
								<Eye class="h-4 w-4" />
							{/if}
						</button>
					</div>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					class="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0C7B58] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#096849] active:bg-[#07533A] disabled:opacity-50"
				>
					{#if isLoading}
						<Spinner class="h-4 w-4" label={m.common_loading()} />
						<span>{m.ad_login_loading()}</span>
					{:else}
						<KeyRound class="h-4 w-4" />
						<span>{m.ad_login_submit()}</span>
					{/if}
				</button>

				<p class="pt-1 text-center text-[11px] text-[#698E82]">
					{m.ad_login_note()}
				</p>
			</form>

			{#if import.meta.env.DEV && import.meta.env.PUBLIC_DEV_PANEL !== 'off'}
				<div class="mt-6 border-t border-[#E4EBE7] pt-5">
					<button
						type="button"
						onclick={() => (showDemoHelp = !showDemoHelp)}
						class="flex w-full cursor-pointer items-center justify-between text-[11px] font-semibold text-[#52776C] transition-colors hover:text-[#0C7B58]"
						aria-expanded={showDemoHelp}
					>
						<span class="flex items-center gap-1.5">
							<Info class="h-3.5 w-3.5" />
							<span>{m.ad_login_demo_toggle()}</span>
						</span>
						<span>{showDemoHelp ? m.ad_login_demo_close() : m.ad_login_demo_open()}</span>
					</button>

					{#if showDemoHelp}
						<div class="mt-3 space-y-2 text-xs">
							{#each PREDEFINED_ADMIN_ACCOUNTS as acc (acc.email)}
								<div
									class="flex items-center justify-between gap-2 rounded-xl border border-[#E4EBE7] bg-[#FAFDFB] p-2.5"
								>
									<div>
										<p class="text-xs font-semibold text-[#0E2E25]">
											{acc.user.name}
											<span class="text-[10px] font-bold text-[#0C7B58]">({acc.user.role})</span>
										</p>
										<p class="font-mono text-[11px] text-[#698E82]">
											{acc.email} • {acc.passwordHash}
										</p>
									</div>
									<button
										type="button"
										onclick={() => handleApplyDemoAccount(acc.email, acc.passwordHash)}
										class="shrink-0 cursor-pointer rounded-lg px-2 py-1 text-[11px] font-semibold text-[#0C7B58] transition-colors hover:bg-[#EBF5F0]"
									>
										{m.ad_login_demo_fill()}
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</main>

	<footer class="py-4 text-center text-xs text-[#698E82]">
		{m.ad_login_footer()}
	</footer>
</div>
