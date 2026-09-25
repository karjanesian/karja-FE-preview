<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		formatRupiah,
		getContextualAudiences,
		getContextualProblems,
		generateDynamicWizardIdeas
	} from '$lib/data/mockData';
	import { getVisualAsset } from '$lib/domain/visualAssets';
	import * as m from '$lib/paraglide/messages.js';
	import type { Product, ProductType } from '$lib/types';
	import PlatformStateVisual from '$lib/components/common/PlatformStateVisual.svelte';
	import ProductTypeMeta from '$lib/components/common/ProductTypeMeta.svelte';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import SquarePen from 'lucide-svelte/icons/square-pen';

	type Props = {
		oncomplete?: (draft: Partial<Product>) => void;
	};
	let { oncomplete }: Props = $props();

	let step = $state<1 | 2 | 3 | 4>(1);
	let skillInput = $state('');
	let targetAudience = $state('');
	let problemSolved = $state('');
	let selectedFormat = $state<'session' | 'digital' | 'service'>('session');

	const exampleCards = $derived([
		{ category: m.pc_w_s1_ex1_cat(), quote: m.pc_w_s1_ex1_quote(), value: m.pc_w_s1_ex1_val() },
		{ category: m.pc_w_s1_ex2_cat(), quote: m.pc_w_s1_ex2_quote(), value: m.pc_w_s1_ex2_val() },
		{ category: m.pc_w_s1_ex3_cat(), quote: m.pc_w_s1_ex3_quote(), value: m.pc_w_s1_ex3_val() },
		{ category: m.pc_w_s1_ex4_cat(), quote: m.pc_w_s1_ex4_quote(), value: m.pc_w_s1_ex4_val() },
		{ category: m.pc_w_s1_ex5_cat(), quote: m.pc_w_s1_ex5_quote(), value: m.pc_w_s1_ex5_val() }
	]);

	const audienceChips = $derived(getContextualAudiences(skillInput));
	const problemChips = $derived(getContextualProblems(skillInput, targetAudience));

	const activeSuggestions = $derived(
		generateDynamicWizardIdeas(skillInput || 'Keahlian praktis', targetAudience, problemSolved)
	);

	const formatSummary = $derived(
		selectedFormat === 'digital'
			? { title: activeSuggestions.digital.title, price: activeSuggestions.digital.price }
			: selectedFormat === 'service'
				? { title: activeSuggestions.service.title, price: activeSuggestions.service.price }
				: { title: activeSuggestions.session.title, price: activeSuggestions.session.price }
	);

	function goPrevOrExit() {
		if (step > 1) {
			step = (step - 1) as 1 | 2 | 3 | 4;
		} else {
			void goto('/dashboard/products');
		}
	}

	function completeDraft(draft: Partial<Product>) {
		if (oncomplete) {
			oncomplete(draft);
		} else {
			void goto('/dashboard/products');
		}
	}

	function handleSelectOptionAndProceed(
		type: ProductType,
		title: string,
		price: number,
		description: string,
		subtype?: string
	) {
		const slugBase = title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '');
		const cleanAudience =
			targetAudience.trim() || 'Orang yang ingin menyelesaikan kebutuhan ini lebih cepat dan rapi.';
		const cleanProblem =
			problemSolved.trim() ||
			'Bingung harus mulai dari mana dan membutuhkan solusi yang langsung bisa diterapkan.';

		const draft: Partial<Product> = {
			id: `prod_${Date.now()}`,
			title: title,
			slug: slugBase || `produk-${Date.now()}`,
			type: type,
			productSubtype: subtype,
			category: type === 'session' ? 'Sesi' : type === 'digital' ? 'Produk digital' : 'Layanan',
			price: price,
			priceMode: 'fixed',
			visibility: 'link_only',
			status: 'draft',
			images: [],
			coverEmoji: type === 'digital' ? '📄' : type === 'session' ? '💬' : '💼',
			shortDescription: description,
			targetAudience: cleanAudience,
			problemSolved: cleanProblem,
			whatYouGet: description,
			howItWorks:
				type === 'session'
					? 'Pembeli pilih jadwal dan isi kebutuhan singkat. Detail sesi dan link Google Meet muncul di pesanan.'
					: type === 'digital'
						? 'Setelah pembayaran berhasil, pembeli langsung dapat file atau link yang kamu siapkan.'
						: 'Pembeli kirim brief dan materi. Kamu kerjakan sesuai scope, lalu kirim hasilnya lewat Karja.',
			aboutCreator: '',
			faqs: [
				{
					id: 'faq_1',
					question:
						type === 'session'
							? 'Bagaimana jika jadwal bentrok?'
							: type === 'digital'
								? 'Format apa yang didapat?'
								: 'Berapa lama pengerjaannya?',
					answer:
						type === 'session'
							? 'Bisa konfirmasi reschedule maksimal 1x dengan memberitahu sebelum sesi dimulai.'
							: type === 'digital'
								? 'Format dokumen standar yang bisa langsung dibuka di laptop maupun ponsel.'
								: 'Waktu pengerjaan disesuaikan dengan materi dan kesepakatan di awal.'
				}
			],
			sessionDurationMinutes: type === 'session' ? 30 : undefined,
			sessionPlatform: type === 'session' ? 'Google Meet' : undefined,
			sessionBookingNote:
				type === 'session' ? 'Pembeli pilih jadwal dari waktu yang kamu sediakan.' : undefined,
			sessionPrepNote:
				type === 'session' ? 'Apa topik utama atau kendala yang ingin kamu bahas?' : undefined,

			digitalDeliveryType: type === 'digital' ? 'upload' : undefined,
			fileDownloadName: type === 'digital' ? `${title.replace(/\s+/g, '_')}.xlsx` : undefined,
			fileSize: type === 'digital' ? '2.4 MB' : undefined,
			accessInstructions:
				type === 'digital'
					? 'Download file langsung melalui tombol di layar konfirmasi.'
					: undefined,

			serviceTimelineDays: undefined,
			serviceRevisions: type === 'service' ? 1 : undefined,
			serviceDeliverables: type === 'service' ? description : undefined,
			serviceBuyerInputsRequired:
				type === 'service' ? 'Kirimkan tautan atau file draft yang ingin dibantu.' : undefined,

			views: 0,
			sales: 0,
			revenue: 0,
			buyClicks: 0,
			createdAt: 'Hari ini'
		};

		completeDraft(draft);
	}
