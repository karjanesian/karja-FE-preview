<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { getProductTypeTheme } from '$lib/domain/productTheme';
	import { scroll } from 'motion';
	import FileText from 'lucide-svelte/icons/file-text';
	import Share2 from 'lucide-svelte/icons/share-2';
	import Check from 'lucide-svelte/icons/check';
	import Copy from 'lucide-svelte/icons/copy';
	import Download from 'lucide-svelte/icons/download';
	import CheckCircle2 from 'lucide-svelte/icons/check-circle-2';
	import ShieldCheck from 'lucide-svelte/icons/shield-check';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Receipt from 'lucide-svelte/icons/receipt';
	import Globe from 'lucide-svelte/icons/globe';

	const PRODUCT_COVER_URL =
		'https://file.garden/ao1B7sLFNyZKt73m/kania/ChatGPT%20Image%20Sep%2017%2C%202026%2C%2005_18_52%20PM.png';
	const PRODUCT_PRICE_STR = 'Rp39.000';
	const PUBLIC_PRODUCT_URL = 'karja.id/kania/template-laporan-mingguan';

	const steps = [
		{ number: '01', headline: () => m.ld_e2e_s1_t(), copy: () => m.ld_e2e_s1_d() },
		{ number: '02', headline: () => m.ld_e2e_s2_t(), copy: () => m.ld_e2e_s2_d() },
		{ number: '03', headline: () => m.ld_e2e_s3_t(), copy: () => m.ld_e2e_s3_d() },
		{ number: '04', headline: () => m.ld_e2e_s4_t(), copy: () => m.ld_e2e_s4_d() },
		{ number: '05', headline: () => m.ld_e2e_s5_t(), copy: () => m.ld_e2e_s5_d() }
	];

	let introEl = $state<HTMLElement | null>(null);
	let introShown = $state(false);
	let flowEl = $state<HTMLElement | null>(null);
	let activeStep = $state(0);
	let copied = $state(true);
	let stage: 'checkout' | 'success' = $state('checkout');

	$effect(() => {
		const el = introEl;
		if (!el) return;
		const io = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) {
					introShown = true;
					io.disconnect();
				}
			},
			{ threshold: 0.3 }
		);
		io.observe(el);
		return () => io.disconnect();
	});

	$effect(() => {
		const el = flowEl;
		if (!el) return;
		return scroll(
			(p: number) => {
				const idx = Math.floor(p * 5);
				activeStep = idx < 0 ? 0 : idx > 4 ? 4 : idx;
			},
			{ target: el, offset: ['start start', 'end end'] }
		);
	});

	$effect(() => {
		const timer = setInterval(() => {
			stage = stage === 'checkout' ? 'success' : 'checkout';
		}, 4500);
		return () => clearInterval(timer);
	});

	function copyLink() {
		if (typeof navigator !== 'undefined') {
			void navigator.clipboard?.writeText?.(`https://${PUBLIC_PRODUCT_URL}`);
		}
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	const digitalTheme = $derived(getProductTypeTheme('digital'));
</script>

{#snippet chromeDots()}
	<div class="flex items-center gap-2">
		<span class="h-2.5 w-2.5 rounded-full bg-[#E2EAE5]"></span>
		<span class="h-2.5 w-2.5 rounded-full bg-[#E2EAE5]"></span>
		<span class="h-2.5 w-2.5 rounded-full bg-[#E2EAE5]"></span>
	</div>
{/snippet}

{#snippet previewProduct()}
	<div
		class="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#E4EBE7] bg-white text-left shadow-[0_8px_30px_rgba(10,38,29,0.06)] sm:rounded-3xl"
	>
		<div
			class="flex shrink-0 items-center justify-between border-b border-[#EEF3F0] bg-[#FAFDFB] px-4 py-3 text-xs text-[#52776C] sm:px-5"
		>
			<div class="flex min-w-0 items-center gap-2">
				{@render chromeDots()}
				<span class="ml-1.5 truncate font-mono text-[11px] text-[#7B9B90]">
					{PUBLIC_PRODUCT_URL}
				</span>
			</div>
			<span
				class="rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-0.5 text-[11px] font-semibold text-[#0C7B58]"
			>
				{m.ld_e2e_badge_live()}
			</span>
		</div>

		<div class="flex flex-1 flex-col justify-between space-y-4 overflow-y-auto p-5 sm:p-6">
			<div
				class="relative aspect-video max-h-[220px] w-full shrink-0 overflow-hidden rounded-xl border border-[#E4EBE7] bg-[#F4F8F6] sm:rounded-2xl"
			>
				<img
					src={PRODUCT_COVER_URL}
					alt={m.ld_pf_digital_t()}
					referrerpolicy="no-referrer"
					class="h-full w-full object-cover object-center"
				/>
				<div class="absolute top-3 left-3">
					<span
						class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold shadow-2xs {digitalTheme.badgeClass}"
					>
						<digitalTheme.icon class="h-3.5 w-3.5" />
						<span>{m[digitalTheme.labelKey]()}</span>
					</span>
				</div>
			</div>

			<div class="flex-1 space-y-2.5">
				<div class="space-y-1">
					<h3 class="text-base leading-snug font-bold tracking-tight text-[#0E2E25] sm:text-lg">
						{m.ld_pf_digital_t()}
					</h3>
					<div class="flex items-center gap-2 text-xs text-[#52776C]">
						<span>{m.ld_e2e_by({ name: 'Kania' })}</span>
						<span>·</span>
						<span class="inline-flex items-center gap-1 font-medium text-[#0C7B58]">
							<ShieldCheck class="h-3.5 w-3.5" />
							<span>{m.ld_e2e_verified()}</span>
						</span>
					</div>
				</div>

				<p class="line-clamp-2 text-xs leading-relaxed text-[#52776C] sm:text-sm">
					{m.ld_e2e_pdp_desc()}
				</p>

				<div class="flex shrink-0 items-center justify-between border-t border-[#EEF3F0] pt-2">
					<div>
						<span class="block text-[11px] font-medium text-[#7B9B90]">
							{m.ld_e2e_price_once()}
						</span>
						<span class="text-xl font-extrabold tracking-tight text-[#0E2E25] sm:text-2xl">
							{PRODUCT_PRICE_STR}
						</span>
					</div>
					<div
						class="inline-flex items-center gap-2 rounded-xl bg-[#0C7B58] px-5 py-2.5 text-xs font-bold text-white shadow-xs sm:text-sm"
					>
						<span>{m.ld_e2e_buy_cta({ price: PRODUCT_PRICE_STR })}</span>
					</div>
				</div>
			</div>
		</div>
	</div>
{/snippet}

{#snippet previewShare()}
	<div
		class="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#E4EBE7] bg-white text-left shadow-[0_8px_30px_rgba(10,38,29,0.06)] sm:rounded-3xl"
	>
		<div
			class="flex shrink-0 items-center justify-between border-b border-[#EEF3F0] bg-[#FAFDFB] px-4 py-3 text-xs text-[#52776C] sm:px-5"
		>
			<div class="flex min-w-0 items-center gap-2">
				{@render chromeDots()}
				<span class="ml-1.5 truncate font-mono text-[11px] text-[#7B9B90]">
					{PUBLIC_PRODUCT_URL}
				</span>
			</div>
			<span
				class="rounded-full bg-[#E8F5F0] px-2.5 py-0.5 text-[11px] font-semibold text-[#0C7B58]"
			>
				{m.ld_e2e_badge_ready()}
			</span>
		</div>

		<div class="flex flex-1 flex-col justify-between space-y-4 overflow-y-auto p-5 sm:p-6">
			<div
				class="flex shrink-0 items-center gap-3 rounded-xl border border-[#E4EBE7] bg-[#FAFDFB] p-3.5"
			>
				<div class="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#D8E6DF]">
					<img
						src={PRODUCT_COVER_URL}
						alt={m.ld_pf_digital_t()}
						class="h-full w-full object-cover object-center"
						referrerpolicy="no-referrer"
					/>
				</div>
				<div class="min-w-0 flex-1">
					<h4 class="truncate text-xs font-bold text-[#0E2E25] sm:text-sm">
						{m.ld_pf_digital_t()}
					</h4>
					<div class="mt-0.5 flex items-center gap-2 text-[11px] text-[#52776C]">
						<span class="font-bold text-[#0C7B58]">{PRODUCT_PRICE_STR}</span>
						<span>·</span>
						<span>{m.ld_e2e_active_store()}</span>
					</div>
				</div>
			</div>

			<div class="shrink-0 space-y-1.5">
				<span class="font-mono text-[11px] tracking-wider text-[#7B9B90] uppercase">
					{m.ld_e2e_link_label()}
				</span>
				<div
					class="flex items-center justify-between rounded-xl border border-[#CCE6D6] bg-[#F4F8F6] p-3.5"
				>
					<span class="mr-2 truncate font-mono text-xs font-semibold text-[#0E2E25] sm:text-sm">
						{PUBLIC_PRODUCT_URL}
					</span>
					<button
						type="button"
						onclick={copyLink}
						class="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-[#0C7B58] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-[#096649]"
					>
						{#if copied}
							<Check class="h-3.5 w-3.5" />
							<span>{m.ld_e2e_copied()}</span>
						{:else}
							<Copy class="h-3.5 w-3.5" />
							<span>{m.common_copy_link()}</span>
						{/if}
					</button>
				</div>
			</div>

			<div class="space-y-2">
				<span class="text-[11px] font-semibold text-[#52776C]">{m.ld_e2e_share_to()}</span>
				<div class="grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-2">
					<div
						class="flex items-center gap-2.5 rounded-xl border border-[#E4EBE7] bg-[#FAFDFB] p-3"
					>
						<div
							class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8F5F0] text-[#0C7B58]"
						>
							<Share2 class="h-4 w-4" />
						</div>
						<div class="min-w-0">
							<div class="font-bold text-[#0E2E25]">{m.ld_e2e_wa_title()}</div>
							<div class="truncate text-[11px] text-[#52776C]">{m.ld_e2e_wa_desc()}</div>
						</div>
					</div>
					<div
						class="flex items-center gap-2.5 rounded-xl border border-[#E4EBE7] bg-[#FAFDFB] p-3"
					>
						<div
							class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F3F4F6] text-[#374151]"
						>
							<Globe class="h-4 w-4" />
						</div>
						<div class="min-w-0">
							<div class="font-bold text-[#0E2E25]">{m.ld_e2e_bio_title()}</div>
							<div class="truncate text-[11px] text-[#52776C]">{m.ld_e2e_bio_desc()}</div>
						</div>
					</div>
				</div>
			</div>

			<div
				class="flex shrink-0 items-start gap-2 rounded-xl border border-[#E4EBE7] bg-[#FAFDFB] p-3 text-[11px] text-[#52776C]"
			>
				<CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0 text-[#0C7B58]" />
				<p>{m.ld_e2e_share_note()}</p>
			</div>
		</div>
	</div>
{/snippet}

{#snippet previewCheckout()}
	<div
		class="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#E4EBE7] bg-white text-left shadow-[0_8px_30px_rgba(10,38,29,0.06)] sm:rounded-3xl"
	>
		<div
			class="flex shrink-0 items-center justify-between border-b border-[#EEF3F0] bg-[#FAFDFB] px-4 py-3 sm:px-5"
		>
			<div class="flex min-w-0 items-center gap-2">
				{@render chromeDots()}
				<span class="ml-1 truncate text-xs font-bold text-[#0E2E25]">
					{stage === 'checkout' ? m.ld_e2e_stage_checkout() : m.ld_e2e_stage_access()}
				</span>
			</div>
			<div class="inline-flex rounded-lg bg-[#EAEFEA] p-0.5 text-[10px] font-bold">
				<button
					type="button"
					onclick={() => (stage = 'checkout')}
					class="cursor-pointer rounded-md px-2 py-1 transition-colors {stage === 'checkout'
						? 'bg-white text-[#0E2E25] shadow-2xs'
						: 'text-[#6E7873]'}"
				>
					{m.ld_e2e_tab_form()}
				</button>
				<button
					type="button"
					onclick={() => (stage = 'success')}
					class="cursor-pointer rounded-md px-2 py-1 transition-colors {stage === 'success'
						? 'bg-white text-[#0C7B58] shadow-2xs'
						: 'text-[#6E7873]'}"
				>
					{m.ld_e2e_tab_access()}
				</button>
			</div>
		</div>

		<div class="flex-1 overflow-y-auto p-5 sm:p-6">
			{#key stage}
				<div class="e2e-swap flex flex-1 flex-col justify-between space-y-3.5 text-left">
					{#if stage === 'checkout'}
						<div
							class="flex shrink-0 items-center justify-between rounded-xl border border-[#CCE6D6] bg-[#FAFDFB] p-3"
						>
							<div class="min-w-0 pr-2">
								<div class="truncate text-xs font-bold text-[#0E2E25] sm:text-sm">
									{m.ld_pf_digital_t()}
								</div>
								<div class="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#4A7264]">
									<span class="font-medium">{m.common_type_digital()}</span>
									<span class="text-[#B0CCC1]">·</span>
									<span>{m.ld_e2e_auto_send()}</span>
								</div>
							</div>
							<div class="shrink-0 text-sm font-extrabold text-[#0C7B58] sm:text-base">
								{PRODUCT_PRICE_STR}
							</div>
						</div>

						<div class="space-y-2.5 text-xs">
							<div class="space-y-1">
								<span class="text-[11px] font-bold text-[#184A3B]">{m.ld_e2e_f_name()}</span>
								<div
									class="w-full rounded-xl border border-[#CCE6D6] bg-white px-3 py-2 font-medium text-[#0E2E25]"
								>
									Dion Pratama
								</div>
							</div>

							<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
								<div class="space-y-1">
									<span class="text-[11px] font-bold text-[#184A3B]">
										{m.ld_e2e_f_email()}
									</span>
									<div
										class="w-full truncate rounded-xl border border-[#CCE6D6] bg-white px-3 py-2 font-medium text-[#0E2E25]"
									>
										dion.pratama@gmail.com
									</div>
								</div>
								<div class="space-y-1">
									<span class="text-[11px] font-bold text-[#184A3B]">
										{m.ld_e2e_f_phone()}
									</span>
									<div
										class="w-full rounded-xl border border-[#CCE6D6] bg-white px-3 py-2 font-medium text-[#0E2E25]"
									>
										0812-8899-2311
									</div>
								</div>
							</div>
						</div>

						<div class="shrink-0 pt-2">
							<div
								class="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0C7B58] py-3 text-center text-xs font-bold text-white shadow-xs sm:text-sm"
							>
								<span>{m.ld_e2e_pay_cta({ price: PRODUCT_PRICE_STR })}</span>
								<ArrowRight class="h-4 w-4" />
							</div>
							<div
								class="mt-2 flex items-center justify-center gap-1.5 text-center text-[10px] text-[#7B9B90]"
							>
								<ShieldCheck class="h-3.5 w-3.5 text-[#0C7B58]" />
								<span>{m.ld_e2e_pay_secure()}</span>
							</div>
						</div>
					{:else}
						<div
							class="flex shrink-0 items-center gap-3.5 rounded-2xl border border-[#CCE6D6] bg-[#F2FAF5] p-3.5"
						>
							<div
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0C7B58] text-white"
							>
								<Check class="h-5 w-5" />
							</div>
							<div>
								<h4 class="text-sm font-bold text-[#0A3D2E]">{m.ld_e2e_paid_title()}</h4>
								<p class="text-xs text-[#4A7264]">{m.ld_e2e_paid_desc()}</p>
							</div>
						</div>

						<div class="space-y-2 rounded-2xl border border-[#CCE6D6] bg-[#FAFDFB] p-3.5">
							<span class="block text-xs font-bold text-[#0A3D2E]">
								{m.ld_e2e_access_label()}
							</span>
							<div
								class="flex items-center justify-between rounded-xl border border-[#CCE6D6] bg-white p-3"
							>
								<div class="flex min-w-0 items-center gap-2.5 pr-2">
									<FileText class="h-4 w-4 shrink-0 text-[#0C7B58]" />
									<span class="truncate font-mono text-xs font-medium text-[#0E2E25]">
										Template_Laporan_Mingguan.xlsx
									</span>
								</div>
								<div
									class="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0C7B58] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs"
								>
									<Download class="h-3.5 w-3.5" />
									<span>{m.ld_e2e_download()}</span>
								</div>
							</div>
						</div>

						<div
							class="shrink-0 rounded-xl border border-[#E4EBE7] bg-[#FAFDFB] p-3 text-[11px] text-[#52776C]"
						>
							{m.ld_e2e_receipt_note({ email: 'dion.pratama@gmail.com' })}
						</div>
					{/if}
				</div>
			{/key}
		</div>
	</div>
{/snippet}

{#snippet previewOrder()}
	<div
		class="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#E4EBE7] bg-white text-left shadow-[0_8px_30px_rgba(10,38,29,0.06)] sm:rounded-3xl"
	>
		<div
			class="flex shrink-0 items-center justify-between border-b border-[#EEF3F0] bg-[#FAFDFB] px-4 py-3 sm:px-5"
		>
			<div class="flex min-w-0 items-center gap-2">
				{@render chromeDots()}
				<span class="ml-1 truncate text-xs font-bold text-[#0E2E25]">{m.ld_e2e_ord_header()}</span>
			</div>
			<span
				class="rounded-full bg-[#E8F5F0] px-2.5 py-0.5 text-[11px] font-semibold text-[#0C7B58]"
			>
				{m.ld_e2e_ord_badge()}
			</span>
		</div>

		<div class="flex flex-1 flex-col justify-between space-y-4 overflow-y-auto p-5 sm:p-6">
			<div
				class="flex shrink-0 items-center justify-between border-b border-[#EEF3F0] pb-3 text-xs"
			>
				<div class="flex items-center gap-2">
					<span class="text-[#7B9B90]">{m.ld_e2e_filter()}</span>
					<span class="rounded-lg bg-[#E8F5F0] px-2.5 py-1 text-xs font-bold text-[#0C7B58]">
						{m.ld_e2e_all_count({ count: 1 })}
					</span>
				</div>
				<span class="font-mono text-[11px] text-[#7B9B90]">{m.ld_e2e_realtime()}</span>
			</div>

			<div
				class="space-y-3.5 rounded-2xl border border-[#CCE6D6] bg-[#FAFDFB] p-4 shadow-2xs sm:p-5"
			>
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0 space-y-1">
						<h4 class="text-sm font-bold tracking-tight text-[#0E2E25] sm:text-base">
							{m.ld_pf_digital_t()}
						</h4>
						<div class="text-xs font-semibold text-[#185343]">
							Dion Pratama <span class="font-normal text-[#7B9B90]">(dion.pratama@gmail.com)</span>
						</div>
					</div>
					<span
						class="shrink-0 rounded-full border border-[#CCE6D6] bg-[#E8F5F0] px-2.5 py-1 text-[10px] font-bold text-[#0C7B58]"
					>
						{m.ld_e2e_paid()}
					</span>
				</div>

				<div class="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#52776C]">
					<span
						class="inline-flex items-center gap-1 rounded-md border border-[#BFDBFE] bg-[#EFF6FF] px-2 py-0.5 text-[11px] font-semibold text-[#1D4ED8]"
					>
						<FileText class="h-3 w-3" />
						<span>{m.common_type_digital()}</span>
					</span>

					<span class="text-[#B0CCC1]">·</span>

					<span class="font-medium text-[#20493C]">{m.ld_e2e_auto_access()}</span>

					<span class="text-[#B0CCC1]">·</span>

					<span class="font-bold text-[#0E2E25]">{PRODUCT_PRICE_STR}</span>

					<span class="text-[#B0CCC1]">·</span>

					<span class="font-mono text-[11px] text-[#7B9B90]">#KJ-88219</span>
				</div>

				<div class="flex items-center justify-between border-t border-[#E8ECE9] pt-3 text-xs">
					<div class="flex items-center gap-1.5 text-[11px] font-medium text-[#0C7B58]">
						<CheckCircle2 class="h-3.5 w-3.5 shrink-0" />
						<span>{m.ld_e2e_auto_done()}</span>
					</div>
					<span class="font-mono text-[11px] text-[#7B9B90]">{m.common_time_new()}</span>
				</div>
			</div>

			<div
				class="shrink-0 rounded-xl border border-[#E4EBE7] bg-white p-3 text-[11px] text-[#52776C]"
			>
				{m.ld_e2e_ord_note()}
			</div>
		</div>
	</div>
{/snippet}

{#snippet previewMoney()}
	<div
		class="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#E4EBE7] bg-white text-left shadow-[0_8px_30px_rgba(10,38,29,0.06)] sm:rounded-3xl"
	>
		<div
			class="flex shrink-0 items-center justify-between border-b border-[#EEF3F0] bg-[#FAFDFB] px-4 py-3 sm:px-5"
		>
			<div class="flex min-w-0 items-center gap-2">
				{@render chromeDots()}
				<span class="ml-1 truncate text-xs font-bold text-[#0E2E25]">{m.ld_e2e_money_header()}</span
				>
			</div>
			<span
				class="rounded-full bg-[#E8F5F0] px-2.5 py-0.5 text-[11px] font-semibold text-[#0C7B58]"
			>
				{m.ld_e2e_money_badge()}
			</span>
		</div>

		<div class="flex flex-1 flex-col justify-between space-y-4 overflow-y-auto p-5 sm:p-6">
			<div class="grid shrink-0 grid-cols-1 gap-4 border-b border-[#EEF3F0] pb-4 sm:grid-cols-3">
				<div class="space-y-1 sm:border-r sm:border-[#EEF3F0] sm:pr-4">
					<span class="block text-xs font-semibold text-[#52776C]">{m.ld_e2e_bal_avail()}</span>
					<div class="text-xl font-extrabold tracking-tight text-[#0C7B58] sm:text-2xl">
						Rp37.050
					</div>
					<p class="text-[11px] leading-snug text-[#52776C]">{m.ld_e2e_bal_avail_note()}</p>
				</div>

				<div class="space-y-1 sm:border-r sm:border-[#EEF3F0] sm:px-4">
					<span class="block text-xs font-semibold text-[#52776C]">{m.ld_e2e_bal_proc()}</span>
					<div class="text-xl font-extrabold tracking-tight text-[#0E2E25] sm:text-2xl">Rp0</div>
					<p class="text-[11px] leading-snug text-[#52776C]">{m.ld_e2e_bal_proc_note()}</p>
				</div>

				<div class="space-y-1 sm:pl-4">
					<span class="block text-xs font-semibold text-[#52776C]">{m.ld_e2e_bal_total()}</span>
					<div class="text-xl font-extrabold tracking-tight text-[#0E2E25] sm:text-2xl">
						Rp39.000
					</div>
					<p class="text-[11px] leading-snug text-[#52776C]">{m.ld_e2e_bal_total_note()}</p>
				</div>
			</div>

			<div class="space-y-2.5 rounded-2xl border border-[#CCE6D6] bg-[#FAFDFB] p-4 text-xs">
				<div class="flex items-center justify-between font-bold text-[#0E2E25]">
					<span class="flex items-center gap-1.5">
						<Receipt class="h-3.5 w-3.5 text-[#0C7B58]" />
						<span>{m.ld_e2e_trx_detail({ id: '#KJ-88219' })}</span>
					</span>
					<span class="font-mono text-[#0C7B58]">{m.ld_e2e_trx_done()}</span>
				</div>

				<div class="space-y-1 border-t border-[#E8ECE9] pt-1 text-[11px] text-[#52776C]">
					<div class="flex justify-between">
						<span>{m.ld_e2e_trx_sale({ title: m.ld_pf_digital_t() })}</span>
						<span class="font-semibold text-[#0E2E25]">{PRODUCT_PRICE_STR}</span>
					</div>
					<div class="flex justify-between">
						<span>{m.ld_e2e_trx_fee()}</span>
						<span class="font-semibold text-[#0E2E25]">-Rp1.950</span>
					</div>
					<div class="flex justify-between border-t border-[#EEF3F0] pt-1 font-bold text-[#0E2E25]">
						<span class="text-[#0C7B58]">{m.ld_e2e_trx_net()}</span>
						<span class="font-extrabold text-[#0C7B58]">Rp37.050</span>
					</div>
				</div>
			</div>

			<div class="flex shrink-0 items-center justify-between pt-1">
				<div class="text-[11px] text-[#52776C]">{m.ld_e2e_payout_note()}</div>
				<div
					class="inline-flex items-center gap-1.5 rounded-xl bg-[#0C7B58] px-4 py-2 text-xs font-bold text-white shadow-xs"
				>
					<span>{m.ld_e2e_withdraw()}</span>
					<ArrowRight class="h-3.5 w-3.5" />
				</div>
			</div>
		</div>
	</div>
{/snippet}

{#snippet stageView(index: number)}
	{#if index === 0}
		{@render previewProduct()}
	{:else if index === 1}
		{@render previewShare()}
	{:else if index === 2}
		{@render previewCheckout()}
	{:else if index === 3}
		{@render previewOrder()}
	{:else}
		{@render previewMoney()}
	{/if}
{/snippet}

<section id="alur-karja" class="border-t border-[#E8ECE9] bg-white py-24 sm:py-32 lg:py-36">
	<div class="mx-auto max-w-7xl space-y-16 px-4 sm:space-y-24 sm:px-6 lg:px-8">
		<div
			bind:this={introEl}
			class="max-w-3xl space-y-4 text-left transition-all duration-700 ease-out sm:space-y-5 {introShown
				? 'translate-y-0 opacity-100'
				: 'translate-y-5 opacity-0'}"
		>
			<h2 class="landing-heading text-[#0A261D]">{m.ld_e2e_h2()}</h2>
			<p class="landing-lead max-w-2xl text-[#4A5852]">{m.ld_e2e_lead()}</p>
		</div>

		<div bind:this={flowEl} class="relative hidden md:block">
			<div class="grid grid-cols-12 items-start gap-8 lg:gap-12">
				<div class="col-span-5 space-y-24 py-12 lg:space-y-32">
					{#each steps as step, i (step.number)}
						<div
							class="flex min-h-[50vh] flex-col justify-center transition-all duration-300 {activeStep ===
							i
								? 'opacity-100'
								: 'opacity-35'}"
						>
							<div
								class="space-y-3 border-l-2 pl-6 transition-colors duration-300"
								style="border-color: {activeStep === i ? '#0C7B58' : '#D5E0DA'};"
							>
								<span
									class="font-mono text-xs font-bold tracking-widest uppercase transition-colors duration-300 {activeStep ===
									i
										? 'text-[#0C7B58]'
										: 'text-[#7B9B90]'}"
								>
									{step.number}
								</span>
								<h3 class="landing-subheading text-[#0A261D]">{step.headline()}</h3>
								<p class="max-w-sm text-base leading-relaxed text-[#4A5852]">
									{step.copy()}
								</p>
							</div>
						</div>
					{/each}
				</div>

				<div class="sticky top-24 col-span-7 pb-12 lg:top-28">
					<div class="h-[540px] min-h-[500px] w-full lg:h-[min(620px,calc(100svh-160px))]">
						{#key activeStep}
							<div class="e2e-stage-swap h-full w-full">
								{@render stageView(activeStep)}
							</div>
						{/key}
					</div>
				</div>
			</div>
		</div>

		<div class="space-y-16 md:hidden">
			{#each steps as step, i (step.number)}
				<div class="space-y-5 border-t border-[#EEF3F0] pt-8 text-left first:border-t-0 first:pt-0">
					<div class="space-y-2">
						<span class="font-mono text-xs font-bold tracking-widest text-[#0C7B58] uppercase">
							{step.number}
						</span>
						<h3 class="landing-subheading text-[#0A261D]">{step.headline()}</h3>
						<p class="text-sm leading-relaxed text-[#4A5852]">{step.copy()}</p>
					</div>

					<div class="h-[520px] min-h-[480px] w-full pt-2 sm:h-[540px]">
						{@render stageView(i)}
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<style>
	.e2e-swap {
		animation: e2e-swap-in 0.25s cubic-bezier(0.21, 0.47, 0.32, 0.98) both;
	}
	@keyframes e2e-swap-in {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	.e2e-stage-swap {
		animation: e2e-stage-in 0.35s cubic-bezier(0.21, 0.47, 0.32, 0.98) both;
	}
	@keyframes e2e-stage-in {
		from {
			opacity: 0;
			transform: translateY(10px) scale(0.985);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
</style>
