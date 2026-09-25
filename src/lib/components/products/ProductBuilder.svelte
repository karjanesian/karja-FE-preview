<script lang="ts">
	import { goto } from '$app/navigation';
	import { ApiError, isNetworkError } from '$lib/api';
	import ProductTypeMeta from '$lib/components/common/ProductTypeMeta.svelte';
	import { compressImageFile } from '$lib/domain/imageCompressor';
	import { formatRupiah } from '$lib/domain/pricing';
	import { slugify } from '$lib/domain/productDraft';
	import {
		createProduct as apiCreateProduct,
		publishProduct as apiPublishProduct,
		replaceFaqs as apiReplaceFaqs,
		setProductImages as apiSetProductImages,
		updateProduct as apiUpdateProduct,
		uploadProductImage,
		PRODUCT_IMAGE_MAX_BYTES,
		PRODUCT_IMAGE_MIME_TYPES
	} from '$lib/domain/productsApi';
	import { getProductTypeTheme } from '$lib/domain/productTheme';
	import { formatBookingRulesSummary, formatWeeklyScheduleSummary } from '$lib/domain/scheduling';
	import { m } from '$lib/paraglide/messages.js';
	import { seller } from '$lib/stores/seller.svelte';
	import {
		normalizeProductType,
		type PriceMode,
		type Product,
		type ProductFAQ,
		type ProductType
	} from '$lib/types';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Briefcase from 'lucide-svelte/icons/briefcase';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Check from 'lucide-svelte/icons/check';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import ChevronUp from 'lucide-svelte/icons/chevron-up';
	import CircleCheckBig from 'lucide-svelte/icons/circle-check-big';
	import CircleHelp from 'lucide-svelte/icons/circle-help';
	import Clock from 'lucide-svelte/icons/clock';
	import FileText from 'lucide-svelte/icons/file-text';
	import Globe from 'lucide-svelte/icons/globe';
	import Lock from 'lucide-svelte/icons/lock';
	import Plus from 'lucide-svelte/icons/plus';
	import ShieldCheck from 'lucide-svelte/icons/shield-check';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Upload from 'lucide-svelte/icons/upload';
	import Video from 'lucide-svelte/icons/video';
	import X from 'lucide-svelte/icons/x';

	type Props = { product: Product; isNew?: boolean };
	let { product, isNew = false }: Props = $props();

	const mode = $derived<'create' | 'edit'>(isNew ? 'create' : 'edit');

	const SAMPLE_COVERS: Record<ProductType, string[]> = {
		digital: [
			'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80',
			'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1600&auto=format&fit=crop&q=80'
		],
		session: [
			'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&auto=format&fit=crop&q=80',
			'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1600&auto=format&fit=crop&q=80'
		],
		service: [
			'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600&auto=format&fit=crop&q=80',
			'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1600&auto=format&fit=crop&q=80'
		]
	};

	const DURATION_OPTIONS = [20, 30, 45, 60, 90];

	const subtypeOptions: Record<ProductType, string[]> = {
		digital: [
			m.pb_sub_template(),
			m.pb_sub_ebook(),
			m.pb_sub_worksheet(),
			m.pb_sub_video(),
			m.pb_sub_audio(),
			m.pb_sub_spreadsheet(),
			m.pb_sub_resource(),
			m.pb_sub_other()
		],
		session: [
			m.pb_sub_consultation(),
			m.pb_sub_mentoring(),
			m.pb_sub_tutoring(),
			m.pb_sub_review(),
			m.pb_sub_coaching(),
			m.pb_sub_live_class(),
			m.pb_sub_other()
		],
		service: [
			m.pb_sub_audit(),
			m.pb_sub_review(),
			m.pb_sub_design(),
			m.pb_sub_editing(),
			m.pb_sub_setup(),
			m.pb_sub_writing(),
			m.pb_sub_other()
		]
	};

	const bufferOptions = [
		{ value: 0, label: m.pb_buffer_none() },
		{ value: 10, label: m.pb_buffer_10() },
		{ value: 15, label: m.pb_buffer_15() },
		{ value: 30, label: m.pb_buffer_30() }
	];

	const noticeOptions = [
		{ value: 2, label: m.pb_notice_2h() },
		{ value: 6, label: m.pb_notice_6h() },
		{ value: 12, label: m.pb_notice_12h() },
		{ value: 24, label: m.pb_notice_24h() }
	];

	function buildInitial(p: Product): Product {
		const type = normalizeProductType(p.type);
		const images = Array.isArray(p.images)
			? p.images.filter((img) => typeof img === 'string' && img.trim().length > 0)
			: [];
		const price = p.price ?? 0;
		const priceMode: PriceMode =
			p.priceMode || (p.price === 0 ? 'free' : p.promoPrice && p.regularPrice ? 'promo' : 'fixed');
		const preparationQuestions = type === 'session' ? p.preparationQuestions || [] : [];
		const defaultCategory =
			type === 'digital'
				? m.pb_default_category_digital()
				: type === 'service'
					? m.pb_default_category_service()
					: m.pb_default_category_session();

		return {
			...p,
			id: p.id || `prod_${Date.now()}`,
			title: p.title ?? '',
			slug: p.slug || (p.title ? slugify(p.title) : `produk-${Date.now()}`),
			type,
			productSubtype: p.productSubtype || '',
			category: p.category || defaultCategory,
			price,
			priceMode,
			regularPrice: p.regularPrice,
			promoPrice: p.promoPrice,
			promoEndsAt: p.promoEndsAt || '',
			visibility: p.visibility || 'link_only',
			status: p.status || (isNew ? 'draft' : 'active'),
			images,
			coverImage: images[0] || p.coverImage || '',
			coverEmoji: p.coverEmoji || (type === 'digital' ? '📄' : type === 'service' ? '💼' : '🎨'),
			shortDescription: p.shortDescription || p.whatYouGet?.slice(0, 120) || '',
			targetAudience: p.targetAudience ?? '',
			problemSolved: p.problemSolved ?? '',
			whatYouGet: p.whatYouGet ?? '',
			howItWorks:
				p.howItWorks ||
				(type === 'session'
					? m.pb_def_how_session()
					: type === 'digital'
						? m.pb_def_how_digital()
						: m.pb_def_how_service()),
			aboutCreator: p.aboutCreator ?? '',
			faqs: p.faqs || [],
			digitalDeliveryType: p.digitalDeliveryType || 'external_link',
			fileDownloadName: p.fileDownloadName || '',
			fileSize: p.fileSize || '',
			externalAccessUrl: p.externalAccessUrl || '',
			accessInstructions: p.accessInstructions || p.fileAccessInstructions || '',
			sessionDurationMinutes: p.sessionDurationMinutes ?? 30,
			availabilityMode: p.availabilityMode || 'seller_default',
			bufferMinutes: p.bufferMinutes ?? 10,
			minimumNoticeHours: p.minimumNoticeHours ?? 6,
			bookingWindowDays: p.bookingWindowDays ?? 30,
			meetingMethod: p.meetingMethod || 'google_meet',
			sessionPlatform: p.sessionPlatform || 'Google Meet',
			preparationQuestions,
			sessionBookingNote: p.sessionBookingNote || m.pb_def_session_booking_note(),
			sessionPrepNote: p.sessionPrepNote || m.pb_def_session_prep_note(),
			serviceTimelineDays: p.serviceTimelineDays,
			serviceRevisions: p.serviceRevisions ?? 1,
			serviceDeliverables: p.serviceDeliverables || p.whatYouGet || '',
			serviceBuyerInputsRequired: p.serviceBuyerInputsRequired || m.pb_def_service_buyer_inputs(),
			views: p.views || 0,
			sales: p.sales || 0,
			revenue: p.revenue || 0,
			claims: p.claims || 0,
			downloads: p.downloads || 0,
			buyClicks: p.buyClicks || 0,
			createdAt: p.createdAt || m.common_day_today()
		};
	}

	// svelte-ignore state_referenced_locally
	let draft = $state<Product>(buildInitial(product));
	// svelte-ignore state_referenced_locally
	let showEnhancementSection = $state<boolean>(
		Boolean(
			product.targetAudience ||
			product.problemSolved ||
			product.aboutCreator ||
			(product.faqs && product.faqs.length > 0)
		)
	);
	let showAdvancedBooking = $state<boolean>(false);
	let mobileTab = $state<'editor' | 'preview'>('editor');
	let activeHint = $state<string | null>(null);

	let imageInputRef = $state<HTMLInputElement | undefined>(undefined);

	let isSaving = $state(false);
	let saveError = $state<string | null>(null);
	let createdId = $state<string | null>(null);

	function isLocalId(id: string): boolean {
		return id.startsWith('prod_');
	}

	/** ID produk di BE, kalau produk sudah pernah tersimpan. */
	function currentApiProductId(): string | undefined {
		if (createdId) return createdId;
		if (isNew || isLocalId(draft.id)) return undefined;
		return draft.id;
	}

	/** File id gambar sesuai urutan `images` (index 0 = utama); gambar lokal tanpa file id dilewati. */
	function orderedFileIds(source: Product): string[] {
		const files = source.imageFiles ?? [];
		return source.images
			.map((url) => files.find((file) => file.url === url)?.id)
			.filter((id): id is string => Boolean(id));
	}

	/** Endpoint create/update/publish tidak mengembalikan images/faqs — pertahankan versi lokal. */
	function withLocalMedia(row: Product, source: Product): Product {
		return {
			...row,
			images: source.images,
			imageFiles: source.imageFiles,
			coverImage: source.images[0] || source.coverImage || '',
			faqs: source.faqs
		};
	}

	const theme = $derived(getProductTypeTheme(draft.type));
	const validImages = $derived(
		(draft.images || []).filter((img) => typeof img === 'string' && img.trim().length > 0)
	);

	const profile = $derived(seller.sellerProfile);
	const isCalendarConnected = $derived(profile?.calendarIntegration?.status === 'connected');
	const isAvailabilitySet = $derived(
		Boolean(
			profile?.availability !== undefined &&
			(profile.availability.weeklySchedule?.some((d) => d.enabled) ?? false)
		)
	);
	const isSessionSetupReady = $derived(isCalendarConnected && isAvailabilitySet);

	const isTitleReady = $derived(draft.title.trim().length >= 3);
	const isPriceReady = $derived(
		draft.priceMode === 'free'
			? draft.price === 0
			: draft.priceMode === 'promo'
				? Boolean(
						draft.promoPrice &&
						draft.regularPrice &&
						draft.promoPrice > 0 &&
						draft.promoPrice < draft.regularPrice
					)
				: draft.price > 0
	);
	const isWhatYouGetReady = $derived(
		(draft.whatYouGet && draft.whatYouGet.trim().length > 3) ||
			(draft.shortDescription && draft.shortDescription.trim().length > 3)
	);
	const isTypeRequirementReady = $derived(
		draft.type === 'digital'
			? Boolean(draft.externalAccessUrl)
			: draft.type === 'session'
				? Boolean(draft.sessionDurationMinutes) && isSessionSetupReady
				: Boolean(draft.serviceTimelineDays && draft.serviceTimelineDays > 0)
	);
	const isReadyToPublish = $derived(
		isTitleReady && isPriceReady && isWhatYouGetReady && isTypeRequirementReady
	);

	const missingRequirements = $derived.by(() => {
		const list: string[] = [];
		if (!isTitleReady) list.push(m.pb_field_title());
		if (!isPriceReady) list.push(m.pb_field_price());
		if (!isWhatYouGetReady) list.push(m.pb_what_you_get());
		if (draft.type === 'digital' && !draft.externalAccessUrl) list.push(m.pb_req_link());
		if (draft.type === 'session' && !isSessionSetupReady) list.push(m.pb_req_schedule());
		if (draft.type === 'service' && (!draft.serviceTimelineDays || draft.serviceTimelineDays <= 0))
			list.push(m.pb_req_timeline());
		return list;
	});

	function handleKey(event: KeyboardEvent, action: () => void) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			action();
		}
	}

	function setField<K extends keyof Product>(key: K, value: Product[K]) {
		draft = { ...draft, [key]: value };
	}

	function handleTitleInput(event: Event) {
		const title = (event.currentTarget as HTMLInputElement).value;
		const slug = title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '');
		draft = { ...draft, title, slug: slug || draft.slug };
	}

	function handleWhatYouGetInput(event: Event) {
		const value = (event.currentTarget as HTMLTextAreaElement).value;
		draft = { ...draft, whatYouGet: value, shortDescription: value };
	}

	function handlePriceModeChange(nextMode: PriceMode) {
		let newPrice = draft.price;
		let regular = draft.regularPrice;
		let promo = draft.promoPrice;

		if (nextMode === 'free') {
			newPrice = 0;
		} else if (nextMode === 'fixed') {
			newPrice = draft.price > 0 ? draft.price : draft.promoPrice || 49000;
		} else if (nextMode === 'promo') {
			regular = draft.regularPrice || (draft.price > 0 ? draft.price : 79000);
			promo =
				draft.promoPrice ||
				(draft.price > 0 && draft.price < regular ? draft.price : Math.round(regular * 0.7));
			newPrice = promo;
		}

		draft = {
			...draft,
			priceMode: nextMode,
			price: newPrice,
			regularPrice: regular,
			promoPrice: promo
		};
	}

	async function addLocalImage(file: File) {
		try {
			const compressed = await compressImageFile(file, 1600, 900, 0.82);
			if (compressed) {
				const newImages = [...draft.images, compressed].slice(0, 5);
				draft = { ...draft, images: newImages, coverImage: newImages[0] };
			}
		} catch {
			const reader = new FileReader();
			reader.onload = () => {
				if (typeof reader.result === 'string') {
					const newImages = [...draft.images, reader.result].slice(0, 5);
					draft = { ...draft, images: newImages, coverImage: newImages[0] };
				}
			};
			reader.readAsDataURL(file);
		}
	}

	async function handleImageUpload(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const files = input.files;
		if (!files || files.length === 0) return;
		const file = files[0];
		input.value = '';
		saveError = null;

		if (!PRODUCT_IMAGE_MIME_TYPES.includes(file.type) || file.size > PRODUCT_IMAGE_MAX_BYTES) {
			saveError = m.pb_image_invalid();
			return;
		}

		try {
			const uploaded = await uploadProductImage(file, currentApiProductId());
			const newImages = [...draft.images, uploaded.url].slice(0, 5);
			const newFiles = [...(draft.imageFiles ?? []), { id: uploaded.fileId, url: uploaded.url }];
			draft = { ...draft, images: newImages, imageFiles: newFiles, coverImage: newImages[0] };
		} catch (e) {
			if (isNetworkError(e)) {
				await addLocalImage(file);
				return;
			}
			saveError = e instanceof ApiError ? e.message : m.pb_image_upload_failed();
		}
	}

	function handleRemoveImage(index: number) {
		const newImages = draft.images.filter((_, i) => i !== index);
		draft = { ...draft, images: newImages, coverImage: newImages[0] || '' };
	}

	function handleSetAsCover(index: number) {
		if (index === 0) return;
		const selected = draft.images[index];
		const rest = draft.images.filter((_, i) => i !== index);
		const newImages = [selected, ...rest];
		draft = { ...draft, images: newImages, coverImage: selected };
	}

	function handleAddFaq() {
		const newFaq: ProductFAQ = { id: `faq_${Date.now()}`, question: '', answer: '' };
		draft = { ...draft, faqs: [...draft.faqs, newFaq] };
	}

	function handleUpdateFaq(id: string, field: 'question' | 'answer', value: string) {
		draft = {
			...draft,
			faqs: draft.faqs.map((f) => (f.id === id ? { ...f, [field]: value } : f))
		};
	}

	function handleDeleteFaq(id: string) {
		draft = { ...draft, faqs: draft.faqs.filter((f) => f.id !== id) };
	}

	function updatePreparationQuestion(index: number, value: string) {
		const updated = [...(draft.preparationQuestions || [])];
		updated[index] = value;
		draft = { ...draft, preparationQuestions: updated };
	}

	function removePreparationQuestion(index: number) {
		const updated = (draft.preparationQuestions || []).filter((_, i) => i !== index);
		draft = { ...draft, preparationQuestions: updated };
	}

	async function persistNext(nextStatus: Product['status']) {
		if (isSaving) return;
		saveError = null;

		const final: Product = {
			...draft,
			status: nextStatus,
			slug: draft.slug || slugify(draft.title),
			coverImage: draft.images[0] || draft.coverImage || '',
			price: draft.priceMode === 'free' ? 0 : draft.price
		};

		const saveLocal = () => {
			if (nextStatus === 'active') {
				seller.publishProduct(final);
			} else {
				seller.saveProductDraft(final);
			}
		};

		isSaving = true;
		try {
			const existingId = createdId ?? currentApiProductId();
			let saved = existingId
				? await apiUpdateProduct(existingId, final)
				: await apiCreateProduct(final);
			saved = withLocalMedia(saved, final);
			createdId = saved.id;

			await apiReplaceFaqs(saved.id, final.faqs);

			const fileIds = orderedFileIds(final);
			if (fileIds.length > 0) {
				await apiSetProductImages(saved.id, fileIds);
			}

			if (nextStatus === 'active') {
				saved = withLocalMedia(await apiPublishProduct(saved.id), final);
				seller.publishProduct(saved);
			} else {
				seller.saveProductDraft(saved);
			}

			await goto('/dashboard/products');
		} catch (e) {
			if (isNetworkError(e)) {
				// BE tidak terjangkau → simpan lokal seperti sebelumnya.
				saveLocal();
				await goto('/dashboard/products');
				return;
			}
			saveError = e instanceof ApiError ? e.message : m.auth_err_generic();
		} finally {
			isSaving = false;
		}
	}

	function goToProducts() {
		void goto('/dashboard/products');
	}

	function goToScheduleSettings() {
		void goto('/dashboard/settings/schedule');
	}
