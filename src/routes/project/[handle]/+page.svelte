<script>
    import ProjectDetails from "@components/projects/ProjectDetails.svelte";
    const { data } = $props();
</script>

<ProjectDetails project={data.project} />
