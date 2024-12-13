<!-- src/lib/components/projects/CreateProjectForm.svelte -->
<script lang="ts">
    import * as Card from "@components/ui/card";
    import * as Form from "@components/ui/form";
    import * as Dialog from "@components/ui/dialog";
    import { Button } from "@components/ui/button";
    import { Input } from "@components/ui/input";
    import Label from "@components/ui/label/label.svelte";
    import { projectSchema } from "@routes/settings/zod";
    import {
        type FormPath,
        type Infer,
        type SuperForm,
    } from "sveltekit-superforms";
    import Trash from "lucide-svelte/icons/trash";
    import { Separator } from "@components/ui/separator";
    import PlusCircle from "lucide-svelte/icons/plus-circle";

    let {
        form,
        submitting,
        // errorDialogOpen,
    }: {
        form: SuperForm<Infer<typeof projectSchema>>;
        submitting: boolean;
        // errorDialogOpen: boolean;
    } = $props();
    const { form: formData, enhance, errors } = form;

    function addRoom() {
        formData.update(($formData) => ({
            ...$formData,
            rooms: [...$formData.rooms, { name: "", colorCode: "#000000" }],
        }));
    }

    function removeRoom(index: number) {
        formData.update(($formData) => ({
            ...$formData,
            rooms: $formData.rooms.filter((_, i) => i !== index),
        }));
    }

    $effect(() => {
        if ($formData.rooms.length === 0) {
            formData.update(($formData) => ({
                ...$formData,
                rooms: [{ name: "", colorCode: "#000000" }],
            }));
        }
    });
</script>

<Card.Root>
    <form method="POST" action="?/create-project" use:enhance>
        <Card.Content class="space-y-4">
            <Form.Field {form} name="name">
                <Form.Control let:attrs>
                    <Form.Label>Project Name</Form.Label>
                    <Input
                        bind:value={$formData.name}
                        {...attrs}
                        placeholder="e.g. New Apartment"
                    />
                </Form.Control>
                <Form.Description
                    ><span class="hidden md:block">
                        Give your moving project a memorable name
                    </span>
                    <span class="block md:hidden">
                        Give your moving project a name
                    </span></Form.Description
                >
                <Form.FieldErrors class="max-md:text-xs" />
            </Form.Field>

            <Form.Field {form} name="fromAddress">
                <Form.Control let:attrs>
                    <Form.Label>Current Address</Form.Label>
                    <Input
                        bind:value={$formData.fromAddress}
                        {...attrs}
                        placeholder="e.g. 20 Bremner Blvd."
                    />
                </Form.Control>
                <Form.Description
                    >The address you're moving from</Form.Description
                >
                <Form.FieldErrors class="max-md:text-xs" />
            </Form.Field>

            <Form.Field {form} name="toAddress">
                <Form.Control let:attrs>
                    <Form.Label>New Address</Form.Label>
                    <Input
                        bind:value={$formData.toAddress}
                        {...attrs}
                        placeholder="e.g. 123 Main Street"
                    />
                </Form.Control>
                <Form.Description>The address you're moving to</Form.Description
                >
                <Form.FieldErrors class="max-md:text-xs" />
            </Form.Field>

            <Separator />
            <div class="flex flex-col items-center space-y-2 w-full">
                <Label class="w-full text-lg">Rooms</Label>
                {#each $formData.rooms as room, i}
                    <div
                        class="flex flex-col md:flex-row md:items-end w-full md:space-x-4 space-y-4 md:space-y-0"
                    >
                        <Form.Field
                            {form}
                            name={`rooms.${i}.name` as FormPath<
                                Infer<typeof projectSchema>
                            >}
                            class="flex-1"
                        >
                            <Form.Control let:attrs>
                                <div class="w-full">
                                    <Form.Label>Room {i + 1} Name</Form.Label>
                                    <Input
                                        bind:value={$formData.rooms[i].name}
                                        placeholder="e.g. Kitchen"
                                        {...attrs}
                                    />
                                    <Form.FieldErrors class="max-md:text-xs" />
                                    <Form.Description>
                                        Give your room a name
                                    </Form.Description>
                                </div>
                            </Form.Control>
                        </Form.Field>

                        <Form.Field
                            {form}
                            name={`rooms.${i}.colorCode` as FormPath<
                                Infer<typeof projectSchema>
                            >}
                            class="md:w-40"
                        >
                            <Form.Control let:attrs>
                                <div>
                                    <Form.Label
                                        class="max-md:text-xs whitespace-nowrap"
                                        >Room Color</Form.Label
                                    >
                                    <Input
                                        type="color"
                                        bind:value={$formData.rooms[i]
                                            .colorCode}
                                        class="w-full h-9 md:h-10 p-0 cursor-pointer"
                                        {...attrs}
                                    />
                                    <Form.FieldErrors class="max-md:text-xs" />
                                    <Form.Description>
                                        Pick a room color
                                    </Form.Description>
                                </div>
                            </Form.Control>
                        </Form.Field>

                        <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            on:click={() => removeRoom(i)}
                            disabled={$formData.rooms.length === 1}
                            class="w-full md:w-10 h-10 flex items-center justify-center md:self-center"
                        >
                            <span class="md:hidden">Delete Room {i + 1}</span>
                            <Trash class="h-4 w-4 md:h-5 md:w-5" />
                        </Button>
                    </div>
                    <Separator class="my-4" />
                {/each}
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    class="flex items-center gap-2"
                    on:click={addRoom}
                >
                    Add Room
                    <PlusCircle size={16} />
                </Button>
            </div>
        </Card.Content>

        <Card.Footer class="justify-end">
            <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Project"}
            </Button>
        </Card.Footer>
    </form>
</Card.Root>

<!-- <Dialog.Root bind:open={errorDialogOpen}>
    <Dialog.Portal>
        <Dialog.Overlay class="bg-background/80 backdrop-blur-sm" />
        <Dialog.Content class="sm:max-w-[425px]">
            <Dialog.Header>
                <Dialog.Title class="flex items-center gap-2">
                    <AlertCircle class="h-5 w-5 text-destructive" />
                    Form Errors
                </Dialog.Title>
            </Dialog.Header>
            <div class="py-6">
                <ul class="list-disc pl-6 space-y-2">
                    {#each getFormattedErrors() as error}
                        <li class="text-sm text-destructive">{error}</li>
                    {/each}
                </ul>
            </div>
            <Dialog.Footer>
                <Button
                    variant="outline"
                    on:click={() => (errorDialogOpen = false)}
                >
                    Close
                </Button>
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Portal>
</Dialog.Root> -->
