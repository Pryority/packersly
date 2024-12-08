<!-- src/routes/dashboard/components/projects/ProjectDetails.svelte -->
<script lang="ts">
    import * as Card from "@components/ui/card";
    import { Button } from "@components/ui/button";
    import { Separator } from "@components/ui/separator";
    import * as DropdownMenu from "@components/ui/dropdown-menu";
    import { Copy, Truck, EllipsisVertical, Box, QrCode } from "lucide-svelte";

    const { projectId } = $props();

    // This would come from your data store
    const project = {
        id: "proj_123",
        name: "Move to 123 Main St",
        date: "2024-12-15",
        status: "active",
        fromAddress: "456 Oak Ave",
        toAddress: "123 Main St",
        rooms: [
            { name: "Living Room", boxCount: 5, color: "green" },
            { name: "Kitchen", boxCount: 8, color: "blue" },
            // ... more rooms
        ],
        totalBoxes: 13,
    };
</script>

<Card.Root class="overflow-hidden">
    <Card.Header class="bg-muted/50 flex flex-row items-start">
        <div class="grid gap-0.5">
            <Card.Title class="group flex items-center gap-2 text-lg">
                {project.name}
                <Button
                    size="icon"
                    variant="outline"
                    class="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                >
                    <Copy class="h-3 w-3" />
                    <span class="sr-only">Copy Project ID</span>
                </Button>
            </Card.Title>
            <Card.Description
                >Moving Date: {new Date(
                    project.date,
                ).toLocaleDateString()}</Card.Description
            >
        </div>

        <div class="ml-auto flex items-center gap-1">
            <Button size="sm" variant="outline" class="h-8 gap-1">
                <QrCode class="h-3.5 w-3.5" />
                <span>Generate QR Codes</span>
            </Button>
            <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild let:builder>
                    <Button
                        builders={[builder]}
                        size="icon"
                        variant="outline"
                        class="h-8 w-8"
                    >
                        <EllipsisVertical class="h-3.5 w-3.5" />
                        <span class="sr-only">More</span>
                    </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end">
                    <DropdownMenu.Item>Edit Project</DropdownMenu.Item>
                    <DropdownMenu.Item>Export Labels</DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item class="text-destructive"
                        >Delete Project</DropdownMenu.Item
                    >
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        </div>
    </Card.Header>

    <Card.Content class="p-6">
        <div class="grid gap-6">
            <div class="grid gap-3">
                <h3 class="font-semibold">Project Details</h3>
                <div class="grid gap-2">
                    <div class="flex justify-between">
                        <span class="text-muted-foreground">From</span>
                        <span>{project.fromAddress}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-muted-foreground">To</span>
                        <span>{project.toAddress}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-muted-foreground">Total Boxes</span>
                        <span>{project.totalBoxes}</span>
                    </div>
                </div>
            </div>

            <Separator />

            <div class="grid gap-3">
                <h3 class="font-semibold">Rooms</h3>
                <div class="grid gap-2">
                    {#each project.rooms as room}
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <div
                                    class="h-3 w-3 rounded-full"
                                    style="background-color: {room.color}"
                                ></div>
                                <span>{room.name}</span>
                            </div>
                            <span>{room.boxCount} boxes</span>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    </Card.Content>
</Card.Root>
