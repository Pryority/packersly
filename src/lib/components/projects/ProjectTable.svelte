<!-- src/routes/dashboard/components/projects/ProjectTable.svelte -->
<script lang="ts">
    import * as Table from "@components/ui/table/index";
    import * as DropdownMenu from "@components/ui/dropdown-menu/index.js";
    import { Badge } from "@components/ui/badge";
    import { cn, getTotalBoxes, getTotalItems, getTotalRooms } from "@utils";
    import FolderSymlink from "lucide-svelte/icons/folder-symlink";
    import Ellipsis from "lucide-svelte/icons/ellipsis";
    import { Button } from "@components/ui/button/index.js";
    import type { ProjectData } from "@types";
    import ArrowRight from "lucide-svelte/icons/arrow-right";
    import Cog from "lucide-svelte/icons/cog";
    import { goto } from "$app/navigation";

    const { projects }: { projects: ProjectData[] } = $props();
</script>

<Table.Root>
    <Table.Header>
        <Table.Row>
            <Table.Head>Name</Table.Head>
            <Table.Head class="hidden sm:table-cell">New Location</Table.Head>
            <Table.Head class="hidden sm:table-cell">Status</Table.Head>
            <Table.Head class="hidden md:table-cell">Created</Table.Head>
            <Table.Head>Rooms</Table.Head>
            <Table.Head>Boxes</Table.Head>
            <Table.Head>Items</Table.Head>
            <!-- <Table.Head class="text-right">View</Table.Head> -->
            <!-- <Table.Head>
                <span class="sr-only">Actions</span>
            </Table.Head> -->
            <!-- <Table.Head>
                <span class="sr-only">View Project</span>
            </Table.Head> -->
        </Table.Row>
    </Table.Header>
    <Table.Body>
        {#each projects as project}
            <Table.Row on:click={() => goto(`/project/${project.handle}`)}>
                <Table.Cell>
                    <div class="font-medium max-md:truncate max-md:max-w-20">
                        {project.name}
                    </div>
                    <div class="text-muted-foreground hidden text-sm md:inline">
                        {project.fromAddress}
                    </div>
                </Table.Cell>
                <Table.Cell class="hidden sm:table-cell">
                    {project.toAddress}
                </Table.Cell>
                <Table.Cell class="hidden sm:table-cell">
                    <Badge
                        class={cn(
                            "capitalize",
                            project.status === "active"
                                ? "bg-amber-200"
                                : project.status === "completed"
                                  ? "bg-lime-700 text-primary-foreground"
                                  : "",
                        )}
                        variant={project.status === "active"
                            ? "secondary"
                            : "outline"}
                    >
                        {project.status}
                    </Badge>
                </Table.Cell>
                <Table.Cell class="hidden md:table-cell">
                    {new Date(project.createdAt).toLocaleDateString()}
                </Table.Cell>
                <Table.Cell class="max-md:w-2">
                    {getTotalRooms(project)}
                </Table.Cell>
                <Table.Cell>
                    {getTotalBoxes(project)}
                </Table.Cell>
                <Table.Cell>
                    {getTotalItems(project)}
                </Table.Cell>
            </Table.Row>
        {/each}
    </Table.Body>
</Table.Root>
