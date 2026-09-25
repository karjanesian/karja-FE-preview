<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { admin } from '$lib/stores/admin.svelte';
	import { hasPermission } from '$lib/domain/adminDomain';
	import { formatBytes } from '$lib/domain/fileStorage';
	import { blocksToHtml, tiptapJsonToBlocks } from '$lib/domain/blogCmsConverter';
	import type { BlogPost, BlogPostStatus, BlogCategoryRecord, BlogAuthor } from '$lib/types/blog';
	import * as Select from '$lib/components/ui/select';
	import TiptapEditor from './blog/TiptapEditor.svelte';
	import PublishSheet from './blog/PublishSheet.svelte';
	import BlogPeekDrawer from './blog/BlogPeekDrawer.svelte';
	import AuthorModal from './blog/AuthorModal.svelte';
	import CategoryModal from './blog/CategoryModal.svelte';
	import MediaModal from './blog/MediaModal.svelte';
	import ArticleBlocks from '$lib/components/blog/ArticleBlocks.svelte';
	import BookOpen from 'lucide-svelte/icons/book-open';
	import Plus from 'lucide-svelte/icons/plus';
	import SquarePen from 'lucide-svelte/icons/square-pen';
	import Eye from 'lucide-svelte/icons/eye';
	import FileText from 'lucide-svelte/icons/file-text';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Search from 'lucide-svelte/icons/search';
	import Layers from 'lucide-svelte/icons/layers';
	import Users from 'lucide-svelte/icons/users';
	import ImageIcon from 'lucide-svelte/icons/image';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Upload from 'lucide-svelte/icons/upload';
	import SlidersHorizontal from 'lucide-svelte/icons/sliders-horizontal';

	type CmsSubView = 'artikel' | 'kategori' | 'author' | 'media';
	type StatusFilter = 'all' | 'published' | 'draft' | 'scheduled' | 'archived';

	const posts = $derived(admin.platformBlogPosts);
	const categories = $derived(admin.platformBlogCategories);
	const authors = $derived(admin.platformBlogAuthors);
	const files = $derived(admin.platformFiles);
	const currentUser = $derived(admin.adminUser);

	const canPublish = $derived(hasPermission(currentUser, 'blog.publish'));
	const canManageCategories = $derived(hasPermission(currentUser, 'blog.manage_categories'));
	const canManageAuthors = $derived(hasPermission(currentUser, 'blog.manage_authors'));
	const canWrite = $derived(hasPermission(currentUser, 'blog.write'));
	const isWriter = $derived(currentUser?.role === 'content_writer');

	function canEditPost(post: BlogPost): boolean {
		if (!canWrite) return false;
		if (!isWriter) return true;
		return !post.createdByUserId || post.createdByUserId === currentUser?.id;
	}

	function canDeletePost(post: BlogPost): boolean {
		if (!canWrite) return false;
		if (!isWriter) return true;
		return post.createdByUserId === currentUser?.id && post.status === 'draft';
	}

	let currentSubView = $state<CmsSubView>('artikel');
	let statusFilter = $state<StatusFilter>('all');
	let searchQuery = $state('');
	let selectedCategoryFilter = $state<string>('all');

	let activeArticle = $state<BlogPost | null>(null);
	let editorSeed = $state<string>('');
	let isSaving = $state(false);
	let lastSavedTime = $state<string | null>(null);
	let publishSheetOpen = $state(false);
	let previewActive = $state(false);
	let mediaModalOpen = $state(false);

	let peekPost = $state<BlogPost | null>(null);

	let editingCategory = $state<BlogCategoryRecord | null>(null);
	let categoryModalOpen = $state(false);
	let editingAuthor = $state<BlogAuthor | null>(null);
	let authorModalOpen = $state(false);
	let libraryMediaOpen = $state(false);

	let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		return () => {
			if (autosaveTimer) clearTimeout(autosaveTimer);
		};
	});

	const categoryFilterItems = $derived<Record<string, string>>({
		all: m.adm_all_categories(),
		...Object.fromEntries(categories.map((c) => [c.name, c.name]))
	});

	const filteredPosts = $derived(
		posts.filter((p) => {
			if (statusFilter !== 'all' && p.status !== statusFilter) return false;
			if (selectedCategoryFilter !== 'all' && p.category !== selectedCategoryFilter) return false;
			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase().trim();
				const authorName = p.author?.name || '';
				return (
					p.title.toLowerCase().includes(q) ||
					p.slug.toLowerCase().includes(q) ||
					(!!p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
					authorName.toLowerCase().includes(q)
				);
			}
			return true;
		})
	);

	function handleOpenEditor(post: BlogPost) {
		if (!canEditPost(post)) return;
		activeArticle = post;
		editorSeed = blocksToHtml(post.content || []);
		peekPost = null;
		previewActive = false;
	}

	function handleCreateNewArticle() {
		if (!canWrite) return;
		const authorRecord = authors.find((a) => a.id === currentUser?.id) || authors[0];
		const newPost: BlogPost = {
			id: 'art-' + Date.now(),
			title: '',
			slug: '',
			category: categories[0]?.name || m.adm_default_category(),
			excerpt: '',
			readingTime: m.adm_default_reading(),
			publishedAt: new Date().toLocaleDateString('id-ID', {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			}),
			status: 'draft',
			featured: false,
			createdByUserId: currentUser?.id || 'admin_writer_1',
			lastEditedByUserId: currentUser?.id,
			coverImage: '',
			coverImageAlt: '',
			author: {
				name: currentUser?.name || authorRecord?.name || m.adm_default_author(),
				role: authorRecord?.role || m.adm_role_penulis()
			},
			content: []
		};
		activeArticle = newPost;
		editorSeed = '<p></p>';
		peekPost = null;
		previewActive = false;
	}

	function triggerAutosave(updated: Partial<BlogPost>) {
		if (!activeArticle) return;
		const merged: BlogPost = {
			...activeArticle,
			...updated,
			createdByUserId: activeArticle.createdByUserId || currentUser?.id,
			lastEditedByUserId: currentUser?.id
		};
		activeArticle = merged;

		isSaving = true;
		if (autosaveTimer) clearTimeout(autosaveTimer);

		autosaveTimer = setTimeout(() => {
			admin.savePost(merged);
			isSaving = false;
			lastSavedTime = new Date().toLocaleTimeString('id-ID', {
				hour: '2-digit',
				minute: '2-digit'
			});
		}, 1000);
	}

	function handleTitleInput(e: Event) {
		const val = (e.currentTarget as HTMLTextAreaElement).value;
		if (!activeArticle) return;
		triggerAutosave({
			title: val,
			slug:
				activeArticle.slug ||
				val
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, '-')
					.replace(/^-|-$/g, '')
		});
	}

	function handleExcerptInput(e: Event) {
		triggerAutosave({ excerpt: (e.currentTarget as HTMLTextAreaElement).value });
	}

	function handleEditorContentChange(json: unknown) {
		if (!activeArticle) return;
		const convertedBlocks = tiptapJsonToBlocks(json);
		triggerAutosave({ content: convertedBlocks });
	}

	function statusBadgeClasses(status: BlogPostStatus | undefined): string {
		return `px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
			status === 'published'
				? 'bg-emerald-100 text-emerald-800'
				: status === 'scheduled'
					? 'bg-amber-100 text-amber-800'
					: status === 'archived'
						? 'bg-gray-100 text-gray-700'
						: 'bg-blue-100 text-blue-800'
		}`;
	}

	const blogMediaCount = $derived(files.filter((f) => f.category === 'blog_asset').length);
