<!-- src/routes/dashboard/+page.svelte -->
<script lang="ts">
    import { ProjectStats } from "@components/stats";
    import { ProjectList } from "@components/projects";

    const { data } = $props();
    console.log("Page Data:", data);
</script>

<main class="grid flex-1 gap-4 p-4 sm:gap-8 lg:grid-cols-3 xl:grid-cols-3">
    <div class="flex flex-col gap-4 lg:col-span-2 md:gap-8 min-w-0">
        <ProjectStats data={data.form} projects={data.projects} />
        <ProjectList allProjects={data.projects} />
    </div>
</main>
