<script lang="ts">
	import { goto } from '$app/navigation';
	import * as m from '$lib/paraglide/messages.js';
	import { seller } from '$lib/stores/seller.svelte';
	import { normalizeProductType, type Order, type Product } from '$lib/types';
	import {
		findBookingForOrder,
		getOrderNextAction,
		getPaymentStatusDisplay,
		getProductNextStepState,
		hasSessionEnded,
		isOrderPendingFulfillment,
		needsSellerAction,
		sortOrdersForProductDetail
	} from '$lib/domain/orderLifecycle';
	import { getProductPriceState } from '$lib/domain/pricing';
	import { getPublicProductUrl } from '$lib/domain/url';
	import { formatRupiah } from '$lib/data/mockData';
	import PageFrame from '$lib/components/common/PageFrame.svelte';
	import PageContent from '$lib/components/common/PageContent.svelte';
	import ProductTypeMeta from '$lib/components/common/ProductTypeMeta.svelte';
	import OrderDetailModal from '$lib/components/orders/OrderDetailModal.svelte';
	import ContactBuyerModal, {
		type ContactIntent
	} from '$lib/components/orders/ContactBuyerModal.svelte';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Share2 from 'lucide-svelte/icons/share-2';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import Edit3 from 'lucide-svelte/icons/edit-3';
	import Globe from 'lucide-svelte/icons/globe';
	import Clock from 'lucide-svelte/icons/clock';
	import CheckCircle2 from 'lucide-svelte/icons/check-circle-2';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import Calendar from 'lucide-svelte/icons/calendar';
	import MessageCircle from 'lucide-svelte/icons/message-circle';
	import Video from 'lucide-svelte/icons/video';
	import Link2 from 'lucide-svelte/icons/link-2';
	import Check from 'lucide-svelte/icons/check';
	import Star from 'lucide-svelte/icons/star';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import ChevronUp from 'lucide-svelte/icons/chevron-up';
	import Copy from 'lucide-svelte/icons/copy';
	import X from 'lucide-svelte/icons/x';
	import MoreHorizontal from 'lucide-svelte/icons/more-horizontal';
	import Pause from 'lucide-svelte/icons/pause';
	import Play from 'lucide-svelte/icons/play';
	import Archive from 'lucide-svelte/icons/archive';

	type Props = {
		product: Product;
	};
	let { product }: Props = $props();

	let copiedLink = $state(false);
	let copiedTemplate = $state<string | null>(null);
	let kebabOpen = $state(false);
	let isSpecOpen = $state(false);
	let shareModalOpen = $state(false);
	let selectedDetailOrderId = $state<string | null>(null);
	let contactModalOrderId = $state<string | null>(null);
	let contactIntent = $state<ContactIntent>('feedback');

	const productType = $derived(normalizeProductType(product.type));
	const username = $derived(seller.sellerProfile?.username || 'rival');
	const publicProductUrl = $derived(getPublicProductUrl(username, product.slug));

	const productOrders = $derived(seller.orders.filter((o: Order) => o.productId === product.id));
	const nextStep = $derived(
		getProductNextStepState({
			product,
			productOrders,
			bookings: seller.bookings,
			reviews: seller.reviews
		})
	);
	const activeOrders = $derived(
		productOrders.filter((o: Order) => o.fulfillmentStatus !== 'dibatalkan')
	);
	const urgentActionOrder = $derived<Order | undefined>(
		nextStep.urgentOrder ||
			activeOrders.find((o: Order) => needsSellerAction(o, findBookingForOrder(o, seller.bookings)))
	);
	const urgentBooking = $derived(
		urgentActionOrder ? findBookingForOrder(urgentActionOrder, seller.bookings) : undefined
	);
	const urgentNextAction = $derived(
		nextStep.urgentNextAction ||
			(urgentActionOrder
				? getOrderNextAction(urgentActionOrder, urgentBooking, undefined, seller.reviews)
				: null)
	);
	const inProgressOrder = $derived<Order | undefined>(
		nextStep.activeOrder || activeOrders.find((o: Order) => isOrderPendingFulfillment(o))
	);

	const viewsCount = $derived(product.views || 0);
	const isFreeProduct = $derived(product.priceMode === 'free');
	const claimsCount = $derived(product.claims || 0);
	const paidProductOrders = $derived(
		productOrders.filter(
			(o: Order) =>
				o.paymentStatus === 'lunas' && !o.isFreeClaim && o.fulfillmentStatus !== 'dibatalkan'
		)
	);
	const completedSalesCount = $derived(nextStep.completedSalesCount);
	const salesCount = $derived(
		completedSalesCount > 0
			? completedSalesCount
			: product.sales > 0
				? product.sales
				: paidProductOrders.length
	);
	const buyClicksCount = $derived(product.buyClicks || 0);
	const revenueTotal = $derived(
		isFreeProduct
			? 0
			: product.revenue > 0
				? product.revenue
				: paidProductOrders.reduce((sum: number, o: Order) => sum + o.amount, 0)
	);
	const effectiveConversions = $derived(isFreeProduct ? claimsCount : salesCount);
	const conversionRate = $derived(
		viewsCount > 0 ? Math.min(100, Math.round((effectiveConversions / viewsCount) * 100)) : 0
	);
	const priceState = $derived(getProductPriceState(product));

	const insight = $derived.by((): { headline: string; supporting: string } => {
		if (isFreeProduct && claimsCount > 0 && viewsCount > 0) {
			return {
				headline: m.pd_insight_free_headline({ claims: claimsCount, views: viewsCount }),
				supporting: m.pd_insight_free_support()
			};
		}
		if (salesCount > 0 && viewsCount > 0) {
			return {
				headline: m.pd_insight_sale_headline({ sales: salesCount, views: viewsCount }),
				supporting: m.pd_insight_sale_support()
			};
		}
		if (viewsCount > 0 && salesCount === 0 && (!isFreeProduct || claimsCount === 0)) {
			return {
				headline: m.pd_insight_views_headline({ views: viewsCount }),
				supporting: isFreeProduct
					? m.pd_insight_views_support_free()
					: m.pd_insight_views_support_paid()
			};
		}
		return {
			headline: m.pd_insight_zero_headline(),
			supporting: m.pd_insight_zero_support()
		};
	});

	const shareCopies = $derived.by((): { whatsapp: string; instagram: string; linkedin: string } => {
		const title = product.title;
		const url = publicProductUrl;
		if (productType === 'digital') {
			return {
				whatsapp: m.pd_share_wa_digital({
					title,
					audience: product.targetAudience || m.pd_share_fb_aud_digital(),
					url
				}),
				instagram: m.pd_share_ig_digital({ title, url }),
				linkedin: m.pd_share_li_digital({
					title,
					solved: product.problemSolved || m.pd_share_fb_solved_digital(),
					url
				})
			};
		}
		if (productType === 'service') {
			return {
				whatsapp: m.pd_share_wa_service({
					title,
					audience: product.targetAudience || m.pd_share_fb_aud_service(),
					url
				}),
				instagram: m.pd_share_ig_service({ title, url }),
				linkedin: m.pd_share_li_service({
					title,
					solved: product.problemSolved || m.pd_share_fb_solved_service(),
					url
				})
			};
		}
		return {
			whatsapp: m.pd_share_wa_session({
				title,
				audience: product.targetAudience || m.pd_share_fb_aud_session(),
				url
			}),
			instagram: m.pd_share_ig_session({ title, url }),
			linkedin: m.pd_share_li_session({
				title,
				solved: product.problemSolved || m.pd_share_fb_solved_session(),
				url
			})
		};
	});
	const whatsappCopy = $derived(shareCopies.whatsapp);
	const instagramCopy = $derived(shareCopies.instagram);
	const linkedinCopy = $derived(shareCopies.linkedin);

	const listedOrders = $derived(
		sortOrdersForProductDetail(productOrders, seller.bookings).slice(0, 3)
	);
	const selectedDetailOrder = $derived(
		selectedDetailOrderId ? seller.findOrder(selectedDetailOrderId) : null
	);
	const contactModalOrder = $derived(
		contactModalOrderId ? seller.findOrder(contactModalOrderId) : null
	);

	function goBack() {
		void goto('/dashboard/products');
	}

	function goEdit() {
		void goto(`/dashboard/products/${product.id}/edit`);
	}

	function goAllOrders() {
		void goto(`/dashboard/orders?productId=${product.id}`);
	}

	function goOrderDetail(orderId: string) {
		void goto(`/dashboard/orders/${orderId}`);
	}

	function goPublicPage() {
		void goto(`/${username}/${product.slug}`);
	}

	function publishProduct() {
		seller.updateProduct({ ...product, status: 'active' });
	}

	function openShareKit() {
		seller.shareProduct(product);
		shareModalOpen = true;
	}

	function togglePause() {
		seller.toggleProductStatus(product.id);
		kebabOpen = false;
	}

	function duplicateProduct() {
		seller.duplicateProduct(product);
		kebabOpen = false;
	}

	function archiveProduct() {
		seller.archiveProduct(product.id);
		kebabOpen = false;
		void goto('/dashboard/products');
	}

	function copyText(text: string, type: string) {
		void navigator.clipboard.writeText(text);
		if (type === 'link') {
			copiedLink = true;
			setTimeout(() => (copiedLink = false), 2000);
		} else {
			copiedTemplate = type;
			setTimeout(() => (copiedTemplate = null), 2000);
		}
	}

	function openContactModal(order: Order, intent: ContactIntent = 'feedback') {
		contactModalOrderId = order.id;
		contactIntent = intent;
	}

	function completeOrder(orderId: string) {
		seller.updateFulfillment(orderId, 'selesai');
	}

	function handleContactCompleted(
		intent: 'meeting_link' | 'reschedule_notice' | 'feedback' | 'general',
		orderId: string
	) {
		const order = seller.findOrder(orderId) ?? contactModalOrder;
		if (!order) return;
		if (intent === 'meeting_link') {
			seller.updateFulfillment(orderId, order.fulfillmentStatus, {
				meetingLinkSharedAt: new Date().toISOString()
			});
		} else if (intent === 'reschedule_notice') {
			seller.updateFulfillment(orderId, order.fulfillmentStatus, {
				rescheduleNoticePending: false,
				rescheduleNotifiedAt: new Date().toISOString()
			});
		} else if (intent === 'feedback') {
			seller.updateFulfillment(orderId, order.fulfillmentStatus, {
				feedbackRequestedAt: new Date().toISOString()
			});
		}
	}