</script>

{#if activeArticle && previewActive}
	<div class="relative min-h-screen bg-white">
		<div
			class="fixed top-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-full border border-gray-800 bg-gray-950/90 px-5 py-2.5 text-white shadow-2xl backdrop-blur-md"
		>
			<div class="flex items-center gap-2">
				<span class="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
				<span class="text-xs font-semibold">{m.adm_preview_badge()}</span>
			</div>
			<div class="h-4 w-px bg-gray-700"></div>
			<button
				type="button"
				onclick={() => (previewActive = false)}
				class="flex cursor-pointer items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300"
			>
				<ArrowLeft class="h-3.5 w-3.5" />
				<span>{m.adm_back_editor()}</span>
			</button>
		</div>

		<main class="mx-auto max-w-3xl px-5 py-24 text-left sm:px-6">
			{#if activeArticle.coverImage && activeArticle.coverImage.trim().length > 0}
				<div class="mb-8 aspect-[16/9] overflow-hidden rounded-3xl border border-gray-200">
					<img
						src={activeArticle.coverImage}
						alt={activeArticle.coverImageAlt || activeArticle.title}
						class="h-full w-full object-cover"
					/>
				</div>
			{/if}
			<div
				class="mb-3 flex items-center gap-2 text-[11px] font-bold tracking-wider text-emerald-700 uppercase"
			>
				<span>{activeArticle.category || m.adm_default_category()}</span>
				<span>•</span>
				<span class="font-normal text-gray-400"
					>{activeArticle.readingTime || m.adm_default_reading()}</span
				>
			</div>
			<h1 class="text-3xl leading-tight font-extrabold tracking-tight text-gray-950 sm:text-4xl">
				{activeArticle.title || m.adm_no_title()}
			</h1>
			{#if activeArticle.excerpt}
				<p class="mt-4 text-lg leading-relaxed text-gray-600">{activeArticle.excerpt}</p>
			{/if}
			<div class="mt-6 flex items-center gap-3">
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-300 bg-gray-200"
				>
					{#if activeArticle.author?.avatar && activeArticle.author.avatar.trim().length > 0}
						<img
							src={activeArticle.author.avatar}
							alt={activeArticle.author.name}
							class="h-full w-full object-cover"
						/>
					{:else}
						<span class="text-sm font-bold text-gray-600">{activeArticle.author?.name?.[0]}</span>
					{/if}
				</div>
				<div>
					<div class="text-sm font-bold text-gray-900">{activeArticle.author?.name}</div>
					<div class="text-xs text-gray-500">{activeArticle.publishedAt}</div>
				</div>
			</div>
			<div class="my-8 h-px w-full bg-gray-100"></div>
			<ArticleBlocks blocks={activeArticle.content || []} />
		</main>
	</div>
{/if}

{#if activeArticle && !previewActive}
	<div class="flex min-h-screen flex-col bg-white font-sans text-gray-900">
		<header class="sticky top-0 z-40 h-16 border-b border-gray-100 bg-white/95 backdrop-blur-xs">
			<div class="mx-auto flex h-full max-w-5xl items-center justify-between px-4 sm:px-6">
				<div class="flex items-center gap-4">
					<button
						type="button"
						onclick={() => {
							if (activeArticle) admin.savePost(activeArticle);
							activeArticle = null;
						}}
						class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
					>
						<ArrowLeft class="h-4 w-4" />
						<span>{m.adm_blog()}</span>
					</button>

					<div class="hidden items-center gap-2 text-xs text-gray-400 sm:flex">
						<span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
						<span>
							{isSaving
								? m.adm_saving()
								: lastSavedTime
									? m.adm_saved_at({ time: lastSavedTime })
									: m.adm_saved()}
						</span>
					</div>
				</div>

				<div class="flex items-center gap-2.5">
					<button
						type="button"
						onclick={() => (previewActive = true)}
						class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
					>
						<Eye class="h-3.5 w-3.5" />
						<span>{m.adm_preview()}</span>
					</button>

					<button
						type="button"
						onclick={() => (publishSheetOpen = true)}
						class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-800"
					>
						<span>{m.adm_pub_settings()}</span>
						<SlidersHorizontal class="h-3.5 w-3.5" />
					</button>
				</div>
			</div>
		</header>

		<main class="mx-auto w-full max-w-[740px] flex-1 px-5 py-10 text-left sm:px-6 sm:py-14">
			<div class="mb-8">
				{#if activeArticle.coverImage && activeArticle.coverImage.trim().length > 0}
					<div
						class="group relative aspect-[16/9] overflow-hidden rounded-3xl border border-gray-200 bg-gray-100 shadow-xs"
					>
						<img
							src={activeArticle.coverImage}
							alt={activeArticle.coverImageAlt || activeArticle.title}
							class="h-full w-full object-cover"
						/>
						<div
							class="absolute inset-0 flex items-center justify-center gap-3 bg-gray-950/40 opacity-0 transition-opacity group-hover:opacity-100"
						>
							<button
								type="button"
								onclick={() => (mediaModalOpen = true)}
								class="cursor-pointer rounded-xl bg-white px-4 py-2 text-xs font-bold text-gray-900 shadow-lg hover:bg-gray-100"
							>
								{m.adm_change_cover()}
							</button>
							<button
								type="button"
								onclick={() => triggerAutosave({ coverImage: '', coverImageAlt: '' })}
								class="cursor-pointer rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-rose-700"
							>
								{m.adm_delete()}
							</button>
						</div>
					</div>
				{:else}
					<button
						type="button"
						onclick={() => (mediaModalOpen = true)}
						class="flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-3xl border-2 border-dashed border-gray-200 py-6 text-gray-400 transition-all hover:border-emerald-600 hover:bg-emerald-50/40 hover:text-emerald-800"
					>
						<ImageIcon class="h-5 w-5" />
						<span class="text-xs font-semibold">{m.adm_add_cover()}</span>
					</button>
				{/if}
			</div>

			<textarea
				rows="1"
				value={activeArticle.title || ''}
				oninput={handleTitleInput}
				placeholder={m.adm_title_ph()}
				aria-label={m.adm_title_ph()}
				class="w-full resize-none border-none bg-transparent font-sans text-3xl leading-tight font-extrabold tracking-tight text-gray-950 outline-none placeholder:text-gray-300 sm:text-4xl"
			></textarea>

			<textarea
				rows="2"
				value={activeArticle.excerpt || ''}
				oninput={handleExcerptInput}
				placeholder={m.adm_excerpt_ph()}
				aria-label={m.adm_excerpt_ph()}
				class="mt-2 mb-8 w-full resize-none border-none bg-transparent font-sans text-lg leading-relaxed text-gray-600 outline-none placeholder:text-gray-300"
			></textarea>

			<div class="mb-8 h-px w-full bg-gray-100"></div>

			{#key activeArticle.id}
				<TiptapEditor
					value={editorSeed}
					onchange={handleEditorContentChange}
					{files}
					onUploadImage={(f) => admin.uploadBlogMedia(f)}
				/>
			{/key}
		</main>

		<PublishSheet
			open={publishSheetOpen}
			article={activeArticle}
			{categories}
			{authors}
			{files}
			{canPublish}
			onClose={() => (publishSheetOpen = false)}
			onUpdateArticle={(fields) => triggerAutosave(fields)}
			onPublish={() => {
				triggerAutosave({ status: 'published' });
				publishSheetOpen = false;
			}}
			onSaveDraft={() => {
				triggerAutosave({ status: 'draft' });
				publishSheetOpen = false;
			}}
			onUploadCover={(f) => admin.uploadBlogMedia(f)}
		/>

		<MediaModal
			open={mediaModalOpen}
			{files}
			onClose={() => (mediaModalOpen = false)}
			onUploadFile={(f) => admin.uploadBlogMedia(f)}
			onSelectFile={(f) => {
				triggerAutosave({
					coverImage: f.publicUrl || '',
					coverImageAlt: f.originalName
				});
			}}
		/>
	</div>
{/if}

{#if !activeArticle}
	<div class="space-y-6 text-left">
		<div
			class="flex flex-col justify-between gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-center"
		>
			<div>
				<h1 class="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-950">
					<BookOpen class="h-6 w-6 text-emerald-700" />
					<span>{m.adm_cms_title()}</span>
				</h1>
				<p class="mt-0.5 text-xs text-gray-500 sm:text-sm">{m.adm_cms_subtitle()}</p>
			</div>

			<div
				class="flex items-center gap-1 self-start rounded-2xl border border-gray-200 bg-gray-100 p-1 sm:self-auto"
			>
				{#each [{ id: 'artikel', label: m.adm_tab_articles(), icon: FileText, count: posts.length, show: true }, { id: 'kategori', label: m.adm_tab_categories(), icon: Layers, count: categories.length, show: canManageCategories }, { id: 'author', label: m.adm_tab_authors(), icon: Users, count: authors.length, show: canManageAuthors }, { id: 'media', label: m.adm_tab_media(), icon: ImageIcon, count: blogMediaCount, show: true }] as tab (tab.id)}
					{#if tab.show}
						{@const isActive = currentSubView === tab.id}
						<button
							type="button"
							onclick={() => (currentSubView = tab.id as CmsSubView)}
							class="flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all {isActive
								? 'bg-white text-emerald-800 shadow-xs'
								: 'text-gray-600 hover:bg-gray-200/50 hover:text-gray-900'}"
						>
							<tab.icon class="h-3.5 w-3.5" />
							<span>{tab.label}</span>
							<span
								class="py-0.2 rounded-full px-1.5 text-[10px] {isActive
									? 'bg-emerald-100 font-bold text-emerald-800'
									: 'bg-gray-200 text-gray-600'}">{tab.count}</span
							>
						</button>
					{/if}
				{/each}
			</div>
		</div>

		{#if currentSubView === 'artikel'}
			<div class="space-y-4">
				<div
					class="flex flex-col justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs md:flex-row md:items-center"
				>
					<div class="flex flex-1 flex-wrap items-center gap-2.5">
						<div class="relative w-full sm:w-64">
							<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
							<label class="sr-only" for="cms-search">{m.adm_search_ph()}</label>
							<input
								id="cms-search"
								type="text"
								bind:value={searchQuery}
								placeholder={m.adm_search_ph()}
								class="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pr-3 pl-9 text-xs focus:ring-1 focus:ring-emerald-700 focus:outline-none"
							/>
						</div>

						<div class="flex items-center gap-1 overflow-x-auto py-1">
							{#each [{ id: 'all', label: m.adm_st_all() }, { id: 'published', label: m.adm_st_published() }, { id: 'draft', label: m.adm_st_draft() }, { id: 'scheduled', label: m.adm_st_scheduled() }, { id: 'archived', label: m.adm_st_archived() }] as st (st.id)}
								<button
									type="button"
									onclick={() => (statusFilter = st.id as StatusFilter)}
									class="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors {statusFilter ===
									st.id
										? 'bg-emerald-700 text-white'
										: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
								>
									{st.label}
								</button>
							{/each}
						</div>

						<label class="sr-only" for="cms-cat-filter">{m.adm_all_categories()}</label>
						<Select.Root
							items={categoryFilterItems}
							value={selectedCategoryFilter}
							onValueChange={(v) => v && (selectedCategoryFilter = v)}
						>
							<Select.Trigger
								id="cms-cat-filter"
								size="sm"
								class="h-8 rounded-xl border-gray-200 bg-gray-50 text-xs text-gray-700"
							>
								<Select.Value placeholder={m.adm_all_categories()} />
							</Select.Trigger>
							<Select.Content>
								{#each Object.entries(categoryFilterItems) as [val, label] (val)}
									<Select.Item value={val} {label}>{label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<button
						type="button"
						onclick={handleCreateNewArticle}
						class="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-800"
					>
						<Plus class="h-4 w-4" />
						<span>{m.adm_new_article()}</span>
					</button>
				</div>

				<div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
					<div class="overflow-x-auto">
						<table class="w-full border-collapse text-left text-xs text-gray-600">
							<thead
								class="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold tracking-wider text-gray-400 uppercase"
							>
								<tr>
									<th class="px-4 py-3.5 font-semibold">{m.adm_col_article()}</th>
									<th class="px-4 py-3.5 font-semibold">{m.adm_col_author()}</th>
									<th class="px-4 py-3.5 font-semibold">{m.adm_col_category()}</th>
									<th class="px-4 py-3.5 font-semibold">{m.adm_col_status()}</th>
									<th class="px-4 py-3.5 text-right font-semibold">{m.adm_col_actions()}</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-100">
								{#if filteredPosts.length === 0}
									<tr>
										<td colspan={5} class="py-12 text-center text-gray-400">
											<BookOpen class="mx-auto mb-2 h-8 w-8 stroke-1 text-gray-300" />
											<p class="text-xs font-semibold text-gray-600">
												{m.adm_empty_title()}
											</p>
											<p class="mt-0.5 text-[11px] text-gray-400">
												{m.adm_empty_hint()}
											</p>
										</td>
									</tr>
								{:else}
									{#each filteredPosts as post (post.id)}
										{@const authorName = post.author?.name || m.adm_default_author()}
										{@const authorAvatar = post.author?.avatar}
										<tr
											onclick={() => (peekPost = post)}
											class="group cursor-pointer transition-colors hover:bg-emerald-50/30"
										>
											<td class="px-4 py-3">
												<div class="flex max-w-md items-center gap-3">
													<div
														class="h-10 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
													>
														{#if post.coverImage && post.coverImage.trim().length > 0}
															<img
																src={post.coverImage}
																alt={post.title}
																class="h-full w-full object-cover"
															/>
														{:else}
															<div
																class="flex h-full w-full items-center justify-center text-gray-300"
															>
																<ImageIcon class="h-4 w-4" />
															</div>
														{/if}
													</div>
													<div class="min-w-0">
														<div
															class="truncate font-bold text-gray-900 transition-colors group-hover:text-emerald-800"
														>
															{post.title || m.adm_no_title()}
														</div>
														<div class="mt-0.5 truncate font-mono text-[11px] text-gray-400">
															/blog/{post.slug || 'draft'}
														</div>
													</div>
												</div>
											</td>

											<td class="px-4 py-3">
												<div class="flex items-center gap-2">
													<div
														class="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-[10px] font-bold text-gray-600"
													>
														{#if authorAvatar && authorAvatar.trim().length > 0}
															<img
																src={authorAvatar}
																alt={authorName}
																class="h-full w-full object-cover"
															/>
														{:else}
															{authorName[0]}
														{/if}
													</div>
													<span class="font-medium text-gray-800">{authorName}</span>
												</div>
											</td>

											<td class="px-4 py-3">
												<span
													class="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800"
												>
													{post.category || m.adm_default_category()}
												</span>
											</td>

											<td class="px-4 py-3">
												<span class={statusBadgeClasses(post.status)}
													>{post.status || m.adm_st_draft()}</span
												>
											</td>

											<td class="px-4 py-3 text-right">
												<div
													class="flex items-center justify-end gap-1"
													onclick={(e) => e.stopPropagation()}
													role="presentation"
												>
													{#if canEditPost(post)}
														<button
															type="button"
															onclick={() => handleOpenEditor(post)}
															class="rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-emerald-100 hover:text-emerald-800"
															title={m.adm_edit_tip()}
														>
															<SquarePen class="h-4 w-4" />
														</button>
													{/if}
													<button
														type="button"
														onclick={() => {
															activeArticle = post;
															previewActive = true;
														}}
														class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
														title={m.adm_preview_pub()}
													>
														<Eye class="h-4 w-4" />
													</button>
													{#if canDeletePost(post)}
														<button
															type="button"
															onclick={() => {
																if (window.confirm(m.adm_confirm_del_post({ title: post.title }))) {
																	admin.deletePost(post.id);
																}
															}}
															class="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
															title={m.adm_delete()}
														>
															<Trash2 class="h-4 w-4" />
														</button>
													{/if}
												</div>
											</td>
										</tr>
									{/each}
								{/if}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		{:else if currentSubView === 'kategori'}
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<p class="text-xs text-gray-500">{m.adm_cat_hint()}</p>
					{#if canManageCategories}
						<button
							type="button"
							onclick={() => {
								editingCategory = null;
								categoryModalOpen = true;
							}}
							class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800"
						>
							<Plus class="h-3.5 w-3.5" />
							<span>{m.adm_add_category()}</span>
						</button>
					{/if}
				</div>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each categories as cat (cat.id)}
						{@const articleCount = posts.filter((p) => p.category === cat.name).length}
						<div
							class="flex flex-col justify-between space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs"
						>
							<div class="space-y-1.5">
								<div class="flex items-center justify-between">
									<h3 class="text-sm font-bold text-gray-900">{cat.name}</h3>
									<span
										class="rounded-full px-2 py-0.5 text-[10px] font-bold {cat.active !== false
											? 'bg-emerald-100 text-emerald-800'
											: 'bg-gray-100 text-gray-600'}"
									>
										{cat.active !== false ? m.adm_active() : m.adm_inactive()}
									</span>
								</div>
								<p class="line-clamp-2 text-xs text-gray-500">
									{cat.description || m.adm_no_desc()}
								</p>
								<div class="font-mono text-[11px] text-gray-400">
									slug: {cat.slug}
								</div>
							</div>

							<div class="flex items-center justify-between border-t border-gray-100 pt-2 text-xs">
								<span class="font-semibold text-gray-500"
									>{m.adm_articles_count({ count: articleCount })}</span
								>
								{#if canManageCategories}
									<div class="flex items-center gap-1">
										<button
											type="button"
											onclick={() => {
												editingCategory = cat;
												categoryModalOpen = true;
											}}
											class="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 hover:text-emerald-700"
											title={m.adm_edit_category()}
										>
											<SquarePen class="h-3.5 w-3.5" />
										</button>
										<button
											type="button"
											onclick={() => {
												if (window.confirm(m.adm_confirm_del_cat({ name: cat.name }))) {
													admin.deleteCategory(cat.id);
												}
											}}
											class="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
											title={m.adm_delete_category()}
										>
											<Trash2 class="h-3.5 w-3.5" />
										</button>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else if currentSubView === 'author'}
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<p class="text-xs text-gray-500">{m.adm_author_hint()}</p>
					{#if canManageAuthors}
						<button
							type="button"
							onclick={() => {
								editingAuthor = null;
								authorModalOpen = true;
							}}
							class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800"
						>
							<Plus class="h-3.5 w-3.5" />
							<span>{m.adm_add_author()}</span>
						</button>
					{/if}
				</div>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each authors as author (author.id)}
						{@const articleCount = posts.filter((p) => p.author?.name === author.name).length}
						<div
							class="flex flex-col justify-between space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs"
						>
							<div class="flex items-start gap-3">
								<div
									class="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100"
								>
									{#if author.avatarUrl && author.avatarUrl.trim().length > 0}
										<img
											src={author.avatarUrl}
											alt={author.name}
											class="h-full w-full object-cover"
										/>
									{:else}
										<div
											class="flex h-full w-full items-center justify-center font-bold text-gray-400"
										>
											{author.name[0]}
										</div>
									{/if}
								</div>
								<div class="min-w-0 flex-1">
									<div class="flex items-center justify-between">
										<h3 class="truncate text-sm font-bold text-gray-900">{author.name}</h3>
										<span
											class="rounded-full px-2 py-0.5 text-[10px] font-bold {author.active !== false
												? 'bg-emerald-100 text-emerald-800'
												: 'bg-gray-100 text-gray-600'}"
										>
											{author.active !== false ? m.adm_active() : m.adm_inactive()}
										</span>
									</div>
									<p class="text-xs font-semibold text-emerald-700">{author.role}</p>
									{#if author.bio}
										<p class="mt-1 line-clamp-2 text-xs text-gray-500">{author.bio}</p>
									{/if}
								</div>
							</div>

							<div class="flex items-center justify-between border-t border-gray-100 pt-2 text-xs">
								<span class="font-semibold text-gray-500"
									>{m.adm_articles_written({ count: articleCount })}</span
								>
								<div class="flex items-center gap-1">
									<button
										type="button"
										onclick={() => {
											editingAuthor = author;
											authorModalOpen = true;
										}}
										class="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 hover:text-emerald-700"
										title={m.adm_edit_author_title()}
									>
										<SquarePen class="h-3.5 w-3.5" />
									</button>
									<button
										type="button"
										onclick={() => {
											if (window.confirm(m.adm_confirm_del_author({ name: author.name }))) {
												admin.deleteAuthor(author.id);
											}
										}}
										class="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
										title={m.adm_delete_author()}
									>
										<Trash2 class="h-3.5 w-3.5" />
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else if currentSubView === 'media'}
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<p class="text-xs text-gray-500">{m.adm_media_hint()}</p>
					<button
						type="button"
						onclick={() => (libraryMediaOpen = true)}
						class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800"
					>
						<Upload class="h-3.5 w-3.5" />
						<span>{m.adm_upload_media()}</span>
					</button>
				</div>

				<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
					{#each files.filter((f) => f.category === 'blog_asset' || f.mimeType.startsWith('image/')) as file (file.id)}
						<div
							class="group flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs"
						>
							<div
								class="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gray-100"
							>
								{#if file.publicUrl && file.publicUrl.trim().length > 0}
									<img
										src={file.publicUrl}
										alt={file.originalName}
										class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
									/>
								{:else}
									<ImageIcon class="h-8 w-8 text-gray-400" />
								{/if}
							</div>
							<div class="space-y-1 p-3">
								<div class="truncate text-xs font-bold text-gray-900" title={file.originalName}>
									{file.originalName}
								</div>
								<div class="flex items-center justify-between text-[10px] text-gray-400">
									<span>{formatBytes(file.sizeBytes)}</span>
									<span>{file.mimeType.split('/')[1]?.toUpperCase()}</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<BlogPeekDrawer
			open={!!peekPost}
			post={peekPost}
			canEdit={peekPost ? canEditPost(peekPost) : false}
			canDelete={peekPost ? canDeletePost(peekPost) : false}
			onClose={() => (peekPost = null)}
			onEdit={(post) => handleOpenEditor(post)}
			onPreview={(post) => {
				activeArticle = post;
				previewActive = true;
			}}
			onToggleStatus={(post) => {
				if (!canPublish) return;
				const next: BlogPostStatus = post.status === 'published' ? 'draft' : 'published';
				admin.savePost({ ...post, status: next });
				peekPost = { ...post, status: next };
			}}
			onDelete={(id) => {
				if (!peekPost || !canDeletePost(peekPost)) return;
				admin.deletePost(id);
				peekPost = null;
			}}
		/>

		<CategoryModal
			open={categoryModalOpen}
			category={editingCategory}
			onClose={() => (categoryModalOpen = false)}
			onSave={(cat) => {
				admin.saveCategory({
					id: cat.id || 'cat-' + Date.now(),
					name: cat.name || '',
					slug: cat.slug || '',
					description: cat.description || '',
					active: cat.active !== false,
					sortOrder: cat.sortOrder || 1,
					createdAt: cat.createdAt || new Date().toISOString(),
					updatedAt: new Date().toISOString()
				});
			}}
		/>

		<AuthorModal
			open={authorModalOpen}
			author={editingAuthor}
			{files}
			onClose={() => (authorModalOpen = false)}
			onSave={(auth) => {
				admin.saveAuthor({
					id: auth.id || 'author-' + Date.now(),
					name: auth.name || '',
					slug: auth.slug || '',
					role: auth.role || '',
					bio: auth.bio || '',
					avatarUrl: auth.avatarUrl || '',
					active: auth.active !== false,
					createdAt: auth.createdAt || new Date().toISOString(),
					updatedAt: new Date().toISOString()
				});
			}}
			onUploadAvatar={(f) => admin.uploadBlogMedia(f)}
		/>

		<MediaModal
			open={libraryMediaOpen}
			{files}
			onClose={() => (libraryMediaOpen = false)}
			onUploadFile={(f) => admin.uploadBlogMedia(f)}
			onSelectFile={() => undefined}
		/>
	</div>
{/if}
