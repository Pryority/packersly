<!-- src/routes/dashboard/+page.svelte -->
<script lang="ts">
    import { ProjectStats } from "@components/stats";
    import { ProjectList } from "@components/projects";

    const { data } = $props();
    // console.log("Page Data:", data);
</script>

<main class="grid flex-1 gap-4 p-4 sm:gap-8">
    <div class="hidden md:flex flex-col gap-4 min-w-0">
        <ProjectStats data={data.form} projects={data.projects} />
        <ProjectList allProjects={data.projects} />
    </div>
    <div class="flex flex-col gap-4 min-w-0 md:hidden">
        <ProjectList allProjects={data.projects} />
        <ProjectStats data={data.form} projects={data.projects} />
    </div>
</main>
