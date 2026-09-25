<script lang="ts">
	import { goto } from '$app/navigation';
	import PublicFooter from '$lib/components/public/PublicFooter.svelte';
	import PublicNavbar from '$lib/components/public/PublicNavbar.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { BLOG_CATEGORIES, INITIAL_BLOG_ARTICLES } from '$lib/data/blogArticles';
	import type { BlogCategory } from '$lib/types/blog';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';

	let selectedCategory = $state<BlogCategory>('Semua');

	const allArticles = $derived(INITIAL_BLOG_ARTICLES);
	const featuredArticle = $derived(allArticles.find((a) => a.featured) || allArticles[0]);
	const isAllCategory = $derived(selectedCategory === 'Semua');
	const filteredArticles = $derived(
		isAllCategory ? allArticles : allArticles.filter((a) => a.category === selectedCategory)
	);
	const gridArticles = $derived(
		isAllCategory
			? allArticles.filter((a) => a.id !== featuredArticle?.id).slice(0, 6)
			: filteredArticles
	);
	const curatedStartingArticles = $derived(
		[
			'cara-menentukan-harga-produk-pertama',
			'cara-share-link-jualan-tanpa-cringe',
			'nggak-punya-followers-mulai-dari-orang-terdekat'
		]
			.map((slug) => allArticles.find((a) => a.slug === slug))
			.filter((a) => a !== undefined)
	);
	const kimmyStoryArticle = $derived(
		INITIAL_BLOG_ARTICLES.find((a) => a.slug === 'kimmy-awalnya-cuma-bikin-checklist') ||
			INITIAL_BLOG_ARTICLES[0]
	);

	function categoryLabel(cat: string): string {
		switch (cat) {
			case 'Semua':
				return m.bl_cat_semua();
			case 'Mulai':
				return m.bl_cat_mulai();
			case 'Produk Digital':
				return m.bl_cat_digital();
			case 'Sesi':
				return m.bl_cat_sesi();
			case 'Layanan':
				return m.bl_cat_layanan();
			case 'Jual & Bagikan':
				return m.bl_cat_jual();
			case 'Cerita Orang':
				return m.bl_cat_cerita();
			default:
				return cat;
		}
	}

	function openArticle(slug: string) {
		void goto('/blog/' + slug);
	}

	function startSelling() {
		void goto('/dashboard/products/new');
	}

	function handleCardKey(event: KeyboardEvent, slug: string) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			openArticle(slug);
		}
	}
</script>

<svelte:head>
	<title>{m.bl_seo_title()}</title>
	<meta name="description" content={m.bl_seo_description()} />
</svelte:head>

<div
	class="flex min-h-screen flex-col bg-[#FAFDFB] font-sans text-[#0A261D] selection:bg-[#C8E6D9] selection:text-[#0A261D]"