</script>

<div class="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
	<div class="flex items-center justify-between">
		<button
			type="button"
			onclick={goPrevOrExit}
			class="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#52776C] transition-colors hover:text-[#0E2E25] sm:text-sm"
		>
			<ArrowLeft class="h-4 w-4" />
			<span>{step > 1 ? m.common_back() : m.pc_wizard_exit()}</span>
		</button>

		<div class="flex items-center gap-3">
			<span class="text-xs font-semibold text-[#52776C]">{m.pc_wizard_step_counter({ step })}</span>
			<div class="h-1.5 w-24 overflow-hidden rounded-full bg-[#E8EFEA]">
				<div
					class="h-full rounded-full bg-[#008A5E] transition-all duration-300"
					style={`width: ${(step / 4) * 100}%`}
				></div>
			</div>
		</div>
	</div>

	<div class="flex flex-col items-start gap-6 sm:gap-8 lg:flex-row">
		<!-- LEFT COLUMN -->
		<div class="w-full min-w-0 lg:flex-1">
			{#if step === 1}
				<div
					id="wizard-step-1"
					class="space-y-6 rounded-2xl border border-[#E5ECE7] bg-white p-6 shadow-2xs sm:p-8"
				>
					<div class="space-y-2">
						<span class="block text-[11px] font-bold tracking-wider text-[#008A5E] uppercase">
							{m.pc_w_s1_eyebrow()}
						</span>
						<h2
							class="text-2xl leading-tight font-bold tracking-tight text-[#0E2E25] sm:text-[28px]"
						>
							{m.pc_w_s1_title()}
						</h2>
						<p class="max-w-xl text-sm leading-relaxed text-[#52776C]">{m.pc_w_s1_desc()}</p>
					</div>

					<div class="space-y-2.5 pt-1">
						<p class="block text-xs font-semibold text-[#305749]">
							{m.pc_w_s1_examples_label()}
						</p>
						<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
							{#each exampleCards as card (card.category)}
								<button
									type="button"
									onclick={() => (skillInput = card.value)}
									class="cursor-pointer rounded-xl border p-3.5 text-left transition-all {skillInput ===
									card.value
										? 'border-[#008A5E] bg-[#F4F9F6] text-[#0E2E25] ring-1 ring-[#008A5E]'
										: 'border-[#E5ECE7] bg-white hover:border-[#BED6C8] hover:bg-[#FAFDFB]'}"
								>
									<div class="text-xs font-bold text-[#0E2E25]">{card.category}</div>
									<div class="mt-0.5 text-xs leading-snug text-[#52776C]">“{card.quote}”</div>
								</button>
							{/each}
						</div>
					</div>

					<div class="space-y-2 pt-1">
						<label for="w-s1-input" class="block text-xs font-semibold text-[#184A3B]"
							>{m.pc_w_s1_input_label()}</label
						>
						<textarea
							id="w-s1-input"
							rows={3}
							placeholder={m.pc_w_s1_input_placeholder()}
							bind:value={skillInput}
							class="w-full rounded-2xl border border-[#DCECE1] bg-white p-4 text-sm leading-relaxed text-[#0E2E25] transition-all placeholder:text-[#8DA69B] hover:border-[#BED6C8] focus:border-[#008A5E] focus:ring-1 focus:ring-[#008A5E] focus:outline-none"
						></textarea>
					</div>

					<div class="flex items-center justify-between border-t border-[#F0F5F2] pt-4">
						<p class="hidden text-xs text-[#8DA69B] sm:block">{m.pc_w_s1_footer()}</p>
						<button
							type="button"
							disabled={!skillInput.trim()}
							onclick={() => (step = 2)}
							class="ml-auto inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-xs font-semibold transition-all sm:text-sm {skillInput.trim()
								? 'bg-[#008A5E] text-white shadow-2xs hover:bg-[#007550]'
								: 'cursor-not-allowed bg-[#E9F0EC] text-[#8DA69B]'}"
						>
							<span>{m.pc_w_next()}</span>
							<ArrowRight class="h-4 w-4" />
						</button>
					</div>
				</div>
			{:else if step === 2}
				<div class="space-y-6 rounded-2xl border border-[#E5ECE7] bg-white p-6 shadow-2xs sm:p-8">
					<div
						class="flex items-center justify-between gap-3 rounded-xl border border-[#E2EEE6] bg-[#F6FAF7] px-4 py-2.5 text-xs text-[#205847]"
					>
						<div class="truncate">
							<span class="font-semibold text-[#0E2E25]">{m.pc_w_context_helped_label()}</span>
							“{skillInput}”
						</div>
						<button
							type="button"
							onclick={() => (step = 1)}
							class="inline-flex flex-shrink-0 cursor-pointer items-center gap-1 text-[11px] font-semibold text-[#008A5E] hover:underline"
						>
							<SquarePen class="h-3 w-3" />
							<span>{m.pc_w_edit()}</span>
						</button>
					</div>

					<div class="space-y-2">
						<span class="block text-[11px] font-bold tracking-wider text-[#008A5E] uppercase">
							{m.pc_w_s2_eyebrow()}
						</span>
						<h2
							class="text-2xl leading-tight font-bold tracking-tight text-[#0E2E25] sm:text-[28px]"
						>
							{m.pc_w_s2_title()}
						</h2>
						<p class="max-w-xl text-sm leading-relaxed text-[#52776C]">{m.pc_w_s2_desc()}</p>
					</div>

					<div class="space-y-2.5 pt-1">
						<p class="block text-xs font-semibold text-[#305749]">{m.pc_w_s2_chips_label()}</p>
						<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
							{#each audienceChips as chip (chip)}
								<button
									type="button"
									onclick={() => (targetAudience = chip)}
									class="cursor-pointer rounded-xl border p-3 text-left transition-all {targetAudience ===
									chip
										? 'border-[#008A5E] bg-[#F4F9F6] font-semibold text-[#0E2E25] ring-1 ring-[#008A5E]'
										: 'border-[#E5ECE7] bg-white text-[#305749] hover:border-[#BED6C8] hover:bg-[#FAFDFB]'}"
								>
									<div class="text-xs">{chip}</div>
								</button>
							{/each}
						</div>
					</div>

					<div class="space-y-2 pt-1">
						<label for="w-s2-input" class="block text-xs font-semibold text-[#184A3B]"
							>{m.pc_w_s2_input_label()}</label
						>
						<input
							id="w-s2-input"
							type="text"
							placeholder={m.pc_w_s2_input_placeholder()}
							bind:value={targetAudience}
							class="w-full rounded-2xl border border-[#DCECE1] bg-white p-4 text-sm text-[#0E2E25] transition-all placeholder:text-[#8DA69B] hover:border-[#BED6C8] focus:border-[#008A5E] focus:ring-1 focus:ring-[#008A5E] focus:outline-none"
						/>
					</div>

					<div class="flex items-center justify-between border-t border-[#F0F5F2] pt-4">
						<button
							type="button"
							onclick={() => (step = 1)}
							class="cursor-pointer px-4 py-2 text-xs font-semibold text-[#52776C] hover:text-[#0E2E25]"
						>
							{m.common_back()}
						</button>
						<button
							type="button"
							disabled={!targetAudience.trim()}
							onclick={() => (step = 3)}
							class="inline-flex cursor-pointer items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-semibold transition-all sm:text-sm {targetAudience.trim()
								? 'bg-[#008A5E] text-white shadow-2xs hover:bg-[#007550]'
								: 'cursor-not-allowed bg-[#E9F0EC] text-[#8DA69B]'}"
						>
							<span>{m.pc_w_next()}</span>
							<ArrowRight class="h-4 w-4" />
						</button>
					</div>
				</div>
			{:else if step === 3}
				<div class="space-y-6 rounded-2xl border border-[#E5ECE7] bg-white p-6 shadow-2xs sm:p-8">
					<div
						class="flex items-center justify-between gap-3 rounded-xl border border-[#E2EEE6] bg-[#F6FAF7] px-4 py-2.5 text-xs text-[#205847]"
					>
						<div class="truncate">
							<span class="font-semibold text-[#0E2E25]">{m.pc_w_context_helped_label()}</span>
							“{skillInput}” •
							<span class="font-semibold text-[#0E2E25]">{m.pc_w_context_for_label()}</span>
							“{targetAudience}”
						</div>
						<button
							type="button"
							onclick={() => (step = 2)}
							class="inline-flex flex-shrink-0 cursor-pointer items-center gap-1 text-[11px] font-semibold text-[#008A5E] hover:underline"
						>
							<SquarePen class="h-3 w-3" />
							<span>{m.pc_w_edit()}</span>
						</button>
					</div>

					<div class="space-y-2">
						<span class="block text-[11px] font-bold tracking-wider text-[#008A5E] uppercase">
							{m.pc_w_s3_eyebrow()}
						</span>
						<h2
							class="text-2xl leading-tight font-bold tracking-tight text-[#0E2E25] sm:text-[28px]"
						>
							{m.pc_w_s3_title()}
						</h2>
						<p class="max-w-xl text-sm leading-relaxed text-[#52776C]">{m.pc_w_s3_desc()}</p>
					</div>

					<div class="space-y-2.5 pt-1">
						<p class="block text-xs font-semibold text-[#305749]">{m.pc_w_s3_chips_label()}</p>
						<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
							{#each problemChips as chip (chip)}
								<button
									type="button"
									onclick={() => (problemSolved = chip)}
									class="cursor-pointer rounded-xl border p-3 text-left transition-all {problemSolved ===
									chip
										? 'border-[#008A5E] bg-[#F4F9F6] font-semibold text-[#0E2E25] ring-1 ring-[#008A5E]'
										: 'border-[#E5ECE7] bg-white text-[#305749] hover:border-[#BED6C8] hover:bg-[#FAFDFB]'}"
								>
									<div class="text-xs">{chip}</div>
								</button>
							{/each}
						</div>
					</div>

					<div class="space-y-2 pt-1">
						<label for="w-s3-input" class="block text-xs font-semibold text-[#184A3B]"
							>{m.pc_w_s3_input_label()}</label
						>
						<textarea
							id="w-s3-input"
							rows={3}
							placeholder={m.pc_w_s3_input_placeholder()}
							bind:value={problemSolved}
							class="w-full rounded-2xl border border-[#DCECE1] bg-white p-4 text-sm leading-relaxed text-[#0E2E25] transition-all placeholder:text-[#8DA69B] hover:border-[#BED6C8] focus:border-[#008A5E] focus:ring-1 focus:ring-[#008A5E] focus:outline-none"
						></textarea>
					</div>

					<div class="flex items-center justify-between border-t border-[#F0F5F2] pt-4">
						<button
							type="button"
							onclick={() => (step = 2)}
							class="cursor-pointer px-4 py-2 text-xs font-semibold text-[#52776C] hover:text-[#0E2E25]"
						>
							{m.common_back()}
						</button>
						<button
							type="button"
							disabled={!problemSolved.trim()}
							onclick={() => (step = 4)}
							class="inline-flex cursor-pointer items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-semibold transition-all sm:text-sm {problemSolved.trim()
								? 'bg-[#008A5E] text-white shadow-2xs hover:bg-[#007550]'
								: 'cursor-not-allowed bg-[#E9F0EC] text-[#8DA69B]'}"
						>
							<span>{m.pc_w_s3_next()}</span>
							<ArrowRight class="h-4 w-4" />
						</button>
					</div>
				</div>
			{:else if step === 4}
				<div class="space-y-6 rounded-2xl border border-[#E5ECE7] bg-white p-6 shadow-2xs sm:p-8">
					<div class="space-y-2 rounded-xl border border-[#E2EEE6] bg-[#F6FAF7] p-4 sm:p-5">
						<div class="flex items-center justify-between">
							<span class="text-[11px] font-bold tracking-wider text-[#4A7264] uppercase">
								{m.pc_w_s4_from_label()}
							</span>
							<button
								type="button"
								onclick={() => (step = 1)}
								class="flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-[#008A5E] hover:underline"
							>
								<SquarePen class="h-3 w-3" />
								<span>{m.pc_w_edit_answers()}</span>
							</button>
						</div>
						<div class="grid grid-cols-1 gap-3 pt-1 text-xs sm:grid-cols-3">
							<div>
								<span class="block text-[11px] text-[#648B7E]">{m.pc_w_s4_sum_helped()}</span>
								<span class="line-clamp-1 font-semibold text-[#0E2E25]">{skillInput}</span>
							</div>
							<div class="sm:border-l sm:border-[#DCECE1] sm:pl-3">
								<span class="block text-[11px] text-[#648B7E]">{m.pc_w_s4_sum_who()}</span>
								<span class="line-clamp-1 font-semibold text-[#0E2E25]">{targetAudience}</span>
							</div>
							<div class="sm:border-l sm:border-[#DCECE1] sm:pl-3">
								<span class="block text-[11px] text-[#648B7E]">{m.pc_w_s4_sum_problem()}</span>
								<span class="line-clamp-1 font-semibold text-[#0E2E25]">{problemSolved}</span>
							</div>
						</div>
					</div>

					<div class="space-y-1.5">
						<h2
							class="text-2xl leading-tight font-bold tracking-tight text-[#0E2E25] sm:text-[28px]"
						>
							{m.pc_w_s4_title()}
						</h2>
						<p class="text-sm leading-relaxed text-[#52776C]">{m.pc_w_s4_desc()}</p>
					</div>

					<div class="grid grid-cols-1 gap-4 pt-1">
						<!-- 1. Sesi -->
						<div
							role="button"
							tabindex="0"
							onclick={() => (selectedFormat = 'session')}
							onkeydown={(e) => e.key === 'Enter' && (selectedFormat = 'session')}
							class="relative cursor-pointer rounded-2xl border p-5 transition-all {selectedFormat ===
							'session'
								? 'border-2 border-[#008A5E] bg-[#FAFDFB] shadow-xs'
								: 'border-[#E2EBE6] bg-white hover:border-[#96CCAF]'}"
						>
							<div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
								<div class="flex-1 space-y-2">
									<div class="flex items-center gap-2">
										<ProductTypeMeta type="session" subtype={activeSuggestions.session.subtype} />
										<span
											class="rounded-md bg-[#EAF8F0] px-2 py-0.5 text-[11px] font-semibold text-[#008A5E]"
										>
											{m.pc_w_s4_badge_easiest()}
										</span>
									</div>
									<h3 class="text-base leading-snug font-bold text-[#0E2E25]">
										{activeSuggestions.session.title}
									</h3>
									<p class="text-xs leading-relaxed text-[#52776C]">
										{activeSuggestions.session.description}
									</p>
								</div>

								<div
									class="flex shrink-0 items-center justify-between gap-3 pt-2 sm:flex-col sm:items-end sm:pt-0 sm:text-right"
								>
									<div class="text-base font-bold text-[#0E2E25]">
										{formatRupiah(activeSuggestions.session.price)}
									</div>
									<button
										type="button"
										onclick={(e) => {
											e.stopPropagation();
											handleSelectOptionAndProceed(
												'session',
												activeSuggestions.session.title,
												activeSuggestions.session.price,
												activeSuggestions.session.description,
												activeSuggestions.session.subtype
											);
										}}
										class="cursor-pointer rounded-xl bg-[#008A5E] px-5 py-2.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-[#007550]"
									>
										{m.pc_w_use_idea()}
									</button>
								</div>
							</div>
						</div>

						<!-- 2. Produk Digital -->
						<div
							role="button"
							tabindex="0"
							onclick={() => (selectedFormat = 'digital')}
							onkeydown={(e) => e.key === 'Enter' && (selectedFormat = 'digital')}
							class="relative cursor-pointer rounded-2xl border p-5 transition-all {selectedFormat ===
							'digital'
								? 'border-2 border-[#008A5E] bg-[#FAFDFB] shadow-xs'
								: 'border-[#E2EBE6] bg-white hover:border-[#93C5FD]'}"
						>
							<div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
								<div class="flex-1 space-y-2">
									<div class="flex items-center gap-2">
										<ProductTypeMeta type="digital" subtype={activeSuggestions.digital.subtype} />
									</div>
									<h3 class="text-base leading-snug font-bold text-[#0E2E25]">
										{activeSuggestions.digital.title}
									</h3>
									<p class="text-xs leading-relaxed text-[#52776C]">
										{activeSuggestions.digital.description}
									</p>
								</div>

								<div
									class="flex shrink-0 items-center justify-between gap-3 pt-2 sm:flex-col sm:items-end sm:pt-0 sm:text-right"
								>
									<div class="text-base font-bold text-[#0E2E25]">
										{formatRupiah(activeSuggestions.digital.price)}
									</div>
									<button
										type="button"
										onclick={(e) => {
											e.stopPropagation();
											handleSelectOptionAndProceed(
												'digital',
												activeSuggestions.digital.title,
												activeSuggestions.digital.price,
												activeSuggestions.digital.description,
												activeSuggestions.digital.subtype
											);
										}}
										class="cursor-pointer rounded-xl border border-[#BFDBFE] bg-white px-5 py-2.5 text-xs font-semibold text-[#1D4ED8] transition-colors hover:border-[#2563EB] hover:bg-[#EFF6FF]"
									>
										{m.pc_w_use_idea()}
									</button>
								</div>
							</div>
						</div>

						<!-- 3. Layanan -->
						<div
							role="button"
							tabindex="0"
							onclick={() => (selectedFormat = 'service')}
							onkeydown={(e) => e.key === 'Enter' && (selectedFormat = 'service')}
							class="relative cursor-pointer rounded-2xl border p-5 transition-all {selectedFormat ===
							'service'
								? 'border-2 border-[#008A5E] bg-[#FAFDFB] shadow-xs'
								: 'border-[#E2EBE6] bg-white hover:border-[#FED7AA]'}"
						>
							<div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
								<div class="flex-1 space-y-2">
									<div class="flex items-center gap-2">
										<ProductTypeMeta type="service" subtype={activeSuggestions.service.subtype} />
									</div>
									<h3 class="text-base leading-snug font-bold text-[#0E2E25]">
										{activeSuggestions.service.title}
									</h3>
									<p class="text-xs leading-relaxed text-[#52776C]">
										{activeSuggestions.service.description}
									</p>
								</div>

								<div
									class="flex shrink-0 items-center justify-between gap-3 pt-2 sm:flex-col sm:items-end sm:pt-0 sm:text-right"
								>
									<div class="text-base font-bold text-[#0E2E25]">
										{formatRupiah(activeSuggestions.service.price)}
									</div>
									<button
										type="button"
										onclick={(e) => {
											e.stopPropagation();
											handleSelectOptionAndProceed(
												'service',
												activeSuggestions.service.title,
												activeSuggestions.service.price,
												activeSuggestions.service.description,
												activeSuggestions.service.subtype
											);
										}}
										class="cursor-pointer rounded-xl border border-[#FED7AA] bg-white px-5 py-2.5 text-xs font-semibold text-[#EA580C] transition-colors hover:border-[#EA580C] hover:bg-[#FFF7ED]"
									>
										{m.pc_w_use_idea()}
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- RIGHT COLUMN: Persistent Live Product Summary -->
		<div class="hidden w-[36%] shrink-0 lg:block">
			<div
				class="sticky top-6 space-y-5 rounded-2xl border border-[#E5ECE7] bg-white p-6 shadow-2xs"
			>
				<div>
					<span class="block text-[11px] font-bold tracking-wider text-[#008A5E] uppercase">
						{m.pc_w_side_eyebrow()}
					</span>
					<h3 class="mt-0.5 text-lg font-bold tracking-tight text-[#0E2E25]">
						{m.pc_w_side_title()}
					</h3>
				</div>

				<div class="mx-auto w-full max-w-[170px] py-1">
					<PlatformStateVisual
						asset={getVisualAsset('onboarding.createProduct')}
						aspectRatio="16:10"
					/>
				</div>

				<div class="space-y-4 border-t border-[#F0F5F2] pt-2 text-xs">
					<div>
						<span class="block text-[11px] font-semibold text-[#7A988D]"
							>{m.pc_w_side_f_helped()}</span
						>
						<p
							class="mt-0.5 text-sm leading-snug font-semibold transition-colors {skillInput.trim()
								? 'text-[#0E2E25]'
								: 'text-[#A0B5AC]'}"
						>
							{skillInput.trim() || '—'}
						</p>
					</div>

					<div>
						<span class="block text-[11px] font-semibold text-[#7A988D]">{m.pc_w_side_f_who()}</span
						>
						<p
							class="mt-0.5 text-sm leading-snug font-semibold transition-colors {targetAudience.trim()
								? 'text-[#0E2E25]'
								: 'text-[#A0B5AC]'}"
						>
							{targetAudience.trim() || '—'}
						</p>
					</div>

					<div>
						<span class="block text-[11px] font-semibold text-[#7A988D]"
							>{m.pc_w_side_f_format()}</span
						>
						<p
							class="mt-0.5 text-sm leading-snug font-semibold transition-colors {step === 4
								? 'text-[#0E2E25]'
								: 'text-[#A0B5AC]'}"
						>
							{step === 4 ? formatSummary.title : step === 3 ? m.pc_w_side_format_step3() : '—'}
						</p>
					</div>

					<div>
						<span class="block text-[11px] font-semibold text-[#7A988D]"
							>{m.pc_w_side_f_price()}</span
						>
						<p
							class="mt-0.5 text-sm leading-snug transition-colors {step === 4
								? 'font-bold text-[#008A5E]'
								: 'font-semibold text-[#A0B5AC]'}"
						>
							{step === 4 ? formatRupiah(formatSummary.price) : '—'}
						</p>
					</div>
				</div>

				<div class="border-t border-[#F0F5F2] pt-3 text-[11px] leading-relaxed text-[#52776C]">
					{#if step === 1}{m.pc_w_note_1()}{:else if step === 2}{m.pc_w_note_2()}{:else if step === 3}{m.pc_w_note_3()}{:else}{m.pc_w_note_4()}{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- MOBILE INLINE SUMMARY -->
	<div
		class="space-y-3 rounded-2xl border border-[#E5ECE7] bg-white p-4 shadow-2xs sm:p-5 lg:hidden"
	>
		<div class="flex items-center justify-between">
			<span class="text-xs font-bold text-[#0E2E25]">{m.pc_w_mobile_summary_title()}</span>
			<span class="text-[11px] font-medium text-[#008A5E]"
				>{m.pc_wizard_step_counter({ step })}</span
			>
		</div>
		<div class="grid grid-cols-2 gap-3 border-t border-[#F0F5F2] pt-2 text-xs">
			<div>
				<span class="block text-[10px] font-semibold text-[#8DA69B] uppercase"
					>{m.pc_w_side_f_helped()}</span
				>
				<span class="mt-0.5 block truncate font-semibold text-[#0E2E25]"
					>{skillInput.trim() || '—'}</span
				>
			</div>
			<div>
				<span class="block text-[10px] font-semibold text-[#8DA69B] uppercase"
					>{m.pc_w_side_f_who()}</span
				>
				<span class="mt-0.5 block truncate font-semibold text-[#0E2E25]"
					>{targetAudience.trim() || '—'}</span
				>
			</div>
			{#if step >= 3}
				<div class="col-span-2 border-t border-[#F0F5F2] pt-1">
					<span class="block text-[10px] font-semibold text-[#8DA69B] uppercase"
						>{m.pc_w_side_f_format()}</span
					>
					<span class="mt-0.5 block truncate font-semibold text-[#0E2E25]"
						>{step === 4 ? formatSummary.title : m.pc_w_mobile_format_pending()}</span
					>
				</div>
			{/if}
		</div>
	</div>
</div>
