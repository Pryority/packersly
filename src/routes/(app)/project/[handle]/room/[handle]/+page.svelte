<!-- src/routes/project/[handle]/room/[handle]/+page.svelte -->
<script lang="ts">
    import * as Dialog from "@components/ui/dialog";
    import * as Sheet from "@components/ui/sheet";
    import { Button } from "@components/ui/button/index.js";
    import * as Card from "@components/ui/card/index.js";
    import * as Table from "@components/ui/table/index.js";
    import { page } from "$app/stores";
    import CreateBoxForm from "@components/projects/CreateBoxForm.svelte";
    import type { BoxSchema } from "@routes/settings/zod/boxSchema.js";
    import {
        type SuperValidated,
        type Infer,
        superForm,
    } from "sveltekit-superforms";
    import { goto } from "$app/navigation";
    import { zodClient } from "sveltekit-superforms/adapters";
    import type { ActionResult } from "@sveltejs/kit";
    import { boxSchema } from "@routes/settings/zod";
    import { cn } from "@utils";

    const {
        data,
    }: {
        data: {
            room: any;
            form: SuperValidated<Infer<BoxSchema>>;
        };
    } = $props();

    const form = superForm(data.form, {
        validators: zodClient(boxSchema),
        dataType: "json",
        taintedMessage: null,
        onSubmit: ({ cancel }) => {
            submitting = true;
            return async ({ result }: { result: ActionResult }) => {
                if (result.type === "error" || result.type === "failure") {
                    submitting = false;
                    dialogOpen = false;
                    sheetOpen = false;
                    cancel();
                }
            };
        },
        onError: () => {
            submitting = false;
        },
        onResult: () => {
            submitting = false;
        },
    });

    let dialogOpen = $state(false);
    let sheetOpen = $state(false);
    let submitting = $state(false);

    function openForm() {
        const isMobile = window.innerWidth < 768;
        dialogOpen = !isMobile;
        sheetOpen = isMobile;
    }
</script>

<Card.Root class="m-4">
    <Card.Header
        class={cn(
            data.room.boxes && data.room.boxes.length === 0 ? "pb-4" : "",
        )}
    >
        <Card.Title>{data.room.name}</Card.Title>
        <Card.Description
            >Manage boxes in this room.
            {#if data.room.boxes.length > 0}
                <br />Click on a row in the table to view the box.
            {/if}</Card.Description
        >
    </Card.Header>
    {#if data.room.boxes && data.room.boxes.length > 0}
        <Card.Content>
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <!-- <Table.Head>ID</Table.Head> -->
                        <Table.Head>QR Code</Table.Head>
                        <!-- <Table.Head class="max-md:text-center">Boxes</Table.Head -->

                        <Table.Head class="max-md:text-center">Items</Table.Head
                        >
                        <!-- <Table.Head>Contents</Table.Head> -->
                        <!-- <Table.Head>Notes</Table.Head> -->
                        <!-- <Table.Head>
                        <span class="sr-only">Actions</span>
                    </Table.Head> -->
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {#each data.room.boxes as box}
                        <Table.Row
                            on:click={() =>
                                goto(`${$page.url.pathname}/box/${box.id}`)}
                        >
                            <Table.Cell>
                                {#if box.qrCode}
                                    <div class="w-16 h-16 md:w-32 md:h-32">
                                        {@html box.qrCode.replace(
                                            "<svg",
                                            '<svg class="h-full w-full"',
                                        )}
                                    </div>
                                {/if}</Table.Cell
                            >

                            <!-- <Table.Cell>
                                <span class="text-center md:text-start">
                                    {data.room.boxes.length}
                                </span>
                            </Table.Cell> -->

                            <Table.Cell>
                                <span class="text-center md:text-start">
                                    {#if box.items}
                                        {box.items.length}
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
                Showing <strong>{data.room.boxes.length}</strong> boxes
            </div>
        </Card.Footer>
    {/if}
</Card.Root>

<Button
    type="button"
    on:click={openForm}
    class="sticky bottom-2 mx-8 md:mx-[40vw]"
>
    Create a Box
</Button>

<Dialog.Root bind:open={dialogOpen} onOpenChange={(isOpen) => !isOpen}>
    <Dialog.Portal class="hidden md:block">
        <Dialog.Overlay
            class="bg-background/80 backdrop-blur-sm animate-in fade-in"
        />
        <Dialog.Content class="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
            <Dialog.Header class="top-0 z-10 pb-4 max-w-fit">
                <Dialog.Title>Add a Box to Room</Dialog.Title>
                <Dialog.Description class="flex flex-col gap-4">
                    Update your room. Add boxes with items for easy
                    organization.
                    <span class="flex items-center gap-2">
                        <strong class="max-md:text-xs">Room Name:</strong>
                        <span class="mad-md:text-xs">
                            {data.room.name}
                        </span>
                    </span>
                    <span class="flex items-center gap-2">
                        <strong class="max-md:text-xs">Room Color Code:</strong>
                        <span
                            class="h-4 w-4 rounded-sm"
                            style={`background-color: ${data.room.colorCode}`}
                        ></span>
                        <span class="mad-md:text-xs">
                            {data.room.colorCode}
                        </span>
                    </span>
                </Dialog.Description>
            </Dialog.Header>
            <div>
                <CreateBoxForm {form} bind:submitting />
            </div>
        </Dialog.Content>
    </Dialog.Portal>
</Dialog.Root>

<Sheet.Root bind:open={sheetOpen} onOpenChange={(isOpen) => !isOpen}>
    <Sheet.Content side="bottom" class="md:hidden max-h-[90vh] overflow-y-auto">
        <Sheet.Header class="mb-4">
            <Sheet.Title>Add a Box to Room</Sheet.Title>
            <Sheet.Description class="flex flex-col gap-4 text-xs">
                Update your room. Add boxes with items for easy organization.<br
                />
                <span class="flex justify-between">
                    <span class="flex items-center gap-2">
                        <strong class="max-md:text-xs md:hidden">Room:</strong>
                        <span class="mad-md:text-xs">
                            {data.room.name}
                        </span>
                    </span>
                    <span class="flex items-center gap-2">
                        <strong class="max-md:text-xs">Color:</strong>
                        <span
                            class="h-4 w-4 rounded-sm"
                            style={`background-color: ${data.room.colorCode}`}
                        ></span>
                        <span class="mad-md:text-xs">
                            {data.room.colorCode}
                        </span>
                    </span>
                </span>
            </Sheet.Description>
        </Sheet.Header>
        <CreateBoxForm {form} bind:submitting />
    </Sheet.Content>
</Sheet.Root>
