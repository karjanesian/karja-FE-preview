<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { formatBytes } from '$lib/domain/fileStorage';
	import type { FileAsset } from '$lib/types/fileAsset';
	import X from 'lucide-svelte/icons/x';
	import Upload from 'lucide-svelte/icons/upload';
	import Search from 'lucide-svelte/icons/search';
	import Check from 'lucide-svelte/icons/check';
	import ImageIcon from 'lucide-svelte/icons/image';

	type Props = {
		open: boolean;
		files: FileAsset[];
		onClose: () => void;
		onSelectFile: (file: FileAsset) => void;
		onUploadFile?: ((file: File) => Promise<FileAsset | null>) | undefined;
	};

	let { open, files, onClose, onSelectFile, onUploadFile }: Props = $props();

	let searchQuery = $state('');
	let selectedAssetId = $state<string | null>(null);
	let isUploading = $state(false);
	let fileInputEl = $state<HTMLInputElement | undefined>();

	const blogMediaFiles = $derived(
		files.filter((f) => f.category === 'blog_asset' || f.mimeType.startsWith('image/'))
	);

	const filteredMedia = $derived(
		blogMediaFiles.filter((f) => {
			if (!searchQuery.trim()) return true;
			const q = searchQuery.toLowerCase();
			return (
				f.originalName.toLowerCase().includes(q) ||
				(!!f.publicUrl && f.publicUrl.toLowerCase().includes(q))
			);
		})
	);

	const selectedFile = $derived(blogMediaFiles.find((f) => f.id === selectedAssetId));

	async function handleFileUpload(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		isUploading = true;
		try {
			if (onUploadFile) {
				const uploaded = await onUploadFile(file);
				if (uploaded) {
					selectedAssetId = uploaded.id;
				}
			} else {
				const reader = new FileReader();
				reader.onload = () => {
					const mockAsset: FileAsset = {
						id: 'asset-' + Date.now(),
						ownerType: 'platform',
						category: 'blog_asset',
						accessLevel: 'public',
						originalName: file.name,
						mimeType: file.type,
						sizeBytes: file.size,
						storageProvider: 'mock',
						objectKey: `blog/${file.name}`,
						publicUrl: reader.result as string,
						linkedEntityType: 'blog_post',
						linkedEntityId: '',
						status: 'available',
						createdAt: new Date().toISOString(),
						metadata: {
							dimensions: { width: 1200, height: 800 }
						}
					};
					onSelectFile(mockAsset);
					onClose();
				};
				reader.readAsDataURL(file);
			}
		} catch (err) {
			console.error('Upload failed', err);
		} finally {
			isUploading = false;
			if (fileInputEl) fileInputEl.value = '';
		}
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
			class="absolute inset-0 animate-in bg-gray-900/60 backdrop-blur-xs duration-150 fade-in"
			role="presentation"
			onclick={onClose}
		></div>
		<div class="relative flex h-full w-full items-center justify-center p-4">
			<div
				class="flex h-[640px] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
				role="dialog"
				aria-modal="true"
				tabindex="-1"
				aria-label={m.adm_media_title()}
			>
				<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
					<div class="flex items-center gap-2.5">
						<div
							class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800"
						>
							<ImageIcon class="h-4 w-4" />
						</div>
						<div>
							<h3 class="text-base font-bold text-gray-900">{m.adm_media_title()}</h3>
							<p class="text-xs text-gray-500">{m.adm_media_sub()}</p>
						</div>
					</div>
					<button
						type="button"
						onclick={onClose}
						class="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
						aria-label={m.common_close()}
					>
						<X class="h-5 w-5" />
					</button>
				</div>

				<div class="flex flex-1 overflow-hidden">
					<div class="flex flex-1 flex-col overflow-hidden border-r border-gray-200">
						<div
							class="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/50 p-4"
						>
							<div class="relative max-w-xs flex-1">
								<Search
									class="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
								/>
								<label class="sr-only" for="blog-media-search">{m.adm_media_search()}</label>
								<input
									id="blog-media-search"
									type="text"
									bind:value={searchQuery}
									placeholder={m.adm_media_search()}
									class="w-full rounded-lg border border-gray-200 bg-white py-1.5 pr-3 pl-8 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
								/>
							</div>

							<div>
								<input
									type="file"
									bind:this={fileInputEl}
									onchange={handleFileUpload}
									accept="image/*"
									class="hidden"
									aria-label={m.adm_upload_image()}
								/>
								<button
									type="button"
									onclick={() => fileInputEl?.click()}
									disabled={isUploading}
									class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-800"
								>
									<Upload class="h-3.5 w-3.5" />
									<span>{isUploading ? m.adm_uploading() : m.adm_upload_image()}</span>
								</button>
							</div>
						</div>

						<div class="flex-1 overflow-y-auto p-4">
							{#if filteredMedia.length === 0}
								<div
									class="flex h-full flex-col items-center justify-center p-6 text-center text-gray-400"
								>
									<ImageIcon class="mb-2 h-12 w-12 stroke-1 text-gray-300" />
									<p class="text-xs font-semibold text-gray-600">{m.adm_media_empty()}</p>
									<p class="mt-1 max-w-xs text-[11px] text-gray-400">{m.adm_media_empty_hint()}</p>
									<button
										type="button"
										onclick={() => fileInputEl?.click()}
										class="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
									>
										{m.adm_upload_now()}
									</button>
								</div>
							{:else}
								<div class="grid grid-cols-3 gap-3 sm:grid-cols-4">
									{#each filteredMedia as f (f.id)}
										{@const isSelected = selectedAssetId === f.id}
										{@const previewUrl =
											typeof f.publicUrl === 'string' && f.publicUrl.trim().length > 0
												? f.publicUrl
												: null}
										<button
											type="button"
											onclick={() => (selectedAssetId = f.id)}
											ondblclick={() => {
												onSelectFile(f);
												onClose();
											}}
											class="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-xl border-2 text-left transition-all {isSelected
												? 'border-emerald-700 ring-2 ring-emerald-600/30'
												: 'border-gray-200 hover:border-gray-300'}"
											aria-pressed={isSelected}
											aria-label={f.originalName}
										>
											{#if previewUrl}
												<img
													src={previewUrl}
													alt={f.originalName}
													class="h-full w-full object-cover"
													referrerpolicy="no-referrer"
												/>
											{:else}
												<div
													class="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400"
												>
													<ImageIcon class="h-5 w-5" />
												</div>
											{/if}
											{#if isSelected}
												<div
													class="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-700 text-white shadow-xs"
												>
													<Check class="h-3 w-3 stroke-[3]" />
												</div>
											{/if}
											<div
												class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-900/80 to-transparent p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
											>
												<p class="truncate text-[10px] font-medium">{f.originalName}</p>
											</div>
										</button>
									{/each}
								</div>
							{/if}
						</div>
					</div>

					<div class="flex w-72 flex-col justify-between overflow-y-auto bg-gray-50 p-4 text-xs">
						{#if selectedFile}
							<div class="space-y-4">
								<div>
									<h4 class="mb-2 text-xs font-bold tracking-wider text-gray-900 uppercase">
										{m.adm_media_detail()}
									</h4>
									<div
										class="mb-3 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-gray-300 bg-gray-200"
									>
										{#if selectedFile.publicUrl && selectedFile.publicUrl.trim().length > 0}
											<img
												src={selectedFile.publicUrl}
												alt={selectedFile.originalName}
												class="h-full w-full object-cover"
											/>
										{:else}
											<ImageIcon class="h-8 w-8 text-gray-400" />
										{/if}
									</div>
								</div>

								<div class="space-y-2 text-[11px] text-gray-600">
									<div class="flex justify-between border-b border-gray-200 py-1">
										<span class="text-gray-400">{m.adm_file_name()}</span>
										<span
											class="max-w-[140px] truncate font-medium text-gray-900"
											title={selectedFile.originalName}>{selectedFile.originalName}</span
										>
									</div>
									<div class="flex justify-between border-b border-gray-200 py-1">
										<span class="text-gray-400">{m.adm_file_size()}</span>
										<span class="font-mono text-gray-900"
											>{formatBytes(selectedFile.sizeBytes)}</span
										>
									</div>
									<div class="flex justify-between border-b border-gray-200 py-1">
										<span class="text-gray-400">{m.adm_file_type()}</span>
										<span class="text-gray-900 uppercase"
											>{selectedFile.mimeType.split('/')[1] || m.adm_image_fallback()}</span
										>
									</div>
								</div>
							</div>
						{:else}
							<div
								class="flex h-full items-center justify-center text-center text-xs text-gray-400"
							>
								{m.adm_media_select_hint()}
							</div>
						{/if}

						<div class="flex items-center gap-2 border-t border-gray-200 pt-4">
							<button
								type="button"
								onclick={onClose}
								class="flex-1 rounded-xl border border-gray-200 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100"
							>
								{m.adm_cancel()}
							</button>
							<button
								type="button"
								disabled={!selectedFile}
								onclick={() => {
									if (selectedFile) {
										onSelectFile(selectedFile);
										onClose();
									}
								}}
								class="flex-1 rounded-xl bg-emerald-700 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-50"
							>
								{m.adm_use_image()}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
