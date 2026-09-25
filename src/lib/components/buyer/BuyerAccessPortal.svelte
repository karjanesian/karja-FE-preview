<script lang="ts">
	import { goto } from '$app/navigation';
	import { seller } from '$lib/stores/seller.svelte';
	import { canOrderBeReviewed } from '$lib/domain/orderLifecycle';
	import { normalizeProductType } from '$lib/types';
	import * as m from '$lib/paraglide/messages.js';
	import PublicNavbar from '$lib/components/public/PublicNavbar.svelte';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Check from 'lucide-svelte/icons/check';
	import CheckCircle2 from 'lucide-svelte/icons/check-circle-2';
	import Clock from 'lucide-svelte/icons/clock';
	import Copy from 'lucide-svelte/icons/copy';
	import Download from 'lucide-svelte/icons/download';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import PackageX from 'lucide-svelte/icons/package-x';
	import Send from 'lucide-svelte/icons/send';
	import Star from 'lucide-svelte/icons/star';
	import Video from 'lucide-svelte/icons/video';
	import X from 'lucide-svelte/icons/x';

	type Props = {
		orderId: string;
	};
	let { orderId }: Props = $props();

	const order = $derived(
		seller.findOrder(orderId) ?? seller.orders.find((o) => o.accessToken === orderId) ?? null
	);
	const product = $derived(order ? seller.findProduct(order.productId) : null);
	const sellerProfile = $derived(seller.sellerProfile);
	const currentReview = $derived(
		order
			? order.buyerReview ||
					(order.reviewId
						? seller.reviews.find((r) => r.id === order.reviewId || r.orderId === order.id)
						: seller.reviews.find((r) => r.orderId === order.id))
			: undefined
	);
	const booking = $derived(order ? seller.bookings.find((b) => b.orderId === order.id) : undefined);

	const productType = $derived(normalizeProductType(order?.productType || product?.type));
	const isFree = $derived(Boolean(order?.isFreeClaim || (order && order.amount === 0)));
	const isEligibleForReview = $derived(order ? canOrderBeReviewed(order) : false);

	// svelte-ignore state_referenced_locally
	let rating = $state(currentReview?.rating || 5);
	let hoverRating = $state(0);
	// svelte-ignore state_referenced_locally
	let reviewComment = $state(currentReview?.comment || '');
	let copiedLink = $state(false);
	let reviewInitialized = $state(false);

	$effect(() => {
		const r = currentReview;
		if (r && !reviewInitialized) {
			reviewInitialized = true;
			rating = r.rating;
			reviewComment = r.comment;
		}
	});

	async function handleCopyLink(link?: string) {
		if (!link) return;
		try {
			await navigator.clipboard.writeText(link);
			copiedLink = true;
			setTimeout(() => (copiedLink = false), 2000);
		} catch {
			/* noop */
		}
	}

	function handleSubmitReview(event: SubmitEvent) {
		event.preventDefault();
		if (!rating || rating < 1 || !order || !isEligibleForReview) return;
		seller.addReviewForOrder(order.id, {
			rating,
			comment: reviewComment.trim()
		});
	}

	function handleDownloadServiceFile() {
		const sd = order?.serviceDelivery;
		if (!sd?.fileName) return;
		const element = document.createElement('a');
		const file = new Blob([`Hasil pengerjaan: ${sd.fileName || 'dokumen'}`], {
			type: 'text/plain'
		});
		element.href = URL.createObjectURL(file);
		element.download = sd.fileName || 'hasil_pengerjaan.txt';
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
	}

	function partyLabel(party?: 'seller' | 'buyer'): string {
		return party === 'seller' ? m.bu_acc_party_seller() : m.bu_acc_party_buyer();
	}

	function goHome() {
		void goto('/');
	}

	function goStore() {
		if (sellerProfile?.username) void goto(`/${sellerProfile.username}`);
	}
</script>

