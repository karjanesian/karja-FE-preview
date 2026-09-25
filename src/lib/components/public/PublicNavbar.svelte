<script lang="ts">
	import { goto } from '$app/navigation';
	import Logo from '$lib/components/common/Logo.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { seller } from '$lib/stores/seller.svelte';
	import LocaleSwitcher from '../layout/LocaleSwitcher.svelte';

	type Props = {
		activePage?: 'home' | 'blog' | 'other';
	};
	let { activePage = 'other' }: Props = $props();

	let scrolled = $state(false);

	const authHref = $derived(seller.isAuthenticated ? '/dashboard' : '/login');

	$effect(() => {
		const handleScroll = () => {
			scrolled = window.scrollY > 20;
		};
		handleScroll();
		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	});
</script>

<header
	class="sticky top-0 z-50 transition-all duration-300 {scrolled
		? 'border-b border-[#E8ECE9] bg-[#FAFDFB]/95 shadow-2xs backdrop-blur-md'
		: 'border-b border-transparent bg-[#FAFDFB]'}"
>
	<div
		class="mx-auto flex h-[74px] max-w-7xl items-center justify-between px-5 sm:h-20 sm:px-6 lg:px-8"
	>
		<div class="flex items-center gap-6 sm:gap-8">
			<a
				href="/"
				class="rounded-lg p-0.5 transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008A5E]"
				aria-label="Karja"
				aria-current={activePage === 'home' ? 'page' : undefined}
			>
				<Logo size="md" />
			</a>

			<nav class="flex items-center text-sm font-medium text-[#4A5852]" aria-label="Karja">
				<a
					href="/blog"
					class="rounded-lg px-2.5 py-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008A5E] {activePage ===
					'blog'
						? 'bg-[#E8F5F0]/70 font-bold text-[#0A261D]'
						: 'hover:text-[#0A261D]'}"
					aria-current={activePage === 'blog' ? 'page' : undefined}>{m.pu_nav_blog()}</a
				>
			</nav>
		</div>

		<div class="flex items-center gap-4">
			<LocaleSwitcher compact />
			<button
				type="button"
				onclick={() => void goto(authHref)}
				class="hidden cursor-pointer rounded-xl bg-[#008A5E] px-4 py-2 text-sm font-semibold whitespace-nowrap text-white shadow-2xs transition-all hover:bg-[#007550] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008A5E] active:scale-98 sm:py-2.5"
			>
				{#if seller.isAuthenticated}
					{m.pu_nav_start()}
				{:else}
					{m.pu_nav_login()}
				{/if}
			</button>
		</div>
	</div>
</header>
