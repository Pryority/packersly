<!-- src/lib/components/projects/CreateProjectForm.svelte -->
<script lang="ts">
    import * as Card from "@components/ui/card";
    import * as Form from "@components/ui/form";
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

    const {
        form,
        submitting,
    }: { form: SuperForm<Infer<typeof projectSchema>>; submitting: boolean } =
        $props();
    const { form: formData, enhance } = form;

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
                        placeholder="Enter a name for your move"
                    />
                </Form.Control>
                <Form.Description
                    >Give your moving project a memorable name</Form.Description
                >
                <Form.FieldErrors />
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
                <Form.FieldErrors />
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
                <Form.FieldErrors />
            </Form.Field>

            <div class="space-y-2">
                <Label>Rooms</Label>
                {#each $formData.rooms as room, i}
                    <div class="flex gap-2 items-center">
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
                                    <Form.FieldErrors />
                                </div>
                            </Form.Control>
                        </Form.Field>

                        <Form.Field
                            {form}
                            name={`rooms.${i}.colorCode` as FormPath<
                                Infer<typeof projectSchema>
                            >}
                        >
                            <Form.Control let:attrs>
                                <div>
                                    <Form.Label>Color</Form.Label>
                                    <Input
                                        type="color"
                                        bind:value={$formData.rooms[i]
                                            .colorCode}
                                        class="w-12 h-9 p-0 cursor-pointer"
                                        {...attrs}
                                    />
                                    <Form.FieldErrors />
                                </div>
                            </Form.Control>
                        </Form.Field>

                        <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            class="mt-6"
                            on:click={() => removeRoom(i)}
                            disabled={$formData.rooms.length === 1}
                        >
                            <Trash />
                        </Button>
                    </div>
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
