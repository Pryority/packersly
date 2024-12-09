<!-- src/routes/dashboard/+page.svelte -->
<script lang="ts">
    import Dashboard from "@components/dashboard/Dashboard.svelte";
    const { data } = $props();
</script>

{#if data.user}
    <Dashboard user={data.user} />
{:else}
    <p>Loading...</p>
{/if}
