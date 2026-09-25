<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import type { BlogPost } from '$lib/types/blog';
	import X from 'lucide-svelte/icons/x';
	import SquarePen from 'lucide-svelte/icons/square-pen';
	import Eye from 'lucide-svelte/icons/eye';
	import User from 'lucide-svelte/icons/user';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import CircleCheck from 'lucide-svelte/icons/circle-check';

	type Props = {
		open: boolean;
		post: BlogPost | null;
		canEdit?: boolean;
		canDelete?: boolean;
		onClose: () => void;
		onEdit: (post: BlogPost) => void;
		onPreview: (post: BlogPost) => void;
		onToggleStatus: (post: BlogPost) => void;
		onDelete: (postId: string) => void;
	};

	let {
		open,
		post,
		canEdit = true,
		canDelete = false,
		onClose,
		onEdit,
		onPreview,
		onToggleStatus: _onToggleStatus,
		onDelete
	}: Props = $props();

	const authorName = $derived(post?.author?.name || m.adm_default_author());
	const authorRole = $derived(post?.author?.role);
	const authorAvatar = $derived(post?.author?.avatar);

	const hasCover = $derived(!!post?.coverImage);
	const hasExcerpt = $derived(!!post?.excerpt && (post?.excerpt.length ?? 0) > 20);
	const hasSeoTitle = $derived(!!post?.seoTitle);
	const hasMetaDesc = $derived(!!post?.metaDescription);
	const hasSlug = $derived(!!post?.slug);
	const seoScore = $derived(
		[hasCover, hasExcerpt, hasSeoTitle, hasMetaDesc, hasSlug].filter(Boolean).length * 20
	);

	function statusClasses(status?: string): string {
		return `px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
			status === 'published'
				? 'bg-emerald-100 text-emerald-800'
				: status === 'scheduled'
					? 'bg-amber-100 text-amber-800'
					: status === 'archived'
						? 'bg-gray-100 text-gray-700'
						: 'bg-blue-100 text-blue-800'
		}`;
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (open && e.key === 'Escape') onClose();
	}}
/>

