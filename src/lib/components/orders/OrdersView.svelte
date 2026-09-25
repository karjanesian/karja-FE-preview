<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { formatRupiah } from '$lib/data/mockData';
	import {
		findBookingForOrder,
		getOrderNextAction,
		getPaymentStatusDisplay,
		getSessionTimeGroup,
		isOrderActive,
		isOrderCompleted,
		needsSellerAction,
		sortActiveSessionOrders,
		type SessionTimeGroup
	} from '$lib/domain/orderLifecycle';
	import { getProductTypeTheme } from '$lib/domain/productTheme';
	import { getVisualAsset } from '$lib/domain/visualAssets';
	import { seller } from '$lib/stores/seller.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import * as Select from '$lib/components/ui/select';
	import { normalizeProductType, type Order, type ProductType } from '$lib/types';
	import PageFrame from '$lib/components/common/PageFrame.svelte';
	import PageContent from '$lib/components/common/PageContent.svelte';
	import PageHeader from '$lib/components/common/PageHeader.svelte';
	import ProductTypeMeta from '$lib/components/common/ProductTypeMeta.svelte';
	import PlatformStateVisual from '$lib/components/common/PlatformStateVisual.svelte';
	import Spinner from '$lib/components/common/Spinner.svelte';
	import ContactBuyerModal, {
		type ContactIntent
	} from '$lib/components/orders/ContactBuyerModal.svelte';
	import OrderDetailModal from '$lib/components/orders/OrderDetailModal.svelte';
	import Search from 'lucide-svelte/icons/search';
	import Clock from 'lucide-svelte/icons/clock';
	import CheckCircle2 from 'lucide-svelte/icons/check-circle-2';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import MessageSquare from 'lucide-svelte/icons/message-square';
	import Video from 'lucide-svelte/icons/video';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import X from 'lucide-svelte/icons/x';

	type TabKey = 'all' | 'action_required' | 'active' | 'completed';

	let activeFilter: TabKey = $state('all');
	let typeFilter: 'all' | ProductType = $state('all');
	let searchQuery = $state('');
	let contactOrder = $state<Order | null>(null);
	let contactIntent: ContactIntent = $state('feedback');
	/** Halaman paginasi client-side saat offline (BE tak terjangkau). */
	let offlinePage = $state(1);

	const PAGE_SIZE = 10;
	let searchTimer: ReturnType<typeof setTimeout> | undefined;

	onMount(() => reload(1));

	// Paginasi server: satu halaman pesanan per request. `state`/`type`/`q` difilter
	// BE; pengelompokan/sort sesi dan filter `productId` tetap dijalankan di klien
	// pada halaman yang dimuat.
	const serverPage = $derived(seller.ordersPage);
	const usingServer = $derived(serverPage?.server ?? false);
	const loading = $derived(!serverPage);
	const sourceOrders = $derived(
		serverPage ? (serverPage.server ? (serverPage.items ?? []) : seller.orders) : []
	);

	/** Muat satu halaman pesanan dari BE; `fallback` dipakai saat offline. */
	function reload(targetPage = 1) {
		if (targetPage === 1) offlinePage = 1;
		void seller.loadOrdersPage(
			{
				page: targetPage,
				limit: PAGE_SIZE,
				q: searchQuery.trim() || undefined,
				state: activeFilter === 'all' ? undefined : activeFilter,
				type: typeFilter === 'all' ? undefined : typeFilter
			},
			seller.orders
		);
	}

	function onSearchInput() {
		if (searchTimer) clearTimeout(searchTimer);
		searchTimer = setTimeout(() => reload(1), 300);
	}

	function goToPage(target: number) {
		// Offline: potong daftar lokal tanpa memanggil BE lagi.
		if (!usingServer) {
			offlinePage = Math.min(Math.max(1, target), pageCount);
			return;
		}
		reload(target);
	}

	function setActiveFilter(next: TabKey) {
		activeFilter = next;
		reload(1);
	}

	const filterProductId = $derived(page.url.searchParams.get('productId'));
	const openOrderId = $derived(page.params.id);

	const productScopedOrders = $derived(
		filterProductId
			? sourceOrders.filter((o) => o && o.productId === filterProductId)
			: sourceOrders
	);

	const ordersNeedingAction = $derived(
		productScopedOrders.filter(
			(o) => o && needsSellerAction(o, findBookingForOrder(o, seller.bookings))
		)
	);
	const activeOrders = $derived(productScopedOrders.filter((o) => o && isOrderActive(o)));
	const completedOrders = $derived(productScopedOrders.filter((o) => o && isOrderCompleted(o)));

	const typeFilterItems = $derived({
		all: m.orders_filter_type_all(),
		digital: m.orders_filter_type({ type: m.common_type_digital() }),
		session: m.orders_filter_type({ type: m.common_type_session() }),
		service: m.orders_filter_type({ type: m.common_type_service() })
	} as Record<string, string>);

	const tabs = $derived.by(() => {
		const local = {
			all: productScopedOrders.length,
			action_required: ordersNeedingAction.length,
			active: activeOrders.length,
			completed: completedOrders.length
		};
		const counts =
			usingServer && !filterProductId && seller.orderCounts
				? {
						all: seller.orderCounts.all,
						action_required: seller.orderCounts.actionRequired,
						active: seller.orderCounts.active,
						completed: seller.orderCounts.completed
					}
				: local;
		return [
			{ key: 'all' as const, label: m.orders_tab_all(), count: counts.all },
			{
				key: 'action_required' as const,
				label: m.orders_tab_action(),
				count: counts.action_required
			},
			{ key: 'active' as const, label: m.orders_tab_active(), count: counts.active },
			{ key: 'completed' as const, label: m.orders_tab_completed(), count: counts.completed }
		];
	});

	const filteredOrders = $derived.by(() => {
		const list = productScopedOrders.filter((order) => {
			if (!order) return false;
			// Mode server: BE sudah memfilter `state`/`type`/`q`; hanya fallback offline
			// yang disaring di klien.
			if (!usingServer) {
				if (activeFilter === 'action_required') {
					if (!needsSellerAction(order, findBookingForOrder(order, seller.bookings))) return false;
				} else if (activeFilter === 'active') {
					if (!isOrderActive(order)) return false;
				} else if (activeFilter === 'completed') {
					if (!isOrderCompleted(order)) return false;
				}

				const normalizedOrderType = normalizeProductType(order.productType);
				if (typeFilter !== 'all' && normalizedOrderType !== typeFilter) return false;

				if (searchQuery.trim()) {
					const q = searchQuery.toLowerCase();
					return (
						(order.buyerName || '').toLowerCase().includes(q) ||
						(order.productTitle || '').toLowerCase().includes(q) ||
						(order.orderNumber || '').toLowerCase().includes(q)
					);
				}
			}
			return true;
		});

		const isSessionType = typeFilter === 'session';
		const allSessions =
			list.length > 0 && list.every((o) => normalizeProductType(o.productType) === 'session');

		if (isSessionType && (activeFilter === 'active' || activeFilter === 'action_required')) {
			return sortActiveSessionOrders(list, seller.bookings);
		}
		if ((isSessionType || allSessions) && activeFilter === 'active') {
			return sortActiveSessionOrders(list, seller.bookings);
		}
		if (isSessionType && activeFilter === 'all') {
			return sortActiveSessionOrders(list, seller.bookings);
		}
		return list;
	});

	// Paginasi: server memakai `total` dari BE; offline memotong daftar lokal
	// client-side dengan footer yang sama.
	const pageTotal = $derived(usingServer ? (serverPage?.total ?? 0) : filteredOrders.length);
	const pageCount = $derived(Math.max(1, Math.ceil(pageTotal / PAGE_SIZE)));
	const currentPage = $derived(
		usingServer ? Math.min(serverPage?.page ?? 1, pageCount) : Math.min(offlinePage, pageCount)
	);
	const showPagination = $derived(pageCount > 1);
	const rangeFrom = $derived(pageTotal === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1);
	const rangeTo = $derived(Math.min(currentPage * PAGE_SIZE, pageTotal));

	/** Baris yang ditampilkan: halaman BE saat online, potongan lokal saat offline. */
	const displayOrders = $derived.by(() => {
		if (usingServer) return filteredOrders;
		const start = (currentPage - 1) * PAGE_SIZE;
		return filteredOrders.slice(start, start + PAGE_SIZE);
	});

	const filteredProduct = $derived(filterProductId ? seller.findProduct(filterProductId) : null);

	function resetProductFilter() {
		void goto('/dashboard/orders');
	}

	const shouldApplySessionGrouping = $derived(
		displayOrders.length > 0 &&
			((typeFilter as string) === 'session' ||
				(displayOrders.every((o) => normalizeProductType(o.productType) === 'session') &&
					(activeFilter as string) !== 'completed'))
	);

	const groupLabels: Record<SessionTimeGroup, () => string> = {
		'HARI INI': m.session_group_today,
		BESOK: m.session_group_tomorrow,
		'MINGGU INI': m.session_group_this_week,
		NANTI: m.session_group_later,
		'BELUM DIJADWALKAN': m.session_group_unscheduled,
		SEBELUMNYA: m.session_group_past
	};

	const sessionGroupedOrders = $derived.by(() => {
		if (!shouldApplySessionGrouping) return null;
		const groupOrder: SessionTimeGroup[] = [
			'HARI INI',
			'BESOK',
			'MINGGU INI',
			'NANTI',
			'BELUM DIJADWALKAN',
			'SEBELUMNYA'
		];
		const groups = new Map<SessionTimeGroup, Order[]>();
		displayOrders.forEach((order) => {
			const key = getSessionTimeGroup(order, findBookingForOrder(order, seller.bookings));
			if (!groups.has(key)) groups.set(key, []);
			groups.get(key)!.push(order);
		});
		return groupOrder
			.filter((key) => (groups.get(key)?.length ?? 0) > 0)
			.map((key) => ({ label: key, orders: groups.get(key)! }));
	});

	function openOrder(order: Order) {
		void goto(`/dashboard/orders/${order.id}`);
	}

	function closeOrder() {
		void goto('/dashboard/orders');
	}

	const openModalOrder = $derived(openOrderId ? seller.findOrder(openOrderId) : null);

	function fulfillmentText(order: Order): string {
		const canonical = normalizeProductType(order.productType);
		if (canonical === 'session') {
			if (order.fulfillmentStatus === 'perlu_dijadwalkan') return m.ful_session_need_schedule();
			if (order.rescheduleNoticePending) return m.ful_reschedule_changed();
			if (order.fulfillmentStatus === 'sudah_dijadwalkan')
				return order.bookingDateFormatted
					? `${order.bookingDateFormatted} · ${order.bookingTimeFormatted || ''}`
					: m.ful_session_scheduled();
			if (order.fulfillmentStatus === 'selesai') return m.ful_session_done();
			if (order.fulfillmentStatus === 'dibatalkan') return m.ful_session_cancelled();
		}
		if (canonical === 'service') {
			if (order.fulfillmentStatus === 'menunggu_brief') {
				return order.buyerNotes && order.buyerNotes.trim().length > 0
					? m.ful_brief_in()
					: m.ful_waiting_brief();
			}
			if (order.fulfillmentStatus === 'sedang_dikerjakan') return m.ful_in_progress();
			if (order.fulfillmentStatus === 'hasil_dikirim') return m.ful_result_sent();
			if (order.fulfillmentStatus === 'selesai') return m.ful_service_done();
			if (order.fulfillmentStatus === 'dibatalkan') return m.ful_cancelled();
		}
		if (canonical === 'digital') {
			if (order.fulfillmentStatus === 'selesai' || order.fulfillmentStatus === 'akses_diberikan')
				return m.ful_access_given();
			if (order.fulfillmentStatus === 'dibatalkan') return m.ful_cancelled();
			return m.ful_access_auto();
		}
		return m.ful_order();
	}

	function urgentNote(order: Order, actionType: string, hasNotes: boolean): string {
		switch (actionType) {
			case 'schedule':
				return m.orders_urgent_schedule();
			case 'notify_reschedule':
				return m.orders_urgent_reschedule();
			case 'start_working':
				return hasNotes ? m.orders_urgent_start_with_brief() : m.orders_urgent_start_no_brief();
			case 'deliver':
				return m.orders_urgent_deliver();
			case 'complete':
				return m.orders_urgent_complete();
			default:
				return getOrderNextAction(order, findBookingForOrder(order, seller.bookings)).title;
		}
	}

	const emptyState = $derived.by(() => {
		if (filterProductId) {
			return {
				title: m.empty_product_title({
					title: filteredProduct?.title || m.orders_scope_fallback()
				}),
				desc: m.empty_product_desc()
			};
		}
		if (seller.orders.length === 0)
			return { title: m.empty_orders_title(), desc: m.empty_orders_desc() };
		if (activeFilter === 'action_required')
			return { title: m.empty_action_title(), desc: m.empty_action_desc() };
		if (activeFilter === 'active')
			return { title: m.empty_active_title(), desc: m.empty_active_desc() };
		if (activeFilter === 'completed')
			return { title: m.empty_completed_title(), desc: m.empty_completed_desc() };
		return { title: m.empty_search_title(), desc: m.empty_search_desc() };
	});

	function themeLabelKeyFor(type: unknown) {
		return getProductTypeTheme(type).labelKey;
	}
