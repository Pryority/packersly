<!-- src/lib/components/projects/CreateProjectForm.svelte -->
<script lang="ts">
    import * as Card from "@components/ui/card";
    import * as Form from "@components/ui/form";
    import { Button } from "@components/ui/button";
    import { Input } from "@components/ui/input";
    import type { ActionResult, SubmitFunction } from "@sveltejs/kit";
    import { enhance } from "$app/forms";
    import { z } from "zod";
    import {
        type SuperValidated,
        type Infer,
        superForm,
    } from "sveltekit-superforms";
    import { zodClient } from "sveltekit-superforms/adapters";
    import Label from "@components/ui/label/label.svelte";

    const projectSchema = z.object({
        name: z
            .string()
            .min(3, "Project name must be at least 2 characters")
            .max(50, "Project name must be less than 50 characters"),
        handle: z
            .string()
            .min(3, "Project handle must be at least 2 characters")
            .max(50, "Project handle must be less than 50 characters"),
        fromAddress: z
            .string()
            .min(5, "Current address is too short")
            .max(100, "Current address is too long"),
        toAddress: z
            .string()
            .min(5, "New address is too short")
            .max(100, "New address is too long"),
        rooms: z
            .array(
                z.object({
                    name: z
                        .string()
                        .min(3, "Room name must be at least 2 characters")
                        .max(50, "Room name must be less than 50 characters"),
                    colorCode: z
                        .string()
                        .regex(
                            /^#[0-9A-Fa-f]{6}$/,
                            "Must be a valid hex color code",
                        ),
                }),
            )
            .min(1, "At least one room is required")
            .max(20, "Maximum 20 rooms allowed"),
    });

    type ProjectSchema = z.infer<typeof projectSchema>;

    const { onSuccess, initialData, onFormChange } = $props<{
        onSuccess: () => void;
        initialData: ProjectSchema;
        onFormChange: (data: ProjectSchema) => void;
    }>();

    const form = superForm(initialData, {
        validators: zodClient(projectSchema),
        dataType: "json", // Add this to handle nested data like "rooms"
    });

    let formData = $state<ProjectSchema>(initialData);

    // Update parent component whenever form data changes
    $effect(() => {
        onFormChange(formData);
    });

    let errors = $state<Record<string, string>>({});
    let fieldErrors = $state<Record<string, string>>({});

    function addRoom() {
        formData.rooms = [
            ...formData.rooms,
            { name: "", colorCode: "#000000" },
        ];
    }

    function validateForm() {
        try {
            projectSchema.parse(formData);
            return true;
        } catch (error: any) {
            if (error.errors) {
                error.errors.forEach((err: any) => {
                    fieldErrors[err.path.join(".")] = err.message;
                });
            }
            return false;
        }
    }

    const handleSubmit: SubmitFunction = ({ cancel }) => {
        return async ({ result }) => {
            // Validate the form before processing submission
            if (!validateForm()) {
                cancel();
                return;
            }

            // Handle success and failure outcomes
            if (result.type === "success") {
                onSuccess();
            } else if (result.type === "failure") {
                errors = result.data?.errors || {};
            }
        };
    };
</script>

<Card.Root>
    <form method="POST" action="?/create-project" use:enhance={handleSubmit}>
        <input type="hidden" name="formData" value={JSON.stringify(formData)} />
        <Card.Content class="space-y-4">
            <Form.Field {form} name="name">
                <Form.Control let:attrs>
                    <Form.Label>Project Name</Form.Label>
                    <Input bind:value={formData.name} {...attrs} />
                </Form.Control>
                <Form.Description
                    >Give your moving project a memorable name</Form.Description
                >
                <Form.FieldErrors />
            </Form.Field>

            <Form.Field {form} name="fromAddress">
                <Form.Control let:attrs>
                    <Form.Label>Current Address</Form.Label>
                    <Input bind:value={formData.fromAddress} {...attrs} />
                </Form.Control>
                <Form.Description
                    >The address you're moving from</Form.Description
                >
                <Form.FieldErrors />
            </Form.Field>

            <Form.Field {form} name="toAddress">
                <Form.Control let:attrs>
                    <Form.Label>New Address</Form.Label>
                    <Input bind:value={formData.toAddress} {...attrs} />
                </Form.Control>
                <Form.Description>The address you're moving to</Form.Description
                >
                <Form.FieldErrors />
            </Form.Field>

            <div class="space-y-2">
                <Label>Rooms</Label>
                {#each formData.rooms as room, i}
                    <Form.Field {form} name={`rooms.${i}.name`}>
                        <Form.Control let:attrs>
                            <div class="flex gap-2 items-center">
                                <div class="w-full">
                                    <Form.Label>Room {i + 1} Name</Form.Label>
                                    <Input
                                        bind:value={formData.rooms[i].name}
                                        placeholder="Room name"
                                        {...attrs}
                                        aria-invalid={fieldErrors[
                                            `rooms.${i}.name`
                                        ]
                                            ? "true"
                                            : undefined}
                                    />
                                    <Form.FieldErrors />
                                </div>
                                <div>
                                    <Form.Label>Color</Form.Label>
                                    <Input
                                        type="color"
                                        bind:value={formData.rooms[i].colorCode}
                                        class="w-12 h-9 p-0"
                                        aria-invalid={fieldErrors[
                                            `rooms.${i}.colorCode`
                                        ]
                                            ? "true"
                                            : undefined}
                                    />
                                    <Form.FieldErrors />
                                </div>
                            </div>
                        </Form.Control>
                    </Form.Field>
                {/each}
                <Button type="button" variant="outline" on:click={addRoom}>
                    Add Room
                </Button>
            </div>
        </Card.Content>

        <Card.Footer>
            <Button type="submit">Create Project</Button>
        </Card.Footer>
    </form>
</Card.Root>
