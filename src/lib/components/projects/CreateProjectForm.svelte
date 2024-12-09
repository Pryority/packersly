<!-- src/lib/components/projects/CreateProjectForm.svelte -->
<script lang="ts">
    import { enhance } from "$app/forms";
    import * as Card from "@components/ui/card";
    import { Button } from "@components/ui/button";
    import { Input } from "@components/ui/input";
    import { goto } from "$app/navigation";
    import type { ActionResult } from "@sveltejs/kit";

    const { onSuccess, initialData, onFormChange } = $props<{
        onSuccess: () => void;
        initialData: {
            name: string;
            fromAddress: string;
            toAddress: string;
            rooms: Array<{ name: string; colorCode: string }>;
        };
        onFormChange: (data: typeof initialData) => void;
    }>();

    let formData = $state(initialData);

    function addRoom() {
        formData = {
            ...formData,
            rooms: [...formData.rooms, { name: "", colorCode: "#000000" }],
        };
        onFormChange(formData);
    }

    function updateField(field: keyof typeof formData, value: string) {
        formData = { ...formData, [field]: value };
        onFormChange(formData);
    }

    function updateRoom(
        index: number,
        field: keyof (typeof formData.rooms)[0],
        value: string,
    ) {
        const newRooms = [...formData.rooms];
        newRooms[index] = { ...newRooms[index], [field]: value };
        formData = { ...formData, rooms: newRooms };
        onFormChange(formData);
    }

    function handleSubmit() {
        return async ({ result }: { result: ActionResult }) => {
            if (result.type === "redirect") {
                onSuccess();
                await goto(result.location);
            }
        };
    }
</script>

<Card.Root>
    <form method="POST" action="?/create-project" use:enhance={handleSubmit}>
        <Card.Content class="space-y-4">
            <div class="grid gap-2">
                <label for="name">Project Name</label>
                <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    on:input={(e) => updateField("name", e.currentTarget.value)}
                />
            </div>

            <div class="grid gap-2">
                <label for="fromAddress">Current Address</label>
                <Input
                    id="fromAddress"
                    name="fromAddress"
                    value={formData.fromAddress}
                    on:input={(e) =>
                        updateField("fromAddress", e.currentTarget.value)}
                />
            </div>

            <div class="grid gap-2">
                <label for="toAddress">New Address</label>
                <Input
                    id="toAddress"
                    name="toAddress"
                    value={formData.toAddress}
                    on:input={(e) =>
                        updateField("toAddress", e.currentTarget.value)}
                />
            </div>

            <div class="grid gap-2">
                <label for="rooms">Rooms</label>
                {#each formData.rooms as room, i}
                    <div class="flex gap-2">
                        <Input
                            name="rooms[]"
                            value={room.name}
                            on:input={(e) =>
                                updateRoom(i, "name", e.currentTarget.value)}
                            placeholder="Room name"
                        />
                        <Input
                            type="color"
                            name="roomColors[]"
                            value={room.colorCode}
                            on:input={(e) =>
                                updateRoom(
                                    i,
                                    "colorCode",
                                    e.currentTarget.value,
                                )}
                            class="w-12 h-9 p-0"
                        />
                    </div>
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
