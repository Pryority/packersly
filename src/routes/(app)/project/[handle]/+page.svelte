<!-- src/routes/project/[handle]/+page.svelte -->
<script lang="ts">
    // import ProjectDetails from "@components/projects/ProjectDetails.svelte";
    // import Ellipsis from "lucide-svelte/icons/ellipsis";
    import * as Dialog from "@components/ui/dialog";
    import * as Sheet from "@components/ui/sheet";
    import { Button } from "@components/ui/button/index.js";
    import * as Card from "@components/ui/card/index.js";
    // import * as DropdownMenu from "@components/ui/dropdown-menu/index.js";
    import * as Table from "@components/ui/table/index.js";
    import { page } from "$app/stores";
    import CreateBoxForm from "@components/projects/CreateBoxForm.svelte";
    import type { Room } from "@db/schema";
    import { roomSchema, type RoomSchema } from "@routes/settings/zod";
    import {
        type SuperValidated,
        type Infer,
        superForm,
    } from "sveltekit-superforms";
    import { zodClient } from "sveltekit-superforms/adapters";
    import { goto } from "$app/navigation";
    import type { ProjectData } from "@types";
    import { getTotalBoxes } from "@utils";
    import CreateRoomForm from "@components/projects/CreateRoomForm.svelte";
    import type { ActionResult } from "@sveltejs/kit";

    const {
        data,
    }: {
        data: {
            project: ProjectData;
            rooms: Room[];
            form: SuperValidated<Infer<RoomSchema>>;
        };
    } = $props();

    let dialogOpen = $state(false);
    let sheetOpen = $state(false);
    let submitting = $state(false);

    const form = superForm(data.form, {
        validators: zodClient(roomSchema),
        dataType: "json",
        taintedMessage: null,
        onSubmit: ({ cancel }) => {
            submitting = true;
            return async ({ result }: { result: ActionResult }) => {
                if (result.type === "error" || result.type === "failure") {
                    submitting = false;
                    cancel();
                }
                // Don't handle redirect here - let SvelteKit handle it
            };
        },
        onError: () => {
            submitting = false;
        },
    });

    function openForm() {
        const url = new URL($page.url);
        url.searchParams.set("new", "true");
        goto(url.toString(), { replaceState: true });
    }

    function closeForm() {
        const url = new URL($page.url);
        url.searchParams.delete("new");
        goto(url.toString(), { replaceState: true });
    }

    $effect(() => {
        // Close dialog and show success message if project was created
        if ($page.url.searchParams.has("success")) {
            dialogOpen = false;
            sheetOpen = false;
            // Optionally show a success toast/notification here

            // Clean up the URL
            const url = new URL($page.url);
            url.searchParams.delete("success");
            goto(url.toString(), { replaceState: true });
        } else {
            // Normal dialog open/close handling
            const isMobile = window.innerWidth < 768; // matches your md: breakpoint
            dialogOpen = !isMobile && $page.url.searchParams.has("new");
            sheetOpen = isMobile && $page.url.searchParams.has("new");
        }
    });
</script>

<!-- <ProjectDetails project={data.project} /> -->

<Card.Root class="m-4">
    <Card.Header>
        <Card.Title>{data.project.name}</Card.Title>
        <Card.Description>
            Manage boxes in this room.<br />Click on a row in the table to view
            the room.
        </Card.Description>
    </Card.Header>
    <Card.Content>
        <Table.Root>
            <Table.Header>
                <Table.Row>
                    <Table.Head>Name</Table.Head>
                    <Table.Head class="max-md:text-center">Boxes</Table.Head>
                    <Table.Head class="max-md:text-center">Items</Table.Head>
                    <!-- <Table.Head>Contents</Table.Head> -->
                    <!-- <Table.Head>Notes</Table.Head> -->
                    <!-- <Table.Head>
                        <span class="sr-only">Actions</span>
                    </Table.Head> -->
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {#each data.project.rooms as room}
                    <Table.Row
                        on:click={() =>
                            goto(`${$page.url.pathname}/room/${room.handle}`)}
                    >
                        <Table.Cell>{room.name}</Table.Cell>

                        <Table.Cell>
                            <span class="text-center md:text-start">
                                {#if room.boxes}
                                    {room.boxes.length}
                                {:else}
                                    0
                                {/if}
                            </span>
                        </Table.Cell>

                        <!-- <Table.Cell>
                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger asChild let:builder>
                                    <Button
                                        aria-haspopup="true"
                                        size="icon"
                                        variant="ghost"
                                        builders={[builder]}
                                    >
                                        <Ellipsis class="h-4 w-4" />
                                        <span class="sr-only">Toggle menu</span>
                                    </Button>
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Content align="end">
                                    <DropdownMenu.Label
                                        >Actions</DropdownMenu.Label
                                    >
                                    <DropdownMenu.Item>
                                        <a
                                            href={`${$page.url.pathname}/box/${box.id}`}
                                        >
                                            View
                                        </a>
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item>Edit</DropdownMenu.Item>
                                    <DropdownMenu.Item>Delete</DropdownMenu.Item
                                    >
                                </DropdownMenu.Content>
                            </DropdownMenu.Root>
                        </Table.Cell> -->
                    </Table.Row>
                {/each}
            </Table.Body>
        </Table.Root>
    </Card.Content>
    <Card.Footer>
        <div class="text-muted-foreground text-xs">
            Showing <strong>
                {getTotalBoxes(data.project)}
            </strong> boxes
        </div>
    </Card.Footer>
</Card.Root>

<Button
    type="button"
    on:click={openForm}
    class="sticky bottom-2 mx-8 md:mx-[40vw]"
>
    Create a Room
</Button>

<Dialog.Root
    bind:open={dialogOpen}
    onOpenChange={(isOpen) => !isOpen && closeForm()}
>
    <Dialog.Portal class="hidden md:block">
        <Dialog.Overlay
            class="bg-background/80 backdrop-blur-sm animate-in fade-in"
        />
        <Dialog.Content class="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
            <Dialog.Header class="top-0 max-w-fit z-10 pb-4">
                <Dialog.Title>Create New Room</Dialog.Title>
                <Dialog.Description>
                    Update your existing project. Add rooms with boxes with
                    colors and items to organize.
                </Dialog.Description>
            </Dialog.Header>
            <div>
                <CreateRoomForm {form} {submitting} />
            </div>
        </Dialog.Content>
    </Dialog.Portal>
</Dialog.Root>

<Sheet.Root
    bind:open={sheetOpen}
    onOpenChange={(isOpen) => !isOpen && closeForm()}
>
    <Sheet.Content
        side="bottom"
        class="md:hidden max-h-[90vh]  overflow-y-auto"
    >
        <Sheet.Header class="mb-4">
            <Sheet.Title>Create New Room</Sheet.Title>
            <Sheet.Description class="text-xs">
                Update your existing project. Add rooms with boxes with colors
                and items to organize.
            </Sheet.Description>
        </Sheet.Header>
        <CreateRoomForm {form} {submitting} />
    </Sheet.Content>
</Sheet.Root>