<div class="flex min-h-screen flex-col bg-[#FAFDFB] text-[#0E2E25] antialiased">
	<PublicNavbar />

	<main class="flex flex-1 items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
		{#if !order}
			<div
				class="w-full max-w-md space-y-4 rounded-3xl border border-[#E5ECE7] bg-white p-8 text-center shadow-xs"
			>
				<div
					class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF8E6] text-[#B88710]"
				>
					<PackageX class="h-7 w-7" />
				</div>
				<h1 class="text-lg font-bold text-[#0E2E25]">{m.bu_acc_nf_title()}</h1>
				<p class="text-xs leading-relaxed text-[#52776C]">{m.bu_acc_nf_desc()}</p>
				<div class="pt-2">
					<button
						type="button"
						onclick={goHome}
						class="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#0C7B58] py-2.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-[#096649]"
					>
						<ArrowLeft class="h-3.5 w-3.5" />
						<span>{m.bu_acc_nf_home()}</span>
					</button>
				</div>
			</div>
		{:else}
			<div class="w-full max-w-xl space-y-3">
				<div class="flex justify-end">
					<span
						class="rounded-full border border-[#CCE6D6] bg-[#EAF8F0] px-2.5 py-1 text-xs font-medium text-[#0C7B58]"
					>
						{m.bu_acc_badge()}
					</span>
				</div>

				<div
					class="relative space-y-6 rounded-3xl border border-[#CCE6D6] bg-white p-5 shadow-xs sm:p-7"
				>
					<div class="flex items-start justify-between space-y-1 border-b border-[#EAF4EE] pb-3">
						<div class="space-y-1">
							<div class="flex items-center gap-2">
								<span
									class="rounded-md bg-[#EAF8F0] px-2 py-0.5 font-mono text-xs font-bold text-[#0C7B58]"
								>
									{order.orderNumber}
								</span>
								<span
									class="rounded-full border border-[#BDE5D0] bg-[#EAF8F0] px-2 py-0.5 text-xs font-bold text-[#0C7B58]"
								>
									{isFree ? m.bu_sh_free() : m.bu_acc_paid()}
								</span>
							</div>
							<h2 class="text-lg font-bold text-[#0E2E25] sm:text-xl">
								{order.productTitle}
							</h2>
							<p class="text-xs text-[#52776C]">
								{m.bu_acc_from_to({
									seller: sellerProfile?.name || m.bu_acc_seller_fallback(),
									buyer: order.buyerName
								})}
							</p>
						</div>
					</div>

					{#if productType === 'digital'}
						<div class="space-y-4">
							<div class="space-y-3 rounded-2xl border border-[#CCE6D6] bg-[#F2FAF5] p-4">
								<div class="flex items-center gap-2 text-xs font-bold text-[#0A3D2E]">
									<Download class="h-4 w-4 text-[#0C7B58]" />
									<span>{m.bu_acc_digital_title()}</span>
								</div>

								<div
									class="flex items-center justify-between gap-3 rounded-xl border border-[#CCE6D6] bg-white p-3"
								>
									<div class="min-w-0">
										<div class="truncate text-xs font-bold text-[#0E2E25]">
											{product?.fileDownloadName || m.bu_acc_digital_fallback()}
										</div>
										<div class="text-[11px] text-gray-500">
											{product?.fileSize || m.bu_acc_digital_size_fallback()}
										</div>
									</div>

									<a
										href={product?.externalAccessUrl || '#'}
										onclick={(e) => {
											if (!product?.externalAccessUrl) {
												e.preventDefault();
												window.alert(m.bu_sh_download_started());
											}
										}}
										target="_blank"
										rel="noopener noreferrer"
										class="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-[#0C7B58] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#096649]"
									>
										<Download class="h-3.5 w-3.5" />
										<span>{m.bu_acc_download_file()}</span>
									</a>
								</div>

								{#if product?.accessInstructions}
									<div
										class="space-y-1 rounded-xl border border-[#D5EBDD] bg-white p-3 text-xs text-[#2D5347]"
									>
										<span class="block font-bold text-[#0C7B58]">
											{m.bu_acc_how_access()}
										</span>
										<p class="leading-relaxed">{product.accessInstructions}</p>
									</div>
								{/if}
							</div>
						</div>
					{:else if productType === 'session'}
						<div class="space-y-4">
							{#if order.fulfillmentStatus === 'dibatalkan'}
								<div
									class="space-y-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-900"
								>
									<div class="flex items-center gap-1.5 font-bold text-red-700">
										<X class="h-4 w-4" />
										<span>{m.bu_acc_cancel_title()}</span>
									</div>
									<p class="leading-relaxed text-red-800">
										{m.bu_acc_cancel_desc({
											party: partyLabel(order.cancelledBy)
										})}{order.cancellationReason
											? ` ${m.bu_acc_cancel_reason({ reason: order.cancellationReason })}`
											: ''}
									</p>
								</div>
							{:else}
								<div class="space-y-3 rounded-2xl border border-[#CCE6D6] bg-[#F2FAF5] p-4 text-xs">
									<div
										class="flex items-center gap-2 border-b border-[#D5EBDD] pb-2 font-bold text-[#0A3D2E]"
									>
										<Calendar class="h-4 w-4 text-[#0C7B58]" />
										<span>{m.bu_acc_sched_title()}</span>
									</div>

									<div class="space-y-2 text-[#18483B]">
										<div class="flex justify-between">
											<span class="text-gray-500">{m.bu_acc_date()}</span>
											<span class="font-bold text-[#0E2E25]">
												{order.bookingDateFormatted ||
													order.scheduledDate ||
													m.bu_acc_date_fallback()}
											</span>
										</div>
										<div class="flex justify-between">
											<span class="text-gray-500">{m.bu_acc_time()}</span>
											<span class="font-bold text-[#0C7B58]">
												{m.bu_acc_tz_suffix({
													time: order.bookingTimeFormatted || m.bu_acc_time_fallback()
												})}
											</span>
										</div>
										<div class="flex justify-between">
											<span class="text-gray-500">{m.bu_acc_duration()}</span>
											<span class="font-semibold text-[#0E2E25]">
												{m.bu_acc_duration_value({
													count:
														order.bookingDurationMinutes || product?.sessionDurationMinutes || 20
												})}
											</span>
										</div>
										<div class="flex justify-between">
											<span class="text-gray-500">{m.bu_acc_platform()}</span>
											<span class="font-semibold text-[#0E2E25]">{m.bu_sh_google_meet()}</span>
										</div>
									</div>

									<div class="space-y-2 border-t border-[#D5EBDD] pt-2">
										<div class="flex items-center gap-1 text-[11px] font-bold text-[#0A3D2E]">
											<Video class="h-3.5 w-3.5 text-[#0C7B58]" />
											<span>{m.bu_acc_meet_link()}</span>
										</div>
										{#if order.meetingLink}
											<div
												class="flex items-center justify-between gap-2 rounded-xl border border-[#CCE6D6] bg-white p-2.5"
											>
												<span class="truncate font-mono text-xs text-[#0C7B58]">
													{order.meetingLink}
												</span>
												<div class="flex shrink-0 items-center gap-1">
													<button
														type="button"
														onclick={() => void handleCopyLink(order?.meetingLink)}
														class="cursor-pointer rounded-lg p-1.5 text-xs text-[#0C7B58] hover:bg-[#EAF8F0]"
														title={m.bu_acc_copy_link()}
													>
														{#if copiedLink}
															<Check class="h-3.5 w-3.5 text-emerald-600" />
														{:else}
															<Copy class="h-3.5 w-3.5" />
														{/if}
													</button>
													<a
														href={order.meetingLink}
														target="_blank"
														rel="noopener noreferrer"
														class="inline-flex items-center gap-1 rounded-lg bg-[#0C7B58] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#096649]"
													>
														<span>{m.bu_acc_open_meet()}</span>
														<ExternalLink class="h-3 w-3" />
													</a>
												</div>
											</div>
										{:else}
											<div
												class="rounded-xl border border-[#CCE6D6] bg-white p-3 text-xs text-[#52776C] italic"
											>
												{m.bu_acc_meet_pending()}
											</div>
										{/if}
									</div>
								</div>
							{/if}

							{#if order.preparationAnswers && order.preparationAnswers.length > 0}
								<div class="space-y-2 rounded-2xl border border-[#E4EBE7] bg-white p-4 text-xs">
									<div class="font-bold text-[#0A3D2E]">{m.bu_acc_prep_title()}</div>
									{#each order.preparationAnswers as pa, i (i)}
										<div class="space-y-0.5 rounded-xl border border-[#D5EBDD] bg-[#FAFDFB] p-3">
											<div class="text-[11px] font-semibold text-[#184A3B]">{pa.question}</div>
											<div class="leading-relaxed text-[#0E2E25]">{pa.answer}</div>
										</div>
									{/each}
								</div>
							{/if}

							{#if booking?.rescheduleHistory && booking.rescheduleHistory.length > 0}
								<div class="space-y-2 rounded-2xl border border-[#E4EBE7] bg-white p-4 text-xs">
									<div class="flex items-center gap-1.5 font-bold text-[#0A3D2E]">
										<Clock class="h-3.5 w-3.5 text-[#0C7B58]" />
										<span>{m.bu_acc_resched_title()}</span>
									</div>
									{#each booking.rescheduleHistory as entry, i (i)}
										<div
											class="space-y-0.5 rounded-xl border border-[#D5EBDD] bg-[#FAFDFB] p-3 text-[#2D5347]"
										>
											<div class="font-semibold text-[#0E2E25]">
												{m.bu_acc_resched_entry({
													from: `${entry.previousDateFormatted || ''} ${entry.previousTimeFormatted || ''}`.trim(),
													to: `${entry.newDateFormatted || ''} ${entry.newTimeFormatted || ''}`.trim()
												})}
											</div>
											<div class="text-[11px]">
												{m.bu_acc_resched_by({ party: partyLabel(entry.rescheduledBy) })}
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{:else}
						<div class="space-y-4">
							<div class="space-y-3 rounded-2xl border border-[#CCE6D6] bg-[#F2FAF5] p-4 text-xs">
								<div class="flex items-center justify-between border-b border-[#D5EBDD] pb-2">
									<div class="flex items-center gap-1.5 font-bold text-[#0A3D2E]">
										<Clock class="h-4 w-4 text-[#0C7B58]" />
										<span>{m.bu_acc_service_status()}</span>
									</div>
									<span
										class="rounded-md border border-[#CCE6D6] bg-white px-2 py-0.5 font-bold text-[#0C7B58]"
									>
										{order.fulfillmentStatus === 'hasil_dikirim' ||
										order.fulfillmentStatus === 'selesai'
											? m.bu_acc_service_delivered()
											: m.bu_acc_service_progress()}
									</span>
								</div>

								{#if order.serviceDelivery}
									<div class="space-y-3 pt-1">
										<div class="space-y-2 rounded-xl border border-[#CCE6D6] bg-white p-3">
											<div class="text-xs font-bold text-[#0E2E25]">
												{m.bu_acc_service_result()}
											</div>
											{#if order.serviceDelivery.sellerMessage}
												<p class="text-xs text-[#2D5347] italic">
													"{order.serviceDelivery.sellerMessage}"
												</p>
											{/if}

											{#if order.serviceDelivery.method === 'upload' && order.serviceDelivery.fileName}
												<div
													class="flex items-center justify-between border-t border-gray-100 pt-2"
												>
													<span class="font-mono text-xs font-semibold text-[#0E2E25]">
														{order.serviceDelivery.fileName}
													</span>
													<button
														type="button"
														onclick={handleDownloadServiceFile}
														class="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-[#0C7B58] px-3 py-1 text-xs font-bold text-white hover:bg-[#096649]"
													>
														<Download class="h-3 w-3" />
														<span>{m.bu_acc_download()}</span>
													</button>
												</div>
											{/if}

											{#if order.serviceDelivery.method === 'link' && order.serviceDelivery.externalUrl}
												<div
													class="flex items-center justify-between border-t border-gray-100 pt-2"
												>
													<span class="max-w-[220px] truncate font-mono text-xs text-[#0C7B58]">
														{order.serviceDelivery.externalUrl}
													</span>
													<a
														href={order.serviceDelivery.externalUrl}
														target="_blank"
														rel="noopener noreferrer"
														class="inline-flex items-center gap-1 rounded-lg bg-[#0C7B58] px-3 py-1 text-xs font-bold text-white hover:bg-[#096649]"
													>
														<span>{m.bu_acc_open_link()}</span>
														<ExternalLink class="h-3 w-3" />
													</a>
												</div>
											{/if}

											{#if order.serviceDelivery.method === 'instruction' && order.serviceDelivery.instructions}
												<div class="space-y-1 border-t border-gray-100 pt-2">
													<div class="text-[11px] font-bold text-[#184A3B]">
														{m.bu_acc_seller_note()}
													</div>
													<div
														class="rounded-xl border border-[#CCE6D6] bg-[#FAFDFB] p-3 text-xs leading-relaxed whitespace-pre-wrap text-[#0E2E25]"
													>
														{order.serviceDelivery.instructions}
													</div>
												</div>
											{/if}
										</div>
									</div>
								{:else}
									<p class="text-xs leading-relaxed text-[#355B50]">
										{m.bu_acc_service_pending()}
									</p>
								{/if}
							</div>
						</div>
					{/if}

					<div class="space-y-3 rounded-2xl border border-[#CCE6D6] bg-[#FAFDFB] p-4 sm:p-5">
						<div class="flex items-center justify-between">
							<h3 class="text-xs font-bold tracking-wider text-[#0E2E25] uppercase">
								{m.bu_acc_review_title()}
							</h3>
							{#if currentReview}
								<span class="flex items-center gap-1 text-[11px] font-bold text-[#0C7B58]">
									<CheckCircle2 class="h-3.5 w-3.5" />
									<span>{m.bu_acc_review_saved()}</span>
								</span>
							{/if}
						</div>

						{#if currentReview}
							<div class="space-y-2 text-xs">
								<div
									class="flex items-center gap-1"
									role="img"
									aria-label={m.bu_acc_review_stars({ count: currentReview.rating })}
								>
									{#each [1, 2, 3, 4, 5] as star (star)}
										<Star
											class="h-4 w-4 {star <= currentReview.rating
												? 'fill-amber-400 text-amber-400'
												: 'text-gray-300'}"
										/>
									{/each}
									<span class="ml-1.5 text-xs font-bold text-gray-700">
										{currentReview.rating}.0
									</span>
								</div>
								<p class="rounded-xl border border-[#D5EBDD] bg-white p-3 text-[#2D5347] italic">
									"{currentReview.comment || m.bu_acc_review_fallback()}"
								</p>

								{#if currentReview.sellerReply}
									<div class="space-y-0.5 border-l-2 border-[#0C7B58] pl-3 text-xs">
										<div class="font-bold text-[#0C7B58]">
											{m.bu_acc_review_reply({
												name: sellerProfile?.name || m.bu_acc_seller_fallback()
											})}
										</div>
										<div class="text-[#0E2E25]">{currentReview.sellerReply.comment}</div>
									</div>
								{/if}
							</div>
						{:else if isFree}
							<p class="rounded-xl border border-[#CCE6D6] bg-white p-3 text-xs text-[#52776C]">
								{m.bu_acc_review_free_note()}
							</p>
						{:else if !isEligibleForReview}
							<p class="rounded-xl border border-[#CCE6D6] bg-white p-3 text-xs text-[#52776C]">
								{m.bu_acc_review_pending_note()}
							</p>
						{:else}
							<form onsubmit={handleSubmitReview} class="space-y-3 text-xs">
								<div>
									<span class="mb-1.5 block text-xs font-semibold text-[#184A3B]">
										{m.bu_acc_review_q({ title: order.productTitle })}
									</span>
									<div class="flex items-center gap-1">
										{#each [1, 2, 3, 4, 5] as star (star)}
											<button
												type="button"
												onclick={() => (rating = star)}
												onmouseenter={() => (hoverRating = star)}
												onmouseleave={() => (hoverRating = 0)}
												aria-label={m.bu_acc_star_aria({ count: star })}
												class="cursor-pointer p-1 transition-transform hover:scale-110"
											>
												<Star
													class="h-6 w-6 {star <= (hoverRating || rating)
														? 'fill-amber-400 text-amber-400'
														: 'text-gray-300 hover:text-amber-200'}"
												/>
											</button>
										{/each}
										<span class="ml-2 text-xs font-bold text-[#0C7B58]">
											{m.bu_acc_review_stars({ count: hoverRating || rating })}
										</span>
									</div>
								</div>

								<div>
									<label
										for="bu-acc-review-comment"
										class="mb-1 block text-xs font-semibold text-[#184A3B]"
									>
										{m.bu_acc_review_label()}
									</label>
									<textarea
										id="bu-acc-review-comment"
										rows="3"
										bind:value={reviewComment}
										placeholder={m.bu_acc_review_ph()}
										class="w-full rounded-xl border border-[#CCE6D6] bg-white p-2.5 text-xs text-[#0E2E25] focus:border-[#0C7B58] focus:outline-none"
									></textarea>
								</div>

								<div class="flex justify-end">
									<button
										type="submit"
										class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0C7B58] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#096649]"
									>
										<Send class="h-3.5 w-3.5" />
										<span>{m.bu_acc_review_submit()}</span>
									</button>
								</div>
							</form>
						{/if}
					</div>

					<div class="flex items-center justify-between pt-1">
						<button
							type="button"
							onclick={goStore}
							class="cursor-pointer text-xs font-bold text-[#0C7B58] hover:underline"
						>
							{m.bu_acc_visit_store()}
						</button>
					</div>
				</div>
			</div>
		{/if}
	</main>

	<footer class="border-t border-[#E5ECE7] bg-white py-6 text-center text-xs text-gray-400">
		<div class="mx-auto flex max-w-xl flex-col items-center justify-between gap-2 px-4 sm:flex-row">
			<div class="text-[11px] text-[#52776C]">
				{m.bu_acc_footer_prefix()} <span class="font-semibold text-[#0E2E25]">Karja</span>
				{m.bu_acc_footer_tagline()}
			</div>
			<button
				type="button"
				onclick={goHome}
				class="cursor-pointer text-[11px] font-medium text-[#0C7B58] hover:underline"
			>
				{m.bu_acc_footer_about()}
			</button>
		</div>
	</footer>
</div>
