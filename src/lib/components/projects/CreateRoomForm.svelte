<!-- src/lib/components/projects/CreateRoomForm.svelte -->
<script lang="ts">
    import * as Card from "@components/ui/card";
    import * as Form from "@components/ui/form";
    import * as Dialog from "@components/ui/dialog";
    import { Button } from "@components/ui/button";
    import { Input } from "@components/ui/input";
    import AlertCircle from "lucide-svelte/icons/alert-circle";

    import { type Infer, type SuperForm } from "sveltekit-superforms";
    import type { RoomSchema } from "@routes/settings/zod/roomSchema";

    const {
        form,
        submitting,
    }: { form: SuperForm<Infer<RoomSchema>>; submitting: boolean } = $props();

    const { form: formData, enhance, errors } = form;

    // let errorDialogOpen = $state(false);

    // Function to format field errors for display
    // function getFormattedErrors() {
    //     const errList = [];
    //     for (const [field, fieldErrors] of Object.entries($errors)) {
    //         if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
    //             // Handle nested room errors
    //             if (field.startsWith("rooms.")) {
    //                 const [_, index, subField] = field.split(".");
    //                 errList.push(
    //                     `Room ${parseInt(index) + 1} ${subField}: ${fieldErrors[0]}`,
    //                 );
    //             } else {
    //                 errList.push(`${fieldErrors[0]}`);
    //             }
    //         }
    //     }
    //     return errList;
    // }

    // Show error dialog when there are errors (on mobile/tablet only)
    // $effect(() => {
    //     if (Object.keys($errors).length > 0 && window.innerWidth < 768) {
    //         errorDialogOpen = true;
    //     }
    // });
</script>

<Card.Root>
    <form method="POST" action="?/create-room" use:enhance>
        <Card.Content class="space-y-4">
            <Form.Field {form} name="name">
                <Form.Control let:attrs>
                    <Form.Label>Room Name</Form.Label>
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
                <Form.FieldErrors class="max-md:text-xs" />
            </Form.Field>

            <Form.Field {form} name="colorCode">
                <Form.Control let:attrs>
                    <div class="flex flex-col gap-1">
                        <Form.Label class="max-md:text-xs whitespace-nowrap"
                            >Room Color</Form.Label
                        >
                        <Input
                            type="color"
                            bind:value={$formData.colorCode}
                            class="w-full h-9 p-0 cursor-pointer"
                            {...attrs}
                        />
                        <Form.FieldErrors class="max-md:text-xs" />
                        <Form.Description>
                            Organize your room with a color
                        </Form.Description>
                    </div>
                </Form.Control>
            </Form.Field>
        </Card.Content>

        <Card.Footer class="justify-center">
            <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Room"}
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
