<script lang="ts">
	import { formatRupiah } from '$lib/data/mockData';
	import { m } from '$lib/paraglide/messages.js';

	type Props = {
		totalProducts: number;
		totalViews: number;
		totalSales: number;
		totalRevenue: number;
	};
	let { totalProducts, totalViews, totalSales, totalRevenue }: Props = $props();
</script>

<section class="space-y-3">
	<h2 class="text-lg font-bold text-[#0E2E25]">{m.home_metrics_summary()}</h2>

	<div class="rounded-2xl border border-[#E5ECE7] bg-white p-6 shadow-2xs sm:p-7">
		<div class="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8 md:divide-x md:divide-[#EEF3F0]">
			<div class="space-y-1">
				<span class="text-xs font-semibold text-sage">{m.home_metric_products()}</span>
				<div class="text-2xl font-extrabold tracking-tight text-[#0E2E25] sm:text-3xl">
					{totalProducts}
				</div>
				<p class="text-xs text-[#7B998F]">{m.home_metric_products_sub()}</p>
			</div>

			<div class="space-y-1 md:pl-8">
				<span class="text-xs font-semibold text-sage">{m.home_metric_views()}</span>
				<div class="text-2xl font-extrabold tracking-tight text-[#0E2E25] sm:text-3xl">
					{totalViews}
				</div>
				<p class="text-xs text-[#7B998F]">{m.home_metric_views_sub()}</p>
			</div>

			<div class="space-y-1 md:pl-8">
				<span class="text-xs font-semibold text-sage">{m.home_metric_sales()}</span>
				<div class="text-2xl font-extrabold tracking-tight text-[#0E2E25] sm:text-3xl">
					{totalSales}
				</div>
				<p class="text-xs text-[#7B998F]">{m.home_metric_sales_sub()}</p>
			</div>

			<div class="space-y-1 md:pl-8">
				<span class="text-xs font-semibold text-sage">{m.home_metric_revenue()}</span>
				<div class="truncate text-2xl font-extrabold tracking-tight text-brand sm:text-3xl">
					{formatRupiah(totalRevenue)}
				</div>
				<p class="text-xs text-[#7B998F]">{m.home_metric_revenue_sub()}</p>
			</div>
		</div>
	</div>
</section>