</script>

<PageFrame>
	<PageContent variant="standard">
		<PageHeader title={m.orders_title()} description={m.orders_subtitle()} />

		{#if filterProductId}
			<div
				class="flex flex-col items-center justify-between gap-3 rounded-2xl border border-[#BEE7D4] bg-[#EBF7F2] p-3.5 text-xs sm:flex-row sm:p-4"
			>
				<div class="flex min-w-0 items-center gap-3">
					<span class="shrink-0 text-2xl sm:text-3xl">
						{filteredProduct?.coverEmoji ||
							(typeFilter === 'session' ? '📅' : typeFilter === 'service' ? '💼' : '📄')}
					</span>
					<div class="min-w-0">
						<div class="flex flex-wrap items-center gap-2">
							<span class="truncate text-sm font-bold text-[#0E2E25]">
								{filteredProduct?.title || m.orders_scope_fallback()}
							</span>
							{#if typeFilter !== 'all'}
								<span
									class="flex-shrink-0 rounded-full border border-[#BEE7D4] bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#0C7B58]"
								>
									{m[themeLabelKeyFor(typeFilter)]()}
								</span>
							{/if}
						</div>
						<p class="mt-0.5 text-[11px] text-[#3D685A] sm:text-xs">
							{m.orders_scope_desc({
								shown: filteredOrders.length,
								total: productScopedOrders.length
							})}
						</p>
					</div>
				</div>

				<button
					type="button"
					onclick={resetProductFilter}
					title={m.orders_show_all_products_cta()}
					class="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 self-start rounded-xl border border-[#CCE6D6] bg-white px-3.5 py-2 text-xs font-bold text-[#0C7B58] shadow-2xs transition-colors hover:bg-[#F2FAF6] sm:self-auto"
				>
					<X class="h-3.5 w-3.5" />
					<span>{m.orders_show_all_products()}</span>
				</button>
			</div>
		{/if}

		<!-- Workflow tabs -->
		<div class="border-b border-[#E5ECE7]">
			<div class="flex items-center gap-6 overflow-x-auto sm:gap-8">
				{#each tabs as tab (tab.key)}
					<button
						type="button"
						onclick={() => setActiveFilter(tab.key)}
						class="relative flex cursor-pointer items-center gap-2 pb-3 text-sm font-semibold whitespace-nowrap transition-colors {activeFilter ===
						tab.key
							? 'font-bold text-[#0E2E25]'
							: 'text-[#567E71] hover:text-[#0E2E25]'}"
					>
						<span>{tab.label}</span>
						<span
							class="rounded-full px-2 py-0.5 text-xs transition-colors {activeFilter === tab.key
								? tab.key === 'action_required' && tab.count > 0
									? 'bg-[#FEF3C7] font-bold text-[#92400E]'
									: 'bg-[#EAF8F0] font-bold text-[#0C7B58]'
								: tab.key === 'action_required' && tab.count > 0
									? 'bg-[#FEF3C7] font-medium text-[#92400E]'
									: 'bg-gray-100 font-medium text-[#567E71]'}"
						>
							{tab.count}
						</span>
						{#if activeFilter === tab.key}
							<span class="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-[#0C7B58]"></span>
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<!-- Type filter & search -->
		<div class="flex flex-col justify-between gap-3 pt-1 sm:flex-row sm:items-center">
			<div class="flex items-center gap-2">
				<Select.Root
					items={typeFilterItems}
					value={typeFilter}
					onValueChange={(v) => {
						if (!v) return;
						typeFilter = v as 'all' | ProductType;
						if (filterProductId && typeFilter !== 'all' && filteredProduct) {
							if (normalizeProductType(filteredProduct.type) !== typeFilter) resetProductFilter();
						}
						reload(1);
					}}
				>
					<Select.Trigger size="sm" class="h-9 border-[#CCE6D6] text-xs font-semibold">
						<Select.Value placeholder={m.orders_filter_type_all()} />
					</Select.Trigger>
					<Select.Content>
						{#each Object.entries(typeFilterItems) as [val, label] (val)}
							<Select.Item value={val} {label}>{label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>

				{#if typeFilter !== 'all' || searchQuery.trim() || filterProductId}
					<button
						type="button"
						onclick={() => {
							typeFilter = 'all';
							searchQuery = '';
							if (filterProductId) resetProductFilter();
							reload(1);
						}}
						class="cursor-pointer px-2 py-1 text-xs font-medium text-[#567E71] hover:text-[#0E2E25] hover:underline"
					>
						{m.orders_reset_filter()}
					</button>
				{/if}
			</div>

			<div class="relative w-full sm:w-72">
				<Search class="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[#567E71]" />
				<input
					type="text"
					bind:value={searchQuery}
					oninput={onSearchInput}
					placeholder={m.orders_search_placeholder()}
					class="w-full rounded-xl border border-[#CCE6D6] bg-white py-2 pr-8 pl-8 text-xs text-[#0E2E25] transition-colors placeholder:text-[#8AA59C] focus:border-[#0C7B58] focus:outline-none"
				/>
				{#if searchQuery}
					<button
						type="button"
						onclick={() => (searchQuery = '')}
						class="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
					>
						<X class="h-3.5 w-3.5" />
					</button>
				{/if}
			</div>
		</div>

		<!-- Work queue -->
		{#if loading}
			<div class="flex items-center justify-center py-16">
				<Spinner class="h-6 w-6 text-[#0C7B58]" label={m.common_loading()} />
			</div>
		{:else if filteredOrders.length === 0}
			<div
				class="mx-auto max-w-lg space-y-5 rounded-2xl border border-[#E5ECE7] bg-white p-8 text-center shadow-2xs sm:p-12"
			>
				<div class="mx-auto w-48 sm:w-56">
					<PlatformStateVisual asset={getVisualAsset('empty.orders')} />
				</div>
				<div class="space-y-1.5">
					<h3 class="text-base font-bold text-[#0E2E25]">{emptyState.title}</h3>
					<p class="mx-auto max-w-md text-xs leading-relaxed text-sage">{emptyState.desc}</p>
				</div>
				{#if filterProductId}
					<div class="pt-2">
						<button
							type="button"
							onclick={resetProductFilter}
							class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#007550]"
						>
							{m.orders_show_all_products_cta()}
						</button>
					</div>
				{/if}
			</div>
		{:else if shouldApplySessionGrouping && sessionGroupedOrders}
			<div class="space-y-6">
				{#each sessionGroupedOrders as group (group.label)}
					<div class="space-y-2.5">
						<div class="flex items-center gap-3 pt-2 pb-1">
							<span class="text-[11px] font-bold tracking-wider text-[#567E71] uppercase">
								{groupLabels[group.label]()}
							</span>
							<div class="h-[1px] flex-1 bg-[#E5ECE7]"></div>
							<span class="text-[11px] font-medium text-[#7B9B90]">
								{m.orders_count_suffix({ count: group.orders.length })}
							</span>
						</div>
						<div class="space-y-2.5">
							{#each group.orders as order (order.id)}
								{@const booking = findBookingForOrder(order, seller.bookings)}
								{@const nextAction = getOrderNextAction(order, booking)}
								<div
									role="button"
									tabindex="0"
									onclick={() => openOrder(order)}
									onkeydown={(e) => e.key === 'Enter' && openOrder(order)}
									class="group w-full cursor-pointer rounded-2xl border bg-white p-4 text-left shadow-2xs transition-all hover:shadow-xs sm:p-5 {nextAction.isUrgent
										? 'border-[#F2DC9B] bg-[#FFFEFB] hover:border-[#E8C86E]'
										: 'border-[#E2EBE6] hover:border-[#96D6B4]'}"
								>
									<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
										<div class="min-w-0 flex-1 space-y-1.5">
											<div class="flex flex-wrap items-baseline gap-2">
												<h3
													class="text-base font-bold tracking-tight text-[#0E2E25] transition-colors group-hover:text-[#0C7B58]"
												>
													{order.productTitle}
												</h3>
												<span class="text-sm font-semibold text-[#185343]">{order.buyerName}</span>
											</div>
											<div class="flex flex-wrap items-center gap-1.5 text-xs text-sage">
												<ProductTypeMeta
													type={order.productType}
													subtype={normalizeProductType(order.productType) === 'session' &&
													(booking?.durationMinutes || order.bookingDurationMinutes || '60')
														? `${booking?.durationMinutes || order.bookingDurationMinutes || '60'}m`
														: undefined}
												/>
												<span class="text-[#B0CCC1]">·</span>
												<span class="font-medium text-[#20493C]">{fulfillmentText(order)}</span>
												<span class="text-[#B0CCC1]">·</span>
												<span class="font-medium text-[#20493C]">
													{order.isFreeClaim || order.amount === 0
														? m.pay_free()
														: formatRupiah(order.amount)}
													·
													<span
														class={order.paymentStatus === 'lunas'
															? 'font-semibold text-[#0C7B58]'
															: 'font-bold text-amber-800'}
													>
														{order.isFreeClaim
															? m.pay_free_claim()
															: order.paymentStatus === 'lunas'
																? m.pay_paid()
																: getPaymentStatusDisplay(order).label}
													</span>
												</span>
												<span class="text-[#B0CCC1]">·</span>
												<span class="font-mono text-[11px] text-[#7B9B90]"
													>#{order.orderNumber}</span
												>
											</div>
											{#if nextAction.isUrgent}
												<div class="pt-1">
													<div
														class="inline-flex items-center gap-1.5 rounded-lg border border-[#FDE68A] bg-[#FEF7E6] px-2.5 py-1 text-xs font-medium text-[#92400E]"
													>
														<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-[#D97706]"></span>
														<span
															>{urgentNote(
																order,
																nextAction.actionType,
																Boolean(order.buyerNotes && order.buyerNotes.trim().length > 0)
															)}</span
														>
													</div>
												</div>
											{/if}
										</div>

										<div
											class="flex shrink-0 items-center gap-2.5 border-t border-[#F0F6F2] pt-2 sm:border-t-0 sm:pt-0"
										>
											{#if nextAction.actionType === 'join_meeting'}
												<a
													href={order.meetingLink || booking?.meetingUrl || '#'}
													target="_blank"
													rel="noopener noreferrer"
													onclick={(e) => e.stopPropagation()}
													title="Google Meet"
													class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0C7B58] px-3.5 py-2 text-xs font-bold whitespace-nowrap text-white shadow-xs transition-all hover:bg-[#096649]"
												>
													<Video class="h-3.5 w-3.5" />
													<span>{m.orders_cta_meet()}</span>
													<ExternalLink class="h-3 w-3" />
												</a>
											{:else if nextAction.actionType === 'share_link'}
												<button
													type="button"
													onclick={(e) => {
														e.stopPropagation();
														contactOrder = order;
														contactIntent = 'meeting_link';
													}}
													class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0C7B58] px-3.5 py-2 text-xs font-bold whitespace-nowrap text-white shadow-xs transition-all hover:bg-[#096649]"
												>
													<MessageSquare class="h-3.5 w-3.5" />
													<span>{m.orders_cta_send_link()}</span>
												</button>
											{:else if nextAction.actionType === 'notify_reschedule'}
												<button
													type="button"
													onclick={(e) => {
														e.stopPropagation();
														contactOrder = order;
														contactIntent = 'reschedule_notice';
													}}
													class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0C7B58] px-3.5 py-2 text-xs font-bold whitespace-nowrap text-white shadow-xs transition-all hover:bg-[#096649]"
												>
													<MessageSquare class="h-3.5 w-3.5" />
													<span>{m.orders_cta_notify()}</span>
												</button>
											{:else if nextAction.actionType === 'schedule' || nextAction.actionType === 'start_working' || nextAction.actionType === 'deliver' || (nextAction.actionType === 'complete' && nextAction.isUrgent)}
												<button
													type="button"
													onclick={(e) => {
														e.stopPropagation();
														openOrder(order);
													}}
													class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0C7B58] px-3.5 py-2 text-xs font-bold whitespace-nowrap text-white shadow-xs transition-all hover:bg-[#096649]"
												>
													{#if nextAction.actionType === 'schedule'}
														<Clock class="h-3.5 w-3.5" />
														<span>{m.orders_cta_schedule()}</span>
													{:else if nextAction.actionType === 'start_working'}
														<span>{m.orders_cta_start()}</span>
													{:else if nextAction.actionType === 'deliver'}
														<span>{m.orders_cta_deliver()}</span>
													{:else}
														<CheckCircle2 class="h-3.5 w-3.5" />
														<span>{m.orders_cta_complete()}</span>
													{/if}
												</button>
											{/if}

											<span
												class="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-[#0C7B58] transition-all group-hover:bg-[#EBF7F1] group-hover:text-[#08553D]"
											>
												<span>{m.orders_detail()}</span>
												<ArrowRight class="h-3.5 w-3.5" />
											</span>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="space-y-2.5">
				{#each displayOrders as order (order.id)}
					{@const booking = findBookingForOrder(order, seller.bookings)}
					{@const nextAction = getOrderNextAction(order, booking)}
					<div
						role="button"
						tabindex="0"
						onclick={() => openOrder(order)}
						onkeydown={(e) => e.key === 'Enter' && openOrder(order)}
						class="group w-full cursor-pointer rounded-2xl border bg-white p-4 text-left shadow-2xs transition-all hover:shadow-xs sm:p-5 {nextAction.isUrgent
							? 'border-[#F2DC9B] bg-[#FFFEFB] hover:border-[#E8C86E]'
							: 'border-[#E2EBE6] hover:border-[#96D6B4]'}"
					>
						<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
							<div class="min-w-0 flex-1 space-y-1.5">
								<div class="flex flex-wrap items-baseline gap-2">
									<h3
										class="text-base font-bold tracking-tight text-[#0E2E25] transition-colors group-hover:text-[#0C7B58]"
									>
										{order.productTitle}
									</h3>
									<span class="text-sm font-semibold text-[#185343]">{order.buyerName}</span>
								</div>
								<div class="flex flex-wrap items-center gap-1.5 text-xs text-sage">
									<ProductTypeMeta
										type={order.productType}
										subtype={normalizeProductType(order.productType) === 'session'
											? `${booking?.durationMinutes || order.bookingDurationMinutes || '60'}m`
											: undefined}
									/>
									<span class="text-[#B0CCC1]">·</span>
									<span class="font-medium text-[#20493C]">{fulfillmentText(order)}</span>
									<span class="text-[#B0CCC1]">·</span>
									<span class="font-medium text-[#20493C]">
										{order.isFreeClaim || order.amount === 0
											? m.pay_free()
											: formatRupiah(order.amount)}
										·
										<span
											class={order.paymentStatus === 'lunas'
												? 'font-semibold text-[#0C7B58]'
												: 'font-bold text-amber-800'}
										>
											{order.isFreeClaim
												? m.pay_free_claim()
												: order.paymentStatus === 'lunas'
													? m.pay_paid()
													: getPaymentStatusDisplay(order).label}
										</span>
									</span>
									<span class="text-[#B0CCC1]">·</span>
									<span class="font-mono text-[11px] text-[#7B9B90]">#{order.orderNumber}</span>
								</div>
								{#if nextAction.isUrgent}
									<div class="pt-1">
										<div
											class="inline-flex items-center gap-1.5 rounded-lg border border-[#FDE68A] bg-[#FEF7E6] px-2.5 py-1 text-xs font-medium text-[#92400E]"
										>
											<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-[#D97706]"></span>
											<span
												>{urgentNote(
													order,
													nextAction.actionType,
													Boolean(order.buyerNotes && order.buyerNotes.trim().length > 0)
												)}</span
											>
										</div>
									</div>
								{/if}
							</div>

							<div
								class="flex shrink-0 items-center gap-2.5 border-t border-[#F0F6F2] pt-2 sm:border-t-0 sm:pt-0"
							>
								{#if nextAction.actionType === 'join_meeting'}
									<a
										href={order.meetingLink || booking?.meetingUrl || '#'}
										target="_blank"
										rel="noopener noreferrer"
										onclick={(e) => e.stopPropagation()}
										title="Google Meet"
										class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0C7B58] px-3.5 py-2 text-xs font-bold whitespace-nowrap text-white shadow-xs transition-all hover:bg-[#096649]"
									>
										<Video class="h-3.5 w-3.5" />
										<span>{m.orders_cta_meet()}</span>
										<ExternalLink class="h-3 w-3" />
									</a>
								{:else if nextAction.actionType === 'share_link'}
									<button
										type="button"
										onclick={(e) => {
											e.stopPropagation();
											contactOrder = order;
											contactIntent = 'meeting_link';
										}}
										class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0C7B58] px-3.5 py-2 text-xs font-bold whitespace-nowrap text-white shadow-xs transition-all hover:bg-[#096649]"
									>
										<MessageSquare class="h-3.5 w-3.5" />
										<span>{m.orders_cta_send_link()}</span>
									</button>
								{:else if nextAction.actionType === 'notify_reschedule'}
									<button
										type="button"
										onclick={(e) => {
											e.stopPropagation();
											contactOrder = order;
											contactIntent = 'reschedule_notice';
										}}
										class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0C7B58] px-3.5 py-2 text-xs font-bold whitespace-nowrap text-white shadow-xs transition-all hover:bg-[#096649]"
									>
										<MessageSquare class="h-3.5 w-3.5" />
										<span>{m.orders_cta_notify()}</span>
									</button>
								{:else if nextAction.actionType === 'schedule' || nextAction.actionType === 'start_working' || nextAction.actionType === 'deliver' || (nextAction.actionType === 'complete' && nextAction.isUrgent)}
									<button
										type="button"
										onclick={(e) => {
											e.stopPropagation();
											openOrder(order);
										}}
										class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0C7B58] px-3.5 py-2 text-xs font-bold whitespace-nowrap text-white shadow-xs transition-all hover:bg-[#096649]"
									>
										{#if nextAction.actionType === 'schedule'}
											<Clock class="h-3.5 w-3.5" />
											<span>{m.orders_cta_schedule()}</span>
										{:else if nextAction.actionType === 'start_working'}
											<span>{m.orders_cta_start()}</span>
										{:else if nextAction.actionType === 'deliver'}
											<span>{m.orders_cta_deliver()}</span>
										{:else}
											<CheckCircle2 class="h-3.5 w-3.5" />
											<span>{m.orders_cta_complete()}</span>
										{/if}
									</button>
								{/if}

								<span
									class="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-[#0C7B58] transition-all group-hover:bg-[#EBF7F1] group-hover:text-[#08553D]"
								>
									<span>{m.orders_detail()}</span>
									<ArrowRight class="h-3.5 w-3.5" />
								</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		{#if showPagination}
			<div
				class="flex flex-col items-center justify-between gap-3 border-t border-[#E5ECE7] pt-4 sm:flex-row"
			>
				<p class="text-[11px] text-[#567E71] sm:text-xs">
					{m.dt_showing({ from: rangeFrom, to: rangeTo, total: pageTotal })}
				</p>
				<nav class="flex items-center gap-1" aria-label={m.dt_pagination_label()}>
					<button
						type="button"
						onclick={() => goToPage(currentPage - 1)}
						disabled={currentPage <= 1}
						aria-label={m.dt_prev_page()}
						class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#CCE6D6] text-[#567E71] transition-colors hover:bg-[#F2FAF5] hover:text-[#0C7B58] disabled:cursor-not-allowed disabled:opacity-40"
					>
						<ChevronLeft class="h-4 w-4" />
					</button>
					<span class="px-2 text-xs font-semibold text-[#0E2E25]">
						{m.dt_page_of({ page: currentPage })}
					</span>
					<button
						type="button"
						onclick={() => goToPage(currentPage + 1)}
						disabled={currentPage >= pageCount}
						aria-label={m.dt_next_page()}
						class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#CCE6D6] text-[#567E71] transition-colors hover:bg-[#F2FAF5] hover:text-[#0C7B58] disabled:cursor-not-allowed disabled:opacity-40"
					>
						<ChevronRight class="h-4 w-4" />
					</button>
				</nav>
			</div>
		{/if}
	</PageContent>
</PageFrame>

{#if contactOrder}
	<ContactBuyerModal
		order={contactOrder}
		product={seller.findProduct(contactOrder.productId) ?? undefined}
		intent={contactIntent}
		onClose={() => (contactOrder = null)}
		onContactActionCompleted={(intentDone, orderId) => {
			const ord = seller.findOrder(orderId);
			if (!ord) return;
			if (intentDone === 'meeting_link') {
				seller.updateFulfillment(orderId, ord.fulfillmentStatus, {
					meetingLinkSharedAt: new Date().toISOString()
				});
			} else if (intentDone === 'reschedule_notice') {
				seller.updateFulfillment(orderId, ord.fulfillmentStatus, {
					rescheduleNoticePending: false,
					rescheduleNotifiedAt: new Date().toISOString()
				});
			} else if (intentDone === 'feedback') {
				seller.updateFulfillment(orderId, ord.fulfillmentStatus, {
					feedbackRequestedAt: new Date().toISOString()
				});
			}
		}}
	/>
{/if}

{#if openModalOrder}
	<OrderDetailModal order={openModalOrder} onClose={closeOrder} />
{/if}
