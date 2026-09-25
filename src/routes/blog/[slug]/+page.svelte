<script lang="ts">
	import { page } from '$app/state';
	import BlogArticle from '$lib/components/blog/BlogArticle.svelte';
</script>

<BlogArticle slug={page.params.slug ?? ''} />
