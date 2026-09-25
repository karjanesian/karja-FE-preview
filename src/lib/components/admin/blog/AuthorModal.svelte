<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import type { BlogAuthor } from '$lib/types/blog';
	import type { FileAsset } from '$lib/types/fileAsset';
	import MediaModal from './MediaModal.svelte';
	import X from 'lucide-svelte/icons/x';
	import User from 'lucide-svelte/icons/user';
	import Upload from 'lucide-svelte/icons/upload';
	import Trash2 from 'lucide-svelte/icons/trash-2';

	type Props = {
		open: boolean;
		author: BlogAuthor | null;
		files: FileAsset[];
		onClose: () => void;
		onSave: (author: Partial<BlogAuthor>) => void;
		onUploadAvatar?: ((file: File) => Promise<FileAsset | null>) | undefined;
	};

	let { open, author, files, onClose, onSave, onUploadAvatar }: Props = $props();

	let name = $state('');
	let slug = $state('');
	let role = $state('');
	let bio = $state('');
	let avatarUrl = $state('');
	let active = $state(true);
	let mediaModalOpen = $state(false);

	$effect(() => {
		if (!open) return;
		void author;
		if (author) {
			name = author.name || '';
			slug = author.slug || '';
			role = author.role || '';
			bio = author.bio || '';
			avatarUrl = author.avatarUrl || '';
			active = author.active !== false;
		} else {
			name = '';
			slug = '';
			role = m.adm_default_role();
			bio = '';
			avatarUrl = '';
			active = true;
		}
	});

	function handleNameChange(val: string) {
		name = val;
		if (!author) {
			slug = val
				.toLowerCase()
				.replace(/[^a-z0-9]/g, '-')
				.replace(/-+/g, '-');
		}
	}

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!name.trim()) return;

		onSave({
			id: author?.id,
			name: name.trim(),
			slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
			role: role.trim(),
			bio: bio.trim(),
			avatarUrl: avatarUrl.trim(),
			active
		});
		onClose();
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (open && e.key === 'Escape') onClose();
	}}
/>

{#if open}
	<div class="fixed inset-0 z-50">
		<div
			class="backdrop-blur-2xs absolute inset-0 animate-in bg-gray-950/50 duration-150 fade-in"
			role="presentation"
			onclick={onClose}
		></div>
		<div class="relative flex h-full w-full items-center justify-center p-4">
			<div
				class="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
				role="dialog"
				aria-modal="true"
				tabindex="-1"
				aria-label={author ? m.adm_edit_author_title() : m.adm_new_author()}
			>
				<div
					class="flex items-center justify-between border-b border-gray-200 bg-gray-50/50 px-6 py-4"
				>
					<div class="flex items-center gap-2">
						<div
							class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800"
						>
							<User class="h-4 w-4" />
						</div>
						<h3 class="text-base font-bold text-gray-900">
							{author ? m.adm_edit_author_title() : m.adm_new_author()}
						</h3>
					</div>
					<button
						type="button"
						onclick={onClose}
						class="rounded-lg p-1 text-gray-400 hover:text-gray-700"
						aria-label={m.common_close()}
					>
						<X class="h-5 w-5" />
					</button>
				</div>

				<form onsubmit={handleSubmit} class="space-y-4 p-6 text-xs">
					<div class="space-y-1.5">
						<span class="block font-bold tracking-wider text-gray-900 uppercase">
							{m.adm_avatar_label()}
						</span>
						<div class="flex items-center gap-4">
							<div
								class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100"
							>
								{#if avatarUrl && avatarUrl.trim().length > 0}
									<img src={avatarUrl} alt={name} class="h-full w-full object-cover" />
								{:else}
									<User class="h-8 w-8 text-gray-400" />
								{/if}
							</div>
							<div class="space-y-1.5">
								<div class="flex gap-2">
									<button
										type="button"
										onclick={() => (mediaModalOpen = true)}
										class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
									>
										<Upload class="h-3.5 w-3.5" />
										<span>{avatarUrl ? m.adm_change_photo() : m.adm_upload_photo()}</span>
									</button>
									{#if avatarUrl}
										<button
											type="button"
											onclick={() => (avatarUrl = '')}
											class="rounded-lg border border-gray-200 p-1.5 text-rose-600 hover:bg-rose-50"
											title={m.adm_delete_photo()}
										>
											<Trash2 class="h-3.5 w-3.5" />
										</button>
									{/if}
								</div>
								<p class="text-[11px] text-gray-400">{m.adm_avatar_hint()}</p>
							</div>
						</div>
					</div>

					<div>
						<label
							class="mb-1 block font-bold tracking-wider text-gray-900 uppercase"
							for="author-name"
						>
							{m.adm_author_name()} <span class="text-rose-500">*</span>
						</label>
						<input
							id="author-name"
							type="text"
							required
							value={name}
							oninput={(e) => handleNameChange(e.currentTarget.value)}
							placeholder={m.adm_author_name_ph()}
							class="w-full rounded-xl border border-gray-300 bg-white p-2.5 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
						/>
					</div>

					<div>
						<label
							class="mb-1 block font-bold tracking-wider text-gray-900 uppercase"
							for="author-role"
						>
							{m.adm_author_role()}
						</label>
						<input
							id="author-role"
							type="text"
							bind:value={role}
							placeholder={m.adm_role_ph()}
							class="w-full rounded-xl border border-gray-300 bg-white p-2.5 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
						/>
					</div>

					<div>
						<label
							class="mb-1 block font-bold tracking-wider text-gray-900 uppercase"
							for="author-bio"
						>
							{m.adm_bio_label()}
						</label>
						<textarea
							id="author-bio"
							rows="2"
							bind:value={bio}
							placeholder={m.adm_bio_ph()}
							class="w-full resize-none rounded-xl border border-gray-300 bg-white p-2.5 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
						></textarea>
					</div>

					<div class="pt-1">
						<label
							class="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2.5"
						>
							<input
								type="checkbox"
								bind:checked={active}
								class="h-4 w-4 rounded-md text-emerald-700 focus:ring-emerald-600"
							/>
							<span class="text-xs font-semibold text-gray-800">{m.adm_author_active()}</span>
						</label>
					</div>

					<div class="flex items-center justify-end gap-2 border-t border-gray-200 pt-4">
						<button
							type="button"
							onclick={onClose}
							class="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-100"
						>
							{m.adm_cancel()}
						</button>
						<button
							type="submit"
							class="rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white shadow-xs hover:bg-emerald-800"
						>
							{m.adm_save_author()}
						</button>
					</div>
				</form>
			</div>
		</div>

		<MediaModal
			open={mediaModalOpen}
			{files}
			onClose={() => (mediaModalOpen = false)}
			onUploadFile={onUploadAvatar}
			onSelectFile={(f) => {
				if (f.publicUrl) avatarUrl = f.publicUrl;
			}}
		/>
	</div>
{/if}
