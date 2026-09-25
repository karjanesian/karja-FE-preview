<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';

	export type FunnelStageItem = {
		id: string;
		name: string;
		count: number;
		countLabel?: string;
		subLabel?: string;
		percentage?: number;
		stepConversion?: number;
		dropOffRate?: number;
		conversionLabel?: string;
		color?: string;
	};

	type Props = {
		stages: FunnelStageItem[];
		theme?: 'seller' | 'buyer';
		onStageClick?: (stageId: string) => void;
		className?: string;
	};

	let { stages, theme = 'seller', onStageClick, className = '' }: Props = $props();

	let hoveredIdx = $state<number | null>(null);

	const svgWidth = 540;
	const svgHeight = 450;
	const padX = 16;
	const padY = 8;
	const usableHeight = svgHeight - padY * 2;
	const xCenter = svgWidth / 2;
	const wTop = svgWidth - padX * 2;
	const wBottom = 260;

	const defaultColors = $derived(
		theme === 'seller'
			? ['#0B2E24', '#0E3C30', '#134C3D', '#185D4B', '#1D6E5A']
			: ['#0A3430', '#0E443F', '#12554E', '#17675F', '#1C7A70']
	);

	const stageBandHeight = $derived(usableHeight / (stages?.length || 1));

	function getHalfWidth(y: number) {
		const t = Math.max(0, Math.min(1, (y - padY) / usableHeight));
		return (wTop / 2) * (1 - t) + (wBottom / 2) * t;
	}

	function getTrapezoidPath(yTop: number, yBot: number) {
		const hwTop = getHalfWidth(yTop);
		const hwBot = getHalfWidth(yBot);
		const x1 = xCenter - hwTop;
		const x2 = xCenter + hwTop;
		const x3 = xCenter + hwBot;
		const x4 = xCenter - hwBot;
		return `M ${x1} ${yTop} L ${x2} ${yTop} L ${x3} ${yBot} L ${x4} ${yBot} Z`;
	}

	const bandGeometry = $derived.by(() =>
		stages.map((stage, idx) => {
			const yTop = padY + idx * stageBandHeight;
			const yBot = yTop + stageBandHeight;
			const yCenter = (yTop + yBot) / 2;
			return {
				stage,
				idx,
				yTop,
				yBot,
				yCenter,
				path: getTrapezoidPath(yTop, yBot),
				stageColor: stage.color || defaultColors[idx % defaultColors.length],
				countText:
					stage.countLabel ||
					(typeof stage.count === 'number' ? stage.count.toLocaleString('id-ID') : `${stage.count}`)
			};
		})
	);

	const conversionBadges = $derived.by(() =>
		stages
			.map((stage, idx) => {
				if (idx === 0) return null;
				const yBoundary = padY + idx * stageBandHeight;
				const convLabel =
					stage.conversionLabel ||
					(stage.stepConversion !== undefined
						? m.ad_funnel_lanjut({ count: stage.stepConversion })
						: null);
				if (!convLabel) return null;
				return { stage, idx, yBoundary, convLabel };
			})
			.filter((b): b is NonNullable<typeof b> => b !== null)
	);

	const badgeColors = $derived(
		theme === 'seller'
			? { bg: '#08261E', text: '#6EE7B7', border: '#10B981' }
			: { bg: '#072824', text: '#5EEAD4', border: '#14B8A6' }
	);

	const hoveredStage = $derived(hoveredIdx !== null ? stages[hoveredIdx] : undefined);
</script>

