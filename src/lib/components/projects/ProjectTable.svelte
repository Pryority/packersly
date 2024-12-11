<!-- src/routes/dashboard/components/projects/ProjectTable.svelte -->
<script lang="ts">
    import * as Table from "@components/ui/table/index";
    import * as DropdownMenu from "@components/ui/dropdown-menu/index.js";
    import { Badge } from "@components/ui/badge";
    import { cn, getTotalBoxes, getTotalItems } from "@utils";
    import FolderSymlink from "lucide-svelte/icons/folder-symlink";
    import Ellipsis from "lucide-svelte/icons/ellipsis";
    import { Button } from "@components/ui/button/index.js";
    import type { ProjectData } from "@types";
    import ArrowRight from "lucide-svelte/icons/arrow-right";
    import Cog from "lucide-svelte/icons/cog";

    const { projects }: { projects: ProjectData[] } = $props();
</script>

<Table.Root>
    <Table.Header>
        <Table.Row>
            <Table.Head>Project Name</Table.Head>
            <Table.Head class="hidden sm:table-cell">New Location</Table.Head>
            <Table.Head class="hidden sm:table-cell">Status</Table.Head>
            <Table.Head class="hidden md:table-cell">Created</Table.Head>
            <Table.Head class="hidden md:table-cell">Boxes</Table.Head>
            <Table.Head class="hidden md:table-cell">Items</Table.Head>
            <!-- <Table.Head class="text-right">View</Table.Head> -->
            <Table.Head>
                <span class="sr-only">Actions</span>
            </Table.Head>
        </Table.Row>
    </Table.Header>
    <Table.Body>
        {#each projects as project}
            <Table.Row>
                <Table.Cell>
                    <div class="font-medium">{project.name}</div>
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
                <Table.Cell class="hidden md:table-cell">
                    {getTotalBoxes(project)}
                    boxes
                </Table.Cell>
                <Table.Cell class="hidden md:table-cell">
                    {getTotalItems(project)} items
                </Table.Cell>
                <!-- <Table.Cell class="flex items-center justify-center">
                    <a
                        href={`/project/${project.handle}`}
                        class="mt-2"
                        data-sveltekit-preload-code="eager"
                    >
                        <FolderSymlink />
                    </a>
                </Table.Cell> -->
                <Table.Cell class="w-10">
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild let:builder>
                            <Button
                                aria-haspopup="true"
                                size="icon"
                                variant="outline"
                                class="group"
                                builders={[builder]}
                            >
                                <Cog
                                    class="h-4 w-4 group-hover:rotate-45 transition-all"
                                />
                                <span class="sr-only">Toggle menu</span>
                            </Button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content align="end">
                            <DropdownMenu.Label>Actions</DropdownMenu.Label>
                            <a href={`/project/${project.handle}`}>
                                <DropdownMenu.Item>View</DropdownMenu.Item>
                            </a>
                            <DropdownMenu.Item>Edit</DropdownMenu.Item>
                            <DropdownMenu.Item>Delete</DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                </Table.Cell>
                <Table.Cell class="w-10">
                    <a href={`/project/${project.handle}`} class="group">
                        <Button size="sm"
                            ><ArrowRight
                                size={16}
                                class="group-hover:translate-x-1 transition-all"
                            /></Button
                        >
                    </a>
                </Table.Cell>
            </Table.Row>
        {/each}
    </Table.Body>
</Table.Root>
