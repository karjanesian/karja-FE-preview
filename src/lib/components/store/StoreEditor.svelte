<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import * as m from '$lib/paraglide/messages.js';
	import { ApiError, isNetworkError } from '$lib/api';
	import PageContent from '$lib/components/common/PageContent.svelte';
	import PageFrame from '$lib/components/common/PageFrame.svelte';
	import PageHeader from '$lib/components/common/PageHeader.svelte';
	import Storefront from '$lib/components/public/Storefront.svelte';
	import { compressImageFile } from '$lib/domain/imageCompressor';
	import { isReservedSlug, validateSellerUsername } from '$lib/domain/reservedSlugs';
	import {
		getSellerProfile,
		mapApiSellerProfile,
		STORE_ASSET_MAX_BYTES,
		STORE_ASSET_MIME_TYPES,
		toUpdateSellerProfileDto,
		updateSellerProfile,
		uploadStoreAsset
	} from '$lib/domain/sellerProfileApi';
	import { cleanUsername, getPublicStoreUrl } from '$lib/domain/url';
	import { seller } from '$lib/stores/seller.svelte';
	import type { SellerProfile } from '$lib/types';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Camera from 'lucide-svelte/icons/camera';
	import Check from 'lucide-svelte/icons/check';
	import Copy from 'lucide-svelte/icons/copy';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import Image from 'lucide-svelte/icons/image';
	import Info from 'lucide-svelte/icons/info';
	import Save from 'lucide-svelte/icons/save';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import X from 'lucide-svelte/icons/x';

	const SOCIAL_ICONS = {
		whatsapp: 'https://file.garden/ao1B7sLFNyZKt73m/Toko/logo-whatsapp-png-pic-0.png',
		instagram: 'https://file.garden/ao1B7sLFNyZKt73m/Toko/Instagram_logo_2022.svg',
		linkedin: 'https://file.garden/ao1B7sLFNyZKt73m/Toko/LinkedIn_icon.svg.webp',
		tiktok: 'https://file.garden/ao1B7sLFNyZKt73m/Toko/tik-tok-android-application-logos-3.png'
	};

	const PRESET_AVATARS = [
		{
			label: 'Kimberly',
			url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
		},
		{
			label: 'Adrian',
			url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80'
		},
		{
			label: 'Sarah',
			url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80'
		},
		{
			label: 'Rian',
			url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'
		}
	];

	const PRESET_BANNERS = [
		{
			label: 'Abstrak Hijau',
			url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80'
		},
		{
			label: 'Workspace Minimal',
			url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80'
		},
		{
			label: 'Arsitektur Tenang',
			url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80'
		},
		{
			label: 'Gradien Lembut',
			url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&auto=format&fit=crop&q=80'
		}
	];

	const SUGGESTED_TOPICS = [
		'Review CV & Karir',
		'Excel & Notion',
		'Konsultasi 1-on-1',
		'Design & UI/UX',
		'Copywriting',
		'Ebook & Template'
	];

	let form = $state<SellerProfile>($state.snapshot(seller.sellerProfile));
	let savedSnapshot = $state(JSON.stringify(seller.sellerProfile));
	let newTopic = $state('');
	let copiedLink = $state(false);
	let saveToast = $state(false);
	let saveError = $state<string | null>(null);
	let isSaving = $state(false);
	let showAvatarPresets = $state(false);
	let showBannerPresets = $state(false);

	let avatarInput = $state<HTMLInputElement | undefined>(undefined);
	let bannerInput = $state<HTMLInputElement | undefined>(undefined);

	$effect(() => {
		const profile = seller.sellerProfile;
		form = $state.snapshot(profile);
		savedSnapshot = JSON.stringify(profile);
	});

	onMount(() => {
		void loadProfile();
	});

	/** Tarik profil dari BE; offline → biarkan data lokal seperti semula. */
	async function loadProfile() {
		try {
			const remote = await getSellerProfile();
			seller.updateProfile(mapApiSellerProfile(remote, seller.sellerProfile));
		} catch (e) {
			if (!isNetworkError(e)) console.error('[karja] load profil toko gagal:', e);
		}
	}

	const isDirty = $derived(JSON.stringify(form) !== savedSnapshot);
	const activeProducts = $derived(seller.products.filter((p) => p.status === 'active'));
	const isFirstTimeSeller = $derived(
		!seller.journeySignals.storeSetupCompleted && activeProducts.length === 0
	);
	const usernameCheck = $derived(validateSellerUsername(form.username ?? ''));
	const usernameError = $derived(
		form.username && !usernameCheck.valid ? resolveUsernameError() : ''
	);
	const handle = $derived(cleanUsername(form.username));
	const previewSeller = $derived<SellerProfile>({ ...form, username: handle });
	const initials = $derived(
		form.name
			? form.name
					.split(' ')
					.filter(Boolean)
					.map((n) => n[0])
					.slice(0, 2)
					.join('')
					.toUpperCase()
			: 'TK'
	);
	const canSave = $derived(
		isDirty && !isSaving && Boolean(form.name.trim()) && usernameCheck.valid
	);

	function resolveUsernameError(): string {
		const clean = (form.username ?? '').trim().toLowerCase().replace(/^@/, '');
		if (isReservedSlug(clean)) return m.st_err_username_reserved({ username: clean });
		if (clean.length < 3) return m.st_err_username_short();
		if (clean.length > 30) return m.st_err_username_long();
		return m.st_err_username_format();
	}

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(getPublicStoreUrl(form.username));
			copiedLink = true;
			setTimeout(() => (copiedLink = false), 2000);
		} catch {
			/* noop */
		}
	}

	function viewPublicStore() {
		if (!form.username.trim()) return;
		window.open(getPublicStoreUrl(form.username), '_blank', 'noopener,noreferrer');
	}

	function addTopic(topicToAdd?: string) {
		const topic = (topicToAdd || newTopic).trim();
		const currentTopics = form.topics || [];
		if (topic && !currentTopics.includes(topic)) {
			form.topics = [...currentTopics, topic];
			newTopic = '';
		}
	}

	function removeTopic(topic: string) {
		form.topics = (form.topics || []).filter((t) => t !== topic);
	}

	async function readImage(file: File, width: number, height: number, quality: number) {
		try {
			const compressed = await compressImageFile(file, width, height, quality);
			if (compressed) return compressed;
		} catch {
			/* fall through to FileReader */
		}
		return await new Promise<string>((resolve) => {
			const reader = new FileReader();
			reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
			reader.onerror = () => resolve('');
			reader.readAsDataURL(file);
		});
	}

	/**
	 * Online: upload ke BE dan pakai URL CDN. Offline (BE tidak terjangkau):
	 * jatuh ke `fallback` (kompresi data URL) supaya perilaku lama tetap jalan.
	 */
	async function resolveStoreAssetUrl(
		file: File,
		fallback: () => Promise<string>
	): Promise<string | null> {
		if (!STORE_ASSET_MIME_TYPES.includes(file.type) || file.size > STORE_ASSET_MAX_BYTES) {
			saveError = m.pb_image_invalid();
			return null;
		}
		try {
			const { url } = await uploadStoreAsset(file);
			return url;
		} catch (e) {
			if (isNetworkError(e)) return await fallback();
			saveError = e instanceof ApiError ? e.message : m.pb_image_upload_failed();
			return null;
		}
	}

	async function onAvatarChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		saveError = null;
		const url = await resolveStoreAssetUrl(file, () => readImage(file, 400, 400, 0.8));
		if (url) form.avatarUrl = url;
	}

	async function onBannerChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		saveError = null;
		const url = await resolveStoreAssetUrl(file, () => readImage(file, 1200, 500, 0.75));
		if (url) form.bannerUrl = url;
	}

	async function handleSave(event: SubmitEvent) {
		event.preventDefault();
		if (!canSave) return;
		isSaving = true;
		saveError = null;

		const local = $state.snapshot(form);
		try {
			const remote = await updateSellerProfile(toUpdateSellerProfileDto(local));
			seller.updateStoreProfile(mapApiSellerProfile(remote, seller.sellerProfile));
		} catch (e) {
			if (isNetworkError(e)) {
				// BE tidak terjangkau → simpan lokal seperti sebelumnya.
				seller.updateStoreProfile(local);
			} else {
				saveError = e instanceof ApiError ? e.message : m.auth_err_generic();
				isSaving = false;
				return;
			}
		}

		isSaving = false;
		saveToast = true;
		setTimeout(() => (saveToast = false), 2500);
		if (isFirstTimeSeller) void goto('/dashboard/products/new');
	}
