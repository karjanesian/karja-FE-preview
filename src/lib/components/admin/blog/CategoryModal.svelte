<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import type { BlogCategoryRecord } from '$lib/types/blog';
	import X from 'lucide-svelte/icons/x';
	import Folder from 'lucide-svelte/icons/folder';

	type Props = {
		open: boolean;
		category: BlogCategoryRecord | null;
		onClose: () => void;
		onSave: (category: Partial<BlogCategoryRecord>) => void;
	};

	let { open, category, onClose, onSave }: Props = $props();

	let name = $state('');
	let slug = $state('');
	let description = $state('');
	let active = $state(true);
	let sortOrder = $state(1);

	$effect(() => {
		if (!open) return;
		void category;
		if (category) {
			name = category.name || '';
			slug = category.slug || '';
			description = category.description || '';
			active = category.active !== false;
			sortOrder = category.sortOrder || 1;
		} else {
			name = '';
			slug = '';
			description = '';
			active = true;
			sortOrder = 1;
		}
	});

	function handleNameChange(val: string) {
		name = val;
		if (!category) {
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
			id: category?.id,
			name: name.trim(),
			slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
			description: description.trim(),
			active,
			sortOrder: Number(sortOrder) || 1
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
				aria-label={category ? m.adm_edit_category() : m.adm_new_category()}
			>
				<div
					class="flex items-center justify-between border-b border-gray-200 bg-gray-50/50 px-6 py-4"
				>
					<div class="flex items-center gap-2">
						<div
							class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800"
						>
							<Folder class="h-4 w-4" />
						</div>
						<h3 class="text-base font-bold text-gray-900">
							{category ? m.adm_edit_category() : m.adm_new_category()}
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
					<div>
						<label
							class="mb-1 block font-bold tracking-wider text-gray-900 uppercase"
							for="cat-name"
						>
							{m.adm_cat_name()} <span class="text-rose-500">*</span>
						</label>
						<input
							id="cat-name"
							type="text"
							required
							bind:value={name}
							oninput={(e) => handleNameChange(e.currentTarget.value)}
							placeholder={m.adm_cat_name_ph()}
							class="w-full rounded-xl border border-gray-300 bg-white p-2.5 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
						/>
					</div>

					<div>
						<label
							class="mb-1 block font-bold tracking-wider text-gray-900 uppercase"
							for="cat-slug"
						>
							{m.adm_cat_slug()}
						</label>
						<input
							id="cat-slug"
							type="text"
							bind:value={slug}
							oninput={(e) =>
								(slug = e.currentTarget.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
							placeholder={m.adm_cat_slug_ph()}
							class="w-full rounded-xl border border-gray-300 bg-white p-2.5 font-mono focus:ring-1 focus:ring-emerald-700 focus:outline-none"
						/>
					</div>

					<div>
						<label
							class="mb-1 block font-bold tracking-wider text-gray-900 uppercase"
							for="cat-desc"
						>
							{m.adm_cat_desc()}
						</label>
						<textarea
							id="cat-desc"
							rows="2"
							bind:value={description}
							placeholder={m.adm_cat_desc_ph()}
							class="w-full resize-none rounded-xl border border-gray-300 bg-white p-2.5 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
						></textarea>
					</div>

					<div class="grid grid-cols-2 gap-3 pt-1">
						<div>
							<label
								class="mb-1 block font-bold tracking-wider text-gray-900 uppercase"
								for="cat-order"
							>
								{m.adm_cat_order()}
							</label>
							<input
								id="cat-order"
								type="number"
								min="1"
								bind:value={sortOrder}
								oninput={() => (sortOrder = Number(sortOrder) || 1)}
								class="w-full rounded-xl border border-gray-300 bg-white p-2.5 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
							/>
						</div>

						<div class="flex flex-col justify-end">
							<label
								class="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2.5"
							>
								<input
									type="checkbox"
									bind:checked={active}
									class="h-4 w-4 rounded-md text-emerald-700 focus:ring-emerald-600"
								/>
								<span class="text-xs font-semibold text-gray-800">{m.adm_cat_active()}</span>
							</label>
						</div>
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
							{m.adm_save_category()}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
