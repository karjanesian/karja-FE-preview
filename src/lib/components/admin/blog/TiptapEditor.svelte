<script lang="ts">
	import { onMount } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Link from '@tiptap/extension-link';
	import Image from '@tiptap/extension-image';
	import Placeholder from '@tiptap/extension-placeholder';
	import * as m from '$lib/paraglide/messages.js';
	import type { FileAsset } from '$lib/types/fileAsset';
	import MediaModal from './MediaModal.svelte';
	import Bold from 'lucide-svelte/icons/bold';
	import Italic from 'lucide-svelte/icons/italic';
	import LinkIcon from 'lucide-svelte/icons/link';
	import Quote from 'lucide-svelte/icons/quote';
	import ImageIcon from 'lucide-svelte/icons/image';
	import List from 'lucide-svelte/icons/list';
	import ListOrdered from 'lucide-svelte/icons/list-ordered';
	import Minus from 'lucide-svelte/icons/minus';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import Undo2 from 'lucide-svelte/icons/undo-2';
	import Redo2 from 'lucide-svelte/icons/redo-2';

	type Props = {
		value?: unknown;
		onchange: (json: any) => void;
		placeholder?: string;
		files?: FileAsset[];
		onUploadImage?: ((file: File) => Promise<FileAsset | null>) | undefined;
	};

	let { value, onchange, placeholder = '', files = [], onUploadImage }: Props = $props();

	let editorEl = $state<HTMLDivElement | undefined>();
	let editor: Editor | undefined = $state(undefined);
	let mediaModalOpen = $state(false);
	let tick = $state(0);
	let lastEmitted = '';

	async function handleDirectFileUpload(file: File) {
		if (!editor) return;
		if (onUploadImage) {
			const uploaded = await onUploadImage(file);
			if (uploaded && uploaded.publicUrl) {
				editor
					.chain()
					.focus()
					.setImage({ src: uploaded.publicUrl, alt: uploaded.originalName })
					.run();
			}
		} else {
			const reader = new FileReader();
			reader.onload = () => {
				const dataUrl = reader.result as string;
				editor?.chain().focus().setImage({ src: dataUrl, alt: file.name }).run();
			};
			reader.readAsDataURL(file);
		}
	}

	function handleSetLink() {
		if (!editor) return;
		const previousUrl = editor.getAttributes('link').href as string | undefined;
		const url = window.prompt(m.adm_link_prompt(), previousUrl || 'https://');
		if (url === null) return;
		if (url === '') {
			editor.chain().focus().extendMarkRange('link').unsetLink().run();
			return;
		}
		editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
	}

	function handleInsertCallout() {
		if (!editor) return;
		editor
			.chain()
			.focus()
			.toggleBlockquote()
			.insertContent(`<strong>${m.adm_callout_title()}</strong> ${m.adm_callout_text()}`)
			.run();
	}

	function isActive(name: string, attrs?: Record<string, unknown>): boolean {
		void tick;
		return !!editor?.isActive(name as never, attrs as never);
	}

	function canUndo(): boolean {
		void tick;
		return !!editor?.can().undo();
	}

	function canRedo(): boolean {
		void tick;
		return !!editor?.can().redo();
	}

	function btn(active: boolean): string {
		return `p-2 rounded-xl transition-all cursor-pointer ${
			active
				? 'bg-emerald-100 text-emerald-800 font-bold'
				: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
		}`;
	}

	function headingBtn(active: boolean): string {
		return `px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
			active
				? 'bg-emerald-100 text-emerald-800'
				: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
		}`;
	}

	onMount(() => {
		if (!editorEl) return;
		editor = new Editor({
			element: editorEl,
			extensions: [
				StarterKit.configure({
					heading: { levels: [2, 3] },
					bulletList: { keepMarks: true, keepAttributes: false },
					orderedList: { keepMarks: true, keepAttributes: false }
				}),
				Link.configure({
					openOnClick: false,
					HTMLAttributes: { class: 'text-emerald-700 underline font-medium cursor-pointer' }
				}),
				Image.configure({
					inline: false,
					allowBase64: true,
					HTMLAttributes: {
						class:
							'rounded-2xl max-w-full my-6 mx-auto cursor-pointer border border-gray-100 shadow-xs'
					}
				}),
				Placeholder.configure({
					placeholder: placeholder || m.adm_editor_placeholder(),
					emptyEditorClass: 'is-editor-empty'
				})
			],
			content: (value ?? '<p></p>') as never,
			editorProps: {
				attributes: {
					class:
						'prose prose-lg max-w-none focus:outline-none min-h-[420px] text-gray-800 text-[18px] leading-[1.8] font-sans'
				},
				handleDrop: (_view, event, _slice, moved) => {
					if (
						!moved &&
						event.dataTransfer &&
						event.dataTransfer.files &&
						event.dataTransfer.files[0]
					) {
						const file = event.dataTransfer.files[0];
						if (file.type.startsWith('image/')) {
							event.preventDefault();
							void handleDirectFileUpload(file);
							return true;
						}
					}
					return false;
				},
				handlePaste: (_view, event) => {
					const items = event.clipboardData?.items;
					if (items) {
						for (let i = 0; i < items.length; i++) {
							if (items[i].type.indexOf('image') !== -1) {
								const file = items[i].getAsFile();
								if (file) {
									event.preventDefault();
									void handleDirectFileUpload(file);
									return true;
								}
							}
						}
					}
					return false;
				}
			},
			onUpdate: ({ editor: ed }) => {
				const json = ed.getJSON();
				lastEmitted = JSON.stringify(json);
				onchange(json);
				tick++;
			},
			onTransaction: () => {
				tick++;
			}
		});

		return () => {
			editor?.destroy();
			editor = undefined;
		};
	});

	$effect(() => {
		if (!editor || value === undefined || value === null) return;
		const incoming = typeof value === 'string' ? value : JSON.stringify(value);
		if (incoming === lastEmitted) return;
		const current = typeof value === 'string' ? editor.getHTML() : JSON.stringify(editor.getJSON());
		if (current === incoming) return;
		lastEmitted = incoming;
		editor.commands.setContent(value as never, { emitUpdate: false });
	});
