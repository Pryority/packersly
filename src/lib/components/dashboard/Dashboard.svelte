<!-- src/routes/dashboard/+page.svelte -->
<script lang="ts">
    import { DashboardHeader, DashboardSidebar } from "@components/layout";
    import { ProjectStats } from "@components/stats";
    import { ProjectList } from "@components/projects";
    const { user, projects, form } = $props();
</script>

<div class="bg-muted/40 flex min-h-screen w-full flex-col">
    <DashboardSidebar />
    <div class="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <DashboardHeader {user} />
        <main
            class="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3"
        >
            <div
                class="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2"
            >
                <ProjectStats {form} {projects} />
                <ProjectList allProjects={projects} />
            </div>
            <div>
                <!-- Project Details Component will go here -->
            </div>
        </main>
    </div>
</div>
