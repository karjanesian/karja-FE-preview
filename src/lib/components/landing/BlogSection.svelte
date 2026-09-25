<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';

	type LandingArticle = {
		id: string;
		number: string;
		category: () => string;
		title: () => string;
		description: () => string;
		slug: string;
		isFeatured?: boolean;
		image: string;
	};

	const articles: LandingArticle[] = [
		{
			id: 'art-01',
			number: '01',
			category: () => m.ld_blog_a1_cat(),
			title: () => m.ld_blog_a1_t(),
			description: () => m.ld_blog_a1_d(),
			slug: 'mulai-dari-yang-sering-kamu-bantu',
			isFeatured: true,
			image:
				'https://images.unsplash.com/photo-1517842645767-c639042777db?w=1200&auto=format&fit=crop&q=80'
		},
		{
			id: 'art-02',
			number: '02',
			category: () => m.ld_blog_a2_cat(),
			title: () => m.ld_blog_a2_t(),
			description: () => m.ld_blog_a2_d(),
			slug: 'produk-digital-nggak-harus-ebook',
			image:
				'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=80'
		},
		{
			id: 'art-03',
			number: '03',
			category: () => m.ld_blog_a3_cat(),
			title: () => m.ld_blog_a3_t(),
			description: () => m.ld_blog_a3_d(),
			slug: 'cara-menentukan-harga-produk-pertama',
			image:
				'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80'
		}
	];

	const featuredArticle = $derived(articles.find((a) => a.isFeatured) || articles[0]);
	const secondaryArticles = $derived(articles.filter((a) => !a.isFeatured));

	let sectionEl = $state<HTMLElement | null>(null);
	let shown = $state(false);

	$effect(() => {
		const el = sectionEl;
		if (!el) return;
		const io = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) {
					shown = true;
					io.disconnect();
				}
			},
			{ threshold: 0.2 }
		);
		io.observe(el);
		return () => io.disconnect();
	});
</script>

<section
	id="blog"
	bind:this={sectionEl}
	aria-label={m.ld_blog_aria()}
	class="border-t border-[#E8ECE9] bg-[#FAFDFB] px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32"
>
	<div class="mx-auto max-w-6xl space-y-12 sm:space-y-16">
		<div class="flex flex-col justify-between gap-6 md:flex-row md:items-end">
			<div
				class="max-w-3xl space-y-3 text-left transition-all duration-500 ease-out {shown
					? 'translate-y-0 opacity-100'
					: 'translate-y-4 opacity-0'}"
			>
				<h2 class="landing-heading text-[#0A261D]">{m.ld_blog_h2()}</h2>
				<p class="landing-lead text-[#4A5852]">{m.ld_blog_lead()}</p>
			</div>

			<a
				href="/blog"
				class="group inline-flex items-center gap-1.5 self-start text-sm font-semibold whitespace-nowrap text-[#008A5E] transition-colors hover:text-[#007550] md:self-auto"
			>
				<span>{m.ld_blog_view_all()}</span>
				<ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-1" />
			</a>
		</div>

		<div class="grid grid-cols-1 items-stretch gap-6 text-left lg:grid-cols-12 lg:gap-8">
			<a
				href="/blog/{featuredArticle.slug}"
				class="group flex cursor-pointer flex-col justify-between rounded-3xl border border-[#E2EAE5] bg-white p-6 text-[#0E2E25] shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-500 ease-out hover:border-[#CADAD0] sm:p-8 lg:col-span-7 lg:p-10 {shown
					? 'translate-y-0 opacity-100'
					: 'translate-y-4 opacity-0'}"
				style="transition-delay: {shown ? 150 : 0}ms;"
			>
				<div>
					<div
						class="relative mb-6 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-[#E0EBE4] bg-[#EDF4F1] sm:mb-8"
					>
						{#if featuredArticle.image && featuredArticle.image.trim().length > 0}
							<img
								src={featuredArticle.image}
								alt={featuredArticle.title()}
								class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[103%]"
								referrerpolicy="no-referrer"
							/>
						{:else}
							<div
								class="flex h-full w-full items-center justify-center bg-[#EDF4F1] text-sm font-bold text-[#0C7B58]"
							>
								Blog Karja
							</div>
						{/if}
					</div>

					<div class="mb-4 flex items-start justify-between gap-4 sm:mb-6">
						<span class="text-xs font-bold tracking-wider text-[#0C7B58] uppercase sm:text-sm">
							{featuredArticle.category()}
						</span>
						<span
							class="font-sans text-4xl leading-none font-extrabold tracking-tight text-[#D5E2DA] select-none sm:text-5xl lg:text-6xl"
						>
							{featuredArticle.number}
						</span>
					</div>

					<div class="space-y-3 sm:space-y-4">
						<h3
							class="landing-subheading text-[#0E2E25] transition-colors group-hover:text-[#008A5E]"
						>
							{featuredArticle.title()}
						</h3>
						<p class="text-base leading-relaxed text-[#52776C] sm:text-lg">
							{featuredArticle.description()}
						</p>
					</div>
				</div>

				<div class="pt-6">
					<span
						class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#008A5E] transition-colors group-hover:text-[#007550] sm:text-sm"
					>
						<span>{m.ld_blog_read()}</span>
						<ArrowRight class="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
					</span>
				</div>
			</a>

			<div class="flex flex-col justify-between gap-6 lg:col-span-5">
				{#each secondaryArticles as article, i (article.id)}
					<a
						href="/blog/{article.slug}"
						class="group flex flex-1 cursor-pointer flex-col justify-between rounded-3xl border border-[#E5ECE7] bg-white p-6 text-[#0E2E25] shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-500 ease-out hover:border-[#CADAD0] sm:p-7 {shown
							? 'translate-y-0 opacity-100'
							: 'translate-y-4 opacity-0'}"
						style="transition-delay: {shown ? 250 + i * 100 : 0}ms;"
					>
						<div>
							<div
								class="relative mb-5 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-[#E0EBE4] bg-[#EDF4F1]"
							>
								{#if article.image && article.image.trim().length > 0}
									<img
										src={article.image}
										alt={article.title()}
										class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[103%]"
										referrerpolicy="no-referrer"
									/>
								{:else}
									<div
										class="flex h-full w-full items-center justify-center bg-[#EDF4F1] text-xs font-bold text-[#0C7B58]"
									>
										Blog Karja
									</div>
								{/if}
							</div>

							<div class="mb-3 flex items-start justify-between gap-4">
								<span class="text-xs font-bold tracking-wider text-[#52776C] uppercase">
									{article.category()}
								</span>
								<span
									class="font-sans text-3xl leading-none font-extrabold tracking-tight text-[#D5E2DA] select-none sm:text-4xl"
								>
									{article.number}
								</span>
							</div>

							<div class="space-y-2">
								<h3
									class="text-lg leading-snug font-bold tracking-tight text-[#0E2E25] transition-colors group-hover:text-[#008A5E] sm:text-xl"
								>
									{article.title()}
								</h3>
								<p class="text-sm leading-relaxed text-[#52776C]">{article.description()}</p>
							</div>
						</div>

						<div class="pt-4">
							<span
								class="inline-flex items-center gap-1 text-xs font-semibold text-[#008A5E] transition-colors group-hover:text-[#007550] sm:text-sm"
							>
								<span>{m.ld_blog_read()}</span>
								<ArrowRight class="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
							</span>
						</div>
					</a>
				{/each}
			</div>
		</div>
	</div>
</section>
