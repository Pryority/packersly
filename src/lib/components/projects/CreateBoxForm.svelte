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
        type SuperValidated,
        type SuperForm,
        superForm,
    } from "sveltekit-superforms";
    import { zodClient } from "sveltekit-superforms/adapters";
    import Trash from "lucide-svelte/icons/trash";
    import AlertCircle from "lucide-svelte/icons/alert-circle";
    import { Separator } from "@components/ui/separator";
    import boxSchema from "@routes/settings/zod/boxSchema";
    import type { BoxSchema } from "@routes/settings/zod/boxSchema";
    import type { ActionResult } from "@sveltejs/kit";

    const { data }: { data: SuperValidated<Infer<BoxSchema>> } = $props();

    let submitting = $state(false);
    let errorDialogOpen = $state(false);

    const form = superForm(data, {
        validators: zodClient(boxSchema),
        dataType: "json",
        taintedMessage: null,
        onSubmit: ({ cancel }) => {
            submitting = true;
            return async ({ result }: { result: ActionResult }) => {
                submitting = false;
                if (result.type === "error") {
                    cancel();
                }
                // Don't handle redirect here - let SvelteKit handle it
            };
        },
        onError: () => {
            submitting = false;
        },
    });
    const { form: formData, enhance, errors } = form;

    function addItem() {
        formData.update(($formData) => ({
            ...$formData,
            items: [...($formData.items || []), { name: "", quantity: 1 }],
        }));
    }

    function removeItem(index: number) {
        formData.update(($formData) => ({
            ...$formData,
            items: $formData.items?.filter((_, i) => i !== index),
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
                        `Room ${parseInt(index) + 1} ${subField}: ${fieldErrors[0]}`,
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
        if ($formData.items?.length === 0) {
            formData.update(($formData) => ({
                ...$formData,
                items: [{ name: "", quantity: 1 }],
            }));
        }
    });
</script>

<Card.Root>
    <form method="POST" action="?/create-box" use:enhance>
        <Card.Content class="space-y-6">
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <Label class="text-lg">Items</Label>
                    <Button type="button" variant="outline" on:click={addItem}>
                        Add Item
                    </Button>
                </div>

                {#if $formData.items}
                    {#each $formData.items as item, i}
                        <div class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <!-- Item Name -->
                                <Form.Field
                                    {form}
                                    name={`rooms.${i}.name` as FormPath<
                                        Infer<typeof boxSchema>
                                    >}
                                    class="md:col-span-8"
                                >
                                    <Form.Control let:attrs>
                                        <div class="space-y-2">
                                            <Form.Label
                                                >Item {i + 1} Name</Form.Label
                                            >
                                            <Input
                                                bind:value={$formData.items[i]
                                                    .name}
                                                placeholder="Item name"
                                                {...attrs}
                                            />
                                            <Form.FieldErrors
                                                class="hidden md:block"
                                            />
                                        </div>
                                    </Form.Control>
                                </Form.Field>

                                <!-- Quantity -->
                                <Form.Field
                                    {form}
                                    name={`items.${i}.quantity` as FormPath<
                                        Infer<typeof boxSchema>
                                    >}
                                    class="md:col-span-4"
                                >
                                    <Form.Control let:attrs>
                                        <div class="space-y-2">
                                            <Form.Label>Quantity</Form.Label>
                                            <Input
                                                type="number"
                                                bind:value={$formData.items[i]
                                                    .quantity}
                                                {...attrs}
                                                placeholder="Quantity"
                                                min="1"
                                            />
                                            <Form.FieldErrors
                                                class="hidden md:block"
                                            />
                                        </div>
                                    </Form.Control>
                                </Form.Field>
                            </div>

                            <!-- Delete Button -->
                            <div class="flex justify-end">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    on:click={() => removeItem(i)}
                                    disabled={$formData.items.length === 1}
                                    class="w-full md:w-auto"
                                >
                                    <Trash class="h-4 w-4 mr-2" />
                                    Delete Item {i + 1}
                                </Button>
                            </div>

                            {#if i < $formData.items.length - 1}
                                <Separator class="my-6" />
                            {/if}
                        </div>
                    {/each}
                {/if}
            </div>
        </Card.Content>

        <Card.Footer
            class="flex flex-col sm:flex-row justify-between gap-4 mt-6"
        >
            <p class="text-sm text-muted-foreground order-2 sm:order-1">
                {$formData.items?.length || 0} item{$formData.items?.length ===
                1
                    ? ""
                    : "s"} in box
            </p>
            <Button
                type="submit"
                class="w-full sm:w-auto order-1 sm:order-2"
                disabled={submitting || !$formData.items?.length}
            >
                {submitting ? "Creating..." : "Create Box"}
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
