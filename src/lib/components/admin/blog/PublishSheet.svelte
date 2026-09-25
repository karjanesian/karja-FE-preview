<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import type { BlogPost, BlogCategoryRecord, BlogAuthor, BlogPostStatus } from '$lib/types/blog';
	import type { FileAsset } from '$lib/types/fileAsset';
	import MediaModal from './MediaModal.svelte';
	import * as Select from '$lib/components/ui/select';
	import * as Popover from '$lib/components/ui/popover';
	import { Calendar as CalendarPicker } from '$lib/components/ui/calendar';
	import { parseDate } from '@internationalized/date';
	import X from 'lucide-svelte/icons/x';
	import Upload from 'lucide-svelte/icons/upload';
	import ImageIcon from 'lucide-svelte/icons/image';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Globe from 'lucide-svelte/icons/globe';
	import Tag from 'lucide-svelte/icons/tag';
	import User from 'lucide-svelte/icons/user';
	import Folder from 'lucide-svelte/icons/folder';
	import Trash2 from 'lucide-svelte/icons/trash-2';

	type Props = {
		open: boolean;
		article: Partial<BlogPost>;
		categories: BlogCategoryRecord[];
		authors: BlogAuthor[];
		files: FileAsset[];
		canPublish?: boolean;
		onClose: () => void;
		onUpdateArticle: (fields: Partial<BlogPost>) => void;
		onPublish: () => void;
		onSaveDraft: () => void;
		onUploadCover?: ((file: File) => Promise<FileAsset | null>) | undefined;
	};

	let {
		open,
		article,
		categories,
		authors,
		files,
		canPublish = true,
		onClose,
		onUpdateArticle,
		onPublish,
		onSaveDraft,
		onUploadCover
	}: Props = $props();

	let mediaModalOpen = $state(false);
	let newTagInput = $state('');

	const currentStatus = $derived<BlogPostStatus>(article.status || 'draft');
	const currentCategory = $derived(
		article.category || categories[0]?.name || m.adm_default_category()
	);
	const currentAuthorName = $derived(
		article.author?.name || authors[0]?.name || m.adm_default_author()
	);
	const currentSlug = $derived(article.slug || '');
	const currentCover = $derived(
		typeof article.coverImage === 'string' && article.coverImage.trim().length > 0
			? article.coverImage
			: null
	);
	const currentAlt = $derived(article.coverImageAlt || '');
	const currentTags = $derived(article.tags || []);

	const categoryItems = $derived<Record<string, string>>(
		Object.fromEntries(categories.filter((c) => c.active !== false).map((c) => [c.name, c.name]))
	);
	const authorItems = $derived<Record<string, string>>(
		Object.fromEntries(
			authors.filter((a) => a.active !== false).map((a) => [a.name, `${a.name} (${a.role})`])
		)
	);

	const seoTitle = $derived(article.seoTitle || article.title || m.adm_seo_default_title());
	const metaDescription = $derived(
		article.metaDescription || article.excerpt || m.adm_seo_default_desc()
	);

	const statusOptions = $derived([
		{ id: 'draft' as const, label: m.adm_st_draft(), desc: m.adm_status_draft_desc() },
		{ id: 'published' as const, label: m.adm_st_published(), desc: m.adm_status_published_desc() },
		{ id: 'scheduled' as const, label: m.adm_st_scheduled(), desc: m.adm_status_scheduled_desc() },
		{ id: 'archived' as const, label: m.adm_st_archived(), desc: m.adm_status_archived_desc() }
	]);

	function handleMetaDescInput(e: Event) {
		onUpdateArticle({ metaDescription: (e.currentTarget as HTMLTextAreaElement).value });
	}

	function handleAddTag() {
		if (!newTagInput.trim()) return;
		const clean = newTagInput.trim().toLowerCase();
		if (!currentTags.includes(clean)) {
			onUpdateArticle({ tags: [...currentTags, clean] });
		}
		newTagInput = '';
	}

	function handleRemoveTag(tagToRemove: string) {
		onUpdateArticle({ tags: currentTags.filter((t) => t !== tagToRemove) });
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (open && e.key === 'Escape') onClose();
	}}
/>