</script>

<PageFrame>
	<PageContent variant="standard" className="text-[#0E2E25]">
		<div class="flex items-center">
			<button
				id="btn-back-to-products"
				onclick={goBack}
				class="group inline-flex cursor-pointer items-center gap-1.5 py-0.5 text-xs font-semibold text-[#52776C] transition-colors hover:text-[#0E2E25]"
			>
				<ArrowLeft
					class="h-3.5 w-3.5 text-[#52776C] transition-transform group-hover:-translate-x-0.5"
				/>
				<span>{m.nav_products()}</span>
			</button>
		</div>

		<div
			id="product-detail-header"
			class="flex flex-col gap-4 pt-1 md:flex-row md:items-start md:justify-between md:gap-6"
		>
			<div class="min-w-0 flex-1 space-y-1.5">
				<h1
					class="text-2xl leading-tight font-bold tracking-tight break-words text-[#0E2E25] sm:text-3xl"
				>
					{product.title}
				</h1>

				<div class="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-[#52776C]">
					<ProductTypeMeta type={productType} subtype={product.productSubtype} />

					<span class="text-[#B5CCC2] select-none">·</span>

					<span class="inline-flex items-center gap-1.5 font-medium text-[#0E2E25]">
						<span
							class="h-1.5 w-1.5 rounded-full {product.status === 'active'
								? 'bg-[#0C7B58]'
								: product.status === 'draft'
									? 'bg-[#D97706]'
									: 'bg-[#8CA399]'}"
						></span>
						<span
							>{product.status === 'active'
								? m.common_status_active()
								: product.status === 'draft'
									? m.common_status_draft()
									: m.common_status_paused()}</span
						>
					</span>

					<span class="text-[#B5CCC2] select-none">·</span>

					<span class="text-[#52776C]">
						{product.visibility === 'link_only' ? m.pd_visibility_link() : m.pd_visibility_store()}
					</span>
				</div>
			</div>

			<div
				class="flex flex-col items-stretch gap-2 pt-1 sm:flex-row sm:items-center md:flex-shrink-0 md:self-start md:pt-0"
			>
				<div class="order-2 grid grid-cols-2 gap-2 sm:order-1 sm:flex sm:items-center">
					<button
						id="btn-edit-product"
						type="button"
						onclick={goEdit}
						class="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#CCE6D6] bg-white px-3.5 py-2 text-xs font-semibold text-[#1E4337] shadow-2xs transition-all hover:border-[#0C7B58] hover:bg-[#F6FAF7]"
					>
						<Edit3 class="h-3.5 w-3.5 text-[#52776C]" />
						<span>{m.common_edit()}</span>
					</button>

					<button
						id="btn-preview-product-page"
						type="button"
						onclick={goPublicPage}
						class="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#CCE6D6] bg-white px-3.5 py-2 text-xs font-semibold text-[#1E4337] shadow-2xs transition-all hover:border-[#0C7B58] hover:bg-[#F6FAF7]"
					>
						<ExternalLink class="h-3.5 w-3.5 text-[#52776C]" />
						<span>{m.pd_view_page()}</span>
					</button>
				</div>

				<div class="order-1 sm:order-2">
					{#if product.status === 'draft'}
						<button
							id="btn-publish-product-header"
							type="button"
							onclick={publishProduct}
							class="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#0C7B58] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#096649] sm:w-auto"
						>
							<Globe class="h-3.5 w-3.5" />
							<span>{m.pd_publish()}</span>
						</button>
					{:else}
						<button
							id="btn-share-product-header"
							type="button"
							onclick={openShareKit}
							class="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#0C7B58] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#096649] sm:w-auto"
						>
							<Share2 class="h-3.5 w-3.5" />
							<span>{m.pd_share()}</span>
						</button>
					{/if}
				</div>

				<div class="relative order-3">
					<button
						id="btn-product-kebab"
						type="button"
						aria-label={m.pd_menu_aria()}
						onclick={() => (kebabOpen = !kebabOpen)}
						class="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#CCE6D6] bg-white px-2.5 py-2 text-[#1E4337] shadow-2xs transition-all hover:border-[#0C7B58] hover:bg-[#F6FAF7]"
					>
						<MoreHorizontal class="h-3.5 w-3.5 text-[#52776C]" />
					</button>

					{#if kebabOpen}
						<div
							class="fixed inset-0 z-10"
							role="presentation"
							aria-hidden="true"
							onclick={() => (kebabOpen = false)}
						></div>
						<div
							class="absolute top-full right-0 z-20 mt-2 min-w-[190px] space-y-0.5 rounded-xl border border-[#E5ECE7] bg-white p-1.5 shadow-lg"
						>
							{#if product.status === 'active' || product.status === 'paused'}
								<button
									type="button"
									onclick={togglePause}
									class="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#1E4337] transition-colors hover:bg-[#F2FAF5]"
								>
									{#if product.status === 'active'}
										<Pause class="h-3.5 w-3.5 text-[#52776C]" />
										<span>{m.pd_action_pause()}</span>
									{:else}
										<Play class="h-3.5 w-3.5 text-[#0C7B58]" />
										<span>{m.pd_action_resume()}</span>
									{/if}
								</button>
							{/if}
							<button
								type="button"
								onclick={duplicateProduct}
								class="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#1E4337] transition-colors hover:bg-[#F2FAF5]"
							>
								<Copy class="h-3.5 w-3.5 text-[#52776C]" />
								<span>{m.pd_action_duplicate()}</span>
							</button>
							<button
								type="button"
								onclick={archiveProduct}
								class="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#991B1B] transition-colors hover:bg-[#FEF2F2]"
							>
								<Archive class="h-3.5 w-3.5" />
								<span>{m.pd_action_archive()}</span>
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<div
			id="card-next-best-action"
			class="space-y-4 rounded-2xl border border-[#E5ECE7] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] sm:p-7"
		>
			<div class="flex items-center justify-between">
				<span class="text-[11px] font-bold tracking-wider text-[#52776C] uppercase">
					{nextStep.state === 'draft'
						? m.pd_nba_eyebrow_draft()
						: nextStep.state === 'action_required'
							? m.pd_nba_eyebrow_action()
							: m.pd_nba_eyebrow_next()}
				</span>

				{#if nextStep.state === 'action_required'}
					<span class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B45309]">
						<span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
						<span>{m.pd_prio_main()}</span>
					</span>
				{:else if nextStep.state === 'draft'}
					<span class="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B7280]">
						<span class="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
						<span>{m.common_status_draft()}</span>
					</span>
				{:else if nextStep.state === 'active_order'}
					<span class="inline-flex items-center gap-1.5 text-xs font-medium text-[#0C7B58]">
						<span class="h-1.5 w-1.5 rounded-full bg-[#0C7B58]"></span>
						<span>{m.pd_prio_running()}</span>
					</span>
				{:else if nextStep.state === 'repeat_sales'}
					<span class="text-[11px] font-medium text-[#52776C]">
						{m.pd_nba_sales_count({ count: nextStep.completedSalesCount })}
					</span>
				{/if}
			</div>

			{#if urgentActionOrder && urgentNextAction}
				{@const heroOrder = urgentActionOrder}
				{@const heroAction = urgentNextAction}
				<div class="space-y-4">
					<div class="space-y-1">
						<h2 class="text-xl font-bold tracking-tight text-[#0A3D2E] sm:text-2xl">
							{heroAction.title}
						</h2>
						<p class="text-xs leading-relaxed text-[#275949] sm:text-sm">
							{heroAction.description}
						</p>
					</div>

					<div class="space-y-2.5 rounded-xl border border-[#EFF5F1] bg-[#F8FBF9] p-3.5 sm:p-4">
						<div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
							<div class="flex items-center gap-3">
								<div
									class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#E5ECE7] bg-white text-xs font-bold text-[#0E2E25]"
								>
									{heroOrder.buyerName.charAt(0)}
								</div>
								<div>
									<div class="flex items-center gap-2 text-xs font-bold text-[#0E2E25] sm:text-sm">
										<span>{heroOrder.buyerName}</span>
										<span class="font-mono text-[11px] font-normal text-[#8CA399]">
											{heroOrder.orderNumber}
										</span>
									</div>
									<div class="text-[11px] text-[#52776C]">
										{heroOrder.createdAt} • {formatRupiah(heroOrder.amount)}
									</div>
								</div>
							</div>

							<div class="flex items-center gap-2 text-xs">
								<span class="inline-flex items-center gap-1.5 text-xs font-medium text-[#0C7B58]">
									<span class="h-1.5 w-1.5 rounded-full bg-[#0C7B58]"></span>
									<span>{m.pd_paid()}</span>
								</span>
								<span class="text-gray-300">•</span>
								{@render fulfillmentBadge(heroOrder)}
							</div>
						</div>

						{#if heroOrder.buyerNotes}
							<div
								class="rounded-lg border border-[#EFF5F1] bg-white p-2.5 text-xs text-[#355B50] italic"
							>
								"{heroOrder.buyerNotes}"
							</div>
						{/if}
					</div>

					<div class="flex flex-wrap items-center gap-3 pt-1">
						{#if heroAction.actionType === 'schedule'}
							<button
								id="btn-hero-schedule-session"
								onclick={() => (selectedDetailOrderId = heroOrder.id)}
								class="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0C7B58] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#096649] sm:text-sm"
							>
								<Calendar class="h-4 w-4" />
								<span>{m.pd_action_schedule()}</span>
							</button>
							<button
								id="btn-hero-contact-buyer"
								onclick={() => openContactModal(heroOrder, 'general')}
								class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#BDE5D0] bg-white px-4 py-2.5 text-xs font-bold text-[#185343] shadow-2xs transition-all hover:bg-[#EDF7F1] sm:text-sm"
							>
								<MessageCircle class="h-4 w-4 text-[#25D366]" />
								<span>{m.pd_action_contact()}</span>
							</button>
						{:else if heroAction.actionType === 'notify_reschedule'}
							<button
								id="btn-hero-notify-reschedule"
								onclick={() => openContactModal(heroOrder, 'reschedule_notice')}
								class="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0C7B58] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#096649] sm:text-sm"
							>
								<MessageCircle class="h-4 w-4 text-[#A7F3D0]" />
								<span>{m.pd_action_notify_reschedule()}</span>
							</button>
							<button
								id="btn-hero-view-order"
								onclick={() => (selectedDetailOrderId = heroOrder.id)}
								class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#BDE5D0] bg-white px-4 py-2.5 text-xs font-bold text-[#185343] shadow-2xs transition-all hover:bg-[#EDF7F1] sm:text-sm"
							>
								<span>{m.pd_action_view_order()}</span>
							</button>
						{:else if heroAction.actionType === 'share_link'}
							<button
								id="btn-hero-share-link"
								onclick={() => openContactModal(heroOrder, 'meeting_link')}
								class="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0C7B58] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#096649] sm:text-sm"
							>
								<Link2 class="h-4 w-4" />
								<span>{m.pd_action_send_link()}</span>
							</button>
							<button
								id="btn-hero-view-order"
								onclick={() => (selectedDetailOrderId = heroOrder.id)}
								class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#BDE5D0] bg-white px-4 py-2.5 text-xs font-bold text-[#185343] shadow-2xs transition-all hover:bg-[#EDF7F1] sm:text-sm"
							>
								<span>{m.pd_action_view_order()}</span>
							</button>
						{:else if heroAction.actionType === 'complete'}
							<button
								id="btn-hero-complete-session"
								onclick={() => (selectedDetailOrderId = heroOrder.id)}
								class="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0C7B58] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#096649] sm:text-sm"
							>
								<CheckCircle2 class="h-4 w-4" />
								<span>{m.pd_action_mark_done()}</span>
							</button>
							<button
								id="btn-hero-contact-buyer"
								onclick={() => openContactModal(heroOrder, 'general')}
								class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#BDE5D0] bg-white px-4 py-2.5 text-xs font-bold text-[#185343] shadow-2xs transition-all hover:bg-[#EDF7F1] sm:text-sm"
							>
								<MessageCircle class="h-4 w-4 text-[#25D366]" />
								<span>{m.pd_action_contact()}</span>
							</button>
						{:else}
							<button
								id="btn-hero-view-order"
								onclick={() => (selectedDetailOrderId = heroOrder.id)}
								class="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0C7B58] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#096649] sm:text-sm"
							>
								<span>{heroAction.actionLabel || m.pd_action_view_order2()}</span>
							</button>
							<button
								id="btn-hero-contact-buyer"
								onclick={() => openContactModal(heroOrder, 'general')}
								class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#BDE5D0] bg-white px-4 py-2.5 text-xs font-bold text-[#185343] shadow-2xs transition-all hover:bg-[#EDF7F1] sm:text-sm"
							>
								<MessageCircle class="h-4 w-4 text-[#25D366]" />
								<span>{m.pd_action_contact()}</span>
							</button>
						{/if}
					</div>
				</div>
			{:else if inProgressOrder}
				{@const ipOrder = inProgressOrder}
				<div class="space-y-4">
					<div class="space-y-1">
						<h2 class="text-xl font-bold tracking-tight text-[#0A3D2E] sm:text-2xl">
							{ipOrder.fulfillmentStatus === 'sudah_dijadwalkan'
								? m.pd_inprog_session_title({ buyer: ipOrder.buyerName })
								: m.pd_inprog_result_title()}
						</h2>
						<p class="text-xs leading-relaxed text-[#275949] sm:text-sm">
							{ipOrder.fulfillmentStatus === 'sudah_dijadwalkan'
								? m.pd_inprog_session_desc({
										schedule:
											ipOrder.bookingDateFormatted ||
											ipOrder.scheduledDate ||
											m.pd_inprog_schedule_fallback()
									})
								: m.pd_inprog_result_desc({ buyer: ipOrder.buyerName })}
						</p>
					</div>

					<div class="rounded-xl border border-[#EFF5F1] bg-[#F8FBF9] p-3.5 sm:p-4">
						<div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
							<div class="flex items-center gap-3">
								<div
									class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#E5ECE7] bg-white text-xs font-bold text-[#0E2E25]"
								>
									{ipOrder.buyerName.charAt(0)}
								</div>
								<div>
									<div class="flex items-center gap-2 text-xs font-bold text-[#0E2E25] sm:text-sm">
										<span>{ipOrder.buyerName}</span>
										<span class="font-mono text-[11px] font-normal text-[#8CA399]">
											{ipOrder.orderNumber}
										</span>
									</div>
									<div class="text-[11px] text-[#52776C]">
										{ipOrder.bookingDateFormatted || ipOrder.scheduledDate || ipOrder.createdAt} •{' '}
										{formatRupiah(ipOrder.amount)}
									</div>
								</div>
							</div>

							<div class="flex items-center gap-2 text-xs">
								<span class="inline-flex items-center gap-1.5 text-xs font-medium text-[#0C7B58]">
									<span class="h-1.5 w-1.5 rounded-full bg-[#0C7B58]"></span>
									<span>{m.pd_paid()}</span>
								</span>
								<span class="text-gray-300">•</span>
								<span class="text-xs font-medium text-[#52776C]">
									{ipOrder.fulfillmentStatus === 'sudah_dijadwalkan'
										? m.pd_sched_scheduled()
										: m.pd_sched_result_sent()}
								</span>
							</div>
						</div>
					</div>

					<div class="flex flex-wrap items-center gap-3 pt-1">
						{#if ipOrder.fulfillmentStatus === 'sudah_dijadwalkan'}
							<a
								href={ipOrder.meetingLink || 'https://meet.google.com'}
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0C7B58] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#096649] sm:text-sm"
							>
								<Video class="h-4 w-4" />
								<span>{m.pd_open_meet()}</span>
							</a>
							<button
								onclick={() => openContactModal(ipOrder, 'meeting_link')}
								title={m.pd_send_wa_hint()}
								class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#BDE5D0] bg-white px-4 py-2.5 text-xs font-bold text-[#185343] shadow-2xs transition-all hover:bg-[#EDF7F1] sm:text-sm"
							>
								<MessageCircle class="h-4 w-4 text-[#25D366]" />
								<span>{ipOrder.meetingLinkSharedAt ? m.pd_resend_wa() : m.pd_send_wa()}</span>
							</button>
						{:else}
							<button
								onclick={() => completeOrder(ipOrder.id)}
								class="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0C7B58] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#096649] sm:text-sm"
							>
								<CheckCircle2 class="h-4 w-4" />
								<span>{m.pd_action_mark_done()}</span>
							</button>
						{/if}

						<button
							onclick={() => (selectedDetailOrderId = ipOrder.id)}
							class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#BDE5D0] bg-white px-4 py-2.5 text-xs font-bold text-[#185343] shadow-2xs transition-all hover:bg-[#EDF7F1] sm:text-sm"
						>
							<ArrowRight class="h-4 w-4 text-[#0C7B58]" />
							<span>{m.pd_action_view_order()}</span>
						</button>
					</div>
				</div>
			{:else if product.status === 'draft'}
				<div class="space-y-4">
					<div class="space-y-1">
						<h2 class="text-xl font-bold tracking-tight text-[#0E2E25] sm:text-2xl">
							{m.pd_draft_title()}
						</h2>
						<p class="text-xs leading-relaxed text-[#4A6E62] sm:text-sm">
							{m.pd_draft_desc()}
						</p>
					</div>

					<div class="flex flex-wrap items-center gap-3 pt-1">
						<button
							id="btn-publish-draft-nba"
							onclick={publishProduct}
							class="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0C7B58] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#096649] sm:text-sm"
						>
							<Globe class="h-4 w-4" />
							<span>{m.pd_publish()}</span>
						</button>

						<button
							id="btn-edit-draft-nba"
							onclick={goEdit}
							class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#BDE5D0] bg-white px-4 py-2.5 text-xs font-bold text-[#185343] shadow-2xs transition-all hover:bg-[#EDF7F1] sm:text-sm"
						>
							<Edit3 class="h-4 w-4 text-[#0C7B58]" />
							<span>{m.pd_continue_edit()}</span>
						</button>

						<button
							id="btn-preview-draft-nba"
							onclick={goPublicPage}
							class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#BDE5D0] bg-white px-4 py-2.5 text-xs font-bold text-[#185343] shadow-2xs transition-all hover:bg-[#EDF7F1] sm:text-sm"
						>
							<ExternalLink class="h-4 w-4 text-[#0C7B58]" />
							<span>{m.pd_view_page()}</span>
						</button>
					</div>
				</div>
			{:else if nextStep.state === 'first_sale'}
				<div class="space-y-4">
					<div class="space-y-1">
						<h2 class="text-xl font-bold tracking-tight text-[#0A3D2E] sm:text-2xl">
							{nextStep.title}
						</h2>
						<p class="text-xs leading-relaxed text-[#275949] sm:text-sm">
							{nextStep.description}
						</p>
					</div>

					<div class="flex flex-wrap items-center gap-3 pt-1">
						<button
							onclick={() => (shareModalOpen = true)}
							class="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0C7B58] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#096649] sm:text-sm"
						>
							<Share2 class="h-4 w-4" />
							<span>{m.pd_share_again()}</span>
						</button>

						{#if nextStep.feedbackStatus === 'reviewed'}
							<div
								class="inline-flex items-center gap-2 rounded-xl border border-[#BDE5D0] bg-[#EAF8F0] px-4 py-2.5 text-xs font-semibold text-[#0C7B58] sm:text-sm"
							>
								<CheckCircle2 class="h-4 w-4 text-[#0C7B58]" />
								<span>{m.pd_feedback_reviewed()}</span>
							</div>
						{:else if nextStep.feedbackStatus === 'requested'}
							<div
								class="inline-flex items-center gap-2 rounded-xl border border-[#CCE6D6] bg-[#FAFDFB] px-4 py-2.5 text-xs font-semibold text-[#42695C] sm:text-sm"
							>
								<Check class="h-4 w-4 text-[#0C7B58]" />
								<span>{m.pd_feedback_requested()}</span>
							</div>
						{:else if nextStep.feedbackEligibleOrder}
							<button
								onclick={() => {
									if (nextStep.feedbackEligibleOrder)
										openContactModal(nextStep.feedbackEligibleOrder, 'feedback');
								}}
								class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#BDE5D0] bg-white px-4 py-2.5 text-xs font-bold text-[#185343] shadow-2xs transition-all hover:bg-[#EDF7F1] sm:text-sm"
							>
								<MessageCircle class="h-4 w-4 text-[#25D366]" />
								<span>{m.pd_request_review()}</span>
							</button>
						{/if}
					</div>
				</div>
			{:else if nextStep.state === 'repeat_sales'}
				<div class="space-y-4">
					<div class="space-y-1">
						<h2 class="text-xl font-bold tracking-tight text-[#0A3D2E] sm:text-2xl">
							{nextStep.title}
						</h2>
						<p class="text-xs leading-relaxed text-[#275949] sm:text-sm">
							{nextStep.description}
						</p>
					</div>

					<div class="flex flex-wrap items-center gap-3 pt-1">
						<button
							onclick={() => (shareModalOpen = true)}
							class="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0C7B58] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#096649] sm:text-sm"
						>
							<Share2 class="h-4 w-4" />
							<span>{m.pd_share_again()}</span>
						</button>

						{#if nextStep.feedbackStatus === 'reviewed'}
							<div
								class="inline-flex items-center gap-2 rounded-xl border border-[#BDE5D0] bg-[#EAF8F0] px-4 py-2.5 text-xs font-semibold text-[#0C7B58] sm:text-sm"
							>
								<CheckCircle2 class="h-4 w-4 text-[#0C7B58]" />
								<span>{m.pd_feedback_reviewed()}</span>
							</div>
						{:else if nextStep.feedbackStatus === 'requested'}
							<div
								class="inline-flex items-center gap-2 rounded-xl border border-[#CCE6D6] bg-[#FAFDFB] px-4 py-2.5 text-xs font-semibold text-[#42695C] sm:text-sm"
							>
								<Check class="h-4 w-4 text-[#0C7B58]" />
								<span>{m.pd_feedback_requested()}</span>
							</div>
						{:else if nextStep.feedbackEligibleOrder}
							<button
								onclick={() => {
									if (nextStep.feedbackEligibleOrder)
										openContactModal(nextStep.feedbackEligibleOrder, 'feedback');
								}}
								class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#BDE5D0] bg-white px-4 py-2.5 text-xs font-bold text-[#185343] shadow-2xs transition-all hover:bg-[#EDF7F1] sm:text-sm"
							>
								<MessageCircle class="h-4 w-4 text-[#25D366]" />
								<span>{m.pd_request_review()}</span>
							</button>
						{:else if nextStep.representativeCompletedOrder}
							<button
								onclick={() => {
									if (nextStep.representativeCompletedOrder)
										selectedDetailOrderId = nextStep.representativeCompletedOrder.id;
								}}
								class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#BDE5D0] bg-white px-4 py-2.5 text-xs font-bold text-[#185343] shadow-2xs transition-all hover:bg-[#EDF7F1] sm:text-sm"
							>
								<ArrowRight class="h-4 w-4 text-[#0C7B58]" />
								<span>{m.pd_action_view_order2()}</span>
							</button>
						{/if}
					</div>
				</div>
			{:else if nextStep.state === 'viewed'}
				<div class="space-y-4">
					<div class="space-y-1">
						<h2 class="text-xl font-bold tracking-tight text-[#0A3D2E] sm:text-2xl">
							{nextStep.title}
						</h2>
						<p class="text-xs leading-relaxed text-[#275949] sm:text-sm">
							{nextStep.description}
						</p>
					</div>

					<div class="flex flex-wrap items-center gap-3 pt-1">
						<button
							onclick={goPublicPage}
							class="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0C7B58] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#096649] sm:text-sm"
						>
							<ExternalLink class="h-4 w-4" />
							<span>{m.pd_view_page()}</span>
						</button>

						<button
							onclick={() => (shareModalOpen = true)}
							class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#BDE5D0] bg-white px-4 py-2.5 text-xs font-bold text-[#185343] shadow-2xs transition-all hover:bg-[#EDF7F1] sm:text-sm"
						>
							<Share2 class="h-4 w-4 text-[#0C7B58]" />
							<span>{m.pd_share_again()}</span>
						</button>
					</div>
				</div>
			{:else}
				<div class="space-y-4">
					<div class="space-y-1">
						<h2 class="text-xl font-bold tracking-tight text-[#0A3D2E] sm:text-2xl">
							{nextStep.title}
						</h2>
						<p class="text-xs leading-relaxed text-[#275949] sm:text-sm">
							{nextStep.description}
						</p>
					</div>

					<div class="flex flex-wrap items-center gap-3 pt-1">
						<button
							onclick={() => (shareModalOpen = true)}
							class="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0C7B58] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#096649] sm:text-sm"
						>
							<Share2 class="h-4 w-4" />
							<span>{m.pd_share_product()}</span>
						</button>

						<button
							onclick={goPublicPage}
							class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#BDE5D0] bg-white px-4 py-2.5 text-xs font-bold text-[#185343] shadow-2xs transition-all hover:bg-[#EDF7F1] sm:text-sm"
						>
							<ExternalLink class="h-4 w-4 text-[#0C7B58]" />
							<span>{m.pd_view_page()}</span>
						</button>
					</div>
				</div>
			{/if}
		</div>

		<div
			id="card-product-performance"
			class="space-y-5 rounded-2xl border border-[#E5ECE7] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] sm:p-6"
		>
			<div class="flex items-center justify-between">
				<div class="space-y-0.5">
					<h3 class="text-base font-bold text-[#0E2E25]">{m.pd_perf_title()}</h3>
					<p class="text-xs text-[#52776C]">{m.pd_perf_subtitle()}</p>
				</div>
				<span class="text-[11px] font-medium text-[#8CA399]">
					{m.pd_perf_updated()}
				</span>
			</div>

			<div
				class="grid grid-cols-2 gap-3 divide-y divide-[#F0F8F3] sm:grid-cols-3 sm:gap-4 sm:divide-x sm:divide-y-0 lg:grid-cols-5"
			>
				<div class="space-y-1 pt-2 first:pl-0 sm:px-2 sm:pt-0">
					<span class="text-xs font-semibold text-[#52776C]">{m.pd_metric_views()}</span>
					<div class="text-2xl font-extrabold tracking-tight text-[#0E2E25] sm:text-3xl">
						{viewsCount}
					</div>
					<p class="text-[11px] text-[#4A7264]">{m.pd_metric_views_sub()}</p>
				</div>

				<div class="space-y-1 pt-2 sm:px-2 sm:pt-0">
					<span class="text-xs font-semibold text-[#52776C]">
						{isFreeProduct ? m.pd_metric_clicks_free() : m.pd_metric_clicks_paid()}
					</span>
					<div class="text-2xl font-extrabold tracking-tight text-[#0E2E25] sm:text-3xl">
						{buyClicksCount}
					</div>
					<p class="text-[11px] text-[#4A7264]">
						{isFreeProduct ? m.pd_metric_clicks_sub_free() : m.pd_metric_clicks_sub_paid()}
					</p>
				</div>

				<div class="space-y-1 pt-2 sm:px-2 sm:pt-0">
					<span class="text-xs font-semibold text-[#52776C]">
						{isFreeProduct ? m.pd_metric_claims() : m.pd_metric_sales_count()}
					</span>
					<div class="text-2xl font-extrabold tracking-tight text-[#008A5E] sm:text-3xl">
						{isFreeProduct ? claimsCount : salesCount}
					</div>
					<p class="text-[11px] font-medium text-[#0C7B58]">
						{isFreeProduct ? m.pd_metric_claims_sub() : m.pd_metric_sales_sub()}
					</p>
				</div>

				<div class="space-y-1 pt-2 sm:px-2 sm:pt-0">
					<span class="text-xs font-semibold text-[#52776C]">{m.pd_metric_conv()}</span>
					<div class="text-2xl font-extrabold tracking-tight text-[#0E2E25] sm:text-3xl">
						{conversionRate}%
					</div>
					<p class="text-[11px] text-[#4A7264]">
						{isFreeProduct ? m.pd_metric_conv_sub_free() : m.pd_metric_conv_sub_paid()}
					</p>
				</div>

				<div class="col-span-2 space-y-1 pt-2 last:pr-0 sm:col-span-1 sm:px-2 sm:pt-0">
					<span class="text-xs font-semibold text-[#52776C]">{m.pd_metric_revenue()}</span>
					<div class="text-xl font-extrabold tracking-tight text-[#008A5E] sm:text-2xl">
						{formatRupiah(revenueTotal)}
					</div>
					<p class="text-[11px] font-medium text-[#0C7B58]">
						{isFreeProduct ? m.pd_metric_revenue_sub_free() : m.pd_metric_revenue_sub_paid()}
					</p>
				</div>
			</div>

			<div class="space-y-1 rounded-xl border border-[#DCEDE3] bg-[#FAFDFB] p-4 text-xs sm:p-4.5">
				<div class="flex items-center gap-1.5 text-xs font-bold text-[#0A3D2E] sm:text-sm">
					<span>"{insight.headline}"</span>
				</div>
				<p class="leading-relaxed text-[#355B50]">
					{insight.supporting}
				</p>
			</div>
		</div>

		<div
			id="section-pesanan"
			class="space-y-4 rounded-2xl border border-[#E5ECE7] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] sm:p-6"
		>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<h3 class="text-base font-bold text-[#0E2E25]">{m.pd_orders_title()}</h3>
					<span
						class="rounded-full border border-[#BDE5D0] bg-[#EAF8F0] px-2 py-0.5 text-xs font-bold text-[#0C7B58]"
					>
						{productOrders.length}
					</span>
				</div>
				<div class="flex items-center gap-3">
					<p class="hidden text-xs text-[#52776C] sm:inline-block">
						{productType === 'session' ? m.pd_orders_hint_session() : m.pd_orders_hint_default()}
					</p>
					{#if productOrders.length > 0}
						<button
							type="button"
							onclick={goAllOrders}
							title={m.pd_manage_orders_hint({ title: product.title })}
							class="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-[#0C7B58] transition-colors hover:text-[#096649]"
						>
							<span>{m.pd_manage_orders()}</span>
							<ArrowRight class="h-3.5 w-3.5" />
						</button>
					{/if}
				</div>
			</div>

			{#if productOrders.length === 0}
				<div
					class="space-y-2 rounded-xl border border-dashed border-[#CCE6D6] px-4 py-8 text-center"
				>
					<p class="text-xs font-semibold text-[#185343]">{m.pd_no_orders_title()}</p>
					<p class="mx-auto max-w-sm text-[11px] text-[#52776C]">
						{m.pd_no_orders_desc()}
					</p>
				</div>
			{:else}
				<div class="space-y-4">
					<div class="divide-y divide-[#F0F8F3]">
						{#each listedOrders as order (order.id)}
							{@const orderBooking = findBookingForOrder(order, seller.bookings)}
							{@const nextAction = getOrderNextAction(
								order,
								orderBooking,
								undefined,
								seller.reviews
							)}
							{@const paymentDisplay = getPaymentStatusDisplay(order)}
							<div class="space-y-3 py-4 first:pt-1 last:pb-1">
								<div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
									<div
										class="flex cursor-pointer items-center gap-3"
										role="button"
										tabindex={0}
										onclick={() => goOrderDetail(order.id)}
										onkeydown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault();
												goOrderDetail(order.id);
											}
										}}
									>
										<div
											class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[#BDE5D0] bg-[#EAF8F0] text-sm font-bold text-[#0C7B58]"
										>
											{order.buyerName.charAt(0)}
										</div>
										<div>
											<div class="flex items-center gap-2 text-sm font-bold text-[#0E2E25]">
												<span>{order.buyerName}</span>
												<span class="font-mono text-xs font-normal text-[#52776C]">
													{order.orderNumber}
												</span>
											</div>
											<div class="text-xs text-[#52776C]">
												{order.createdAt} •
												<span class="font-semibold text-[#0C7B58]">
													{order.isFreeClaim || order.amount === 0
														? m.pd_free()
														: formatRupiah(order.amount)}
												</span>
											</div>
										</div>
									</div>

									<div class="flex flex-wrap items-center gap-2 sm:justify-end">
										<span
											class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold {paymentDisplay.variant ===
											'green'
												? 'border border-[#BDE5D0] bg-[#EAF8F0] text-[#0C7B58]'
												: paymentDisplay.variant === 'red'
													? 'border border-[#FECACA] bg-[#FEE2E2] text-[#991B1B]'
													: paymentDisplay.variant === 'amber'
														? 'border border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]'
														: 'border border-gray-200 bg-gray-100 text-gray-700'}"
										>
											{#if paymentDisplay.variant === 'green'}
												<Check class="h-3 w-3" />
											{/if}
											<span>{paymentDisplay.label}</span>
										</span>

										{@render fulfillmentBadge(order)}

										{#if nextAction.actionType === 'feedback'}
											<button
												type="button"
												onclick={() => openContactModal(order, 'feedback')}
												title={m.pd_request_review_hint()}
												class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#BDE5D0] bg-white px-3 py-1.5 text-xs font-bold text-[#0C7B58] shadow-2xs transition-all hover:bg-[#EDF7F1]"
											>
												<Star class="h-3 w-3 fill-[#0C7B58] text-[#0C7B58]" />
												<span>{m.pd_request_review()}</span>
											</button>
										{:else if nextAction.actionType === 'notify_reschedule'}
											<button
												type="button"
												onclick={() => openContactModal(order, 'reschedule_notice')}
												class="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#FDE68A] bg-white px-3 py-1.5 text-xs font-bold text-[#92400E] shadow-2xs transition-all hover:bg-[#FEF3C7]"
											>
												<MessageCircle class="h-3 w-3 text-[#B45309]" />
												<span>{m.pd_badge_notify()}</span>
											</button>
										{:else if nextAction.actionType === 'share_link'}
											<button
												type="button"
												onclick={() => openContactModal(order, 'meeting_link')}
												class="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#CCE6D6] bg-white px-3 py-1.5 text-xs font-bold text-[#185343] transition-all hover:bg-[#F2FAF5]"
											>
												<Link2 class="h-3 w-3 text-[#0C7B58]" />
												<span>{m.pd_send_link_row()}</span>
											</button>
										{:else if nextAction.actionType === 'join_meeting'}
											<a
												href={order.meetingLink || orderBooking?.meetingUrl || '#'}
												target="_blank"
												rel="noopener noreferrer"
												class="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-[#0C7B58] px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition-all hover:bg-[#096649]"
											>
												<Video class="h-3 w-3" />
												<span>{m.pd_open_meet_row()}</span>
											</a>
										{:else if nextAction.actionType === 'start_working' || nextAction.actionType === 'deliver' || nextAction.actionType === 'schedule'}
											<button
												type="button"
												onclick={() => goOrderDetail(order.id)}
												class="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-[#0C7B58] px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition-all hover:bg-[#096649]"
											>
												<span>{nextAction.actionLabel || m.pd_detail()}</span>
											</button>
										{/if}

										<button
											type="button"
											onclick={() => goOrderDetail(order.id)}
											class="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-[#EAF8F0] px-3 py-1.5 text-xs font-bold text-[#0C7B58] transition-all hover:bg-[#0C7B58] hover:text-white"
										>
											<span>{m.pd_detail()}</span>
											<ArrowRight class="h-3 w-3" />
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>

					{#if productOrders.length > 3}
						<div class="border-t border-[#F0F8F3] pt-2 text-center">
							<button
								type="button"
								onclick={goAllOrders}
								title={m.pd_manage_orders_hint({ title: product.title })}
								class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-[#0C7B58] transition-colors hover:bg-[#F2FAF5] hover:text-[#096649]"
							>
								<span>
									{m.pd_manage_all({
										count: productOrders.length,
										unit:
											productType === 'session'
												? m.pd_unit_session()
												: productType === 'service'
													? m.pd_unit_service()
													: m.pd_unit_digital()
									})}
								</span>
								<ArrowRight class="h-3.5 w-3.5" />
							</button>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<div
			id="section-offer-specifications"
			class="space-y-3 rounded-2xl border border-[#D0EADB] bg-white p-5 shadow-2xs sm:p-6"
		>
			<div
				class="flex cursor-pointer items-center justify-between select-none"
				onclick={() => (isSpecOpen = !isSpecOpen)}
				role="button"
				tabindex={0}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						isSpecOpen = !isSpecOpen;
					}
				}}
			>
				<div class="space-y-0.5">
					<h3 class="text-base font-bold text-[#0E2E25]">{m.pd_spec_title()}</h3>
					<p class="text-xs text-[#52776C]">{m.pd_spec_subtitle()}</p>
				</div>
				<button
					type="button"
					class="rounded-lg p-1.5 text-[#52776C] transition-colors hover:bg-[#F2FAF5] hover:text-[#0E2E25]"
				>
					{#if isSpecOpen}
						<ChevronUp class="h-5 w-5" />
					{:else}
						<ChevronDown class="h-5 w-5" />
					{/if}
				</button>
			</div>

			{#if isSpecOpen}
				<div class="animate-fadeIn space-y-4 border-t border-[#F0F8F3] pt-2 text-xs">
					<div class="divide-y divide-[#F0F8F3]">
						<div class="flex items-center justify-between py-2.5">
							<span class="text-[#52776C]">{m.pd_spec_type()}</span>
							<ProductTypeMeta type={product.type} size="xs" />
						</div>

						{#if productType === 'session'}
							<div class="flex items-center justify-between py-2.5">
								<span class="text-[#52776C]">{m.pd_spec_duration()}</span>
								<span class="font-bold text-[#0E2E25]">
									{m.pd_minutes({ minutes: product.sessionDurationMinutes || 30 })}
								</span>
							</div>
							<div class="flex items-center justify-between py-2.5">
								<span class="text-[#52776C]">{m.pd_spec_platform()}</span>
								<span class="font-bold text-[#0E2E25]">{m.pd_platform_meet()}</span>
							</div>
						{/if}

						{#if productType === 'digital'}
							<div class="flex items-center justify-between py-2.5">
								<span class="text-[#52776C]">{m.pd_spec_access()}</span>
								<span class="max-w-[240px] truncate font-bold text-[#0E2E25]">
									{product.fileDownloadName || product.externalAccessUrl || m.pd_access_direct()}
								</span>
							</div>
							<div class="flex items-center justify-between py-2.5">
								<span class="text-[#52776C]">{m.pd_spec_delivery()}</span>
								<span class="font-bold text-[#0E2E25]">
									{product.digitalDeliveryType === 'external_link'
										? m.pd_delivery_link()
										: m.pd_delivery_file()}
								</span>
							</div>
						{/if}

						{#if productType === 'service'}
							<div class="flex items-center justify-between py-2.5">
								<span class="text-[#52776C]">{m.pd_spec_timeline()}</span>
								<span class="font-bold text-[#0E2E25]">
									{product.serviceTimelineDays
										? m.pd_workdays({ days: product.serviceTimelineDays })
										: '-'}
								</span>
							</div>
							<div class="flex items-center justify-between py-2.5">
								<span class="text-[#52776C]">{m.pd_spec_revisions()}</span>
								<span class="font-bold text-[#0E2E25]">
									{m.pd_revisions_x({ count: product.serviceRevisions || 1 })}
								</span>
							</div>
						{/if}

						<div class="flex items-center justify-between py-2.5">
							<span class="text-[#52776C]">{m.pd_spec_visibility()}</span>
							<span class="font-bold text-[#0E2E25]">
								{product.visibility === 'link_only'
									? m.pd_visibility_link_full()
									: m.pd_visibility_store()}
							</span>
						</div>

						<div class="flex items-center justify-between py-2.5">
							<span class="text-[#52776C]">{m.pd_spec_price()}</span>
							<div class="text-right">
								<span class="text-sm font-bold text-[#008A5E]">
									{priceState.formattedPrice}
								</span>
								{#if priceState.isPromoActive && priceState.formattedOriginalPrice}
									<span class="block text-[11px] text-gray-400 line-through">
										{priceState.formattedOriginalPrice}
									</span>
								{/if}
							</div>
						</div>
					</div>

					<div class="flex justify-end pt-1">
						<button
							type="button"
							onclick={goEdit}
							class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#CCE6D6] bg-white px-4 py-2 text-xs font-bold text-[#0C7B58] shadow-2xs transition-colors hover:bg-[#F2FAF5]"
						>
							<Edit3 class="h-3.5 w-3.5" />
							<span>{m.pd_edit_detail()}</span>
						</button>
					</div>
				</div>
			{/if}
		</div>

		{#if selectedDetailOrder}
			<OrderDetailModal
				order={selectedDetailOrder}
				onClose={() => (selectedDetailOrderId = null)}
			/>
		{/if}

		{#if contactModalOrder}
			<ContactBuyerModal
				order={contactModalOrder}
				{product}
				intent={contactIntent}
				onClose={() => (contactModalOrderId = null)}
				onContactActionCompleted={handleContactCompleted}
			/>
		{/if}

		{#if shareModalOpen}
			<div
				class="animate-fadeIn fixed inset-0 z-50 flex items-center justify-center bg-[#092B21]/50 p-4 backdrop-blur-xs"
			>
				<div
					class="animate-scaleUp relative max-h-[90vh] w-full max-w-lg space-y-5 overflow-y-auto rounded-2xl border border-[#E5ECE7] bg-white p-6 shadow-lg sm:p-7"
				>
					<button
						onclick={() => (shareModalOpen = false)}
						class="absolute top-5 right-5 cursor-pointer rounded-xl p-2 text-[#52776C] transition-colors hover:bg-[#F0F6F3] hover:text-[#0E2E25]"
						aria-label={m.common_close()}
					>
						<X class="h-5 w-5" />
					</button>

					<div class="space-y-1 pr-8">
						<h3 class="text-xl font-bold text-[#0E2E25]">{m.pd_share_product()}</h3>
						<p class="text-xs text-[#52776C]">
							{m.pd_share_modal_subtitle()}
						</p>
					</div>

					<div class="space-y-4 text-xs">
						<div
							class="flex items-center justify-between gap-2.5 rounded-xl border border-[#E5ECE7] bg-[#F8FBF9] p-3.5"
						>
							<div class="min-w-0 pr-2">
								<div class="text-[10px] font-semibold tracking-wider text-[#52776C] uppercase">
									{m.pd_product_link()}
								</div>
								<div class="mt-0.5 truncate font-mono text-xs font-semibold text-[#008A5E]">
									{publicProductUrl}
								</div>
							</div>
							<button
								type="button"
								onclick={() => copyText(publicProductUrl, 'link')}
								class="inline-flex flex-shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all {copiedLink
									? 'bg-[#008A5E] text-white'
									: 'border border-[#D5E5DB] bg-white text-[#0E2E25] hover:bg-[#EDF6F1]'}"
							>
								{#if copiedLink}
									<Check class="h-3.5 w-3.5" />
								{:else}
									<Copy class="h-3.5 w-3.5 text-[#52776C]" />
								{/if}
								<span>{copiedLink ? m.pd_copied() : m.pd_copy_link()}</span>
							</button>
						</div>

						<div class="space-y-2 rounded-2xl border border-[#D5EBDD] bg-[#FAFDFB] p-4">
							<div class="flex items-center justify-between">
								<span class="flex items-center gap-2 font-bold text-[#1F5545]">
									<span class="h-2.5 w-2.5 rounded-full bg-[#25D366]"></span>
									<span>{m.pd_channel_wa()}</span>
								</span>
								<button
									onclick={() => copyText(whatsappCopy, 'wa_modal')}
									class="cursor-pointer font-bold text-[#0C7B58] hover:underline"
								>
									{copiedTemplate === 'wa_modal' ? m.pd_copied_check() : m.pd_copy_text()}
								</button>
							</div>
							<p
								class="rounded-xl border border-[#E1F0E7] bg-white p-3 leading-relaxed whitespace-pre-line text-[#355B50]"
							>
								{whatsappCopy}
							</p>
						</div>

						<div class="space-y-2 rounded-2xl border border-[#D5EBDD] bg-[#FAFDFB] p-4">
							<div class="flex items-center justify-between">
								<span class="flex items-center gap-2 font-bold text-[#1F5545]">
									<span class="h-2.5 w-2.5 rounded-full bg-[#E1306C]"></span>
									<span>{m.pd_channel_ig()}</span>
								</span>
								<button
									onclick={() => copyText(instagramCopy, 'ig_modal')}
									class="cursor-pointer font-bold text-[#0C7B58] hover:underline"
								>
									{copiedTemplate === 'ig_modal' ? m.pd_copied_check() : m.pd_copy_text()}
								</button>
							</div>
							<p
								class="rounded-xl border border-[#E1F0E7] bg-white p-3 leading-relaxed text-[#355B50]"
							>
								{instagramCopy}
							</p>
						</div>

						<div class="space-y-2 rounded-2xl border border-[#D5EBDD] bg-[#FAFDFB] p-4">
							<div class="flex items-center justify-between">
								<span class="flex items-center gap-2 font-bold text-[#1F5545]">
									<span class="h-2.5 w-2.5 rounded-full bg-[#0A66C2]"></span>
									<span>{m.pd_channel_li()}</span>
								</span>
								<button
									onclick={() => copyText(linkedinCopy, 'li_modal')}
									class="cursor-pointer font-bold text-[#0C7B58] hover:underline"
								>
									{copiedTemplate === 'li_modal' ? m.pd_copied_check() : m.pd_copy_text()}
								</button>
							</div>
							<p
								class="rounded-xl border border-[#E1F0E7] bg-white p-3 leading-relaxed whitespace-pre-line text-[#355B50]"
							>
								{linkedinCopy}
							</p>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</PageContent>
</PageFrame>

{#snippet fulfillmentBadge(order: Order)}
	{@const booking = findBookingForOrder(order, seller.bookings)}
	{#if order.productType === 'session' && order.fulfillmentStatus === 'perlu_dijadwalkan'}
		<span
			class="inline-flex items-center gap-1 rounded-full border border-[#FDE68A] bg-[#FEF3C7] px-2.5 py-0.5 text-[11px] font-bold text-[#92400E]"
		>
			<Clock class="h-3 w-3 text-[#B45309]" />
			<span>{m.pd_badge_need_schedule()}</span>
		</span>
	{:else if order.productType === 'session' && order.fulfillmentStatus === 'sudah_dijadwalkan' && order.rescheduleNoticePending}
		<span
			class="inline-flex items-center gap-1 rounded-full border border-[#FDE68A] bg-[#FEF3C7] px-2.5 py-0.5 text-[11px] font-bold text-[#92400E]"
		>
			<Clock class="h-3 w-3 text-[#B45309]" />
			<span>{m.pd_badge_notify()}</span>
		</span>
	{:else if order.productType === 'session' && order.fulfillmentStatus === 'sudah_dijadwalkan' && hasSessionEnded(order, booking)}
		<span
			class="inline-flex items-center gap-1 rounded-full border border-[#FDE68A] bg-[#FEF3C7] px-2.5 py-0.5 text-[11px] font-bold text-[#92400E]"
		>
			<Clock class="h-3 w-3 text-[#B45309]" />
			<span>{m.pd_badge_finish_session()}</span>
		</span>
	{:else if order.productType === 'session' && order.fulfillmentStatus === 'sudah_dijadwalkan'}
		<span
			class="inline-flex items-center gap-1 rounded-full border border-[#BDE5D0] bg-[#EAF8F0] px-2.5 py-0.5 text-[11px] font-bold text-[#0C7B58]"
		>
			<CheckCircle2 class="h-3 w-3 text-[#008A5E]" />
			<span>{m.pd_badge_scheduled()}</span>
		</span>
	{:else if order.productType === 'session' && order.fulfillmentStatus === 'selesai'}
		<span
			class="inline-flex items-center gap-1 rounded-full border border-[#BDE5D0] bg-[#EAF8F0] px-2.5 py-0.5 text-[11px] font-bold text-[#0C7B58]"
		>
			<CheckCircle2 class="h-3 w-3 text-[#008A5E]" />
			<span>{m.pd_badge_done()}</span>
		</span>
	{:else if order.fulfillmentStatus === 'menunggu_brief'}
		{#if order.buyerNotes && order.buyerNotes.trim() !== ''}
			<span
				class="inline-flex items-center gap-1 rounded-full border border-[#BDE5D0] bg-[#EAF8F0] px-2.5 py-0.5 text-[11px] font-bold text-[#0C7B58]"
			>
				<CheckCircle2 class="h-3 w-3 text-[#008A5E]" />
				<span>{m.pd_badge_brief_in()}</span>
			</span>
		{:else}
			<span
				class="inline-flex items-center gap-1 rounded-full border border-[#FDE68A] bg-[#FEF3C7] px-2.5 py-0.5 text-[11px] font-bold text-[#92400E]"
			>
				<AlertCircle class="h-3 w-3 text-[#B45309]" />
				<span>{m.pd_badge_brief_wait()}</span>
			</span>
		{/if}
	{:else if order.fulfillmentStatus === 'sedang_dikerjakan'}
		<span
			class="inline-flex items-center gap-1 rounded-full border border-[#C3DDFD] bg-[#EBF5FF] px-2.5 py-0.5 text-[11px] font-bold text-[#1E429F]"
		>
			<Clock class="h-3 w-3 text-[#1A56DB]" />
			<span>{m.pd_badge_working()}</span>
		</span>
	{:else if order.fulfillmentStatus === 'hasil_dikirim'}
		<span
			class="inline-flex items-center gap-1 rounded-full border border-[#C7D2FE] bg-[#EEF2FF] px-2.5 py-0.5 text-[11px] font-bold text-[#4338CA]"
		>
			<CheckCircle2 class="h-3 w-3 text-[#4F46E5]" />
			<span>{m.pd_badge_result_sent()}</span>
		</span>
	{:else if order.fulfillmentStatus === 'akses_diberikan' || order.fulfillmentStatus === 'selesai'}
		<span
			class="inline-flex items-center gap-1 rounded-full border border-[#BDE5D0] bg-[#EAF8F0] px-2.5 py-0.5 text-[11px] font-bold text-[#0C7B58]"
		>
			<CheckCircle2 class="h-3 w-3 text-[#008A5E]" />
			<span>{m.pd_badge_done()}</span>
		</span>
	{:else if order.fulfillmentStatus === 'dibatalkan'}
		<span
			class="inline-flex items-center gap-1 rounded-full border border-[#FECACA] bg-[#FEE2E2] px-2.5 py-0.5 text-[11px] font-bold text-[#991B1B]"
		>
			<XCircle class="h-3 w-3 text-[#DC2626]" />
			<span>{m.pd_badge_cancelled()}</span>
		</span>
	{:else}
		<span
			class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-bold text-gray-700"
		>
			<span>{order.fulfillmentStatus || m.pd_badge_process()}</span>
		</span>
	{/if}
{/snippet}
