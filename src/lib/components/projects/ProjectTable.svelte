<!-- src/routes/dashboard/components/projects/ProjectTable.svelte -->
<script lang="ts">
    import * as Table from "@components/ui/table/index";
    import { Badge } from "@components/ui/badge";

    const { projects } = $props();
</script>

<Table.Root>
    <Table.Header>
        <Table.Row>
            <Table.Head>Project Name</Table.Head>
            <Table.Head class="hidden sm:table-cell">Location</Table.Head>
            <Table.Head class="hidden sm:table-cell">Status</Table.Head>
            <Table.Head class="hidden md:table-cell">Created</Table.Head>
            <Table.Head class="text-right">Boxes</Table.Head>
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
                        class="capitalize"
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
                <Table.Cell class="text-right">
                    {project.boxCount || 0} boxes
                </Table.Cell>
            </Table.Row>
        {/each}
    </Table.Body>
</Table.Root>
