<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { admin } from '$lib/stores/admin.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { formatRupiah } from '$lib/data/mockData';
	import { hasPermission } from '$lib/domain/adminDomain';
	import { calculatePlatformFinancials } from '$lib/domain/adminDomain';
	import { isPaidSale, isOrderActive } from '$lib/domain/orderLifecycle';
	import { deriveBuyersFromOrders, computeBuyerAnalytics } from '$lib/domain/buyerDomain';
	import { formatBytes, getStorageOverviewMetrics } from '$lib/domain/fileStorage';
	import {
		computeSellerJourneyFunnel,
		computeSellerLifecycleDistribution,
		computeBuyerConversionFunnel,
		calculateGmvRevenueTimeSeries,
		computePaidProductMix,
		computeSellerMacroJourneyFunnel,
		computeSellerOverview5States,
		formatCompactNumber
	} from '$lib/domain/journeyAnalytics';
	import type { Review } from '$lib/types';
	import type { ChartConfiguration } from 'chart.js';
	import ChartCanvas from '$lib/components/charts/ChartCanvas.svelte';
	import Users from 'lucide-svelte/icons/users';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import ShoppingBag from 'lucide-svelte/icons/shopping-bag';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import HardDrive from 'lucide-svelte/icons/hard-drive';
	import Activity from 'lucide-svelte/icons/activity';
	import Repeat from 'lucide-svelte/icons/repeat';
	import Info from 'lucide-svelte/icons/info';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import CircleAlert from 'lucide-svelte/icons/circle-alert';
	import ShieldCheck from 'lucide-svelte/icons/shield-check';
	import X from 'lucide-svelte/icons/x';

	type TimeRangeFilter = '7d' | '30d' | '90d';
	type FunnelStage = {
		id: string;
		name: string;
		count: number;
		countLabel: string;
		subLabel?: string;
		percentage?: number;
		stepConversion?: number;
		dropOffRate?: number;
		conversionLabel?: string;
	};

	let timeRange = $state<TimeRangeFilter>('30d');
	let showDetailedSellerStatesModal = $state(false);
	let showFullSellerJourneyModal = $state(false);
	let sellerHover = $state(-1);
	let buyerHover = $state(-1);

	onMount(() => {
		void admin.syncAdminOverview();
		void admin.syncAdminSellers();
		void admin.syncAdminProducts();
		void admin.syncAdminOrders();
		void admin.syncAdminTransactions();
		void admin.syncAdminPayouts();
		void admin.syncAdminCases();
	});

	const overview = $derived(admin.platformOverview);

	const canViewFinancials = $derived(
		admin.adminUser ? hasPermission(admin.adminUser, 'finance.read') : true
	);

	const sellers = $derived(admin.platformSellers);
	const orders = $derived(admin.platformOrders);
	const products = $derived(admin.platformProducts);
	const files = $derived(admin.platformFiles);
	const events = $derived(admin.platformJourneyEvents);
	const disputes = $derived(admin.platformDisputes);

	const reviews = $derived<Review[]>(
		admin.platformOrders.map((o) => o.buyerReview).filter((r): r is Review => Boolean(r))
	);
	const financials = $derived(calculatePlatformFinancials(admin.platformLedger));
	const storageMetrics = $derived(getStorageOverviewMetrics(files));
	const buyerStats = $derived(
		computeBuyerAnalytics(deriveBuyersFromOrders(orders, reviews, disputes))
	);

	const fullSellerFunnel = $derived(computeSellerJourneyFunnel(sellers, products, orders, events));
	const macroSellerFunnel = $derived(
		computeSellerMacroJourneyFunnel(sellers, products, orders, events)
	);
	const seller5States = $derived(computeSellerOverview5States(sellers, products, orders));
	const sellerLifecycleDist = $derived(
		computeSellerLifecycleDistribution(sellers, products, orders)
	);
	const buyerFunnel = $derived(computeBuyerConversionFunnel(events, orders));

	const timeSeriesData = $derived(
		calculateGmvRevenueTimeSeries(
			orders,
			[],
			timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30
		)
	);
	const productMix = $derived(computePaidProductMix(orders));
	const paidOrderCount = $derived(orders.filter((o) => isPaidSale(o)).length);

	const sellerFunnelStages = $derived<FunnelStage[]>(
		macroSellerFunnel.stages.map((s, idx) => {
			let conversionLabel: string | undefined;
			if (idx >= 1 && idx <= 3)
				conversionLabel = m.adx_ov_conv_lanjut({ percent: s.stepConversion });
			else if (idx === 4) conversionLabel = m.adx_ov_conv_repeat({ percent: s.stepConversion });
			return {
				id: s.id,
				name: s.name,
				count: s.count,
				countLabel: m.adx_ov_count_seller({ count: s.count }),
				subLabel: s.subLabel,
				percentage: s.percentage,
				stepConversion: s.stepConversion,
				dropOffRate: s.dropOffRate,
				conversionLabel
			};
		})
	);

	const buyerShortLabels = $derived([
		m.adx_ov_bf_viewed(),
		m.adx_ov_bf_buy(),
		m.adx_ov_bf_checkout(),
		m.adx_ov_bf_paid(),
		m.adx_ov_bf_done()
	]);
	const buyerFunnelStages = $derived.by<FunnelStage[]>(() => {
		const rawStages = buyerFunnel.stages.slice(0, 5);
		return rawStages.map((st, idx) => {
			let conversionLabel: string | undefined;
			if (idx === 1) conversionLabel = m.adx_ov_conv_klik_beli({ percent: st.stepConversion });
			else if (idx === 2)
				conversionLabel = m.adx_ov_conv_lanjut_checkout({ percent: st.stepConversion });
			else if (idx === 3) conversionLabel = m.adx_ov_conv_bayar({ percent: st.stepConversion });
			else if (idx === 4) conversionLabel = m.adx_ov_conv_selesai({ percent: st.stepConversion });
			return {
				id: st.id,
				name: buyerShortLabels[idx] || st.label,
				count: st.count,
				countLabel: formatCompactNumber(st.count),
				subLabel: st.label,
				percentage: Math.round((st.count / (rawStages[0]?.count || 1)) * 100),
				stepConversion: st.stepConversion,
				conversionLabel
			};
		});
	});

	const activeAttentionOrders = $derived(
		orders.filter((o) => isPaidSale(o) && isOrderActive(o)).length
	);
	const pendingPayoutCount = $derived(
		overview?.payoutsPending ??
			admin.platformPayouts.filter(
				(p) => p.status === 'requested' || p.status === 'held' || p.status === 'processing'
			).length
	);
	const pendingKycCount = $derived(
		overview?.kycPending ?? sellers.filter((s) => s.verification?.status === 'pending').length
	);
	const activeDisputeCount = $derived(
		overview?.casesOpen ??
			disputes.filter(
				(d) =>
					d.status === 'open' ||
					d.status === 'admin_review' ||
					d.status === 'waiting_seller' ||
					d.status === 'waiting_buyer'
			).length
	);
	const gmvValue = $derived(overview ? overview.gmv : financials.gmv);

	// ---- Inline SVG chart geometry (recharts deviation) ----
	const FUNNEL_W = 540;
	const FUNNEL_H = 450;
	const PAD_X = 16;
	const PAD_Y = 8;
	function funnelGeom(stages: FunnelStage[]) {
		const usableH = FUNNEL_H - PAD_Y * 2;
		const xCenter = FUNNEL_W / 2;
		const wTop = FUNNEL_W - PAD_X * 2;
		const wBottom = 260;
		const band = usableH / (stages.length || 1);
		const halfWidth = (y: number) => {
			const t = Math.max(0, Math.min(1, (y - PAD_Y) / usableH));
			return (wTop / 2) * (1 - t) + (wBottom / 2) * t;
		};
		return stages.map((_, idx) => {
			const yTop = PAD_Y + idx * band;
			const yBot = yTop + band;
			const hwTop = halfWidth(yTop);
			const hwBot = halfWidth(yBot);
			const path = `M ${xCenter - hwTop} ${yTop} L ${xCenter + hwTop} ${yTop} L ${xCenter + hwBot} ${yBot} L ${xCenter - hwBot} ${yBot} Z`;
			return { path, yTop, yBot, yCenter: (yTop + yBot) / 2, boundaryHalf: hwTop };
		});
	}
	const sellerGeom = $derived(funnelGeom(sellerFunnelStages));
	const buyerGeom = $derived(funnelGeom(buyerFunnelStages));
	const bStages = $derived(buyerFunnelStages);
	const sellerColors = ['#0B2E24', '#0E3C30', '#134C3D', '#185D4B', '#1D6E5A'];
	const buyerColors = ['#0A3430', '#0E443F', '#12554E', '#17675F', '#1C7A70'];

	const rpCompact = (v: number) =>
		new Intl.NumberFormat('id-ID', {
			notation: 'compact',
			style: 'currency',
			currency: 'IDR'
		}).format(v);

	const darkTooltip = {
		backgroundColor: '#0E2922',
		padding: 10,
		cornerRadius: 10,
		titleFont: { weight: 700 }
	};

	const gmvRevenueChart = $derived<ChartConfiguration<'line'>>({
		type: 'line',
		data: {
			labels: timeSeriesData.map((p) => p.label),
			datasets: [
				{
					label: m.adx_ov_legend_gmv(),
					data: timeSeriesData.map((p) => p.gmv),
					borderColor: '#0C7B58',
					backgroundColor: '#0C7B58',
					borderWidth: 2,
					tension: 0.35,
					pointRadius: 0,
					pointHoverRadius: 4
				},
				{
					label: m.adx_ov_legend_revenue(),
					data: timeSeriesData.map((p) => p.revenue),
					borderColor: '#7C3AED',
					backgroundColor: '#7C3AED',
					borderWidth: 2,
					tension: 0.35,
					pointRadius: 0,
					pointHoverRadius: 4
				}
			]
		},
		options: {
			interaction: { mode: 'index', intersect: false },
			plugins: {
				tooltip: {
					...darkTooltip,
					callbacks: {
						label: (ctx) => `${ctx.dataset.label ?? ''} · ${formatRupiah(Number(ctx.parsed.y))}`
					}
				}
			},
			scales: {
				x: {
					grid: { display: false },
					border: { display: false },
					ticks: { maxTicksLimit: 6 }
				},
				y: {
					beginAtZero: true,
					grid: { color: '#EFF3F0', drawTicks: false },
					border: { display: false },
					ticks: { callback: (v) => rpCompact(Number(v)) }
				}
			}
		}
	});

	const sellerStatesChart = $derived<ChartConfiguration<'doughnut'>>({
		type: 'doughnut',
		data: {
			labels: seller5States.groups.map((g) => g.label),
			datasets: [
				{
					data: seller5States.groups.map((g) => g.count),
					backgroundColor: seller5States.groups.map((g) => g.color)
				}
			]
		},
		options: {
			cutout: '72%',
			plugins: {
				tooltip: {
					...darkTooltip,
					callbacks: {
						label: (ctx) => {
							const g = seller5States.groups[ctx.dataIndex];
							return g ? `${m.adx_ov_count_seller({ count: g.count })} (${g.percentage}%)` : '';
						}
					}
				}
			}
		}
	});

	const productMixChart = $derived<ChartConfiguration<'doughnut'>>({
		type: 'doughnut',
		data: {
			labels: productMix.map((p) => p.label),
			datasets: [
				{
					data: productMix.map((p) => p.count),
					backgroundColor: productMix.map((p) => p.color)
				}
			]
		},
		options: {
			cutout: '72%',
			onClick: (_event, elements) => {
				if (elements.length > 0) go('orders');
			},
			plugins: {
				tooltip: {
					...darkTooltip,
					callbacks: {
						label: (ctx) => {
							const item = productMix[ctx.dataIndex];
							return item ? `${item.count} (${item.percentage}%) · ${formatRupiah(item.gmv)}` : '';
						}
					}
				}
			}
		}
	});

	const fulfillmentSeries = [
		{ key: 'menunggu_akses', labelId: 'adx_ov_f_wait_access', color: '#F59E0B' },
		{ key: 'menunggu_jadwal', labelId: 'adx_ov_f_wait_schedule', color: '#F59E0B' },
		{ key: 'brief_diterima', labelId: 'adx_ov_f_brief', color: '#6366F1' },
		{ key: 'pengerjaan', labelId: 'adx_ov_f_working', color: '#3B82F6' },
		{ key: 'terjadwal', labelId: 'adx_ov_f_scheduled', color: '#0EA5E9' },
		{ key: 'hasil_dikirim', labelId: 'adx_ov_f_result', color: '#8B5CF6' },
		{ key: 'akses_diberikan', labelId: 'adx_ov_f_access', color: '#10B981' },
		{ key: 'selesai', labelId: 'adx_ov_f_done', color: '#047857' }
	] as const;

	const fulfillmentBarData = $derived([
		{
			label: m.adx_ov_cat_digital(),
			segments: [
				{
					...fulfillmentSeries[6],
					count: orders.filter(
						(o) =>
							o.productType === 'digital' &&
							(o.fulfillmentStatus === 'akses_diberikan' || o.fulfillmentStatus === 'selesai')
					).length
				}
			]
		},
		{
			label: m.adx_ov_cat_session(),
			segments: [
				{
					...fulfillmentSeries[1],
					count: orders.filter(
						(o) => o.productType === 'session' && o.fulfillmentStatus === 'perlu_dijadwalkan'
					).length
				},
				{
					...fulfillmentSeries[4],
					count: orders.filter(
						(o) =>
							o.productType === 'session' &&
							(o.fulfillmentStatus === 'terjadwal' || o.fulfillmentStatus === 'sudah_dijadwalkan')
					).length
				},
				{
					...fulfillmentSeries[7],
					count: orders.filter(
						(o) => o.productType === 'session' && o.fulfillmentStatus === 'selesai'
					).length
				}
			]
		},
		{
			label: m.adx_ov_cat_service(),
			segments: [
				{
					...fulfillmentSeries[2],
					count: orders.filter(
						(o) => o.productType === 'service' && o.fulfillmentStatus === 'menunggu_brief'
					).length
				},
				{
					...fulfillmentSeries[3],
					count: orders.filter(
						(o) => o.productType === 'service' && o.fulfillmentStatus === 'sedang_dikerjakan'
					).length
				},
				{
					...fulfillmentSeries[5],
					count: orders.filter(
						(o) => o.productType === 'service' && o.fulfillmentStatus === 'hasil_dikirim'
					).length
				},
				{
					...fulfillmentSeries[7],
					count: orders.filter(
						(o) => o.productType === 'service' && o.fulfillmentStatus === 'selesai'
					).length
				}
			]
		}
	]);
	const fulfillmentChart = $derived<ChartConfiguration<'bar'>>({
		type: 'bar',
		data: {
			labels: fulfillmentBarData.map((r) => r.label),
			datasets: fulfillmentSeries
				.filter((s) => fulfillmentBarData.some((r) => r.segments.some((x) => x.key === s.key)))
				.map((s) => ({
					label: m[s.labelId](),
					data: fulfillmentBarData.map((r) => r.segments.find((x) => x.key === s.key)?.count ?? 0),
					backgroundColor: s.color,
					borderRadius: 6
				}))
		},
		options: {
			indexAxis: 'y',
			scales: {
				x: {
					stacked: true,
					beginAtZero: true,
					grid: { color: '#EFF3F0', drawTicks: false },
					border: { display: false },
					ticks: { precision: 0 }
				},
				y: {
					stacked: true,
					grid: { display: false },
					border: { display: false }
				}
			}
		}
	});

	function go(sub: string) {
		void goto(`/admin/${sub}`);
	}
	function onKeydown(e: KeyboardEvent) {
		if (e.key !== 'Escape') return;
		showDetailedSellerStatesModal = false;
		showFullSellerJourneyModal = false;
	}
