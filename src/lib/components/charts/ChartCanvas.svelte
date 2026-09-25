<script lang="ts" module>
	import {
		Chart,
		ArcElement,
		BarElement,
		LineElement,
		PointElement,
		Filler,
		Legend,
		Title,
		Tooltip,
		CategoryScale,
		LinearScale,
		TimeScale,
		BarController,
		DoughnutController,
		LineController
	} from 'chart.js';

	Chart.register(
		ArcElement,
		BarElement,
		LineElement,
		PointElement,
		Filler,
		Legend,
		Title,
		Tooltip,
		CategoryScale,
		LinearScale,
		TimeScale,
		BarController,
		DoughnutController,
		LineController
	);

	const FONT = "'Plus Jakarta Sans', -apple-system, sans-serif";

	Chart.defaults.font.family = FONT;
	Chart.defaults.color = '#52776C';
</script>

<script lang="ts">
	import type { ChartConfiguration } from 'chart.js';

	type Props = {
		config: ChartConfiguration;
		class?: string;
		height?: number;
	};
	let { config, class: className = '', height = 260 }: Props = $props();

	let canvas = $state<HTMLCanvasElement | undefined>();
	let chart: Chart | undefined;

	$effect(() => {
		if (!canvas) return;
		chart?.destroy();
		chart = new Chart(canvas, {
			...config,
			options: {
				responsive: true,
				maintainAspectRatio: false,
				animation: { duration: 350 },
				...(config.options ?? {}),
				plugins: {
					legend: { display: false },
					tooltip: {
						backgroundColor: '#0E2922',
						padding: 10,
						cornerRadius: 10,
						titleFont: { weight: 700 }
					},
					...(config.options?.plugins ?? {})
				}
			}
		});
		return () => {
			chart?.destroy();
			chart = undefined;
		};
	});
</script>

<div class="relative w-full {className}" style="height: {height}px;">
	<canvas bind:this={canvas} aria-label="chart"></canvas>
</div>
