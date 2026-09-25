<script lang="ts">
	import { goto } from '$app/navigation';
	import * as m from '$lib/paraglide/messages.js';
	import type { ProductType } from '$lib/types';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import FileText from 'lucide-svelte/icons/file-text';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Briefcase from 'lucide-svelte/icons/briefcase';

	function selectType(type: ProductType) {
		void goto('/dashboard/products/new/draft?type=' + type);
	}

	function handleChoiceKey(event: KeyboardEvent, type: ProductType) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			selectType(type);
		}
	}

	function startGuidedIdea() {
		void goto('/dashboard/products/new/idea');
	}

	function goBack() {
		void goto('/dashboard/products');
	}
</script>

<div class="mx-auto max-w-4xl py-4 sm:py-6">
	<div class="mb-6">
		<button
			type="button"
			onclick={goBack}
			class="-ml-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-[#52776C] transition-colors hover:bg-[#F0F5F2] hover:text-[#0E2E25]"
		>
			<ArrowLeft class="h-3.5 w-3.5" />
			<span>{m.common_back()}</span>
		</button>
	</div>

	<div class="mb-8 space-y-1.5">
		<h1 class="text-2xl font-bold tracking-tight text-[#0E2E25] sm:text-3xl">
			{m.pc_types_title()}
		</h1>
		<p class="max-w-xl text-xs leading-relaxed text-[#52776C] sm:text-sm">
			{m.pc_types_subtitle()}
		</p>
	</div>

	<div class="grid grid-cols-1 gap-5 md:grid-cols-3 lg:gap-6">
		<!-- CHOICE 1: Produk Digital -->
		<div
			id="btn-select-digital-product"
			role="button"
			tabindex={0}
			onclick={() => selectType('digital')}
			onkeydown={(e) => handleChoiceKey(e, 'digital')}
			class="group relative flex cursor-pointer flex-col justify-between rounded-xl border border-[#E5ECE7] bg-white p-6 text-left shadow-2xs transition-all duration-200 hover:border-[#93C5FD] hover:bg-[#FAFDFE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
		>
			<div>
				<div
					class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB] transition-transform group-hover:scale-105"
				>
					<FileText class="h-5 w-5 stroke-[1.8]" />
				</div>

				<div class="mt-4 space-y-1">
					<span class="block text-[11px] font-semibold text-[#2563EB]">
						{m.pc_type_digital_eyebrow()}
					</span>
					<h3
						class="text-base font-bold text-[#0E2E25] transition-colors group-hover:text-[#1D4ED8]"
					>
						{m.common_type_digital()}
					</h3>
					<p class="pt-0.5 text-xs leading-relaxed text-[#52776C]">{m.pc_type_digital_desc()}</p>
				</div>
			</div>

			<div class="flex items-center justify-end pt-5">
				<span
					class="text-[#8DA69B] transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#2563EB]"
				>
					<ArrowRight class="h-4 w-4" />
				</span>
			</div>
		</div>

		<!-- CHOICE 2: Sesi -->
		<div
			id="btn-select-session-product"
			role="button"
			tabindex={0}
			onclick={() => selectType('session')}
			onkeydown={(e) => handleChoiceKey(e, 'session')}
			class="group relative flex cursor-pointer flex-col justify-between rounded-xl border border-[#E5ECE7] bg-white p-6 text-left shadow-2xs transition-all duration-200 hover:border-[#C4B5FD] hover:bg-[#FCFAFF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]"
		>
			<div>
				<div
					class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-[#F5F3FF] text-[#7C3AED] transition-transform group-hover:scale-105"
				>
					<Calendar class="h-5 w-5 stroke-[1.8]" />
				</div>

				<div class="mt-4 space-y-1">
					<span class="block text-[11px] font-semibold text-[#7C3AED]">
						{m.pc_type_session_eyebrow()}
					</span>
					<h3
						class="text-base font-bold text-[#0E2E25] transition-colors group-hover:text-[#6D28D9]"
					>
						{m.common_type_session()}
					</h3>
					<p class="pt-0.5 text-xs leading-relaxed text-[#52776C]">{m.pc_type_session_desc()}</p>
				</div>
			</div>

			<div class="flex items-center justify-end pt-5">
				<span
					class="text-[#8DA69B] transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#7C3AED]"
				>
					<ArrowRight class="h-4 w-4" />
				</span>
			</div>
		</div>

		<!-- CHOICE 3: Layanan -->
		<div
			id="btn-select-service-product"
			role="button"
			tabindex={0}
			onclick={() => selectType('service')}
			onkeydown={(e) => handleChoiceKey(e, 'service')}
			class="group relative flex cursor-pointer flex-col justify-between rounded-xl border border-[#E5ECE7] bg-white p-6 text-left shadow-2xs transition-all duration-200 hover:border-[#FDBA74] hover:bg-[#FFFCF9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C]"
		>
			<div>
				<div
					class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-[#FFF7ED] text-[#EA580C] transition-transform group-hover:scale-105"
				>
					<Briefcase class="h-5 w-5 stroke-[1.8]" />
				</div>

				<div class="mt-4 space-y-1">
					<span class="block text-[11px] font-semibold text-[#EA580C]">
						{m.pc_type_service_eyebrow()}
					</span>
					<h3
						class="text-base font-bold text-[#0E2E25] transition-colors group-hover:text-[#C2410C]"
					>
						{m.common_type_service()}
					</h3>
					<p class="pt-0.5 text-xs leading-relaxed text-[#52776C]">{m.pc_type_service_desc()}</p>
				</div>
			</div>

			<div class="flex items-center justify-end pt-5">
				<span
					class="text-[#8DA69B] transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#EA580C]"
				>
					<ArrowRight class="h-4 w-4" />
				</span>
			</div>
		</div>
	</div>

	<div
		class="mt-10 flex flex-col justify-between gap-4 border-t border-[#E5ECE7] pt-6 sm:mt-12 sm:flex-row sm:items-center"
	>
		<div class="space-y-0.5">
			<h4 class="text-sm font-semibold text-[#0E2E25]">{m.pc_guided_title()}</h4>
			<p class="max-w-md text-xs leading-relaxed text-[#52776C]">{m.pc_guided_desc()}</p>
		</div>

		<button
			id="btn-start-guided-idea"
			type="button"
			onclick={startGuidedIdea}
			class="group inline-flex shrink-0 cursor-pointer items-center gap-1.5 self-start py-1 text-xs font-semibold text-[#008A5E] transition-colors hover:text-[#007550] sm:self-auto"
		>
			<span>{m.pc_guided_cta()}</span>
			<ArrowRight class="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
		</button>
	</div>
</div>
