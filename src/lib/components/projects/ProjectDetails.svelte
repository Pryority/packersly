<!-- src/routes/dashboard/components/projects/ProjectDetails.svelte -->
<script lang="ts">
    import * as Card from "@components/ui/card";
    import { Button } from "@components/ui/button";
    import { Separator } from "@components/ui/separator";
    import * as DropdownMenu from "@components/ui/dropdown-menu";
    import Copy from "lucide-svelte/icons/copy";
    import EllipsisVertical from "lucide-svelte/icons/ellipsis-vertical";
    import QrCode from "lucide-svelte/icons/qr-code";
    import Box from "lucide-svelte/icons/box";
    import MapPinHouse from "lucide-svelte/icons/map-pin-house";
    import House from "lucide-svelte/icons/house";
    import Gem from "lucide-svelte/icons/gem";
    import FolderSymlink from "lucide-svelte/icons/folder-symlink";
    import { page } from "$app/stores";
    import type { Project } from "@db/schema/project";
    import type { Room } from "@db/schema/room";

    const { project } = $props();

    let projectBoxCount = $derived(
        project.rooms.reduce(
            (totalBoxCount: number, project: Project & { rooms: Room[] }) => {
                return (
                    totalBoxCount +
                    (project.rooms?.reduce(
                        (roomBoxCount: number, room: Room) =>
                            roomBoxCount + (room.boxCount ?? 0),
                        0,
                    ) ?? 0)
                );
            },
            0,
        ) ?? 0,
    );

    let projectItemCount = $derived(
        project.rooms.reduce(
            (totalItemCount: number, project: Project & { rooms: Room[] }) => {
                return (
                    totalItemCount +
                    (project.rooms?.reduce(
                        (roomBoxCount: number, room: Room) =>
                            roomBoxCount + (room.boxCount ?? 0),
                        0,
                    ) ?? 0)
                );
            },
            0,
        ) ?? 0,
    );
    // console.log(project);
</script>

<Card.Root class="overflow-hidden m-4">
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
            <!-- <Card.Description
                >Moving Date: {new Date(
                    project.date,
                ).toLocaleDateString()}</Card.Description
            > -->
        </div>

        <div class="ml-auto flex items-center gap-1">
            <!-- <Button size="sm" variant="outline" class="h-8 gap-1">
                <QrCode class="h-3.5 w-3.5" />
                <span>Generate QR Codes</span>
            </Button> -->
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
                    <div class="flex flex-col gap-1 sm:justify-between">
                        <span class="text-muted-foreground">From</span>
                        <div class="flex items-center gap-1">
                            <span>{project.fromAddress}</span>
                            <House size={16} />
                        </div>
                    </div>
                    <div class="flex flex-col gap-1 sm:justify-between">
                        <span class="text-muted-foreground">To</span>
                        <div class="flex items-center gap-1">
                            <span>{project.toAddress}</span>
                            <MapPinHouse size={16} />
                        </div>
                    </div>
                    <div class="flex flex-col gap-1 sm:justify-between">
                        <span class="text-muted-foreground">Total Boxes</span>
                        <div class="flex items-center gap-1">
                            <span>{projectBoxCount}</span>
                            <Box size={16} />
                        </div>
                    </div>
                    <div class="flex flex-col gap-1 sm:justify-between">
                        <span class="text-muted-foreground">Total Items</span>
                        <div class="flex items-center gap-1">
                            <span>{projectItemCount}</span>
                            <Gem size={16} />
                        </div>
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
                                    style="background-color: {room.colorCode}"
                                ></div>
                                <span>{room.name}</span>
                            </div>
                            <div class="flex items-center gap-4">
                                <span>{room.boxCount} boxes</span>
                                <a
                                    href={`${$page.url.pathname}/room/${room.handle}`}
                                >
                                    <FolderSymlink />
                                </a>
                                <!-- <span class="bg-black rounded-sm"
                                    ><QrCode class="invert" /></span
                                > -->
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    </Card.Content>
</Card.Root>