</script>

<svelte:head>
	<title>{isNew ? m.pb_title_draft() : m.pb_title_edit()} · Karja</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="fixed inset-0 z-50 overflow-y-auto bg-[#FAFDFB] text-[#0E2E25]">
	<!-- 1. TOP EDITOR TOOLBAR -->
	<header
		class="sticky top-0 z-30 flex items-center justify-between border-b border-[#E4EBE7] bg-white/95 px-4 py-3.5 backdrop-blur-md transition-all sm:px-8"
	>
		<!-- Left: Navigation & Product Identity -->
		<div class="flex min-w-0 items-center gap-3">
			<button
				type="button"
				onclick={goToProducts}
				title={m.pb_back_products()}
				class="inline-flex flex-shrink-0 cursor-pointer items-center gap-1.5 rounded-xl p-2 text-xs font-semibold text-[#52776C] transition-colors hover:bg-[#F0F6F3] hover:text-[#0E2E25] sm:px-3 sm:py-1.5"
			>
				<ArrowLeft class="h-4 w-4" />
				<span class="hidden sm:inline">{m.pb_nav_products()}</span>
			</button>

			<div class="hidden h-4 w-px flex-shrink-0 bg-[#E4EBE7] sm:block"></div>

			<div class="min-w-0 space-y-0.5">
				<h1 class="truncate text-sm font-bold text-[#0E2E25] sm:text-base">
					{#if mode === 'edit'}
						{draft.title ? m.pb_top_edit_named({ title: draft.title }) : m.pb_title_edit()}
					{:else}
						{draft.title || m.pb_top_create()}
					{/if}
				</h1>
				<div class="flex flex-wrap items-center gap-2 text-xs text-[#52776C]">
					<ProductTypeMeta type={draft.type} subtype={draft.productSubtype} size="xs" />
					<span class="text-[#C2D8CD] select-none">·</span>
					<span class="flex items-center gap-1 text-[11px] text-[#52776C]">
						{#if draft.visibility === 'link_only'}
							<Lock class="h-3 w-3 text-[#739488]" />
							<span>{m.pb_vis_link_short()}</span>
						{:else}
							<Globe class="h-3 w-3 text-[#739488]" />
							<span>{m.pb_vis_store()}</span>
						{/if}
					</span>
				</div>
			</div>
		</div>

		<!-- Center: Mobile / Tablet View Switch (< lg) -->
		<div class="flex items-center rounded-xl border border-[#DCE7E1] bg-[#F0F5F2] p-1 lg:hidden">
			<button
				type="button"
				onclick={() => (mobileTab = 'editor')}
				class="cursor-pointer rounded-lg px-3 py-1 text-xs font-semibold transition-all {mobileTab ===
				'editor'
					? 'bg-white font-bold text-[#0E2E25] shadow-2xs'
					: 'text-[#52776C]'}"
			>
				{m.pb_tab_edit()}
			</button>
			<button
				type="button"
				onclick={() => (mobileTab = 'preview')}
				class="cursor-pointer rounded-lg px-3 py-1 text-xs font-semibold transition-all {mobileTab ===
				'preview'
					? 'bg-white font-bold text-[#0E2E25] shadow-2xs'
					: 'text-[#52776C]'}"
			>
				{m.pb_tab_preview()}
			</button>
		</div>

		<!-- Right: Actions -->
		<div class="flex flex-shrink-0 items-center gap-2.5">
			{#if !isReadyToPublish && missingRequirements.length > 0}
				<div class="hidden items-center gap-1.5 pr-2 text-xs font-medium text-[#739488] xl:flex">
					<span class="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
					<span>{m.pb_ready_remaining({ count: missingRequirements.length })}</span>
				</div>
			{/if}

			<button
				type="button"
				disabled={isSaving}
				onclick={() => void persistNext('draft')}
				class="cursor-pointer rounded-xl border border-[#D5E2DC] bg-white px-3.5 py-2 text-xs font-semibold text-[#52776C] shadow-2xs transition-colors hover:bg-[#F4F8F6] hover:text-[#0E2E25] disabled:cursor-not-allowed disabled:opacity-60"
			>
				{isSaving ? m.pb_saving() : m.pb_save_draft()}
			</button>

			<button
				type="button"
				disabled={!isReadyToPublish || isSaving}
				onclick={() => void persistNext('active')}
				class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold shadow-xs transition-all sm:px-5 {isReadyToPublish
					? 'bg-[#008A5E] text-white hover:bg-[#007550] active:scale-[0.99]'
					: 'cursor-not-allowed border border-[#D5E2DC] bg-[#E6EFEB] text-[#8DA89D]'} disabled:cursor-not-allowed disabled:opacity-60"
			>
				<Check class="h-3.5 w-3.5" />
				<span>
					{isSaving
						? m.pb_saving()
						: mode === 'edit'
							? m.pb_save_changes()
							: m.pb_publish_product()}
				</span>
			</button>
		</div>
	</header>

	{#if saveError}
		<div class="border-b border-rose-200 bg-rose-50 px-4 py-2.5 sm:px-8">
			<div
				class="mx-auto flex max-w-[1240px] items-start justify-between gap-3 text-xs text-rose-700"
			>
				<span class="font-medium">{saveError}</span>
				<button
					type="button"
					onclick={() => (saveError = null)}
					aria-label={m.common_close()}
					class="cursor-pointer rounded p-0.5 text-rose-500 transition-colors hover:text-rose-700"
				>
					<X class="h-3.5 w-3.5" />
				</button>
			</div>
		</div>
	{/if}

	<!-- 2. MAIN 2-COLUMN LAYOUT -->
	<div
		class="mx-auto grid max-w-[1240px] grid-cols-1 items-start gap-8 px-4 py-6 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:py-8"
	>
		<!-- LEFT COLUMN: CALM EDITORIAL FORM -->
		<div class="space-y-8 lg:col-span-7 {mobileTab === 'preview' ? 'hidden lg:block' : 'block'}">
			<!-- SECTION 1: YANG UTAMA DULU -->
			<div class="space-y-6">
				<div class="space-y-1">
					<div class="flex items-center justify-between">
						<h2 class="text-base font-bold text-[#0E2E25]">{m.pb_s1_title()}</h2>
						<span class="text-[11px] font-medium text-[#739488]">{m.pb_required()}</span>
					</div>
					<p class="text-xs text-[#52776C]">{m.pb_s1_desc()}</p>
				</div>

				<!-- 1.1 Cover Media Uploader -->
				<div class="space-y-2.5">
					<div class="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
						<span class="text-xs font-bold text-[#0E2E25]">{m.pb_cover_label()}</span>
						<span class="text-[11px] text-[#739488]">
							{validImages.length > 0
								? m.pb_cover_meta({ count: validImages.length })
								: m.pb_cover_meta_suffix()}
						</span>
					</div>

					<input
						bind:this={imageInputRef}
						type="file"
						accept="image/png, image/jpeg, image/webp"
						class="hidden"
						onchange={handleImageUpload}
					/>

					{#if validImages.length === 0}
						<!-- Empty 16:9 Placeholder surface -->
						<div
							role="button"
							tabindex={0}
							aria-label={m.pb_cover_upload()}
							onclick={() => imageInputRef?.click()}
							onkeydown={(e) => handleKey(e, () => imageInputRef?.click())}
							class="group flex aspect-video w-full cursor-pointer flex-col items-center justify-center space-y-2 rounded-2xl border-2 border-dashed border-[#D5E2DC] bg-[#F8FAF9] p-6 text-center transition-all hover:border-[#0C7B58] hover:bg-[#F0F6F3]"
						>
							<div
								class="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D5E2DC] bg-white text-[#52776C] shadow-2xs transition-colors group-hover:border-[#96B8A9] group-hover:text-[#0C7B58]"
							>
								<Upload class="h-5 w-5" />
							</div>
							<div class="space-y-0.5">
								<div
									class="text-xs font-bold text-[#0E2E25] transition-colors group-hover:text-[#0C7B58]"
								>
									{m.pb_cover_upload()}
								</div>
								<p class="text-[11px] text-[#52776C]">{m.pb_cover_formats()}</p>
							</div>
							<div class="pt-1">
								<button
									type="button"
									onclick={(e) => {
										e.stopPropagation();
										const sampleList = SAMPLE_COVERS[draft.type] || SAMPLE_COVERS.digital;
										draft = { ...draft, images: [sampleList[0]], coverImage: sampleList[0] };
									}}
									class="cursor-pointer text-[11px] font-semibold text-[#0C7B58] hover:underline"
								>
									{m.pb_cover_sample()}
								</button>
							</div>
						</div>
					{:else}
						<!-- Primary Cover Preview + Thumbnails -->
						<div class="space-y-3">
							<div
								class="group relative aspect-video overflow-hidden rounded-2xl border border-[#D5E2DC] bg-[#F8FAF9] shadow-2xs"
							>
								<img
									src={validImages[0]}
									alt={m.pb_cover_main()}
									class="h-full w-full object-cover"
								/>
								<div class="absolute top-3 left-3">
									<span
										class="rounded-md bg-[#0C7B58] px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs"
									>
										{m.pb_cover_main()}
									</span>
								</div>

								<div
									class="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 p-4 opacity-0 transition-opacity group-hover:opacity-100"
								>
									<button
										type="button"
										onclick={() => imageInputRef?.click()}
										class="cursor-pointer rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-[#0E2E25] shadow-xs transition-colors hover:bg-[#F0FDF4]"
									>
										{m.pb_cover_change()}
									</button>
									<button
										type="button"
										onclick={() => handleRemoveImage(0)}
										title={m.pb_cover_remove()}
										class="cursor-pointer rounded-xl bg-rose-600 p-1.5 text-white shadow-xs transition-colors hover:bg-rose-700"
									>
										<Trash2 class="h-4 w-4" />
									</button>
								</div>
							</div>

							<div class="flex items-center gap-2.5 overflow-x-auto pb-1">
								{#each validImages as imgUrl, idx (idx)}
									<div
										class="group relative aspect-video w-20 flex-shrink-0 overflow-hidden rounded-xl border bg-[#F8FAF9] {idx ===
										0
											? 'border-[#0C7B58] ring-1 ring-[#0C7B58]'
											: 'border-[#D5E2DC]'}"
									>
										<img src={imgUrl} alt="" class="h-full w-full object-cover" />
										<div
											class="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
										>
											{#if idx !== 0}
												<button
													type="button"
													onclick={() => handleSetAsCover(idx)}
													class="cursor-pointer p-0.5 text-[9px] font-semibold text-white underline hover:text-[#A7F3D0]"
												>
													{m.pb_cover_set_main()}
												</button>
											{/if}
											<button
												type="button"
												onclick={() => handleRemoveImage(idx)}
												title={m.pb_faq_remove()}
												class="cursor-pointer p-1 text-white hover:text-rose-400"
											>
												<Trash2 class="h-3 w-3" />
											</button>
										</div>
									</div>
								{/each}

								{#if validImages.length < 5}
									<button
										type="button"
										onclick={() => imageInputRef?.click()}
										title={m.pb_cover_add_title()}
										class="flex aspect-video w-20 flex-shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#D5E2DC] bg-[#F8FAF9] text-[#52776C] transition-colors hover:border-[#0C7B58] hover:bg-[#EFF6F2] hover:text-[#0C7B58]"
									>
										<Plus class="h-4 w-4" />
										<span class="mt-0.5 text-[9px] font-semibold">{m.pb_cover_add()}</span>
									</button>
								{/if}
							</div>
						</div>
					{/if}
				</div>

				<!-- 1.2 Product Title -->
				<div class="space-y-1.5">
					<div class="flex items-center justify-between">
						<span class="text-xs font-bold text-[#0E2E25]">{m.pb_field_title()}</span>
						<button
							type="button"
							onclick={() => (activeHint = activeHint === 'title' ? null : 'title')}
							class="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-[#52776C] transition-colors hover:text-[#0C7B58]"
						>
							<CircleHelp class="h-3 w-3 text-[#0C7B58]" />
							<span>{m.pb_title_examples()}</span>
						</button>
					</div>

					{#if activeHint === 'title'}
						<div
							class="animate-fadeIn space-y-1.5 rounded-xl border border-[#D0E4DA] bg-[#F0F7F4] p-3.5 text-xs text-[#2B5447]"
						>
							<div class="flex items-center justify-between font-bold text-[#0E2E25]">
								<span>{m.pb_title_examples_label()}</span>
								<button
									type="button"
									onclick={() => (activeHint = null)}
									class="cursor-pointer p-0.5 text-[#52776C] hover:text-[#0E2E25]"
								>
									<X class="h-3.5 w-3.5" />
								</button>
							</div>
							<ul class="list-inside list-disc space-y-1 text-[11px] text-[#426C5F]">
								{#if draft.type === 'digital'}
									<li>{m.pb_title_ex_digital_1()}</li>
									<li>{m.pb_title_ex_digital_2()}</li>
									<li>{m.pb_title_ex_digital_3()}</li>
								{:else if draft.type === 'session'}
									<li>{m.pb_title_ex_session_1()}</li>
									<li>{m.pb_title_ex_session_2()}</li>
									<li>{m.pb_title_ex_session_3()}</li>
								{:else}
									<li>{m.pb_title_ex_service_1()}</li>
									<li>{m.pb_title_ex_service_2()}</li>
									<li>{m.pb_title_ex_service_3()}</li>
								{/if}
							</ul>
						</div>
					{/if}

					<input
						type="text"
						value={draft.title}
						oninput={handleTitleInput}
						placeholder={draft.type === 'digital'
							? m.pb_title_ph_digital()
							: draft.type === 'session'
								? m.pb_title_ph_session()
								: m.pb_title_ph_service()}
						class="w-full rounded-xl border border-[#D5E2DC] bg-white px-3.5 py-3 text-sm font-semibold text-[#0E2E25] transition-all outline-none placeholder:font-normal placeholder:text-[#97B3A7] focus:border-[#0C7B58] focus:ring-1 focus:ring-[#0C7B58]"
					/>
				</div>

				<!-- 1.3 Subtype / Bentuk -->
				<div class="space-y-2">
					<span class="text-xs font-bold text-[#0E2E25]">
						{m.pb_subtype_label()}
						<span class="font-normal text-[#739488]">({m.pb_optional()})</span>
					</span>
					<div class="flex flex-wrap gap-1.5">
						{#each subtypeOptions[draft.type] as sub (sub)}
							{@const isSelected = draft.productSubtype === sub}
							{@const activeClasses =
								draft.type === 'digital'
									? 'bg-[#EFF6FF] border-[#93C5FD] text-[#1D4ED8] font-bold shadow-2xs'
									: draft.type === 'session'
										? 'bg-[#F5F3FF] border-[#C4B5FD] text-[#6D28D9] font-bold shadow-2xs'
										: 'bg-[#FFF7ED] border-[#FDBA74] text-[#C2410C] font-bold shadow-2xs'}
							<button
								type="button"
								onclick={() =>
									(draft = {
										...draft,
										productSubtype: draft.productSubtype === sub ? '' : sub
									})}
								class="cursor-pointer rounded-xl border px-3 py-1.5 text-xs transition-all {isSelected
									? activeClasses
									: 'border-[#D5E2DC] bg-white font-medium text-[#4A7264] hover:border-[#97B8A9]'}"
							>
								{sub}
							</button>
						{/each}
					</div>
				</div>

				<!-- 1.4 Pricing Setup -->
				<div class="space-y-3">
					<span class="text-xs font-bold text-[#0E2E25]">{m.pb_field_price()}</span>

					<div class="grid grid-cols-3 gap-1 rounded-xl border border-[#DCE8E2] bg-[#EEF4F0] p-1">
						<button
							type="button"
							onclick={() => handlePriceModeChange('fixed')}
							class="cursor-pointer rounded-lg py-2 text-center text-xs font-semibold transition-all {draft.priceMode ===
							'fixed'
								? 'bg-white font-bold text-[#0E2E25] shadow-2xs'
								: 'text-[#52776C] hover:text-[#0E2E25]'}"
						>
							{m.pb_price_mode_fixed()}
						</button>
						<button
							type="button"
							onclick={() => handlePriceModeChange('promo')}
							class="cursor-pointer rounded-lg py-2 text-center text-xs font-semibold transition-all {draft.priceMode ===
							'promo'
								? 'bg-white font-bold text-[#0E2E25] shadow-2xs'
								: 'text-[#52776C] hover:text-[#0E2E25]'}"
						>
							{m.pb_price_mode_promo()}
						</button>
						<button
							type="button"
							onclick={() => handlePriceModeChange('free')}
							class="cursor-pointer rounded-lg py-2 text-center text-xs font-semibold transition-all {draft.priceMode ===
							'free'
								? 'bg-white font-bold text-[#0E2E25] shadow-2xs'
								: 'text-[#52776C] hover:text-[#0E2E25]'}"
						>
							{m.pb_price_mode_free()}
						</button>
					</div>

					{#if draft.priceMode === 'fixed'}
						<div class="relative">
							<span
								class="absolute top-1/2 left-3.5 -translate-y-1/2 text-xs font-bold text-[#52776C]"
							>
								Rp
							</span>
							<input
								type="number"
								value={draft.price || ''}
								oninput={(e) =>
									setField('price', Number((e.currentTarget as HTMLInputElement).value) || 0)}
								placeholder="50000"
								class="w-full rounded-xl border border-[#D5E2DC] bg-white py-2.5 pr-4 pl-10 text-sm font-bold text-[#0E2E25] transition-all outline-none focus:border-[#0C7B58] focus:ring-1 focus:ring-[#0C7B58]"
							/>
						</div>
					{/if}

					{#if draft.priceMode === 'promo'}
						<div
							class="grid grid-cols-1 gap-3 rounded-2xl border border-[#DCE7E1] bg-[#F8FAF9] p-4 sm:grid-cols-2"
						>
							<div class="space-y-1">
								<span class="text-[11px] font-semibold text-[#52776C]">
									{m.pb_price_regular()}
								</span>
								<div class="relative">
									<span class="absolute top-1/2 left-3 -translate-y-1/2 text-xs text-gray-400">
										Rp
									</span>
									<input
										type="number"
										value={draft.regularPrice || ''}
										oninput={(e) =>
											setField(
												'regularPrice',
												Number((e.currentTarget as HTMLInputElement).value) || 0
											)}
										placeholder="79000"
										class="w-full rounded-xl border border-[#D5E2DC] bg-white py-2 pr-3 pl-9 text-xs text-gray-500 line-through outline-none"
									/>
								</div>
							</div>

							<div class="space-y-1">
								<span class="text-[11px] font-bold text-[#0C7B58]">
									{m.pb_price_mode_promo()}
								</span>
								<div class="relative">
									<span
										class="absolute top-1/2 left-3 -translate-y-1/2 text-xs font-bold text-[#0C7B58]"
									>
										Rp
									</span>
									<input
										type="number"
										value={draft.promoPrice || ''}
										oninput={(e) => {
											const pro = Number((e.currentTarget as HTMLInputElement).value) || 0;
											draft = { ...draft, promoPrice: pro, price: pro };
										}}
										placeholder="49000"
										class="w-full rounded-xl border border-[#A7D8BF] bg-white py-2 pr-3 pl-9 text-xs font-bold text-[#0E2E25] outline-none focus:border-[#0C7B58]"
									/>
								</div>
							</div>
						</div>
					{/if}

					{#if draft.priceMode === 'free'}
						<div
							class="rounded-xl border border-[#D0E4DA] bg-[#F0F7F4] p-3 text-xs leading-relaxed text-[#205847]"
						>
							{m.pb_price_free_note()}
						</div>
					{/if}
				</div>

				<!-- 1.5 Visibility Setting -->
				<div class="space-y-2">
					<span class="text-xs font-bold text-[#0E2E25]">{m.pb_field_visibility()}</span>
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<button
							type="button"
							onclick={() => setField('visibility', 'link_only')}
							class="flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 text-left transition-all {draft.visibility ===
							'link_only'
								? 'border-[#0C7B58] bg-[#F2FAF5] shadow-2xs'
								: 'border-[#D5E2DC] bg-white hover:border-[#96B8A9]'}"
						>
							<div
								class="flex-shrink-0 rounded-xl p-2 {draft.visibility === 'link_only'
									? 'bg-[#008A5E] text-white'
									: 'bg-[#F0F5F2] text-[#52776C]'}"
							>
								<Lock class="h-4 w-4" />
							</div>
							<div class="space-y-0.5">
								<div class="text-xs font-bold text-[#0E2E25]">{m.pb_vis_link()}</div>
								<p class="text-[11px] leading-relaxed text-[#52776C]">{m.pb_vis_link_desc()}</p>
							</div>
						</button>

						<button
							type="button"
							onclick={() => setField('visibility', 'store')}
							class="flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 text-left transition-all {draft.visibility ===
							'store'
								? 'border-[#0C7B58] bg-[#F2FAF5] shadow-2xs'
								: 'border-[#D5E2DC] bg-white hover:border-[#96B8A9]'}"
						>
							<div
								class="flex-shrink-0 rounded-xl p-2 {draft.visibility === 'store'
									? 'bg-[#008A5E] text-white'
									: 'bg-[#F0F5F2] text-[#52776C]'}"
							>
								<Globe class="h-4 w-4" />
							</div>
							<div class="space-y-0.5">
								<div class="text-xs font-bold text-[#0E2E25]">{m.pb_vis_store_title()}</div>
								<p class="text-[11px] leading-relaxed text-[#52776C]">{m.pb_vis_store_desc()}</p>
							</div>
						</button>
					</div>
				</div>

				<!-- 1.6 Short Summary / What Buyer Gets -->
				<div class="space-y-1.5">
					<div class="flex items-center justify-between">
						<span class="text-xs font-bold text-[#0E2E25]">{m.pb_what_you_get()}</span>
						<span class="text-[11px] text-[#739488]">{m.pb_what_you_get_hint()}</span>
					</div>
					<textarea
						rows={2}
						value={draft.whatYouGet || draft.shortDescription}
						oninput={handleWhatYouGetInput}
						placeholder={draft.type === 'service'
							? m.pb_wyg_ph_service()
							: draft.type === 'session'
								? m.pb_wyg_ph_session()
								: m.pb_wyg_ph_digital()}
						class="w-full rounded-xl border border-[#D5E2DC] bg-white p-3 text-xs leading-relaxed text-[#0E2E25] transition-all outline-none placeholder:text-[#97B3A7] focus:border-[#0C7B58] focus:ring-1 focus:ring-[#0C7B58]"
					></textarea>
				</div>
			</div>

			<!-- SECTION 2: PRODUCT-TYPE SPECIFIC DELIVERY / SETTINGS -->
			<div class="space-y-6 border-t border-[#E8EFEA] pt-8">
				<!-- 2.A DIGITAL PRODUCT DELIVERY -->
				{#if draft.type === 'digital'}
					<div class="space-y-5">
						<div class="space-y-1">
							<div class="flex items-center justify-between">
								<h2 class="flex items-center gap-1.5 text-base font-bold text-[#0E2E25]">
									<FileText class="h-4 w-4 text-[#2563EB]" />
									<span>{m.pb_digital_section_title()}</span>
								</h2>
								<span class="text-[11px] font-medium text-[#739488]">{m.pb_required()}</span>
							</div>
							<p class="text-xs text-[#52776C]">{m.pb_digital_section_desc()}</p>
						</div>

						<div class="space-y-2">
							<input
								type="url"
								value={draft.externalAccessUrl || ''}
								oninput={(e) =>
									setField('externalAccessUrl', (e.currentTarget as HTMLInputElement).value)}
								placeholder={m.pb_digital_link_ph()}
								class="w-full rounded-xl border border-[#D5E2DC] bg-white px-3.5 py-2.5 text-xs text-[#0E2E25] transition-all outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
							/>
							<p class="text-[11px] leading-relaxed text-[#52776C]">{m.pb_digital_link_hint()}</p>
						</div>
					</div>
				{/if}

				<!-- 2.B SESSION SETTINGS -->
				{#if draft.type === 'session'}
					<div class="space-y-5">
						<div class="space-y-1">
							<div class="flex items-center justify-between">
								<h2 class="flex items-center gap-1.5 text-base font-bold text-[#0E2E25]">
									<Calendar class="h-4 w-4 text-[#7C3AED]" />
									<span>{m.pb_session_section_title()}</span>
								</h2>
								<span class="text-[11px] font-medium text-[#739488]">{m.pb_required()}</span>
							</div>
							<p class="text-xs text-[#52776C]">{m.pb_session_section_desc()}</p>
						</div>

						{#if !isSessionSetupReady}
							<div class="space-y-3 rounded-2xl border border-[#DDD6FE] bg-[#F5F3FF] p-4">
								<div class="flex items-start gap-3">
									<div
										class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[#DDD6FE] bg-white text-[#7C3AED]"
									>
										<Calendar class="h-4 w-4" />
									</div>
									<div class="min-w-0 space-y-0.5">
										<h4 class="text-xs font-bold text-[#4C1D95]">{m.pb_session_not_ready()}</h4>
										<p class="text-[11px] leading-relaxed text-[#6D28D9]">
											{m.pb_session_not_ready_desc()}
										</p>
									</div>
								</div>

								<div
									class="flex flex-col justify-between gap-2 border-t border-[#EDE9FE] pt-1 sm:flex-row sm:items-center"
								>
									<span class="text-[10px] text-[#6D28D9]">{m.pb_session_draft_saved()}</span>
									<button
										type="button"
										onclick={goToScheduleSettings}
										class="inline-flex cursor-pointer items-center justify-center gap-1.5 self-start rounded-xl bg-[#6D28D9] px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-[#5B21B6] sm:self-auto"
									>
										<span>{m.pb_session_set_schedule()}</span>
										<ArrowRight class="h-3.5 w-3.5" />
									</button>
								</div>
							</div>
						{:else}
							<div
								class="space-y-3 rounded-2xl border border-[#DDD6FE] bg-[#FAF8FF] p-4 shadow-2xs"
							>
								<div class="flex items-start justify-between gap-3">
									<div class="space-y-1">
										<span class="text-[10px] font-bold tracking-wider text-[#6D28D9] uppercase">
											{m.pb_session_availability()}
										</span>
										<div class="space-y-0.5 pt-0.5">
											{#each formatWeeklyScheduleSummary(profile?.availability) as group, gIdx (gIdx)}
												<div class="text-xs text-[#0E2E25]">
													<span class="font-bold">{group.dayGroup}</span>
													<span class="ml-2 font-medium text-[#52776C]">
														{m.pb_session_wib({ range: group.timeRange })}
													</span>
												</div>
											{/each}
										</div>
									</div>

									<button
										type="button"
										onclick={goToScheduleSettings}
										class="flex flex-shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-[#DDD6FE] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#6D28D9] shadow-2xs transition-colors hover:underline"
									>
										<span>{m.pb_session_edit_schedule()}</span>
										<ArrowRight class="h-3 w-3" />
									</button>
								</div>

								<div
									class="flex items-center gap-2 border-t border-[#EDE9FE] pt-2 text-xs text-[#4C1D95]"
								>
									<CircleCheckBig class="h-3.5 w-3.5 flex-shrink-0 text-[#7C3AED]" />
									<span class="text-[11px] text-[#52776C]">
										{m.pb_session_calendar_connected({
											email: profile?.calendarIntegration?.connectedEmail || m.pb_active()
										})}
									</span>
								</div>

								<div
									class="flex flex-col justify-between gap-2 border-t border-[#EDE9FE] pt-2 sm:flex-row sm:items-center"
								>
									<div class="text-[11px] text-[#52776C]">{formatBookingRulesSummary(draft)}</div>
									<button
										type="button"
										onclick={() => (showAdvancedBooking = !showAdvancedBooking)}
										class="inline-flex flex-shrink-0 cursor-pointer items-center gap-1 self-start py-1 text-[11px] font-bold text-[#6D28D9] hover:text-[#5B21B6] sm:self-auto"
									>
										<span>
											{showAdvancedBooking
												? m.pb_session_close_detail()
												: m.pb_session_more_detail()}
										</span>
										{#if showAdvancedBooking}
											<ChevronUp class="h-3.5 w-3.5" />
										{:else}
											<ChevronDown class="h-3.5 w-3.5" />
										{/if}
									</button>
								</div>

								{#if showAdvancedBooking}
									<div class="animate-fadeIn space-y-3.5 border-t border-[#EDE9FE] pt-3">
										<div class="space-y-1">
											<span class="text-xs font-bold text-[#0E2E25]">{m.pb_session_buffer()}</span>
											<div class="grid grid-cols-2 gap-2 pt-0.5 sm:grid-cols-4">
												{#each bufferOptions as opt (opt.value)}
													<button
														type="button"
														onclick={() => setField('bufferMinutes', opt.value)}
														class="cursor-pointer rounded-xl border px-2.5 py-1.5 text-center text-xs font-semibold transition-all {(draft.bufferMinutes ??
															0) === opt.value
															? 'border-[#C4B5FD] bg-[#F5F3FF] font-bold text-[#6D28D9] shadow-2xs'
															: 'border-[#D5E2DC] bg-white text-[#52776C] hover:border-[#96B8A9]'}"
													>
														{opt.label}
													</button>
												{/each}
											</div>
										</div>

										<div class="space-y-1">
											<span class="text-xs font-bold text-[#0E2E25]">{m.pb_session_notice()}</span>
											<div class="grid grid-cols-2 gap-2 pt-0.5 sm:grid-cols-4">
												{#each noticeOptions as opt (opt.value)}
													<button
														type="button"
														onclick={() => setField('minimumNoticeHours', opt.value)}
														class="cursor-pointer rounded-xl border px-2.5 py-1.5 text-center text-xs font-semibold transition-all {(draft.minimumNoticeHours ??
															6) === opt.value
															? 'border-[#C4B5FD] bg-[#F5F3FF] font-bold text-[#6D28D9] shadow-2xs'
															: 'border-[#D5E2DC] bg-white text-[#52776C] hover:border-[#96B8A9]'}"
													>
														{opt.label}
													</button>
												{/each}
											</div>
										</div>
									</div>
								{/if}
							</div>
						{/if}

						<!-- Duration selector -->
						<div class="space-y-1.5">
							<span class="text-xs font-bold text-[#0E2E25]">
								{m.pb_session_duration_label()}
							</span>
							<div class="flex flex-wrap gap-2">
								{#each DURATION_OPTIONS as dur (dur)}
									<button
										type="button"
										onclick={() => setField('sessionDurationMinutes', dur)}
										class="cursor-pointer rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all {draft.sessionDurationMinutes ===
										dur
											? 'border-[#C4B5FD] bg-[#F5F3FF] font-bold text-[#6D28D9] shadow-2xs'
											: 'border-[#D5E2DC] bg-white text-[#4A7264] hover:border-[#97B8A9]'}"
									>
										{m.pb_minutes({ n: dur })}
									</button>
								{/each}
							</div>
						</div>

						<!-- Meeting Platform -->
						<div class="space-y-1.5">
							<span class="text-xs font-bold text-[#0E2E25]">{m.pb_session_place()}</span>
							<div
								class="flex items-center justify-between gap-3 rounded-xl border border-[#D5E2DC] bg-white p-3.5 shadow-2xs"
							>
								<div class="flex items-center gap-2.5">
									<div
										class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#F5F3FF] text-[#7C3AED]"
									>
										<Video class="h-4 w-4" />
									</div>
									<div>
										<div class="text-xs font-bold text-[#0E2E25]">{m.pb_google_meet()}</div>
										<p class="text-[11px] text-[#52776C]">{m.pb_google_meet_desc()}</p>
									</div>
								</div>
								<span
									class="flex-shrink-0 rounded-md border border-[#DDD6FE] bg-[#F5F3FF] px-2 py-0.5 text-[10px] font-bold text-[#6D28D9]"
								>
									{m.pb_auto()}
								</span>
							</div>
						</div>

						<!-- Preparation Questions -->
						<div class="space-y-2">
							<div>
								<span class="text-xs font-bold text-[#0E2E25]">
									{m.pb_session_questions()}
									<span class="font-normal text-[#739488]">({m.pb_optional()})</span>
								</span>
								<p class="text-[11px] text-[#52776C]">{m.pb_session_questions_desc()}</p>
							</div>

							{#if (draft.preparationQuestions || []).length === 0}
								<div
									class="flex items-center justify-between gap-3 rounded-xl border border-dashed border-[#D5E2DC] bg-white p-3.5"
								>
									<span class="text-xs text-[#52776C]">{m.pb_session_no_questions()}</span>
									<button
										type="button"
										onclick={() => setField('preparationQuestions', [''])}
										class="cursor-pointer rounded-lg border border-[#DDD6FE] bg-[#F5F3FF] px-3 py-1 text-xs font-bold text-[#6D28D9] transition-colors hover:bg-[#EDE9FE]"
									>
										{m.pb_session_add_question()}
									</button>
								</div>
							{:else}
								<div class="space-y-2">
									{#each draft.preparationQuestions || [] as question, qIdx (qIdx)}
										<div class="flex items-center gap-2">
											<span class="w-4 text-xs font-bold text-[#52776C]">{qIdx + 1}.</span>
											<input
												type="text"
												value={question}
												oninput={(e) =>
													updatePreparationQuestion(
														qIdx,
														(e.currentTarget as HTMLInputElement).value
													)}
												placeholder={m.pb_session_question_ph()}
												class="flex-1 rounded-xl border border-[#D5E2DC] bg-white px-3 py-2 text-xs text-[#0E2E25] outline-none focus:border-[#7C3AED]"
											/>
											<button
												type="button"
												onclick={() => removePreparationQuestion(qIdx)}
												title={m.pb_faq_remove()}
												class="cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:text-rose-600"
											>
												<Trash2 class="h-4 w-4" />
											</button>
										</div>
									{/each}
									{#if (draft.preparationQuestions || []).length < 3}
										<button
											type="button"
											onclick={() =>
												setField('preparationQuestions', [
													...(draft.preparationQuestions || []),
													''
												])}
											class="cursor-pointer pt-0.5 text-[11px] font-semibold text-[#6D28D9] hover:underline"
										>
											{m.pb_session_add_question_more()}
										</button>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- 2.C SERVICE SETTINGS -->
				{#if draft.type === 'service'}
					<div class="space-y-5">
						<div class="space-y-1">
							<div class="flex items-center justify-between">
								<h2 class="flex items-center gap-1.5 text-base font-bold text-[#0E2E25]">
									<Briefcase class="h-4 w-4 text-[#EA580C]" />
									<span>{m.pb_service_section_title()}</span>
								</h2>
								<span class="text-[11px] font-medium text-[#739488]">{m.pb_required()}</span>
							</div>
							<p class="text-xs text-[#52776C]">{m.pb_service_section_desc()}</p>
						</div>

						<div class="space-y-1.5">
							<span class="text-xs font-bold text-[#0E2E25]">{m.pb_service_deliverables()}</span>
							<input
								type="text"
								value={draft.serviceDeliverables || ''}
								oninput={(e) =>
									setField('serviceDeliverables', (e.currentTarget as HTMLInputElement).value)}
								placeholder={m.pb_service_deliverables_ph()}
								class="w-full rounded-xl border border-[#D5E2DC] bg-white px-3.5 py-2.5 text-xs text-[#0E2E25] transition-all outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C]"
							/>
						</div>

						<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<div class="space-y-1.5">
								<span class="text-xs font-bold text-[#0E2E25]">
									{m.pb_service_timeline_label()}
								</span>
								<div class="relative">
									<input
										type="number"
										min={1}
										placeholder="e.g. 3"
										value={draft.serviceTimelineDays !== undefined ? draft.serviceTimelineDays : ''}
										oninput={(e) => {
											const raw = (e.currentTarget as HTMLInputElement).value;
											setField(
												'serviceTimelineDays',
												raw === '' ? undefined : Math.max(1, Number(raw))
											);
										}}
										class="w-full rounded-xl border border-[#D5E2DC] bg-white px-3.5 py-2 text-xs font-bold text-[#0E2E25] outline-none focus:border-[#EA580C]"
									/>
									<span
										class="absolute top-1/2 right-3.5 -translate-y-1/2 text-xs font-semibold text-[#52776C]"
									>
										{m.pb_service_workdays()}
									</span>
								</div>
							</div>

							<div class="space-y-1.5">
								<span class="text-xs font-bold text-[#0E2E25]">
									{m.pb_service_revisions_label()}
								</span>
								<div class="relative">
									<input
										type="number"
										value={draft.serviceRevisions ?? 1}
										oninput={(e) =>
											setField(
												'serviceRevisions',
												Number((e.currentTarget as HTMLInputElement).value) || 0
											)}
										class="w-full rounded-xl border border-[#D5E2DC] bg-white px-3.5 py-2 text-xs font-bold text-[#0E2E25] outline-none focus:border-[#EA580C]"
									/>
									<span
										class="absolute top-1/2 right-3.5 -translate-y-1/2 text-xs font-semibold text-[#52776C]"
									>
										{m.pb_service_revisions_suffix()}
									</span>
								</div>
							</div>
						</div>

						<div class="space-y-1.5">
							<span class="text-xs font-bold text-[#0E2E25]">{m.pb_service_buyer_inputs()}</span>
							<textarea
								rows={2}
								value={draft.serviceBuyerInputsRequired || ''}
								oninput={(e) =>
									setField(
										'serviceBuyerInputsRequired',
										(e.currentTarget as HTMLTextAreaElement).value
									)}
								placeholder={m.pb_service_buyer_inputs_ph()}
								class="w-full rounded-xl border border-[#D5E2DC] bg-white p-3 text-xs text-[#0E2E25] transition-all outline-none focus:border-[#EA580C]"
							></textarea>
						</div>
					</div>
				{/if}
			</div>

			<!-- SECTION 3: DETAIL HALAMAN (OPSIONAL / EXPANDABLE) -->
			<div class="space-y-4 border-t border-[#E8EFEA] pt-8">
				<button
					type="button"
					onclick={() => (showEnhancementSection = !showEnhancementSection)}
					class="group flex w-full cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[#DCE7E1] bg-white p-4 shadow-2xs transition-all hover:bg-[#F8FAF9]"
				>
					<div class="space-y-0.5 text-left">
						<div class="flex items-center gap-2">
							<span class="text-sm font-bold text-[#0E2E25]">{m.pb_s3_title()}</span>
							<span
								class="rounded-full bg-[#F0F5F2] px-2 py-0.5 text-[10px] font-semibold text-[#52776C]"
							>
								{m.pb_optional()}
							</span>
						</div>
						<p class="text-xs text-[#52776C]">{m.pb_s3_desc()}</p>
					</div>

					<div
						class="flex-shrink-0 rounded-lg bg-[#F0F5F2] p-1.5 text-[#52776C] transition-colors group-hover:text-[#0E2E25]"
					>
						{#if showEnhancementSection}
							<ChevronUp class="h-4 w-4" />
						{:else}
							<ChevronDown class="h-4 w-4" />
						{/if}
					</div>
				</button>

				{#if showEnhancementSection}
					<div class="animate-fadeIn space-y-5 pt-2">
						<div class="space-y-1.5">
							<span class="text-xs font-bold text-[#0E2E25]">{m.pb_s3_audience()}</span>
							<textarea
								rows={2}
								value={draft.targetAudience}
								oninput={(e) =>
									setField('targetAudience', (e.currentTarget as HTMLTextAreaElement).value)}
								placeholder={m.pb_s3_audience_ph()}
								class="w-full rounded-xl border border-[#D5E2DC] bg-white p-3 text-xs text-[#0E2E25] outline-none focus:border-[#0C7B58]"
							></textarea>
						</div>

						<div class="space-y-1.5">
							<span class="text-xs font-bold text-[#0E2E25]">{m.pb_s3_problem()}</span>
							<textarea
								rows={2}
								value={draft.problemSolved}
								oninput={(e) =>
									setField('problemSolved', (e.currentTarget as HTMLTextAreaElement).value)}
								placeholder={m.pb_s3_problem_ph()}
								class="w-full rounded-xl border border-[#D5E2DC] bg-white p-3 text-xs text-[#0E2E25] outline-none focus:border-[#0C7B58]"
							></textarea>
						</div>

						<div class="space-y-1.5">
							<span class="text-xs font-bold text-[#0E2E25]">{m.pb_lp_about()}</span>
							<textarea
								rows={2}
								value={draft.aboutCreator}
								oninput={(e) =>
									setField('aboutCreator', (e.currentTarget as HTMLTextAreaElement).value)}
								placeholder={m.pb_s3_about_ph()}
								class="w-full rounded-xl border border-[#D5E2DC] bg-white p-3 text-xs text-[#0E2E25] outline-none focus:border-[#0C7B58]"
							></textarea>
						</div>

						<div class="space-y-3 pt-1">
							<div class="flex items-center justify-between">
								<span class="text-xs font-bold text-[#0E2E25]">{m.pb_s3_faq()}</span>
								<button
									type="button"
									onclick={handleAddFaq}
									class="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-[#0C7B58] hover:underline"
								>
									<Plus class="h-3.5 w-3.5" />
									<span>{m.pb_faq_add()}</span>
								</button>
							</div>

							{#if draft.faqs.length === 0}
								<div
									class="rounded-xl border border-dashed border-[#D5E2DC] bg-white p-3.5 text-center text-xs text-[#52776C]"
								>
									{m.pb_faq_empty()}
								</div>
							{:else}
								<div class="space-y-2.5">
									{#each draft.faqs as faq, index (faq.id)}
										<div
											class="relative space-y-2 rounded-xl border border-[#D5E2DC] bg-white p-3 shadow-2xs"
										>
											<div class="flex items-center justify-between">
												<span class="text-[11px] font-bold text-[#0C7B58]">
													{m.pb_faq_numbered({ n: index + 1 })}
												</span>
												<button
													type="button"
													onclick={() => handleDeleteFaq(faq.id)}
													aria-label={m.pb_faq_remove()}
													class="cursor-pointer p-1 text-gray-400 hover:text-rose-600"
												>
													<Trash2 class="h-3.5 w-3.5" />
												</button>
											</div>
											<input
												type="text"
												value={faq.question}
												oninput={(e) =>
													handleUpdateFaq(
														faq.id,
														'question',
														(e.currentTarget as HTMLInputElement).value
													)}
												placeholder={m.pb_faq_q_ph()}
												class="w-full rounded-lg border border-[#D5E2DC] bg-[#FAFDFB] px-3 py-1.5 text-xs text-[#0E2E25] outline-none"
											/>
											<textarea
												rows={2}
												value={faq.answer}
												oninput={(e) =>
													handleUpdateFaq(
														faq.id,
														'answer',
														(e.currentTarget as HTMLTextAreaElement).value
													)}
												placeholder={m.pb_faq_a_ph()}
												class="w-full rounded-lg border border-[#D5E2DC] bg-[#FAFDFB] p-2 text-xs text-[#0E2E25] outline-none"
											></textarea>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- RIGHT COLUMN: CALM BUYER PREVIEW -->
		<div class="lg:col-span-5 {mobileTab === 'editor' ? 'hidden lg:block' : 'block'}">
			<div class="sticky top-20 space-y-3">
				<div class="flex items-center justify-between px-1">
					<span class="text-xs font-bold tracking-wide text-[#52776C] uppercase">
						{m.pb_preview_title()}
					</span>
					<span class="text-[11px] text-[#739488]">{m.pb_preview_buyer_view()}</span>
				</div>

				<div class="overflow-hidden rounded-2xl border border-[#DCE7E1] bg-white shadow-sm">
					<div class="max-h-[calc(100vh-140px)] space-y-5 overflow-y-auto p-5">
						<!-- Cover Media Preview -->
						<div
							class="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-[#E4EBE7] bg-[#F8FAF9]"
						>
							{#if validImages.length > 0}
								<img
									src={validImages[0]}
									alt={m.pb_cover_label()}
									class="h-full w-full object-cover"
								/>
							{:else}
								<div class="flex flex-col items-center justify-center gap-2 p-4 text-center">
									<div
										class="flex h-12 w-12 items-center justify-center rounded-2xl border {theme.bgColor} {theme.textColor} {theme.borderColor}"
									>
										<theme.icon class="h-6 w-6 stroke-[2]" />
									</div>
									<span class="text-[11px] font-semibold text-[#52776C]">
										{m[theme.labelKey]()}
									</span>
								</div>
							{/if}

							<div class="absolute top-2.5 left-2.5 flex items-center gap-1.5">
								<span
									class="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold {theme.badgeClass}"
								>
									<theme.icon class="h-3 w-3" />
									{m[theme.labelKey]()}
									{#if draft.productSubtype}
										<span class="font-normal">· {draft.productSubtype}</span>
									{/if}
								</span>
							</div>
						</div>

						{#if validImages.length > 1}
							<div class="flex gap-2 overflow-x-auto pb-0.5">
								{#each validImages as img, i (i)}
									<div
										class="h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg border border-[#D5E2DC]"
									>
										<img src={img} alt="" class="h-full w-full object-cover" />
									</div>
								{/each}
							</div>
						{/if}

						<!-- Title & Short Description -->
						<div class="space-y-1.5">
							<h3 class="text-base leading-snug font-bold text-[#0E2E25]">
								{draft.title || m.pb_preview_title_ph()}
							</h3>
							<p class="text-xs leading-relaxed text-[#52776C]">
								{draft.whatYouGet || draft.shortDescription || m.pb_preview_desc_ph()}
							</p>
						</div>

						<!-- Pricing & CTA Card -->
						<div
							class="space-y-3.5 rounded-2xl border border-[#DCE7E1] bg-[#F8FAF9] p-4 shadow-2xs"
						>
							<div class="flex items-center justify-between">
								<span class="text-xs font-semibold text-[#52776C]">{m.pb_field_price()}</span>
								<div class="text-right">
									{#if draft.priceMode === 'free'}
										<span class="text-lg font-bold text-[#0C7B58]">{m.pb_price_mode_free()}</span>
									{:else if draft.priceMode === 'promo'}
										<div class="flex items-center gap-2">
											<span class="text-xs text-gray-400 line-through">
												{formatRupiah(draft.regularPrice || 0)}
											</span>
											<span class="text-lg font-bold text-[#0C7B58]">
												{formatRupiah(draft.promoPrice || draft.price)}
											</span>
										</div>
									{:else}
										<span class="text-lg font-bold text-[#0E2E25]">
											{formatRupiah(draft.price)}
										</span>
									{/if}
								</div>
							</div>

							<div
								class="flex items-center gap-2 rounded-xl border border-[#DCE7E1] bg-white p-2.5 text-[11px] text-[#205847]"
							>
								{#if draft.type === 'session'}
									<Clock class="h-3.5 w-3.5 flex-shrink-0 text-[#7C3AED]" />
									<span>{m.pb_preview_session({ n: draft.sessionDurationMinutes || 30 })}</span>
								{:else if draft.type === 'digital'}
									<FileText class="h-3.5 w-3.5 flex-shrink-0 text-[#2563EB]" />
									<span>
										{m.pb_preview_link_after_payment()}
									</span>
								{:else}
									<Briefcase class="h-3.5 w-3.5 flex-shrink-0 text-[#EA580C]" />
									<span>
										{draft.serviceTimelineDays
											? m.pb_preview_service_days({ n: draft.serviceTimelineDays })
											: m.pb_preview_service_no_days()}
									</span>
								{/if}
							</div>

							<button
								type="button"
								disabled
								class="flex w-full cursor-default items-center justify-center gap-2 rounded-xl bg-[#0C7B58] py-2.5 text-center text-xs font-bold text-white shadow-xs"
							>
								<span>
									{draft.priceMode === 'free'
										? m.pb_cta_free()
										: draft.type === 'session'
											? m.pb_cta_session()
											: draft.type === 'service'
												? m.pb_cta_service()
												: m.pb_cta_buy()}
								</span>
							</button>

							<div
								class="flex items-center justify-center gap-1.5 pt-0.5 text-center text-[10px] text-[#739488]"
							>
								<ShieldCheck class="h-3.5 w-3.5 text-[#0C7B58]" />
								<span>{m.pb_preview_payment_note()}</span>
							</div>
						</div>

						{#if draft.targetAudience}
							<div class="space-y-1 rounded-xl border border-[#DCE7E1] bg-[#F8FAF9] p-3.5">
								<div class="text-xs font-bold text-[#0E2E25]">{m.pb_preview_audience()}</div>
								<p class="text-xs leading-relaxed text-[#52776C]">{draft.targetAudience}</p>
							</div>
						{/if}

						{#if draft.problemSolved}
							<div class="space-y-1 rounded-xl border border-[#DCE7E1] bg-[#F8FAF9] p-3.5">
								<div class="text-xs font-bold text-[#0E2E25]">{m.pb_preview_problem()}</div>
								<p class="text-xs leading-relaxed text-[#52776C]">{draft.problemSolved}</p>
							</div>
						{/if}

						{#if draft.aboutCreator}
							<div class="space-y-1 rounded-xl border border-[#DCE7E1] bg-[#F8FAF9] p-3.5">
								<div class="text-xs font-bold text-[#0E2E25]">{m.pb_preview_about()}</div>
								<p class="text-xs leading-relaxed text-[#52776C]">{draft.aboutCreator}</p>
							</div>
						{/if}

						{#if draft.faqs && draft.faqs.length > 0}
							<div class="space-y-2 pt-1">
								<div class="text-xs font-bold text-[#0E2E25]">{m.pb_s3_faq()}</div>
								<div class="space-y-1.5">
									{#each draft.faqs as f (f.id)}
										<div class="space-y-0.5 rounded-xl border border-[#DCE7E1] bg-white p-3">
											<div class="text-xs font-bold text-[#0E2E25]">
												{f.question || m.pb_faq_q()}
											</div>
											<div class="text-xs text-[#52776C]">{f.answer || m.pb_faq_a()}</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	@keyframes pb-fade-in {
		from {
			opacity: 0;
			transform: translateY(-2px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fadeIn {
		animation: pb-fade-in 0.15s ease-out;
	}
</style>
