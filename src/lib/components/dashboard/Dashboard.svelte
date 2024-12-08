<!-- src/lib/components/dashboard/Dashboard.svelte -->
<script lang="ts">
    import {
        DashboardHeader,
        DashboardSidebar,
        MobileNav,
    } from "@components/layout";
    import { ProjectStats } from "@components/stats";
    import { ProjectList, ProjectDetails } from "@components/projects";
    import { SearchBar } from "@components/common";

    // You might want to load this data from your server
    let selectedProjectId: string | null = null;
</script>

<div class="bg-muted/40 flex min-h-screen w-full flex-col">
    <DashboardSidebar />
    <div class="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <DashboardHeader />
        <main
            class="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3"
        >
            <div
                class="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2"
            >
                <ProjectStats />
                <ProjectList
                    on:projectSelect={(e) => (selectedProjectId = e.detail)}
                />
            </div>
            <div>
                {#if selectedProjectId}
                    <ProjectDetails projectId={selectedProjectId} />
                {:else}
                    <!-- Maybe show a placeholder or welcome message -->
                    <div class="text-muted-foreground p-4 text-center">
                        Select a project to view details
                    </div>
                {/if}
            </div>
        </main>
    </div>
</div>