>
	<PublicNavbar activePage="blog" />

	<main class="w-full flex-1">
		<section
			class="mx-auto max-w-[1240px] px-5 pt-10 pb-8 text-left sm:px-8 sm:pt-14 sm:pb-12 lg:px-10"
		>
			<div class="max-w-3xl space-y-3">
				<span class="text-xs font-bold tracking-wider text-[#008A5E] uppercase sm:text-[13px]">
					{m.bl_eyebrow()}
				</span>
				<h1
					class="text-3xl leading-[1.15] font-extrabold tracking-tight text-[#0A261D] sm:text-4xl lg:text-[46px]"
				>
					{m.bl_hero_title()}
				</h1>
				<p class="pt-1 text-base leading-relaxed text-[#4A5852] sm:text-lg">
					{m.bl_hero_subtitle()}
				</p>
			</div>
		</section>

		{#if isAllCategory && featuredArticle}
			<section class="mx-auto max-w-[1240px] px-5 pb-16 sm:px-8 sm:pb-20 lg:px-10">
				<div
					role="button"
					tabindex={0}
					onclick={() => openArticle(featuredArticle.slug)}
					onkeydown={(e) => handleCardKey(e, featuredArticle.slug)}
					class="group grid cursor-pointer grid-cols-1 items-center gap-6 rounded-2xl border border-[#E2EBE5] bg-[#F2F7F4] p-5 text-left transition-all duration-300 hover:border-[#D0E2D8] hover:bg-[#EDF5F0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008A5E] sm:gap-8 sm:rounded-3xl sm:p-7 lg:grid-cols-12 lg:gap-12 lg:p-9"
				>
					<div
						class="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#E2ECE7] sm:aspect-[16/10] sm:rounded-2xl lg:col-span-6 lg:aspect-[4/3] xl:col-span-7"
					>
						{#if featuredArticle.coverImage && featuredArticle.coverImage.trim().length > 0}
							<img
								src={featuredArticle.coverImage}
								alt={featuredArticle.coverImageAlt}
								class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-103"
								referrerpolicy="no-referrer"
								loading="eager"
							/>
						{:else}
							<div
								class="flex h-full w-full items-center justify-center bg-[#E2ECE7] text-sm font-semibold text-[#0C7B58]"
							>
								{m.bl_image_fallback()}
							</div>
						{/if}
					</div>

					<div
						class="flex flex-col justify-between space-y-4 sm:space-y-5 lg:col-span-6 xl:col-span-5"
					>
						<div class="space-y-3">
							<div class="flex items-center gap-3">
								<span class="text-xs font-bold tracking-wider text-[#008A5E] uppercase">
									{m.bl_featured_eyebrow()}
								</span>
								<span class="h-1 w-1 rounded-full bg-[#8E9F97]"></span>
								<span class="text-xs text-[#6B7D75]">{featuredArticle.readingTime}</span>
							</div>

							<h2
								class="text-2xl leading-[1.25] font-bold tracking-tight text-[#0A261D] transition-colors group-hover:text-[#008A5E] sm:text-3xl lg:text-[30px]"
							>
								{featuredArticle.title}
							</h2>

							<p class="line-clamp-3 text-base leading-relaxed text-[#4A5852]">
								{featuredArticle.excerpt}
							</p>
						</div>

						<div class="pt-2">
							<span
								class="inline-flex items-center gap-1.5 text-sm font-semibold text-[#008A5E] transition-colors group-hover:text-[#007550]"
							>
								<span>{m.bl_read_article()}</span>
								<ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-1" />
							</span>
						</div>
					</div>
				</div>
			</section>
		{/if}

		<section class="mx-auto max-w-[1240px] px-5 pb-16 sm:px-8 sm:pb-24 lg:px-10">
			<div class="space-y-8 border-t border-[#E8ECE9] pt-10 sm:pt-14">
				<div class="max-w-2xl space-y-2 text-left">
					<h2 class="text-2xl font-bold tracking-tight text-[#0A261D] sm:text-3xl">
						{m.bl_new_title()}
					</h2>
					<p class="text-sm leading-relaxed text-[#4A5852] sm:text-base">
						{m.bl_new_subtitle()}
					</p>
				</div>

				<div
					class="-mx-5 flex scrollbar-none items-center gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0"
				>
					{#each BLOG_CATEGORIES as cat (cat)}
						<button
							type="button"
							onclick={() => (selectedCategory = cat)}
							aria-pressed={selectedCategory === cat}
							class="cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all sm:px-4 sm:py-2 sm:text-sm {selectedCategory ===
							cat
								? 'bg-[#0A261D] text-white shadow-xs'
								: 'border border-[#E2E8E4] bg-white text-[#4A5852] hover:border-[#CADAD0] hover:text-[#0A261D]'}"
						>
							{categoryLabel(cat)}
						</button>
					{/each}
				</div>

				{#if gridArticles.length > 0}
					<div
						class="grid grid-cols-1 gap-x-7 gap-y-12 pt-4 text-left sm:gap-y-14 md:grid-cols-2 lg:grid-cols-3"
					>
						{#each gridArticles as article (article.id)}
							<div
								role="button"
								tabindex={0}
								onclick={() => openArticle(article.slug)}
								onkeydown={(e) => handleCardKey(e, article.slug)}
								class="group flex cursor-pointer flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008A5E]"
							>
								<div class="space-y-4">
									<div
										class="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-[#E5EDE8] bg-[#EDF4F1]"
									>
										{#if article.coverImage && article.coverImage.trim().length > 0}
											<img
												src={article.coverImage}
												alt={article.coverImageAlt}
												class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-104"
												referrerpolicy="no-referrer"
												loading="lazy"
											/>
										{:else}
											<div
												class="flex h-full w-full items-center justify-center bg-[#EDF4F1] text-xs font-semibold text-[#0C7B58]"
											>
												{m.bl_image_fallback()}
											</div>
										{/if}
									</div>

									<div class="flex items-center gap-2 pt-1">
										<span class="text-xs font-bold tracking-wider text-[#008A5E] uppercase">
											{categoryLabel(article.category)}
										</span>
										<span class="h-1 w-1 rounded-full bg-[#B4C4BC]"></span>
										<span class="text-xs text-[#73857D]">{article.readingTime}</span>
									</div>

									<h3
										class="text-lg leading-snug font-bold tracking-tight text-[#0A261D] transition-colors group-hover:text-[#008A5E] sm:text-[19px]"
									>
										{article.title}
									</h3>

									<p class="line-clamp-2 text-sm leading-relaxed text-[#4A5852]">
										{article.excerpt}
									</p>
								</div>

								<div class="pt-3">
									<span
										class="inline-flex items-center gap-1 text-xs font-semibold text-[#008A5E] transition-colors group-hover:text-[#007550] sm:text-sm"
									>
										<span>{m.bl_read_article()}</span>
										<ArrowRight
											class="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
										/>
									</span>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div
						class="mx-auto max-w-md rounded-2xl border border-[#E5EDE8] bg-white p-8 py-16 text-center text-[#52776C]"
					>
						<p class="text-base font-medium text-[#0A261D]">{m.bl_empty_title()}</p>
						<p class="mt-1 text-sm text-[#52776C]">{m.bl_empty_subtitle()}</p>
						<button
							type="button"
							onclick={() => (selectedCategory = 'Semua')}
							class="mt-4 cursor-pointer text-xs font-bold text-[#008A5E] hover:underline"
						>
							{m.bl_empty_back()}
						</button>
					</div>
				{/if}
			</div>
		</section>

		{#if isAllCategory}
			<section class="mx-auto max-w-[1240px] px-5 pb-20 sm:px-8 sm:pb-24 lg:px-10">
				<div
					role="button"
					tabindex={0}
					onclick={() => openArticle(kimmyStoryArticle.slug)}
					onkeydown={(e) => handleCardKey(e, kimmyStoryArticle.slug)}
					class="group grid cursor-pointer grid-cols-1 items-center gap-8 rounded-2xl bg-[#0E2E25] p-6 text-left text-white transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E5CB] sm:rounded-3xl sm:p-9 lg:grid-cols-12 lg:gap-12 lg:p-12"
				>
					<div class="order-2 space-y-4 sm:space-y-5 lg:order-1 lg:col-span-7">
						<span class="text-xs font-bold tracking-wider text-[#A3E5CB] uppercase sm:text-sm">
							{m.bl_story_eyebrow()}
						</span>

						<h2
							class="text-2xl leading-[1.25] font-bold tracking-tight text-white transition-colors group-hover:text-[#A3E5CB] sm:text-3xl lg:text-[34px]"
						>
							{m.bl_story_title()}
						</h2>

						<p class="max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
							{m.bl_story_desc()}
						</p>

						<div class="pt-3">
							<span
								class="inline-flex items-center gap-2 text-sm font-semibold text-[#A3E5CB] transition-colors group-hover:text-white sm:text-base"
							>
								<span>{m.bl_story_cta()}</span>
								<ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-1" />
							</span>
						</div>
					</div>

					<div
						class="relative order-1 aspect-[4/3] overflow-hidden rounded-xl bg-[#163D32] sm:aspect-[16/10] sm:rounded-2xl lg:order-2 lg:col-span-5 lg:aspect-[4/3]"
					>
						{#if kimmyStoryArticle.coverImage && kimmyStoryArticle.coverImage.trim().length > 0}
							<img
								src={kimmyStoryArticle.coverImage}
								alt={kimmyStoryArticle.coverImageAlt}
								class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-104"
								referrerpolicy="no-referrer"
								loading="lazy"
							/>
						{:else}
							<div
								class="flex h-full w-full items-center justify-center bg-[#163D32] text-xs font-semibold text-white/60"
							>
								{m.bl_story_image_fallback()}
							</div>
						{/if}
					</div>
				</div>
			</section>

			<section class="mx-auto max-w-[1240px] px-5 pb-20 sm:px-8 sm:pb-24 lg:px-10">
				<div class="space-y-8 border-t border-[#E8ECE9] pt-12 sm:pt-16">
					<div class="max-w-2xl space-y-2 text-left">
						<h2 class="text-2xl font-bold tracking-tight text-[#0A261D] sm:text-3xl">
							{m.bl_starting_title()}
						</h2>
						<p class="text-sm leading-relaxed text-[#4A5852] sm:text-base">
							{m.bl_starting_subtitle()}
						</p>
					</div>

					<div
						class="grid grid-cols-1 gap-x-7 gap-y-12 pt-2 text-left md:grid-cols-2 lg:grid-cols-3"
					>
						{#each curatedStartingArticles as article (article.id)}
							<div
								role="button"
								tabindex={0}
								onclick={() => openArticle(article.slug)}
								onkeydown={(e) => handleCardKey(e, article.slug)}
								class="group flex cursor-pointer flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008A5E]"
							>
								<div class="space-y-4">
									<div
										class="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-[#E5EDE8] bg-[#EDF4F1]"
									>
										{#if article.coverImage && article.coverImage.trim().length > 0}
											<img
												src={article.coverImage}
												alt={article.coverImageAlt}
												class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-104"
												referrerpolicy="no-referrer"
												loading="lazy"
											/>
										{:else}
											<div
												class="flex h-full w-full items-center justify-center bg-[#EDF4F1] text-xs font-semibold text-[#0C7B58]"
											>
												{m.bl_guide_image_fallback()}
											</div>
										{/if}
									</div>

									<div class="flex items-center gap-2 pt-1">
										<span class="text-xs font-bold tracking-wider text-[#008A5E] uppercase">
											{categoryLabel(article.category)}
										</span>
										<span class="h-1 w-1 rounded-full bg-[#B4C4BC]"></span>
										<span class="text-xs text-[#73857D]">{article.readingTime}</span>
									</div>

									<h3
										class="text-lg leading-snug font-bold tracking-tight text-[#0A261D] transition-colors group-hover:text-[#008A5E] sm:text-[19px]"
									>
										{article.title}
									</h3>

									<p class="line-clamp-2 text-sm leading-relaxed text-[#4A5852]">
										{article.excerpt}
									</p>
								</div>

								<div class="pt-3">
									<span
										class="inline-flex items-center gap-1 text-xs font-semibold text-[#008A5E] transition-colors group-hover:text-[#007550] sm:text-sm"
									>
										<span>{m.bl_read_article()}</span>
										<ArrowRight
											class="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
										/>
									</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</section>
		{/if}

		<section class="mx-auto max-w-[1240px] px-5 pb-20 sm:px-8 sm:pb-28 lg:px-10">
			<div
				class="mx-auto max-w-3xl space-y-4 rounded-2xl border border-[#D0E5DB] bg-[#E8F5F0] p-8 text-center sm:rounded-3xl sm:p-12 lg:p-16"
			>
				<h2 class="text-2xl font-bold tracking-tight text-[#0A261D] sm:text-3xl">
					{m.bl_cta_title()}
				</h2>
				<p class="mx-auto max-w-xl text-base leading-relaxed text-[#3D564D] sm:text-lg">
					{m.bl_cta_subtitle()}
				</p>
				<div class="flex justify-center pt-4">
					<button
						type="button"
						onclick={startSelling}
						class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#008A5E] px-6 py-3.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#007550] active:scale-98 sm:text-base"
					>
						<span>{m.bl_cta_button()}</span>
						<ArrowRight class="h-4 w-4" />
					</button>
				</div>
			</div>
		</section>
	</main>

	<PublicFooter />
</div>