</script>

<div class="relative w-full space-y-4">
	<div
		class="sticky top-16 z-30 flex flex-wrap items-center justify-between gap-1 rounded-2xl border border-gray-200 bg-white/95 p-1.5 shadow-sm backdrop-blur-md"
	>
		<div class="flex flex-wrap items-center gap-1">
			<button
				type="button"
				onclick={() => editor?.chain().focus().toggleBold().run()}
				class={btn(isActive('bold'))}
				title={m.adm_t_bold()}
			>
				<Bold class="h-4 w-4" />
			</button>

			<button
				type="button"
				onclick={() => editor?.chain().focus().toggleItalic().run()}
				class={btn(isActive('italic'))}
				title={m.adm_t_italic()}
			>
				<Italic class="h-4 w-4" />
			</button>

			<button
				type="button"
				onclick={handleSetLink}
				class={btn(isActive('link'))}
				title={m.adm_t_link()}
			>
				<LinkIcon class="h-4 w-4" />
			</button>

			<div class="mx-1 h-5 w-px bg-gray-200"></div>

			<button
				type="button"
				onclick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
				class={headingBtn(isActive('heading', { level: 2 }))}
				title={m.adm_t_h2()}
			>
				H2
			</button>

			<button
				type="button"
				onclick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
				class={headingBtn(isActive('heading', { level: 3 }))}
				title={m.adm_t_h3()}
			>
				H3
			</button>

			<div class="mx-1 h-5 w-px bg-gray-200"></div>

			<button
				type="button"
				onclick={() => editor?.chain().focus().toggleBulletList().run()}
				class={btn(isActive('bulletList'))}
				title={m.adm_t_bullet()}
			>
				<List class="h-4 w-4" />
			</button>

			<button
				type="button"
				onclick={() => editor?.chain().focus().toggleOrderedList().run()}
				class={btn(isActive('orderedList'))}
				title={m.adm_t_ordered()}
			>
				<ListOrdered class="h-4 w-4" />
			</button>

			<button
				type="button"
				onclick={() => editor?.chain().focus().toggleBlockquote().run()}
				class={btn(isActive('blockquote'))}
				title={m.adm_t_quote()}
			>
				<Quote class="h-4 w-4" />
			</button>

			<button
				type="button"
				onclick={handleInsertCallout}
				class="cursor-pointer rounded-xl p-2 text-amber-600 transition-all hover:bg-amber-50 hover:text-amber-700"
				title={m.adm_t_callout()}
			>
				<Sparkles class="h-4 w-4" />
			</button>

			<button
				type="button"
				onclick={() => editor?.chain().focus().setHorizontalRule().run()}
				class="cursor-pointer rounded-xl p-2 text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900"
				title={m.adm_t_hr()}
			>
				<Minus class="h-4 w-4" />
			</button>

			<div class="mx-1 h-5 w-px bg-gray-200"></div>

			<button
				type="button"
				onclick={() => (mediaModalOpen = true)}
				class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition-all hover:bg-emerald-100"
				title={m.adm_t_image_btn()}
			>
				<ImageIcon class="h-3.5 w-3.5" />
				<span>{m.adm_t_image()}</span>
			</button>
		</div>

		<div class="flex items-center gap-0.5">
			<button
				type="button"
				onclick={() => editor?.chain().focus().undo().run()}
				disabled={!canUndo()}
				class="cursor-pointer rounded-xl p-2 text-gray-400 hover:text-gray-700 disabled:opacity-30"
				title={m.adm_undo()}
			>
				<Undo2 class="h-4 w-4" />
			</button>
			<button
				type="button"
				onclick={() => editor?.chain().focus().redo().run()}
				disabled={!canRedo()}
				class="cursor-pointer rounded-xl p-2 text-gray-400 hover:text-gray-700 disabled:opacity-30"
				title={m.adm_redo()}
			>
				<Redo2 class="h-4 w-4" />
			</button>
		</div>
	</div>

	<div
		class="min-h-[420px] rounded-2xl border border-gray-100 bg-white p-4 shadow-xs transition-colors focus-within:border-emerald-300 sm:p-6"
	>
		<div bind:this={editorEl}></div>
	</div>

	<MediaModal
		open={mediaModalOpen}
		{files}
		onClose={() => (mediaModalOpen = false)}
		onUploadFile={onUploadImage}
		onSelectFile={(f) => {
			if (f.publicUrl && f.publicUrl.trim().length > 0 && editor) {
				editor
					.chain()
					.focus()
					.setImage({
						src: f.publicUrl,
						alt: f.originalName,
						title: f.originalName
					})
					.run();
			}
		}}
	/>
</div>

<style>
	:global(.tiptap p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		float: left;
		height: 0;
		pointer-events: none;
		color: #d1d5db;
	}
</style>
