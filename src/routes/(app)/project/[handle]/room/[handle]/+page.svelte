<!-- src/routes/project/[handle]/room/[handle]/+page.svelte -->
<script lang="ts">
    import Ellipsis from "lucide-svelte/icons/ellipsis";
    import * as Dialog from "@components/ui/dialog";
    import * as Sheet from "@components/ui/sheet";
    import { Button } from "@components/ui/button/index.js";
    import * as Card from "@components/ui/card/index.js";
    import * as DropdownMenu from "@components/ui/dropdown-menu/index.js";
    import * as Table from "@components/ui/table/index.js";
    import { page } from "$app/stores";
    import CreateBoxForm from "@components/projects/CreateBoxForm.svelte";
    import type { Box } from "lucide-svelte";
    import type { Room } from "@db/schema/room.js";
    import type { BoxSchema } from "@routes/settings/zod/boxSchema.js";
    import {
        type SuperValidated,
        type Infer,
        superForm,
    } from "sveltekit-superforms";
    import { goto } from "$app/navigation";

    const {
        data,
    }: {
        data: {
            room: Room;
            boxes: Box[];
            form: SuperValidated<Infer<BoxSchema>>;
        };
    } = $props();

    // Then use props.data.room and props.data.boxes in your template

    let open = $state(false);
    let submitting = $state(false);

    function openForm() {
        const url = new URL($page.url);
        url.searchParams.set("new", "true");
        goto(url.toString(), { replaceState: true });
    }

    function closeForm() {
        goto("/dashboard", { replaceState: true });
    }

    $effect(() => {
        // Close dialog and show success message if project was created
        if ($page.url.searchParams.has("success")) {
            open = false;
            // Optionally show a success toast/notification here

            // Clean up the URL
            const url = new URL($page.url);
            url.searchParams.delete("success");
            goto(url.toString(), { replaceState: true });
        } else {
            // Normal dialog open/close handling
            open = $page.url.searchParams.has("new");
        }
    });
</script>

<Card.Root class="m-4">
    <Card.Header>
        <Card.Title>{data.room.name}</Card.Title>
        <Card.Description>Manage boxes in this room.</Card.Description>
    </Card.Header>
    <Card.Content>
        <Table.Root>
            <Table.Header>
                <Table.Row>
                    <!-- <Table.Head>ID</Table.Head> -->
                    <Table.Head>QR Code</Table.Head><Table.Head
                        >Item Count</Table.Head
                    >
                    <!-- <Table.Head>Contents</Table.Head> -->
                    <!-- <Table.Head>Notes</Table.Head> -->
                    <Table.Head>
                        <span class="sr-only">Actions</span>
                    </Table.Head>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {#each data.boxes as box}
                    <Table.Row>
                        <!-- <Table.Cell>{box.id.slice(0, 8)}</Table.Cell> -->
                        <Table.Cell>{box.qrCode}</Table.Cell>
                        <Table.Cell>{box.items.length}</Table.Cell>
                        <Table.Cell>{box.notes}</Table.Cell>
                        <Table.Cell>
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
                        </Table.Cell>
                    </Table.Row>
                {/each}
            </Table.Body>
        </Table.Root>
    </Card.Content>
    <Card.Footer>
        <div class="text-muted-foreground text-xs">
            Showing <strong>{data.boxes.length}</strong> boxes
        </div>
    </Card.Footer>
</Card.Root>

<Button type="button" on:click={openForm} class="sticky bottom-2 mx-4"
    >Create a Box</Button
>

<Dialog.Root bind:open onOpenChange={(isOpen) => !isOpen && closeForm()}>
    <Dialog.Portal class="hidden md:block">
        <Dialog.Overlay
            class="bg-background/80 backdrop-blur-sm animate-in fade-in"
        />
        <Dialog.Content class="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
            <Dialog.Header class=" top-0 bg-background z-10 pb-4">
                <Dialog.Title>Create New Box</Dialog.Title>
                <Dialog.Description>
                    Update your existing project. Add boxes with items for easy
                    organization.
                </Dialog.Description>
            </Dialog.Header>
            <div>
                <CreateBoxForm data={data.form} />
            </div>
        </Dialog.Content>
    </Dialog.Portal>
</Dialog.Root>

<Sheet.Root bind:open onOpenChange={(isOpen) => !isOpen && closeForm()}>
    <Sheet.Content
        side="bottom"
        class="md:hidden  max-h-[90vh]  overflow-y-auto"
    >
        <Sheet.Header class="mb-4">
            <Sheet.Title>Create New Box</Sheet.Title>
            <Sheet.Description class="text-xs">
                Update your existing project. Add boxes with items for easy
                organization.
            </Sheet.Description>
        </Sheet.Header>
        <CreateBoxForm data={data.form} />
    </Sheet.Content>
</Sheet.Root>
