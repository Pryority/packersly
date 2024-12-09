<!-- src/routes/dashboard/components/projects/ProjectList.svelte -->
<script lang="ts">
    import * as Card from "@components/ui/card";
    import * as Tabs from "@components/ui/tabs";
    import { ProjectFilters, ProjectTable } from "@components/projects";
    import type { Project } from "@server/db/schema/project";

    // State for the active tab
    let activeTab = $state("all");

    // Sample project data
    const allProjects: Project[] = [
        {
            id: "1",
            userId: "user_123",
            name: "Move to 123 Main St",
            fromAddress: "456 Oak Ave",
            toAddress: "123 Main St",
            status: "active",
            boxCount: 15,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: "2",
            userId: "user_123",
            name: "Move to Summer House",
            fromAddress: "789 Pine St",
            toAddress: "321 Beach Rd",
            status: "draft",
            boxCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: "3",
            userId: "user_123",
            name: "Office Relocation",
            fromAddress: "101 Business Ave",
            toAddress: "202 Commerce St",
            status: "completed",
            boxCount: 25,
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
        },
    ];

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
        <Tabs.List>
            <Tabs.Trigger value="all">All</Tabs.Trigger>
            <Tabs.Trigger value="active">Active</Tabs.Trigger>
            <Tabs.Trigger value="draft">Draft</Tabs.Trigger>
            <Tabs.Trigger value="completed">Completed</Tabs.Trigger>
        </Tabs.List>
        <div class="ml-auto">
            <ProjectFilters />
        </div>
    </div>
</Tabs.Root>

<Card.Root>
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
