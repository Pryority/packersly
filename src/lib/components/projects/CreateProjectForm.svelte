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
    import AlertCircle from "lucide-svelte/icons/alert-circle";
    import { Separator } from "@components/ui/separator";

    const {
        form,
        submitting,
    }: { form: SuperForm<Infer<typeof projectSchema>>; submitting: boolean } =
        $props();
    const { form: formData, enhance, errors } = form;

    let errorDialogOpen = $state(false);
    // let wasSubmitted = $state(false);

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

    // Function to format field errors for display
    function getFormattedErrors() {
        const errList = [];
        for (const [field, fieldErrors] of Object.entries($errors)) {
            if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
                // Handle nested room errors
                if (field.startsWith("rooms.")) {
                    const [_, index, subField] = field.split(".");
                    errList.push(
                        `Room ${Number.parseInt(index) + 1} ${subField}: ${fieldErrors[0]}`,
                    );
                } else {
                    errList.push(`${fieldErrors[0]}`);
                }
            }
        }
        return errList;
    }

    // Show error dialog when there are errors (on mobile/tablet only)
    $effect(() => {
        if (Object.keys($errors).length > 0 && window.innerWidth < 768) {
            errorDialogOpen = true;
        }
    });

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
                        placeholder="Enter a name for your move"
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
                <Form.FieldErrors class="hidden md:block" />
            </Form.Field>

            <Form.Field {form} name="fromAddress">
                <Form.Control let:attrs>
                    <Form.Label>Current Address</Form.Label>
                    <Input
                        bind:value={$formData.fromAddress}
                        {...attrs}
                        placeholder="Enter where you are moving from"
                    />
                </Form.Control>
                <Form.Description
                    >The address you're moving from</Form.Description
                >
                <Form.FieldErrors class="hidden md:block" />
            </Form.Field>

            <Form.Field {form} name="toAddress">
                <Form.Control let:attrs>
                    <Form.Label>New Address</Form.Label>
                    <Input
                        bind:value={$formData.toAddress}
                        {...attrs}
                        placeholder="Enter where you are moving to"
                    />
                </Form.Control>
                <Form.Description>The address you're moving to</Form.Description
                >
                <Form.FieldErrors class="hidden md:block" />
            </Form.Field>

            <div class="space-y-2">
                <Label>Rooms</Label>
                {#each $formData.rooms as room, i}
                    <div
                        class="flex flex-col md:flex-row gap-1 md:gap-2 items-center"
                    >
                        <Form.Field
                            {form}
                            name={`rooms.${i}.name` as FormPath<
                                Infer<typeof projectSchema>
                            >}
                        >
                            <Form.Control let:attrs>
                                <div class="w-full">
                                    <Form.Label>Room {i + 1} Name</Form.Label>
                                    <Input
                                        bind:value={$formData.rooms[i].name}
                                        placeholder="Room name"
                                        {...attrs}
                                    />
                                    <Form.FieldErrors class="hidden md:block" />
                                </div>
                            </Form.Control>
                        </Form.Field>

                        <div
                            class="flex items-center gap-1 justify-between w-full"
                        >
                            <Form.Field
                                {form}
                                name={`rooms.${i}.colorCode` as FormPath<
                                    Infer<typeof projectSchema>
                                >}
                            >
                                <Form.Control let:attrs>
                                    <div class="flex items-center gap-1">
                                        <Form.Label
                                            class="text-xs whitespace-nowrap"
                                            >Room {i + 1} Color</Form.Label
                                        >
                                        <Input
                                            type="color"
                                            bind:value={$formData.rooms[i]
                                                .colorCode}
                                            class="w-20 h-9 p-0 cursor-pointer"
                                            {...attrs}
                                        />
                                        <Form.FieldErrors
                                            class="hidden md:block"
                                        />
                                    </div>
                                </Form.Control>
                            </Form.Field>

                            <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                class="md:mt-6"
                                on:click={() => removeRoom(i)}
                                disabled={$formData.rooms.length === 1}
                            >
                                <Trash />
                            </Button>
                        </div>
                    </div>
                    <Separator />
                {/each}
                <Button type="button" variant="outline" on:click={addRoom}>
                    Add Room
                </Button>
            </div>
        </Card.Content>

        <Card.Footer>
            <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Project"}
            </Button>
        </Card.Footer>
    </form>
</Card.Root>

<Dialog.Root bind:open={errorDialogOpen}>
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
</Dialog.Root>