</script>

<PageFrame>
	<PageContent variant="wide">
		<input
			type="file"
			bind:this={avatarInput}
			onchange={onAvatarChange}
			accept="image/*"
			class="hidden"
		/>
		<input
			type="file"
			bind:this={bannerInput}
			onchange={onBannerChange}
			accept="image/*"
			class="hidden"
		/>

		<PageHeader title={m.st_title()} description={m.st_subtitle()}>
			{#snippet actions()}
				<div class="flex items-center gap-2">
					<button
						type="button"
						onclick={viewPublicStore}
						class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5ECE7] bg-white px-3 py-1.5 text-xs font-semibold text-[#0E2E25] transition-colors hover:bg-[#F9FCFA]"
					>
						<span>{m.st_view_store()}</span>
						<ExternalLink class="h-3.5 w-3.5 text-[#52776C]" />
					</button>
					{#if activeProducts.length > 0}
						<button
							type="button"
							onclick={copyLink}
							class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#0C7B58] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#096649]"
						>
							{#if copiedLink}
								<Check class="h-3.5 w-3.5" />
							{:else}
								<Copy class="h-3.5 w-3.5" />
							{/if}
							<span>{copiedLink ? m.st_copied() : m.common_copy_link()}</span>
						</button>
					{/if}
				</div>
			{/snippet}
		</PageHeader>

		{#if saveToast}
			<div
				class="animate-fadeIn flex items-center justify-between rounded-xl border border-[#BDE5D0] bg-[#EAF8F0] p-4 text-xs font-bold text-[#0C7B58] shadow-xs"
			>
				<div class="flex items-center gap-2">
					<div
						class="flex h-5 w-5 items-center justify-center rounded-full bg-[#0C7B58] text-[10px] text-white"
					>
						✓
					</div>
					<span>{m.common_saved()}</span>
				</div>
				<button
					type="button"
					onclick={() => (saveToast = false)}
					class="cursor-pointer p-1 font-bold text-[#0C7B58] hover:text-[#096649]"
					aria-label={m.common_close()}
				>
					<X class="h-3.5 w-3.5" />
				</button>
			</div>
		{/if}

		{#if saveError}
			<div
				class="animate-fadeIn flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 shadow-xs"
			>
				<span>{saveError}</span>
				<button
					type="button"
					onclick={() => (saveError = null)}
					class="cursor-pointer rounded p-0.5 text-rose-500 transition-colors hover:text-rose-700"
					aria-label={m.common_close()}
				>
					<X class="h-3.5 w-3.5" />
				</button>
			</div>
		{/if}

		<div class="flex w-full flex-col items-start gap-4 lg:flex-row lg:items-start">
			<div class="min-w-0 flex-1 space-y-6">
				<form onsubmit={handleSave} class="space-y-6">
					<div class="space-y-5 rounded-2xl border border-[#E2E8E4] bg-white p-5 sm:p-6">
						<div class="flex items-baseline justify-between border-b border-[#F0F4F1] pb-3">
							<div>
								<h2 class="text-base font-bold text-[#0E2E25]">{m.st_profile_title()}</h2>
								<p class="mt-0.5 text-xs text-[#52776C]">{m.st_profile_desc()}</p>
							</div>
							<span class="text-xs font-medium text-[#0C7B58]">{m.st_required_badge()}</span>
						</div>

						<div>
							<label for="st-name-input" class="mb-1.5 block text-xs font-bold text-[#184A3B]">
								{m.st_name_label()} <span class="text-red-500">*</span>
							</label>
							<input
								id="st-name-input"
								type="text"
								required
								bind:value={form.name}
								placeholder={m.st_name_placeholder()}
								class="w-full rounded-xl border border-[#D5E2DA] bg-[#FAFDFB] p-3 text-xs font-semibold text-[#0E2E25] transition-all outline-none focus:border-[#0C7B58] focus:bg-white sm:text-sm"
							/>
						</div>

						<div>
							<div class="mb-1.5 flex items-center justify-between">
								<label for="st-username-input" class="block text-xs font-bold text-[#184A3B]">
									{m.st_username_label()} <span class="text-red-500">*</span>
								</label>
								{#if form.username}
									<button
										type="button"
										onclick={copyLink}
										class="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-[#0C7B58] transition-colors hover:text-[#096649]"
									>
										{#if copiedLink}
											<Check class="h-3 w-3 text-[#0C7B58]" />
										{:else}
											<Copy class="h-3 w-3" />
										{/if}
										<span>{copiedLink ? m.common_link_copied() : m.st_copy_store_link()}</span>
									</button>
								{/if}
							</div>
							<div class="relative flex items-center">
								<span class="absolute left-3 text-xs font-semibold text-[#698E82] select-none">
									karja.id/
								</span>
								<input
									id="st-username-input"
									type="text"
									required
									value={form.username}
									oninput={(e) => {
										form.username = e.currentTarget.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
									}}
									placeholder={m.st_username_placeholder()}
									class="w-full rounded-xl border border-[#D5E2DA] bg-[#FAFDFB] py-3 pr-3 pl-[70px] text-xs font-semibold text-[#0E2E25] transition-all outline-none focus:border-[#0C7B58] focus:bg-white sm:text-sm"
								/>
							</div>
							<p class="mt-1 text-[11px] text-[#698E82]">{m.st_username_hint()}</p>
							{#if usernameError}
								<p class="mt-1 text-[11px] font-semibold text-red-600">{usernameError}</p>
							{/if}

							<div
								class="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[#CCE6D6] bg-[#F2FAF5] p-3"
							>
								<div class="min-w-0">
									<p class="text-[11px] font-bold text-[#184A3B]">
										{m.st_live_url_label()}
									</p>
									<p class="truncate text-xs font-semibold text-[#0C7B58]">
										karja.id/@{handle}
									</p>
								</div>
								<button
									type="button"
									onclick={copyLink}
									class="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[#D5EBDD] bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#0C7B58] transition-colors hover:bg-[#E2F3EA]"
								>
									{#if copiedLink}
										<Check class="h-3.5 w-3.5" />
									{:else}
										<Copy class="h-3.5 w-3.5" />
									{/if}
									<span>{copiedLink ? m.st_copied() : m.common_copy_link()}</span>
								</button>
							</div>
						</div>

						<div class="pt-2">
							<span class="mb-2 block text-xs font-bold text-[#184A3B]">
								{m.st_avatar_label()}
								<span class="text-[11px] font-normal text-[#698E82]">{m.st_optional_suffix()}</span>
							</span>
							<div class="flex items-center gap-4">
								<div
									class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-[#CCE6D6] bg-[#EAF8F0] text-lg font-bold text-[#0C7B58] shadow-2xs"
								>
									{#if form.avatarUrl && form.avatarUrl.trim().length > 0}
										<img
											src={form.avatarUrl}
											alt={m.st_avatar_label()}
											class="h-full w-full object-cover"
										/>
									{:else}
										<span>{initials}</span>
									{/if}
								</div>

								<div class="space-y-2">
									<div class="flex flex-wrap items-center gap-2">
										<button
											type="button"
											onclick={() => avatarInput?.click()}
											class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#CCE6D6] bg-[#FAFDFB] px-3 py-1.5 text-xs font-bold text-[#185343] shadow-2xs transition-colors hover:border-[#0C7B58] hover:bg-[#F2FAF5]"
										>
											<Camera class="h-3.5 w-3.5 text-[#0C7B58]" />
											<span>{m.st_upload_photo()}</span>
										</button>

										<button
											type="button"
											onclick={() => (showAvatarPresets = !showAvatarPresets)}
											class="cursor-pointer rounded-xl border border-[#D5EBDD] bg-white px-3 py-1.5 text-xs font-semibold text-[#456E61] transition-colors hover:bg-[#F2FAF5]"
										>
											<span>{m.st_use_sample()}</span>
										</button>

										{#if form.avatarUrl}
											<button
												type="button"
												onclick={() => (form.avatarUrl = '')}
												class="cursor-pointer rounded-lg p-1.5 text-[#92400E] transition-colors hover:bg-red-50"
												title={m.st_remove_photo()}
											>
												<Trash2 class="h-4 w-4 text-red-500" />
											</button>
										{/if}
									</div>

									{#if showAvatarPresets}
										<div class="animate-fadeIn flex items-center gap-2 pt-1">
											{#each PRESET_AVATARS as preset (preset.label)}
												<button
													type="button"
													onclick={() => {
														form.avatarUrl = preset.url;
														showAvatarPresets = false;
													}}
													class="h-8 w-8 cursor-pointer overflow-hidden rounded-full border border-[#CCE6D6] transition-all hover:scale-105 hover:border-[#0C7B58]"
													title={preset.label}
												>
													<img
														src={preset.url}
														alt={preset.label}
														class="h-full w-full object-cover"
													/>
												</button>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						</div>
					</div>

					<div class="space-y-5 rounded-2xl border border-[#E2E8E4] bg-white p-5 sm:p-6">
						<div class="flex items-baseline justify-between border-b border-[#F0F4F1] pb-3">
							<div>
								<h2 class="text-base font-bold text-[#0E2E25]">{m.st_about_title()}</h2>
								<p class="mt-0.5 text-xs text-[#52776C]">{m.st_about_desc()}</p>
							</div>
							<span class="text-xs text-[#7A9E93]">{m.st_optional_badge()}</span>
						</div>

						{#if isFirstTimeSeller}
							<div
								class="flex items-center gap-2 rounded-xl border border-[#D5EBDD] bg-[#F4FAF6] p-3 text-xs text-[#356153]"
							>
								<Info class="h-4 w-4 shrink-0 text-[#0C7B58]" />
								<span>{m.st_first_time_hint()}</span>
							</div>
						{/if}

						<div>
							<label for="st-tagline-input" class="mb-1.5 block text-xs font-bold text-[#184A3B]">
								{m.st_tagline_label()}
								<span class="text-[11px] font-normal text-[#698E82]">{m.st_optional_suffix()}</span>
							</label>
							<input
								id="st-tagline-input"
								type="text"
								bind:value={form.tagline}
								placeholder={m.st_tagline_placeholder()}
								class="w-full rounded-xl border border-[#D5E2DA] bg-[#FAFDFB] p-3 text-xs text-[#0E2E25] transition-all outline-none focus:border-[#0C7B58] focus:bg-white sm:text-sm"
							/>
						</div>

						<div>
							<label for="st-bio-input" class="mb-1.5 block text-xs font-bold text-[#184A3B]">
								{m.st_bio_label()}
								<span class="text-[11px] font-normal text-[#698E82]">{m.st_optional_suffix()}</span>
							</label>
							<textarea
								id="st-bio-input"
								rows="3"
								bind:value={form.bio}
								placeholder={m.st_bio_placeholder()}
								class="w-full resize-none rounded-xl border border-[#D5E2DA] bg-[#FAFDFB] p-3 text-xs text-[#0E2E25] transition-all outline-none focus:border-[#0C7B58] focus:bg-white sm:text-sm"
							></textarea>
						</div>

						<div class="space-y-2">
							<label for="st-topic-input" class="block text-xs font-bold text-[#184A3B]">
								{m.st_topics_label()}
								<span class="text-[11px] font-normal text-[#698E82]">{m.st_optional_suffix()}</span>
							</label>

							<div class="flex flex-wrap gap-2">
								{#each form.topics || [] as topic (topic)}
									<span
										class="inline-flex items-center gap-1.5 rounded-lg border border-[#D2E7DC] bg-[#F2FAF5] px-3 py-1 text-xs font-semibold text-[#0C7B58]"
									>
										<span>{topic}</span>
										<button
											type="button"
											onclick={() => removeTopic(topic)}
											class="cursor-pointer text-sm leading-none hover:text-red-600"
										>
											×
										</button>
									</span>
								{/each}
							</div>

							<div class="flex items-center gap-2 pt-1">
								<input
									id="st-topic-input"
									type="text"
									bind:value={newTopic}
									onkeydown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											addTopic();
										}
									}}
									placeholder={m.st_topic_placeholder()}
									class="flex-1 rounded-xl border border-[#D5E2DA] bg-[#FAFDFB] p-2 text-xs text-[#0E2E25] outline-none"
								/>
								<button
									type="button"
									onclick={() => addTopic()}
									class="cursor-pointer rounded-xl bg-[#F2FAF5] px-3 py-2 text-xs font-bold text-[#0C7B58] transition-colors hover:bg-[#E2F3EA]"
								>
									{m.st_add_topic()}
								</button>
							</div>

							<div class="flex flex-wrap gap-1.5 pt-1">
								{#each SUGGESTED_TOPICS.filter((t) => !(form.topics || []).includes(t)) as suggested (suggested)}
									<button
										type="button"
										onclick={() => addTopic(suggested)}
										class="cursor-pointer rounded-lg border border-[#DCE8E1] bg-white px-2.5 py-0.5 text-[11px] text-[#52776C] transition-all hover:border-[#0C7B58] hover:text-[#0C7B58]"
									>
										+ {suggested}
									</button>
								{/each}
							</div>
						</div>
					</div>

					<div class="space-y-4 rounded-2xl border border-[#E2E8E4] bg-white p-5 sm:p-6">
						<div class="flex items-baseline justify-between border-b border-[#F0F4F1] pb-3">
							<div>
								<h2 class="text-base font-bold text-[#0E2E25]">
									{m.st_appearance_title()}
								</h2>
								<p class="mt-0.5 text-xs text-[#52776C]">{m.st_appearance_desc()}</p>
							</div>
							<span class="text-xs text-[#7A9E93]">{m.st_optional_badge()}</span>
						</div>

						<div class="space-y-3">
							<div
								class="group relative h-28 overflow-hidden rounded-2xl border border-[#D5E2DA] bg-[#F2FAF5] sm:h-32"
							>
								{#if form.bannerUrl && form.bannerUrl.trim().length > 0}
									<img
										src={form.bannerUrl}
										alt={m.st_appearance_title()}
										class="h-full w-full object-cover"
									/>
									<div
										class="absolute top-2 right-2 flex items-center gap-1.5 rounded-xl bg-black/40 p-1 backdrop-blur-xs"
									>
										<button
											type="button"
											onclick={() => bannerInput?.click()}
											class="cursor-pointer rounded-lg bg-white/90 px-2.5 py-1 text-xs font-bold text-[#0E2E25] transition-colors hover:bg-white"
										>
											{m.st_replace_banner()}
										</button>
										<button
											type="button"
											onclick={() => (form.bannerUrl = '')}
											class="cursor-pointer rounded-lg p-1 text-white transition-colors hover:text-red-400"
											title={m.st_remove_banner()}
										>
											<Trash2 class="h-3.5 w-3.5" />
										</button>
									</div>
								{:else}
									<div
										class="flex h-full w-full flex-col items-center justify-center gap-2 text-[#52776C]"
									>
										<Image class="h-6 w-6 text-[#94B8AA]" />
										<div class="text-center">
											<p class="text-xs font-bold text-[#184A3B]">{m.st_no_banner()}</p>
											<p class="text-[11px] text-[#698E82]">{m.st_banner_ratio()}</p>
										</div>
									</div>
								{/if}
							</div>

							<div class="flex flex-wrap items-center gap-2">
								<button
									type="button"
									onclick={() => bannerInput?.click()}
									class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#CCE6D6] bg-[#FAFDFB] px-3.5 py-2 text-xs font-bold text-[#185343] shadow-2xs transition-colors hover:border-[#0C7B58] hover:bg-[#F2FAF5]"
								>
									<Camera class="h-3.5 w-3.5 text-[#0C7B58]" />
									<span>{m.st_upload_banner()}</span>
								</button>

								<button
									type="button"
									onclick={() => (showBannerPresets = !showBannerPresets)}
									class="cursor-pointer rounded-xl border border-[#D5EBDD] bg-white px-3.5 py-2 text-xs font-semibold text-[#456E61] transition-colors hover:bg-[#F2FAF5]"
								>
									<span>{m.st_use_sample_banner()}</span>
								</button>
							</div>

							{#if showBannerPresets}
								<div class="animate-fadeIn grid grid-cols-2 gap-2 pt-1 sm:grid-cols-4">
									{#each PRESET_BANNERS as banner (banner.label)}
										<button
											type="button"
											onclick={() => {
												form.bannerUrl = banner.url;
												showBannerPresets = false;
											}}
											class="group cursor-pointer overflow-hidden rounded-xl border border-[#CCE6D6] text-left transition-all hover:border-[#0C7B58]"
										>
											<img
												src={banner.url}
												alt={banner.label}
												class="h-12 w-full object-cover transition-transform group-hover:scale-105"
											/>
											<span
												class="block truncate bg-[#FAFDFB] p-1 text-[10px] font-semibold text-[#184A3B]"
											>
												{banner.label}
											</span>
										</button>
									{/each}
								</div>
							{/if}
						</div>
					</div>

					<div class="space-y-4 rounded-2xl border border-[#E2E8E4] bg-white p-5 sm:p-6">
						<div class="flex items-baseline justify-between border-b border-[#F0F4F1] pb-3">
							<div>
								<h2 class="text-base font-bold text-[#0E2E25]">{m.st_contacts_title()}</h2>
								<p class="mt-0.5 text-xs text-[#52776C]">{m.st_contacts_desc()}</p>
							</div>
							<span class="text-xs text-[#7A9E93]">{m.st_optional_badge()}</span>
						</div>

						<div class="space-y-3.5">
							<div class="space-y-2">
								<label
									for="st-whatsapp-input"
									class="flex items-center gap-1.5 text-xs font-bold text-[#184A3B]"
								>
									<img src={SOCIAL_ICONS.whatsapp} alt="WhatsApp" class="h-4 w-4 object-contain" />
									<span>WhatsApp</span>
									<span class="text-[11px] font-normal text-[#698E82]"
										>{m.st_optional_suffix()}</span
									>
								</label>
								<input
									id="st-whatsapp-input"
									type="tel"
									bind:value={form.whatsapp}
									placeholder={m.st_whatsapp_placeholder()}
									class="w-full rounded-xl border border-[#CCE6D6] bg-[#FAFDFB] p-2.5 text-xs text-[#0E2E25] outline-none focus:border-[#0C7B58] sm:text-sm"
								/>

								<label class="flex cursor-pointer items-center gap-2 pt-1">
									<input
										type="checkbox"
										bind:checked={form.showWhatsappOnStore}
										class="h-4 w-4 rounded border-[#CCE6D6] text-[#0C7B58] focus:ring-[#0C7B58]"
									/>
									<span class="text-xs text-[#356153]">{m.st_show_whatsapp()}</span>
								</label>
							</div>

							<div>
								<label
									for="st-instagram-input"
									class="mb-1 flex items-center gap-1.5 text-xs font-bold text-[#184A3B]"
								>
									<img
										src={SOCIAL_ICONS.instagram}
										alt="Instagram"
										class="h-4 w-4 object-contain"
									/>
									<span>Instagram</span>
									<span class="text-[11px] font-normal text-[#698E82]"
										>{m.st_optional_suffix()}</span
									>
								</label>
								<div class="relative flex items-center">
									<span class="absolute left-3 text-xs font-semibold text-[#698E82]">@</span>
									<input
										id="st-instagram-input"
										type="text"
										value={form.instagram ?? ''}
										oninput={(e) => {
											form.instagram = e.currentTarget.value.replace(/^@/, '');
										}}
										placeholder={m.st_handle_placeholder()}
										class="w-full rounded-xl border border-[#CCE6D6] bg-[#FAFDFB] py-2 pr-3 pl-7 text-xs text-[#0E2E25] outline-none focus:border-[#0C7B58] sm:text-sm"
									/>
								</div>
							</div>

							<div>
								<label
									for="st-tiktok-input"
									class="mb-1 flex items-center gap-1.5 text-xs font-bold text-[#184A3B]"
								>
									<img src={SOCIAL_ICONS.tiktok} alt="TikTok" class="h-4 w-4 object-contain" />
									<span>TikTok</span>
									<span class="text-[11px] font-normal text-[#698E82]"
										>{m.st_optional_suffix()}</span
									>
								</label>
								<div class="relative flex items-center">
									<span class="absolute left-3 text-xs font-semibold text-[#698E82]">@</span>
									<input
										id="st-tiktok-input"
										type="text"
										value={form.tiktok ?? ''}
										oninput={(e) => {
											form.tiktok = e.currentTarget.value.replace(/^@/, '');
										}}
										placeholder={m.st_handle_placeholder()}
										class="w-full rounded-xl border border-[#CCE6D6] bg-[#FAFDFB] py-2 pr-3 pl-7 text-xs text-[#0E2E25] outline-none focus:border-[#0C7B58] sm:text-sm"
									/>
								</div>
							</div>

							<div>
								<label
									for="st-linkedin-input"
									class="mb-1 flex items-center gap-1.5 text-xs font-bold text-[#184A3B]"
								>
									<img src={SOCIAL_ICONS.linkedin} alt="LinkedIn" class="h-4 w-4 object-contain" />
									<span>LinkedIn</span>
									<span class="text-[11px] font-normal text-[#698E82]"
										>{m.st_optional_suffix()}</span
									>
								</label>
								<input
									id="st-linkedin-input"
									type="text"
									bind:value={form.linkedin}
									placeholder={m.st_linkedin_placeholder()}
									class="w-full rounded-xl border border-[#CCE6D6] bg-[#FAFDFB] p-2.5 text-xs text-[#0E2E25] outline-none focus:border-[#0C7B58] sm:text-sm"
								/>
							</div>
						</div>
					</div>

					<div class="flex flex-col justify-between gap-4 pt-2 sm:flex-row sm:items-center">
						<div class="text-xs text-[#52776C]">
							{#if isDirty}
								<span class="flex items-center gap-1.5 font-medium text-[#B45309]">
									<Info class="h-4 w-4" />
									{m.st_unsaved_hint()}
								</span>
							{/if}
						</div>

						<button
							id="btn-save-store-profile"
							type="submit"
							disabled={!canSave}
							class={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold shadow-xs transition-all sm:text-sm ${
								isFirstTimeSeller
									? 'bg-[#0C7B58] text-white hover:bg-[#096649]'
									: canSave
										? 'bg-[#0C7B58] text-white hover:bg-[#096649]'
										: 'cursor-not-allowed border border-[#E5E7EB] bg-[#F3F4F6] text-[#9CA3AF] shadow-none'
							}`}
						>
							{#if isSaving}
								<span>{m.st_saving()}</span>
							{:else if isFirstTimeSeller}
								<span>{m.st_save_continue()}</span>
								<ArrowRight class="h-4 w-4" />
							{:else}
								<Save class="h-4 w-4" />
								<span>{m.st_save_changes()}</span>
							{/if}
						</button>
					</div>
				</form>
			</div>

			<div class="w-full space-y-3 lg:sticky lg:top-6 lg:w-[560px] lg:flex-shrink-0 max-h-[550px] overflow-scroll">
				<div class="flex items-center justify-between px-1">
					<h3 class="text-xs font-bold tracking-wider text-[#52776C] uppercase">
						{m.st_preview_label_eyebrow()}
					</h3>
				</div>

				<div class="pointer-events-none">
					<Storefront seller={previewSeller} products={activeProducts} embedded />
				</div>
			</div>
		</div>
	</PageContent>
</PageFrame>