{#if !stages || stages.length === 0}
	<div class="flex h-64 items-center justify-center text-xs text-gray-400">
		{m.ad_funnel_no_data()}
	</div>
{:else}
	<div class="relative w-full select-none {className}">
		<svg
			viewBox={`0 0 ${svgWidth} ${svgHeight}`}
			class="block h-auto w-full overflow-visible"
			preserveAspectRatio="xMidYMid meet"
			role="img"
			aria-label="Journey funnel"
		>
			{#each bandGeometry as band (band.stage.id || band.idx)}
				{@const isHovered = hoveredIdx === band.idx}
				<g
					class="transition-all duration-150"
					style="cursor: {onStageClick ? 'pointer' : 'default'}"
					onclick={() => onStageClick?.(band.stage.id)}
					onmouseenter={() => (hoveredIdx = band.idx)}
					onmouseleave={() => (hoveredIdx = null)}
					onkeydown={(e) => {
						if (onStageClick && (e.key === 'Enter' || e.key === ' ')) {
							e.preventDefault();
							onStageClick(band.stage.id);
						}
					}}
					{...onStageClick ? { role: 'button', tabindex: 0 } : {}}
				>
					<path
						d={band.path}
						fill={band.stageColor}
						opacity={isHovered ? 0.93 : 1}
						stroke="#FFFFFF"
						stroke-width="0.75"
						stroke-opacity="0.18"
					/>

					{#if isHovered}
						<path
							d={band.path}
							fill="#FFFFFF"
							opacity="0.08"
							stroke="#FFFFFF"
							stroke-width="1.5"
							stroke-opacity="0.4"
						/>
					{/if}

					<text
						x={xCenter}
						y={band.yCenter}
						text-anchor="middle"
						dominant-baseline="central"
						fill="#FFFFFF"
						class="pointer-events-none"
					>
						<tspan
							x={xCenter}
							dy="-14"
							font-size="14"
							font-weight="500"
							fill="#FFFFFF"
							fill-opacity="0.88"
							letter-spacing="0.01em">{band.stage.name}</tspan
						>
						<tspan
							x={xCenter}
							dy="28"
							font-size="24"
							font-weight="700"
							fill="#FFFFFF"
							letter-spacing="-0.02em">{band.countText}</tspan
						>
					</text>

					{#if band.idx > 0}
						<line
							x1={xCenter - getHalfWidth(band.yTop)}
							y1={band.yTop}
							x2={xCenter + getHalfWidth(band.yTop)}
							y2={band.yTop}
							stroke="#FFFFFF"
							stroke-width="1.25"
							stroke-opacity="0.25"
						/>
					{/if}
				</g>
			{/each}

			{#each conversionBadges as badge (badge.stage.id || badge.idx)}
				<g class="pointer-events-none">
					<rect
						x={xCenter - 85}
						y={badge.yBoundary - 10}
						width="170"
						height="20"
						rx="10"
						fill={badgeColors.bg}
						fill-opacity="0.96"
						stroke={badgeColors.border}
						stroke-width="1"
						stroke-opacity="0.45"
					/>
					<text
						x={xCenter}
						y={badge.yBoundary + 0.5}
						text-anchor="middle"
						dominant-baseline="central"
						fill={badgeColors.text}
						font-size="11"
						font-weight="600"
						letter-spacing="0.01em">{badge.convLabel}</text
					>
				</g>
			{/each}
		</svg>

		{#if hoveredStage}
			<div
				class="pointer-events-none absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-lg border border-gray-700/80 bg-gray-900/95 p-2.5 text-xs text-white shadow-xl backdrop-blur-sm"
			>
				<div class="flex items-center gap-1.5 font-bold text-emerald-400">
					<span>{hoveredStage.name}</span>
					{#if hoveredStage.subLabel}
						<span class="text-[11px] font-normal text-gray-400">({hoveredStage.subLabel})</span>
					{/if}
				</div>
				<div class="mt-1 space-y-0.5 text-gray-200">
					<div>
						{m.ad_funnel_total()}:
						<strong class="font-semibold text-white"
							>{hoveredStage.countLabel || hoveredStage.count}</strong
						>
					</div>
					{#if hoveredStage.percentage !== undefined}
						<div>
							{m.ad_funnel_from_start()}:
							<strong class="font-semibold text-white">{hoveredStage.percentage}%</strong>
						</div>
					{/if}
					{#if hoveredStage.stepConversion !== undefined}
						<div>
							{m.ad_funnel_step_conv()}:
							<strong class="font-semibold text-white">{hoveredStage.stepConversion}%</strong>
						</div>
					{/if}
					{#if hoveredStage.dropOffRate !== undefined && hoveredStage.dropOffRate > 0}
						<div class="text-amber-300">
							{m.ad_funnel_dropoff()}: <strong>{hoveredStage.dropOffRate}%</strong>
						</div>
					{/if}
				</div>
				{#if onStageClick}
					<div class="mt-1 border-t border-gray-700 pt-1 text-[10px] text-gray-400">
						{m.ad_funnel_click_hint()}
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}
