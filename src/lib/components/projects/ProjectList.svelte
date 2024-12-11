<!-- src/routes/dashboard/components/projects/ProjectList.svelte -->
<script lang="ts">
    import * as Card from "@components/ui/card";
    import * as Tabs from "@components/ui/tabs";
    import { ProjectFilters, ProjectTable } from "@components/projects";
    import type { Project } from "@server/db/schema/project";

    const { allProjects }: { allProjects: Project[] } = $props();

    // State for the active tab
    let activeTab = $state("all");

    // Filtered projects
    let projects = $state<Project[] | []>([]);

    // Effect to update filtered projects when activeTab changes
    $effect(() => {
        if (activeTab === "active") {
            projects = allProjects.filter((p) => p.status === "active");
        } else if (activeTab === "draft") {
            projects = allProjects.filter((p) => p.status === "draft");
        } else if (activeTab === "completed") {
            projects = allProjects.filter((p) => p.status === "completed");
        } else {
            projects = allProjects; // Default to all projects
        }
    });

    // Update the active tab
    const setTab = (value: string | undefined) => {
        activeTab = value ?? "all";
    };
</script>

<Tabs.Root value={activeTab} onValueChange={setTab}>
    <div class="flex items-center">
        <Tabs.List class="w-full">
            <Tabs.Trigger value="all">All</Tabs.Trigger>
            <Tabs.Trigger value="active">Active</Tabs.Trigger>
            <Tabs.Trigger value="draft">Draft</Tabs.Trigger>
            <Tabs.Trigger value="completed">Completed</Tabs.Trigger>
        </Tabs.List>
        <!-- <div class="ml-auto">
            <ProjectFilters />
        </div> -->
    </div>
</Tabs.Root>

<Card.Root class="min-w-0">
    <Card.Header class="px-7">
        <Card.Title>Projects</Card.Title>
        <Card.Description>
            Manage your moving projects and track their progress.
        </Card.Description>
    </Card.Header>
    <Card.Content>
        <ProjectTable {projects} />
    </Card.Content>
</Card.Root>