</script>

<svelte:window onkeydown={onKeydown} />

<div class="mx-auto max-w-7xl space-y-8 pb-16">
	<div
		class="flex flex-col justify-between gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-center"
	>
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-gray-900">{m.adx_ov_title()}</h1>
			<p class="mt-0.5 text-xs text-gray-500">{m.adx_ov_subtitle()}</p>
		</div>
		<div class="flex items-center gap-2 self-start sm:self-auto">
			<div class="flex rounded-lg border border-gray-200 bg-gray-100 p-0.5 text-xs">
				{#each [['7d', m.adx_ov_range_7()], ['30d', m.adx_ov_range_30()], ['90d', m.adx_ov_range_90()]] as [key, label] (key)}
					<button
						type="button"
						onclick={() => (timeRange = key as TimeRangeFilter)}
						class="rounded-md px-3 py-1.5 font-medium transition-all {timeRange === key
							? 'bg-white text-gray-900 shadow-xs'
							: 'text-gray-500 hover:text-gray-900'}"
					>
						{label}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<div class="space-y-3">
		<h2 class="text-xs font-bold tracking-wider text-gray-500 uppercase">{m.adx_ov_attention()}</h2>
		<div class="grid grid-cols-2 gap-3.5 md:grid-cols-4">
			<div
				role="button"
				tabindex="0"
				onclick={() => go('orders')}
				onkeydown={(e) => e.key === 'Enter' && go('orders')}
				class="group cursor-pointer rounded-xl border border-amber-200 bg-white p-4 shadow-xs transition-all hover:border-amber-400"
			>
				<div class="mb-1 flex items-center justify-between text-xs font-semibold text-amber-700">
					<span class="flex items-center gap-1.5"
						><ShoppingBag class="h-3.5 w-3.5" />{m.adx_ov_card_orders()}</span
					>
					<ChevronRight class="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
				</div>
				<div class="text-2xl font-bold text-gray-900">{activeAttentionOrders}</div>
				<div class="mt-0.5 text-[11px] text-gray-500">{m.adx_ov_card_orders_sub()}</div>
			</div>
			<div
				role="button"
				tabindex="0"
				onclick={() => go('payouts')}
				onkeydown={(e) => e.key === 'Enter' && go('payouts')}
				class="group cursor-pointer rounded-xl border border-blue-200 bg-white p-4 shadow-xs transition-all hover:border-blue-400"
			>
				<div class="mb-1 flex items-center justify-between text-xs font-semibold text-blue-700">
					<span class="flex items-center gap-1.5"
						><CreditCard class="h-3.5 w-3.5" />{m.adx_ov_card_payout()}</span
					>
					<ChevronRight class="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
				</div>
				<div class="text-2xl font-bold text-gray-900">{pendingPayoutCount}</div>
				<div class="mt-0.5 text-[11px] text-gray-500">{m.adx_ov_card_payout_sub()}</div>
			</div>
			<div
				role="button"
				tabindex="0"
				onclick={() => go('verifications')}
				onkeydown={(e) => e.key === 'Enter' && go('verifications')}
				class="group cursor-pointer rounded-xl border border-purple-200 bg-white p-4 shadow-xs transition-all hover:border-purple-400"
			>
				<div class="mb-1 flex items-center justify-between text-xs font-semibold text-purple-700">
					<span class="flex items-center gap-1.5"
						><ShieldCheck class="h-3.5 w-3.5" />{m.adx_ov_card_verif()}</span
					>
					<ChevronRight class="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
				</div>
				<div class="text-2xl font-bold text-gray-900">{pendingKycCount}</div>
				<div class="mt-0.5 text-[11px] text-gray-500">{m.adx_ov_card_verif_sub()}</div>
			</div>
			<div
				role="button"
				tabindex="0"
				onclick={() => go('cases')}
				onkeydown={(e) => e.key === 'Enter' && go('cases')}
				class="group cursor-pointer rounded-xl border border-rose-200 bg-white p-4 shadow-xs transition-all hover:border-rose-400"
			>
				<div class="mb-1 flex items-center justify-between text-xs font-semibold text-rose-700">
					<span class="flex items-center gap-1.5"
						><CircleAlert class="h-3.5 w-3.5" />{m.adx_ov_card_dispute()}</span
					>
					<ChevronRight class="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
				</div>
				<div class="text-2xl font-bold text-gray-900">{activeDisputeCount}</div>
				<div class="mt-0.5 text-[11px] text-gray-500">{m.adx_ov_card_dispute_sub()}</div>
			</div>
		</div>
	</div>

	<div class="space-y-4">
		<div class="flex items-center justify-between border-b border-gray-200 pb-2.5">
			<h2 class="text-sm font-bold tracking-wider text-gray-900 uppercase">
				{m.adx_ov_section_journey()}
			</h2>
			<button
				type="button"
				onclick={() => (showFullSellerJourneyModal = true)}
				class="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
			>
				{m.adx_ov_view_10_milestones()}
			</button>
		</div>

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div
				class="flex flex-col justify-between space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-xs"
			>
				<div>
					<div class="mb-1 flex items-center justify-between">
						<h3 class="flex items-center gap-2 text-sm font-bold text-gray-900">
							<Users class="h-4 w-4 text-emerald-600" />
							{m.adx_ov_seller_funnel_title()}
						</h3>
						<span class="text-[11px] font-medium text-gray-500">{m.adx_ov_5_stages()}</span>
					</div>
					<p class="mb-3 text-xs text-gray-500">{m.adx_ov_seller_funnel_desc()}</p>
					<div class="flex w-full items-center justify-center">
						{#if sellerFunnelStages.length === 0}
							<div class="flex h-64 items-center justify-center text-xs text-gray-400">
								{m.adx_ov_funnel_empty()}
							</div>
						{:else}
							<div class="relative w-full select-none">
								<svg
									viewBox="0 0 {FUNNEL_W} {FUNNEL_H}"
									class="block h-auto w-full overflow-visible"
									preserveAspectRatio="xMidYMid meet"
								>
									{#each sellerFunnelStages as stage, idx (stage.id)}
										{@const g = sellerGeom[idx]}
										<g
											role="button"
											tabindex="0"
											onclick={() => go('sellers')}
											onkeydown={(e) => e.key === 'Enter' && go('sellers')}
											onmouseenter={() => (sellerHover = idx)}
											onmouseleave={() => (sellerHover = -1)}
											class="cursor-pointer"
										>
											<path
												d={g.path}
												fill={sellerColors[idx % sellerColors.length]}
												opacity={sellerHover === idx ? 0.93 : 1}
												stroke="#FFFFFF"
												stroke-width="0.75"
												stroke-opacity="0.18"
											/>
											<text
												x="270"
												y={g.yCenter}
												text-anchor="middle"
												dominant-baseline="central"
												fill="#FFFFFF"
												class="pointer-events-none"
											>
												<tspan x="270" dy="-14" font-size="14" font-weight="500" fill-opacity="0.88"
													>{stage.name}</tspan
												>
												<tspan x="270" dy="28" font-size="24" font-weight="700"
													>{stage.countLabel}</tspan
												>
											</text>
										</g>
									{/each}
									{#each sellerFunnelStages as stage, idx (stage.id)}
										{#if idx > 0 && stage.conversionLabel}
											<g class="pointer-events-none">
												<rect
													x="185"
													y={sellerGeom[idx].yTop - 10}
													width="170"
													height="20"
													rx="10"
													fill="#08261E"
													fill-opacity="0.96"
													stroke="#10B981"
													stroke-width="1"
													stroke-opacity="0.45"
												/>
												<text
													x="270"
													y={sellerGeom[idx].yTop + 0.5}
													text-anchor="middle"
													dominant-baseline="central"
													fill="#6EE7B7"
													font-size="11"
													font-weight="600">{stage.conversionLabel}</text
												>
											</g>
										{/if}
									{/each}
								</svg>
								{#if sellerHover >= 0 && sellerFunnelStages[sellerHover]}
									{@const hs = sellerFunnelStages[sellerHover]}
									<div
										class="pointer-events-none absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-lg border border-gray-700/80 bg-gray-900/95 p-2.5 text-xs text-white shadow-xl"
									>
										<div class="flex items-center gap-1.5 font-bold text-emerald-400">
											<span>{hs.name}</span>
											{#if hs.subLabel}<span class="text-[11px] font-normal text-gray-400"
													>({hs.subLabel})</span
												>{/if}
										</div>
										<div class="mt-1 space-y-0.5 text-gray-200">
											<div>
												{m.adx_ov_tip_total()}
												<strong class="font-semibold text-white">{hs.countLabel}</strong>
											</div>
											{#if hs.percentage !== undefined}<div>
													{m.adx_ov_tip_from_start()}
													<strong class="font-semibold text-white">{hs.percentage}%</strong>
												</div>{/if}
											{#if hs.stepConversion !== undefined}<div>
													{m.adx_ov_tip_step()}
													<strong class="font-semibold text-white">{hs.stepConversion}%</strong>
												</div>{/if}
											{#if hs.dropOffRate !== undefined && hs.dropOffRate > 0}<div
													class="text-amber-300"
												>
													{m.adx_ov_tip_dropoff()} <strong>{hs.dropOffRate}%</strong>
												</div>{/if}
										</div>
										<div class="mt-1 border-t border-gray-700 pt-1 text-[10px] text-gray-400">
											{m.adx_ov_tip_click()}
										</div>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				</div>
				<div
					class="flex items-center justify-between gap-2 border-t border-gray-100 pt-2.5 text-xs text-gray-600"
				>
					<span class="shrink-0">
						{m.adx_ov_repeat_seller_label()}
						<strong class="font-semibold text-gray-900"
							>{macroSellerFunnel.stages.find((s) => s.id === 'repeat')?.percentage ?? 0}%</strong
						>
					</span>
					{#if macroSellerFunnel.biggestDrop.dropPercent > 0}
						<span
							class="flex shrink-0 items-center gap-1 font-medium text-amber-800"
							title={m.adx_ov_drop_tooltip({
								from: macroSellerFunnel.biggestDrop.from,
								to: macroSellerFunnel.biggestDrop.to,
								percent: macroSellerFunnel.biggestDrop.dropPercent
							})}
						>
							<Info class="h-3.5 w-3.5 shrink-0 text-amber-600" />
							<span
								>{m.adx_ov_drop_label()}
								<strong class="font-semibold text-amber-900"
									>-{macroSellerFunnel.biggestDrop.dropPercent}%</strong
								></span
							>
						</span>
					{:else}
						<span class="shrink-0 font-medium text-gray-500">{m.adx_ov_stable()}</span>
					{/if}
				</div>
			</div>

			<div
				class="flex flex-col justify-between space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-xs"
			>
				<div>
					<div class="mb-1 flex items-center justify-between">
						<h3 class="flex items-center gap-2 text-sm font-bold text-gray-900">
							<Repeat class="h-4 w-4 text-emerald-600" />
							{m.adx_ov_buyer_funnel_title()}
						</h3>
						<span class="text-[11px] font-medium text-gray-500">{m.adx_ov_5_stages()}</span>
					</div>
					<p class="mb-3 text-xs text-gray-500">{m.adx_ov_buyer_funnel_desc()}</p>
					<div class="flex w-full items-center justify-center">
						{#if bStages.length === 0}
							<div class="flex h-64 items-center justify-center text-xs text-gray-400">
								{m.adx_ov_funnel_empty()}
							</div>
						{:else}
							<div class="relative w-full select-none">
								<svg
									viewBox="0 0 {FUNNEL_W} {FUNNEL_H}"
									class="block h-auto w-full overflow-visible"
									preserveAspectRatio="xMidYMid meet"
								>
									{#each bStages as stage, idx (stage.id)}
										{@const g = buyerGeom[idx]}
										<g
											role="button"
											tabindex="0"
											onclick={() =>
												go(stage.id === 'paid' || stage.id === 'fulfilled' ? 'orders' : 'buyers')}
											onkeydown={(e) =>
												e.key === 'Enter' &&
												go(stage.id === 'paid' || stage.id === 'fulfilled' ? 'orders' : 'buyers')}
											onmouseenter={() => (buyerHover = idx)}
											onmouseleave={() => (buyerHover = -1)}
											class="cursor-pointer"
										>
											<path
												d={g.path}
												fill={buyerColors[idx % buyerColors.length]}
												opacity={buyerHover === idx ? 0.93 : 1}
												stroke="#FFFFFF"
												stroke-width="0.75"
												stroke-opacity="0.18"
											/>
											<text
												x="270"
												y={g.yCenter}
												text-anchor="middle"
												dominant-baseline="central"
												fill="#FFFFFF"
												class="pointer-events-none"
											>
												<tspan x="270" dy="-14" font-size="14" font-weight="500" fill-opacity="0.88"
													>{stage.name}</tspan
												>
												<tspan x="270" dy="28" font-size="24" font-weight="700"
													>{stage.countLabel}</tspan
												>
											</text>
										</g>
									{/each}
									{#each bStages as stage, idx (stage.id)}
										{#if idx > 0 && stage.conversionLabel}
											<g class="pointer-events-none">
												<rect
													x="185"
													y={buyerGeom[idx].yTop - 10}
													width="170"
													height="20"
													rx="10"
													fill="#072824"
													fill-opacity="0.96"
													stroke="#14B8A6"
													stroke-width="1"
													stroke-opacity="0.45"
												/>
												<text
													x="270"
													y={buyerGeom[idx].yTop + 0.5}
													text-anchor="middle"
													dominant-baseline="central"
													fill="#5EEAD4"
													font-size="11"
													font-weight="600">{stage.conversionLabel}</text
												>
											</g>
										{/if}
									{/each}
								</svg>
								{#if buyerHover >= 0 && bStages[buyerHover]}
									{@const hb = bStages[buyerHover]}
									<div
										class="pointer-events-none absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-lg border border-gray-700/80 bg-gray-900/95 p-2.5 text-xs text-white shadow-xl"
									>
										<div class="flex items-center gap-1.5 font-bold text-emerald-400">
											<span>{hb.name}</span>
											{#if hb.subLabel}<span class="text-[11px] font-normal text-gray-400"
													>({hb.subLabel})</span
												>{/if}
										</div>
										<div class="mt-1 space-y-0.5 text-gray-200">
											<div>
												{m.adx_ov_tip_total()}
												<strong class="font-semibold text-white">{hb.countLabel}</strong>
											</div>
											{#if hb.percentage !== undefined}<div>
													{m.adx_ov_tip_from_start()}
													<strong class="font-semibold text-white">{hb.percentage}%</strong>
												</div>{/if}
											{#if hb.stepConversion !== undefined}<div>
													{m.adx_ov_tip_step()}
													<strong class="font-semibold text-white">{hb.stepConversion}%</strong>
												</div>{/if}
										</div>
										<div class="mt-1 border-t border-gray-700 pt-1 text-[10px] text-gray-400">
											{m.adx_ov_tip_click()}
										</div>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				</div>
				<div
					class="flex items-center justify-between border-t border-gray-100 pt-2.5 text-xs text-gray-600"
				>
					<span>
						{m.adx_ov_review_rate()}
						<strong class="font-semibold text-gray-900"
							>{buyerFunnel.fulfilled > 0
								? Math.round((buyerFunnel.reviewed / buyerFunnel.fulfilled) * 100)
								: 0}%</strong
						>
					</span>
					<span>
						{m.adx_ov_repeat_buyer()}
						<strong class="font-semibold text-gray-900">{buyerStats.repeatPurchaseRate}%</strong>
					</span>
				</div>
			</div>

			<div
				class="flex flex-col justify-between space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-xs"
			>
				<div>
					<div class="mb-1 flex items-center justify-between">
						<h3 class="text-sm font-bold text-gray-900">{m.adx_ov_seller_now()}</h3>
						<span class="font-mono text-xs font-bold text-gray-500"
							>{seller5States.totalSellers} {m.adx_ov_total()}</span
						>
					</div>
					<p class="mb-2 text-xs text-gray-500">{m.adx_ov_seller_now_desc()}</p>
					<div
						role="button"
						tabindex="0"
						onclick={() => (showDetailedSellerStatesModal = true)}
						onkeydown={(e) => e.key === 'Enter' && (showDetailedSellerStatesModal = true)}
						class="relative flex h-44 w-full items-center justify-center"
					>
						<ChartCanvas config={sellerStatesChart} height={176} class="h-44" />
						<div
							class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
						>
							<span class="text-lg leading-none font-bold text-gray-900"
								>{seller5States.totalSellers}</span
							>
							<span class="mt-0.5 text-[10px] text-gray-400">{m.adx_ov_seller_word()}</span>
						</div>
					</div>
					<div class="mt-1 space-y-1.5 text-xs">
						{#each seller5States.groups as group (group.id)}
							<div
								role="button"
								tabindex="0"
								onclick={() => (showDetailedSellerStatesModal = true)}
								onkeydown={(e) => e.key === 'Enter' && (showDetailedSellerStatesModal = true)}
								class="flex cursor-pointer items-center justify-between rounded p-1 transition-colors hover:bg-gray-50"
							>
								<div class="flex items-center gap-1.5">
									<div
										class="h-2.5 w-2.5 shrink-0 rounded-full"
										style="background-color:{group.color}"
									></div>
									<span class="text-[11px] font-medium text-gray-700">{group.label}</span>
								</div>
								<div class="flex items-center gap-1.5 font-mono text-[11px]">
									<span class="font-bold text-gray-900">{group.count}</span>
									<span class="text-[10px] text-gray-400">({group.percentage}%)</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
				<div class="flex items-center justify-between border-t border-gray-100 pt-2 text-xs">
					<button
						type="button"
						onclick={() => (showDetailedSellerStatesModal = true)}
						class="flex items-center gap-1 font-bold text-emerald-700 hover:underline"
					>
						{m.adx_ov_view_9_states()}
					</button>
				</div>
			</div>
		</div>
	</div>

	<div class="space-y-6">
		<div class="border-b border-gray-200 pb-2.5">
			<h2 class="text-sm font-bold tracking-wider text-gray-900 uppercase">
				{m.adx_ov_section_bisnis()}
			</h2>
		</div>

		<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
			<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
				<div class="mb-1 flex items-center justify-between text-xs text-gray-500">
					<span class="font-medium">{m.adx_ov_gmv()}</span>
					<DollarSign class="h-4 w-4 text-emerald-600" />
				</div>
				<div class="text-xl font-bold text-gray-900">
					{canViewFinancials ? formatRupiah(gmvValue) : m.adx_ov_masked()}
				</div>
				<div class="mt-1 flex items-center gap-1 text-[11px] text-emerald-700">
					<TrendingUp class="h-3 w-3" />
					<span>{canViewFinancials ? m.adx_ov_gmv_sub() : m.adx_ov_finance_limited()}</span>
				</div>
			</div>
			<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
				<div class="mb-1 flex items-center justify-between text-xs text-gray-500">
					<span class="font-medium">{m.adx_ov_revenue()}</span>
					<Activity class="h-4 w-4 text-emerald-600" />
				</div>
				<div class="text-xl font-bold text-gray-900">
					{canViewFinancials ? formatRupiah(financials.karjaRevenue) : m.adx_ov_masked()}
				</div>
				<div class="mt-1 text-[11px] text-gray-500">
					{canViewFinancials ? m.adx_ov_revenue_sub() : m.adx_ov_finance_limited()}
				</div>
			</div>
			<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
				<div class="mb-1 flex items-center justify-between text-xs text-gray-500">
					<span class="font-medium">{m.adx_ov_paid_orders()}</span>
					<ShoppingBag class="h-4 w-4 text-emerald-600" />
				</div>
				<div class="text-xl font-bold text-gray-900">{paidOrderCount}</div>
				<div class="mt-1 text-[11px] text-gray-500">{m.adx_ov_paid_orders_sub()}</div>
			</div>
			<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
				<div class="mb-1 flex items-center justify-between text-xs text-gray-500">
					<span class="font-medium">{m.adx_ov_repeat_buyer_metric()}</span>
					<Repeat class="h-4 w-4 text-emerald-600" />
				</div>
				<div class="text-xl font-bold text-gray-900">
					{buyerStats.repeatBuyersCount}
					<span class="text-xs font-normal text-gray-400">({buyerStats.repeatPurchaseRate}%)</span>
				</div>
				<div class="mt-1 text-[11px] text-gray-500">{m.adx_ov_repeat_buyer_sub()}</div>
			</div>
		</div>

		<div class="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
			<div class="mb-4">
				<h3 class="flex items-center gap-2 text-base font-bold text-gray-900">
					<TrendingUp class="h-4 w-4 text-emerald-600" />
					{m.adx_ov_trend_title()}
				</h3>
				<p class="mt-0.5 text-xs text-gray-500">{m.adx_ov_trend_desc()}</p>
			</div>
			<ChartCanvas config={gmvRevenueChart} height={256} />
			<div class="mt-2 flex items-center gap-4 text-xs">
				<span class="flex items-center gap-1.5"
					><span class="h-2.5 w-2.5 rounded-full bg-[#0C7B58]"></span>{m.adx_ov_legend_gmv()}</span
				>
				<span class="flex items-center gap-1.5"
					><span class="h-2.5 w-2.5 rounded-full bg-[#7C3AED]"
					></span>{m.adx_ov_legend_revenue()}</span
				>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<div
				class="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-xs"
			>
				<div>
					<div class="mb-1 flex items-center justify-between">
						<h3 class="text-base font-bold text-gray-900">{m.adx_ov_mix_title()}</h3>
						<span class="text-xs font-semibold text-emerald-700"
							>{m.adx_ov_mix_total({ count: paidOrderCount })}</span
						>
					</div>
					<p class="mb-3 text-xs text-gray-500">{m.adx_ov_mix_desc()}</p>
					<div class="relative flex h-44 w-full items-center justify-center">
						<ChartCanvas config={productMixChart} height={176} class="h-44" />
						<div
							class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
						>
							<span class="text-base leading-none font-bold text-gray-900">{paidOrderCount}</span>
							<span class="mt-0.5 text-[10px] text-gray-400">{m.adx_ov_order_word()}</span>
						</div>
					</div>
					<div class="mt-2 space-y-1.5 text-xs">
						{#each productMix as item (item.type)}
							<div
								role="button"
								tabindex="0"
								onclick={() => go('orders')}
								onkeydown={(e) => e.key === 'Enter' && go('orders')}
								class="flex cursor-pointer items-center justify-between rounded p-1.5 transition-colors hover:bg-gray-50"
							>
								<div class="flex items-center gap-2">
									<div class="h-2.5 w-2.5 rounded-full" style="background-color:{item.color}"></div>
									<span class="text-[11px] font-medium text-gray-700">{item.label}</span>
								</div>
								<div class="text-right">
									<span class="font-mono text-[11px] font-bold text-gray-900">{item.count}</span>
									<span class="ml-1 text-[10px] text-gray-400">({item.percentage}%)</span>
									<span class="ml-2 font-mono text-[11px] text-emerald-700"
										>{formatRupiah(item.gmv)}</span
									>
								</div>
							</div>
						{/each}
					</div>
				</div>
				<div class="flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
					<span class="text-gray-500">{m.adx_ov_mix_filter_hint()}</span>
					<button
						type="button"
						onclick={() => go('orders')}
						class="font-bold text-emerald-700 hover:underline"
					>
						{m.adx_ov_all_orders()}
					</button>
				</div>
			</div>

			<div
				class="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-xs"
			>
				<div>
					<div class="mb-1 flex items-center justify-between">
						<h3 class="text-base font-bold text-gray-900">{m.adx_ov_fulfill_title()}</h3>
						<span class="text-xs text-gray-500">{m.adx_ov_fulfill_sub()}</span>
					</div>
					<p class="mb-3 text-xs text-gray-500">{m.adx_ov_fulfill_desc()}</p>
					<ChartCanvas config={fulfillmentChart} height={176} />
					<div class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-500">
						{#each fulfillmentSeries as s (s.labelId)}
							<span class="flex items-center gap-1"
								><span class="h-2 w-2 rounded-sm" style="background-color:{s.color}"></span>{m[
									s.labelId
								]()}</span
							>
						{/each}
					</div>
				</div>
				<div class="flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
					<span class="text-gray-500">{m.adx_ov_fulfill_hint()}</span>
					<button
						type="button"
						onclick={() => go('orders')}
						class="font-bold text-emerald-700 hover:underline"
					>
						{m.adx_ov_open_orders()}
					</button>
				</div>
			</div>
		</div>
	</div>

	<div class="space-y-4">
		<div class="flex items-center justify-between border-b border-gray-200 pb-2.5">
			<h2 class="text-sm font-bold tracking-wider text-gray-900 uppercase">
				{m.adx_ov_section_platform()}
			</h2>
			<button
				type="button"
				onclick={() => go('storage')}
				class="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
			>
				{m.adx_ov_storage_dir()}
			</button>
		</div>
		<div
			class="flex flex-col items-center justify-between gap-6 rounded-xl border border-gray-200 bg-white p-5 shadow-xs md:flex-row"
		>
			<div class="w-full flex-1 space-y-2">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<HardDrive class="h-4 w-4 text-emerald-600" />
						<span class="text-sm font-bold text-gray-900">{m.adx_ov_storage_title()}</span>
					</div>
					<span
						class="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800"
					>
						{m.adx_ov_storage_used_badge({ percent: storageMetrics.usagePercent })}
					</span>
				</div>
				<div class="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
					<div
						class="h-full rounded-full bg-emerald-600 transition-all duration-500"
						style="width:{Math.max(storageMetrics.usagePercent, 3)}%"
					></div>
				</div>
				<div class="flex items-center justify-between pt-1 text-xs text-gray-500">
					<span
						>{m.adx_ov_used_label()}
						<strong class="text-gray-900">{formatBytes(storageMetrics.usedBytes)}</strong></span
					>
					<span
						>{m.adx_ov_remaining_label()}
						<strong class="text-gray-900">{formatBytes(storageMetrics.availableBytes)}</strong
						></span
					>
					<span
						>{m.adx_ov_capacity_label()}
						<strong class="text-gray-900">{formatBytes(storageMetrics.capacityBytes)}</strong></span
					>
				</div>
			</div>
			<div class="flex shrink-0 items-center gap-3">
				<div class="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-center">
					<div class="text-[11px] font-medium text-gray-500">{m.adx_ov_total_files()}</div>
					<div class="text-lg font-bold text-gray-900">{storageMetrics.totalFilesCount}</div>
				</div>
				<button
					type="button"
					onclick={() => go('storage')}
					class="rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
				>
					{m.adx_ov_manage_storage()}
				</button>
			</div>
		</div>
	</div>

	<div class="space-y-3">
		<div class="flex items-center justify-between border-b border-gray-200 pb-2.5">
			<h2 class="text-sm font-bold tracking-wider text-gray-900 uppercase">
				{m.adx_ov_section_activity()}
			</h2>
			<button
				type="button"
				onclick={() => go('settings')}
				class="text-xs text-gray-500 hover:text-gray-900"
			>
				{m.adx_ov_view_settings()}
			</button>
		</div>
		<div
			class="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs"
		>
			{#each admin.platformAuditLogs.slice(0, 5) as log (log.id)}
				<div class="flex items-center justify-between p-3.5 text-xs hover:bg-gray-50/50">
					<div class="flex min-w-0 items-center gap-3">
						<div class="h-2 w-2 shrink-0 rounded-full bg-emerald-500"></div>
						<div class="min-w-0">
							<div class="truncate font-semibold text-gray-900">{log.action}</div>
							<div class="truncate text-[11px] text-gray-500">{log.reason || log.entityType}</div>
						</div>
					</div>
					<div class="ml-3 shrink-0 font-mono text-[11px] text-gray-400">
						{new Date(log.createdAt).toLocaleTimeString('id-ID', {
							hour: '2-digit',
							minute: '2-digit'
						})} WIB
					</div>
				</div>
			{/each}
			{#if admin.platformAuditLogs.length === 0}
				<div class="p-6 text-center text-xs text-gray-400">{m.adx_ov_no_activity()}</div>
			{/if}
		</div>
	</div>
</div>

{#if showDetailedSellerStatesModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-900/60 p-4 backdrop-blur-[2px]"
	>
		<div
			class="my-auto w-full max-w-2xl space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl"
		>
			<div class="flex items-start justify-between border-b border-gray-100 pb-3">
				<div>
					<h3 class="flex items-center gap-2 text-lg font-bold text-gray-900">
						<Users class="h-5 w-5 text-emerald-600" />
						{m.adx_ov_modal9_title()}
					</h3>
					<p class="mt-0.5 text-xs text-gray-500">{m.adx_ov_modal9_desc()}</p>
				</div>
				<button
					type="button"
					onclick={() => (showDetailedSellerStatesModal = false)}
					class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
					aria-label={m.adx_c_close()}
				>
					<X class="h-5 w-5" />
				</button>
			</div>
			<div class="max-h-[60vh] space-y-2.5 overflow-y-auto pr-1">
				{#each sellerLifecycleDist as item (item.state)}
					<div
						role="button"
						tabindex="0"
						onclick={() => {
							showDetailedSellerStatesModal = false;
							go('sellers');
						}}
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								showDetailedSellerStatesModal = false;
								go('sellers');
							}
						}}
						class="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs transition-all hover:border-emerald-400"
					>
						<div class="flex min-w-0 items-center gap-2.5">
							<div
								class="h-3 w-3 shrink-0 rounded-full"
								style="background-color:{item.color}"
							></div>
							<div>
								<span class="block font-bold text-gray-900">{item.label}</span>
								<span class="text-[11px] text-gray-500">{item.state}</span>
							</div>
						</div>
						<div class="flex items-center gap-2 font-mono">
							<span class="font-bold text-gray-900"
								>{m.adx_ov_count_seller({ count: item.count })}</span
							>
							<span class="w-10 text-right text-[11px] text-gray-400">({item.percentage}%)</span>
							<ChevronRight class="h-4 w-4 text-gray-400" />
						</div>
					</div>
				{/each}
			</div>
			<div class="flex items-center justify-between border-t border-gray-100 pt-3">
				<span class="text-xs text-gray-500">{m.adx_ov_total_seller({ count: sellers.length })}</span
				>
				<button
					type="button"
					onclick={() => (showDetailedSellerStatesModal = false)}
					class="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
				>
					{m.adx_c_close()}
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showFullSellerJourneyModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-900/60 p-4 backdrop-blur-[2px]"
	>
		<div
			class="my-auto w-full max-w-3xl space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl"
		>
			<div class="flex items-start justify-between border-b border-gray-100 pb-3">
				<div>
					<h3 class="flex items-center gap-2 text-lg font-bold text-gray-900">
						<Users class="h-5 w-5 text-emerald-600" />
						{m.adx_ov_modal10_title()}
					</h3>
					<p class="mt-0.5 text-xs text-gray-500">{m.adx_ov_modal10_desc()}</p>
				</div>
				<button
					type="button"
					onclick={() => (showFullSellerJourneyModal = false)}
					class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
					aria-label={m.adx_c_close()}
				>
					<X class="h-5 w-5" />
				</button>
			</div>
			<div class="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
				{#each fullSellerFunnel as stage, idx (stage.id)}
					<div class="space-y-1.5 rounded-xl border border-gray-200 bg-gray-50 p-3">
						<div class="flex items-center justify-between text-xs">
							<div class="flex items-center gap-2">
								<span
									class="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800"
									>{idx + 1}</span
								>
								<span class="font-bold text-gray-900">{stage.label}</span>
							</div>
							<div class="flex items-center gap-3 font-mono text-xs">
								<span class="font-bold text-gray-900"
									>{m.adx_ov_count_seller({ count: stage.count })}</span
								>
								<span class="w-12 text-right font-bold text-emerald-700">{stage.percentage}%</span>
								<span class="w-16 text-right text-[11px] text-gray-400"
									>{idx === 0 ? '-' : m.adx_ov_step_pct({ percent: stage.stepConversion })}</span
								>
							</div>
						</div>
						<p class="pl-7 text-xs text-gray-600">{stage.description}</p>
						<div class="ml-7 h-2 w-full overflow-hidden rounded-full bg-gray-200">
							<div
								class="h-full rounded-full bg-emerald-600 transition-all"
								style="width:{Math.max(stage.percentage, stage.count > 0 ? 3 : 0)}%"
							></div>
						</div>
					</div>
				{/each}
			</div>
			<div class="flex items-center justify-between border-t border-gray-100 pt-3">
				<span class="text-xs text-gray-500"
					>{m.adx_ov_total_registered({ count: sellers.length })}</span
				>
				<button
					type="button"
					onclick={() => (showFullSellerJourneyModal = false)}
					class="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
				>
					{m.adx_c_close()}
				</button>
			</div>
		</div>
	</div>
{/if}