{#if open && post}
	<div class="fixed inset-0 z-50">
		<div class="absolute inset-0 bg-gray-950/40" role="presentation" onclick={onClose}></div>
		<div class="fixed inset-y-0 right-0 flex max-w-full pl-10">
			<div
				class="flex w-screen max-w-lg flex-col justify-between border-l border-gray-200 bg-white shadow-2xl"
				role="dialog"
				aria-modal="true"
				tabindex="-1"
				aria-label={post.title || m.adm_no_title()}
			>
				<div
					class="flex items-center justify-between border-b border-gray-200 bg-gray-50/50 px-6 py-4"
				>
					<div class="flex items-center gap-2">
						<span class={statusClasses(post.status)}>{post.status || m.adm_st_draft()}</span>
						{#if post.featured}
							<span
								class="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700"
							>
								{m.adm_featured_badge()}
							</span>
						{/if}
					</div>
					<button
						type="button"
						onclick={onClose}
						class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
						aria-label={m.common_close()}
					>
						<X class="h-5 w-5" />
					</button>
				</div>

				<div class="flex-1 space-y-6 overflow-y-auto p-6 text-xs text-gray-700">
					{#if post.coverImage && post.coverImage.trim().length > 0}
						<div
							class="aspect-[16/9] overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-xs"
						>
							<img
								src={post.coverImage}
								alt={post.coverImageAlt || post.title}
								class="h-full w-full object-cover"
							/>
						</div>
					{:else}
						<div
							class="flex aspect-[16/9] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-100 text-gray-400"
						>
							{m.adm_no_cover()}
						</div>
					{/if}

					<div class="space-y-2">
						<div
							class="flex items-center gap-2 text-[11px] font-bold tracking-wider text-emerald-700 uppercase"
						>
							<span>{post.category || m.adm_default_category()}</span>
							<span>•</span>
							<span class="font-normal text-gray-400"
								>{post.readingTime || m.adm_default_reading()}</span
							>
						</div>
						<h2 class="text-xl leading-snug font-bold tracking-tight text-gray-950">
							{post.title}
						</h2>
						{#if post.excerpt}
							<p class="text-xs leading-relaxed text-gray-600 sm:text-sm">
								{post.excerpt}
							</p>
						{/if}
					</div>

					<div class="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3.5">
						<div
							class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-300 bg-gray-200"
						>
							{#if authorAvatar && authorAvatar.trim().length > 0}
								<img src={authorAvatar} alt={authorName} class="h-full w-full object-cover" />
							{:else}
								<User class="h-5 w-5 text-gray-400" />
							{/if}
						</div>
						<div class="min-w-0 flex-1">
							<div class="truncate text-xs font-bold text-gray-900">{authorName}</div>
							<div class="truncate text-[11px] text-gray-500">
								{authorRole || m.adm_default_author_role()}
							</div>
						</div>
						<div class="text-right text-[11px] text-gray-400">
							{post.publishedAt || m.adm_st_draft()}
						</div>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div class="rounded-xl border border-gray-200 bg-gray-50 p-3">
							<div class="text-[11px] text-gray-400">{m.adm_total_readers()}</div>
							<div class="mt-0.5 text-lg font-bold text-gray-900">
								{(post.viewsCount !== undefined ? post.viewsCount : 0).toLocaleString('id-ID')}
							</div>
						</div>
						<div class="rounded-xl border border-gray-200 bg-gray-50 p-3">
							<div class="text-[11px] text-gray-400">{m.adm_seo_readiness()}</div>
							<div class="mt-0.5 text-lg font-bold text-emerald-700">{seoScore}%</div>
						</div>
					</div>

					<div class="space-y-2 rounded-2xl border border-gray-200 bg-gray-50 p-3.5">
						<h4 class="mb-2 text-xs font-bold tracking-wider text-gray-900 uppercase">
							{m.adm_seo_checklist()}
						</h4>
						<div class="space-y-1.5 text-[11px]">
							<div class="flex items-center justify-between">
								<span class="text-gray-600">{m.adm_check_cover()}</span>
								{#if hasCover}
									<span class="flex items-center gap-1 font-semibold text-emerald-700">
										<CircleCheck class="h-3.5 w-3.5" />
										{m.adm_complete()}
									</span>
								{:else}
									<span class="flex items-center gap-1 text-amber-600">{m.adm_missing()}</span>
								{/if}
							</div>
							<div class="flex items-center justify-between">
								<span class="text-gray-600">{m.adm_check_excerpt()}</span>
								{#if hasExcerpt}
									<span class="flex items-center gap-1 font-semibold text-emerald-700">
										<CircleCheck class="h-3.5 w-3.5" />
										{m.adm_complete()}
									</span>
								{:else}
									<span class="flex items-center gap-1 text-amber-600">{m.adm_missing()}</span>
								{/if}
							</div>
							<div class="flex items-center justify-between">
								<span class="text-gray-600">{m.adm_check_slug()}</span>
								<span class="font-mono text-gray-700">/blog/{post.slug}</span>
							</div>
						</div>
					</div>
				</div>

				<div class="flex items-center gap-2 border-t border-gray-200 bg-gray-50 p-4">
					{#if canEdit}
						<button
							type="button"
							onclick={() => onEdit(post)}
							class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-800"
						>
							<SquarePen class="h-4 w-4" />
							<span>{m.adm_edit_article()}</span>
						</button>
					{/if}
					<button
						type="button"
						onclick={() => onPreview(post)}
						class="{canEdit
							? 'px-3 py-2.5'
							: 'flex-1 py-2.5'} inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-100"
						title={m.adm_preview_pub()}
					>
						<Eye class="h-4 w-4" />
						<span>{m.adm_preview()}</span>
					</button>
					{#if canDelete}
						<button
							type="button"
							onclick={() => {
								if (window.confirm(m.adm_confirm_del_post({ title: post.title }))) {
									onDelete(post.id);
									onClose();
								}
							}}
							class="rounded-xl border border-rose-200 p-2.5 text-rose-600 hover:bg-rose-50"
							title={m.adm_delete_article()}
						>
							<Trash2 class="h-4 w-4" />
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