{#if open}
	<div class="fixed inset-0 z-50" role="presentation">
		<div
			class="backdrop-blur-2xs absolute inset-0 bg-gray-950/40 transition-opacity"
			role="presentation"
			onclick={onClose}
		></div>

		<div class="fixed inset-y-0 right-0 flex max-w-full pl-10">
			<div
				class="flex w-screen max-w-md flex-col justify-between border-l border-gray-200 bg-white shadow-2xl"
				role="dialog"
				aria-modal="true"
				tabindex="-1"
				aria-label={m.adm_sheet_title()}
			>
				<div
					class="flex items-center justify-between border-b border-gray-200 bg-gray-50/50 px-6 py-5"
				>
					<div>
						<h3 class="text-base font-bold text-gray-950">{m.adm_sheet_title()}</h3>
						<p class="text-xs text-gray-500">{m.adm_sheet_sub()}</p>
					</div>
					<button
						type="button"
						onclick={onClose}
						class="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
						aria-label={m.common_close()}
					>
						<X class="h-5 w-5" />
					</button>
				</div>

				<div class="flex-1 space-y-6 overflow-y-auto px-6 py-6 text-sm text-gray-700">
					<div class="space-y-2">
						<span class="block text-xs font-bold tracking-wider text-gray-900 uppercase">
							{m.adm_status_label()}
						</span>
						<div class="grid grid-cols-2 gap-2">
							{#each statusOptions as st (st.id)}
								<button
									type="button"
									onclick={() => onUpdateArticle({ status: st.id })}
									class="rounded-xl border p-2.5 text-left transition-all {currentStatus === st.id
										? 'border-emerald-700 bg-emerald-50/60 text-emerald-950 ring-1 ring-emerald-700'
										: 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}"
								>
									<div class="text-xs font-semibold">{st.label}</div>
									<div class="text-[11px] text-gray-400">{st.desc}</div>
								</button>
							{/each}
						</div>

						{#if currentStatus === 'scheduled'}
							<div class="mt-3 space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
								<div class="flex items-center gap-1.5 text-xs font-bold text-amber-900">
									<Calendar class="h-3.5 w-3.5" />
									<span>{m.adm_schedule_title()}</span>
								</div>
								<label class="sr-only" for="pub-scheduled-at">{m.adm_schedule_title()}</label>
								<Popover.Root>
									<Popover.Trigger>
										<button
											type="button"
											id="pub-scheduled-at"
											class="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-amber-300 bg-white p-2 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
										>
											<Calendar class="h-3.5 w-3.5" />
											<span class={article.scheduledAt ? 'text-gray-700' : 'text-gray-400'}>
												{article.scheduledAt || '—'}
											</span>
										</button>
									</Popover.Trigger>
									<Popover.Content class="w-auto p-0">
										<CalendarPicker
											type="single"
											value={article.scheduledAt?.includes('T')
												? parseDate(article.scheduledAt.slice(0, 10))
												: undefined}
											onValueChange={(d) => {
												if (!d) return;
												const prev = article.scheduledAt || '';
												const time = prev.includes('T') ? prev.slice(11, 16) : '00:00';
												onUpdateArticle({ scheduledAt: `${d.toString()}T${time}` });
											}}
										/>
									</Popover.Content>
								</Popover.Root>
							</div>
						{/if}
					</div>

					<div class="h-px w-full bg-gray-100"></div>

					<div class="space-y-4">
						<div>
							<span
								class="mb-1.5 block flex items-center gap-1.5 text-xs font-bold tracking-wider text-gray-900 uppercase"
							>
								<Folder class="h-3.5 w-3.5 text-gray-400" />
								<span>{m.adm_field_category()}</span>
							</span>
							<label class="sr-only" for="pub-category">{m.adm_field_category()}</label>
							<Select.Root
								items={categoryItems}
								value={currentCategory}
								onValueChange={(v) => v && onUpdateArticle({ category: v })}
							>
								<Select.Trigger
									id="pub-category"
									class="h-9 w-full rounded-xl border-gray-300 bg-white text-xs font-medium"
								>
									<Select.Value placeholder={currentCategory} />
								</Select.Trigger>
								<Select.Content>
									{#each Object.entries(categoryItems) as [val, label] (val)}
										<Select.Item value={val} {label}>{label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>

						<div>
							<span
								class="mb-1.5 block flex items-center gap-1.5 text-xs font-bold tracking-wider text-gray-900 uppercase"
							>
								<User class="h-3.5 w-3.5 text-gray-400" />
								<span>{m.adm_field_author()}</span>
							</span>
							<label class="sr-only" for="pub-author">{m.adm_field_author()}</label>
							<Select.Root
								items={authorItems}
								value={currentAuthorName}
								onValueChange={(v) => {
									if (!v) return;
									const selected = authors.find((a) => a.name === v);
									if (selected) {
										onUpdateArticle({
											author: {
												name: selected.name,
												role: selected.role,
												avatar: selected.avatarUrl
											}
										});
									}
								}}
							>
								<Select.Trigger
									id="pub-author"
									class="h-9 w-full rounded-xl border-gray-300 bg-white text-xs font-medium"
								>
									<Select.Value placeholder={currentAuthorName} />
								</Select.Trigger>
								<Select.Content>
									{#each Object.entries(authorItems) as [val, label] (val)}
										<Select.Item value={val} {label}>{label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>
					</div>

					<div class="h-px w-full bg-gray-100"></div>

					<div class="space-y-2">
						<span
							class="block flex items-center gap-1.5 text-xs font-bold tracking-wider text-gray-900 uppercase"
						>
							<ImageIcon class="h-3.5 w-3.5 text-gray-400" />
							<span>{m.adm_field_cover()}</span>
						</span>

						{#if currentCover}
							<div class="space-y-2">
								<div
									class="relative aspect-[16/9] overflow-hidden rounded-xl border border-gray-200 bg-gray-100"
								>
									<img
										src={currentCover}
										alt={currentAlt || m.adm_field_cover()}
										class="h-full w-full object-cover"
									/>
									<button
										type="button"
										onclick={() => onUpdateArticle({ coverImage: '', coverImageAlt: '' })}
										class="absolute top-2 right-2 rounded-lg bg-gray-900/80 p-1.5 text-white shadow-xs transition-colors hover:bg-rose-600"
										title={m.adm_remove_cover()}
									>
										<Trash2 class="h-3.5 w-3.5" />
									</button>
								</div>
								<div class="flex gap-2">
									<button
										type="button"
										onclick={() => (mediaModalOpen = true)}
										class="flex-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-center text-xs font-semibold text-gray-700 hover:bg-gray-50"
									>
										{m.adm_change_cover()}
									</button>
								</div>
								<div>
									<label class="mb-1 block text-[11px] text-gray-500" for="pub-cover-alt">
										{m.adm_alt_label()}
									</label>
									<input
										id="pub-cover-alt"
										type="text"
										value={currentAlt}
										oninput={(e) => onUpdateArticle({ coverImageAlt: e.currentTarget.value })}
										placeholder={m.adm_alt_ph()}
										class="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs focus:ring-1 focus:ring-emerald-700 focus:outline-none"
									/>
								</div>
							</div>
						{:else}
							<button
								type="button"
								onclick={() => (mediaModalOpen = true)}
								class="w-full cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-emerald-600 hover:bg-emerald-50/40"
							>
								<Upload class="mx-auto mb-1.5 h-6 w-6 text-gray-400" />
								<p class="text-xs font-semibold text-gray-700">{m.adm_cover_upload()}</p>
								<p class="mt-0.5 text-[11px] text-gray-400">{m.adm_cover_hint()}</p>
							</button>
						{/if}
					</div>

					<div class="h-px w-full bg-gray-100"></div>

					<div class="space-y-2">
						<span
							class="block flex items-center gap-1.5 text-xs font-bold tracking-wider text-gray-900 uppercase"
						>
							<Globe class="h-3.5 w-3.5 text-gray-400" />
							<span>{m.adm_field_slug()}</span>
						</span>
						<div
							class="flex items-center overflow-hidden rounded-xl border border-gray-300 bg-gray-50 focus-within:border-emerald-700 focus-within:ring-1 focus-within:ring-emerald-700"
						>
							<span class="py-2 pr-1 pl-3 font-mono text-xs text-gray-400">/blog/</span>
							<label class="sr-only" for="pub-slug">{m.adm_field_slug()}</label>
							<input
								id="pub-slug"
								type="text"
								value={currentSlug}
								oninput={(e) =>
									onUpdateArticle({
										slug: e.currentTarget.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
									})}
								placeholder={m.adm_slug_ph()}
								class="w-full bg-transparent py-2 pr-3 font-mono text-xs text-gray-900 focus:outline-none"
							/>
						</div>
					</div>

					<div
						class="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-3"
					>
						<div>
							<div class="text-xs font-bold text-gray-900">{m.adm_featured_t()}</div>
							<div class="text-[11px] text-gray-500">{m.adm_featured_d()}</div>
						</div>
						<input
							id="pub-featured"
							type="checkbox"
							checked={!!article.featured}
							onchange={(e) => onUpdateArticle({ featured: e.currentTarget.checked })}
							class="h-4 w-4 cursor-pointer rounded-md text-emerald-700 focus:ring-emerald-600"
						/>
						<label class="sr-only" for="pub-featured">{m.adm_featured_t()}</label>
					</div>

					<div class="space-y-2">
						<span
							class="block flex items-center gap-1.5 text-xs font-bold tracking-wider text-gray-900 uppercase"
						>
							<Tag class="h-3.5 w-3.5 text-gray-400" />
							<span>{m.adm_tags_label()}</span>
						</span>
						<div class="flex flex-wrap gap-1.5">
							{#each currentTags as tag (tag)}
								<span
									class="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800"
								>
									#{tag}
									<button
										type="button"
										onclick={() => handleRemoveTag(tag)}
										class="hover:text-rose-600"
										aria-label="{m.adm_remove_tag()} {tag}"
									>
										<X class="h-3 w-3" />
									</button>
								</span>
							{/each}
						</div>
						<div class="flex gap-2">
							<label class="sr-only" for="pub-new-tag">{m.adm_tags_ph()}</label>
							<input
								id="pub-new-tag"
								type="text"
								bind:value={newTagInput}
								onkeydown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										handleAddTag();
									}
								}}
								placeholder={m.adm_tags_ph()}
								class="flex-1 rounded-lg border border-gray-200 bg-white p-2 text-xs focus:ring-1 focus:ring-emerald-700 focus:outline-none"
							/>
							<button
								type="button"
								onclick={handleAddTag}
								class="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
							>
								{m.adm_add()}
							</button>
						</div>
					</div>

					<div class="h-px w-full bg-gray-100"></div>

					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<span class="block text-xs font-bold tracking-wider text-gray-900 uppercase">
								{m.adm_seo_label()}
							</span>
							<span
								class="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
							>
								{m.adm_live_preview()}
							</span>
						</div>

						<div class="space-y-1 rounded-xl border border-gray-300 bg-white p-3.5 font-sans">
							<div class="flex items-center gap-1 truncate text-[11px] text-gray-500">
								<span>karja.id</span>
								<span>›</span>
								<span>blog</span>
								<span>›</span>
								<span class="font-mono">{currentSlug || m.adm_slug_fallback()}</span>
							</div>
							<div
								class="line-clamp-1 cursor-pointer text-xs font-medium text-blue-700 hover:underline sm:text-sm"
							>
								{seoTitle}
							</div>
							<div class="line-clamp-2 text-[11px] leading-relaxed text-gray-600">
								{metaDescription}
							</div>
						</div>

						<div>
							<label class="mb-1 block text-[11px] text-gray-500" for="pub-seo-title">
								{m.adm_seo_title()}
							</label>
							<input
								id="pub-seo-title"
								type="text"
								value={article.seoTitle || ''}
								oninput={(e) => onUpdateArticle({ seoTitle: e.currentTarget.value })}
								placeholder={article.title || m.adm_seo_title_ph()}
								class="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs focus:ring-1 focus:ring-emerald-700 focus:outline-none"
							/>
						</div>

						<div>
							<label class="mb-1 block text-[11px] text-gray-500" for="pub-meta-desc">
								{m.adm_meta_desc()}
							</label>
							<textarea
								id="pub-meta-desc"
								rows="2"
								value={article.metaDescription || ''}
								oninput={handleMetaDescInput}
								placeholder={article.excerpt || m.adm_meta_ph()}
								class="w-full resize-none rounded-lg border border-gray-200 bg-white p-2 text-xs focus:ring-1 focus:ring-emerald-700 focus:outline-none"
							></textarea>
						</div>
					</div>
				</div>

				<div class="flex flex-col gap-2 border-t border-gray-200 bg-gray-50 p-4">
					{#if !canPublish}
						<p
							class="rounded-lg border border-amber-200 bg-amber-50 p-2 text-center text-[11px] font-medium text-amber-700"
						>
							{m.adm_no_publish_note()}
						</p>
					{/if}
					<div class="flex items-center gap-2">
						<button
							type="button"
							onclick={onSaveDraft}
							class="flex-1 rounded-xl border border-gray-300 bg-white py-2.5 text-xs font-semibold text-gray-800 transition-colors hover:bg-gray-100"
						>
							{m.adm_save_draft()}
						</button>
						{#if canPublish}
							<button
								type="button"
								onclick={onPublish}
								class="flex-1 rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-800"
							>
								{m.adm_publish()}
							</button>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<MediaModal
			open={mediaModalOpen}
			{files}
			onClose={() => (mediaModalOpen = false)}
			onUploadFile={onUploadCover}
			onSelectFile={(f) => {
				onUpdateArticle({
					coverImage: f.publicUrl || '',
					coverImageAlt: f.originalName
				});
			}}
		/>
	</div>
{/if}
