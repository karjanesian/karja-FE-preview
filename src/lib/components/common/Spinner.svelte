<script lang="ts">
	interface Props {
		class?: string;
		label?: string;
	}

	let { class: className = 'h-4 w-4', label = '' }: Props = $props();
</script>

<span
	class="inline-block shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent {className}"
	role="status"
	aria-label={label || undefined}
></span>
