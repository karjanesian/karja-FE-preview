<script lang="ts">
	import { goto } from '$app/navigation';
	import ArticleBlocks from '$lib/components/blog/ArticleBlocks.svelte';
	import PublicFooter from '$lib/components/public/PublicFooter.svelte';
	import PublicNavbar from '$lib/components/public/PublicNavbar.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { getArticleBySlug, INITIAL_BLOG_ARTICLES } from '$lib/data/blogArticles';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';

	let { slug }: { slug: string } = $props();

	const allArticles = $derived(INITIAL_BLOG_ARTICLES);
	const article = $derived(allArticles.find((a) => a.slug === slug) || getArticleBySlug(slug));
	const relatedArticles = $derived.by(() => {
		const others = allArticles.filter((a) => a.slug !== slug);
		if (!article) return others.slice(0, 3);
		const sameCategory = others.filter((a) => a.category === article.category);
		const diffCategory = others.filter((a) => a.category !== article.category);
		return [...sameCategory, ...diffCategory].slice(0, 3);
	});
	const docTitle = $derived(article ? `${article.title} · Karja` : m.bl_notfound_title());
	const docDescription = $derived(
		article ? article.metaDescription || article.excerpt : m.bl_seo_description()
	);

	function goBack() {
		void goto('/blog');
	}

	function openArticle(targetSlug: string) {
		void goto('/blog/' + targetSlug);
	}

	function startSelling() {
		void goto('/dashboard/products/new');
	}

	function handleCardKey(event: KeyboardEvent, targetSlug: string) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			openArticle(targetSlug);
		}
	}

	$effect(() => {
		if (article) window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
	});
</script>

<svelte:head>
	<title>{docTitle}</title>
	<meta name="description" content={docDescription} />
</svelte:head>

{#if !article}
	<div class="flex min-h-screen flex-col bg-[#FAFDFB] font-sans text-[#0A261D]">
		<PublicNavbar activePage="blog" />
		<main class="flex flex-1 items-center justify-center px-4 py-24">
			<div class="max-w-md space-y-4 text-center">
				<h1 class="text-2xl font-bold text-[#0A261D]">{m.bl_notfound_title()}</h1>
				<p class="text-sm leading-relaxed text-[#4A5852]">{m.bl_notfound_desc()}</p>
				<div class="pt-2">
					<button
						type="button"
						onclick={goBack}
						class="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#008A5E] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#007550]"
					>
						<ArrowLeft class="h-4 w-4" />
						<span>{m.bl_back()}</span>
					</button>
				</div>
			</div>
		</main>
		<PublicFooter />
	</div>
{:else}
	<div
		class="flex min-h-screen flex-col bg-[#FAFDFB] font-sans text-[#0A261D] selection:bg-[#C8E6D9] selection:text-[#0A261D]"
	>
		<PublicNavbar activePage="blog" />

		<main class="w-full flex-1">
			<section class="mx-auto max-w-[1040px] px-5 pt-8 pb-10 text-left sm:px-8 sm:pt-12">
				<div class="mb-6 sm:mb-8">
					<button
						type="button"
						onclick={goBack}
						class="group inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#52776C] transition-colors hover:text-[#0A261D] sm:text-sm"
					>
						<ArrowLeft class="h-4 w-4 transition-transform group-hover:-translate-x-1" />
						<span>{m.bl_back()}</span>
					</button>
				</div>

				<div class="space-y-4 sm:space-y-6">
					<span class="text-xs font-bold tracking-wider text-[#008A5E] uppercase sm:text-[13px]">
						{article.category}
					</span>

					<h1
						class="text-3xl leading-[1.16] font-extrabold tracking-tight text-[#0A261D] sm:text-4xl md:text-5xl lg:text-[52px]"
					>
						{article.title}
					</h1>

					<p
						class="max-w-3xl pt-1 text-lg leading-relaxed text-[#4A5852] sm:text-xl md:text-[22px]"
					>
						{article.excerpt}
					</p>

					<div
						class="flex items-center gap-3 border-t border-[#E8ECE9] pt-5 text-xs text-[#6B7D75] sm:text-sm"
					>
						<span class="font-semibold text-[#0A261D]">{article.author.name}</span>
						<span class="h-1 w-1 rounded-full bg-[#A8BDB3]"></span>
						<span>{article.readingTime}</span>
						<span class="h-1 w-1 rounded-full bg-[#A8BDB3]"></span>
						<span>{article.publishedAt}</span>
					</div>
				</div>
			</section>

			{#if article.coverImage && article.coverImage.trim().length > 0}
				<section class="mx-auto max-w-[1040px] px-5 pb-12 sm:px-8 sm:pb-16">
					<div
						class="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-[#E2EAE5] bg-[#EDF4F1] sm:aspect-[16/9] sm:rounded-3xl"
					>
						<img
							src={article.coverImage}
							alt={article.coverImageAlt || article.title}
							class="h-full w-full object-cover"
							referrerpolicy="no-referrer"
							loading="eager"
						/>
					</div>
				</section>
			{/if}

			<article class="mx-auto max-w-[720px] px-5 pb-16 text-left sm:px-6 sm:pb-24">
				<div
					class="space-y-6 text-[17px] leading-[1.78] text-[#1F3D33] sm:space-y-7 sm:text-[18px]"
				>
					<ArticleBlocks blocks={article.content} />
				</div>
			</article>

			<section
				class="mx-auto max-w-[1240px] border-t border-[#E8ECE9] px-5 pt-14 pb-20 sm:px-8 sm:pt-16 sm:pb-24 lg:px-10"
			>
				<div class="mb-8 max-w-2xl space-y-2 text-left">
					<h2 class="text-2xl font-bold tracking-tight text-[#0A261D] sm:text-3xl">
						{m.bl_related_title()}
					</h2>
					<p class="text-sm leading-relaxed text-[#4A5852] sm:text-base">
						{m.bl_related_subtitle()}
					</p>
				</div>

				<div class="grid grid-cols-1 gap-x-7 gap-y-12 text-left md:grid-cols-2 lg:grid-cols-3">
					{#each relatedArticles as rel (rel.id)}
						<div
							role="button"
							tabindex={0}
							onclick={() => openArticle(rel.slug)}
							onkeydown={(e) => handleCardKey(e, rel.slug)}
							class="group flex cursor-pointer flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008A5E]"
						>
							<div class="space-y-4">
								<div
									class="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-[#E5EDE8] bg-[#EDF4F1]"
								>
									{#if rel.coverImage && rel.coverImage.trim().length > 0}
										<img
											src={rel.coverImage}
											alt={rel.coverImageAlt || rel.title}
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
										{rel.category}
									</span>
									<span class="h-1 w-1 rounded-full bg-[#B4C4BC]"></span>
									<span class="text-xs text-[#73857D]">{rel.readingTime}</span>
								</div>

								<h3
									class="text-lg leading-snug font-bold tracking-tight text-[#0A261D] transition-colors group-hover:text-[#008A5E] sm:text-[19px]"
								>
									{rel.title}
								</h3>

								<p class="line-clamp-2 text-sm leading-relaxed text-[#4A5852]">
									{rel.excerpt}
								</p>
							</div>

							<div class="pt-3">
								<span
									class="inline-flex items-center gap-1 text-xs font-semibold text-[#008A5E] transition-colors group-hover:text-[#007550] sm:text-sm"
								>
									<span>{m.bl_read_article()}</span>
									<ArrowRight class="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
								</span>
							</div>
						</div>
					{/each}
				</div>
			</section>

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
{/if}
